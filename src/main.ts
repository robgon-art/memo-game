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
        <div id="loading-screen" class="loading-screen">
          <div class="loading-text">Loading game assets...</div>
          <div class="loading-progress-container">
            <div id="loading-progress-bar" class="loading-progress-bar"></div>
          </div>
          <div id="loading-percentage" class="loading-percentage">0%</div>
        </div>
        <div id="game-board" class="game-board" style="display: none;"></div>
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

// Function to update loading progress UI
function updateLoadingProgress(progress: number) {
  const progressBar = document.querySelector<HTMLDivElement>('#loading-progress-bar');
  const percentage = document.querySelector<HTMLDivElement>('#loading-percentage');

  if (progressBar) {
    progressBar.style.width = `${progress * 100}%`;
  }

  if (percentage) {
    percentage.textContent = `${Math.round(progress * 100)}%`;
  }
}

// Function to hide loading screen and show game board
function hideLoadingScreen() {
  const loadingScreen = document.querySelector<HTMLDivElement>('#loading-screen');
  const gameBoard = document.querySelector<HTMLDivElement>('#game-board');

  if (loadingScreen) {
    loadingScreen.style.display = 'none';
  }

  if (gameBoard) {
    gameBoard.style.display = 'block';
  }
}

// Game initialization stays separate
export async function main() {
  // Set up UI first
  initializeUI();

  try {
    // Track when we started loading
    const startTime = Date.now();

    const world = await initWorld();

    // Add a fallback to show the game after a few seconds even if loading doesn't complete
    setTimeout(() => {
      hideLoadingScreen();
      console.log('Forced loading screen hide after timeout');
    }, 5000);

    // Setup observer for loading progress 
    const checkLoadingProgress = () => {
      try {
        // Find the loading state component
        let loadingComplete = false;
        const systems: any[] = (world as any).systems || [];

        // Debug output
        console.log('Checking loading progress with systems:', systems.length);

        let assetSystem = null;
        for (const system of systems) {
          if (system && system.constructor && system.constructor.name === 'AssetLoadingSystem') {
            console.log('Found AssetLoadingSystem');
            assetSystem = system;
            break;
          }
        }

        if (!assetSystem) {
          console.warn('Asset loading system not found, faking progress');
          // If we can't find the system, fake progress
          const progress = Math.min(1, (Date.now() - startTime) / 3000);
          updateLoadingProgress(progress);
          loadingComplete = progress >= 1;
          return loadingComplete;
        }

        // Check loading state through query
        if (assetSystem.loadingState) {
          assetSystem.loadingState.each((entity: any) => {
            try {
              // Try different ways to read the component
              let state;
              try {
                state = entity.read('AssetLoadingState');
              } catch (e) {
                console.log('Failed to read by string name');
                // Just mark as complete if we can't read the state
                loadingComplete = true;
              }

              if (state) {
                updateLoadingProgress(state.progress || 0);
                loadingComplete = state.allAssetsLoaded || false;
              }
            } catch (error) {
              console.error('Error reading AssetLoadingState:', error);
              loadingComplete = true; // Force completion on error
            }
          });
        } else {
          console.warn('No loading state query found in AssetLoadingSystem');
        }

        if (loadingComplete) {
          console.log('Loading complete, hiding loading screen');
          hideLoadingScreen();
          return true;
        }

        return false;
      } catch (error) {
        console.error('Error in checkLoadingProgress:', error);
        hideLoadingScreen(); // On error, show the game
        return true;
      }
    };

    const checkInterval = setInterval(() => {
      if (checkLoadingProgress()) {
        clearInterval(checkInterval);
      }
    }, 100);

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
