
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


function get_normal_shaders(gl) {
    return createShader(gl, vert_shader, frag_shader);
}

function createShader(gl, raw_vertex_shad, raw_frag_shad) {
    function create_single_shader(type, raw_shader) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, raw_shader);
        gl.compileShader(shader);

        let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

        if (success) {
            return shader;
        }

        console.log("SHADER ERROR");
        console.log(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
    }

    var vert_shader = create_single_shader(gl.VERTEX_SHADER, raw_vertex_shad);
    var frag_shader = create_single_shader(gl.FRAGMENT_SHADER, raw_frag_shad);

    var program = gl.createProgram();
    gl.attachShader(program, vert_shader);
    gl.attachShader(program, frag_shader);

    gl.linkProgram(program);

    let success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }

    console.log("SHADER PROGRAM ERROR");
    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}

function bindMat4Uniform(gl, program, name, mat) {
    gl.uniformMatrix4fv(gl.getUniformLocation(program, name), false, mat);
}

function bindVec3Uniform(gl, program, name, vec) {
    gl.uniform3f(gl.getUniformLocation(program, name), vec[0], vec[1], vec[2]);
}

function bindVec4Uniform(gl, program, name, vec) {
    gl.uniform4f(gl.getUniformLocation(program, name), vec[0], vec[1], vec[2], vec[3]);
}

function bindVec2Uniform(gl, program, name, vec) {
    gl.uniform2f(gl.getUniformLocation(program, name), vec[0], vec[1]);
}

function bindFloatUniform(gl, program, name, vec) {
    gl.uniform1f(gl.getUniformLocation(program, name), vec);
}

function bindTexture(gl, program, name, texture, index) {
    gl.activeTexture(gl.TEXTURE0 + index);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(program, name), index);
}

export{ createShader, bindMat4Uniform, bindFloatUniform, bindVec2Uniform, bindVec3Uniform, bindVec4Uniform, bindTexture, get_normal_shaders };
