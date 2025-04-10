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

// Type for render config
export type RenderConfig = {
    card: CardComponent;
    renderable: RenderableComponentInterface;
    cardRender: CardRenderComponentInterface;
    matrix: Float32Array;
};

// Combined RenderSystem class with functional approach
@system
export class RenderSystem extends System {
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

    // Define queries
    static queries = {
        cards: { has: ['Card', 'RenderableComponent', 'CardRenderComponent'] }
    };

    // Initialization
    async initialize(options: WebGLContextOptions = {}): Promise<void> {
        // Skip initialization if requested (for testing)
        if (options.skipInitialization) {
            if (options.gl) this.gl = options.gl;
            if (options.canvas) this.canvas = options.canvas;
            return;
        }

        // Get or create canvas (immutable approach)
        this.canvas = options.canvas ?? 
            document.querySelector('#game-board-canvas') as HTMLCanvasElement ?? 
            this.createCanvas();

        // Initialize WebGL context
        this.gl = options.gl || createWebGLContext(this.canvas);

        // Initialize WebGL resources (functional composition)
        const { program, locations, buffer } = this.initializeWebGLResources(this.gl);
        this.program = program;
        this.positionLocation = locations.positionLocation;
        this.texcoordLocation = locations.texcoordLocation;
        this.matrixLocation = locations.matrixLocation;
        this.textureLocation = locations.textureLocation;
        this.flipProgressLocation = locations.flipProgressLocation;
        this.highlightLocation = locations.highlightLocation;
        this.quadBuffer = buffer;

        // Load textures
        this.cardBackTexture = await this.loadCardBackTexture(this.gl);

        // Enable alpha blending
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }

    // Pure function to create a new canvas
    private createCanvas(): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.id = 'game-board-canvas';
        canvas.width = 800;
        canvas.height = 600;

        // Find target element and append canvas
        const gameBoard = document.querySelector('#game-board');
        if (gameBoard) {
            gameBoard.appendChild(canvas);
        } else {
            document.body.appendChild(canvas);
        }
        
