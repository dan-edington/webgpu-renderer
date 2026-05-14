import '../style.css';
import { sphere } from 'primitive-geometry';
import { Pane } from 'tweakpane';
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';

import {
  Geometry,
  Mesh,
  Renderer,
  Scene,
  PerspectiveCamera,
  OrbitControls,
  LambertMaterial,
  PointLight,
} from '../../src/index';

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

  const lambertMaterialParams = {
    color: { r: 1, g: 0, b: 0, a: 1 },
  };

  const lightParams = {
    color: { r: 1, g: 1, b: 1, a: 1 },
    intensity: 4,
    x: 2,
    y: 2,
    z: 2,
    visible: true,
  };

  const ambientParams = {
    color: { r: 1, g: 1, b: 1, a: 1 },
    intensity: 0,
  };

  const lambertMaterial = new LambertMaterial({
    transparent: true,
    color: [
      lambertMaterialParams.color.r,
      lambertMaterialParams.color.g,
      lambertMaterialParams.color.b,
      lambertMaterialParams.color.a,
    ],
  });

  const pointLight = new PointLight({
    type: 'PointLight',
    color: new Float32Array([lightParams.color.r, lightParams.color.g, lightParams.color.b, lightParams.color.a]),
    intensity: lightParams.intensity,
    range: 30,
  });
  pointLight.setPosition(lightParams.x, lightParams.y, lightParams.z);
  pointLight.visible = lightParams.visible;

  const sphereMesh = new Mesh(sphereGeometry, lambertMaterial);

  // Add objects to scene
  scene.add([sphereMesh, pointLight]);
  scene.setAmbientLightColor([
    ambientParams.color.r,
    ambientParams.color.g,
    ambientParams.color.b,
    ambientParams.color.a,
  ]);
  scene.setAmbientLightIntensity(ambientParams.intensity);

  camera.setPosition(0, 0, 5);
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
  const lambertMaterialFolder = paneApi.addFolder ? paneApi.addFolder({ title: 'Lambert Material' }) : paneApi;

  lambertMaterialFolder.addBinding(lambertMaterialParams, 'color', { color: { type: 'float' } }).on('change', () => {
    const value = lambertMaterialParams.color;
    const newColor = [value.r, value.g, value.b, value.a];
    lambertMaterial.color = newColor;
  });

  const lightFolder = paneApi.addFolder ? paneApi.addFolder({ title: 'Light' }) : paneApi;

  lightFolder.addBinding(lightParams, 'color', { color: { type: 'float' } }).on('change', () => {
    const value = lightParams.color;
    pointLight.color = new Float32Array([value.r, value.g, value.b, value.a]);
  });

  lightFolder.addBinding(lightParams, 'intensity', { min: 0, max: 30, step: 0.01 }).on('change', () => {
    pointLight.intensity = lightParams.intensity;
  });

  lightFolder.addBinding(lightParams, 'x', { min: -10, max: 10, step: 0.01 }).on('change', () => {
    pointLight.setPosition(lightParams.x, lightParams.y, lightParams.z);
  });
  lightFolder.addBinding(lightParams, 'y', { min: -10, max: 10, step: 0.01 }).on('change', () => {
    pointLight.setPosition(lightParams.x, lightParams.y, lightParams.z);
  });
  lightFolder.addBinding(lightParams, 'z', { min: -10, max: 10, step: 0.01 }).on('change', () => {
    pointLight.setPosition(lightParams.x, lightParams.y, lightParams.z);
  });

  lightFolder.addBinding(lightParams, 'visible').on('change', () => {
    pointLight.visible = lightParams.visible;
  });

  const ambientFolder = paneApi.addFolder ? paneApi.addFolder({ title: 'Ambient Light' }) : paneApi;

  ambientFolder.addBinding(ambientParams, 'color', { color: { type: 'float' } }).on('change', () => {
    const value = ambientParams.color;
    scene.setAmbientLightColor([value.r, value.g, value.b, value.a]);
  });

  ambientFolder.addBinding(ambientParams, 'intensity', { min: 0, max: 1, step: 0.01 }).on('change', () => {
    scene.setAmbientLightIntensity(ambientParams.intensity);
  });
}
