import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RenderSystem } from './render-system';

// Mock Becsy
vi.mock('@lastolivegames/becsy', () => {
    return {
        System: class MockSystem { },
        system: function (target: any) { return target; },
        component: function (target: any) { return target; },
        field: {
            boolean: vi.fn(),
            int32: vi.fn(),
            float64: vi.fn(),
            object: vi.fn()
        }
    };
});

// Minimal WebGL Mock
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
    COLOR_BUFFER_BIT = 'COLOR_BUFFER_BIT';
    BLEND = 'BLEND';
    SRC_ALPHA = 'SRC_ALPHA';
    ONE_MINUS_SRC_ALPHA = 'ONE_MINUS_SRC_ALPHA';
    FLOAT = 'FLOAT';
    TRIANGLE_STRIP = 'TRIANGLE_STRIP';

    canvas = { width: 800, height: 600 };

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
    getAttribLocation = vi.fn().mockReturnValue(0);
    getUniformLocation = vi.fn().mockReturnValue({});
    createBuffer = vi.fn().mockReturnValue({});
    bindBuffer = vi.fn();
    bufferData = vi.fn();
    createTexture = vi.fn().mockReturnValue({});
    bindTexture = vi.fn();
    texImage2D = vi.fn();
    texParameteri = vi.fn();
    viewport = vi.fn();
    enable = vi.fn();
    blendFunc = vi.fn();
    clearColor = vi.fn();
    clear = vi.fn();
    useProgram = vi.fn();
    enableVertexAttribArray = vi.fn();
    vertexAttribPointer = vi.fn();
    uniform1i = vi.fn();
    uniformMatrix4fv = vi.fn();
    uniform1f = vi.fn();
    drawArrays = vi.fn();
}

// Test-friendly interface to access protected members
interface TestableRenderSystem {
    gl: WebGLRenderingContext;
    canvas: HTMLCanvasElement;
    program: WebGLProgram;
    cardBackTexture: WebGLTexture;
    quadBuffer: WebGLBuffer;
    positionLocation: number;
    texcoordLocation: number;
    matrixLocation: WebGLUniformLocation | null;
    flipProgressLocation: WebGLUniformLocation | null;
    highlightLocation: WebGLUniformLocation | null;
    textureLocation: WebGLUniformLocation | null;
    createCanvas: () => HTMLCanvasElement;
    initializeWebGLResources: (gl: WebGLRenderingContext) => any;
    setupRenderingContext: () => void;
    renderCard: (config: any) => void;
    bindCardTexture: (card: any, cardRender: any) => void;
}

