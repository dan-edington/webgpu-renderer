import type { IEntity, IScene } from './types';

class Scene implements IScene {
  children: IEntity[];
  renderList: IEntity[];
  renderListNeedsUpdate: boolean;

  constructor() {
    this.children = [];
    this.renderList = [];
    this.renderListNeedsUpdate = false;
  }

  add(entity: IEntity) {
    this.children.push(entity);
    this.renderListNeedsUpdate = true;
  }

  updateRenderList() {
    if (this.renderListNeedsUpdate) {
      this.renderList = [];

      const traverse = (entity: IEntity, parentVisible: boolean) => {
        const isVisible = parentVisible && entity.visible;

        if (!isVisible) {
          return;
        }

        if (entity.isRenderable) {
          this.renderList.push(entity);
        }

        entity.children.forEach((child) => {
          traverse(child, isVisible);
        });
      };

      this.children.forEach((child) => {
        traverse(child, true);
      });

      this.renderListNeedsUpdate = false;
    }
  }
}

export { Scene };
