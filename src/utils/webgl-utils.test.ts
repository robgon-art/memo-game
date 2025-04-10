import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    createWebGLContext,
    compileShader,
    createProgram,
    createBuffer,
    resizeCanvasToDisplaySize,
    composeGL,
    pipeGL,
    createShaderCompiler,
    createBufferFactory,
    createViewportSettings,
    applyViewport,
    setupRenderingPipeline,
    createShaderOp,
    executeShaderOp,
    createProgramOp,
    createBufferOp,
    createTextureOp,
    createViewportOp,
    executeOperations,
    createProjectionMatrix,
    createTranslationMatrix,
    createRotationMatrix,
    createScaleMatrix,
    multiplyMatrices,
    createCardMatrix,
    WebGLOp
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
    viewport = vi.fn();
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

    // Test new functional programming utilities
    describe('composeGL', () => {
        it('should compose WebGL operations', () => {
            const addA = (x: any) => x + 'A';
            const addB = (x: any) => x + 'B';
            const composed = composeGL<string>(addA, addB);

            // Call with a mock WebGL context
            const result = composed(gl as unknown as WebGLRenderingContext);
            expect(result).toBe('[object Object]BA');
        });
    });

    describe('pipeGL', () => {
        it('should pipe WebGL operations', () => {
            const operation1 = (_: WebGLRenderingContext) => 'step1';
            const operation2 = (result: any) => result + '-step2';
            const result = pipeGL<string>(gl as unknown as WebGLRenderingContext, operation1, operation2);
            expect(result).toBe('step1-step2');
        });
    });

    describe('createShaderCompiler', () => {
        it('should create a shader compiler with fixed type', () => {
            const vertexShaderCompiler = createShaderCompiler(gl.VERTEX_SHADER);
            vertexShaderCompiler(gl, 'shader source');
            expect(gl.createShader).toHaveBeenCalledWith(gl.VERTEX_SHADER);
        });
    });

    describe('createBufferFactory', () => {
        it('should create a buffer factory with predetermined settings', () => {
            const elementArrayBufferFactory = createBufferFactory(gl.ARRAY_BUFFER, gl.STATIC_DRAW);
            const data = new Float32Array([1, 2, 3, 4]);
            elementArrayBufferFactory(gl, data);
            expect(gl.bindBuffer).toHaveBeenCalledWith(gl.ARRAY_BUFFER, {});
            expect(gl.bufferData).toHaveBeenCalledWith(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        });
    });

    describe('createViewportSettings', () => {
        it('should create viewport settings from canvas', () => {
            canvas.width = 800;
            canvas.height = 600;
            const settings = createViewportSettings(canvas);
            expect(settings).toEqual({
                x: 0,
                y: 0,
                width: 800,
                height: 600
            });
        });
    });

    describe('applyViewport', () => {
        it('should apply viewport settings to GL context', () => {
            const settings = { x: 0, y: 0, width: 800, height: 600 };
            applyViewport(gl, settings);
            expect(gl.viewport).toHaveBeenCalledWith(0, 0, 800, 600);
        });
    });

    // Test new operation representation utilities
    describe('Operation Representation', () => {
        describe('createShaderOp', () => {
            it('should create a shader operation representation', () => {
                const op = createShaderOp(gl.VERTEX_SHADER, 'vertex shader source');
                expect(op).toEqual({
                    type: 'compileShader',
                    params: [gl.VERTEX_SHADER, 'vertex shader source']
                });
            });
        });

        describe('executeShaderOp', () => {
            it('should execute a shader operation', () => {
                const op = createShaderOp(gl.VERTEX_SHADER, 'vertex shader source');
                executeShaderOp(gl, op);
                expect(gl.createShader).toHaveBeenCalledWith(gl.VERTEX_SHADER);
                expect(gl.shaderSource).toHaveBeenCalledWith({}, 'vertex shader source');
            });

            it('should throw if given wrong operation type', () => {
                const op = { type: 'wrongType', params: [] };
                expect(() => executeShaderOp(gl, op)).toThrow('Expected compileShader operation');
            });
        });

        describe('createProgramOp', () => {
            it('should create a program operation representation', () => {
                const vertexShader = { type: 'vertex' };
                const fragmentShader = { type: 'fragment' };
                const op = createProgramOp(vertexShader as any, fragmentShader as any);
                expect(op).toEqual({
                    type: 'createProgram',
                    params: [vertexShader, fragmentShader]
                });
            });
        });
    });

    // Test matrix operations - these are pure functions, no mocks needed!
    describe('Matrix Operations', () => {
        describe('createProjectionMatrix', () => {
            it('should create a valid projection matrix', () => {
                const width = 800;
                const height = 600;
                const matrix = createProjectionMatrix(width, height);
                
                // Test critical values in the matrix
                expect(matrix[0]).toBeCloseTo(2 / width);  // 2/width in [0,0]
                expect(matrix[5]).toBeCloseTo(-2 / height); // -2/height in [1,1]
                expect(matrix[12]).toBe(-1); // -1 in [3,0]
                expect(matrix[13]).toBe(1);  // 1 in [3,1]
            });
        });

        describe('createTranslationMatrix', () => {
            it('should create a valid translation matrix', () => {
                const x = 100;
                const y = 200;
                const matrix = createTranslationMatrix(x, y);
                
                expect(matrix[12]).toBe(x); // x in [3,0]
                expect(matrix[13]).toBe(y); // y in [3,1]
            });
        });

        describe('createRotationMatrix', () => {
            it('should create a valid rotation matrix', () => {
                const angle = Math.PI / 4; // 45 degrees
                const matrix = createRotationMatrix(angle);
                
                const c = Math.cos(angle);
                const s = Math.sin(angle);
                
                expect(matrix[0]).toBeCloseTo(c); // cos in [0,0]
                expect(matrix[1]).toBeCloseTo(s); // sin in [0,1]
                expect(matrix[4]).toBeCloseTo(-s); // -sin in [1,0]
                expect(matrix[5]).toBeCloseTo(c);  // cos in [1,1]
            });
        });

        describe('createScaleMatrix', () => {
            it('should create a valid scale matrix', () => {
                const width = 2;
                const height = 3;
                const matrix = createScaleMatrix(width, height);
                
                expect(matrix[0]).toBe(width);  // width in [0,0]
                expect(matrix[5]).toBe(height); // height in [1,1]
            });
        });

        describe('multiplyMatrices', () => {
            it('should correctly multiply two matrices', () => {
                // Identity matrix
                const identity = new Float32Array([
                    1, 0, 0, 0,
                    0, 1, 0, 0,
                    0, 0, 1, 0,
                    0, 0, 0, 1
                ]);
                
                // Translation matrix (translate by 10, 20)
                const translation = new Float32Array([
                    1, 0, 0, 0,
                    0, 1, 0, 0,
                    0, 0, 1, 0,
                    10, 20, 0, 1
                ]);
                
                // Result should be the translation matrix when multiplied with identity
                const result = multiplyMatrices(identity, translation);
                
                expect(Array.from(result)).toEqual(Array.from(translation));
            });

            it('should combine translation matrices correctly', () => {
                // Translation matrix 1 (translate by 10, 20)
                const translation1 = new Float32Array([
                    1, 0, 0, 0,
                    0, 1, 0, 0,
                    0, 0, 1, 0,
                    10, 20, 0, 1
                ]);
                
                // Translation matrix 2 (translate by 5, 7)
                const translation2 = new Float32Array([
                    1, 0, 0, 0,
                    0, 1, 0, 0,
                    0, 0, 1, 0,
                    5, 7, 0, 1
                ]);
                
                // Result should translate by 15, 27
                const result = multiplyMatrices(translation1, translation2);
                
                expect(result[12]).toBe(15); // x = 10 + 5
                expect(result[13]).toBe(27); // y = 20 + 7
            });
        });

        describe('createCardMatrix', () => {
            it('should create a transformation matrix for a card', () => {
                const x = 100;
                const y = 200;
                const width = 50;
                const height = 75;
                const rotation = 0;
                const canvasWidth = 800;
                const canvasHeight = 600;
                
                const matrix = createCardMatrix(
                    x, y, width, height, rotation, canvasWidth, canvasHeight
                );
                
                // Test that the matrix is valid
                expect(matrix).toBeInstanceOf(Float32Array);
                expect(matrix.length).toBe(16);
                
                // With zero rotation, we can verify certain properties
                // The scale factors should be in the matrix
                expect(matrix[0]).toBeCloseTo(2 * width / canvasWidth);  // Scale x * projection
                expect(matrix[5]).toBeCloseTo(-2 * height / canvasHeight); // Scale y * projection
                
                // TODO: Test more matrix properties if needed
            });
        });
    });

    describe('executeOperations', () => {
        it('should execute a sequence of operations', () => {
            // Create a sequence of operations
            const ops: WebGLOp[] = [
                createShaderOp(gl.VERTEX_SHADER, 'vertex shader'),
                createShaderOp(gl.FRAGMENT_SHADER, 'fragment shader'),
                createViewportOp(0, 0, 800, 600)
            ];
            
            // Execute them
            executeOperations(gl, ops);
            
            // Verify the operations were called correctly
            expect(gl.createShader).toHaveBeenCalledTimes(2);
            expect(gl.viewport).toHaveBeenCalledWith(0, 0, 800, 600);
        });
        
        it('should execute buffer operations', () => {
            // Create test data
            const data = new Float32Array([1, 2, 3, 4]);
            const bufferOp = createBufferOp(data, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
            
            // Execute buffer operation
            executeOperations(gl, [bufferOp]);
            
            // Verify buffer creation was called
            expect(gl.createBuffer).toHaveBeenCalled();
            expect(gl.bindBuffer).toHaveBeenCalledWith(gl.ARRAY_BUFFER, {});
            expect(gl.bufferData).toHaveBeenCalledWith(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        });
        
        it('should execute texture operations', () => {
            // Create a mock image
            const mockImage = {} as HTMLImageElement;
            const textureOp = createTextureOp(mockImage);
            
            // Execute texture operation
            executeOperations(gl, [textureOp]);
            
            // Verify texture creation was called
            expect(gl.createTexture).toHaveBeenCalled();
            expect(gl.bindTexture).toHaveBeenCalledWith(gl.TEXTURE_2D, {});
            expect(gl.texImage2D).toHaveBeenCalled();
            expect(gl.texParameteri).toHaveBeenCalled();
        });
        
        it('should execute program operations', () => {
            // Create shader and program operations
            const vertexShader = {} as WebGLShader;
            const fragmentShader = {} as WebGLShader;
            const programOp = createProgramOp(vertexShader, fragmentShader);
            
            // Execute program operation
            executeOperations(gl, [programOp]);
            
            // Verify program creation was called
            expect(gl.createProgram).toHaveBeenCalled();
            expect(gl.attachShader).toHaveBeenCalledTimes(2);
            expect(gl.linkProgram).toHaveBeenCalled();
        });
        
        it('should throw on unknown operation type', () => {
            const badOp = { type: 'unknownOp', params: [] };
            expect(() => executeOperations(gl, [badOp])).toThrow('Unknown operation type');
        });
    });

    describe('setupRenderingPipeline', () => {
        it('should set up a complete rendering pipeline', () => {
            const vertexShaderSource = 'vertex shader';
            const fragmentShaderSource = 'fragment shader';
            
            const result = setupRenderingPipeline(canvas, vertexShaderSource, fragmentShaderSource);
            
            expect(result.gl).toBe(gl);
            expect(result.program).toBeDefined();
            expect(result.operations).toHaveLength(4); // 2 shaders, 1 program, 1 viewport
            expect(gl.createShader).toHaveBeenCalledTimes(2);
            expect(gl.createProgram).toHaveBeenCalled();
            expect(gl.viewport).toHaveBeenCalled();
        });
    });
}); 