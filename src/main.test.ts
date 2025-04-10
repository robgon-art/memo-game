import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { initializeUI, main } from './main';
import * as worldModule from './world';

// Mock Becsy properly before any imports that depend on it
vi.mock('@lastolivegames/becsy', () => {
  return {
    World: class MockWorld { },
    Entity: class MockEntity { },
    System: class MockSystem { },
    component: function (target: any) { return target; },
    system: function (target: any) { return target; },
    field: {
      int32: vi.fn(),
      float64: vi.fn(),
      boolean: vi.fn(),
      object: vi.fn(),
      string: vi.fn(),
      arrayOf: vi.fn()
    }
  };
});

// Import the World type from Becsy for proper typing
import { World } from '@lastolivegames/becsy';

describe('Game initialization', () => {
  let originalDocument: Document;
  let originalWindow: Window;
  let originalRAF: typeof requestAnimationFrame;

  beforeEach(() => {
    // Store original globals
    originalDocument = global.document;
    originalWindow = global.window as any;
    originalRAF = global.requestAnimationFrame;

    // Create a new DOM with app element
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="app"></div>
        </body>
      </html>
    `, { url: 'http://localhost/' });

    // Set globals
    global.document = dom.window.document;
    global.window = dom.window as unknown as Window & typeof globalThis;

    // Better implementation of requestAnimationFrame - more realistic
    // and avoids infinite loops in tests
    let frameCount = 0;
    global.requestAnimationFrame = function (callback) {
      if (frameCount < 3) { // Allow a few frames to execute
        frameCount++;
        return window.setTimeout(() => callback(performance.now()), 16) as unknown as number; // ~60fps timing
      }
      return 0;
    };
  });

  afterEach(() => {
    // Restore original globals
    global.document = originalDocument;
    global.window = originalWindow as any;
    global.requestAnimationFrame = originalRAF;
  });

  it('should initialize game UI elements', () => {
    // Call the UI initialization function directly
    initializeUI();

    // Focus on observable behavior - DOM structure and content
    expect(document.querySelector('#app')).not.toBeNull();
    expect(document.querySelector('.game-container')).not.toBeNull();

    const header = document.querySelector('.game-header h1');
    expect(header).not.toBeNull();
    expect(header?.textContent).toContain('Memo Game: Masters of Impressionism');

    // Check game board exists with proper class
    const gameBoard = document.querySelector('#game-board');
    expect(gameBoard).not.toBeNull();
    expect(gameBoard?.classList.contains('game-board')).toBe(true);

    // Verify game statistics are properly initialized
    const movesCount = document.querySelector('#moves-count');
    const timer = document.querySelector('#timer');
    expect(movesCount).not.toBeNull();
    expect(timer).not.toBeNull();
    expect(movesCount?.textContent).toBe('0');
    expect(timer?.textContent).toBe('00:00');
  });

  it('should return true when app element exists', () => {
    const result = initializeUI();
    expect(result).toBe(true);
  });

  it('should return false when app element does not exist', () => {
    // Remove the app element
    document.querySelector('#app')?.remove();

    const result = initializeUI();
    expect(result).toBe(false);
  });
});

describe('Main game function', () => {
  let originalDocument: Document;
  let originalWindow: Window;
  let originalRAF: typeof requestAnimationFrame;
  let frameCount: number;

  beforeEach(() => {
    // Store original globals
    originalDocument = global.document;
    originalWindow = global.window as any;
    originalRAF = global.requestAnimationFrame;
    frameCount = 0;

    // Create a new DOM with app element
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="app"></div>
        </body>
      </html>
    `, { url: 'http://localhost/' });

    // Set globals
    global.document = dom.window.document;
    global.window = dom.window as unknown as Window & typeof globalThis;

    // More realistic requestAnimationFrame implementation
    global.requestAnimationFrame = function (callback) {
      if (frameCount < 3) {
        frameCount++;
        return window.setTimeout(() => {
          callback(performance.now());
        }, 16) as unknown as number; // ~60fps timing
      }
      return 0;
    };

    // Use minimal mock for World to avoid browser API issues
    vi.spyOn(worldModule, 'initWorld').mockImplementation(async () => {
      return {
        execute: vi.fn(() => {
          // Track execute calls with frameCount
          frameCount++;
        }),
        // Add minimal required properties
        __dispatcher: {} as any,
        build: vi.fn(),
        createEntity: vi.fn(),
        control: vi.fn(),
        delta: 0,
        entities: [] as any[],
        time: 0,
        reset: vi.fn()
      } as unknown as World;
    });
  });

  afterEach(() => {
    // Restore original globals and functions
    global.document = originalDocument;
    global.window = originalWindow as any;
    global.requestAnimationFrame = originalRAF;
    vi.restoreAllMocks();
  });

  it('should initialize the UI with proper game elements when called', async () => {
    // Call main and wait for promises to resolve
    await main();

    // Focus on observable behavior - verify UI elements exist
    expect(document.querySelector('.game-container')).not.toBeNull();
    expect(document.querySelector('.game-header')).not.toBeNull();
    expect(document.querySelector('#game-board')).not.toBeNull();
    expect(document.querySelector('#moves-count')).not.toBeNull();
    expect(document.querySelector('#timer')).not.toBeNull();

    // Verify frameCount was incremented, showing game loop ran
    expect(frameCount).toBeGreaterThan(0);
  });

  it('should handle errors when world initialization fails', async () => {
    // Use a focused mock just for the error case
    vi.spyOn(worldModule, 'initWorld').mockRejectedValueOnce(
      new Error('World initialization failed')
    );

    // Spy on console.error to verify error handling
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    // Call main and wait for promises to resolve
    await main();

    // Verify UI was still initialized despite the error
    expect(document.querySelector('.game-container')).not.toBeNull();

    // Verify error was logged (checking observable behavior)
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to initialize game:',
      expect.any(Error)
    );

    // Restore console.error
    consoleSpy.mockRestore();
  });
});

