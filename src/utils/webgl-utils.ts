/**
 * WebGL utilities for Memo Game rendering
 * Enhanced with functional programming principles
 */

// Type definitions for better function composition
export type WebGLOperation<T> = (gl: WebGLRenderingContext) => T;
export type GLResource = WebGLShader | WebGLProgram | WebGLBuffer | WebGLTexture;

// WebGL Operation representation types - represent operations as data
export type WebGLOp = {
    type: string;
    params: any[];
};

/**
 * Function composition helper for WebGL operations
 * @param fns - Functions to compose
 * @returns Composed function
 */
export function composeGL<T>(
    ...fns: Array<(input: any) => any>
): (gl: WebGLRenderingContext) => T {
    return (gl: WebGLRenderingContext) =>
        fns.reduceRight((result, fn) => fn(result), gl) as T;
}

/**
 * Executes a sequence of WebGL operations on a context
 * @param gl - WebGL context
 * @param operations - Operations to perform
 * @returns Result of the last operation
 */
export function pipeGL<T>(gl: WebGLRenderingContext, ...operations: Array<WebGLOperation<any>>): T {
    return operations.reduce((result, op) =>
        typeof op === 'function' ? op(result) : result, gl) as T;
}

// Function to initialize WebGL context
export function createWebGLContext(canvas: HTMLCanvasElement): WebGLRenderingContext {
    const gl = canvas.getContext('webgl');

    if (!gl) {
        throw new Error('WebGL not supported or disabled');
    }

    return gl;
}

// Pure function to create operation that will compile a shader
export function createShaderOp(type: number, source: string): WebGLOp {
    return {
        type: 'compileShader',
        params: [type, source]
    };
}

// Execute a shader compilation operation
export function executeShaderOp(gl: WebGLRenderingContext, op: WebGLOp): WebGLShader {
    if (op.type !== 'compileShader') {
        throw new Error(`Expected compileShader operation, got ${op.type}`);
    }

    return compileShader(gl, op.params[0], op.params[1]);
}

