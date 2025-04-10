import { World } from '@lastolivegames/becsy';

// Initialize the ECS world
export async function initWorld() {
    // Create a new ECS world
    // Pass empty defs array to support tests with mocked World.create
    const world = await World.create({
        defs: []
    });

    return world;
} 