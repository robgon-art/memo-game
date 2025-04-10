import { System, system, component, field } from '@lastolivegames/becsy';
import {
    createWebGLContext,
    compileShader,
    createProgram,
    createBuffer,
    createTexture,
    resizeCanvasToDisplaySize
} from '../utils/webgl-utils';
import {
    CARD_VERTEX_SHADER,
    CARD_FRAGMENT_SHADER,
    QUAD_VERTICES
} from '../constants/shader-sources';

// Card Component (forward reference) - will be defined in components/card.ts
export interface CardComponent {
    id: number;
    value: number;
    isFlipped: boolean;
    isMatched: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
    flipProgress: number;
    texture?: HTMLImageElement;
}

// Renderable component
@component
export class RenderableComponent {
    @field.boolean declare isVisible: boolean;
}

// Card render component
@component
export class CardRenderComponent {
    @field.object declare texture: any;
    @field.boolean declare isTextureLoaded: boolean;
    @field.object declare textureUrl: string;
}

// Define interfaces for testing
export interface RenderableComponentInterface {
    isVisible: boolean;
}

export interface CardRenderComponentInterface {
    texture?: any;
    isTextureLoaded?: boolean;
    textureUrl?: string;
}

// Type to help with testing
export type WebGLContextOptions = {
    gl?: WebGLRenderingContext;
    canvas?: HTMLCanvasElement;
    skipInitialization?: boolean;
};

// Base class with shared functionality for testing
export class RenderSystemBase extends System {
    protected gl!: WebGLRenderingContext;
    protected canvas!: HTMLCanvasElement;
    protected program!: WebGLProgram;
    protected cardBackTexture!: WebGLTexture;
    protected cardFrontTextures: Map<number, WebGLTexture> = new Map();

    // Attribute and uniform locations
    protected positionLocation!: number;
    protected texcoordLocation!: number;
    protected matrixLocation!: WebGLUniformLocation | null;
    protected textureLocation!: WebGLUniformLocation | null;
    protected flipProgressLocation!: WebGLUniformLocation | null;
    protected highlightLocation!: WebGLUniformLocation | null;

    // Buffer for vertices
    protected quadBuffer!: WebGLBuffer;

    // Query results
    queries: {
        cards: {
            results: CardComponent[];
            added?: CardComponent[];
            removed?: CardComponent[];
            changed?: CardComponent[];
        };
    } = {} as any;

    // Helper method to create transformation matrix for card positioning
    createCardMatrix(x: number, y: number, width: number, height: number, rotation: number): Float32Array {
        // Get dimensions for calculations
        const canvasWidth = this.canvas ? this.canvas.width : 800;
        const canvasHeight = this.canvas ? this.canvas.height : 600;

        // Create individual matrices
        const projectionMatrix = this.createProjectionMatrix(canvasWidth, canvasHeight);
        const translationMatrix = this.createTranslationMatrix(x, y);
        const rotationMatrix = this.createRotationMatrix(rotation);
        const scaleMatrix = this.createScaleMatrix(width, height);

        // Multiply matrices to create final transformation matrix
        // Order: projection * translation * rotation * scale
        return this.multiplyMatrices(
            this.multiplyMatrices(
                this.multiplyMatrices(projectionMatrix, translationMatrix),
                rotationMatrix
            ),
            scaleMatrix
        );
    }

