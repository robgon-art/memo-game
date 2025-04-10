import { describe, it, expect, vi } from 'vitest';

// Mock Becsy before importing the Board class
vi.mock('@lastolivegames/becsy', () => {
    return {
        component: function (target: any) {
            return target;
        },
        field: {
            int32: vi.fn(),
            float64: vi.fn(),
            boolean: vi.fn(),
            object: vi.fn()
        }
    };
});

// Import the Board component and pure functions after mocking
import {
    Board,
    calculateCardPosition,
    resizeBoard,
    createInitialBoard,
    getCardIndexAtPosition
} from './board';

describe('Board Component', () => {
    // Test class definition
    it('should define a Board component with correct structure', () => {
        // Verify Board exists and is a class
        expect(Board).toBeDefined();
        expect(typeof Board).toBe('function');

        // Check Board prototype
        const boardPrototype = Board.prototype;
        expect(boardPrototype).toBeDefined();

        // Verify methods exist
        expect(typeof boardPrototype.applyUpdate).toBe('function');
    });

    // Test the applyUpdate method
    it('should apply updates to the board', () => {
        const board = new Board();
        board.rows = 4;
        board.columns = 3;

        // Define a test update function
        const testUpdate = (b: Board) => ({ rows: b.rows + 1, columns: b.columns + 2 });

        // Apply the update
        board.applyUpdate(testUpdate);
        expect(board.rows).toBe(5);
        expect(board.columns).toBe(5);
    });

    it('should handle null updates gracefully', () => {
        const board = new Board();
        board.rows = 4;
        board.columns = 3;

        // Define a test update function that returns null
        const testUpdate = () => null;

        // Apply the update
        board.applyUpdate(testUpdate);
        expect(board.rows).toBe(4); // Should remain unchanged
        expect(board.columns).toBe(3); // Should remain unchanged
    });
});

describe('calculateCardPosition', () => {
    it('should calculate correct card positions', () => {
        const board = new Board();
        board.rows = 4;
        board.columns = 4;
        board.cardWidth = 100;
        board.cardHeight = 150;
        board.gap = 10;

        // Test first card (top-left)
        const pos1 = calculateCardPosition(board, 0);
        expect(pos1.x).toBe(50); // Half card width (center of card)
        expect(pos1.y).toBe(75); // Half card height (center of card)

        // Test second card (first row, second column)
        const pos2 = calculateCardPosition(board, 1);
        expect(pos2.x).toBe(160); // 50 + 100 + 10 (first card center + width + gap)
        expect(pos2.y).toBe(75);

        // Test first card of second row
        const pos5 = calculateCardPosition(board, 4);
        expect(pos5.x).toBe(50);
        expect(pos5.y).toBe(235); // 75 + 150 + 10 (first card center + height + gap)
    });

    it('should throw an error for out-of-bounds indices', () => {
        const board = new Board();
        board.rows = 3;
        board.columns = 3;

        // Test negative index
        expect(() => calculateCardPosition(board, -1)).toThrow();

        // Test index too large
        expect(() => calculateCardPosition(board, 9)).toThrow();
    });
});

describe('resizeBoard', () => {
    it('should correctly update rows and columns', () => {
        const board = new Board();
        board.rows = 4;
        board.columns = 3;
        board.cardWidth = 100;
        board.cardHeight = 120;
        board.gap = 10;
        board.width = 320;
        board.height = 510;

        const updates = resizeBoard(board, { rows: 5, columns: 4 });

        expect(updates.rows).toBe(5);
        expect(updates.columns).toBe(4);
        expect(updates.width).toBe(430); // 4 cards wide with 3 gaps = 4*100 + 3*10 = 430
        expect(updates.height).toBe(640); // 5 cards high with 4 gaps = 5*120 + 4*10 = 640
    });

    it('should correctly update card dimensions', () => {
        const board = new Board();
        board.rows = 4;
        board.columns = 3;
        board.cardWidth = 100;
        board.cardHeight = 120;
        board.gap = 10;
        board.width = 320;
        board.height = 510;

        const updates = resizeBoard(board, { cardWidth: 80, cardHeight: 100 });

        expect(updates.cardWidth).toBe(80);
        expect(updates.cardHeight).toBe(100);
        expect(updates.width).toBe(260); // 3 cards wide with 2 gaps = 3*80 + 2*10 = 260
        expect(updates.height).toBe(430); // 4 cards high with 3 gaps = 4*100 + 3*10 = 430
    });

    it('should correctly update gap size', () => {
        const board = new Board();
        board.rows = 4;
        board.columns = 3;
        board.cardWidth = 100;
        board.cardHeight = 120;
        board.gap = 10;
        board.width = 320;
        board.height = 510;

        const updates = resizeBoard(board, { gap: 20 });

        expect(updates.gap).toBe(20);
        expect(updates.width).toBe(340); // 3 cards wide with 2 gaps = 3*100 + 2*20 = 340
        expect(updates.height).toBe(540); // 4 cards high with 3 gaps = 4*120 + 3*20 = 540
    });
});

describe('createInitialBoard', () => {
    it('should create correct initial board properties', () => {
        const config = {
            rows: 4,
            columns: 5,
            cardWidth: 90,
            cardHeight: 120,
            gap: 15
        };

        const boardProps = createInitialBoard(config);

        expect(boardProps.rows).toBe(4);
        expect(boardProps.columns).toBe(5);
        expect(boardProps.cardWidth).toBe(90);
        expect(boardProps.cardHeight).toBe(120);
        expect(boardProps.gap).toBe(15);
        expect(boardProps.width).toBe(510); // 5 cards wide with 4 gaps = 5*90 + 4*15 = 510
        expect(boardProps.height).toBe(525); // 4 cards high with 3 gaps = 4*120 + 3*15 = 525
    });
});

describe('getCardIndexAtPosition', () => {
    it('should return correct card index for position', () => {
        const board = new Board();
        board.rows = 3;
        board.columns = 4;
        board.cardWidth = 100;
        board.cardHeight = 120;
        board.gap = 10;

        // Test position in the middle of first card
        expect(getCardIndexAtPosition(board, 50, 60)).toBe(0);

        // Test position in the middle of second card in first row
        expect(getCardIndexAtPosition(board, 160, 60)).toBe(1);

        // Test position in the middle of first card in second row
        expect(getCardIndexAtPosition(board, 50, 190)).toBe(4);
    });

    it('should return -1 for positions in gaps', () => {
        const board = new Board();
        board.rows = 3;
        board.columns = 4;
        board.cardWidth = 100;
        board.cardHeight = 120;
        board.gap = 10;

        // Test position in horizontal gap between first and second cards
        expect(getCardIndexAtPosition(board, 105, 60)).toBe(-1);

        // Test position in vertical gap between first row and second row
        expect(getCardIndexAtPosition(board, 50, 125)).toBe(-1);
    });

    it('should return -1 for positions out of bounds', () => {
        const board = new Board();
        board.rows = 3;
        board.columns = 4;
        board.cardWidth = 100;
        board.cardHeight = 120;
        board.gap = 10;

        // Test position to the left of the board
        expect(getCardIndexAtPosition(board, -10, 60)).toBe(-1);

        // Test position to the right of the board
        expect(getCardIndexAtPosition(board, 500, 60)).toBe(-1);

        // Test position above the board
        expect(getCardIndexAtPosition(board, 50, -10)).toBe(-1);

        // Test position below the board
        expect(getCardIndexAtPosition(board, 50, 400)).toBe(-1);
    });
}); 