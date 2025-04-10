import { component, field } from '@lastolivegames/becsy';

/**
 * Enum representing the different states of the game
 */
export enum GamePhase {
    INITIALIZING = 'initializing',
    READY = 'ready',
    PLAYING = 'playing',
    PAUSED = 'paused',
    GAME_OVER = 'game_over'
}

/**
 * Interface for selected card tracking
 */
export interface SelectedCard {
    entityId: number;
    value: number;
}

/**
 * Represents the game state that tracks progress and statistics
 */
@component
export class GameState {
    @field.int32 declare moveCount: number;
    @field.int32 declare matchCount: number;
    @field.int32 declare totalPairs: number;
    @field.float64 declare elapsedTime: number;
    @field.float64 declare startTime: number;
    @field.int32 declare phase: number; // Store phase as an integer
    @field.int32 declare firstSelectedCardEntityId: number;
    @field.int32 declare secondSelectedCardEntityId: number;
    @field.float64 declare lastMoveTime: number;
    @field.int32 declare score: number;

    /**
     * Applies a function to update the game state
     * @param updateFn - Pure function that returns updated game state properties
     */
    applyUpdate(updateFn: (state: GameState) => Partial<GameState> | null): GameState {
        const updates = updateFn(this);
        if (updates) {
            Object.assign(this, updates);
        }
        return this;
    }
}

// Convert GamePhase enum to number values for storage
export const GamePhaseValue = {
    [GamePhase.INITIALIZING]: 0,
    [GamePhase.READY]: 1,
    [GamePhase.PLAYING]: 2,
    [GamePhase.PAUSED]: 3,
    [GamePhase.GAME_OVER]: 4
};

// Convert number values back to GamePhase enum
export function getPhaseFromValue(value: number): GamePhase {
    switch (value) {
        case 0: return GamePhase.INITIALIZING;
        case 1: return GamePhase.READY;
        case 2: return GamePhase.PLAYING;
        case 3: return GamePhase.PAUSED;
        case 4: return GamePhase.GAME_OVER;
        default: return GamePhase.INITIALIZING;
    }
}

/**
 * Pure function to initialize a new game
 * @param state - The current game state
 * @param totalPairs - Total number of card pairs in the game
 * @returns Updated game state properties
 */
export function initializeGame(_state: GameState, totalPairs: number): Partial<GameState> {
    return {
        moveCount: 0,
        matchCount: 0,
        totalPairs,
        elapsedTime: 0,
        startTime: 0,
        phase: GamePhaseValue[GamePhase.INITIALIZING],
        firstSelectedCardEntityId: -1,
        secondSelectedCardEntityId: -1,
        lastMoveTime: 0,
        score: 0
    };
}

/**
 * Pure function to start the game
 * @param state - The current game state
 * @returns Updated game state properties
 */
export function startGame(_state: GameState): Partial<GameState> {
    return {
        phase: GamePhaseValue[GamePhase.PLAYING],
        startTime: performance.now(),
        lastMoveTime: performance.now()
    };
}

/**
 * Pure function to pause the game
 * @param state - The current game state
 * @returns Updated game state properties
 */
export function pauseGame(state: GameState): Partial<GameState> | null {
    // Only allow pausing if currently playing
    if (state.phase !== GamePhaseValue[GamePhase.PLAYING]) {
        return null;
    }

    return {
        phase: GamePhaseValue[GamePhase.PAUSED]
    };
}

/**
 * Pure function to resume the game
 * @param state - The current game state
 * @returns Updated game state properties
 */
export function resumeGame(state: GameState): Partial<GameState> | null {
    // Only allow resuming if currently paused
    if (state.phase !== GamePhaseValue[GamePhase.PAUSED]) {
        return null;
    }

    return {
        phase: GamePhaseValue[GamePhase.PLAYING],
        lastMoveTime: performance.now()
    };
}

/**
 * Pure function to select a card
 * @param state - The current game state
 * @param cardEntityId - Entity ID of the selected card
 * @param cardValue - Value of the selected card
 * @returns Updated game state properties or null if selection is invalid
 */
