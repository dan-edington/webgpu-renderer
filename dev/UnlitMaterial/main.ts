import '../style.css';
import { sphere } from 'primitive-geometry';
import { Pane } from 'tweakpane';
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';

import { Geometry, Mesh, Renderer, Scene, PerspectiveCamera, OrbitControls, UnlitMaterial } from '../../src/index';

const container = document.getElementById('app');

const pane = new Pane();
pane.registerPlugin(EssentialsPlugin);

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

  const unlitMaterialParams = {
    color: { r: 1, g: 0, b: 0, a: 1 },
  };

  const unlitMaterial = new UnlitMaterial({
    transparent: true,
    color: [
      unlitMaterialParams.color.r,
      unlitMaterialParams.color.g,
      unlitMaterialParams.color.b,
      unlitMaterialParams.color.a,
    ],
  });

  const sphereMesh = new Mesh(sphereGeometry, unlitMaterial);

  // Add objects to scene
  scene.add([sphereMesh]);

  camera.position = [0, 0, 5];
  camera.lookAt(new Float32Array([0, 0, 0]));
  new OrbitControls({ camera, domElement: renderer.surfaceManager.canvasElement });

  // Render the scene
  function render() {
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  render();

  // Add resize handler for camera
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
  });

  const paneApi: any = pane;
  const unlitMaterialFolder = paneApi.addFolder ? paneApi.addFolder({ title: 'Unlit Material' }) : paneApi;

  unlitMaterialFolder.addBinding(unlitMaterialParams, 'color', { color: { type: 'float' } }).on('change', () => {
    const value = unlitMaterialParams.color;
    const newColor = [value.r, value.g, value.b, value.a];
    unlitMaterial.color = newColor;
  });
}
