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

function createShader1(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram1(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Error linking program:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function main() {
  const canvas = document.getElementById('glCanvas');
  const gl = canvas.getContext('webgl');
  if (!gl) {
    console.error('WebGL not supported');
    return;
  }

  const vertexShader = createShader1(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader1(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = createProgram1(gl, vertexShader, fragmentShader);
  gl.useProgram(program);

  const positionLocation = gl.getAttribLocation(program, 'a_position');
  const colorUniformLocation = gl.getUniformLocation(program, 'u_color');

  let colorVector = [0.0, 0.0, 1.0];
  gl.uniform3fv(colorUniformLocation, colorVector);

  let center = [0, 0];
  let radius = 50; // raio inicial em pixels

  // Converte coordenadas de pixel para NDC
  function toNDC(x, y) {
    let ndcX = (2 * x / canvas.width) - 1;
    let ndcY = 1 - (2 * y / canvas.height);
    return [ndcX, ndcY];
  }

  // Algoritmo de Bresenham para circunferência
  function bresenhamCircle(xc, yc, r) {
    let x = 0;
    let y = r;
    let d = 3 - 2 * r;
    let points = [];

    function plotCirclePoints(xc, yc, x, y) {
      let pts = [
        [xc + x, yc + y],
        [xc - x, yc + y],
        [xc + x, yc - y],
        [xc - x, yc - y],
        [xc + y, yc + x],
        [xc - y, yc + x],
        [xc + y, yc - x],
        [xc - y, yc - x]
      ];
      for (let p of pts) points.push(toNDC(p[0], p[1]));
    }

    while (x <= y) {
      plotCirclePoints(xc, yc, x, y);
      if (d < 0) {
        d = d + 4 * x + 6;
      } else {
        d = d + 4 * (x - y) + 10;
        y--;
      }
      x++;
    }
    return points;
  }

  // Desenha circunferência
  function drawCircle() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    let points = bresenhamCircle(center[0], center[1], radius);
    const vertices = new Float32Array(points.flat());

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.POINTS, 0, points.length);
  }

  // Clique do mouse define o centro
  canvas.addEventListener("mousedown", (event) => {
    center = [event.offsetX, event.offsetY];
    drawCircle();
  });

  // Teclas up e down ajustam o raio
  document.body.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") {
      radius += 2;
    } else if (event.key === "ArrowDown" && radius > 2) {
      radius -= 2;
    } else if (event.key === "c") {
      colorVector = [Math.random(), Math.random(), Math.random()];
      gl.uniform3fv(colorUniformLocation, colorVector);
    }
    drawCircle();
  });

  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

main();
