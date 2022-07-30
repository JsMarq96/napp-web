import {  createShader, bindMat4Uniform, bindVec3Uniform, bindVec4Uniform } from './shader_funcs.js'
function init_webgl_screensaver() {
    var screensaver_canvas = document.querySelector("#screensaver-canvas");

    var gl = screensaver_canvas.getContext("webgl2", {
        premultipliedAlpha: false,
        alpha: false
    });

    const vert_shader = `#version 300 es
    in vec3 a_position;

    uniform mat4 u_model_mat;
    uniform mat4 u_vp_mat;

    void main() {
        gl_Position = u_vp_mat * u_model_mat * vec4(a_position, 1.0);
    }`;

    const frag_shader = `#version 300 es
    precision highp float;

    out vec4 frag_color;

    uniform vec4 u_color;

    void main() {
        frag_color = u_color;
    }`;

    var program = createShader(gl, vert_shader, frag_shader);

    // Position buffer
    let vertex_position = [
        -0.5, 0.5, 0.0,
        0.5, 0.5, 0.0,
        -0.5, -0.5, 0.0,
        0.5, -0.5, 0.0
    ];
    // Index buffer
    let indices = [
        0, 1, 2,
        2, 1, 3
    ];

    var vertex_buffer = gl.createBuffer();
    var index_buffer = gl.createBuffer();
    var vao = gl.createVertexArray();

    gl.bindVertexArray(vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex_position), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(indices), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0,
                           3,
                           gl.FLOAT,
                           false,
                           0,
                           0);

    gl.bindVertexArray(null);

    var view_mat = glMatrix.mat4.create();
    var proj_mat = glMatrix.mat4.create();
    var vp_mat = glMatrix.mat4.create();
    var models = [
         glMatrix.mat4.create(),
         glMatrix.mat4.create(),
         glMatrix.mat4.create()
    ];

    glMatrix.mat4.identity(models[0]);
    glMatrix.mat4.identity(models[1]);
    glMatrix.mat4.identity(models[2]);

    var up = [0.0, 1.0, 0.0];
    var eye = [0.0, 0.0, 2.0];
    var center = [0.0, 0.0, 0.0];

    glMatrix.mat4.lookAt(view_mat,
                eye,
                center,
                up);


    (function render() {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        // Clean prev, frame
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Animation
        models[0][13] =  0.75 * Math.sin(new Date().getTime() / 200);
        models[0][14] =  0.75 * Math.cos(new Date().getTime() / 200);
        models[1][13] =  0.75 * Math.sin((new Date().getTime() / 200) + Math.PI / 3);
        models[1][14] =  0.75 * Math.cos((new Date().getTime() / 200) + Math.PI / 3);
        models[2][13] =  0.75 * Math.sin((new Date().getTime() / 200) + 2 * Math.PI / 3);
        models[2][14] =  0.75 * Math.cos((new Date().getTime() / 200) + 2 * Math.PI / 3);

        glMatrix.mat4.perspective(proj_mat,
                                  90.0 * 0.0174533,
                                  1,
                                  .1,
                                  100);
        glMatrix.mat4.identity(vp_mat);
        glMatrix.mat4.multiply(vp_mat, view_mat,vp_mat);
        glMatrix.mat4.multiply(vp_mat, proj_mat, vp_mat);

        var draw_calls = [
            {index : 0, depth: models[0][14], color: [0.0, 1.0, 0.0, 0.50]},
            {index : 1, depth: models[1][14], color: [1.0, 0.0, 1.0, 0.5]},
            {index : 2, depth: models[2][14], color: [0.0, 1.0, 1.0, 0.5]}
        ];

        // Order the drawcalls per depth
        draw_calls.sort(function (a,b) {
            return a.depth - b.depth;
        });

        // Enable blending
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.useProgram(program);
        gl.bindVertexArray(vao);

        // Render the quads, via the order of the drawcalls
        bindMat4Uniform(gl, program, "u_model_mat", models[draw_calls[0].index]);
        bindMat4Uniform(gl, program, "u_vp_mat", vp_mat);
        bindVec4Uniform(gl, program, "u_color", draw_calls[0].color);

        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, index_buffer);

        bindMat4Uniform(gl, program, "u_model_mat", models[draw_calls[1].index]);
        bindVec4Uniform(gl, program, "u_color", draw_calls[1].color);

        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, index_buffer);

        bindMat4Uniform(gl, program, "u_model_mat", models[draw_calls[2].index]);
        bindVec4Uniform(gl, program, "u_color", draw_calls[2].color);

        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, index_buffer);


        requestAnimationFrame(render);
    })();
}


export { init_webgl_screensaver };
