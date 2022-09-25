import {  createShader, bindMat4Uniform, bindFloatUniform, bindVec2Uniform, bindVec3Uniform, bindVec4Uniform, bindTexture } from './shader_funcs.js'
import { texture_load, texture_load_cubemap } from "./texture_utils.js"
import {block_vertex, block_fragment, skybox_fragment} from "./shaders/block_shaders.js"
import { block_model, block_indices } from "./meshes/block.js"

function skybox_init(gl) {
  var program = createShader(gl, block_vertex, skybox_fragment);
  var vertex_buffer = gl.createBuffer();
  var index_buffer = gl.createBuffer();
  var vao = gl.createVertexArray();

  gl.bindVertexArray(vao);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(block_model), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(block_indices), gl.STATIC_DRAW);

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

  var cubemap = {
    shader: program, VAO: vao
  };

  return cubemap;
}

function skybox_render(gl, cubemap, vp_mat, eye, texture) {
  var model = glMatrix.mat4.create();
  glMatrix.mat4.identity(model);
  glMatrix.mat4.translate(model, model, eye);
  glMatrix.mat4.scale(model, model, [10.0, 10.0, 10.0]);

  gl.useProgram(cubemap.shader);
  gl.bindVertexArray(cubemap.VAO);

  gl.disable(gl.CULL_FACE);
  gl.disable(gl.DEPTH_TEST);

  bindMat4Uniform(gl, cubemap.shader, "u_model_mat", model);
  bindMat4Uniform(gl, cubemap.shader, "u_vp_mat", vp_mat);
  bindVec3Uniform(gl, cubemap.shader, "u_camera_pos", eye);

  bindTexture(gl, cubemap.shader, "u_texture", texture, 0);

  gl.drawElements(gl.TRIANGLES, block_indices.length, gl.UNSIGNED_SHORT,  0);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  gl.useProgram(null);
  gl.bindVertexArray(null);
}

export {skybox_init, skybox_render};
