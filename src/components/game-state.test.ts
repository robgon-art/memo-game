import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Becsy before importing the GameState class
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

// Mock performance.now for consistent testing
const originalPerformanceNow = performance.now;
let mockedTime = 1000;

beforeEach(() => {
    // Reset mocked time
    mockedTime = 1000;
    // Mock performance.now
    performance.now = vi.fn(() => mockedTime);
});

afterEach(() => {
    // Restore original performance.now
    performance.now = originalPerformanceNow;
});

// Import the GameState component and pure functions after mocking
import {
    GameState,
    GamePhase,
    GamePhaseValue,
    getPhaseFromValue,
    initializeGame,
    startGame,
    pauseGame,
    resumeGame,
    selectCard,
    checkForMatch,
    resetSelection,
    updateGameTimer,
    formatTime,
    calculateFinalScore
} from './game-state';

describe('GameState Component', () => {
    // Test class definition
    it('should define a GameState component with correct structure', () => {
        // Verify GameState exists and is a class
        expect(GameState).toBeDefined();
        expect(typeof GameState).toBe('function');

        // Check GameState prototype
        const statePrototype = GameState.prototype;
        expect(statePrototype).toBeDefined();

        // Verify methods exist
        expect(typeof statePrototype.applyUpdate).toBe('function');
    });

    // Test the applyUpdate method
    it('should apply updates to the game state', () => {
        const gameState = new GameState();
        gameState.moveCount = 5;
        gameState.matchCount = 2;

        // Define a test update function
        const testUpdate = (state: GameState) => ({
            moveCount: state.moveCount + 1,
            matchCount: state.matchCount + 1
        });

        // Apply the update
        gameState.applyUpdate(testUpdate);
        expect(gameState.moveCount).toBe(6);
        expect(gameState.matchCount).toBe(3);
    });

    it('should handle null updates gracefully', () => {
        const gameState = new GameState();
        gameState.moveCount = 5;

        // Define a test update function that returns null
        const testUpdate = () => null;

        // Apply the update
        gameState.applyUpdate(testUpdate);
        expect(gameState.moveCount).toBe(5); // Should remain unchanged
    });
});

describe('GamePhase and conversion utilities', () => {
    it('should correctly convert between GamePhase and numeric values', () => {
        // Test forward conversion
        expect(GamePhaseValue[GamePhase.INITIALIZING]).toBe(0);
        expect(GamePhaseValue[GamePhase.READY]).toBe(1);
        expect(GamePhaseValue[GamePhase.PLAYING]).toBe(2);
        expect(GamePhaseValue[GamePhase.PAUSED]).toBe(3);
        expect(GamePhaseValue[GamePhase.GAME_OVER]).toBe(4);

        // Test reverse conversion
        expect(getPhaseFromValue(0)).toBe(GamePhase.INITIALIZING);
        expect(getPhaseFromValue(1)).toBe(GamePhase.READY);
        expect(getPhaseFromValue(2)).toBe(GamePhase.PLAYING);
        expect(getPhaseFromValue(3)).toBe(GamePhase.PAUSED);
        expect(getPhaseFromValue(4)).toBe(GamePhase.GAME_OVER);

        // Test invalid value
        expect(getPhaseFromValue(100)).toBe(GamePhase.INITIALIZING);
    });
});

describe('initializeGame', () => {
    it('should correctly initialize a new game state', () => {
        const gameState = new GameState();
        const totalPairs = 8;

        const updates = initializeGame(gameState, totalPairs);

        expect(updates.moveCount).toBe(0);
        expect(updates.matchCount).toBe(0);
        expect(updates.totalPairs).toBe(totalPairs);
        expect(updates.elapsedTime).toBe(0);
        expect(updates.startTime).toBe(0);
        expect(updates.phase).toBe(GamePhaseValue[GamePhase.INITIALIZING]);
        expect(updates.firstSelectedCardEntityId).toBe(-1);
        expect(updates.secondSelectedCardEntityId).toBe(-1);
        expect(updates.score).toBe(0);
    });
});

describe('startGame', () => {
    it('should correctly update state when starting a game', () => {
        const gameState = new GameState();

        mockedTime = 2000; // Set mock time

        const updates = startGame(gameState);

        expect(updates.phase).toBe(GamePhaseValue[GamePhase.PLAYING]);
        expect(updates.startTime).toBe(2000);
        expect(updates.lastMoveTime).toBe(2000);
    });
});

