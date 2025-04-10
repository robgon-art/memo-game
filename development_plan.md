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
- [ ] Design card matching and flip mechanics
- [ ] Create game state management (moves counter, timer)
- [ ] Develop scoring system
- [ ] Implement randomization for card placement

## Phase 3: UI and Game Interface
- [ ] Design responsive game board layout
- [x] Create card visual components (front/back system)
- [ ] Use numbers to start with
- [ ] Implement user interaction (click/touch handlers)
- [ ] Add keyboard support
- [ ] Design game status indicators (timer, moves counter)
- [ ] Add game completion screen
- [x] Implement basic animations (card flip, match/mismatch feedback)

## Phase 4: Assets & Art Integration
- [ ] Acquire and process artwork images for all 12 painting pairs
- [ ] Implement asset loading and management system
- [ ] Create card back design
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
│   │   ├── artworks/             # 12 Impressionist paintings
│   │   └── ui/                   # UI elements and card backs
│   └── fonts/                    # Typography assets
├── src/
│   ├── components/               # ECS components (implemented)
│   │   ├── card.ts               # Card component (implemented)
│   │   ├── card.test.ts          # Tests for card component (implemented)
│   │   ├── board.ts              # Game board component
│   │   ├── board.test.ts         # Tests for board component
│   │   ├── game-state.ts         # Game state component
│   │   └── game-state.test.ts    # Tests for game state component
│   ├── systems/                  # ECS systems
│   │   ├── render-system.ts      # WebGL rendering system (implemented)
│   │   ├── render-system.test.ts # Tests for render system
│   │   ├── input-system.ts       # User interaction handling
│   │   ├── input-system.test.ts  # Tests for input system
│   │   ├── game-logic-system.ts  # Core game mechanics
│   │   ├── game-logic-system.test.ts # Tests for game logic
│   │   ├── animation-system.ts   # Animation handling
│   │   └── animation-system.test.ts # Tests for animation system
│   ├── services/
│   │   ├── asset-loader.ts       # Image loading functionality
│   │   ├── asset-loader.test.ts  # Tests for asset loader
│   │   ├── timer-service.ts      # Game timer implementation
│   │   └── timer-service.test.ts # Tests for timer service
│   ├── utils/
│   │   ├── random.ts             # Card shuffling logic
│   │   ├── random.test.ts        # Tests for randomization
│   │   ├── webgl-utils.ts        # WebGL helper functions (implemented)
│   │   └── webgl-utils.test.ts   # Tests for WebGL utilities (implemented)
│   ├── constants/                # Constants (implemented)
│   │   ├── artwork-data.ts       # Painting metadata
│   │   ├── game-config.ts        # Game configuration constants
│   │   └── shader-sources.ts     # WebGL shader code (implemented)
│   │   └── shader-sources.test.ts # Tests for WebGL shader code (implemented)
│   ├── styles/                   # CSS styles
│   ├── main.ts                   # Application entry point
│   ├── main.test.ts              # Tests for application entry (implemented)
│   ├── world.ts                  # ECS world initialization (implemented)
│   ├── world.test.ts             # Tests for ECS world
│   └── index.html                # Main HTML file
├── .gitignore
├── package.json
├── tsconfig.json                 # TypeScript configuration (updated)
├── vite.config.ts
├── vitest.config.ts              # Test configuration
├── README.md
└── development_plan.md           # This file (updated) 