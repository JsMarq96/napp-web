import {  createShader, bindMat4Uniform, bindVec3Uniform, bindVec4Uniform, bindTexture } from './shader_funcs.js'
import { texture_load } from "./texture_utils.js"
import { create_color_FBO  } from "./fbo_utils.js"

function init_webgl_screensaver() {
  var screensaver_canvas = document.querySelector("#screensaver-canvas");

  /*var gl = WebGLDebugUtils.makeDebugContext(screensaver_canvas.getContext("webgl2" , {
    premultipliedAlpha: false,
    alpha: false
  }));*/



  var gl = screensaver_canvas.getContext("webgl2", {
    antialias: true
    //premultipliedAlpha: false,
    //alpha: false
  });

  const vert_shader = `#version 300 es
    layout(location = 0)in vec3 a_position;
    layout(location = 1)in vec2 a_uv;

    out vec2 v_uv;

    uniform mat4 u_model_mat;
    uniform mat4 u_vp_mat;

    void main() {
        v_uv = a_uv;
        gl_Position = u_vp_mat * u_model_mat * vec4(a_position, 1.0);
    }`;

  const frag_shader = `#version 300 es
    precision highp float;

    in vec2 v_uv;

    out vec4 frag_color;

    uniform sampler2D u_texture;

    void main() {
        frag_color = texture(u_texture, v_uv);
        if (frag_color.a < 0.01) {
          discard;
        }
    }`;

  const quad_vert_shader = `#version 300 es
    layout(location = 0) in vec3 a_position;
    layout(location = 1)in vec2 a_uv;

    out vec2 v_uv;

    void main() {
        v_uv = a_uv;
        gl_Position = vec4(a_position, 1.0);
    }`;
  const post_proc_frag_shader = `#version 300 es
    precision highp float;

    in vec2 v_uv;

    out vec4 frag_color;

    uniform sampler2D u_text;

    bool is_in_range(float x, float y) {
        return x >= (y - 0.1) && x <= (y + 0.1);
    }
    bool is_color(vec3 color, vec3 sampl) {
        return is_in_range(color.r, sampl.x) && is_in_range(color.g, sampl.g) && is_in_range(color.b, sampl.b);
    }

    void main() {
        frag_color = texture(u_text, v_uv);
        if (frag_color.a < 0.01) {
            discard;
        }
        if (is_color(frag_color.rgb, vec3(0.949, 1.0, 0.459))) {
            frag_color.rgb = vec3(1, 0, 1);
        } else if (is_color(frag_color.rgb, vec3(1.0, 0.773, 0.749))) {
            frag_color.rgb = vec3(20,20,20);
        } else if (is_color(frag_color.rgb, vec3(1.0, 0.69, 0.522))) {
            frag_color.rgb = vec3(0,0,1);
        }
    }`;

  var program = createShader(gl, vert_shader, frag_shader);
  var post_proc_shader = createShader(gl, quad_vert_shader, post_proc_frag_shader);

  // Position buffer
  let vertex_position = [
    -1.0, 1.0, 0.0,      0.0, 1.0,
    1.0, 1.0, 0.0,       1.0, 1.0,
    -1.0, -1.0, 0.0,     0.0, 0.0,
    1.0, -1.0, 0.0,      1.0, 0.0
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
                         5 * 4,
                         0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1,
                         2,
                         gl.FLOAT,
                         false,
                         5 * 4,
                         3 * 4);


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
    glMatrix.mat4.scale(models[i], models[i], [0.5, 0.5, 0.5]);
    //glMatrix.mat4.translate(models[i], models[i], [0.0, 1.0 - (i * 0.50), (i * 0.50)]);
    glMatrix.mat4.translate(models[i], models[i], [0.0, 0.8 * Math.sin((new Date().getTime() / 50) + (i * Math.PI)), (i * 0.50)]);
    glMatrix.mat4.rotate(models[i], models[i], 45.0 * 0.0174533, [0.0, 0.0, 1.0]);

  }

  var textures = [
    texture_load(gl, "img/blu.png"),
    texture_load(gl, "img/yellow.png"),
    texture_load(gl, "img/magenta.png")
  ];

  var transparent_tex = texture_load(gl, "img/transparent.png");

  var [fbo, fbo_color] = create_color_FBO(gl, screensaver_canvas.clientWidth, screensaver_canvas.clientHeight);

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
      console.log("wwf");
      // TODO: re-create the FBO
      gl.deleteTexture(fbo_color);
      gl.deleteFramebuffer(fbo);
      [fbo, fbo_color] = create_color_FBO(gl, screensaver_canvas.width, screensaver_canvas.height);
    }

    for(var i = 0; i < 3; i++) {
      glMatrix.mat4.identity(models[i]);
      glMatrix.mat4.scale(models[i], models[i], [0.5,0.5, 0.5]);
      //glMatrix.mat4.translate(models[i], models[i], [0.0, 1.0 - (i * 0.50), (i * 0.50)]);
      var sins = 0.05 * Math.sin((new Date().getTime() / 500) + ((i) * Math.PI / 3));
      glMatrix.mat4.translate(models[i], models[i], [0.0,  1.0 - (i * 0.70) + sins, (i * 0.50)]);
      glMatrix.mat4.rotate(models[i], models[i], 45.0 * 0.0174533, [0.0, 0.0, 1.0]);
      //console.log(Math.sin((new Date().getTime() / 500) + ((2) * Math.PI)));

    }

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


    var aspect_ratio = screensaver_canvas.width / screensaver_canvas.height;

    glMatrix.mat4.ortho(proj_mat,
                        -2.50 * aspect_ratio, 2.50 * aspect_ratio,
                        -2.50, 2.50,
                        0.1,
                        1000);


    var up = [0.0, 1.0, 0.0];
    var eye = [0.0, 0.0 ,  10.0];
    var center = [0.0, 0.0, 0.0];

    glMatrix.mat4.lookAt(view_mat,
                         eye,
                         center,
                         up);


    glMatrix.mat4.identity(vp_mat);
    glMatrix.mat4.multiply(vp_mat, view_mat,vp_mat);
    glMatrix.mat4.multiply(vp_mat, proj_mat, vp_mat);

    // Render to FBO
    /*{
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, screensaver_canvas.width, screensaver_canvas.height);
      // Clean prev, frame
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Enable blending
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      gl.useProgram(program);
      gl.bindVertexArray(vao);

      // Render the quads, via the order of the drawcalls
      bindTexture(gl, program, "u_texture", textures[draw_calls[0].index], 0);
      bindMat4Uniform(gl, program, "u_model_mat", models[draw_calls[0].index]);
      bindMat4Uniform(gl, program, "u_vp_mat", vp_mat);
      bindVec4Uniform(gl, program, "u_color", draw_calls[0].color);

      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, index_buffer);

      bindTexture(gl, program, "u_texture", textures[draw_calls[1].index], 0);
      bindMat4Uniform(gl, program, "u_model_mat", models[draw_calls[1].index]);
      bindVec4Uniform(gl, program, "u_color", draw_calls[1].color);

      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, index_buffer);

      bindTexture(gl, program, "u_texture", textures[draw_calls[2].index], 0);
      bindMat4Uniform(gl, program, "u_model_mat", models[draw_calls[2].index]);
      bindVec4Uniform(gl, program, "u_color", draw_calls[2].color);

      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, index_buffer);

      //gl.enable(gl.BLEND);
    }*/

    {
      // Bind the canvas back
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, screensaver_canvas.width, screensaver_canvas.height);
      // Clean prev, frame
      gl.clearColor(1.0, 1.0, 1.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      /*gl.disable(gl.BLEND);
      //gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

      gl.useProgram(post_proc_shader);
      gl.bindVertexArray(vao);

      bindTexture(gl, post_proc_shader, "u_text", fbo_color, 0);
      gl.drawElements(gl.TRIANGLES, 6,
                      gl.UNSIGNED_INT,
                      index_buffer);*/

      // Borders
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.enable(gl.BLEND);

      bindTexture(gl, program, "u_texture", transparent_tex, 0);
      bindMat4Uniform(gl, program, "u_vp_mat", vp_mat);
      bindMat4Uniform(gl, program, "u_model_mat", models[draw_calls[0].index]);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, index_buffer);

      bindMat4Uniform(gl, program, "u_model_mat", models[draw_calls[1].index]);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, index_buffer);

      bindMat4Uniform(gl, program, "u_model_mat", models[draw_calls[2].index]);
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, index_buffer);


    }

    requestAnimationFrame(render);
  })();
}


export { init_webgl_screensaver };