describe('pauseGame', () => {
    it('should pause a playing game', () => {
        const gameState = new GameState();
        gameState.phase = GamePhaseValue[GamePhase.PLAYING];

        const updates = pauseGame(gameState);

        expect(updates).not.toBeNull();
        expect(updates?.phase).toBe(GamePhaseValue[GamePhase.PAUSED]);
    });

    it('should return null if game is not playing', () => {
        const gameState = new GameState();
        gameState.phase = GamePhaseValue[GamePhase.INITIALIZING];

        const updates = pauseGame(gameState);

        expect(updates).toBeNull();
    });
});

describe('resumeGame', () => {
    it('should resume a paused game', () => {
        const gameState = new GameState();
        gameState.phase = GamePhaseValue[GamePhase.PAUSED];

        mockedTime = 3000; // Set mock time

        const updates = resumeGame(gameState);

        expect(updates).not.toBeNull();
        expect(updates?.phase).toBe(GamePhaseValue[GamePhase.PLAYING]);
        expect(updates?.lastMoveTime).toBe(3000);
    });

    it('should return null if game is not paused', () => {
        const gameState = new GameState();
        gameState.phase = GamePhaseValue[GamePhase.PLAYING];

        const updates = resumeGame(gameState);

        expect(updates).toBeNull();
    });
});

describe('selectCard', () => {
    it('should select first card correctly', () => {
        const gameState = new GameState();
        gameState.phase = GamePhaseValue[GamePhase.PLAYING];
        gameState.firstSelectedCardEntityId = -1;
        gameState.secondSelectedCardEntityId = -1;

        mockedTime = 4000;

        const updates = selectCard(gameState, 101, 5);

        expect(updates).not.toBeNull();
        expect(updates?.firstSelectedCardEntityId).toBe(101);
        expect(updates?.lastMoveTime).toBe(4000);
    });

    it('should select second card correctly and increment move count', () => {
        const gameState = new GameState();
        gameState.phase = GamePhaseValue[GamePhase.PLAYING];
        gameState.firstSelectedCardEntityId = 101;
        gameState.secondSelectedCardEntityId = -1;
        gameState.moveCount = 5;

        mockedTime = 5000;

        const updates = selectCard(gameState, 102, 5);

        expect(updates).not.toBeNull();
        expect(updates?.secondSelectedCardEntityId).toBe(102);
        expect(updates?.moveCount).toBe(6);
        expect(updates?.lastMoveTime).toBe(5000);
    });

    it('should return null if game is not playing', () => {
        const gameState = new GameState();
        gameState.phase = GamePhaseValue[GamePhase.PAUSED];

        const updates = selectCard(gameState, 101, 5);

        expect(updates).toBeNull();
    });

    it('should return null if card is already selected', () => {
        const gameState = new GameState();
        gameState.phase = GamePhaseValue[GamePhase.PLAYING];
        gameState.firstSelectedCardEntityId = 101;
        gameState.secondSelectedCardEntityId = -1;

        const updates = selectCard(gameState, 101, 5);

        expect(updates).toBeNull();
    });

    it('should return null if both cards are already selected', () => {
        const gameState = new GameState();
        gameState.phase = GamePhaseValue[GamePhase.PLAYING];
        gameState.firstSelectedCardEntityId = 101;
        gameState.secondSelectedCardEntityId = 102;

        const updates = selectCard(gameState, 103, 5);

        expect(updates).toBeNull();
    });
});

describe('checkForMatch', () => {
    it('should correctly identify a match and update match count', () => {
        const gameState = new GameState();
        gameState.matchCount = 3;
        gameState.totalPairs = 8;
        gameState.score = 100;
        gameState.lastMoveTime = 6000;

        mockedTime = 6500; // 500ms after last move

        const updates = checkForMatch(gameState, 5, 5); // Same values = match

        expect(updates.matchCount).toBe(4);
        expect(updates.score).toBeGreaterThan(100); // Should increase score
    });

    it('should apply time bonus for quick matches', () => {
        const gameState = new GameState();
        gameState.matchCount = 3;
        gameState.score = 100;
        gameState.lastMoveTime = 6000;

        mockedTime = 6500; // 500ms after last move (very quick)

        const updates = checkForMatch(gameState, 5, 5);

        // Should include time bonus
        expect(updates.score).toBe(100 + 50 + Math.floor((3000 - 500) / 100));
    });

    it('should not update match count for non-matches', () => {
        const gameState = new GameState();
        gameState.matchCount = 3;
        gameState.score = 100;

        const updates = checkForMatch(gameState, 5, 6); // Different values = no match

        expect(updates.matchCount).toBe(3); // Unchanged
        expect(updates.score).toBe(100); // Unchanged
    });

    it('should set game over when all pairs are matched', () => {
        const gameState = new GameState();
        gameState.matchCount = 7;
        gameState.totalPairs = 8;
        gameState.score = 350;

        const updates = checkForMatch(gameState, 5, 5); // Last match

        expect(updates.matchCount).toBe(8);
        expect(updates.phase).toBe(GamePhaseValue[GamePhase.GAME_OVER]);
        expect(updates.score).toBeGreaterThan(350);
    });
});

