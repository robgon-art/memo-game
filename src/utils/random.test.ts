import { describe, it, expect } from 'vitest';
import {
    shuffle,
    createRandomGenerator,
    createCardPairs,
    generateShuffledCardValues,
    ensureFairDistribution,
    hasAdjacentPairs,
    generateCardValuesForBoard
} from './random';

describe('shuffle', () => {
    it('should return a new array', () => {
        const original = [1, 2, 3, 4, 5];
        const shuffled = shuffle(original);

        expect(shuffled).not.toBe(original); // Different reference
        expect(shuffled.length).toBe(original.length); // Same length
    });

    it('should contain all the same elements', () => {
        const original = [1, 2, 3, 4, 5];
        const shuffled = shuffle([...original]); // Copy to avoid side effects

        expect(shuffled.sort()).toEqual(original.sort());
    });
});

describe('createRandomGenerator', () => {
    it('should create a deterministic random generator when seeded', () => {
        const seed = 12345;
        const generator1 = createRandomGenerator(seed);
        const generator2 = createRandomGenerator(seed);

        // Should generate the same sequence
        expect(generator1()).toBe(generator2());
        expect(generator1()).toBe(generator2());
    });

    it('should generate values between 0 and 1', () => {
        const generator = createRandomGenerator(12345);

        for (let i = 0; i < 10; i++) {
            const value = generator();
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThan(1);
        }
    });
});

describe('createCardPairs', () => {
    it('should create an array with each value appearing exactly twice', () => {
        const pairCount = 3;
        const pairs = createCardPairs(pairCount);

        expect(pairs.length).toBe(pairCount * 2);

        // Count occurrences of each value
        const counts = new Map<number, number>();
        pairs.forEach(value => {
            counts.set(value, (counts.get(value) || 0) + 1);
        });

        // Each value should appear exactly twice
        for (let i = 1; i <= pairCount; i++) {
            expect(counts.get(i)).toBe(2);
        }
    });
});

describe('generateShuffledCardValues', () => {
    it('should generate the correct number of card values', () => {
        const pairCount = 4;
        const values = generateShuffledCardValues(pairCount);

        expect(values.length).toBe(pairCount * 2);
    });

    it('should include each value exactly twice', () => {
        const pairCount = 4;
        const values = generateShuffledCardValues(pairCount);
        const counts = new Map<number, number>();

        values.forEach(value => {
            counts.set(value, (counts.get(value) || 0) + 1);
        });

        for (let i = 1; i <= pairCount; i++) {
            expect(counts.get(i)).toBe(2);
        }
    });
});

describe('hasAdjacentPairs', () => {
    it('should return true when the array has adjacent matching values', () => {
        expect(hasAdjacentPairs([1, 2, 2, 3, 4])).toBe(true);
        expect(hasAdjacentPairs([1, 1, 2, 3, 4])).toBe(true);
        expect(hasAdjacentPairs([1, 2, 3, 4, 4])).toBe(true);
    });

    it('should return false when the array has no adjacent matching values', () => {
        expect(hasAdjacentPairs([1, 2, 3, 4, 5])).toBe(false);
        expect(hasAdjacentPairs([1, 2, 3, 1, 2])).toBe(false);
    });

    it('should handle empty arrays', () => {
        expect(hasAdjacentPairs([])).toBe(false);
    });
});

describe('ensureFairDistribution', () => {
    it('should return an array of the same length', () => {
        const original = [1, 1, 2, 2, 3, 3];
        const result = ensureFairDistribution(original);

        expect(result.length).toBe(original.length);
    });

    it('should contain the same elements as the input array', () => {
        const original = [1, 1, 2, 2, 3, 3];
        const result = ensureFairDistribution(original);

        // Sort both arrays to compare elements
        expect([...result].sort()).toEqual([...original].sort());
    });

    it('should return a new array', () => {
        const original = [1, 1, 2, 2, 3, 3];
        const result = ensureFairDistribution(original);

        expect(result).not.toBe(original); // Different reference
    });

    it('should respect the maxAttempts parameter', () => {
        const original = [1, 1, 2, 2, 3, 3];
        const maxAttempts = 1;

        // We still expect a valid result, just testing the parameter is respected
        const result = ensureFairDistribution(original, maxAttempts);

        expect(result.length).toBe(original.length);
    });
});

describe('generateCardValuesForBoard', () => {
    it('should generate appropriate number of card values for the board', () => {
        const rows = 4;
        const columns = 5;

        const values = generateCardValuesForBoard(rows, columns);

        expect(values.length).toBe(rows * columns);
    });

    it('should throw error if board dimensions result in odd number of cards', () => {
        const rows = 3;
        const columns = 5; // 15 cards total (odd number)

        expect(() => generateCardValuesForBoard(rows, columns)).toThrow();
    });

    it('should ensure each card appears exactly twice', () => {
        const rows = 4;
        const columns = 4; // 16 cards = 8 pairs
        const values = generateCardValuesForBoard(rows, columns);

        // Count occurrences of each value
        const counts = new Map<number, number>();
        values.forEach(value => {
            counts.set(value, (counts.get(value) || 0) + 1);
        });

        // Each value should appear exactly twice
        for (const count of counts.values()) {
            expect(count).toBe(2);
        }
    });
}); 