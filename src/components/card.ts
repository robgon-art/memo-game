import { component, field } from '@lastolivegames/becsy';

/**
 * Represents a card in the memory game
 */
@component
export class Card {
    @field.int32 declare id: number;
    @field.int32 declare value: number;
    @field.float64 declare x: number;
    @field.float64 declare y: number;
    @field.float64 declare width: number;
    @field.float64 declare height: number;
    @field.boolean declare isFlipped: boolean;
    @field.boolean declare isMatched: boolean;
    @field.float64 declare flipProgress: number;
    @field.object declare texture: any;

    /**
     * Applies a function to update the card state
     * @param updateFn - Pure function that returns updated card properties
     */
    applyUpdate(updateFn: (card: Card) => Partial<Card> | null): Card {
        const updates = updateFn(this);
        if (updates) {
            Object.assign(this, updates);
        }
        return this;
    }
}

/**
 * Pure function to flip a card
 * @param card - The card to flip
 * @returns The updated card properties
 */
export function flipCard(card: Card): Partial<Card> {
    const isFlipped = !card.isFlipped;
    return {
        isFlipped,
        // Reset progress when starting a flip
        flipProgress: isFlipped ? 0 : 1
    };
}

/**
 * Pure function to mark a card as matched
 * @param card - The card to match
 * @returns The updated card properties
 */
export function matchCard(card: Card): Partial<Card> | null {
    return card.isMatched ? null : { isMatched: true };
}

/**
 * Pure function to update card flip progress
 * @param card - The card to update
 * @param delta - Time delta to update by
 * @param speed - Speed modifier (default: 1.0)
 * @returns The updated card properties or null if no change
 */
export function updateCardFlipProgress(
    card: Card, 
    delta: number, 
    speed: number = 1.0
): Partial<Card> | null {
    let newFlipProgress = card.flipProgress;
    
    if (card.isFlipped && card.flipProgress < 1) {
        // Progress from 0 to 1 when flipping
        newFlipProgress = Math.min(1, card.flipProgress + delta * speed);
    } else if (!card.isFlipped && card.flipProgress > 0) {
        // Progress from 1 to 0 when un-flipping
        newFlipProgress = Math.max(0, card.flipProgress - delta * speed);
    }
    
    // Only return an update if the value actually changed
    return newFlipProgress !== card.flipProgress 
        ? { flipProgress: newFlipProgress }
        : null;
} 