import { createEntity, Entity, EntityOptions } from './entity';

export type Group = Entity & {};

export type GroupOptions = EntityOptions & {};

function createGroup(options: GroupOptions): Group {
  const groupEntity: Group = Object.assign(
    createEntity({
      ...options,
      type: 'Group',
    }),
  );

  return groupEntity;
}

export { createGroup };
