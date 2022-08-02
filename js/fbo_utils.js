
function create_color_FBO(gl, width, heigth) {
  // Create framebuffer
  var fbo = gl.createFramebuffer();
  //var rbo = gl.genRenderbuffer();
  // Create texture
  var target_color = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, target_color);

  // Define texture
  gl.texImage2D(gl.TEXTURE_2D,
                0, // Mip
                gl.RGBA,
                width, heigth,
                0, // Border
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                null);
  // No mips
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  //gl.bindTexture(gl.TEXTURE_2D, null);

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,
                          gl.COLOR_ATTACHMENT0,
                          gl.TEXTURE_2D,
                          target_color,
                          0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return [fbo, target_color];
}


export { create_color_FBO };
