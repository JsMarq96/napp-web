import {  createShader, bindMat4Uniform, bindVec3Uniform, bindVec4Uniform, bindTexture, get_normal_shaders } from './shader_funcs.js'
import { texture_load } from "./texture_utils.js"
import { steve_mesh } from "./meshes/steve.js"

function init_steve_head() {
  var screensaver_canvas = document.querySelector("#steve-canvas");

  var gl = screensaver_canvas.getContext("webgl2", {
    antialias: true
    //premultipliedAlpha: false,
    //alpha: false
  });

  var program = get_normal_shaders(gl);

  var vertex_buffer = gl.createBuffer();
  var vao = gl.createVertexArray();

  gl.bindVertexArray(vao);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex_position), gl.STATIC_DRAW);

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

  var model = glMatrix.mat4.create();

}
