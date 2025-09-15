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

// Função para compilar shaders
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

// Função para desenhar retângulo
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

// Função para desenhar círculo
function drawCircle(gl, program, centerX, centerY, radius, segments, color) {
    const vertices = [];
    vertices.push(centerX, centerY);
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * 2 * Math.PI;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        vertices.push(x, y);
    }
    const verticesArray = new Float32Array(vertices);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesArray, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const colorLocation = gl.getUniformLocation(program, "u_color");
    gl.uniform4fv(colorLocation, color);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, verticesArray.length / 2);
}

// Limpar tela
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

// Cores
const azul = [0.0, 0.5, 1.0, 1.0];     // azul
const azulclaro = [0.0, 0.7, 0.9, 1.0];    // azul claro
const cinza = [0.0, 0.0, 0.0, 0.5];    // cinza
const amarelo = [1.0, 1.0, 0.0, 1.0];// amarelo

// Corpo do carro
drawRectangle(gl, program, -0.4, 0.0, 0.8, 0.2, azul);

// Cabine
drawRectangle(gl, program, -0.25, 0.2, 0.5, 0.2, azulclaro);

// Rodas
drawCircle(gl, program, -0.25, -0.2, 0.08, 30, cinza); // roda esquerda
drawCircle(gl, program, 0.25, -0.2, 0.08, 30, cinza);  // roda direita

//farol
drawCircle(gl, program, 0.4, -0.1, 0.05, 20, amarelo);