import { System, system } from '@lastolivegames/becsy';
import { Card, flipCard, matchCard } from '../components/card';
import {
    GameState,
    GamePhaseValue,
    GamePhase,
    selectCard as selectCardInState,
    checkForMatch,
    resetSelection,
    updateGameTimer,
    getPhaseFromValue
} from '../components/game-state';
import { Board, getCardIndexAtPosition } from '../components/board';
import { initializeBoardWithRandomCards } from '../utils/board-initializer';

/**
 * Input event from user interaction
 */
export interface InputEvent {
    type: 'click' | 'touch' | 'key';
    x?: number;
    y?: number;
    key?: string;
    entityId?: number;
    timestamp: number;
}

/**
 * Entity with ID - simplified interface for testing/mocking
 */
export interface EntityWithID {
    id: number;
    read(component: typeof Card): Card;
    read(component: typeof Board): Board;
    read(component: typeof GameState): GameState;
    read(component: any): any;
}

/**
 * Pure function to process game input
 * @param event - Input event from user
 * @param gameState - Current game state
 * @param board - Game board
 * @param cardEntities - Array of card entities
 * @returns Updated game state or null if no update needed
 */
export function processGameInput(
    event: InputEvent,
    gameState: GameState,
    board: Board,
    cardEntities: EntityWithID[]
): { stateUpdates: Partial<GameState> | null, cardUpdates: Map<EntityWithID, Partial<Card>> } {
    // Initialize empty result
    const cardUpdates = new Map<EntityWithID, Partial<Card>>();

    // Only process input if game is in PLAYING state
    if (gameState.phase !== GamePhaseValue[GamePhase.PLAYING]) {
        return { stateUpdates: null, cardUpdates };
    }

    // Process based on event type
    if (event.type === 'click' || event.type === 'touch') {
        return processPointerEvent(event, gameState, board, cardEntities, cardUpdates);
    } else if (event.type === 'key') {
        return processKeyEvent(event, gameState, cardEntities, cardUpdates);
    }

    return { stateUpdates: null, cardUpdates };
}

/**
 * Pure function to process pointer (click/touch) events
 */
function processPointerEvent(
    event: InputEvent,
    gameState: GameState,
    board: Board,
    cardEntities: EntityWithID[],
    cardUpdates: Map<EntityWithID, Partial<Card>>
): { stateUpdates: Partial<GameState> | null, cardUpdates: Map<EntityWithID, Partial<Card>> } {
    if (event.x === undefined || event.y === undefined) {
        return { stateUpdates: null, cardUpdates };
    }

    // Find which card was clicked
    const cardIndex = getCardIndexAtPosition(board, event.x, event.y);
    if (cardIndex === -1 || cardIndex >= cardEntities.length) {
        return { stateUpdates: null, cardUpdates };
    }

    // Get the card entity and component
    const cardEntity = cardEntities[cardIndex];
    const card = cardEntity.read(Card);

    // Don't flip cards that are already matched or flipped
    if (card.isMatched || card.isFlipped) {
        return { stateUpdates: null, cardUpdates };
    }

    // Check if we can select this card
    const stateUpdates = selectCardInState(gameState, cardEntity.id, card.value);
    if (!stateUpdates) {
        return { stateUpdates: null, cardUpdates };
    }

    // Flip the card
    cardUpdates.set(cardEntity, flipCard(card));

    return { stateUpdates, cardUpdates };
}

/**
 * Pure function to process keyboard events
 */
function processKeyEvent(
    event: InputEvent,
    gameState: GameState,
    cardEntities: EntityWithID[],
    cardUpdates: Map<EntityWithID, Partial<Card>>
): { stateUpdates: Partial<GameState> | null, cardUpdates: Map<EntityWithID, Partial<Card>> } {
    // For direct card selection via entity ID (for keyboard navigation)
    if (event.entityId !== undefined) {
        const targetEntity = cardEntities.find(entity => entity.id === event.entityId);
        if (!targetEntity) {
            return { stateUpdates: null, cardUpdates };
        }

        const card = targetEntity.read(Card);

        // Don't flip cards that are already matched or flipped
        if (card.isMatched || card.isFlipped) {
            return { stateUpdates: null, cardUpdates };
        }

        // Check if we can select this card
        const stateUpdates = selectCardInState(gameState, targetEntity.id, card.value);
        if (!stateUpdates) {
            return { stateUpdates: null, cardUpdates };
        }

        // Flip the card
        cardUpdates.set(targetEntity, flipCard(card));

        return { stateUpdates, cardUpdates };
    }

    return { stateUpdates: null, cardUpdates };
}

/**
 * Pure function to check card matches
 * @param gameState - Current game state
 * @param cardEntities - Array of card entities
 * @returns Updated game state and card updates
 */
