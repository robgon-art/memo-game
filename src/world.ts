import { World } from '@lastolivegames/becsy';

// Initialize the ECS world
export async function initWorld() {
    // Create a new ECS world
    const world = await World.create({
        defs: [
            // Configure world options and components if needed
        ]
    });

    return world;
} 