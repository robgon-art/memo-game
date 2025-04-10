/**
 * Asset loader utility for the Memo Game
 * Handles loading and caching of game images
 */

// Interface for asset loading options
export interface AssetLoadingOptions {
    onProgress?: (loaded: number, total: number) => void;
    onError?: (error: Error, path: string) => void;
}

// Card asset information
export interface CardAsset {
    id: number;
    path: string;
    image: HTMLImageElement | null;
    loaded: boolean;
}

// Define the paths for card images (front images)
const CARD_FRONT_PATHS = [
    'images/cards/Mont Sainte-Victoire, Paul Cézanne, c. 1890s.jpg',
    'images/cards/Jeanne Samary in a Low-Necked Dress, Pierre-Auguste Renoir, 1877.jpg',
    'images/cards/Children Playing on the Beach, Mary Cassatt, 1884.jpg',
    'images/cards/The Green Line, Henri Matisse, 1905.jpg',
    'images/cards/The Starry Night, Vincent van Gogh, 1889.jpg',
    'images/cards/Le Déjeuner sur l\'herbe, Édouard Manet, 1863.jpg',
    'images/cards/Dance at Bougival, Pierre-Auguste Renoir, 1883.jpg',
    'images/cards/The Ballet Class, Edgar Degas, 1873.jpg',
    'images/cards/Boulevard Montmartre, Spring, Camille Pissarro, 1897.jpg',
    'images/cards/At the Moulin Rouge - The Dance, Henri de Toulouse-Lautrec, 1890.jpg',
    'images/cards/A Sunday Afternoon on the Island of La Grande Jatte, Georges Seurat, 1884.jpg',
    'images/cards/Impression Sunrise, Claude Monet, 1872.jpg'
];

// Card back path
const CARD_BACK_PATH = 'images/ui/Back Side.jpg';

/**
 * Asset loader class to manage all game assets
 */
export class AssetLoader {
    private cardAssets: Map<number, CardAsset> = new Map();
    private cardBackImage: HTMLImageElement | null = null;
    private cardBackLoaded: boolean = false;

    /**
     * Load the card back image
     * @returns Promise resolving to the loaded image
     */
    async loadCardBack(): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            if (this.cardBackLoaded && this.cardBackImage) {
                resolve(this.cardBackImage);
                return;
            }

            const image = new Image();
            image.onload = () => {
                this.cardBackImage = image;
                this.cardBackLoaded = true;
                resolve(image);
            };
            image.onerror = () => {
                reject(new Error(`Failed to load card back: ${CARD_BACK_PATH}`));
            };
            image.src = CARD_BACK_PATH;
        });
    }

    /**
     * Load a specific card image by ID
     * @param id Card ID (0-11)
     * @returns Promise resolving to the loaded image
     */
    async loadCardImage(id: number): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            const existingAsset = this.cardAssets.get(id);
            if (existingAsset?.loaded && existingAsset.image) {
                resolve(existingAsset.image);
                return;
            }

            // Validate ID
            if (id < 0 || id >= CARD_FRONT_PATHS.length) {
                reject(new Error(`Invalid card ID: ${id}`));
                return;
            }

            const path = CARD_FRONT_PATHS[id];
            const image = new Image();

            image.onload = () => {
                const asset: CardAsset = {
                    id,
                    path,
                    image,
                    loaded: true
                };
                this.cardAssets.set(id, asset);
                resolve(image);
            };

            image.onerror = () => {
                reject(new Error(`Failed to load card image: ${path}`));
            };

            image.src = path;
        });
    }

    /**
     * Preload all card images
     * @param options Loading options
     * @returns Promise that resolves when all images are loaded
     */
    async preloadAllCardImages(options: AssetLoadingOptions = {}): Promise<HTMLImageElement[]> {
        const totalAssets = CARD_FRONT_PATHS.length + 1; // +1 for card back
        let loadedCount = 0;

        console.log('Starting to preload all card images, total assets:', totalAssets);
        console.log('Card back path:', CARD_BACK_PATH);
        console.log('First few card paths:', CARD_FRONT_PATHS.slice(0, 3));

        // Function to update progress
        const updateProgress = () => {
            loadedCount++;
            console.log(`Asset loaded: ${loadedCount}/${totalAssets}`);
            if (options.onProgress) {
                options.onProgress(loadedCount, totalAssets);
            }
        };

        try {
            // Load card back first
            console.log('Loading card back image from:', CARD_BACK_PATH);
            await this.loadCardBack();
            updateProgress();

            // Load all card front images
            const promises = CARD_FRONT_PATHS.map((path, id) => {
                console.log(`Starting to load card ${id} from path: ${path}`);
                return this.loadCardImage(id)
                    .then(image => {
                        console.log(`Successfully loaded card ${id}`);
                        updateProgress();
                        return image;
                    })
                    .catch(error => {
                        console.error(`Error loading card ${id} from ${path}:`, error);
                        if (options.onError) {
                            options.onError(error, path);
                        }
                        // Return null for failed loads but don't break the Promise.all
                        return null as unknown as HTMLImageElement;
                    });
            });

            const results = await Promise.all(promises);
            console.log('All card images preloaded successfully');
            return results;
        } catch (error) {
            console.error('Error preloading assets:', error);
            throw error;
        }
    }

    /**
     * Get a loaded card image
     * @param id Card ID
     * @returns The loaded image or null if not loaded
     */
    getCardImage(id: number): HTMLImageElement | null {
        const asset = this.cardAssets.get(id);
        return asset?.loaded ? asset.image : null;
    }

    /**
     * Get the loaded card back image
     * @returns The loaded card back image or null if not loaded
     */
    getCardBackImage(): HTMLImageElement | null {
        return this.cardBackLoaded ? this.cardBackImage : null;
    }

    /**
     * Get all loaded card assets
     * @returns Map of loaded card assets
     */
    getAllCardAssets(): Map<number, CardAsset> {
        return this.cardAssets;
    }
}

// Create and export a singleton instance
export const assetLoader = new AssetLoader(); 