export function evaluateCardMatches(
    gameState: GameState,
    cardEntities: EntityWithID[]
): { stateUpdates: Partial<GameState> | null, cardUpdates: Map<EntityWithID, Partial<Card>> } {
    const cardUpdates = new Map<EntityWithID, Partial<Card>>();

    // Only evaluate if we have two selected cards
    if (gameState.firstSelectedCardEntityId === -1 || gameState.secondSelectedCardEntityId === -1) {
        return { stateUpdates: null, cardUpdates };
    }

    // Find the card entities
    const firstCardEntity = cardEntities.find(entity => entity.id === gameState.firstSelectedCardEntityId);
    const secondCardEntity = cardEntities.find(entity => entity.id === gameState.secondSelectedCardEntityId);

    if (!firstCardEntity || !secondCardEntity) {
        return { stateUpdates: resetSelection(gameState), cardUpdates };
    }

    // Get card values
    const firstCard = firstCardEntity.read(Card);
    const secondCard = secondCardEntity.read(Card);

    // Check for match
    const isMatch = firstCard.value === secondCard.value;

    // Update game state
    const stateUpdates = checkForMatch(gameState, firstCard.value, secondCard.value);

    // Update cards if it's a match
    if (isMatch) {
        const firstCardUpdate = matchCard(firstCard);
        const secondCardUpdate = matchCard(secondCard);

        if (firstCardUpdate) cardUpdates.set(firstCardEntity, firstCardUpdate);
        if (secondCardUpdate) cardUpdates.set(secondCardEntity, secondCardUpdate);
    }

    return { stateUpdates, cardUpdates };
}

/**
 * Time in ms to wait before flipping non-matching cards back
 */
export const NON_MATCH_FLIP_DELAY = 1000;

/**
 * Pure function to handle flipping back unmatched cards
 * @param gameState - Current game state
 * @param cardEntities - Array of card entities
 * @param currentTime - Current timestamp
 * @returns Updated game state and card updates
 */
export function handleUnmatchedCards(
    gameState: GameState,
    cardEntities: EntityWithID[],
    currentTime: number
): { stateUpdates: Partial<GameState> | null, cardUpdates: Map<EntityWithID, Partial<Card>> } {
    const cardUpdates = new Map<EntityWithID, Partial<Card>>();

    // Only proceed if we have two selected cards
    if (gameState.firstSelectedCardEntityId === -1 || gameState.secondSelectedCardEntityId === -1) {
        return { stateUpdates: null, cardUpdates };
    }

    // Find the card entities
    const firstCardEntity = cardEntities.find(entity => entity.id === gameState.firstSelectedCardEntityId);
    const secondCardEntity = cardEntities.find(entity => entity.id === gameState.secondSelectedCardEntityId);

    if (!firstCardEntity || !secondCardEntity) {
        return { stateUpdates: resetSelection(gameState), cardUpdates };
    }

    // Get card components
    const firstCard = firstCardEntity.read(Card);
    const secondCard = secondCardEntity.read(Card);

    // Only proceed if cards are flipped but not matched
    if (!firstCard.isFlipped || !secondCard.isFlipped ||
        firstCard.isMatched || secondCard.isMatched) {
        return { stateUpdates: null, cardUpdates };
    }

    // Check if enough time has passed since the last move
    const timeSinceLastMove = currentTime - gameState.lastMoveTime;
    if (timeSinceLastMove < NON_MATCH_FLIP_DELAY) {
        return { stateUpdates: null, cardUpdates };
    }

    // Flip the cards back and reset selection
    cardUpdates.set(firstCardEntity, flipCard(firstCard));
    cardUpdates.set(secondCardEntity, flipCard(secondCard));

    return {
        stateUpdates: resetSelection(gameState),
        cardUpdates
    };
}

/**
 * System that handles the core game logic
 */
@system
export class GameLogicSystem extends System {
    // Define queries - these will be populated by Becsy
    static queries = {
        board: { with: Board },
        gameState: { with: GameState },
        cards: { with: Card }
    };

    // Event queue
    private inputEvents: InputEvent[] = [];

    /**
     * Add an input event to be processed
     * @param event - Input event from user interaction
     */
    addInputEvent(event: InputEvent): void {
        this.inputEvents.push(event);
    }

    /**
     * Get access to query results - handles both production and test environments
     * @returns Object with query results
     */
    private getQueryResults() {
        // In test environment, queries might be structured differently
        const queries = (this as any).queries;

        if (!queries) {
            return { board: [], gameState: [], cards: [] };
        }

        // Handle both production (.current) and test (.results) query formats
        return {
            board: queries.board?.current || queries.board?.results || [],
            gameState: queries.gameState?.current || queries.gameState?.results || [],
            cards: queries.cards?.current || queries.cards?.results || []
        };
    }

