import '../style.css';
import { sphere } from 'primitive-geometry';
import mycustomshader from './mycustomshader.wgsl?raw';

import { Geometry, Mesh, Renderer, Scene, PerspectiveCamera, OrbitControls, CustomMaterial } from '../../src/index';

const container = document.getElementById('app');

if (container) {
  // Create and init the renderer
  const renderer = await Renderer.create({ containerElement: container, alpha: true });

  // Create a scene
  const scene = new Scene();
  scene.setClearColor([0.25, 0.25, 0.25, 1]);

  // Create a camera
  const camera = new PerspectiveCamera({
    near: 0.1,
    far: 100,
    fov: (60 * Math.PI) / 180,
    aspect: container.clientWidth / container.clientHeight,
  });

  // Create cube geometry
  const spherePrimitive = sphere({ radius: 1, nx: 32, ny: 32 });
  const sphereGeometry = new Geometry({
    vertices: spherePrimitive.positions,
    indices: Uint16Array.from(spherePrimitive.cells),
    normals: spherePrimitive.normals,
    uvs: spherePrimitive.uvs,
  });

  const customMaterial = new CustomMaterial({
    shader: mycustomshader,
    transparent: true,
    uniforms: {
      color: { type: 'vec4f', value: new Float32Array([1, 0, 1, 1]) },
      time: { type: 'f32', value: 0 },
    },
  });

  const sphereMesh = new Mesh(sphereGeometry, customMaterial);

  // Add objects to scene
  scene.add([sphereMesh]);
  scene.setAmbientLightIntensity(0.0);

  camera.setPosition(0, 0, 5);
  camera.lookAt(new Float32Array([0, 0, 0]));
  new OrbitControls({ camera, domElement: renderer.surfaceManager.canvasElement });

  // Render the scene
  function render() {
    const t = renderer.elapsedTime * 0.001;
    customMaterial.updateUniforms({ time: t });
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  render();

  // Add resize handler for camera
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
  });
}
