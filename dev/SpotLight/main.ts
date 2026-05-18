import '../style.css';
import { plane } from 'primitive-geometry';
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
  SpotLight,
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
  const planePrimitive = plane({ sx: 5, sy: 5 });
  const planeGeometry = new Geometry({
    vertices: planePrimitive.positions,
    indices: Uint16Array.from(planePrimitive.cells),
    normals: planePrimitive.normals,
    uvs: planePrimitive.uvs,
  });

  const lambertMaterialParams = {
    color: { r: 1, g: 0, b: 0, a: 1 },
  };

  const lightParams = {
    color: { r: 1, g: 1, b: 1, a: 1 },
    intensity: 4,
    position: { x: 0, y: 0, z: 2.5 },
    direction: { x: 0, y: 0, z: 1 },
    angle: Math.PI / 5,
    penumbra: 0.2,
    visible: true,
  };

  const ambientParams = {
    color: { r: 1, g: 1, b: 1, a: 1 },
    intensity: 0,
  };

  const spotLight = new SpotLight({
    position: [lightParams.position.x, lightParams.position.y, lightParams.position.z],
    direction: [lightParams.direction.x, lightParams.direction.y, lightParams.direction.z],
    angle: lightParams.angle,
    penumbra: lightParams.penumbra,
    color: [lightParams.color.r, lightParams.color.g, lightParams.color.b, lightParams.color.a],
    intensity: lightParams.intensity,
  });
  spotLight.setPosition(lightParams.position.x, lightParams.position.y, lightParams.position.z);

  const lambertMaterial = new LambertMaterial({
    transparent: true,
    color: [
      lambertMaterialParams.color.r,
      lambertMaterialParams.color.g,
      lambertMaterialParams.color.b,
      lambertMaterialParams.color.a,
    ],
  });

  const sphereMesh = new Mesh(planeGeometry, lambertMaterial);

  // Add objects to scene
  scene.add([sphereMesh, spotLight]);

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

  // Color
  lightFolder.addBinding(lightParams, 'color', { color: { type: 'float' } }).on('change', () => {
    const value = lightParams.color;
    spotLight.color = new Float32Array([value.r, value.g, value.b, value.a]);
  });

  // Intensity
  lightFolder.addBinding(lightParams, 'intensity', { min: 0, max: 30, step: 0.01 }).on('change', () => {
    spotLight.intensity = lightParams.intensity;
  });

  // Position with custom labels
  lightFolder
    .addBinding(lightParams.position, 'x', { min: -10, max: 10, step: 0.01, label: 'pos x' })
    .on('change', () => {
      spotLight.setPosition(lightParams.position.x, lightParams.position.y, lightParams.position.z);
    });
  lightFolder
    .addBinding(lightParams.position, 'y', { min: -10, max: 10, step: 0.01, label: 'pos y' })
    .on('change', () => {
      spotLight.setPosition(lightParams.position.x, lightParams.position.y, lightParams.position.z);
    });
  lightFolder
    .addBinding(lightParams.position, 'z', { min: -10, max: 10, step: 0.01, label: 'pos z' })
    .on('change', () => {
      spotLight.setPosition(lightParams.position.x, lightParams.position.y, lightParams.position.z);
    });

  // Direction with custom labels
  lightFolder
    .addBinding(lightParams.direction, 'x', { min: -1, max: 1, step: 0.01, label: 'dir x' })
    .on('change', () => {
      spotLight.direction = [lightParams.direction.x, lightParams.direction.y, lightParams.direction.z];
    });
  lightFolder
    .addBinding(lightParams.direction, 'y', { min: -1, max: 1, step: 0.01, label: 'dir y' })
    .on('change', () => {
      spotLight.direction = [lightParams.direction.x, lightParams.direction.y, lightParams.direction.z];
    });
  lightFolder
    .addBinding(lightParams.direction, 'z', { min: -1, max: 1, step: 0.01, label: 'dir z' })
    .on('change', () => {
      spotLight.direction = [lightParams.direction.x, lightParams.direction.y, lightParams.direction.z];
    });

  // Angle (outer cone)
  lightFolder.addBinding(lightParams, 'angle', { min: 0, max: Math.PI / 2, step: 0.01 }).on('change', () => {
    spotLight.angle = lightParams.angle;
  });

  // Penumbra
  lightFolder.addBinding(lightParams, 'penumbra', { min: 0, max: 1, step: 0.01 }).on('change', () => {
    spotLight.penumbra = lightParams.penumbra;
  });

  // Visible
  lightFolder.addBinding(lightParams, 'visible').on('change', () => {
    spotLight.visible = lightParams.visible;
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
