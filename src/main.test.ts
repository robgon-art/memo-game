import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { initializeUI } from './main';

describe('Game initialization', () => {
    let originalDocument: Document;
    let originalWindow: Window;

    beforeEach(() => {
        // Store original globals
        originalDocument = global.document;
        originalWindow = global.window as any;

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
    });

    afterEach(() => {
        // Restore original globals
        global.document = originalDocument;
        global.window = originalWindow as any;
    });

    it('should initialize game UI elements', () => {
        // Call the UI initialization function directly
        initializeUI();

        // Check if the app element contains the game elements
        const appElement = document.querySelector('#app');
        expect(appElement).not.toBeNull();

        // Check for game container
        const gameContainer = document.querySelector('.game-container');
        expect(gameContainer).not.toBeNull();

        // Check for game board
        const gameBoard = document.querySelector('#game-board');
        expect(gameBoard).not.toBeNull();
        expect(gameBoard?.classList.contains('game-board')).toBe(true);

        // Check for moves counter
        const movesCount = document.querySelector('#moves-count');
        expect(movesCount).not.toBeNull();
        expect(movesCount?.textContent).toBe('0');

        // Check for timer
        const timer = document.querySelector('#timer');
        expect(timer).not.toBeNull();
        expect(timer?.textContent).toBe('00:00');
    });
}); 