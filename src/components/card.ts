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
     * Flip the card (for use in tests and systems)
     */
    flip() {
        this.isFlipped = !this.isFlipped;
        // Reset progress when starting a flip
        this.flipProgress = this.isFlipped ? 0 : 1;
        return this;
    }

    /**
     * Mark the card as matched (for use in tests and systems)
     */
    match() {
        this.isMatched = true;
        return this;
    }

    /**
     * Update flip progress (for use in tests and systems)
     * @param delta - Time delta to update by
     * @param speed - Speed modifier (default: 1.0)
     */
    updateFlipProgress(delta: number, speed: number = 1.0) {
        if (this.isFlipped && this.flipProgress < 1) {
            // Progress from 0 to 1 when flipping
            this.flipProgress = Math.min(1, this.flipProgress + delta * speed);
        } else if (!this.isFlipped && this.flipProgress > 0) {
            // Progress from 1 to 0 when un-flipping
            this.flipProgress = Math.max(0, this.flipProgress - delta * speed);
        }
        return this;
    }
} 