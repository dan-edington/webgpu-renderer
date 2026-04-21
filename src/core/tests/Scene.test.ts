import { describe, expect, it } from 'vitest';

import { Entity } from '../Entity';
import { Scene } from '../Scene';

function createEntity(name: string, options?: { isRenderable?: boolean; visible?: boolean }) {
  const entity = new Entity();

  entity.name = name;
  entity.isRenderable = options?.isRenderable ?? false;
  entity.visible = options?.visible ?? true;

  return entity;
}

function buildSceneFixture() {
  const rootVisibleRenderable = createEntity('root-visible-renderable', {
    isRenderable: true,
    visible: true,
  });
  const childVisibleRenderable = createEntity('child-visible-renderable', {
    isRenderable: true,
    visible: true,
  });
  const childVisibleNotRenderable = createEntity('child-visible-not-renderable', {
    isRenderable: false,
    visible: true,
  });
  const grandchildVisibleRenderable = createEntity('grandchild-visible-renderable', {
    isRenderable: true,
    visible: true,
  });
  const hiddenParentRenderable = createEntity('hidden-parent-renderable', {
    isRenderable: true,
    visible: false,
  });
  const hiddenBranchChildRenderable = createEntity('hidden-branch-child-renderable', {
    isRenderable: true,
    visible: true,
  });
  const secondRootVisibleNotRenderable = createEntity('second-root-visible-not-renderable', {
    isRenderable: false,
    visible: true,
  });
  const secondRootChildRenderable = createEntity('second-root-child-renderable', {
    isRenderable: true,
    visible: true,
  });
  const secondRootGrandchildHidden = createEntity('second-root-grandchild-hidden', {
    isRenderable: true,
    visible: false,
  });

  childVisibleNotRenderable.children.push(grandchildVisibleRenderable);
  hiddenParentRenderable.children.push(hiddenBranchChildRenderable);
  rootVisibleRenderable.children.push(childVisibleRenderable, childVisibleNotRenderable, hiddenParentRenderable);

  secondRootChildRenderable.children.push(secondRootGrandchildHidden);
  secondRootVisibleNotRenderable.children.push(secondRootChildRenderable);

  return {
    roots: [rootVisibleRenderable, secondRootVisibleNotRenderable],
    expectedRenderListIds: [
      rootVisibleRenderable.id,
      childVisibleRenderable.id,
      grandchildVisibleRenderable.id,
      secondRootChildRenderable.id,
    ],
  };
}

describe('Scene', () => {
  it('adds root entities and marks the render list as dirty', () => {
    const scene = new Scene();
    const { roots } = buildSceneFixture();

    expect(scene.children).toHaveLength(0);
    expect(scene.renderListNeedsUpdate).toBe(false);

    roots.forEach((root, index) => {
      scene.add(root);

      expect(scene.children).toHaveLength(index + 1);
      expect(scene.children[index]).toBe(root);
      expect(scene.renderListNeedsUpdate).toBe(true);
    });
  });

  it('collects only visible renderable entities from nested children', () => {
    const scene = new Scene();
    const { roots, expectedRenderListIds } = buildSceneFixture();

    roots.forEach((root) => {
      scene.add(root);
    });

    scene.updateRenderList();

    expect(scene.renderListNeedsUpdate).toBe(false);
    expect(scene.renderList.map((entity) => entity.id)).toEqual(expectedRenderListIds);
    expect(scene.renderList.every((entity) => entity.visible && entity.isRenderable)).toBe(true);

    const firstRenderListIds = scene.renderList.map((entity) => entity.id);

    scene.updateRenderList();

    expect(scene.renderList.map((entity) => entity.id)).toEqual(firstRenderListIds);
  });
});
