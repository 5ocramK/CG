// Vertex shader
const vertexShaderSource = `
  attribute vec2 a_position;

  void main() {
    gl_Position = vec4(a_position, 0, 1);
    gl_PointSize = 3.0;
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
    console.error('Erro compilando shader:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Erro linkando programa:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function main() {
  const canvas = document.getElementById('glCanvas');
  const gl = canvas.getContext('webgl');
  if (!gl) {
    console.error('WebGL não suportado');
    return;
  }

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = createProgram(gl, vertexShader, fragmentShader);
  gl.useProgram(program);

  const positionLocation = gl.getAttribLocation(program, 'a_position');
  const colorUniformLocation = gl.getUniformLocation(program, 'u_color');

  // Paleta de cores (0-9)
  const palette = [
    [1.0, 0.0, 0.0], // 0 - vermelho
    [0.0, 1.0, 0.0], // 1 - verde
    [0.0, 0.0, 1.0], // 2 - azul
    [1.0, 1.0, 0.0], // 3 - amarelo
    [1.0, 0.0, 1.0], // 4 - magenta
    [0.0, 1.0, 1.0], // 5 - ciano
    [0.5, 0.5, 0.5], // 6 - cinza
    [1.0, 0.5, 0.0], // 7 - laranja
    [0.5, 0.0, 0.5], // 8 - roxo
    [0.0, 0.0, 0.0], // 9 - preto
  ];

  let colorVector = [0.0, 0.0, 1.0]; // cor inicial azul
  gl.uniform3fv(colorUniformLocation, colorVector);

  let firstClick = null;
  let secondClick = null;

  // Converte pixels do canvas para NDC
  function toNDC(x, y) {
    let ndcX = (2 * x / canvas.width) - 1;
    let ndcY = 1 - (2 * y / canvas.height);
    return [ndcX, ndcY];
  }

  // Algoritmo de Bresenham para linha
  function bresenhamLine(x0, y0, x1, y1) {
    let points = [];
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1;
    let sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;

    while (true) {
      points.push(toNDC(x0, y0));
      if (x0 === x1 && y0 === y1) break;
      let e2 = 2 * err;
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

  // Desenha linha
  function drawLine(x0, y0, x1, y1) {
    gl.clear(gl.COLOR_BUFFER_BIT);

    let points = bresenhamLine(x0, y0, x1, y1);
    const vertices = new Float32Array(points.flat());

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, points.length);
  }

  // Clique do mouse
  canvas.addEventListener("mousedown", (event) => {
    if (!firstClick) {
      firstClick = [event.offsetX, event.offsetY];
    } else {
      secondClick = [event.offsetX, event.offsetY];
      drawLine(firstClick[0], firstClick[1], secondClick[0], secondClick[1]);
      firstClick = null; // reset para próxima linha
      secondClick = null;
    }
  });

  // Mudança de cor com teclas 0-9
  document.body.addEventListener("keydown", (event) => {
    if (event.key >= "0" && event.key <= "9") {
      let index = parseInt(event.key);
      colorVector = palette[index];
      gl.uniform3fv(colorUniformLocation, colorVector);
      if (firstClick && secondClick) {
        drawLine(firstClick[0], firstClick[1], secondClick[0], secondClick[1]);
      }
    }
  });

  // Fundo branco + linha inicial azul (0,0)-(0,0)
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  drawLine(0, 0, 0, 0);
}

main();