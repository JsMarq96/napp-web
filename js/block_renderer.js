import {  createShader, bindMat4Uniform, bindFloatUniform, bindVec2Uniform, bindVec3Uniform, bindVec4Uniform, bindTexture } from './shader_funcs.js'
import { texture_load, texture_load_cubemap } from "./texture_utils.js"
import {block_vertex, block_fragment} from "./shaders/block_shaders.js"
import { blocks } from "./blocks.js"
import { block_model, block_indices } from "./meshes/block.js"
import { cubemaps } from "./cubemaps.js"
import { skybox_init, skybox_render} from "./skybox_render.js"

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

  gl.getExtension('OES_standard_derivatives');
  gl.getExtension('EXT_shader_texture_lod');

  var program = createShader(gl, block_vertex, block_fragment);

  var vertex_buffer = gl.createBuffer();
  var index_buffer = gl.createBuffer();
  var vao = gl.createVertexArray();

  gl.bindVertexArray(vao);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(block_model), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(block_indices), gl.STATIC_DRAW);

  gl.enableVertexAttribArray(0); //  vertex
  gl.vertexAttribPointer(0,
                         3,
                         gl.FLOAT,
                         false,
                         14 * 4,
                         0);

  gl.enableVertexAttribArray(1); //  uv
  gl.vertexAttribPointer(1,
                         2,
                         gl.FLOAT,
                         false,
                         14 * 4,
                         3 * 4);

  gl.enableVertexAttribArray(2); // normal
  gl.vertexAttribPointer(2,
                         3,
                         gl.FLOAT,
                         false,
                         14 * 4,
                         5 * 4);
  gl.enableVertexAttribArray(3); // tanget
  gl.vertexAttribPointer(3,
                         3,
                         gl.FLOAT,
                         false,
                         14 * 4,
                         8 * 4);
  gl.enableVertexAttribArray(4); // binormal
  gl.vertexAttribPointer(4,
                         3,
                         gl.FLOAT,
                         false,
                         14 * 4,
                         11 * 4);



  gl.bindVertexArray(null);

  var selected_block = 0;
  var view_mat = glMatrix.mat4.create();
  var proj_mat = glMatrix.mat4.create();
  var vp_mat = glMatrix.mat4.create();
  var base_model = glMatrix.mat4.create();
  var model = glMatrix.mat4.create();
  glMatrix.mat4.identity(base_model);

  var base_rotation = glMatrix.mat3.create();
  glMatrix.mat3.identity(base_rotation);

  //
  //
  var is_clicked = false;
  var y_axis = [-1.0, 0.0, 0.0];

  function on_press(el) {
    document.onmousemove = on_drag;
    document.onmouseup = on_realese;
    canvas.start_pos_x = el.clientX;
    canvas.start_pos_y = el.clientY;

    canvas.onmouseleave = on_realese;

    is_clicked = true;
  }

  function on_drag(element) {
    var el = canvas;
    // Calculate cursor speed
    const new_x = el.start_pos_x - element.clientX;
    const new_y = el.start_pos_y - element.clientY;
    el.start_pos_x = element.clientX;
    el.start_pos_y = element.clientY;

    // the rotation axis X remains constant
    var x_axis = [0.0, -1.0, 0.0];

    // Avoid appliying rotations at a low speed
    if (Math.sqrt(new_x ** 2.0 + new_y ** 2.0) < 0.7) {
      return;
    }

    if (Math.abs(new_y) + 0.5 < Math.abs(new_x)) {
      glMatrix.mat4.rotate(model, model, new_x * 0.5 * 0.0174533, x_axis);
      glMatrix.vec3.rotateY(y_axis, y_axis, [0.0, 0.0, 0.0], new_x * 0.5 * 0.0174533);
    } else {
      glMatrix.mat4.rotate(model, model, new_y * 0.5 * 0.0174533, y_axis);
    }
  }

  function on_realese() {
    document.onmousemove = null;
    is_clicked = false;
  }

  function create_block_selector_button(parent, block_data, index) {
    var thumbnail = document.createElement("img");
    var label = document.createElement("div");
    label.classList.add("block-name");

    thumbnail.src = block_data.side.albedo.dir;
    label.innerHTML = block_data.name;

    var button = document.createElement("button");
    button.classList.add("block-item");

    button.appendChild(thumbnail);
    button.appendChild(label);

    button.index = 0;
    button.index += index;

    button.onclick = function() {
      selected_block = button.index;
    };

    parent.appendChild(button);
  }

  canvas.onmousedown = on_press;

  var selected_block = 0;

  // Add the blocks buttons
  let parent = document.getElementById("block-catalog");
  for(var i = 0; i < blocks.length; i++) {
    create_block_selector_button(parent, blocks[i], i);
  }

  // LIGHT POS ============
  let light_icon = document.getElementById("visualization_light");
  var is_clicked_light = false;
  // Calculate light position
    // NOTE this is a hack... an inverse transform would be much nicer
  var light_pos = glMatrix.vec3.fromValues(-8.0, 5.0, 10.0);

  var textures = [];

  let faces = [
    {name: "side", normal: [0.0, 0.0, 1.0]},
    {name: "side", normal: [1.0, 0.0, 0.0]},
    {name: "side", normal: [0.0, 0.0, -1.0]},
    {name: "side", normal: [-1.0, 0.0, 0.0]},
    {name: "bottom", normal: [0.0, -1.0, 0.0]},
    {name: "top", normal: [0.0, 1.0, 0.0]},
  ];

  var time_start = Date.now();
  var render_mode = 0.0;
  // Onlcik events
  document.getElementById("select_result").onmousedown = function () {
    render_mode = 0.0;
  };
  document.getElementById("select_normal").onmousedown  = function () {
    render_mode = 1.0;
  };
  document.getElementById("select_specular").onmousedown  = function () {
    render_mode = 2.0;
  };

  // Render
  var cubemap_texture = texture_load_cubemap(gl, cubemaps[0]);
  let skybox_module = skybox_init(gl);
  var brdf_LUT = texture_load(gl, "./../img/brdfLUT.png");

  // Camera position
  var up = [0.0, 1.0, 0.0];
  var eye = [0.0, 0.0, 3.0];
  var center = [0.0, 0.0, 0.0];

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

    if (false) {
      glMatrix.mat4.rotate(model, model, 0.70 * 0.0174533, [0.0, 1.0, 0.0]);
    }
    //glMatrix.mat4.rotate(model, model, 0.70 * 0.0174533, [0.0, 1.0, 0.0]);

    var aspect_ratio = canvas.width / canvas.height;

    /*glMatrix.mat4.ortho(proj_mat,
                        -2.50 * aspect_ratio, 2.50 * aspect_ratio,
                        -2.50, 2.50,
                        0.1,
                        1000);*/
    glMatrix.mat4.perspective(proj_mat, 90.0 * 0.0174533, aspect_ratio, 0.1, 100.0);


    // Zoom
    // Hijack the mouse screel event of the canvas,
    // and moves teh camara pos along the front vector
    canvas.onwheel = function (event) {
      event.preventDefault();

      var front = [center[0] - eye[0], center[1] - eye[1], center[2] - eye[2]];

      eye[0] = eye[0] + front[0] * event.deltaY * 0.0003;
      eye[1] = eye[1] + front[1] * event.deltaY * -0.0003;
      eye[2] = eye[2] + front[2] * event.deltaY * -0.0003;
    }

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
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


      // Enable blending
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      // Render Skybox
      skybox_render(gl, skybox_module, vp_mat, eye, cubemap_texture);

      gl.disable(gl.CULL_FACE);

      gl.enable(gl.DEPTH_TEST);

      gl.useProgram(program);
      gl.bindVertexArray(vao);

      bindMat4Uniform(gl, program, "u_vp_mat", vp_mat);
      bindVec3Uniform(gl, program, "u_light_pos", light_pos);
      bindVec3Uniform(gl, program, "u_camera_pos", eye);
      bindFloatUniform(gl, program, "u_render_mode", render_mode);
      bindTexture(gl, program, "u_brdf_LUT", brdf_LUT, 5);


      for(var i = 0; i < 6; i++) {

        if (!((blocks[selected_block].name + faces[i].name) in textures)){
          textures[blocks[selected_block].name + faces[i].name] = { albedo: texture_load(gl, "./../" + blocks[selected_block][faces[i].name].albedo.dir),
                                                                    normal: texture_load(gl,"./../" + blocks[selected_block][faces[i].name].normal.dir),
                                                                    specular: texture_load(gl,"./../" + blocks[selected_block][faces[i].name].specular.dir)
                                                                  };
        }

        var tim = (((Date.now()) - time_start) ) ;

        bindMat4Uniform(gl, program, "u_model_mat", model);
        bindVec3Uniform(gl, program, "u_face_normal", faces[i].normal);
        bindVec2Uniform(gl, program, "u_albedo_anim_size", blocks[selected_block][faces[i].name].albedo.size);
        bindVec2Uniform(gl, program, "u_normal_anim_size", blocks[selected_block][faces[i].name].normal.size);
        bindVec2Uniform(gl, program, "u_specular_anim_size", blocks[selected_block][faces[i].name].specular.size);
        bindFloatUniform(gl, program, "u_time", tim);
        bindTexture(gl, program, "u_texture", textures[blocks[selected_block].name + faces[i].name].albedo, 0);
        bindTexture(gl, program, "u_normal_tex", textures[blocks[selected_block].name + faces[i].name].normal, 1);
        bindTexture(gl, program, "u_met_rough_tex", textures[blocks[selected_block].name + faces[i].name].specular, 2);
        bindTexture(gl, program, "u_enviorment_map", cubemap_texture, 3);

        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT,  2 * 6 * i);
      }
    }

    requestAnimationFrame(render);

  })();
}

export { init_block_renderer };
