/**
 * WebGL shader sources for card rendering
 */

// Vertex shader for rendering 2D textured quads
export const CARD_VERTEX_SHADER = `
  attribute vec4 a_position;
  attribute vec2 a_texcoord;
  
  uniform mat4 u_matrix;
  
  varying vec2 v_texcoord;
  
  void main() {
    gl_Position = u_matrix * a_position;
    v_texcoord = a_texcoord;
  }
`;

// Fragment shader for rendering card texture with optional effects
export const CARD_FRAGMENT_SHADER = `
  precision mediump float;
  
  varying vec2 v_texcoord;
  
  uniform sampler2D u_texture;
  uniform float u_flip_progress; // 0.0 = front facing, 1.0 = back facing
  uniform float u_highlight;     // 0.0 = normal, 1.0 = highlighted (matched)
  
  void main() {
    vec4 texColor = texture2D(u_texture, v_texcoord);
    
    // Apply highlight effect for matched cards
    vec4 highlightColor = vec4(1.0, 1.0, 0.0, 1.0); // Yellow highlight
    vec4 color = mix(texColor, highlightColor, u_highlight * 0.3);
    
    // Apply flip effect (darken during transition)
    float flipFactor = sin(u_flip_progress * 3.14159);
    color.rgb *= (1.0 - flipFactor * 0.5);
    
    gl_FragColor = color;
  }
`;

// Basic 2D transformation matrix functions
export const MATRIX_FUNCTIONS = `
  // Creates a 2D projection matrix
  function create2DProjectionMatrix(width, height) {
    return [
      2 / width, 0, 0, 0,
      0, -2 / height, 0, 0,
      0, 0, 1, 0,
      -1, 1, 0, 1
    ];
  }
  
  // Creates a translation matrix
  function createTranslationMatrix(tx, ty) {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      tx, ty, 0, 1
    ];
  }
  
  // Creates a rotation matrix (in radians)
  function createRotationMatrix(angleInRadians) {
    const c = Math.cos(angleInRadians);
    const s = Math.sin(angleInRadians);
    return [
      c, s, 0, 0,
      -s, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
  }
  
  // Creates a scaling matrix
  function createScaleMatrix(sx, sy) {
    return [
      sx, 0, 0, 0,
      0, sy, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
  }
  
  // Multiplies two 4x4 matrices
  function multiplyMatrices(a, b) {
    const result = new Array(16);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) {
          sum += a[i * 4 + k] * b[k * 4 + j];
        }
        result[i * 4 + j] = sum;
      }
    }
    return result;
  }
`;

// Full-screen quad vertices (positions and texture coordinates)
export const QUAD_VERTICES = new Float32Array([
    // Position (x, y) and Texcoord (s, t)
    -1, -1, 0, 0, // bottom-left
    1, -1, 1, 0,  // bottom-right
    -1, 1, 0, 1,  // top-left
    1, 1, 1, 1    // top-right
]); 