describe('resetSelection', () => {
    it('should reset selected card IDs', () => {
        const gameState = new GameState();
        gameState.firstSelectedCardEntityId = 101;
        gameState.secondSelectedCardEntityId = 102;

        mockedTime = 7000;

        const updates = resetSelection(gameState);

        expect(updates.firstSelectedCardEntityId).toBe(-1);
        expect(updates.secondSelectedCardEntityId).toBe(-1);
        expect(updates.lastMoveTime).toBe(7000);
    });
});

describe('updateGameTimer', () => {
    it('should update elapsed time when game is playing', () => {
        const gameState = new GameState();
        gameState.phase = GamePhaseValue[GamePhase.PLAYING];
        gameState.startTime = 10000;
        gameState.elapsedTime = 5;

        const currentTime = 15000; // 5 seconds later

        const updates = updateGameTimer(gameState, currentTime);

        expect(updates).not.toBeNull();
        expect(updates?.elapsedTime).toBe(5); // 5 seconds
        expect(updates?.startTime).toBe(10000);
    });

    it('should use provided time as start time if no start time exists', () => {
        const gameState = new GameState();
        gameState.phase = GamePhaseValue[GamePhase.PLAYING];
        gameState.startTime = 0; // No start time yet
        gameState.elapsedTime = 0;

        const currentTime = 20000;

        const updates = updateGameTimer(gameState, currentTime);

        expect(updates).not.toBeNull();
        expect(updates?.elapsedTime).toBe(0); // Just started
        expect(updates?.startTime).toBe(20000);
    });

    it('should return null if game is not playing', () => {
        const gameState = new GameState();
        gameState.phase = GamePhaseValue[GamePhase.PAUSED];

        const updates = updateGameTimer(gameState, 10000);

        expect(updates).toBeNull();
    });
});

describe('formatTime', () => {
    it('should format seconds correctly', () => {
        expect(formatTime(0)).toBe('00:00');
        expect(formatTime(59)).toBe('00:59');
        expect(formatTime(60)).toBe('01:00');
        expect(formatTime(75)).toBe('01:15');
        expect(formatTime(3599)).toBe('59:59');
        expect(formatTime(3600)).toBe('60:00');
    });
});

describe('calculateFinalScore', () => {
    it('should calculate correct score based on matches, time, and moves', () => {
        const gameState = new GameState();
        gameState.matchCount = 8; // 8 pairs matched
        gameState.totalPairs = 8;
        gameState.elapsedTime = 90; // 90 seconds
        gameState.moveCount = 20; // 20 moves

        // Base score = 8 matches * 100 = 800
        // Time bonus = (120 - 90) * 5 = 150
        // Move efficiency = (8 * 2) * 3 - 20 = 28
        // Move bonus = 28 * 10 = 280
        // Total = 800 + 150 + 280 = 1230

        const score = calculateFinalScore(gameState);
        expect(score).toBe(1230);
    });

    it('should not apply negative bonuses for slow or inefficient games', () => {
        const gameState = new GameState();
        gameState.matchCount = 8;
        gameState.totalPairs = 8;
        gameState.elapsedTime = 200; // Very slow (over 2 minutes)
        gameState.moveCount = 50; // Very inefficient

        // Base score = 8 * 100 = 800
        // Time bonus = (120 - 200) capped at 0
        // Move efficiency = (8 * 2 * 3) - 50 = -2, capped at 0
        // Total = 800 + 0 + 0 = 800

        const score = calculateFinalScore(gameState);
        expect(score).toBe(800);
    });
}); 