    // Matrix multiplication helper (4x4 matrices stored as column-major Float32Arrays)
    multiplyMatrices(a: Float32Array, b: Float32Array): Float32Array {
        const result = new Float32Array(16);

        // For each row and column of the result matrix
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                // Calculate dot product of row i from a and column j from b
                let sum = 0;
                for (let k = 0; k < 4; k++) {
                    sum += a[i + k * 4] * b[k + j * 4];
                }
                result[i + j * 4] = sum;
            }
        }

        return result;
    }

    // Create a projection matrix for WebGL rendering
    createProjectionMatrix(width: number, height: number): Float32Array {
        return new Float32Array([
            2 / width, 0, 0, 0,
            0, -2 / height, 0, 0,
            0, 0, 1, 0,
            -1, 1, 0, 1
        ]);
    }

    // Create a translation matrix
    createTranslationMatrix(x: number, y: number): Float32Array {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, 0, 1
        ]);
    }

    // Create a rotation matrix
    createRotationMatrix(angle: number): Float32Array {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return new Float32Array([
            c, s, 0, 0,
            -s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    // Create a scaling matrix
    createScaleMatrix(width: number, height: number): Float32Array {
        return new Float32Array([
            width, 0, 0, 0,
            0, height, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }
}

// WebGL Render System - real implementation for the game
@system
export class RenderSystem extends RenderSystemBase {
    // Initialization
    async initialize(options: WebGLContextOptions = {}): Promise<void> {
        // No need to set up query here, it's defined in static queries

        // Skip initialization if requested (for testing)
        if (options.skipInitialization) {
            if (options.gl) this.gl = options.gl;
            if (options.canvas) this.canvas = options.canvas;
            return;
        }

        // Get or create canvas
        this.canvas = options.canvas || document.querySelector('#game-board-canvas') as HTMLCanvasElement;

        if (!this.canvas) {
            // Create canvas if it doesn't exist
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'game-board-canvas';
            this.canvas.width = 800;
            this.canvas.height = 600;

            // Append canvas to game board
            const gameBoard = document.querySelector('#game-board');
            if (gameBoard) {
                gameBoard.appendChild(this.canvas);
            } else {
                document.body.appendChild(this.canvas);
            }
        }

        // Initialize WebGL context
        this.gl = options.gl || createWebGLContext(this.canvas);

        // Compile shaders and create program
        const vertexShader = compileShader(this.gl, this.gl.VERTEX_SHADER, CARD_VERTEX_SHADER);
        const fragmentShader = compileShader(this.gl, this.gl.FRAGMENT_SHADER, CARD_FRAGMENT_SHADER);
        this.program = createProgram(this.gl, vertexShader, fragmentShader);

        // Get attribute and uniform locations
        this.positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.texcoordLocation = this.gl.getAttribLocation(this.program, 'a_texcoord');
        this.matrixLocation = this.gl.getUniformLocation(this.program, 'u_matrix');
        this.textureLocation = this.gl.getUniformLocation(this.program, 'u_texture');
        this.flipProgressLocation = this.gl.getUniformLocation(this.program, 'u_flip_progress');
        this.highlightLocation = this.gl.getUniformLocation(this.program, 'u_highlight');

        // Create buffers
        this.quadBuffer = createBuffer(this.gl, QUAD_VERTICES);

        // Default card back texture (placeholder)
        const cardBackImg = new Image();
        cardBackImg.src = 'images/ui/card-back.png';

        // Load card back texture when image is loaded
        await new Promise<void>((resolve) => {
            cardBackImg.onload = () => {
                this.cardBackTexture = createTexture(this.gl, cardBackImg);
                resolve();
            };

            // Handle loading error
            cardBackImg.onerror = () => {
                console.error('Failed to load card back texture');
                // Create a fallback texture (blue color)
                const fallbackData = new Uint8Array([0, 0, 255, 255]);
                this.cardBackTexture = this.gl.createTexture()!;
                this.gl.bindTexture(this.gl.TEXTURE_2D, this.cardBackTexture);
                this.gl.texImage2D(
                    this.gl.TEXTURE_2D, 0, this.gl.RGBA,
                    1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE,
                    fallbackData
                );
                resolve();
            };
        });

        // Enable alpha blending
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }

    // Define queries
    static queries = {
        cards: { has: ['Card', 'RenderableComponent', 'CardRenderComponent'] }
    };

    // System execution (per frame)
    execute(): void {
        // Skip execution if not initialized (for testing)
        if (!this.gl) return;

        // Resize canvas if needed
        if (resizeCanvasToDisplaySize(this.canvas)) {
            this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        }

        // Clear the canvas
        this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // Use our shader program
        this.gl.useProgram(this.program);

        // Set up geometry
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);

        // Set up position attribute
        this.gl.enableVertexAttribArray(this.positionLocation);
        this.gl.vertexAttribPointer(
            this.positionLocation,
            2,       // 2 components per vertex (x, y)
            this.gl.FLOAT,
            false,   // don't normalize
            16,      // stride (4 values * 4 bytes)
            0        // offset
        );

        // Set up texture coordinate attribute
        this.gl.enableVertexAttribArray(this.texcoordLocation);
        this.gl.vertexAttribPointer(
            this.texcoordLocation,
            2,       // 2 components per texcoord (s, t)
            this.gl.FLOAT,
            false,   // don't normalize
            16,      // stride (4 values * 4 bytes)
            8        // offset (skip first 2 floats * 4 bytes)
        );

        // Set texture unit 0
        this.gl.uniform1i(this.textureLocation, 0);

        // Render each card
        for (const entity of this.queries.cards.results) {
            const card = entity as unknown as CardComponent;
            const renderable = entity as unknown as RenderableComponentInterface;
            const cardRender = entity as unknown as CardRenderComponentInterface;

            // Skip non-visible entities
            if (renderable.isVisible === false) {
                continue;
            }

            // Calculate card position (translate from game coordinates to clip space)
            const matrix = this.createCardMatrix(
                card.x,
                card.y,
                card.width,
                card.height,
                card.isFlipped ? Math.PI : 0
            );

            // Set matrix uniform
            this.gl.uniformMatrix4fv(this.matrixLocation, false, matrix);

            // Set flip progress uniform
            this.gl.uniform1f(this.flipProgressLocation, card.flipProgress);

            // Set highlight uniform (1.0 if matched, 0.0 otherwise)
            this.gl.uniform1f(this.highlightLocation, card.isMatched ? 1.0 : 0.0);

            // Select texture based on card state
            if (card.isFlipped) {
                // Use front texture if we have it
                const frontTexture = this.cardFrontTextures.get(card.value);
                if (frontTexture) {
                    this.gl.bindTexture(this.gl.TEXTURE_2D, frontTexture);
                } else if (card.texture && cardRender.isTextureLoaded) {
                    // Create texture from loaded image if we don't have it cached
                    const newTexture = createTexture(this.gl, card.texture);
                    this.cardFrontTextures.set(card.value, newTexture);
                    this.gl.bindTexture(this.gl.TEXTURE_2D, newTexture);
                } else {
                    // Fallback to default texture
                    this.gl.bindTexture(this.gl.TEXTURE_2D, this.cardBackTexture);
                }
            } else {
                // Use card back texture
                this.gl.bindTexture(this.gl.TEXTURE_2D, this.cardBackTexture);
            }

            // Draw the card (2 triangles = 6 vertices)
            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        }
    }
} 