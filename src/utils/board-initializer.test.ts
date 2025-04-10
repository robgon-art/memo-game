import { describe, it, expect, vi } from 'vitest';
import { initializeBoardWithRandomCards } from './board-initializer';

// Mock Becsy to avoid decorator errors
vi.mock('@lastolivegames/becsy', () => {
    return {
        System: class MockSystem { },
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

// Import components after mocking Becsy
import { Board } from '../components/board';
import { Card } from '../components/card';
import { GameState, GamePhase, GamePhaseValue } from '../components/game-state';

describe('Board Initializer', () => {
    // Create a minimal implementation of World, Board, and GameState for testing
    class TestEntity {
        private components: any = {};

        read<T>(componentType: any): T {
            return this.components[componentType.name];
        }

        write<T>(componentType: any): T {
            return this.components[componentType.name];
        }

        add(componentType: any, initialValues?: any): this {
            // Create a new instance of the component
            const component = new componentType();

            // Initialize with values if provided
            if (initialValues) {
                Object.assign(component, initialValues);
            }

            // Store it
            this.components[componentType.name] = component;
            return this;
        }

        remove(): void {
            // Mock removal logic
        }
    }

    class TestWorld {
        entities: TestEntity[] = [];

        createEntity(componentType?: any, initialValues?: any): TestEntity {
            const entity = new TestEntity();
            if (componentType) {
                entity.add(componentType, initialValues);
            }
            this.entities.push(entity);
            return entity;
        }
    }

    it('should initialize board with randomized card values', () => {
        // Create test world and entities
        const world = new TestWorld();

        // Create board entity with a 4x4 grid
        const boardEntity = new TestEntity();
        boardEntity.add(Board, {
            rows: 4,
            columns: 4,
            cardWidth: 100,
            cardHeight: 150,
            gap: 10
        });

        // Create game state entity
        const gameStateEntity = new TestEntity();
        gameStateEntity.add(GameState, {
            phase: GamePhaseValue[GamePhase.INITIALIZING],
            totalPairs: 0,
            matchCount: 0,
            moveCount: 0
        });

        // Initialize the board
        initializeBoardWithRandomCards(
            world as any,
            boardEntity as any,
            gameStateEntity as any
        );

        // Verify the board was initialized correctly
        expect(world.entities.length).toBe(16); // 4x4 grid = 16 cards

        // Check that all created entities are cards
        world.entities.forEach(entity => {
            const card = entity.read<Card>(Card);
            expect(card).toBeDefined();
            expect(typeof card.id).toBe('number');
            expect(typeof card.value).toBe('number');
            expect(typeof card.x).toBe('number');
            expect(typeof card.y).toBe('number');
            expect(card.width).toBe(100);
            expect(card.height).toBe(150);
            expect(card.isFlipped).toBe(false);
            expect(card.isMatched).toBe(false);
            expect(card.flipProgress).toBe(0);
        });

        // Check that all card values come in pairs
        const cardValues = world.entities.map(entity => entity.read<Card>(Card).value);
        const valueCounts = new Map<number, number>();

        cardValues.forEach(value => {
            valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
        });

        // Each value should appear exactly twice
        for (const count of valueCounts.values()) {
            expect(count).toBe(2);
        }

        // Check that game state was updated
        const gameState = gameStateEntity.read<GameState>(GameState);
        expect(gameState.totalPairs).toBe(8); // 16 cards = 8 pairs
    });

    it('should throw an error if board dimensions result in odd number of cards', () => {
        // Create test world and entities
        const world = new TestWorld();

        // Create board entity with a 3x5 grid (15 cards, which is odd)
        const boardEntity = new TestEntity();
        boardEntity.add(Board, {
            rows: 3,
            columns: 5,
            cardWidth: 100,
            cardHeight: 150,
            gap: 10
        });

        // Create game state entity
        const gameStateEntity = new TestEntity();
        gameStateEntity.add(GameState, {
            phase: GamePhaseValue[GamePhase.INITIALIZING],
            totalPairs: 0,
            matchCount: 0,
            moveCount: 0
        });

        // Initializing the board with odd number of cards should throw an error
        expect(() => {
            initializeBoardWithRandomCards(
                world as any,
                boardEntity as any,
                gameStateEntity as any
            );
        }).toThrow();
    });

    it('should position cards correctly based on board configuration', () => {
        // Create test world and entities
        const world = new TestWorld();

        // Create board entity with a 2x2 grid
        const boardEntity = new TestEntity();
        boardEntity.add(Board, {
            rows: 2,
            columns: 2,
            cardWidth: 100,
            cardHeight: 150,
            gap: 20
        });

        // Create game state entity
        const gameStateEntity = new TestEntity();
        gameStateEntity.add(GameState, {
            phase: GamePhaseValue[GamePhase.INITIALIZING],
            totalPairs: 0,
            matchCount: 0,
            moveCount: 0
        });

        // Initialize the board
        initializeBoardWithRandomCards(
            world as any,
            boardEntity as any,
            gameStateEntity as any
        );

        // Check card positions
        const cards = world.entities.map(entity => entity.read<Card>(Card));

        // Sort cards by id to ensure we check them in order
        cards.sort((a, b) => a.id - b.id);

        // Card 0 (row 0, col 0)
        expect(cards[0].x).toBe(50); // 100/2 = 50 (half card width)
        expect(cards[0].y).toBe(75); // 150/2 = 75 (half card height)

        // Card 1 (row 0, col 1)
        expect(cards[1].x).toBe(170); // 50 + 100 + 20 = 170
        expect(cards[1].y).toBe(75);

        // Card 2 (row 1, col 0)
        expect(cards[2].x).toBe(50);
        expect(cards[2].y).toBe(245); // 75 + 150 + 20 = 245

        // Card 3 (row 1, col 1)
        expect(cards[3].x).toBe(170);
        expect(cards[3].y).toBe(245);
    });
}); 