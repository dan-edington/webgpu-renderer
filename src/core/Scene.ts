import { Vec4 } from 'wgpu-matrix';
import type { IEntity, IScene } from './types';

class Scene implements IScene {
  type: string;
  children: IEntity[];
  renderList: IEntity[];
  renderListNeedsUpdate: boolean;
  clearColor: GPUColor;

  constructor() {
    this.type = 'Scene';
    this.children = [];
    this.renderList = [];
    this.renderListNeedsUpdate = false;
    this.clearColor = { r: 0, g: 0, b: 0, a: 1 };
  }

  setClearColor(color: GPUColor | [number, number, number, number] | Vec4) {
    if (Array.isArray(color) || color instanceof Float32Array) {
      this.clearColor = { r: color[0], g: color[1], b: color[2], a: color[3] };
    } else {
      this.clearColor = color;
    }
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
