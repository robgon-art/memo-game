import { World, Entity } from '@lastolivegames/becsy';
import { Board, createInitialBoard } from './components/board';
import { Card } from './components/card';
import { GameState } from './components/game-state';
import { RenderSystem, RenderableComponent, CardRenderComponent } from './systems/render-system';
import { GameLogicSystem } from './systems/game-logic-system';
import { initializeBoardWithRandomCards } from './utils/board-initializer';

// Define a more specific type for what's returned from world.createEntity
interface BrainicsEntity extends Entity {
    read<T>(componentType: any): T;
}

// Options for initializing the world - useful for testing
export interface WorldInitOptions {
    skipBoardInitialization?: boolean;
    skipRendererInitialization?: boolean;
    testMode?: boolean;
}

// Pure function to create a world with all required systems
export async function createGameWorld() {
    // Create a new ECS world with required components and systems
    return World.create({
        defs: [
            Board,
            Card,
            GameState,
            RenderableComponent,
            CardRenderComponent,
            RenderSystem,
            GameLogicSystem
        ]
    });
}

// Pure function to set up game entities
export function setupGameEntities(world: World): { boardEntity: BrainicsEntity, gameStateEntity: BrainicsEntity } {
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
}

// Pure function to initialize renderer
export async function initializeRenderer(world: World) {
    // Find the render system using the world's systems property
    let renderSystem;

    try {
        // Use any available method to get systems from the world
        if (world && (world as any).systems) {
            for (const system of (world as any).systems) {
                if (system instanceof RenderSystem) {
                    renderSystem = system;
                    break;
                }
            }
        }

        if (renderSystem) {
            await renderSystem.initialize();
        } else {
            console.error('RenderSystem not found in world');
        }
    } catch (error) {
        console.error('Error initializing renderer:', error);
    }

    return renderSystem;
}

// Initialize the ECS world
export async function initWorld(options: WorldInitOptions = {}) {
    // Create world with systems
    const world = await createGameWorld();

    // Set up entities
    const { boardEntity, gameStateEntity } = setupGameEntities(world);

    // Initialize board with cards (skip in test mode if requested)
    if (!options.skipBoardInitialization) {
        initializeBoardWithRandomCards(
            world,
            boardEntity,
            gameStateEntity
        );
    }

    // Initialize renderer (skip in test mode if requested)
    if (!options.skipRendererInitialization) {
        await initializeRenderer(world);
    }

    return world;
} 