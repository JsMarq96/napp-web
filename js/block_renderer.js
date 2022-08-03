import {  createShader, bindMat4Uniform, bindVec3Uniform, bindVec4Uniform, bindTexture } from './shader_funcs.js'
import { texture_load } from "./texture_utils.js"
import {block_vertex, block_fragment} from "./shaders/block_shaders.js"
import { blocks } from "./blocks.js"
import { block_model, block_indices } from "./meshes/block.js"

function get_rotation_matrix(origin_normal, destination_normal) {
  var rotation_mat = glMatrix.mat4.create();
  let origin_dot_destination = glMatrix.vec3.dot(origin_normal, destination_normal);
  var cross_origin_destination = glMatrix.vec3.create();
  glMatrix.vec3.cross(cross_origin_destination, origin_normal, destination_normal);
  let cross_magnitude = glMatrix.vec3.length(cross_origin_destination);
  console.log(origin_dot_destination, cross_origin_destination);
  glMatrix.mat4.set(rotation_mat,
                    origin_dot_destination, cross_magnitude, 0.0, 0.0,
                    -cross_magnitude, origin_dot_destination, 0.0, 0.0,
                    0.0, 0.0, 1.0, 0.0,
                    0.0, 0.0, 0.0, 1.0
                   );

  return rotation_mat;
}

function init_block_renderer() {
  var canvas = document.querySelector("#block-canvas");

  var gl = canvas.getContext("webgl2", {
    antialias: true
    //premultipliedAlpha: false,
    //alpha: false
  });

  var program = createShader(gl, block_vertex, block_fragment);

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


  gl.bindVertexArray(null);

  var view_mat = glMatrix.mat4.create();
  var proj_mat = glMatrix.mat4.create();
  var vp_mat = glMatrix.mat4.create();
  var base_model = glMatrix.mat4.create();
  var model = glMatrix.mat4.create();
  glMatrix.mat4.identity(base_model);

  var base_rotation = glMatrix.mat3.create();
  glMatrix.mat3.identity(base_rotation);

  //
  var selected_block = 0;
  var textures = [];

  let faces = [
    {name: "side", normal: [0.0, 0.0, 1.0]},
    {name: "side", normal: [1.0, 0.0, 0.0]},
    {name: "side", normal: [0.0, 0.0, -1.0]},
    {name: "side", normal: [-1.0, 0.0, 0.0]},
    {name: "bottom", normal: [0.0, -1.0, 0.0]},
    {name: "top", normal: [0.0, 1.0, 0.0]},
  ];

  (function render(elapsed_time) {
    // Lookup the size the browser is displaying the canvas in CSS pixels.
    const displayWidth  = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    // Check if the canvas is not the same size.
    const needResize = canvas.width  !== displayWidth ||
          canvas.height !== displayHeight;

    if (needResize) {
      // Make the canvas the same size
      canvas.width  = displayWidth;
      canvas.height = displayHeight;
    }

     glMatrix.mat4.rotate(model, model, 0.70 * 0.0174533, [0.0, 1.0, 0.0]);

    var aspect_ratio = canvas.width / canvas.height;

    /*glMatrix.mat4.ortho(proj_mat,
                        -2.50 * aspect_ratio, 2.50 * aspect_ratio,
                        -2.50, 2.50,
                        0.1,
                        1000);*/
    glMatrix.mat4.perspective(proj_mat, 90.0 * 0.0174533, aspect_ratio, 0.1, 100.0);


    var up = [0.0, 1.0, 0.0];
    var eye = [0.0, 0.0 , 2.0];
    var center = [0.0, 0.0, 0.0];

    glMatrix.mat4.lookAt(view_mat,
                         eye,
                         center,
                         up);


    glMatrix.mat4.identity(vp_mat);
    glMatrix.mat4.multiply(vp_mat, view_mat,vp_mat);
    glMatrix.mat4.multiply(vp_mat, proj_mat, vp_mat);

    // Render
    {
      gl.viewport(0, 0, canvas.width, canvas.height);
      // Clean prev, frame
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Enable blending
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      //gl.enable(gl.FACE_CULLING);
      //gl.cullFace(gl.FRONT);
      gl.enable(gl.DEPTH_TEST);

      gl.useProgram(program);
      gl.bindVertexArray(vao);

      bindMat4Uniform(gl, program, "u_vp_mat", vp_mat);
      bindVec3Uniform(gl, program, "u_light_pos", [5.,5.0, 10.0]);
      bindVec3Uniform(gl, program, "u_camera_pos", eye);

      //console.log(normal);

      for(var i = 0; i < 6; i++) {

        if (!((blocks[0].name + faces[i].name) in textures)){
          textures[blocks[0].name + faces[i].name] = {albedo: texture_load(gl, "./../" + blocks[0][faces[i].name].albedo.dir),
                                                      normal: texture_load(gl,"./../" + blocks[0][faces[i].name].normal.dir),
                                                      specular: texture_load(gl,"./../" + blocks[0][faces[i].name].specular.dir)
                                                     };
        }

        bindMat4Uniform(gl, program, "u_model_mat", model);
        bindVec3Uniform(gl, program, "u_face_normal", faces[i].normal);
        bindTexture(gl, program, "u_texture", textures[blocks[0].name + faces[i].name].albedo, 0);
        bindTexture(gl, program, "u_normal_tex", textures[blocks[0].name + faces[i].name].normal, 1);
        bindTexture(gl, program, "u_met_rough_tex", textures[blocks[0].name + faces[i].name].specular, 2);

        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT,  2 * 6 * i);
      }


      //gl.enable(gl.BLEND);
    }

    requestAnimationFrame(render);
  })();
}

export { init_block_renderer };