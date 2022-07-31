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

    // Thicc lines buffers
    var thicc = 0.1;
    let thicc_buffer = [
        -0.5 + thicc, 0.5 + thicc, 0.0,   -0.5 - thicc, 0.5 - thicc, 0.0,
        0.5 + thicc, 0.5 + thicc, 0.0,    0.5 - thicc, 0.5 - thicc, 0.0,
        -0.5 + thicc, -0.5 + thicc, 0.0,  -0.5 - thicc, -0.5 - thicc, 0.0,
        0.5 + thicc, -0.5 + thicc, 0.0,   0.5 - thicc, -0.5 - thicc, 0.0
    ];

    let thicc_indices = [
        0, 1, 3, 4, 5, 6, 7, 8, 1, 2
    ];

    var thicc_vertex_buffer = gl.createBuffer();
    var thicc_index_buffer = gl.createBuffer();
    var thicc_vao = gl.createVertexArray();

    gl.bindVertexArray(thicc_vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, thicc_vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(thicc_buffer), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, thicc_index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(thicc_indices), gl.STATIC_DRAW);

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

   for(var i = 0; i < 3; i++) {
       glMatrix.mat4.identity(models[i]);
       if (i == 1) {
           glMatrix.mat4.translate(models[i], models[i], [0.0, 1.0 - (i * 1.0), 1.5]);
       } else {
           glMatrix.mat4.translate(models[i], models[i], [0.0, 1.0 - (i * 1.0), 0.5]);
       }

       //glMatrix.mat4.scale(models[i], models[i], [0.50, 0.50, 0.50]);
       glMatrix.mat4.rotate(models[i], models[i], 45.0 * 0.0174533, [0.0, 0.0, 1.0]);
            //glMatrix.mat4.rotate(models[i], models[i], 25.0 * 0.0174533, [0.0, 1.0, 0.0]);
            //glMatrix.mat4.rotate(models[i], models[i], 25.0 * 0.0174533, [1.0, 0.0, 0.0]);

            /*var rotation_pos = [0.0,
                                0.75 * Math.sin((new Date().getTime() / 500) + Math.pow(2.0, i) * Math.PI / 3),
                                0.75 * Math.cos((new Date().getTime() / 500) + Math.pow(2.0, i) * Math.PI / 3),
                                0.0];*/

            //glMatrix.vec4.transformMat4(rotation_pos, rotation_pos, rotation_mat);

    }


    (function render(elapsed_time) {
        // Lookup the size the browser is displaying the canvas in CSS pixels.
        const displayWidth  = screensaver_canvas.clientWidth;
        const displayHeight = screensaver_canvas.clientHeight;

        // Check if the canvas is not the same size.
        const needResize = screensaver_canvas.width  !== displayWidth ||
                           screensaver_canvas.height !== displayHeight;

        if (needResize) {
            // Make the canvas the same size
            screensaver_canvas.width  = displayWidth;
            screensaver_canvas.height = displayHeight;
        }

        gl.viewport(0, 0, screensaver_canvas.width, screensaver_canvas.height);
        // Clean prev, frame
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Animation
        var draw_calls = [
            {index : 0, depth: models[0][14], color: [0.0, 1.0, 0.0, 0.5]},
            {index : 1, depth: models[1][14], color: [1.0, 0.0, 1.0, 0.5]},
            {index : 2, depth: models[2][14], color: [0.0, 1.0, 1.0, 0.5]}
        ];

        // Order the drawcalls per depth
        draw_calls.sort(function (a,b) {
            return a.depth - b.depth;
        });


        glMatrix.mat4.perspective(proj_mat,
                                  90.0 * 0.0174533,
                                  screensaver_canvas.width / screensaver_canvas.height,
                                  0.1,
                                  1000);

        glMatrix.mat4.ortho(proj_mat,
                            -2.50, 2.50,
                            -2.50, 2.50,
                            0.1,
                            1000);


        var up = [0.0, 1.0, 0.0];
        var eye = [0.2 * Math.sin(new Date().getTime() / 500), 0.0, 4.0];
        var center = [0.0, 0.0, 0.0];

        glMatrix.mat4.lookAt(view_mat,
                             eye,
                             center,
                             up);


        glMatrix.mat4.identity(vp_mat);
        glMatrix.mat4.multiply(vp_mat, view_mat,vp_mat);
        glMatrix.mat4.multiply(vp_mat, proj_mat, vp_mat);

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

        gl.bindVertexArray(thicc_vao);
        bindMat4Uniform(gl, program, "u_model_mat", models[draw_calls[1].index]);
        bindVec4Uniform(gl, program, "u_color", [0.0, 0.0, 0.0, 1.0]);

        gl.drawElements(gl.TRIANGLE_STRIP, 10, gl.UNSIGNED_INT, thicc_index_buffer);

        requestAnimationFrame(render);
    })();
}


export { init_webgl_screensaver };
