import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    createWebGLContext,
    compileShader,
    createProgram,
    createBuffer,
    resizeCanvasToDisplaySize
} from './webgl-utils';

// Mock for WebGL rendering context
class MockWebGLRenderingContext {
    ARRAY_BUFFER = 'ARRAY_BUFFER';
    STATIC_DRAW = 'STATIC_DRAW';
    FRAGMENT_SHADER = 'FRAGMENT_SHADER';
    VERTEX_SHADER = 'VERTEX_SHADER';
    COMPILE_STATUS = 'COMPILE_STATUS';
    LINK_STATUS = 'LINK_STATUS';
    TEXTURE_2D = 'TEXTURE_2D';
    RGBA = 'RGBA';
    UNSIGNED_BYTE = 'UNSIGNED_BYTE';
    TEXTURE_MIN_FILTER = 'TEXTURE_MIN_FILTER';
    TEXTURE_MAG_FILTER = 'TEXTURE_MAG_FILTER';
    LINEAR = 'LINEAR';
    TEXTURE_WRAP_S = 'TEXTURE_WRAP_S';
    TEXTURE_WRAP_T = 'TEXTURE_WRAP_T';
    CLAMP_TO_EDGE = 'CLAMP_TO_EDGE';

    createShader = vi.fn().mockReturnValue({});
    shaderSource = vi.fn();
    compileShader = vi.fn();
    getShaderParameter = vi.fn().mockReturnValue(true);
    getShaderInfoLog = vi.fn().mockReturnValue('');
    deleteShader = vi.fn();
    createProgram = vi.fn().mockReturnValue({});
    attachShader = vi.fn();
    linkProgram = vi.fn();
    getProgramParameter = vi.fn().mockReturnValue(true);
    getProgramInfoLog = vi.fn().mockReturnValue('');
    deleteProgram = vi.fn();
    createBuffer = vi.fn().mockReturnValue({});
    bindBuffer = vi.fn();
    bufferData = vi.fn();
    createTexture = vi.fn().mockReturnValue({});
    bindTexture = vi.fn();
    texImage2D = vi.fn();
    texParameteri = vi.fn();
}

describe('WebGL Utilities', () => {
    let canvas: HTMLCanvasElement;
    let gl: any;

    beforeEach(() => {
        // Set up canvas element
        canvas = document.createElement('canvas');
        gl = new MockWebGLRenderingContext();
        vi.spyOn(canvas, 'getContext').mockReturnValue(gl as unknown as WebGLRenderingContext);
    });

    describe('createWebGLContext', () => {
        it('should create a WebGL context', () => {
            const context = createWebGLContext(canvas);
            expect(canvas.getContext).toHaveBeenCalledWith('webgl');
            expect(context).toBe(gl);
        });

        it('should throw an error if WebGL is not supported', () => {
            vi.spyOn(canvas, 'getContext').mockReturnValue(null);
            expect(() => createWebGLContext(canvas)).toThrow('WebGL not supported or disabled');
        });
    });

    describe('compileShader', () => {
        it('should compile a shader successfully', () => {
            const shader = compileShader(gl, gl.VERTEX_SHADER, 'shader source');
            expect(gl.createShader).toHaveBeenCalledWith(gl.VERTEX_SHADER);
            expect(gl.shaderSource).toHaveBeenCalled();
            expect(gl.compileShader).toHaveBeenCalled();
            expect(gl.getShaderParameter).toHaveBeenCalled();
            expect(shader).toBeDefined();
        });

        it('should throw an error if shader compilation fails', () => {
            gl.getShaderParameter.mockReturnValueOnce(false);
            expect(() => compileShader(gl, gl.VERTEX_SHADER, 'bad shader')).toThrow();
            expect(gl.deleteShader).toHaveBeenCalled();
        });
    });

    describe('createProgram', () => {
        it('should create a program successfully', () => {
            const vertexShader = {};
            const fragmentShader = {};
            const program = createProgram(gl, vertexShader, fragmentShader);
            expect(gl.createProgram).toHaveBeenCalled();
            expect(gl.attachShader).toHaveBeenCalledTimes(2);
            expect(gl.linkProgram).toHaveBeenCalled();
            expect(gl.getProgramParameter).toHaveBeenCalled();
            expect(program).toBeDefined();
        });

        it('should throw an error if program linking fails', () => {
            gl.getProgramParameter.mockReturnValueOnce(false);
            const vertexShader = {};
            const fragmentShader = {};
            expect(() => createProgram(gl, vertexShader, fragmentShader)).toThrow();
            expect(gl.deleteProgram).toHaveBeenCalled();
        });
    });

    describe('createBuffer', () => {
        it('should create and configure a buffer', () => {
            const data = new Float32Array([1, 2, 3, 4]);
            const buffer = createBuffer(gl, data);
            expect(gl.createBuffer).toHaveBeenCalled();
            expect(gl.bindBuffer).toHaveBeenCalledWith(gl.ARRAY_BUFFER, {});
            expect(gl.bufferData).toHaveBeenCalledWith(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
            expect(buffer).toBeDefined();
        });
    });

    describe('resizeCanvasToDisplaySize', () => {
        it('should resize the canvas if sizes differ', () => {
            // Setup initial dimensions
            canvas.width = 100;
            canvas.height = 100;

            // Mock clientWidth/clientHeight
            Object.defineProperty(canvas, 'clientWidth', { value: 200 });
            Object.defineProperty(canvas, 'clientHeight', { value: 200 });

            const resized = resizeCanvasToDisplaySize(canvas);

            expect(resized).toBe(true);
            expect(canvas.width).toBe(200);
            expect(canvas.height).toBe(200);
        });

        it('should not resize the canvas if sizes are the same', () => {
            // Setup initial dimensions
            canvas.width = 100;
            canvas.height = 100;

            // Mock clientWidth/clientHeight to be the same
            Object.defineProperty(canvas, 'clientWidth', { value: 100 });
            Object.defineProperty(canvas, 'clientHeight', { value: 100 });

            const resized = resizeCanvasToDisplaySize(canvas);

            expect(resized).toBe(false);
            expect(canvas.width).toBe(100);
            expect(canvas.height).toBe(100);
        });
    });
}); 