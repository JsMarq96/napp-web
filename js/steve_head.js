import {  createShader, bindMat4Uniform, bindVec3Uniform, bindVec4Uniform, bindTexture, get_normal_shaders } from './shader_funcs.js'
import { texture_load } from "./texture_utils.js"
import { steve_model } from "./meshes/steve.js"


function init_steve_head() {
  var steve_canvas = document.querySelector("#steve-canvas");

   var is_clicked = false;

  var gl = steve_canvas.getContext("webgl2", {
    antialias: true
    //premultipliedAlpha: false,
    //alpha: false
  });

  // Head rotation
  var view_mat = glMatrix.mat4.create();
  var proj_mat = glMatrix.mat4.create();
  var vp_mat = glMatrix.mat4.create();

  var model = glMatrix.mat4.create();


  function on_press(el) {
    document.onmousemove = on_drag;
    document.onmouseup = on_realese;
    steve_canvas.start_pos_x = el.clientX;
    steve_canvas.start_pos_y = el.clientY;

    steve_canvas.onmouseleave = on_realese;

    is_clicked = true;
  }

  function on_drag(element) {
    var el = steve_canvas;
    const new_x = el.start_pos_x - element.clientX;
    const new_y = el.start_pos_y - element.clientY;
    el.start_pos_x = element.clientX;
    el.start_pos_y = element.clientY;

    glMatrix.mat4.rotate(model, model, new_y * 0.5 * 0.0174533, [-1.0, 0.0, 0.0]);
    glMatrix.mat4.rotate(model, model, new_x * 0.5 * 0.0174533, [0.0, -1.0, 0.0]);
  }

  function on_realese() {
    document.onmousemove = null;
    is_clicked = false;
  }

  steve_canvas.onmousedown = on_press;


  var program = get_normal_shaders(gl);

  var vertex_buffer = gl.createBuffer();
  var vao = gl.createVertexArray();

  gl.bindVertexArray(vao);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(steve_model), gl.STATIC_DRAW);

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

  glMatrix.mat4.identity(model);
  glMatrix.mat4.rotate(model, model, 10.0 * 0.0174533, [1.0, 0.0, 0.0]);

  var steve_texture = texture_load(gl, "img/steve.png");

  (function render(elapsed_time) {
    // Lookup the size the browser is displaying the canvas in CSS pixels.
    const displayWidth  = steve_canvas.clientWidth;
    const displayHeight = steve_canvas.clientHeight;

    // Check if the canvas is not the same size.
    const needResize = steve_canvas.width  !== displayWidth ||
                        steve_canvas.height !== displayHeight;

    if (needResize) {
      // Make the canvas the same size
      steve_canvas.width  = displayWidth;
      steve_canvas.height = displayHeight;
    }

    var aspect_ratio = steve_canvas.width / steve_canvas.height;
    glMatrix.mat4.perspective(proj_mat,
                              90.0 * 0.0174533,
                              aspect_ratio,
                              0.1,
                              100);

    glMatrix.mat4.ortho(proj_mat,
                        -2.50 * aspect_ratio, 2.50 * aspect_ratio,
                        -2.50, 2.50,
                        0.1,
                        100);


    var up = [0.0, 1.0, 0.0];
    var eye = [0.0, 0.0, 2.90];
    var center = [0.0, 0.0, 0.0];

    glMatrix.mat4.lookAt(view_mat,
                         eye,
                         center,
                         up);


    glMatrix.mat4.identity(vp_mat);
    glMatrix.mat4.multiply(vp_mat, view_mat,vp_mat);
    glMatrix.mat4.multiply(vp_mat, proj_mat, vp_mat);

    if (!is_clicked) {
      glMatrix.mat4.rotate(model, model, 1.50 * 0.0174533, [0.0, 1.0, 0.0]);
    }

    gl.viewport(0, 0, steve_canvas.width, steve_canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.BLEND);
    gl.disable(gl.CULL_FACE);

    gl.useProgram(program);
    gl.bindVertexArray(vao);

    bindTexture(gl, program, "u_texture", steve_texture, 0);
    bindMat4Uniform(gl, program, "u_vp_mat", vp_mat);
    bindMat4Uniform(gl, program, "u_model_mat", model);

    gl.drawArrays(gl.TRIANGLES, 0, steve_model.length / 5);

    gl.enable(gl.CULL_FACE);

    requestAnimationFrame(render);
  }) ();
}

export { init_steve_head };
