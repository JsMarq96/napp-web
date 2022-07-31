
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
    gl.uniform3fv(gl.getUniformLocation(program, name), vec);
}

function bindVec4Uniform(gl, program, name, vec) {
    gl.uniform4f(gl.getUniformLocation(program, name), vec[0], vec[1], vec[2], vec[3]);
}

function bindTexture(gl, program, name, texture, index) {
    gl.activeTexture(gl.TEXTURE0 + index);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(program, name), index);
}

export{ createShader, bindMat4Uniform, bindVec3Uniform, bindVec4Uniform, bindTexture };
