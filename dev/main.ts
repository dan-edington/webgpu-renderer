import './style.css';
import { sphere } from 'primitive-geometry';

import {
  Geometry,
  Mesh,
  Renderer,
  Scene,
  PerspectiveCamera,
  BlinnPhongMaterial,
  LambertMaterial,
  PointLight,
  Texture,
  OrbitControls,
} from '../src/index';

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

  const sphereGeometry2 = new Geometry({
    vertices: spherePrimitive.positions,
    indices: Uint16Array.from(spherePrimitive.cells),
    normals: spherePrimitive.normals,
    uvs: spherePrimitive.uvs,
  });

  async function loadTexture(url: string, colorSpace: 'srgb' | 'linear' | 'data' = 'srgb') {
    const response = await fetch(url);
    const imageBitmap = await createImageBitmap(await response.blob());
    return Texture.fromImageBitmap(imageBitmap, renderer.device, colorSpace);
  }

  const albedoTexture = await loadTexture('/uvtest.png');
  const normalTexture = await loadTexture('/normal.png', 'linear');
  const alphaTexture = await loadTexture('/alpha.jpg');

  const testMaterial2 = new LambertMaterial({
    color: [0, 0, 1, 1],
  });

  const testMaterial = new BlinnPhongMaterial({
    color: [1, 0, 0, 1],
    shininess: 100,
    specularColor: [1, 1, 1],
  });

  // Create meshes
  const sphereMesh = new Mesh(sphereGeometry, testMaterial);
  sphereMesh.setPosition(0, 0, 0);

  const sphereMesh2 = new Mesh(sphereGeometry2, testMaterial2);
  sphereMesh2.setPosition(2, 0, 0);

  // Create a point light
  const pointLight = new PointLight();
  pointLight.setPosition(5, 5, 5);
  pointLight.intensity = 10;

  // Add objects to scene
  scene.add([sphereMesh, camera, pointLight, sphereMesh2]);
  scene.setAmbientLightIntensity(0.0);

  camera.setPosition(0, 0, 5);
  camera.lookAt(new Float32Array([0, 0, 0]));
  new OrbitControls({ camera, domElement: renderer.canvasManager.canvasElement });

  // Render the scene
  function render() {
    const t = renderer.elapsedTime * 0.001;
    pointLight.setPosition(Math.sin(t) * 5, 0, Math.cos(t) * 5);
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  render();

  // Add resize handler for camera
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
  });
}
