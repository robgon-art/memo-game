# Memo Game: Development Plan

## Phase 1: Project Setup & Infrastructure
- [x] Initialize TypeScript project with Vite
- [x] Configure build system and development environment
- [x] Set up Becsy ECS framework
- [x] Configure WebGL rendering pipeline
- [x] Establish project structure and architecture

## Phase 2: Core Game Logic
- [x] Implement ECS components (Card, Board, GameState)
- [x] Add unit tests using Vitest with colocated files, avoiding mocks
- [x] Use Functional Programming techniques
- [x] Design card matching and flip mechanics
- [x] Create game state management (moves counter, timer)
- [x] Develop scoring system
- [x] Implement randomization for card placement

## Phase 3: UI and Game Interface
- [x] Design and show the game board
- [x] Create card visual components (front/back system)
- [ ] Implement user interaction (click/touch handlers)
- [ ] Add keyboard support
- [ ] Design game status indicators (timer, moves counter)
- [ ] Add game completion screen
- [x] Implement basic animations (card flip, match/mismatch feedback)

## Phase 4: Assets & Art Integration
- [x] Acquire and process artwork images for all 12 painting pairs
- [x] Acquire a card back design
- [x] Implement asset loading
- [ ] Optimize image assets for web performance
- [ ] Add visual feedback for successful matches

## Phase 5: Game Features & Polish
- [ ] Add difficulty levels (different grid sizes)
- [ ] Implement sound effects and background music
- [ ] Create intro screen and instructions
- [ ] Add animations for game completion
- [ ] Implement local score/time tracking
- [ ] Add restart/new game functionality

## Phase 6: Testing & Refinement
- [x] Write unit tests for WebGL utilities
- [ ] Write end to end tests with Playwright
- [ ] Fix any UI issues


## Phase 7: Documentation & Deployment
- [ ] Complete code documentation
- [ ] Finalize README with detailed instructions
- [ ] Create deployment pipeline
- [ ] Prepare for release on GitHub Pages or similar platform
- [ ] Add analytics for tracking game usage

## WebGL Rendering Pipeline Implementation
- [x] WebGL Context Management
- [x] Shader Compilation and Program Linking
- [x] Texture and Buffer Creation
- [x] Matrix Transformations for 2D Rendering
- [x] Card Rendering System
- [x] Card Flip Animation Shaders
- [x] Card Matching Visual Feedback

## Project File Structure
```
memo-game/
├── .github/                      # CI/CD workflows
├── public/                       # Static assets
│   ├── images/
│   │   ├── cards/             # 12 Impressionist paintings
│   │   └── ui/                   # UI elements and card backs
│   └── fonts/                    # Typography assets
├── src/
│   ├── components/               # ECS components
│   │   ├── card.ts               # Card component
│   │   ├── card.test.ts          # Tests for card component
│   │   ├── board.ts              # Game board component
│   │   ├── board.test.ts         # Tests for board component
│   │   ├── game-state.ts         # Game state component
│   │   └── game-state.test.ts    # Tests for game state component
│   ├── systems/                  # ECS systems
│   │   ├── render-system.ts      # WebGL rendering system
│   │   ├── render-system.test.ts # Tests for render system
│   │   ├── game-logic-system.ts  # Core game mechanics
│   │   └── game-logic-system.test.ts # Tests for game logic
│   ├── utils/                    # Utility functions
│   │   ├── board-initializer.ts  # Board initialization logic
│   │   ├── board-initializer.test.ts # Tests for board initializer
│   │   ├── random.ts             # Card shuffling logic
│   │   ├── random.test.ts        # Tests for randomization
│   │   ├── webgl-utils.ts        # WebGL helper functions
│   │   └── webgl-utils.test.ts   # Tests for WebGL utilities
│   ├── constants/                # Constants
│   │   ├── shader-sources.ts     # WebGL shader code
│   │   └── shader-sources.test.ts # Tests for WebGL shader code
│   ├── main.ts                   # Application entry point
│   ├── main.test.ts              # Tests for application entry
│   ├── world.ts                  # ECS world initialization
│   ├── world.test.ts             # Tests for ECS world
│   ├── vite-env.d.ts             # Vite type declarations
│   ├── style.css                 # Main CSS styles
│   └── typescript.svg            # TypeScript logo
├── .gitignore
├── package.json
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts
├── vitest.config.ts              # Test configuration
├── README.md
└── development_plan.md           # This file 