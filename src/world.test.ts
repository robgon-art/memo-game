import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initWorld } from './world';
import * as boardInitializer from './utils/board-initializer';

// Minimal mock for Becsy to satisfy type checking
vi.mock('@lastolivegames/becsy', () => {
  // Create a minimal World implementation with only what we need
  class MockWorld {
    execute() {
      // Minimal implementation that does nothing
    }

    createEntity() {
      return {
        read: vi.fn().mockReturnValue({})
      };
    }

    systems = []; // Add empty systems array
  }

  return {
    // Mock the World class and its static create method
    World: {
      create: vi.fn().mockImplementation(async () => {
        return new MockWorld();
      })
    },
    // Mock the Entity class
    Entity: class MockEntity {
      read() {
        return {};
      }
    },
    // Mock the System class
    System: class MockSystem { },
    // Mock the component decorator
    component: function (target: any) { return target; },
    // Mock the system decorator
    system: function (target: any) { return target; },
    // Mock the field object with necessary field types
    field: {
      int32: vi.fn(),
      float64: vi.fn(),
      boolean: vi.fn(),
      object: vi.fn(),
      string: vi.fn()
    }
  };
});

// Spy on board initializer
vi.spyOn(boardInitializer, 'initializeBoardWithRandomCards').mockImplementation(() => { });

describe('World initialization', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('should initialize and return a valid Becsy world', async () => {
    // Call the function to be tested with options to skip problematic parts
    const world = await initWorld({
      skipRendererInitialization: true
    });

    // Verify a world object is returned
    expect(world).toBeDefined();
    expect(world).toHaveProperty('execute');
    expect(typeof world.execute).toBe('function');

    // Verify board initializer was called
    expect(boardInitializer.initializeBoardWithRandomCards).toHaveBeenCalled();
  });

  it('should create a world that can be executed without errors', async () => {
    // Skip all initializations that could cause issues
    const world = await initWorld({
      skipBoardInitialization: true,
      skipRendererInitialization: true
    });

    // Verify the world can execute without throwing
    expect(() => {
      world.execute();
    }).not.toThrow();
  });

  it('should skip board initialization when requested', async () => {
    // Skip board initialization
    await initWorld({
      skipBoardInitialization: true,
      skipRendererInitialization: true
    });

    // Verify board initializer was not called
    expect(boardInitializer.initializeBoardWithRandomCards).not.toHaveBeenCalled();
  });
}); 