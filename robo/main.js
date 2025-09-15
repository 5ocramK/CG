// Preparação do WebGL
const canvas = document.getElementById("meuCanvas");
const gl = canvas.getContext("webgl");
if (!gl) {
    alert("WebGL não suportado!");
}

// Vertex Shader
const vertexShaderSource = `
attribute vec4 a_position;
void main() {
    gl_Position = a_position;
}
`;

// Fragment Shader com uniform de cor
const fragmentShaderSource = `
precision mediump float;
uniform vec4 u_color;
void main() {
    gl_FragColor = u_color;
}
`;

// Compilar shader
function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Erro no shader:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

// Programa
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Erro ao criar programa:", gl.getProgramInfoLog(program));
}
gl.useProgram(program);

// Função para desenhar retângulos
function drawRectangle(gl, program, x, y, width, height, color) {
    const vertices = new Float32Array([
        x, y,
        x + width, y,
        x, y - height,
        x, y - height,
        x + width, y,
        x + width, y - height,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const colorLocation = gl.getUniformLocation(program, "u_color");
    gl.uniform4fv(colorLocation, color);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}
function drawCircle(gl, program, centerX, centerY, radius, segments, color) {
    const vertices = [];

    // Centro do círculo
    vertices.push(centerX, centerY);

    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * 2 * Math.PI;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        vertices.push(x, y);
    }

    const verticesArray = new Float32Array(vertices);

    // Buffer
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesArray, gl.STATIC_DRAW);

    // Atributo de posição
    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Cor via uniform
    const colorLocation = gl.getUniformLocation(program, "u_color");
    gl.uniform4fv(colorLocation, color);

    // Desenhar usando TRIANGLE_FAN
    gl.drawArrays(gl.TRIANGLE_FAN, 0, verticesArray.length / 2);
}


// Limpar tela
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0, 0, 0, 1);
gl.clear(gl.COLOR_BUFFER_BIT);

// Cores
const red = [1.0, 0.0, 0.0, 1.0];
const blue = [0.0, 0.0, 1.0, 1.0];
const yellow = [1.0, 1.0, 0.0, 1.0];

// Desenhar robô
// Cabeça
drawRectangle(gl, program, -0.15, 0.5, 0.3, 0.2, blue);
// Corpo
drawRectangle(gl, program, -0.25, 0.3, 0.5, 0.4, red);
// Braços
drawRectangle(gl, program, -0.35, 0.3, 0.1, 0.4, yellow); // braço esquerdo
drawRectangle(gl, program, 0.25, 0.3, 0.1, 0.4, yellow);  // braço direito
// Pernas
drawRectangle(gl, program, -0.15, -0.1, 0.1, 0.3, yellow); // perna esquerda
drawRectangle(gl, program, 0.05, -0.1, 0.1, 0.3, yellow);  // perna direita

const white = [1.0, 1.0, 1.0, 1.0];
const black = [0.0, 0.0, 0.0, 1.0];

// Olho esquerdo
drawCircle(gl, program, -0.08, 0.4, 0.03, 30, white);

// Olho direito
drawCircle(gl, program, 0.08, 0.4, 0.03, 30, white);