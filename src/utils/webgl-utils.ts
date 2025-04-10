/**
 * WebGL utilities for Memo Game rendering
 */

// Function to initialize WebGL context
export function createWebGLContext(canvas: HTMLCanvasElement): WebGLRenderingContext {
    const gl = canvas.getContext('webgl');

    if (!gl) {
        throw new Error('WebGL not supported or disabled');
    }

    return gl;
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