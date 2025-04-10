/**
 * Utilities for randomization and card shuffling
 * Using pure functional programming techniques
 */

/**
 * Fisher-Yates shuffle algorithm implemented as a pure function
 * @param array The array to shuffle
 * @returns A new shuffled array (original array is not modified)
 */
export function shuffle<T>(array: readonly T[]): T[] {
    // Create a copy to avoid mutating the original array
    const result = [...array];

    // Fisher-Yates shuffle algorithm
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        // Swap elements using destructuring assignment
        [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
}

/**
 * Generate a seed for deterministic randomization (useful for testing)
 * @param seed Initial seed value
 * @returns A function that generates next pseudorandom value
 */
export function createRandomGenerator(seed: number = Date.now()): () => number {
    // Simple linear congruential generator
    let currentSeed = seed;

    return () => {
        currentSeed = (currentSeed * 1664525 + 1013904223) % 2 ** 32;
        return currentSeed / 2 ** 32;
    };
}

/**
 * Creates an array of card value pairs for the memory game
 * @param pairCount Number of unique pairs needed
 * @returns Array with each value appearing exactly twice
 */
export function createCardPairs(pairCount: number): number[] {
    // Generate array of values where each appears exactly twice
    const values = Array.from({ length: pairCount }, (_, i) => i + 1);

    // Double each value to create pairs
    return values.flatMap(value => [value, value]);
}

/**
 * Create a shuffled array of card pairs
 * @param pairCount Number of unique pairs to generate
 * @returns Shuffled array with fair distribution of card pairs
 */
export function generateShuffledCardValues(pairCount: number): number[] {
    const pairs = createCardPairs(pairCount);
    return shuffle(pairs);
}

/**
 * Ensure fair distribution by checking if any pairs are adjacent
 * and reshuffling if needed
 * @param values Array of card values
 * @param maxAttempts Maximum shuffle attempts (default: 3)
 * @returns Fairly distributed card values
 */
export function ensureFairDistribution(values: readonly number[], maxAttempts: number = 3): number[] {
    let result = [...values];
    let attempts = 0;

    // Keep shuffling until we get a fair distribution or reach max attempts
    while (hasAdjacentPairs(result) && attempts < maxAttempts) {
        result = shuffle(result);
        attempts++;
    }

    return result;
}

/**
 * Check if any pairs of matching values are adjacent in the array
 * @param values Array to check
 * @returns True if any matching values are adjacent
 */
export function hasAdjacentPairs(values: readonly number[]): boolean {
    for (let i = 0; i < values.length - 1; i++) {
        if (values[i] === values[i + 1]) {
            return true;
        }
    }
    return false;
}

/**
 * Generate card values for a game board
 * This combines all operations needed to create a fair, shuffled set of cards
 * @param rows Number of rows in the board
 * @param columns Number of columns in the board
 * @returns Shuffled array of card values sized appropriately for the board
 */
export function generateCardValuesForBoard(rows: number, columns: number): number[] {
    const totalCards = rows * columns;

    // Ensure we can create complete pairs
    if (totalCards % 2 !== 0) {
        throw new Error(`Board dimensions (${rows}x${columns}) must allow for even number of cards`);
    }

    const pairCount = totalCards / 2;
    const pairs = createCardPairs(pairCount);
    const shuffled = shuffle(pairs);

    return ensureFairDistribution(shuffled);
} 