import { World, Entity } from '@lastolivegames/becsy';
import { Board, createInitialBoard } from './components/board';
import { Card } from './components/card';
import { GameState } from './components/game-state';
import { RenderSystem, RenderableComponent, CardRenderComponent } from './systems/render-system';
import { GameLogicSystem } from './systems/game-logic-system';
import { initializeBoardWithRandomCards } from './utils/board-initializer';
import { AssetLoadingSystem, AssetLoadingState } from './systems/asset-loading-system';

// Define a more specific type for what's returned from world.createEntity
interface BrainicsEntity extends Entity {
    read<T>(componentType: any): T;
}

// Define a world configuration interface
interface WorldConfig {
    defs: any[];
}

// Options for initializing the world - useful for testing
export interface WorldInitOptions {
    skipBoardInitialization?: boolean;
    skipRendererInitialization?: boolean;
    testMode?: boolean;
}

// Pure function to create a world configuration
function createWorldConfig(): WorldConfig {
    return {
        defs: [
            // Game components
            Card,
            Board,
            GameState,
            RenderableComponent,
            CardRenderComponent,
            AssetLoadingState,  // Important: Register the asset loading state component

            // Systems
            AssetLoadingSystem,
            RenderSystem,
            GameLogicSystem
        ]
    };
}

// Pure function to create a world with all required systems
export async function createGameWorld() {
    // Get the world configuration
    const config = createWorldConfig();

    console.log('Creating world with components and systems:', config.defs.map(d => d.name));

    // Create a new ECS world with required components and systems
    return World.create(config);
}

// Pure function to set up game entities
export function setupGameEntities(world: World): { boardEntity: BrainicsEntity, gameStateEntity: BrainicsEntity } {
    try {
        // Create board entity with initial configuration
        const boardEntity = world.createEntity(Board, createInitialBoard({
            rows: 4,
            columns: 4,
            cardWidth: 100,
            cardHeight: 140,
            gap: 20
        })) as unknown as BrainicsEntity;

        // Create game state entity
        const gameStateEntity = world.createEntity(GameState) as unknown as BrainicsEntity;

        return { boardEntity, gameStateEntity };
    } catch (error) {
        console.error('Error setting up game entities:', error);
        // Return undefined entities to handle gracefully downstream
        return { 
            boardEntity: undefined as unknown as BrainicsEntity, 
            gameStateEntity: undefined as unknown as BrainicsEntity 
        };
    }
}

// Pure function to initialize renderer
export async function initializeRenderer(world: World) {
    // Find the systems using the world's systems property
    let renderSystem;
    let assetLoadingSystem;

    try {
        // Use any available method to get systems from the world
        if (world && (world as any).systems) {
            for (const system of (world as any).systems) {
                if (system instanceof RenderSystem) {
                    renderSystem = system;
                }
                if (system instanceof AssetLoadingSystem) {
                    assetLoadingSystem = system;
                }
            }
        }

        // Initialize asset loading system first
        if (assetLoadingSystem) {
            try {
                await assetLoadingSystem.initialize();
            } catch (error) {
                console.error('Failed to initialize AssetLoadingSystem:', error);
                // Continue even if asset loading fails
            }
        } else {
            console.error('AssetLoadingSystem not found in world');
        }

        // Then initialize render system
        if (renderSystem) {
            try {
                await renderSystem.initialize();
            } catch (error) {
                console.error('Failed to initialize RenderSystem:', error);
                // Continue even if render system initialization fails
            }
        } else {
            console.error('RenderSystem not found in world');
        }
    } catch (error) {
        console.error('Error initializing systems:', error);
    }

    return { renderSystem, assetLoadingSystem };
}

// Initialize the ECS world
export async function initWorld(options: WorldInitOptions = {}) {
    try {
        // Create world with systems
        const world = await createGameWorld();

        // Initialize renderer first (skip in test mode if requested)
        if (!options.skipRendererInitialization) {
            await initializeRenderer(world);
        }

        // Set up entities after systems are initialized
        const { boardEntity, gameStateEntity } = setupGameEntities(world);

        // Initialize board with cards (skip in test mode if requested)
        if (!options.skipBoardInitialization) {
            // Wait a small amount of time to ensure systems are fully initialized
            if (!options.testMode) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            initializeBoardWithRandomCards(
                world,
                boardEntity,
                gameStateEntity
            );
        }

        return world;
    } catch (error) {
        console.error('Failed to initialize world:', error);
        throw error; // Re-throw to allow caller to handle
    }
} 