import { createEntity, Entity } from './entity';

export type Scene = Entity & {
  isScene: boolean;
  renderListNeedsUpdate: boolean;
};

function createScene(): Scene {
  let scene: Scene;

  const isScene = true;
  let renderListNeedsUpdate = true;

  scene = {
    isScene,
    renderListNeedsUpdate,
  };

  return scene;
}

export { createScene };