describe('RenderSystem', () => {
    // Test pure, static matrix functions first
    describe('Matrix Functions (Pure Static)', () => {
        it('should create a projection matrix', () => {
            const projMatrix = RenderSystem.createProjectionMatrix(800, 600);
            expect(projMatrix).toBeInstanceOf(Float32Array);
            expect(projMatrix.length).toBe(16);
            expect(projMatrix[0]).toBeCloseTo(0.0025); // 2/800
            expect(projMatrix[5]).toBeCloseTo(-0.0033); // -2/600
            expect(projMatrix[12]).toBe(-1); // x translation
            expect(projMatrix[13]).toBe(1); // y translation
        });

        it('should create a translation matrix', () => {
            const transMatrix = RenderSystem.createTranslationMatrix(100, 200);
            expect(transMatrix).toBeInstanceOf(Float32Array);
            expect(transMatrix.length).toBe(16);
            expect(transMatrix[12]).toBe(100); // x translation
            expect(transMatrix[13]).toBe(200); // y translation
        });

        it('should create a rotation matrix', () => {
            const rotMatrix = RenderSystem.createRotationMatrix(Math.PI / 2); // 90 degrees
            expect(rotMatrix).toBeInstanceOf(Float32Array);
            expect(rotMatrix.length).toBe(16);
            expect(rotMatrix[0]).toBeCloseTo(0); // cos(90)
            expect(rotMatrix[1]).toBeCloseTo(1); // sin(90)
            expect(rotMatrix[4]).toBeCloseTo(-1); // -sin(90)
            expect(rotMatrix[5]).toBeCloseTo(0); // cos(90)
        });

        it('should create a scale matrix', () => {
            const scaleMatrix = RenderSystem.createScaleMatrix(150, 250);
            expect(scaleMatrix).toBeInstanceOf(Float32Array);
            expect(scaleMatrix.length).toBe(16);
            expect(scaleMatrix[0]).toBe(150); // x scale
            expect(scaleMatrix[5]).toBe(250); // y scale
        });

        it('should multiply matrices correctly', () => {
            // Identity matrix
            const identityMatrix = new Float32Array([
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            ]);

            // Translation matrix (10,20,0)
            const translationMatrix = RenderSystem.createTranslationMatrix(10, 20);

            // Multiplying by identity should return the original matrix
            const result = RenderSystem.multiplyMatrices(identityMatrix, translationMatrix);
            expect(result).toBeInstanceOf(Float32Array);
            expect(result.length).toBe(16);

            // Compare with original translation matrix
            for (let i = 0; i < 16; i++) {
                expect(result[i]).toBeCloseTo(translationMatrix[i]);
            }
        });

        it('should compose a card matrix correctly', () => {
            const x = 100, y = 200, width = 80, height = 120, rotation = Math.PI;
            const cardMatrix = RenderSystem.createCardMatrix(x, y, width, height, rotation, 800, 600);

            expect(cardMatrix).toBeInstanceOf(Float32Array);
            expect(cardMatrix.length).toBe(16);

            // Test the matrix components directly instead of transforming points
            // In our implementation, the matrix is composed as:
            // projection * translation * rotation * scale

            // For a 180 degree rotation (PI), the rotation matrix has:
            // cos(PI) = -1, sin(PI) = 0
            // So the rotation component should flip x and y

            // Check specific matrix elements that would indicate correct composition
            // Test that width and height scaling is applied
            // At 180 degree rotation, width should be negative in the matrix
            expect(Math.abs(cardMatrix[0])).toBeCloseTo(width * (2 / 800));  // Scale * projection
            expect(Math.abs(cardMatrix[5])).toBeCloseTo(height * (2 / 600)); // Scale * projection

            // Test translation is correct (after projection)
            // These may need adjustment based on exact implementation
            const projectedX = x * (2 / 800) - 1;   // x * projection scale + offset
            const projectedY = -y * (2 / 600) + 1;  // y * projection scale + offset

            // Get equivalent elements from the matrix
            const matrixX = cardMatrix[12];  // Translation x
            const matrixY = cardMatrix[13];  // Translation y

            // These values might need tolerance adjustment
            expect(Math.abs(matrixX)).toBeCloseTo(Math.abs(projectedX), 1);
            expect(Math.abs(matrixY)).toBeCloseTo(Math.abs(projectedY), 1);
        });
    });

    describe('RenderSystem Instance', () => {
        let renderSystem: RenderSystem;
        let testableSystem: TestableRenderSystem;
        let canvas: HTMLCanvasElement;
        let gl: MockWebGLRenderingContext;

        beforeEach(() => {
            // Set up the render system
            renderSystem = new RenderSystem();
            testableSystem = renderSystem as unknown as TestableRenderSystem;

            // Create a real canvas for some tests
            canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 600;

            // Create mock GL context
            gl = new MockWebGLRenderingContext();

            // Set up the document for queries
            document.body.innerHTML = '<div id="game-board"></div>';
        });

        it('should create a canvas element if needed', () => {
            // Call the private method directly using our test interface
            const newCanvas = testableSystem.createCanvas();

            expect(newCanvas).toBeInstanceOf(HTMLCanvasElement);
            expect(newCanvas.id).toBe('game-board-canvas');
            expect(newCanvas.width).toBe(800);
            expect(newCanvas.height).toBe(600);

            // Check if it was appended to game-board
            const gameBoard = document.querySelector('#game-board');
            expect(gameBoard?.contains(newCanvas)).toBe(true);
        });

        it('should initialize WebGL resources correctly', () => {
            const resources = testableSystem.initializeWebGLResources(gl as unknown as WebGLRenderingContext);

            expect(resources).toHaveProperty('program');
            expect(resources).toHaveProperty('locations');
            expect(resources).toHaveProperty('buffer');

            expect(gl.createShader).toHaveBeenCalledTimes(2);
            expect(gl.shaderSource).toHaveBeenCalledTimes(2);
            expect(gl.compileShader).toHaveBeenCalledTimes(2);
            expect(gl.createProgram).toHaveBeenCalled();
            expect(gl.linkProgram).toHaveBeenCalled();
            expect(gl.getAttribLocation).toHaveBeenCalledTimes(2);
            expect(gl.getUniformLocation).toHaveBeenCalledTimes(4);
            expect(gl.createBuffer).toHaveBeenCalled();
        });

        it('should setup rendering context correctly', () => {
            // Set up necessary properties through our test interface
            testableSystem.gl = gl as unknown as WebGLRenderingContext;
            testableSystem.canvas = canvas;
            testableSystem.program = {} as WebGLProgram;
            testableSystem.quadBuffer = {} as WebGLBuffer;
            testableSystem.positionLocation = 0;
            testableSystem.texcoordLocation = 1;
            testableSystem.textureLocation = {} as WebGLUniformLocation;

            // Call the method
            testableSystem.setupRenderingContext();

            expect(gl.viewport).toHaveBeenCalled();
            expect(gl.clearColor).toHaveBeenCalledWith(0.1, 0.1, 0.1, 1.0);
            expect(gl.clear).toHaveBeenCalled();
            expect(gl.useProgram).toHaveBeenCalled();
            expect(gl.bindBuffer).toHaveBeenCalled();
            expect(gl.enableVertexAttribArray).toHaveBeenCalledTimes(2);
            expect(gl.vertexAttribPointer).toHaveBeenCalledTimes(2);
            expect(gl.uniform1i).toHaveBeenCalled();
        });

        it('should render a card correctly', () => {
            // Set up necessary properties through our test interface
            testableSystem.gl = gl as unknown as WebGLRenderingContext;
            testableSystem.cardBackTexture = {} as WebGLTexture;
            testableSystem.matrixLocation = {} as WebGLUniformLocation;
            testableSystem.flipProgressLocation = {} as WebGLUniformLocation;
            testableSystem.highlightLocation = {} as WebGLUniformLocation;

            // Create a test card configuration
            const cardConfig = {
                card: {
                    id: 1,
                    value: 5,
                    isFlipped: false,
                    isMatched: true,
                    x: 100,
                    y: 200,
                    width: 80,
                    height: 120,
                    flipProgress: 0.5
                },
                renderable: {
                    isVisible: true
                },
                cardRender: {
                    texture: null,
                    isTextureLoaded: false,
                    textureUrl: 'test.png'
                },
                matrix: new Float32Array(16)
            };

            // Call the method through our test interface
            testableSystem.renderCard(cardConfig);

            expect(gl.uniformMatrix4fv).toHaveBeenCalled();
            expect(gl.uniform1f).toHaveBeenCalledTimes(2);
            expect(gl.bindTexture).toHaveBeenCalled();
            expect(gl.drawArrays).toHaveBeenCalledWith(gl.TRIANGLE_STRIP, 0, 4);
        });

        it('should initialize with provided options', async () => {
            const options = {
                gl: gl as unknown as WebGLRenderingContext,
                canvas,
                skipInitialization: true
            };

            await renderSystem.initialize(options);

            // Access through test interface
            expect(testableSystem.gl).toBe(gl);
            expect(testableSystem.canvas).toBe(canvas);
        });

        it('should filter visible cards and generate render configs', () => {
            // Setup the system
            testableSystem.canvas = canvas;

            // Mock query results
            renderSystem.queries = {
                cards: {
                    results: [
                        {
                            id: 1,
                            value: 1,
                            isFlipped: false,
                            isMatched: false,
                            x: 100,
                            y: 100,
                            width: 80,
                            height: 120,
                            flipProgress: 0,
                            isVisible: true,
                            texture: null,
                            isTextureLoaded: false,
                            textureUrl: 'test.png'
                        },
                        {
                            id: 2,
                            value: 2,
                            isFlipped: true,
                            isMatched: true,
                            x: 200,
                            y: 100,
                            width: 80,
                            height: 120,
                            flipProgress: 1,
                            isVisible: true,
                            texture: null,
                            isTextureLoaded: false,
                            textureUrl: 'test.png'
                        },
                        {
                            id: 3,
                            value: 3,
                            isFlipped: false,
                            isMatched: false,
                            x: 300,
                            y: 100,
                            width: 80,
                            height: 120,
                            flipProgress: 0,
                            isVisible: false, // This one should be filtered out
                            texture: null,
                            isTextureLoaded: false,
                            textureUrl: 'test.png'
                        }
                    ]
                }
            } as any;

            // Mock the execute method implementation to test the filtering and mapping
            testableSystem.gl = gl as unknown as WebGLRenderingContext;
            testableSystem.setupRenderingContext = vi.fn();
            testableSystem.renderCard = vi.fn();

            // Call execute
            renderSystem.execute();

            // Verify filtering (only 2 cards should remain)
            expect(testableSystem.renderCard).toHaveBeenCalledTimes(2);

            // Verify the first card config
            const firstCallArg = (testableSystem.renderCard as any).mock.calls[0][0];
            expect(firstCallArg.card.id).toBe(1);
            expect(firstCallArg.matrix).toBeInstanceOf(Float32Array);

            // Verify the second card config
            const secondCallArg = (testableSystem.renderCard as any).mock.calls[1][0];
            expect(secondCallArg.card.id).toBe(2);
            expect(secondCallArg.card.isFlipped).toBe(true);
        });
    });
}); 