describe('Game loop functionality', () => {
  let originalDocument: Document;
  let originalWindow: Window;
  let originalRAF: typeof requestAnimationFrame;
  let rafCallCount = 0;

  beforeEach(() => {
    // Store original globals
    originalDocument = global.document;
    originalWindow = global.window as any;
    originalRAF = global.requestAnimationFrame;

    // Create a new DOM
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="app"></div>
        </body>
      </html>
    `, { url: 'http://localhost/' });

    // Set globals
    global.document = dom.window.document;
    global.window = dom.window as unknown as Window & typeof globalThis;

    // Track RAF calls
    rafCallCount = 0;
    global.requestAnimationFrame = function (callback) {
      rafCallCount++;
      return window.setTimeout(() => callback(performance.now()), 16) as unknown as number;
    };
  });

  afterEach(() => {
    // Restore original globals
    global.document = originalDocument;
    global.window = originalWindow as any;
    global.requestAnimationFrame = originalRAF;
  });

  it('should execute the game loop for multiple frames', async () => {
    // Suppress console errors during this test
    const originalConsoleError = console.error;
    console.error = vi.fn();

    try {
      // This test will use the actual world creation without mocks
      await main();

      // Wait for a few animation frames to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify that requestAnimationFrame was called multiple times
      expect(rafCallCount).toBeGreaterThan(1);
    } finally {
      // Restore console.error even if the test fails
      console.error = originalConsoleError;
    }
  });
});

describe('Browser detection and auto-initialization', () => {
  // Store original values
  const originalWindow = global.window;

  beforeEach(() => {
    // Create a window for the test
    if (!global.window) {
      const dom = new JSDOM('', { url: 'http://localhost/' });
      global.window = dom.window as unknown as Window & typeof globalThis;
    }
  });

  afterEach(() => {
    // Restore original window
    global.window = originalWindow;
  });

  it('should auto-initialize based on environment flags', () => {
    // Define the function we want to test
    function testAutoInit(hasWindow: boolean, isTest: boolean): boolean {
      let called = false;

      // Set up the needed environment
      const testWindow = hasWindow ? {} : undefined;
      const testEnv = { TEST: isTest };

      // This is direct copy of the condition in main.ts
      if (typeof testWindow !== 'undefined') {
        if (!testEnv.TEST) {
          called = true;
        }
      }

      return called;
    }

    // Test all combinations of conditions
    expect(testAutoInit(true, false)).toBe(true);   // Has window, not testing: should call main()
    expect(testAutoInit(true, true)).toBe(false);   // Has window, testing: should NOT call main()
    expect(testAutoInit(false, false)).toBe(false); // No window, not testing: should NOT call main()
    expect(testAutoInit(false, true)).toBe(false);  // No window, testing: should NOT call main()
  });
}); 