export function selectCard(
    state: GameState,
    cardEntityId: number,
    _cardValue: number
): Partial<GameState> | null {
    // Only allow selection when playing
    if (state.phase !== GamePhaseValue[GamePhase.PLAYING]) {
        return null;
    }

    // Check if card is already selected
    if (cardEntityId === state.firstSelectedCardEntityId ||
        cardEntityId === state.secondSelectedCardEntityId) {
        return null;
    }

    // First card selection
    if (state.firstSelectedCardEntityId === -1) {
        return {
            firstSelectedCardEntityId: cardEntityId,
            lastMoveTime: performance.now()
        };
    }

    // Second card selection
    if (state.secondSelectedCardEntityId === -1) {
        const moveCount = state.moveCount + 1;

        return {
            secondSelectedCardEntityId: cardEntityId,
            moveCount,
            lastMoveTime: performance.now()
        };
    }

    // Both slots are filled, which shouldn't happen in normal flow
    // This would be handled by the resetSelection function after evaluation
    return null;
}

/**
 * Pure function to check if selected cards match
 * @param state - The current game state
 * @param firstCardValue - Value of the first selected card
 * @param secondCardValue - Value of the second selected card
 * @returns Updated game state properties including match status
 */
export function checkForMatch(
    state: GameState,
    firstCardValue: number,
    secondCardValue: number
): Partial<GameState> {
    // Check if there's a match
    const isMatch = firstCardValue === secondCardValue;

    // Calculate updated state
    const matchCount = isMatch ? state.matchCount + 1 : state.matchCount;
    const isGameOver = matchCount >= state.totalPairs;

    // Calculate score - based on remaining time and moves
    // Simple scoring formula: (totalPairs * 100) - (moveCount * 5) + (remainingTimeBonus)
    let score = state.score;
    if (isMatch) {
        // Add points for match
        score += 50;

        // Add time bonus for quick matches (if match made within 3 seconds)
        const timeTaken = performance.now() - state.lastMoveTime;
        if (timeTaken < 3000) {
            score += Math.floor((3000 - timeTaken) / 100);
        }
    }

    // Game over state
    if (isGameOver) {
        return {
            matchCount,
            phase: GamePhaseValue[GamePhase.GAME_OVER],
            score,
            // Don't reset selections here as we want to show the last match
        };
    }

    return {
        matchCount,
        score
    };
}

/**
 * Pure function to reset card selection (after evaluating a pair)
 * @param state - The current game state
 * @returns Updated game state properties
 */
export function resetSelection(_state: GameState): Partial<GameState> {
    return {
        firstSelectedCardEntityId: -1,
        secondSelectedCardEntityId: -1,
        lastMoveTime: performance.now()
    };
}

/**
 * Pure function to update the game timer
 * @param state - The current game state
 * @param currentTime - Current timestamp
 * @returns Updated game state properties or null if no update needed
 */
export function updateGameTimer(state: GameState, currentTime: number): Partial<GameState> | null {
    // Only update timer if the game is in play
    if (state.phase !== GamePhaseValue[GamePhase.PLAYING]) {
        return null;
    }

    // Calculate elapsed time
    const startTime = state.startTime > 0 ? state.startTime : currentTime;
    const elapsedTime = (currentTime - startTime) / 1000; // Convert to seconds

    return {
        elapsedTime,
        startTime: startTime // Ensure startTime is set if it wasn't before
    };
}

/**
 * Pure function to format timer for display
 * @param seconds - Time in seconds
 * @returns Formatted time string (MM:SS)
 */
export function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = remainingSeconds.toString().padStart(2, '0');

    return `${minutesStr}:${secondsStr}`;
}

/**
 * Pure function to calculate final score
 * @param state - The current game state
 * @returns Final score
 */
export function calculateFinalScore(state: GameState): number {
    // Base score from matches
    let score = state.matchCount * 100;

    // Time bonus - faster completion means more points
    // For a typical memory game with 8 pairs, completing in 60 seconds is very good
    const timeBonus = Math.max(0, 120 - state.elapsedTime) * 5;

    // Move efficiency bonus - fewer moves means more points
    // Perfect play would be totalPairs * 2 moves
    const perfectMoves = state.totalPairs * 2;
    const moveEfficiency = Math.max(0, perfectMoves * 3 - state.moveCount);
    const moveBonus = moveEfficiency * 10;

    return score + timeBonus + moveBonus;
} 