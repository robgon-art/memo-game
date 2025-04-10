import './style.css'
import { initWorld } from './world'

// Export this function for testing
export function initializeUI() {
  const app = document.querySelector<HTMLDivElement>('#app')
  // Only initialize UI if app element exists
  if (app) {
    app.innerHTML = `
      <div class="game-container">
        <div class="game-header">
          <h1>Memo Game: Masters of Impressionism</h1>
          <div class="game-stats">
            <div class="moves">Moves: <span id="moves-count">0</span></div>
            <div class="timer">Time: <span id="timer">00:00</span></div>
          </div>
        </div>
        <div id="game-board" class="game-board"></div>
      </div>
    `

    // Create and append canvas to game board
    const gameBoard = document.querySelector<HTMLDivElement>('#game-board')
    if (gameBoard) {
      const canvas = document.createElement('canvas')
      canvas.id = 'game-board-canvas'
      canvas.width = 800
      canvas.height = 600
      canvas.style.display = 'block'
      canvas.style.margin = '0 auto'
      canvas.style.backgroundColor = '#1a1a1a'
      gameBoard.appendChild(canvas)
    }
  }
  return app !== null;
}

// Game initialization stays separate
export async function main() {
  // Set up UI first
  initializeUI();

  try {
    const world = await initWorld();

    function gameLoop() {
      world.execute();
      requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
}

// Simpler browser detection - if we have a window object, we're in a browser
if (typeof window !== 'undefined') {
  // In Vitest, the tests will import the module but not run in a real browser
  // In a real browser, we want to execute main
  if (!import.meta.env.TEST) {
    main();
  }
}
