import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    GameLogicSystem,
    processGameInput,
    evaluateCardMatches,
    handleUnmatchedCards,
    InputEvent
} from './game-logic-system';
import { Card } from '../components/card';
import { GameState, GamePhase, GamePhaseValue } from '../components/game-state';
import { Board } from '../components/board';

// Mock the minimal necessary parts of Becsy
vi.mock('@lastolivegames/becsy', () => {
    return {
        System: class MockSystem {
            queries = {};
        },
        system: function (target: any) { return target; },
        component: function (target: any) { return target; },
        field: {
            boolean: vi.fn(),
            int32: vi.fn(),
            float64: vi.fn(),
            object: vi.fn()
        },
        Entity: class MockEntity { }
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

// Define a type that matches our mock entity
type MockEntity = {
    id: number;
    read: (component: any) => any;
};

// Helper function to create a mock entity with read method
function createMockEntity(id: number, cardProps: Partial<Card> = {}): MockEntity {
    const card = new Card();

    // Default values
    card.id = id;
    card.value = id;
    card.isFlipped = false;
    card.isMatched = false;
    card.flipProgress = 0;
    card.x = 100;
    card.y = 100;
    card.width = 80;
    card.height = 120;

    // Apply provided properties
    Object.assign(card, cardProps);

    return {
        id,
        read: (component: any) => {
            if (component === Card) {
                return card;
            }
            throw new Error(`Unexpected component read: ${component}`);
        }
    };
}

describe('Game Logic Pure Functions', () => {
    // Test processGameInput function
    describe('processGameInput', () => {
        it('should handle click events and select cards', () => {
            // Create test data
            const gameState = new GameState();
            gameState.phase = GamePhaseValue[GamePhase.PLAYING];
            gameState.firstSelectedCardEntityId = -1;
            gameState.secondSelectedCardEntityId = -1;

            const board = new Board();
            board.rows = 2;
            board.columns = 2;
            board.cardWidth = 100;
            board.cardHeight = 150;
            board.gap = 10;

            const cardEntities = [
                createMockEntity(1, { x: 50, y: 75 }),
                createMockEntity(2, { x: 160, y: 75 }),
                createMockEntity(3, { x: 50, y: 235 }),
                createMockEntity(4, { x: 160, y: 235 })
            ];

            // Create click event on first card
            const event: InputEvent = {
                type: 'click',
                x: 50,
                y: 75,
                timestamp: 1000
            };

            // Process input
            const { stateUpdates, cardUpdates } = processGameInput(
                event,
                gameState,
                board,
                cardEntities as any
            );

            // Check state updates
            expect(stateUpdates).not.toBeNull();
            expect(stateUpdates?.firstSelectedCardEntityId).toBe(1);

            // Check card updates
            expect(cardUpdates.size).toBe(1);
            expect(cardUpdates.get(cardEntities[0] as any)).toEqual(
                expect.objectContaining({ isFlipped: true })
            );
        });

        it('should ignore clicks if game is not in PLAYING state', () => {
            // Create test data with game in PAUSED state
            const gameState = new GameState();
            gameState.phase = GamePhaseValue[GamePhase.PAUSED];

            const board = new Board();
            const cardEntities = [createMockEntity(1)];

            // Create click event
            const event: InputEvent = {
                type: 'click',
                x: 50,
                y: 75,
                timestamp: 1000
            };

            // Process input
            const { stateUpdates, cardUpdates } = processGameInput(
                event,
                gameState,
                board,
                cardEntities as any
            );

            // No updates should be made
            expect(stateUpdates).toBeNull();
            expect(cardUpdates.size).toBe(0);
        });

        it('should ignore clicks on already flipped or matched cards', () => {
            // Create test data
            const gameState = new GameState();
            gameState.phase = GamePhaseValue[GamePhase.PLAYING];

            const board = new Board();
            board.rows = 1;
            board.columns = 2;
            board.cardWidth = 100;
            board.cardHeight = 150;
            board.gap = 10;

            // Create one flipped card and one matched card
            const cardEntities = [
                createMockEntity(1, { x: 50, y: 75, isFlipped: true }),
                createMockEntity(2, { x: 160, y: 75, isMatched: true })
            ];

            // Click on flipped card
            const event1: InputEvent = {
                type: 'click',
                x: 50,
                y: 75,
                timestamp: 1000
            };

            // Click on matched card
            const event2: InputEvent = {
                type: 'click',
                x: 160,
                y: 75,
                timestamp: 1000
            };

            // Process inputs
            const result1 = processGameInput(event1, gameState, board, cardEntities as any);
            const result2 = processGameInput(event2, gameState, board, cardEntities as any);

            // No updates should be made for either click
            expect(result1.stateUpdates).toBeNull();
            expect(result1.cardUpdates.size).toBe(0);
            expect(result2.stateUpdates).toBeNull();
            expect(result2.cardUpdates.size).toBe(0);
        });
    });

    // Test evaluateCardMatches function
    describe('evaluateCardMatches', () => {
        it('should correctly identify matching cards', () => {
            // Create test data
            const gameState = new GameState();
            gameState.firstSelectedCardEntityId = 1;
            gameState.secondSelectedCardEntityId = 2;
            gameState.matchCount = 0;
            gameState.totalPairs = 4;
            gameState.score = 0;

            // Cards with the same value (matching pair)
            const cardEntities = [
                createMockEntity(1, { value: 5 }),
                createMockEntity(2, { value: 5 })
            ];

            // Process the match
            const { stateUpdates, cardUpdates } = evaluateCardMatches(
                gameState,
                cardEntities as any
            );

            // Check state updates
            expect(stateUpdates).not.toBeNull();
            expect(stateUpdates?.matchCount).toBe(1);
            expect(stateUpdates?.score).toBeGreaterThan(0);

            // Check card updates - both cards should be marked as matched
            expect(cardUpdates.size).toBe(2);
            expect(cardUpdates.get(cardEntities[0] as any)).toEqual(
                expect.objectContaining({ isMatched: true })
            );
            expect(cardUpdates.get(cardEntities[1] as any)).toEqual(
                expect.objectContaining({ isMatched: true })
            );
        });

        it('should not match cards with different values', () => {
            // Create test data
            const gameState = new GameState();
            gameState.firstSelectedCardEntityId = 1;
            gameState.secondSelectedCardEntityId = 2;
            gameState.matchCount = 0;

            // Cards with different values (non-matching pair)
            const cardEntities = [
                createMockEntity(1, { value: 5 }),
                createMockEntity(2, { value: 6 })
            ];

            // Process the match
            const { stateUpdates, cardUpdates } = evaluateCardMatches(
                gameState,
                cardEntities as any
            );

            // Check state updates - matchCount should remain unchanged
            expect(stateUpdates).not.toBeNull();
            expect(stateUpdates?.matchCount).toBe(0);

            // Check card updates - no cards should be marked as matched
            expect(cardUpdates.size).toBe(0);
        });

        it('should detect game over when all pairs are matched', () => {
            // Create test data
            const gameState = new GameState();
            gameState.firstSelectedCardEntityId = 1;
            gameState.secondSelectedCardEntityId = 2;
            gameState.matchCount = 3; // Already matched 3 pairs
            gameState.totalPairs = 4; // Need 4 pairs to complete
            gameState.phase = GamePhaseValue[GamePhase.PLAYING];

            // Cards with the same value (matching pair - the last pair)
            const cardEntities = [
                createMockEntity(1, { value: 5 }),
                createMockEntity(2, { value: 5 })
            ];

            // Process the match
            const { stateUpdates } = evaluateCardMatches(
                gameState,
                cardEntities as any
            );

            // Check state updates
            expect(stateUpdates).not.toBeNull();
            expect(stateUpdates?.matchCount).toBe(4); // All pairs matched
            expect(stateUpdates?.phase).toBe(GamePhaseValue[GamePhase.GAME_OVER]); // Game over
        });
    });

    // Test handleUnmatchedCards function
    describe('handleUnmatchedCards', () => {
        it('should flip back unmatched cards after delay', () => {
            // Create test data
            const gameState = new GameState();
            gameState.firstSelectedCardEntityId = 1;
            gameState.secondSelectedCardEntityId = 2;
            gameState.lastMoveTime = 1000; // Initial time

            // Two flipped but unmatched cards
            const cardEntities = [
                createMockEntity(1, { value: 5, isFlipped: true }),
                createMockEntity(2, { value: 6, isFlipped: true })
            ];

            // Set current time to 2100ms (1100ms after lastMoveTime)
            const currentTime = 2100; // More than the NON_MATCH_FLIP_DELAY

            // Process unmatched cards
            const { stateUpdates, cardUpdates } = handleUnmatchedCards(
                gameState,
                cardEntities as any,
                currentTime
            );

            // Check state updates
            expect(stateUpdates).not.toBeNull();
            expect(stateUpdates?.firstSelectedCardEntityId).toBe(-1); // Reset selection
            expect(stateUpdates?.secondSelectedCardEntityId).toBe(-1); // Reset selection

            // Check card updates - both cards should be flipped back
            expect(cardUpdates.size).toBe(2);
            expect(cardUpdates.get(cardEntities[0] as any)).toEqual(
                expect.objectContaining({ isFlipped: false })
            );
            expect(cardUpdates.get(cardEntities[1] as any)).toEqual(
                expect.objectContaining({ isFlipped: false })
            );
        });

        it('should not flip back cards before delay has passed', () => {
            // Create test data
            const gameState = new GameState();
            gameState.firstSelectedCardEntityId = 1;
            gameState.secondSelectedCardEntityId = 2;
            gameState.lastMoveTime = 1000; // Initial time

            // Two flipped but unmatched cards
            const cardEntities = [
                createMockEntity(1, { value: 5, isFlipped: true }),
                createMockEntity(2, { value: 6, isFlipped: true })
            ];

            // Set current time to 1500ms (500ms after lastMoveTime)
            const currentTime = 1500; // Less than the NON_MATCH_FLIP_DELAY

            // Process unmatched cards
            const { stateUpdates, cardUpdates } = handleUnmatchedCards(
                gameState,
                cardEntities as any,
                currentTime
            );

            // No updates should be made yet
            expect(stateUpdates).toBeNull();
            expect(cardUpdates.size).toBe(0);
        });

        it('should not flip back matched cards', () => {
            // Create test data
            const gameState = new GameState();
            gameState.firstSelectedCardEntityId = 1;
            gameState.secondSelectedCardEntityId = 2;
            gameState.lastMoveTime = 1000; // Initial time

            // Two matched cards
            const cardEntities = [
                createMockEntity(1, { value: 5, isFlipped: true, isMatched: true }),
                createMockEntity(2, { value: 5, isFlipped: true, isMatched: true })
            ];

            // Set current time to 2100ms (1100ms after lastMoveTime)
            const currentTime = 2100; // More than the NON_MATCH_FLIP_DELAY

            // Process cards
            const { stateUpdates, cardUpdates } = handleUnmatchedCards(
                gameState,
                cardEntities as any,
                currentTime
            );

            // No updates should be made
            expect(stateUpdates).toBeNull();
            expect(cardUpdates.size).toBe(0);
        });
    });
});

describe('GameLogicSystem', () => {
    let gameLogicSystem: GameLogicSystem;

    beforeEach(() => {
        // Create a new instance
        gameLogicSystem = new GameLogicSystem();

        // Setup query results
        (gameLogicSystem as any).queries = {
            board: { results: [createMockEntity(999)] },
            gameState: {
                results: [{
                    id: 998,
                    read: () => {
                        const state = new GameState();
                        state.phase = GamePhaseValue[GamePhase.PLAYING];
                        state.firstSelectedCardEntityId = -1;
                        state.secondSelectedCardEntityId = -1;
                        state.matchCount = 0;
                        state.totalPairs = 4;
                        return state;
                    }
                }]
            },
            cards: {
                results: [
                    createMockEntity(1, { value: 1 }),
                    createMockEntity(2, { value: 1 }),
                    createMockEntity(3, { value: 2 }),
                    createMockEntity(4, { value: 2 })
                ]
            }
        };
    });

    it('should handle adding input events to the queue', () => {
        // Add an event
        const event: InputEvent = {
            type: 'click',
            x: 100,
            y: 100,
            timestamp: 1000
        };

        gameLogicSystem.addInputEvent(event);

        // Verify it was added to the queue
        expect((gameLogicSystem as any).inputEvents).toContainEqual(event);
    });

    it('should provide access to current game phase for testing', () => {
        // Set up system with a specific phase
        (gameLogicSystem as any).queries.gameState.results = [{
            id: 998,
            read: () => {
                const state = new GameState();
                state.phase = GamePhaseValue[GamePhase.PAUSED];
                return state;
            }
        }];

        // Check if phase is correctly reported
        expect(gameLogicSystem.getCurrentPhase()).toBe(GamePhase.PAUSED);
    });

    it('should provide access to game state for testing', () => {
        // Set up system with specific state values
        const mockState = new GameState();
        mockState.moveCount = 5;
        mockState.matchCount = 2;

        (gameLogicSystem as any).queries.gameState.results = [{
            id: 998,
            read: () => mockState
        }];

        // Check if state is correctly reported
        const state = gameLogicSystem.getGameState();
        expect(state).toBe(mockState);
        expect(state?.moveCount).toBe(5);
        expect(state?.matchCount).toBe(2);
    });

    it('should provide access to card entities for testing', () => {
        // Set up system with 4 card entities
        const mockCards = [
            createMockEntity(1),
            createMockEntity(2),
            createMockEntity(3),
            createMockEntity(4)
        ];

        (gameLogicSystem as any).queries.cards.results = mockCards;

        // Check if cards are correctly reported
        const cards = gameLogicSystem.getCardEntities();
        expect(cards).toEqual(mockCards);
        expect(cards.length).toBe(4);
    });
});

describe('GameLogicSystem Integration Tests', () => {
    let gameLogicSystem: GameLogicSystem;
    let gameState: GameState;

    beforeEach(() => {
        // Create a new instance
        gameLogicSystem = new GameLogicSystem();

        // Create a realistic game state
        gameState = new GameState();
        gameState.phase = GamePhaseValue[GamePhase.PLAYING];
        gameState.firstSelectedCardEntityId = -1;
        gameState.secondSelectedCardEntityId = -1;
        gameState.matchCount = 0;
        gameState.totalPairs = 2;
        gameState.moveCount = 0;
        gameState.score = 0;
        gameState.lastMoveTime = 0;

        // Setup query results with realistic card entities
        (gameLogicSystem as any).queries = {
            board: {
                results: [{
                    id: 999,
                    read: (component: any) => {
                        if (component === Board) {
                            const board = new Board();
                            board.rows = 2;
                            board.columns = 2;
                            board.cardWidth = 100;
                            board.cardHeight = 150;
                            board.gap = 10;
                            return board;
                        }
                        throw new Error(`Unexpected component read: ${component}`);
                    }
                }]
            },
            gameState: {
                results: [{
                    id: 998,
                    read: (component: any) => {
                        if (component === GameState) {
                            return gameState;
                        }
                        throw new Error(`Unexpected component read: ${component}`);
                    }
                }]
            },
            cards: {
                results: [
                    createMockEntity(1, { value: 1 }),
                    createMockEntity(2, { value: 1 }),
                    createMockEntity(3, { value: 2 }),
                    createMockEntity(4, { value: 2 })
                ]
            }
        };
    });

    it('should process execute method and update game timer', () => {
        // Set a starting time
        mockedTime = 5000;
        gameState.startTime = 1000; // 4 seconds ago

        // Execute the system
        gameLogicSystem.execute();

        // Check that timer was updated
        expect(gameState.elapsedTime).toBe(4); // 4 seconds
    });

    it('should process card selection through the full execute flow', () => {
        // Create a click event for the first card
        const event: InputEvent = {
            type: 'click',
            x: 50, // Position of first card
            y: 75,
            timestamp: mockedTime
        };

        // Add the event
        gameLogicSystem.addInputEvent(event);

        // Execute the system
        gameLogicSystem.execute();

        // Verify card was selected and flipped
        expect(gameState.firstSelectedCardEntityId).toBe(1);
        const cardEntities = (gameLogicSystem as any).queries.cards.results;
        expect(cardEntities[0].read(Card).isFlipped).toBe(true);
    });

    it('should match cards and update game state when two matching cards are selected', () => {
        // Set up the initial state with first card already selected
        gameState.firstSelectedCardEntityId = 1;
        const cardEntities = (gameLogicSystem as any).queries.cards.results;
        const firstCard = cardEntities[0].read(Card);
        firstCard.isFlipped = true;
        firstCard.value = 5;

        // Set the second card to have the same value
        const secondCard = cardEntities[1].read(Card);
        secondCard.value = 5;

        // Create a click event for the second card
        const event: InputEvent = {
            type: 'click',
            x: 160, // Position of second card
            y: 75,
            timestamp: mockedTime
        };

        // Add the event and execute
        gameLogicSystem.addInputEvent(event);

        // The issue is that execute() runs both processInputEvents and evaluateGameState,
        // so we need to avoid running it twice, or we'll get double match processing
        gameLogicSystem.execute();

        // Verify match was processed in a single execution
        expect(gameState.matchCount).toBe(1);
        expect(firstCard.isMatched).toBe(true);
        expect(secondCard.isMatched).toBe(true);

        // Score should have increased
        expect(gameState.score).toBeGreaterThan(0);
    });

    it('should flip cards back when they do not match', () => {
        // Set up the initial state with both cards selected but not matching
        gameState.firstSelectedCardEntityId = 1;
        gameState.secondSelectedCardEntityId = 3; // Different values
        gameState.lastMoveTime = mockedTime;

        const cardEntities = (gameLogicSystem as any).queries.cards.results;
        const firstCard = cardEntities[0].read(Card);
        firstCard.isFlipped = true;
        firstCard.value = 5;

        const secondCard = cardEntities[2].read(Card); // Using the third card (index 2)
        secondCard.isFlipped = true;
        secondCard.value = 6; // Different value

        // First execute to evaluate the non-match
        gameLogicSystem.execute();

        // Cards should still be flipped
        expect(firstCard.isFlipped).toBe(true);
        expect(secondCard.isFlipped).toBe(true);

        // Advance time beyond the flip delay
        mockedTime += NON_MATCH_FLIP_DELAY + 100; // Add a bit extra

        // Execute again to handle unmatched cards
        gameLogicSystem.execute();

        // Verify cards were flipped back
        expect(firstCard.isFlipped).toBe(false);
        expect(secondCard.isFlipped).toBe(false);

        // Selection should be reset
        expect(gameState.firstSelectedCardEntityId).toBe(-1);
        expect(gameState.secondSelectedCardEntityId).toBe(-1);
    });

    it('should detect game completion and transition to GAME_OVER state', () => {
        // Set up the state with almost all matches found
        gameState.matchCount = 1; // Already matched 1 pair
        gameState.totalPairs = 2; // Need 2 pairs total

        // Set up the two cards that will match and complete the game
        gameState.firstSelectedCardEntityId = 3;
        gameState.secondSelectedCardEntityId = 4;

        const cardEntities = (gameLogicSystem as any).queries.cards.results;
        const firstCard = cardEntities[2].read(Card); // Card with id 3
        firstCard.isFlipped = true;
        firstCard.value = 8;

        const secondCard = cardEntities[3].read(Card); // Card with id 4
        secondCard.isFlipped = true;
        secondCard.value = 8; // Same value to match

        // Execute the system to process the match
        gameLogicSystem.execute();

        // Verify game is over
        expect(gameState.phase).toBe(GamePhaseValue[GamePhase.GAME_OVER]);
        expect(gameState.matchCount).toBe(2); // All pairs matched
    });

    it('should not process events if game is not in PLAYING state', () => {
        // Set game to PAUSED
        gameState.phase = GamePhaseValue[GamePhase.PAUSED];

        // Create a click event
        const event: InputEvent = {
            type: 'click',
            x: 50,
            y: 75,
            timestamp: mockedTime
        };

        // Add the event
        gameLogicSystem.addInputEvent(event);

        // Execute the system
        gameLogicSystem.execute();

        // Verify selection was not changed
        expect(gameState.firstSelectedCardEntityId).toBe(-1);

        // Card should not be flipped
        const cardEntities = (gameLogicSystem as any).queries.cards.results;
        expect(cardEntities[0].read(Card).isFlipped).toBe(false);
    });
});

// Import the NON_MATCH_FLIP_DELAY constant from the system
import { NON_MATCH_FLIP_DELAY } from './game-logic-system';

// Add more edge case tests for the pure functions
describe('Pure Functions Edge Cases', () => {
    describe('processGameInput', () => {
        it('should handle click events outside card area', () => {
            const gameState = new GameState();
            gameState.phase = GamePhaseValue[GamePhase.PLAYING];

            const board = new Board();
            board.rows = 2;
            board.columns = 2;
            board.cardWidth = 100;
            board.cardHeight = 150;
            board.gap = 10;

            const cardEntities = [
                createMockEntity(1, { x: 50, y: 75 }),
                createMockEntity(2, { x: 160, y: 75 })
            ];

            // Click event in the gap between cards
            const event: InputEvent = {
                type: 'click',
                x: 105, // In the gap
                y: 75,
                timestamp: 1000
            };

            // Process input
            const { stateUpdates, cardUpdates } = processGameInput(
                event,
                gameState,
                board,
                cardEntities as any
            );

            // No updates should be made
            expect(stateUpdates).toBeNull();
            expect(cardUpdates.size).toBe(0);
        });

        it('should handle click events with missing coordinates', () => {
            const gameState = new GameState();
            gameState.phase = GamePhaseValue[GamePhase.PLAYING];

            const board = new Board();
            const cardEntities = [createMockEntity(1)];

            // Click event missing coordinates
            const event: InputEvent = {
                type: 'click',
                // x and y are undefined
                timestamp: 1000
            };

            // Process input
            const { stateUpdates, cardUpdates } = processGameInput(
                event,
                gameState,
                board,
                cardEntities as any
            );

            // No updates should be made
            expect(stateUpdates).toBeNull();
            expect(cardUpdates.size).toBe(0);
        });

        it('should handle keyboard events with missing entity ID', () => {
            const gameState = new GameState();
            gameState.phase = GamePhaseValue[GamePhase.PLAYING];

            const board = new Board();
            const cardEntities = [createMockEntity(1)];

            // Keyboard event with no entity ID
            const event: InputEvent = {
                type: 'key',
                key: 'Enter',
                timestamp: 1000
            };

            // Process input
            const { stateUpdates, cardUpdates } = processGameInput(
                event,
                gameState,
                board,
                cardEntities as any
            );

            // No updates should be made
            expect(stateUpdates).toBeNull();
            expect(cardUpdates.size).toBe(0);
        });

        it('should handle keyboard events with invalid entity ID', () => {
            const gameState = new GameState();
            gameState.phase = GamePhaseValue[GamePhase.PLAYING];

            const board = new Board();
            const cardEntities = [createMockEntity(1)];

            // Keyboard event with invalid entity ID
            const event: InputEvent = {
                type: 'key',
                key: 'Enter',
                entityId: 999, // Not in the entities array
                timestamp: 1000
            };

            // Process input
            const { stateUpdates, cardUpdates } = processGameInput(
                event,
                gameState,
                board,
                cardEntities as any
            );

            // No updates should be made
            expect(stateUpdates).toBeNull();
            expect(cardUpdates.size).toBe(0);
        });
    });

    describe('evaluateCardMatches', () => {
        it('should handle case where selected entity IDs point to non-existent cards', () => {
            const gameState = new GameState();
            gameState.firstSelectedCardEntityId = 999; // Non-existent
            gameState.secondSelectedCardEntityId = 888; // Non-existent

            const cardEntities = [
                createMockEntity(1, { value: 5 }),
                createMockEntity(2, { value: 6 })
            ];

            // Process the match
            const { stateUpdates, cardUpdates } = evaluateCardMatches(
                gameState,
                cardEntities as any
            );

            // Should reset the selection
            expect(stateUpdates).not.toBeNull();
            expect(stateUpdates?.firstSelectedCardEntityId).toBe(-1);
            expect(stateUpdates?.secondSelectedCardEntityId).toBe(-1);
            expect(cardUpdates.size).toBe(0);
        });

        it('should handle case where only first selected card exists', () => {
            const gameState = new GameState();
            gameState.firstSelectedCardEntityId = 1; // Exists
            gameState.secondSelectedCardEntityId = 999; // Non-existent

            const cardEntities = [
                createMockEntity(1, { value: 5 }),
                createMockEntity(2, { value: 6 })
            ];

            // Process the match
            const { stateUpdates, cardUpdates } = evaluateCardMatches(
                gameState,
                cardEntities as any
            );

            // Should reset the selection
            expect(stateUpdates).not.toBeNull();
            expect(stateUpdates?.firstSelectedCardEntityId).toBe(-1);
            expect(stateUpdates?.secondSelectedCardEntityId).toBe(-1);
            expect(cardUpdates.size).toBe(0);
        });
    });

    describe('handleUnmatchedCards', () => {
        it('should handle case where delay has just barely passed', () => {
            const gameState = new GameState();
            gameState.firstSelectedCardEntityId = 1;
            gameState.secondSelectedCardEntityId = 2;
            gameState.lastMoveTime = 1000;

            const cardEntities = [
                createMockEntity(1, { value: 5, isFlipped: true }),
                createMockEntity(2, { value: 6, isFlipped: true })
            ];

            // Set current time to exactly the threshold
            const currentTime = 1000 + NON_MATCH_FLIP_DELAY;

            // Process unmatched cards
            const { stateUpdates, cardUpdates } = handleUnmatchedCards(
                gameState,
                cardEntities as any,
                currentTime
            );

            // Should flip cards back
            expect(stateUpdates).not.toBeNull();
            expect(cardUpdates.size).toBe(2);
        });

        it('should handle case where one card is not flipped', () => {
            const gameState = new GameState();
            gameState.firstSelectedCardEntityId = 1;
            gameState.secondSelectedCardEntityId = 2;
            gameState.lastMoveTime = 1000;

            // First card is not flipped
            const cardEntities = [
                createMockEntity(1, { value: 5, isFlipped: false }),
                createMockEntity(2, { value: 6, isFlipped: true })
            ];

            // Set time past the delay
            const currentTime = 2100;

            // Process unmatched cards
            const { stateUpdates, cardUpdates } = handleUnmatchedCards(
                gameState,
                cardEntities as any,
                currentTime
            );

            // Should not flip cards back
            expect(stateUpdates).toBeNull();
            expect(cardUpdates.size).toBe(0);
        });
    });
}); 