import type { IEntity } from './types';

class Entity implements IEntity {
  id: string;
  name?: string;
  isRenderable: boolean;
  visible: boolean;
  children: IEntity[];

  constructor() {
    this.id = crypto.randomUUID();
    this.isRenderable = false;
    this.visible = true;
    this.children = [];
  }
}

export { Entity };
