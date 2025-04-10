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

// Import the Card component and pure functions after mocking
import { Card, flipCard, matchCard, updateCardFlipProgress } from './card';

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
        expect(typeof cardPrototype.applyUpdate).toBe('function');
    });

    // Test the applyUpdate method
    it('should apply updates to the card', () => {
        const card = new Card();
        card.isFlipped = false;
        
        // Define a test update function
        const testUpdate = (c: Card) => ({ isFlipped: !c.isFlipped });
        
        // Apply the update
        card.applyUpdate(testUpdate);
        expect(card.isFlipped).toBe(true);
    });

    it('should handle null updates gracefully', () => {
        const card = new Card();
        card.isFlipped = false;
        
        // Define a test update function that returns null
        const testUpdate = () => null;
        
        // Apply the update
        card.applyUpdate(testUpdate);
        expect(card.isFlipped).toBe(false); // Should remain unchanged
    });

    // Test the flipCard pure function
    it('should provide correct updates when flipping a card', () => {
        const card = new Card();

        // Initial state
        card.isFlipped = false;
        card.flipProgress = 0;

        // Test flipping
        const update1 = flipCard(card);
        expect(update1.isFlipped).toBe(true);
        expect(update1.flipProgress).toBe(0); // Reset to 0 when starting to flip up

        // Apply the update
        Object.assign(card, update1);
        
        // Test flipping again
        const update2 = flipCard(card);
        expect(update2.isFlipped).toBe(false);
        expect(update2.flipProgress).toBe(1); // Reset to 1 when starting to flip down
    });

    // Test the matchCard pure function
    it('should provide correct updates when matching a card', () => {
        const card = new Card();

        // Initial state
        card.isMatched = false;

        // Test matching
        const update = matchCard(card);
        expect(update).not.toBeNull();
        expect(update?.isMatched).toBe(true);
    });

    it('should return null when matching an already matched card', () => {
        const card = new Card();
        card.isMatched = true;

        // Test matching again
        const update = matchCard(card);
        expect(update).toBeNull();
    });

    // Test the updateCardFlipProgress pure function
    it('should provide correct updates when updating flip progress up', () => {
        const card = new Card();

        // Setup for flipping up
        card.isFlipped = true;
        card.flipProgress = 0;

        // Update with a delta of 0.1
        const update1 = updateCardFlipProgress(card, 0.1, 2); // Using speed 2x
        expect(update1).not.toBeNull();
        expect(update1?.flipProgress).toBeCloseTo(0.2, 5); // 0 + (0.1 * 2)

        // Apply the update
        if (update1) Object.assign(card, update1);

        // Update again
        const update2 = updateCardFlipProgress(card, 0.1, 2);
        expect(update2).not.toBeNull();
        expect(update2?.flipProgress).toBeCloseTo(0.4, 5); // 0.2 + (0.1 * 2)

        // Apply the update
        if (update2) Object.assign(card, update2);

        // Update beyond 1
        const update3 = updateCardFlipProgress(card, 0.5, 2);
        expect(update3).not.toBeNull();
        expect(update3?.flipProgress).toBe(1); // Should cap at 1
    });

    it('should provide correct updates when updating flip progress down', () => {
        const card = new Card();

        // Setup for flipping down
        card.isFlipped = false;
        card.flipProgress = 1;

        // Update with a delta of 0.1
        const update1 = updateCardFlipProgress(card, 0.1, 2); // Using speed 2x
        expect(update1).not.toBeNull();
        expect(update1?.flipProgress).toBeCloseTo(0.8, 5); // 1 - (0.1 * 2)

        // Apply the update
        if (update1) Object.assign(card, update1);

        // Update again
        const update2 = updateCardFlipProgress(card, 0.1, 2);
        expect(update2).not.toBeNull();
        expect(update2?.flipProgress).toBeCloseTo(0.6, 5); // 0.8 - (0.1 * 2)

        // Apply the update
        if (update2) Object.assign(card, update2);

        // Update beyond 0
        const update3 = updateCardFlipProgress(card, 0.5, 2);
        expect(update3).not.toBeNull();
        expect(update3?.flipProgress).toBe(0); // Should cap at 0
    });

    it('should return null when no flip progress change is needed', () => {
        const card = new Card();
        card.isFlipped = true;
        card.flipProgress = 1; // Already at max

        // Update should not change anything
        const update = updateCardFlipProgress(card, 0.1, 2);
        expect(update).toBeNull();
    });

    // Test the complete card update workflow using applyUpdate
    it('should correctly apply updates using the applyUpdate method', () => {
        const card = new Card();
        card.isFlipped = false;
        card.flipProgress = 0;
        
        // Flip the card using applyUpdate
        card.applyUpdate(flipCard);
        expect(card.isFlipped).toBe(true);
        expect(card.flipProgress).toBe(0);
        
        // Update flip progress
        card.applyUpdate(c => updateCardFlipProgress(c, 0.25, 1.0));
        expect(card.flipProgress).toBe(0.25);
        
        // Mark as matched
        card.applyUpdate(matchCard);
        expect(card.isMatched).toBe(true);
    });
}); 