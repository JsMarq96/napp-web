
function create_color_FBO(gl, width, heigth) {
  // Create framebuffer
  const fbo = gl.createFramebuffer();
  // Create texture
  const target_color = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, target_color);

  // Define texture
  gl.texImage2D(gl.TEXTURE_2D,
                0, // Mip
                gl.RGBA,
                width, height,
                0, // Border
                gl.UNSIGNED_BYTE);
  // No mips
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D. gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.frameBufferTexture2D(gl.FRAMEBUFFER,
                          gl.COLOR_ATTACHMENT0,
                          gl.Texture_2D,
                          target_color,
                          0);

  return { fbo: fbo, color: target_color };
}


export { create_color_FBO };
