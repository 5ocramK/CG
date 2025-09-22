// Vertex shader (agora com uniform para point size)
const vertexShaderSource = `
  attribute vec2 a_position;
  uniform float u_pointSize;
  void main() {
    gl_Position = vec4(a_position, 0, 1);
    gl_PointSize = u_pointSize;
  }
`;

// Fragment shader
const fragmentShaderSource = `
  precision mediump float;
  uniform vec3 u_color;
  void main() {
    gl_FragColor = vec4(u_color, 1.0);
  }
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Erro compilando shader:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vShader, fShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Erro linkando programa:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function main() {
  const canvas = document.getElementById("glCanvas");
  const modeDisplay = document.getElementById("modeDisplay");
  const gl = canvas.getContext("webgl");
  if (!gl) {
    console.error("WebGL não suportado");
    return;
  }

  const vShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = createProgram(gl, vShader, fShader);
  gl.useProgram(program);

  const positionLocation = gl.getAttribLocation(program, "a_position");
  const colorUniformLocation = gl.getUniformLocation(program, "u_color");
  const pointSizeLocation = gl.getUniformLocation(program, "u_pointSize");

  // Paleta 0-9
  const palette = [
    [1.0, 0.0, 0.0], // 0 vermelho
    [0.0, 1.0, 0.0], // 1 verde
    [0.0, 0.0, 1.0], // 2 azul
    [1.0, 1.0, 0.0], // 3 amarelo
    [1.0, 0.0, 1.0], // 4 magenta
    [0.0, 1.0, 1.0], // 5 ciano
    [0.5, 0.5, 0.5], // 6 cinza
    [1.0, 0.5, 0.0], // 7 laranja
    [0.5, 0.0, 0.5], // 8 roxo
    [0.0, 0.0, 0.0], // 9 preto
  ];

  // estado inicial
  let colorVector = palette[2]; // azul por padrão (índice 2)
  let pointSize = 5.0;          // espessura (gl_PointSize)
  let mode = "line";            // "line", "triangle", "color", "thickness"
  let clickPoints = [];
  let lastShape = null;         // guarda última figura desenhada para redesenhar (ex.: {type:'line', points:[p1,p2]})

  // aplica cor e pointSize iniciais no shader
  gl.uniform3fv(colorUniformLocation, colorVector);
  gl.uniform1f(pointSizeLocation, pointSize);

  // função para mostrar modo atual na UI
  function setMode(newMode) {
    mode = newMode;
    const nice = {
      line: "Linha (r)",
      triangle: "Triângulo (t)",
      color: "Selecionar Cor (k -> 0..9)",
      thickness: "Selecionar Espessura (e -> 1..9)"
    }[newMode] || newMode;
    modeDisplay.textContent = "Modo atual: " + nice;
    // reset clicks quando mudar modo
    clickPoints = [];
  }

  // converte coordenadas de pixel para NDC
  function toNDC(x, y) {
    const ndcX = (2 * x) / canvas.width - 1;
    const ndcY = 1 - (2 * y) / canvas.height;
    return [ndcX, ndcY];
  }

  // Bresenham (reta) usa coordenadas de pixel
  function bresenhamLine(x0, y0, x1, y1) {
    // garante inteiros
    x0 = Math.round(x0); y0 = Math.round(y0);
    x1 = Math.round(x1); y1 = Math.round(y1);

    const points = [];
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1;
    let sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      points.push(toNDC(x0, y0));
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
    return points;
  }

  // função que desenha uma lista de pontos NDC (cada item = [x,y])
  function drawPoints(points) {
    if (!points.length) return;
    const vertices = new Float32Array(points.flat());
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, points.length);
  }

  // desenha linha (e atualiza lastShape)
  function drawLineBresenham(p1, p2) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    const pts = bresenhamLine(p1[0], p1[1], p2[0], p2[1]);
    drawPoints(pts);
    lastShape = { type: "line", points: [p1, p2] };
  }

  // desenha triângulo (3 arestas) e grava lastShape
  function drawTriangleBresenham(p1, p2, p3) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    let pts = [];
    pts.push(...bresenhamLine(p1[0], p1[1], p2[0], p2[1]));
    pts.push(...bresenhamLine(p2[0], p2[1], p3[0], p3[1]));
    pts.push(...bresenhamLine(p3[0], p3[1], p1[0], p1[1]));
    drawPoints(pts);
    lastShape = { type: "triangle", points: [p1, p2, p3] };
  }

  // redesenha a última forma (após mudança de cor/espessura)
  function redrawLastShape() {
    if (!lastShape) return;
    if (lastShape.type === "line") {
      drawLineBresenham(lastShape.points[0], lastShape.points[1]);
    } else if (lastShape.type === "triangle") {
      const [a, b, c] = lastShape.points;
      drawTriangleBresenham(a, b, c);
    }
  }

  // set color index 0-9 e redesenha
  function setColor(index) {
    if (index < 0 || index > 9) return;
    colorVector = palette[index];
    gl.uniform3fv(colorUniformLocation, colorVector);
    redrawLastShape();
  }

  // set thickness (pointSize) e redesenha
  function setThickness(value) {
    // clamp razoável (1..100)
    const v = Math.max(1, Math.min(100, value));
    pointSize = v;
    gl.uniform1f(pointSizeLocation, pointSize);
    redrawLastShape();
  }

  // eventos mouse
  canvas.addEventListener("mousedown", (ev) => {
    const x = ev.offsetX;
    const y = ev.offsetY;

    if (mode === "line") {
      clickPoints.push([x, y]);
      if (clickPoints.length === 2) {
        drawLineBresenham(clickPoints[0], clickPoints[1]);
        clickPoints = [];
      }
    } else if (mode === "triangle") {
      clickPoints.push([x, y]);
      if (clickPoints.length === 3) {
        drawTriangleBresenham(clickPoints[0], clickPoints[1], clickPoints[2]);
        clickPoints = [];
      }
    }
  });

  // teclado: alterar modo ou aplicar cor/espessura quando no modo apropriado
  document.body.addEventListener("keydown", (ev) => {
    const k = ev.key;
    if (k === "r" || k === "R") {
      setMode("line");
    } else if (k === "t" || k === "T") {
      setMode("triangle");
    } else if (k === "k" || k === "K") {
      setMode("color");
    } else if (k === "e" || k === "E") {
      setMode("thickness");
    } else if (mode === "color" && k >= "0" && k <= "9") {
      setColor(parseInt(k));
    } else if (mode === "thickness" && k >= "1" && k <= "9") {
      // utiliza 1..9 como espessuras pequenas; aqui multiplicamos pra ficar perceptível
      // você pode ajustar o fator multiplicador se quiser mais/menos grosso
      const val = parseInt(k); // 1..9
      setThickness(val * 2);   // multiplica por 2 para dar mais variação
    }
  });

  // init: fundo e linha inicial (0,0)-(0,0) azul
  gl.clearColor(1, 1, 1, 1); // fundo branco
  gl.clear(gl.COLOR_BUFFER_BIT);
  setMode("line");
  // definimos uniformes iniciais (já setados acima) e desenhamos a linha inicial
  drawLineBresenham([0, 0], [0, 0]);
}

main();
