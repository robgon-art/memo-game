import { Entity, World } from '@lastolivegames/becsy';
import { Board } from '../components/board';
import { Card } from '../components/card';
import { GameState, initializeGame } from '../components/game-state';
import { generateCardValuesForBoard } from './random';
import { RenderableComponent, CardRenderComponent } from '../systems/render-system';

/**
 * Initialize the game board with randomized card values
 * @param world - The ECS world
 * @param boardEntity - The board entity
 * @param gameStateEntity - The game state entity
 */
export function initializeBoardWithRandomCards(
    world: World,
    boardEntity: Entity | undefined,
    gameStateEntity: Entity | undefined
): void {
    try {
        // Check if entities exist
        if (!boardEntity || !gameStateEntity) {
            console.error('Board or GameState entity is undefined');
            return;
        }

        // Safely read components
        let board: Board;
        let gameState: GameState;

        try {
            board = boardEntity.read(Board);
            if (!board) {
                console.error('Board component not found on entity');
                return;
            }
        } catch (error) {
            console.error('Failed to read Board component:', error);
            return;
        }

        try {
            gameState = gameStateEntity.read(GameState);
            if (!gameState) {
                console.error('GameState component not found on entity');
                return;
            }
        } catch (error) {
            console.error('Failed to read GameState component:', error);
            return;
        }

        // Calculate total number of cards
        const totalCards = board.rows * board.columns;

        // Generate randomly distributed card values using our randomization utility
        const cardValues = generateCardValuesForBoard(board.rows, board.columns);

        // Create card entities with randomized values
        createCardEntities(world, board, cardValues);

        // Update game state
        try {
            gameState.applyUpdate(_ => initializeGame(gameState, totalCards / 2));
        } catch (error) {
            console.error('Failed to update game state:', error);
        }
    } catch (error) {
        console.error('Error initializing board with cards:', error);
    }
}

/**
 * Create card entities with given values
 * @param world - The ECS world
 * @param board - Board component
 * @param cardValues - Array of card values (must match board dimensions)
 */
function createCardEntities(
    world: World,
    board: Board,
    cardValues: number[]
): void {
    try {
        // Create cards with fair distribution of values
        for (let i = 0; i < cardValues.length; i++) {
            const row = Math.floor(i / board.columns);
            const col = i % board.columns;

            // Calculate position with gaps between cards
            const x = col * (board.cardWidth + board.gap) + board.cardWidth / 2;
            const y = row * (board.cardHeight + board.gap) + board.cardHeight / 2;

            // Get proper image path for this card
            const textureUrl = `images/cards/${getCardImagePath(cardValues[i])}`;

            // Create card entity with rendering components
            world.createEntity(
                // Card component for game logic
                Card, {
                id: i,
                value: cardValues[i],
                x,
                y,
                width: board.cardWidth,
                height: board.cardHeight,
                isFlipped: false,
                isMatched: false,
                flipProgress: 0
            },
                // Renderable component for visibility
                RenderableComponent, {
                isVisible: true
            },
                // Card render component for textures
                CardRenderComponent, {
                isTextureLoaded: false,
                textureUrl
            }
            );
        }
    } catch (error) {
        console.error('Error creating card entities:', error);
    }
}

// Helper to get card image path based on value
function getCardImagePath(value: number): string {
    const imagePaths = [
        'Mont Sainte-Victoire, Paul Cézanne, c. 1890s.jpg',
        'Jeanne Samary in a Low-Necked Dress, Pierre-Auguste Renoir, 1877.jpg',
        'Children Playing on the Beach, Mary Cassatt, 1884.jpg',
        'The Green Line, Henri Matisse, 1905.jpg',
        'The Starry Night, Vincent van Gogh, 1889.jpg',
        'Le Déjeuner sur l\'herbe, Édouard Manet, 1863.jpg',
        'Dance at Bougival, Pierre-Auguste Renoir, 1883.jpg',
        'The Ballet Class, Edgar Degas, 1873.jpg',
        'Boulevard Montmartre, Spring, Camille Pissarro, 1897.jpg',
        'At the Moulin Rouge - The Dance, Henri de Toulouse-Lautrec, 1890.jpg',
        'A Sunday Afternoon on the Island of La Grande Jatte, Georges Seurat, 1884.jpg',
        'Impression Sunrise, Claude Monet, 1872.jpg'
    ];

    // Ensure the value is in range
    if (value >= 0 && value < imagePaths.length) {
        return imagePaths[value];
    }

    console.warn(`Card value out of range: ${value}, using fallback image`);
    // Fallback for out of range values
    return imagePaths[0];
} 