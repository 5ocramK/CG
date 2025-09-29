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

// Função para desenhar triângulo
function drawTriangle(gl, program, x1, y1, x2, y2, x3, y3, color) {
    const vertices = new Float32Array([x1, y1, x2, y2, x3, y3]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const colorLocation = gl.getUniformLocation(program, "u_color");
    gl.uniform4fv(colorLocation, color);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
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

// Função para desenhar a flor
function drawFlower(gl, program, centerX, centerY, petalCount, petalLength, petalWidth, centerRadius, petalColor, centerColor) {
    const angleStep = (2 * Math.PI) / petalCount;

    for (let i = 0; i < petalCount; i++) {
        const angle = i * angleStep;

        // Vértices do triângulo da pétala
        const x1 = centerX;
        const y1 = centerY;
        const x2 = centerX + Math.cos(angle) * petalLength - Math.sin(angle) * (petalWidth/2);
        const y2 = centerY + Math.sin(angle) * petalLength + Math.cos(angle) * (petalWidth/2);
        const x3 = centerX + Math.cos(angle) * petalLength + Math.sin(angle) * (petalWidth/2);
        const y3 = centerY + Math.sin(angle) * petalLength - Math.cos(angle) * (petalWidth/2);

        drawTriangle(gl, program, x1, y1, x2, y2, x3, y3, petalColor);

        // Pequeno círculo na ponta da pétala
        const tipX = (x2 + x3) / 2;
        const tipY = (y2 + y3) / 2;
        drawCircle(gl, program, tipX, tipY, petalWidth/2, 20, petalColor);
    }

    // Círculo central
    drawCircle(gl, program, centerX, centerY, centerRadius, 30, centerColor);
}

// Limpar tela
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

// Cores da flor
const pink = [1.0, 0.5, 0.8, 1.0];
const yellow = [1.0, 1.0, 0.0, 1.0];

// Desenhar a flor
drawFlower(gl, program,
    0.0, 0.0,       // posição central
    16,              // número de pétalas
    0.4,            // comprimento das pétalas
    0.1,            // largura das pétalas
    0.1,            // raio do círculo central
    pink,           // cor das pétalas
    yellow          // cor do centro
);

//  Animação

let time = 0; // tempo

function drawFlower(gl, program, centerX, centerY, petalCount, petalLength, petalWidth, centerRadius, petalColor, centerColor) {
    const angleStep = (2 * Math.PI) / petalCount;

    for (let i = 0; i < petalCount; i++) {
        const angle = i * angleStep;

        // Vértices do triângulo da pétala
        const x1 = centerX;
        const y1 = centerY;
        const x2 = centerX + Math.cos(angle) * petalLength - Math.sin(angle) * (petalWidth/2);
        const y2 = centerY + Math.sin(angle) * petalLength + Math.cos(angle) * (petalWidth/2);
        const x3 = centerX + Math.cos(angle) * petalLength + Math.sin(angle) * (petalWidth/2);
        const y3 = centerY + Math.sin(angle) * petalLength - Math.cos(angle) * (petalWidth/2);

        drawTriangle(gl, program, x1, y1, x2, y2, x3, y3, petalColor);

        // Círculo na ponta da pétala
        const tipX = (x2 + x3) / 2;
        const tipY = (y2 + y3) / 2;
        drawCircle(gl, program, tipX, tipY, petalWidth/2, 20, petalColor);
    }

    // Círculo central
    drawCircle(gl, program, centerX, centerY, centerRadius, 30, centerColor);
}

// Função de animação
function animate() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Faz o comprimento variar no tempo
    const dynamicLength = 0.4 + Math.sin(time) * 0.1;

    drawFlower(gl, program,
        0.0, 0.0,       // posição central
        16,              // número de pétalas
        dynamicLength,   // comprimento que pulsa
        0.1,             // largura das pétalas
        0.1,             // raio do círculo central
        pink,            // cor das pétalas
        yellow           // cor do centro
    );

    time += 0.05; // velocidade da pulsação
    requestAnimationFrame(animate);
}

// Iniciar animação
animate();
