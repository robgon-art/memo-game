import { component, field } from '@lastolivegames/becsy';

/**
 * Represents the configuration for a game board
 */
export interface BoardConfig {
    rows: number;
    columns: number;
    cardWidth: number;
    cardHeight: number;
    gap: number;
}

/**
 * Represents the game board that contains cards
 */
@component
export class Board {
    @field.int32 declare rows: number;
    @field.int32 declare columns: number;
    @field.float64 declare width: number;
    @field.float64 declare height: number;
    @field.float64 declare cardWidth: number;
    @field.float64 declare cardHeight: number;
    @field.float64 declare gap: number;

    /**
     * Applies a function to update the board state
     * @param updateFn - Pure function that returns updated board properties
     */
    applyUpdate(updateFn: (board: Board) => Partial<Board> | null): Board {
        const updates = updateFn(this);
        if (updates) {
            Object.assign(this, updates);
        }
        return this;
    }
}

/**
 * Pure function to calculate the position of a card on the board
 * @param board - The game board
 * @param index - The index of the card (0-based)
 * @returns Object with x and y coordinates
 */
export function calculateCardPosition(board: Board, index: number): { x: number, y: number } {
    if (index < 0 || index >= board.rows * board.columns) {
        throw new Error(`Card index ${index} is out of bounds for board with ${board.rows} rows and ${board.columns} columns`);
    }

    const row = Math.floor(index / board.columns);
    const col = index % board.columns;

    // Calculate position with gaps between cards
    const x = col * (board.cardWidth + board.gap) + board.cardWidth / 2;
    const y = row * (board.cardHeight + board.gap) + board.cardHeight / 2;

    return { x, y };
}

/**
 * Pure function to resize the board
 * @param board - The board to resize
 * @param config - New board configuration
 * @returns Updated board properties
 */
export function resizeBoard(board: Board, config: Partial<BoardConfig>): Partial<Board> {
    const newProps: Partial<Board> = {};

    if (config.rows !== undefined) newProps.rows = config.rows;
    if (config.columns !== undefined) newProps.columns = config.columns;
    if (config.cardWidth !== undefined) newProps.cardWidth = config.cardWidth;
    if (config.cardHeight !== undefined) newProps.cardHeight = config.cardHeight;
    if (config.gap !== undefined) newProps.gap = config.gap;

    // Calculate board dimensions based on card size, gaps, and grid size
    if (config.cardWidth !== undefined || config.gap !== undefined || config.columns !== undefined) {
        const effectiveCardWidth = config.cardWidth ?? board.cardWidth;
        const effectiveGap = config.gap ?? board.gap;
        const effectiveColumns = config.columns ?? board.columns;
        newProps.width = effectiveColumns * effectiveCardWidth + (effectiveColumns - 1) * effectiveGap;
    }

    if (config.cardHeight !== undefined || config.gap !== undefined || config.rows !== undefined) {
        const effectiveCardHeight = config.cardHeight ?? board.cardHeight;
        const effectiveGap = config.gap ?? board.gap;
        const effectiveRows = config.rows ?? board.rows;
        newProps.height = effectiveRows * effectiveCardHeight + (effectiveRows - 1) * effectiveGap;
    }

    return newProps;
}

/**
 * Pure function to create initial board configuration
 * @param config - Board configuration parameters
 * @returns Board properties for initialization
 */
export function createInitialBoard(config: BoardConfig): Partial<Board> {
    const { rows, columns, cardWidth, cardHeight, gap } = config;

    // Calculate board dimensions
    const width = columns * cardWidth + (columns - 1) * gap;
    const height = rows * cardHeight + (rows - 1) * gap;

    return {
        rows,
        columns,
        cardWidth,
        cardHeight,
        gap,
        width,
        height
    };
}

/**
 * Pure function to get card index from board coordinates
 * @param board - The game board
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns The card index or -1 if no card at that position
 */
export function getCardIndexAtPosition(board: Board, x: number, y: number): number {
    // Adjust position to account for card center
    const adjustedX = x;
    const adjustedY = y;

    // Calculate potential row and column
    const cardWidthWithGap = board.cardWidth + board.gap;
    const cardHeightWithGap = board.cardHeight + board.gap;

    const col = Math.floor(adjustedX / cardWidthWithGap);
    const row = Math.floor(adjustedY / cardHeightWithGap);

    // Check bounds
    if (col < 0 || col >= board.columns || row < 0 || row >= board.rows) {
        return -1;
    }

    // Check if click was in the gap
    const xRemainder = adjustedX % cardWidthWithGap;
    const yRemainder = adjustedY % cardHeightWithGap;

    if (xRemainder > board.cardWidth || yRemainder > board.cardHeight) {
        return -1;
    }

    return row * board.columns + col;
} 