function main() {
    const canvas = document.getElementById("meuCanvas");
    const gl = canvas.getContext("webgl");

    if (!gl) {
        alert("WebGL não suportado");
        return;
    }

    // Shaders
    const vertexShaderSource = `
        attribute vec2 a_position;
        uniform float u_angle;
        void main() {
            float cosA = cos(u_angle);
            float sinA = sin(u_angle);
            mat2 rotation = mat2(cosA, -sinA, sinA, cosA);
            vec2 rotated = rotation * a_position;
            gl_Position = vec4(rotated, 0, 1);
        }
    `;

    const fragmentShaderSource = `
        precision mediump float;
        uniform vec4 u_color;
        void main() {
            gl_FragColor = u_color;
        }
    `;

    // Funções auxiliares
    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
    }

    function createProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        return program;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const colorLocation = gl.getUniformLocation(program, "u_color");
    const angleLocation = gl.getUniformLocation(program, "u_angle");

    function drawShape(vertices, color, mode, angle) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        gl.uniform4fv(colorLocation, color);
        gl.uniform1f(angleLocation, angle);

        gl.drawArrays(mode, 0, vertices.length / 2);
    }

    function drawCircle(x, y, radius, segments, color, angle) {
        const vertices = [x, y];
        for (let i = 0; i <= segments; i++) {
            const a = (i / segments) * 2 * Math.PI;
            vertices.push(x + radius * Math.cos(a), y + radius * Math.sin(a));
        }
        drawShape(vertices, color, gl.TRIANGLE_FAN, angle);
    }

    // Animação
    let rotation = 0;

    function render() {
        gl.clearColor(1, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Haste
        drawShape([
            -0.03, -1.0,
             0.03, -1.0,
             0.03,  0.0,
            -0.03,  0.0
        ], [0.7, 0.7, 0.7, 1], gl.TRIANGLE_FAN, 0);

        // Pás do catavento
        const colors = [
            [1.0, 0.5, 0.0, 1.0], // laranja
            [0.0, 0.5, 1.0, 1.0], // azul
            [1.0, 0.5, 0.0, 1.0],
            [0.0, 0.5, 1.0, 1.0]
        ];

        const bladeSize = 0.4;

        for (let i = 0; i < 4; i++) {
            const angle = i * Math.PI / 2;

            // Retângulo da pá
            const rect = [
                0.0, 0.0,
                bladeSize * Math.cos(angle), bladeSize * Math.sin(angle),
                (bladeSize + 0.2) * Math.cos(angle + 0.2), (bladeSize + 0.2) * Math.sin(angle + 0.2),
                0.0, 0.0
            ];
            drawShape(rect, colors[i], gl.TRIANGLE_FAN, rotation);

            // Triângulo da ponta
            const tri = [
                bladeSize * Math.cos(angle), bladeSize * Math.sin(angle),
                (bladeSize + 0.2) * Math.cos(angle - 0.2), (bladeSize + 0.2) * Math.sin(angle - 0.2),
                (bladeSize + 0.2) * Math.cos(angle + 0.2), (bladeSize + 0.2) * Math.sin(angle + 0.2)
            ];
            drawShape(tri, colors[i], gl.TRIANGLES, rotation);
        }

        // Centro do catavento
        drawCircle(0, 0, 0.05, 30, [1, 1, 0, 1], rotation);

        // Ângulo muda
        rotation += 0.02;

        requestAnimationFrame(render);
    }

    render();
}

main();
