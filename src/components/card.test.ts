import { describe, it, expect, vi, } from 'vitest';

// Mock Becsy before importing the Card class
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

// Import the Card component after mocking
import { Card } from './card';

describe('Card Component', () => {
    // Test class definition
    it('should define a Card component with correct structure', () => {
        // Verify Card exists and is a class
        expect(Card).toBeDefined();
        expect(typeof Card).toBe('function');

        // Check Card prototype
        const cardPrototype = Card.prototype;
        expect(cardPrototype).toBeDefined();

        // Verify methods exist
        expect(typeof cardPrototype.flip).toBe('function');
        expect(typeof cardPrototype.match).toBe('function');
        expect(typeof cardPrototype.updateFlipProgress).toBe('function');
    });

    // Test the flip method
    it('should flip the card correctly', () => {
        const card = new Card();

        // Initial state
        card.isFlipped = false;
        card.flipProgress = 0;

        // Test flipping
        card.flip();
        expect(card.isFlipped).toBe(true);
        expect(card.flipProgress).toBe(0); // Reset to 0 when starting to flip up

        // Test flipping again
        card.flip();
        expect(card.isFlipped).toBe(false);
        expect(card.flipProgress).toBe(1); // Reset to 1 when starting to flip down
    });

    // Test the match method
    it('should mark the card as matched', () => {
        const card = new Card();

        // Initial state
        card.isMatched = false;

        // Test matching
        card.match();
        expect(card.isMatched).toBe(true);

        // Matching again should keep it matched
        card.match();
        expect(card.isMatched).toBe(true);
    });

    // Test the updateFlipProgress method
    it('should update flip progress correctly when flipping up', () => {
        const card = new Card();

        // Setup for flipping up
        card.isFlipped = true;
        card.flipProgress = 0;

        // Update with a delta of 0.1
        card.updateFlipProgress(0.1, 2); // Using speed 2x
        expect(card.flipProgress).toBeCloseTo(0.2, 5); // 0 + (0.1 * 2)

        // Update again
        card.updateFlipProgress(0.1, 2);
        expect(card.flipProgress).toBeCloseTo(0.4, 5); // 0.2 + (0.1 * 2)

        // Update beyond 1
        card.updateFlipProgress(0.5, 2);
        expect(card.flipProgress).toBe(1); // Should cap at 1
    });

    it('should update flip progress correctly when flipping down', () => {
        const card = new Card();

        // Setup for flipping down
        card.isFlipped = false;
        card.flipProgress = 1;

        // Update with a delta of 0.1
        card.updateFlipProgress(0.1, 2); // Using speed 2x
        expect(card.flipProgress).toBeCloseTo(0.8, 5); // 1 - (0.1 * 2)

        // Update again
        card.updateFlipProgress(0.1, 2);
        expect(card.flipProgress).toBeCloseTo(0.6, 5); // 0.8 - (0.1 * 2)

        // Update beyond 0
        card.updateFlipProgress(0.5, 2);
        expect(card.flipProgress).toBe(0); // Should cap at 0
    });
}); 