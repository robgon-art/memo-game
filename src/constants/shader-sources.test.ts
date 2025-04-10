import { describe, it, expect } from 'vitest';
import {
    CARD_VERTEX_SHADER,
    CARD_FRAGMENT_SHADER,
    MATRIX_FUNCTIONS,
    QUAD_VERTICES
} from './shader-sources';

describe('Shader Sources', () => {
    it('should define CARD_VERTEX_SHADER as a valid GLSL shader string', () => {
        expect(CARD_VERTEX_SHADER).toBeDefined();
        expect(typeof CARD_VERTEX_SHADER).toBe('string');
        expect(CARD_VERTEX_SHADER.length).toBeGreaterThan(0);

        // Check for required GLSL elements
        expect(CARD_VERTEX_SHADER).toContain('void main()');
        expect(CARD_VERTEX_SHADER).toContain('attribute vec4 a_position');
        expect(CARD_VERTEX_SHADER).toContain('attribute vec2 a_texcoord');
        expect(CARD_VERTEX_SHADER).toContain('uniform mat4 u_matrix');
        expect(CARD_VERTEX_SHADER).toContain('varying vec2 v_texcoord');
        expect(CARD_VERTEX_SHADER).toContain('gl_Position');
    });

    it('should define CARD_FRAGMENT_SHADER as a valid GLSL shader string', () => {
        expect(CARD_FRAGMENT_SHADER).toBeDefined();
        expect(typeof CARD_FRAGMENT_SHADER).toBe('string');
        expect(CARD_FRAGMENT_SHADER.length).toBeGreaterThan(0);

        // Check for required GLSL elements
        expect(CARD_FRAGMENT_SHADER).toContain('precision mediump float');
        expect(CARD_FRAGMENT_SHADER).toContain('void main()');
        expect(CARD_FRAGMENT_SHADER).toContain('varying vec2 v_texcoord');
        expect(CARD_FRAGMENT_SHADER).toContain('uniform sampler2D u_texture');
        expect(CARD_FRAGMENT_SHADER).toContain('uniform float u_flip_progress');
        expect(CARD_FRAGMENT_SHADER).toContain('uniform float u_highlight');
        expect(CARD_FRAGMENT_SHADER).toContain('gl_FragColor');
    });

    it('should define MATRIX_FUNCTIONS as a string with matrix operations', () => {
        expect(MATRIX_FUNCTIONS).toBeDefined();
        expect(typeof MATRIX_FUNCTIONS).toBe('string');
        expect(MATRIX_FUNCTIONS.length).toBeGreaterThan(0);

        // Check for function definitions
        expect(MATRIX_FUNCTIONS).toContain('function create2DProjectionMatrix');
        expect(MATRIX_FUNCTIONS).toContain('function createTranslationMatrix');
        expect(MATRIX_FUNCTIONS).toContain('function createRotationMatrix');
        expect(MATRIX_FUNCTIONS).toContain('function createScaleMatrix');
        expect(MATRIX_FUNCTIONS).toContain('function multiplyMatrices');
    });

    it('should define QUAD_VERTICES as a Float32Array with correct values', () => {
        expect(QUAD_VERTICES).toBeDefined();
        expect(QUAD_VERTICES).toBeInstanceOf(Float32Array);
        expect(QUAD_VERTICES.length).toBe(16); // 4 vertices × 4 values (x, y, s, t)

        // Check specific values for first vertex (bottom-left)
        expect(QUAD_VERTICES[0]).toBe(-1); // x
        expect(QUAD_VERTICES[1]).toBe(-1); // y
        expect(QUAD_VERTICES[2]).toBe(0);  // s
        expect(QUAD_VERTICES[3]).toBe(0);  // t

        // Check specific values for last vertex (top-right)
        expect(QUAD_VERTICES[12]).toBe(1);  // x
        expect(QUAD_VERTICES[13]).toBe(1);  // y
        expect(QUAD_VERTICES[14]).toBe(1);  // s
        expect(QUAD_VERTICES[15]).toBe(1);  // t
    });

    // Test each matrix function individually
    it('should define working matrix functions', () => {
        // Create a safe environment to evaluate the matrix functions
        const testEnv: any = {};
        
        // Define each function separately for testing
        eval(`
          ${MATRIX_FUNCTIONS}
          testEnv.create2DProjectionMatrix = create2DProjectionMatrix;
          testEnv.createTranslationMatrix = createTranslationMatrix;
          testEnv.createRotationMatrix = createRotationMatrix;
          testEnv.createScaleMatrix = createScaleMatrix;
          testEnv.multiplyMatrices = multiplyMatrices;
        `);
        
        // Test projection matrix creation
        const projection = testEnv.create2DProjectionMatrix(800, 600);
        expect(projection).toBeInstanceOf(Array);
        expect(projection.length).toBe(16);
        expect(projection[0]).toBeCloseTo(2/800); // 2/width
        expect(projection[5]).toBeCloseTo(-2/600); // -2/height
        expect(projection[10]).toBe(1); // z scale
        expect(projection[15]).toBe(1); // w component
        
        // Test translation matrix creation
        const translation = testEnv.createTranslationMatrix(10, 20);
        expect(translation).toBeInstanceOf(Array);
        expect(translation.length).toBe(16);
        expect(translation[0]).toBe(1); // x scale
        expect(translation[5]).toBe(1); // y scale
        expect(translation[10]).toBe(1); // z scale
        expect(translation[12]).toBe(10); // tx
        expect(translation[13]).toBe(20); // ty
        expect(translation[15]).toBe(1); // w component
        
        // Test rotation matrix creation (90 degrees)
        const rotation = testEnv.createRotationMatrix(Math.PI/2);
        expect(rotation).toBeInstanceOf(Array);
        expect(rotation.length).toBe(16);
        expect(rotation[0]).toBeCloseTo(0); // cos
        expect(rotation[1]).toBeCloseTo(1); // sin
        expect(rotation[4]).toBeCloseTo(-1); // -sin
        expect(rotation[5]).toBeCloseTo(0); // cos
        expect(rotation[10]).toBe(1); // z unchanged
        expect(rotation[15]).toBe(1); // w component
        
        // Test scaling matrix creation
        const scale = testEnv.createScaleMatrix(2, 3);
        expect(scale).toBeInstanceOf(Array);
        expect(scale.length).toBe(16);
        expect(scale[0]).toBe(2); // sx
        expect(scale[5]).toBe(3); // sy
        expect(scale[10]).toBe(1); // sz
        expect(scale[15]).toBe(1); // w component
        
        // Test that multiplyMatrices function exists
        expect(typeof testEnv.multiplyMatrices).toBe('function');
    });

    // Test that shaders would compile - without actually trying to use WebGL
    it('should likely compile in a WebGL context', () => {
        // Note: We're testing constant correctness, not actual WebGL functionality
        // This test just verifies shader structure without requiring a WebGL context
        
        // Check VERTEX_SHADER has required structural elements
        expect(CARD_VERTEX_SHADER).toContain('attribute');
        expect(CARD_VERTEX_SHADER).toContain('uniform');
        expect(CARD_VERTEX_SHADER).toContain('varying');
        expect(CARD_VERTEX_SHADER).toContain('void main()');
        expect(CARD_VERTEX_SHADER).toContain('gl_Position');
        
        // Check FRAGMENT_SHADER has required structural elements
        expect(CARD_FRAGMENT_SHADER).toContain('precision mediump float');
        expect(CARD_FRAGMENT_SHADER).toContain('uniform');
        expect(CARD_FRAGMENT_SHADER).toContain('varying');
        expect(CARD_FRAGMENT_SHADER).toContain('void main()');
        expect(CARD_FRAGMENT_SHADER).toContain('gl_FragColor');
        
        // Check shader string is well-formed with matching braces
        const countOpenBraces = (CARD_VERTEX_SHADER.match(/{/g) || []).length;
        const countCloseBraces = (CARD_VERTEX_SHADER.match(/}/g) || []).length;
        expect(countOpenBraces).toBe(countCloseBraces);
        
        const countOpenBracesFragment = (CARD_FRAGMENT_SHADER.match(/{/g) || []).length;
        const countCloseBracesFragment = (CARD_FRAGMENT_SHADER.match(/}/g) || []).length;
        expect(countOpenBracesFragment).toBe(countCloseBracesFragment);
    });
}); 