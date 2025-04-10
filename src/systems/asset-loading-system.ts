import { System, system, component, field } from '@lastolivegames/becsy';
import { Card } from '../components/card';
import { CardRenderComponent } from './render-system';
import { assetLoader } from '../utils/asset-loader';

// Component to keep track of global asset loading state
@component
export class AssetLoadingState {
    @field.boolean declare isLoading: boolean;
    @field.int32 declare totalAssets: number;
    @field.int32 declare loadedAssets: number;
    @field.float64 declare progress: number;
    @field.boolean declare allAssetsLoaded: boolean;
}

// Define a minimal entity interface for typing
interface Entity {
    read<T>(componentType: any): T;
    write<T>(componentType: any): T;
}

// Define a query interface for typing
interface EntityQuery {
    current: Entity[];
}

/**
 * System responsible for loading and managing assets
 */
@system
export class AssetLoadingSystem extends System {
    // Define which components this system uses
    static queries = {
        cards: { has: ['Card', 'CardRenderComponent'] },
        loadingState: { has: 'AssetLoadingState' }
    };

    // Tell Becsy this system can create AssetLoadingState components
    static readonly create = [AssetLoadingState];

    // Becsy adds these queries at runtime
    queries!: {
        cards: EntityQuery;
        loadingState: EntityQuery;
    };

    // Flag to track if initialization has been done
    private isInitialized = false;

    /**
     * System initialization
     */
    init(): void {
        console.log('AssetLoadingSystem init');
    }

    /**
     * System initialization
     */
    async initialize(): Promise<void> {
        console.log('AssetLoadingSystem initialize started');
        // Make sure we only initialize once
        if (this.isInitialized) {
            console.log('AssetLoadingSystem already initialized, skipping');
            return;
        }

        // Create loading state entity if it doesn't exist
        let hasLoadingState = false;
        try {
            // Check if any loading state entities exist
            if (this.queries.loadingState.current.length > 0) {
                hasLoadingState = true;
            }
        } catch (error) {
            console.error('Error checking loading state:', error);
        }

        console.log('Loading state exists:', hasLoadingState);

        if (!hasLoadingState) {
            console.log('Creating new AssetLoadingState entity');
            this.createLoadingStateEntity();
        }

        this.isInitialized = true;

        // Start loading assets
        console.log('Starting to load assets');
        await this.loadAssets();
    }

    /**
     * Create a loading state entity
     */
    private createLoadingStateEntity(): void {
        this.createEntity(AssetLoadingState, {
            isLoading: true,
            totalAssets: 0,
            loadedAssets: 0,
            progress: 0,
            allAssetsLoaded: false
        });
    }

    /**
     * Load all game assets
     */
    private async loadAssets(): Promise<void> {
        let loadingState: AssetLoadingState | undefined;

        // Get the loading state entity
        try {
            const loadingStateEntities = this.queries.loadingState.current;

            if (loadingStateEntities.length > 0) {
                const entity = loadingStateEntities[0];
                loadingState = entity.write(AssetLoadingState);
            } else {
                console.warn('No loading state entities found');
            }
        } catch (error) {
            console.error('Error getting loading state entity:', error);
        }

        if (!loadingState) {
            console.error('Asset loading state entity not found');
            return;
        }

        // Add a safety timeout to make sure we don't block forever
        const safetyTimeout = setTimeout(() => {
            console.warn('Asset loading timed out after 4 seconds, forcing completion');
            if (loadingState) {
                loadingState.isLoading = false;
                loadingState.allAssetsLoaded = true;
                loadingState.progress = 1.0;
                // Attempt to assign any images that were loaded
                this.assignImagesToCards();
            }
        }, 4000);

        try {
            loadingState.isLoading = true;

            // Start asset loading with progress tracking
            await assetLoader.preloadAllCardImages({
                onProgress: (loaded, total) => {
                    if (loadingState) {
                        loadingState.loadedAssets = loaded;
                        loadingState.totalAssets = total;
                        loadingState.progress = loaded / total;
                    }
                },
                onError: (error, path) => {
                    console.error(`Failed to load asset: ${path}`, error);
                }
            });

            // Clear the safety timeout since loading completed normally
            clearTimeout(safetyTimeout);

            // Mark loading as complete
            loadingState.isLoading = false;
            loadingState.allAssetsLoaded = true;

            // Link images to cards
            this.assignImagesToCards();

            console.log('All assets loaded successfully');
        } catch (error) {
            console.error('Error loading assets:', error);
            // Clear the safety timeout
            clearTimeout(safetyTimeout);

            if (loadingState) {
                loadingState.isLoading = false;
                // Even on error, we'll try to mark as loaded so the game can continue
                loadingState.allAssetsLoaded = true;
            }
        }
    }

    /**
     * Assign loaded images to card entities
     */
    private assignImagesToCards(): void {
        // Process each card entity
        try {
            const cardEntities = this.queries.cards.current;
            
            if (cardEntities.length > 0) {
                for (const entity of cardEntities) {
                    try {
                        const card = entity.read(Card) as Card;
                        const renderComponent = entity.write(CardRenderComponent) as CardRenderComponent;

                        // Get the correct card image based on card value
                        const cardImage = assetLoader.getCardImage(card.value);

                        if (cardImage) {
                            // Set the texture on the card's render component
                            renderComponent.texture = cardImage;
                            renderComponent.isTextureLoaded = true;
                        }
                    } catch (cardError) {
                        console.error('Error processing card entity:', cardError);
                    }
                }
            } else {
                console.warn('No card entities found');
            }
        } catch (error) {
            console.error('Error assigning images to cards:', error);
        }
    }

    /**
     * Execute system update (runs each frame)
     */
    execute(): void {
        // Nothing to do on frame updates after initialization
        // Asset loading is handled asynchronously by the initialize method
    }
} 