    /**
     * System execution
     */
    execute(): void {
        // Get current time
        const currentTime = performance.now();

        // Get entities using our helper method
        const { gameState: gameStateEntities } = this.getQueryResults();
        if (gameStateEntities.length === 0) return;

        const gameStateEntity = gameStateEntities[0];
        const gameState = gameStateEntity.read(GameState);

        // Update game timer
        const timerUpdate = updateGameTimer(gameState, currentTime);
        if (timerUpdate) {
            Object.assign(gameState, timerUpdate);
        }

        // Process all input events
        this.processInputEvents(gameState, currentTime);

        // Handle card matching and state evaluation
        this.evaluateGameState(gameState, currentTime);

        // Clear processed events
        this.inputEvents = [];

        // Process game state entities for initialization
        for (const entity of gameStateEntities) {
            const state = entity.read(GameState);
            // Handle different game phases
            switch (state.phase) {
                case GamePhaseValue[GamePhase.INITIALIZING]:
                    this.initializeGame(state);
                    break;
                // Other game phases will be handled here
            }
        }
    }

    /**
     * Process all pending input events
     */
    private processInputEvents(gameState: GameState, _currentTime: number): void {
        // Only process input during playing state
        if (gameState.phase !== GamePhaseValue[GamePhase.PLAYING]) {
            return;
        }

        // Get the board and card entities
        const { board: boardEntities, cards: cardEntities } = this.getQueryResults();
        if (boardEntities.length === 0) return;

        const boardEntity = boardEntities[0];
        const board = boardEntity.read(Board);

        // Process each input event in order
        for (const event of this.inputEvents) {
            const { stateUpdates, cardUpdates } = processGameInput(
                event,
                gameState,
                board,
                cardEntities as unknown as EntityWithID[]
            );

            // Apply state updates if any
            if (stateUpdates) {
                // Update our local reference to game state
                Object.assign(gameState, stateUpdates);
            }

            // Apply card updates if any
            for (const [cardEntity, updates] of cardUpdates.entries()) {
                // Apply updates to the entity
                const card = cardEntity.read(Card);
                Object.assign(card, updates);
            }
        }
    }

    /**
     * Evaluate card matches and game state
     */
    private evaluateGameState(gameState: GameState, currentTime: number): void {
        // Get card entities
        const { cards: cardEntities } = this.getQueryResults();

        // First check for matches with currently selected cards
        const { stateUpdates: matchUpdates, cardUpdates: matchCardUpdates } =
            evaluateCardMatches(gameState, cardEntities as unknown as EntityWithID[]);

        // Apply match updates if any
        if (matchUpdates) {
            // Update our local reference to game state
            Object.assign(gameState, matchUpdates);

            // Apply card updates
            for (const [cardEntity, updates] of matchCardUpdates.entries()) {
                const card = cardEntity.read(Card);
                Object.assign(card, updates);
            }
        }

        // If game is still playing, check for unmatched cards to flip back
        if (gameState.phase === GamePhaseValue[GamePhase.PLAYING]) {
            const { stateUpdates: unmatchedUpdates, cardUpdates: unmatchedCardUpdates } =
                handleUnmatchedCards(gameState, cardEntities as unknown as EntityWithID[], currentTime);

            // Apply unmatched card updates if any
            if (unmatchedUpdates) {
                // Update our local reference to game state
                Object.assign(gameState, unmatchedUpdates);
            }

            // Apply card updates
            for (const [cardEntity, updates] of unmatchedCardUpdates.entries()) {
                const card = cardEntity.read(Card);
                Object.assign(card, updates);
            }
        }
    }

    /**
     * For testing: get the current game phase
     */
    getCurrentPhase(): GamePhase {
        const { gameState: gameStateEntities } = this.getQueryResults();
        if (gameStateEntities.length === 0) return GamePhase.INITIALIZING;

        const gameState = gameStateEntities[0].read(GameState);
        return getPhaseFromValue(gameState.phase);
    }

    /**
     * For testing: get current game state
     */
    getGameState(): GameState | null {
        const { gameState: gameStateEntities } = this.getQueryResults();
        if (gameStateEntities.length === 0) return null;

        return gameStateEntities[0].read(GameState);
    }

    /**
     * For testing: get card entities
     */
    getCardEntities(): EntityWithID[] {
        const { cards: cardEntities } = this.getQueryResults();
        return cardEntities as unknown as EntityWithID[];
    }

    /**
     * Initialize the game with randomized card values
     * @param state - The current game state
     */
    private initializeGame(_state: GameState): void {
        // Get board and game state entities
        const { board: boardEntities, gameState: gameStateEntities } = this.getQueryResults();

        if (boardEntities.length > 0 && gameStateEntities.length > 0) {
            try {
                // Use our board initializer utility
                initializeBoardWithRandomCards(
                    this as unknown as any, // Pass system as world-like object
                    boardEntities[0],
                    gameStateEntities[0]
                );
            } catch (error) {
                console.error("Error initializing board:", error);
            }
        }
    }
} 