// Compile a shader from source code
export function compileShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
): WebGLShader {
    const shader = gl.createShader(type);

    if (!shader) {
        throw new Error('Failed to create shader');
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Failed to compile shader: ${info}`);
    }

    return shader;
}

// Higher-order function to create shader compiler with fixed type
export function createShaderCompiler(type: number):
    (gl: WebGLRenderingContext, source: string) => WebGLShader {
    return (gl, source) => compileShader(gl, type, source);
}

// Pure function to create program operation
export function createProgramOp(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLOp {
    return {
        type: 'createProgram',
        params: [vertexShader, fragmentShader]
    };
}

// Execute a program creation operation
export function executeProgramOp(gl: WebGLRenderingContext, op: WebGLOp): WebGLProgram {
    if (op.type !== 'createProgram') {
        throw new Error(`Expected createProgram operation, got ${op.type}`);
    }

    return createProgram(gl, op.params[0], op.params[1]);
}

// Create a program from vertex and fragment shaders
export function createProgram(
    gl: WebGLRenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
): WebGLProgram {
    const program = gl.createProgram();

    if (!program) {
        throw new Error('Failed to create program');
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error(`Failed to link program: ${info}`);
    }

    return program;
}

// Pure function to create buffer operation
export function createBufferOp(
    data: Float32Array | Uint16Array,
    target: number = 0x8892, // gl.ARRAY_BUFFER
    usage: number = 0x88E4    // gl.STATIC_DRAW
): WebGLOp {
    return {
        type: 'createBuffer',
        params: [data, target, usage]
    };
}

// Execute a buffer creation operation
export function executeBufferOp(gl: WebGLRenderingContext, op: WebGLOp): WebGLBuffer {
    if (op.type !== 'createBuffer') {
        throw new Error(`Expected createBuffer operation, got ${op.type}`);
    }

    return createBuffer(gl, op.params[0], op.params[1], op.params[2]);
}

// Create a buffer and upload data to it
export function createBuffer(
    gl: WebGLRenderingContext,
    data: Float32Array | Uint16Array,
    target: number = gl.ARRAY_BUFFER,
    usage: number = gl.STATIC_DRAW
): WebGLBuffer {
    const buffer = gl.createBuffer();

    if (!buffer) {
        throw new Error('Failed to create buffer');
    }

    gl.bindBuffer(target, buffer);
    gl.bufferData(target, data, usage);

    return buffer;
}

// Higher-order function to create buffer with predefined target and usage
export function createBufferFactory(target?: number, usage?: number) {
    return (gl: WebGLRenderingContext, data: Float32Array | Uint16Array): WebGLBuffer => {
        const actualTarget = target ?? gl.ARRAY_BUFFER;
        const actualUsage = usage ?? gl.STATIC_DRAW;
        return createBuffer(gl, data, actualTarget, actualUsage);
    };
}

// Pure function to create texture operation
export function createTextureOp(image: HTMLImageElement): WebGLOp {
    return {
        type: 'createTexture',
        params: [image]
    };
}

// Execute a texture creation operation
export function executeTextureOp(gl: WebGLRenderingContext, op: WebGLOp): WebGLTexture {
    if (op.type !== 'createTexture') {
        throw new Error(`Expected createTexture operation, got ${op.type}`);
    }

    return createTexture(gl, op.params[0]);
}

// Create and configure a texture
export function createTexture(
    gl: WebGLRenderingContext,
    image: HTMLImageElement
): WebGLTexture {
    const texture = gl.createTexture();

    if (!texture) {
        throw new Error('Failed to create texture');
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    // Set filtering for scaling 
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Wrap mode - clamp to edge to prevent artifacts
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return texture;
}

// Pure function for viewport operation
export function createViewportOp(x: number, y: number, width: number, height: number): WebGLOp {
    return {
        type: 'viewport',
        params: [x, y, width, height]
    };
}

// Execute a viewport operation
export function executeViewportOp(gl: WebGLRenderingContext, op: WebGLOp): WebGLRenderingContext {
    if (op.type !== 'viewport') {
        throw new Error(`Expected viewport operation, got ${op.type}`);
    }

    gl.viewport(op.params[0], op.params[1], op.params[2], op.params[3]);
    return gl;
}

// Resize canvas to display size
export function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement): boolean {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        return true;
    }

    return false;
}

// Pure function to create viewport settings based on canvas dimensions
export function createViewportSettings(canvas: HTMLCanvasElement): { x: number, y: number, width: number, height: number } {
    return {
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height
    };
}

// Apply viewport settings to WebGL context
export function applyViewport(
    gl: WebGLRenderingContext,
    settings: { x: number, y: number, width: number, height: number }
): WebGLRenderingContext {
    gl.viewport(settings.x, settings.y, settings.width, settings.height);
    return gl;
}

// Pure matrix operations
export function createProjectionMatrix(width: number, height: number): Float32Array {
    return new Float32Array([
        2 / width, 0, 0, 0,
        0, -2 / height, 0, 0,
        0, 0, 1, 0,
        -1, 1, 0, 1
    ]);
}

export function createTranslationMatrix(x: number, y: number): Float32Array {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        x, y, 0, 1
    ]);
}

export function createRotationMatrix(angle: number): Float32Array {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return new Float32Array([
        c, s, 0, 0,
        -s, c, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}

export function createScaleMatrix(width: number, height: number): Float32Array {
    return new Float32Array([
        width, 0, 0, 0,
        0, height, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}

export function multiplyMatrices(a: Float32Array, b: Float32Array): Float32Array {
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

// Create transformation matrix for card positioning
export function createCardMatrix(
    x: number,
    y: number,
    width: number,
    height: number,
    rotation: number,
    canvasWidth: number,
    canvasHeight: number
): Float32Array {
    // Create individual matrices
    const projectionMatrix = createProjectionMatrix(canvasWidth, canvasHeight);
    const translationMatrix = createTranslationMatrix(x, y);
    const rotationMatrix = createRotationMatrix(rotation);
    const scaleMatrix = createScaleMatrix(width, height);

    // Multiply matrices to create final transformation matrix
    // Order: projection * translation * rotation * scale
    return multiplyMatrices(
        multiplyMatrices(
            multiplyMatrices(projectionMatrix, translationMatrix),
            rotationMatrix
        ),
        scaleMatrix
    );
}

// Execute all WebGL operations in sequence
export function executeOperations(gl: WebGLRenderingContext, operations: WebGLOp[]): void {
    for (const op of operations) {
        switch (op.type) {
            case 'compileShader':
                executeShaderOp(gl, op);
                break;
            case 'createProgram':
                executeProgramOp(gl, op);
                break;
            case 'createBuffer':
                executeBufferOp(gl, op);
                break;
            case 'createTexture':
                executeTextureOp(gl, op);
                break;
            case 'viewport':
                executeViewportOp(gl, op);
                break;
            default:
                throw new Error(`Unknown operation type: ${op.type}`);
        }
    }
}

// Example of function composition for common WebGL setup
export function setupRenderingPipeline(
    canvas: HTMLCanvasElement,
    vertexShaderSource: string,
    fragmentShaderSource: string
): { gl: WebGLRenderingContext, program: WebGLProgram, operations: WebGLOp[] } {
    const gl = createWebGLContext(canvas);

    // Create operations representing the pipeline
    const operations: WebGLOp[] = [
        createShaderOp(gl.VERTEX_SHADER, vertexShaderSource),
        createShaderOp(gl.FRAGMENT_SHADER, fragmentShaderSource)
    ];

    // Compile shaders
    const vertexShader = executeShaderOp(gl, operations[0]);
    const fragmentShader = executeShaderOp(gl, operations[1]);

    // Create program
    const programOp = createProgramOp(vertexShader, fragmentShader);
    operations.push(programOp);
    const program = executeProgramOp(gl, programOp);

    // Set up viewport based on canvas size
    const viewport = createViewportSettings(canvas);
    const viewportOp = createViewportOp(viewport.x, viewport.y, viewport.width, viewport.height);
    operations.push(viewportOp);
    executeViewportOp(gl, viewportOp);

    return { gl, program, operations };
} 