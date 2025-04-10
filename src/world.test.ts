import { describe, it, expect, vi } from 'vitest';
import { initWorld } from './world';

// Selectively mock only the necessary parts of Becsy
vi.mock('@lastolivegames/becsy', () => {
  // Create a minimal World implementation with only what we need
  class MockWorld {
    execute() {
      // Minimal implementation that does nothing
    }
    
    // Any other methods the test might need
  }
  
  return {
    // Only mock the World class and its static create method
    World: {
      create: vi.fn().mockImplementation(async (config) => {
        // Preserve config validation if possible
        if (!config || !Array.isArray(config.defs)) {
          throw new Error('Invalid world configuration');
        }
        
        // Return a real instance of our minimal implementation
        return new MockWorld();
      })
    }
  };
});

describe('World initialization', () => {
    it('should initialize and return a valid Becsy world', async () => {
        // Call the function to be tested
        const world = await initWorld();

        // Verify a world object is returned
        expect(world).toBeDefined();
        expect(world).toHaveProperty('execute');
        expect(typeof world.execute).toBe('function');
    });

    it('should create a world that can be executed without errors', async () => {
        const world = await initWorld();

        // Verify the world can execute without throwing
        expect(() => {
            world.execute();
        }).not.toThrow();
    });
}); 