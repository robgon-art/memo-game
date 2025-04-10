import { Entity, World } from '@lastolivegames/becsy';
import { Board } from '../components/board';
import { Card } from '../components/card';
import { GameState, initializeGame } from '../components/game-state';
import { generateCardValuesForBoard } from './random';

/**
 * Initialize the game board with randomized card values
 * @param world - The ECS world
 * @param boardEntity - The board entity
 * @param gameStateEntity - The game state entity
 */
export function initializeBoardWithRandomCards(
    world: World,
    boardEntity: Entity,
    gameStateEntity: Entity
): void {
    const board = boardEntity.read(Board);
    const gameState = gameStateEntity.read(GameState);

    // Calculate total number of cards
    const totalCards = board.rows * board.columns;

    // Generate randomly distributed card values using our randomization utility
    const cardValues = generateCardValuesForBoard(board.rows, board.columns);

    // Create card entities with randomized values
    createCardEntities(world, board, cardValues);

    // Update game state
    gameState.applyUpdate(_ => initializeGame(gameState, totalCards / 2));
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
    // Create cards with fair distribution of values
    for (let i = 0; i < cardValues.length; i++) {
        const row = Math.floor(i / board.columns);
        const col = i % board.columns;

        // Calculate position with gaps between cards
        const x = col * (board.cardWidth + board.gap) + board.cardWidth / 2;
        const y = row * (board.cardHeight + board.gap) + board.cardHeight / 2;

        // Create card entity
        world.createEntity(Card, {
            id: i,
            value: cardValues[i],
            x,
            y,
            width: board.cardWidth,
            height: board.cardHeight,
            isFlipped: false,
            isMatched: false,
            flipProgress: 0
        });
    }
} 