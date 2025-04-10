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

// Only run in browser context, not during tests
// Check for typical test environment indicators
const isTestEnvironment = 
  typeof process !== 'undefined' && 
  process.env.NODE_ENV === 'test' || 
  process.env.VITEST;

if (!isTestEnvironment) {
  main();
}
