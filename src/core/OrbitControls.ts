import { vec3 } from 'wgpu-matrix';
import { PerspectiveCamera } from './PerspectiveCamera';

type OrbitControlsOptions = {
  camera: PerspectiveCamera;
  domElement?: HTMLElement;
  target?: Float32Array;
};

class OrbitControls {
  camera: PerspectiveCamera;
  isDragging: boolean;
  domElement: HTMLElement;
  target: Float32Array;
  radius: number = 0;
  rotationSpeed: number = 0.005;
  currentRotation: Float32Array = new Float32Array([0, 0]);

  constructor(options: OrbitControlsOptions) {
    this.camera = options.camera;
    this.isDragging = false;
    this.domElement = options.domElement ?? document.body;
    this.target = options.target ?? new Float32Array([0, 0, 0]);

    this.initEventListeners();
  }

  calculateCurrentRadiusAndRotation() {
    const cameraToTargetVector = vec3.sub(this.camera.position, this.target);
    this.radius = vec3.len(cameraToTargetVector);
    this.currentRotation[0] = Math.atan2(cameraToTargetVector[0], cameraToTargetVector[2]);
    this.currentRotation[1] = Math.asin(Math.max(-1, Math.min(1, cameraToTargetVector[1] / this.radius)));
  }

  initEventListeners() {
    this.domElement.addEventListener('pointerdown', () => this.handleDragStart.call(this));
    this.domElement.addEventListener('pointerup', () => this.handleDragEnd.call(this));
  }

  handleDragStart() {
    this.isDragging = true;
    this.calculateCurrentRadiusAndRotation();
    this.domElement.addEventListener('pointermove', this.handleDrag);
  }

  handleDragEnd() {
    this.isDragging = false;
  }

  handleDrag = (event: PointerEvent) => {
    if (!this.isDragging) {
      this.domElement.removeEventListener('pointermove', this.handleDrag);
      return;
    }

    this.currentRotation[0] -= event.movementX * this.rotationSpeed;
    this.currentRotation[1] = Math.max(
      -Math.PI / 2 + 0.01,
      Math.min(Math.PI / 2 - 0.01, this.currentRotation[1] + event.movementY * this.rotationSpeed),
    );

    const cosV = Math.cos(this.currentRotation[1]);
    const cameraX = this.target[0] + this.radius * Math.sin(this.currentRotation[0]) * cosV;
    const cameraY = this.target[1] + this.radius * Math.sin(this.currentRotation[1]);
    const cameraZ = this.target[2] + this.radius * Math.cos(this.currentRotation[0]) * cosV;

    this.camera.setPosition(cameraX, cameraY, cameraZ);
    this.camera.lookAt(this.target);
  };
}

export { OrbitControls };