        return canvas;
    }

    // Pure function to initialize WebGL resources
    private initializeWebGLResources(gl: WebGLRenderingContext) {
        // Compile shaders and create program
        const vertexShader = compileShader(gl, gl.VERTEX_SHADER, CARD_VERTEX_SHADER);
        const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, CARD_FRAGMENT_SHADER);
        const program = createProgram(gl, vertexShader, fragmentShader);

        // Get attribute and uniform locations
        const locations = {
            positionLocation: gl.getAttribLocation(program, 'a_position'),
            texcoordLocation: gl.getAttribLocation(program, 'a_texcoord'),
            matrixLocation: gl.getUniformLocation(program, 'u_matrix'),
            textureLocation: gl.getUniformLocation(program, 'u_texture'),
            flipProgressLocation: gl.getUniformLocation(program, 'u_flip_progress'),
            highlightLocation: gl.getUniformLocation(program, 'u_highlight'),
        };

        // Create buffers
        const buffer = createBuffer(gl, QUAD_VERTICES);

        return { program, locations, buffer };
    }

    // Promise-based texture loading (pure function)
    private async loadCardBackTexture(gl: WebGLRenderingContext): Promise<WebGLTexture> {
        return new Promise((resolve) => {
            const cardBackImg = new Image();
            cardBackImg.src = 'images/ui/card-back.png';

            cardBackImg.onload = () => {
                resolve(createTexture(gl, cardBackImg));
            };

            cardBackImg.onerror = () => {
                console.error('Failed to load card back texture');
                // Create a fallback texture (blue color)
                const fallbackData = new Uint8Array([0, 0, 255, 255]);
                const texture = gl.createTexture()!;
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(
                    gl.TEXTURE_2D, 0, gl.RGBA,
                    1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                    fallbackData
                );
                resolve(texture);
            };
        });
    }

    // System execution (per frame) using functional patterns
    execute(): void {
        // Guard clause - skip execution if not initialized
        if (!this.gl) return;

        // Setup rendering context
        this.setupRenderingContext();

        // Filter visible cards
        const visibleCards = this.queries.cards.results.filter(entity => {
            const renderable = entity as unknown as RenderableComponentInterface;
            return renderable.isVisible !== false;
        });

        // Transform cards into render configs
        const renderConfigs = visibleCards.map(entity => {
            const card = entity as unknown as CardComponent;
            const renderable = entity as unknown as RenderableComponentInterface;
            const cardRender = entity as unknown as CardRenderComponentInterface;
            
            // Calculate card matrix using pure static method
            const matrix = RenderSystem.createCardMatrix(
                card.x,
                card.y,
                card.width,
                card.height,
                card.isFlipped ? Math.PI : 0,
                this.canvas.width,
                this.canvas.height
            );
            
            return { card, renderable, cardRender, matrix };
        });

        // Render each card using the configurations
        renderConfigs.forEach(config => this.renderCard(config));
    }

    // Pure function to set up rendering context
    private setupRenderingContext(): void {
        // Resize canvas if needed (side effect)
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
    }

    // Render an individual card using its config
    private renderCard(config: RenderConfig): void {
        const { card, cardRender, matrix } = config;
        
        // Set matrix uniform
        this.gl.uniformMatrix4fv(this.matrixLocation, false, matrix);

        // Set flip progress uniform
        this.gl.uniform1f(this.flipProgressLocation, card.flipProgress);

        // Set highlight uniform (1.0 if matched, 0.0 otherwise)
        this.gl.uniform1f(this.highlightLocation, card.isMatched ? 1.0 : 0.0);

        // Select and bind texture
        this.bindCardTexture(card, cardRender);

        // Draw the card (2 triangles = 6 vertices)
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }

    // Pure function to determine which texture to use
    private bindCardTexture(card: CardComponent, cardRender: CardRenderComponentInterface): void {
        if (card.isFlipped) {
            // Try to use cached front texture
            const frontTexture = this.cardFrontTextures.get(card.value);
            
            if (frontTexture) {
                this.gl.bindTexture(this.gl.TEXTURE_2D, frontTexture);
            } else if (card.texture && cardRender.isTextureLoaded) {
                // Create and cache new texture
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
    }

    // Static, pure matrix transformation methods
    // Helper method to create transformation matrix for card positioning
    static createCardMatrix(
        x: number, 
        y: number, 
        width: number, 
        height: number, 
        rotation: number,
        canvasWidth: number = 800,
        canvasHeight: number = 600
    ): Float32Array {
        // Create individual matrices
        const projectionMatrix = RenderSystem.createProjectionMatrix(canvasWidth, canvasHeight);
        const translationMatrix = RenderSystem.createTranslationMatrix(x, y);
        const rotationMatrix = RenderSystem.createRotationMatrix(rotation);
        const scaleMatrix = RenderSystem.createScaleMatrix(width, height);

        // Multiply matrices to create final transformation matrix
        // Order: projection * translation * rotation * scale
        return RenderSystem.multiplyMatrices(
            RenderSystem.multiplyMatrices(
                RenderSystem.multiplyMatrices(projectionMatrix, translationMatrix),
                rotationMatrix
            ),
            scaleMatrix
        );
    }

    // Matrix multiplication helper (4x4 matrices stored as column-major Float32Arrays)
    static multiplyMatrices(a: Float32Array, b: Float32Array): Float32Array {
        const result = new Float32Array(16);

        // For each row and column of the result matrix
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                // Calculate dot product of row i from a and column j from b
                const sum = Array.from({ length: 4 }, (_, k) => a[i + k * 4] * b[k + j * 4])
                    .reduce((acc, val) => acc + val, 0);
                    
                result[i + j * 4] = sum;
            }
        }

        return result;
    }

    // Create a projection matrix for WebGL rendering
    static createProjectionMatrix(width: number, height: number): Float32Array {
        return new Float32Array([
            2 / width, 0, 0, 0,
            0, -2 / height, 0, 0,
            0, 0, 1, 0,
            -1, 1, 0, 1
        ]);
    }

    // Create a translation matrix
    static createTranslationMatrix(x: number, y: number): Float32Array {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, 0, 1
        ]);
    }

    // Create a rotation matrix
    static createRotationMatrix(angle: number): Float32Array {
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
    static createScaleMatrix(width: number, height: number): Float32Array {
        return new Float32Array([
            width, 0, 0, 0,
            0, height, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }
} 