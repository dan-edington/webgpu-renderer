import { mat4, vec3 } from "gl-matrix";

function createCamera(projectionMatrix: Float32Array, viewMatrix: Float32Array) {
  let position = vec3.fromValues(0, 0, 5);
  let target = vec3.fromValues(0, 0, 0);

  const cameraUp = vec3.fromValues(0, 1, 0);

  const _projectionMatrix = mat4.create();
  const _viewMatrix = mat4.create();

  function lookAt(lookAtPosition: vec3) {
    target = lookAtPosition;
    mat4.lookAt(_viewMatrix, position, target, cameraUp);
    viewMatrix.set(_viewMatrix, 0);
  }

  function setPosition(newPosition: vec3) {
    position = newPosition;
    mat4.lookAt(_viewMatrix, position, target, cameraUp);
    viewMatrix.set(_viewMatrix, 0);
  }

  function calculateProjectionMatrix() {
    mat4.perspectiveNO(_projectionMatrix, Math.PI / 4, window.innerWidth / window.innerHeight, 0.1, 100.0);
    projectionMatrix.set(_projectionMatrix, 0);
  }

  calculateProjectionMatrix();
  setPosition(position);
  lookAt(target);

  return {
    lookAt,
    setPosition,
    calculateProjectionMatrix,
    get position() {
      return position;
    },
    get target() {
      return target;
    },
  };
}

export { createCamera };
