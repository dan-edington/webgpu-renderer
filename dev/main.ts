import './style.css';
import { Geometry } from '../src/core/Geometry';
import { Mesh } from '../src/core/Mesh';
import { Renderer } from '../src/core/renderer/Renderer';
import { Scene } from '../src/core/Scene';
import { PerspectiveCamera } from '../src/core/PerspectiveCamera';
import { cube } from 'primitive-geometry';
import { LambertMaterial } from '../src/core/materials/LambertMaterial';
import { PointLight } from '../src/core/lights/PointLight';
import { Texture } from '../src/core/Texture';
import { OrbitControls } from '../src/core/OrbitControls';

const container = document.getElementById('app');

if (container) {
  // Create and init the renderer
  const renderer = await Renderer.create({ containerElement: container, alpha: true });

  // Create a scene
  const scene = new Scene();
  scene.setClearColor([0, 0, 0, 1]);

  // Create a camera
  const camera = new PerspectiveCamera({
    near: 0.1,
    far: 100,
    fov: (60 * Math.PI) / 180,
    aspect: container.clientWidth / container.clientHeight,
  });

  // Create cube geometry
  const cubePrimitive = cube({ sx: 1, sy: 1, sz: 1, nx: 1, ny: 1, nz: 1 });
  const cubeIndices = Uint16Array.from(cubePrimitive.cells); // CONVERT FROM UINT8 TO UINT16
  const cubeNormals = cubePrimitive.normals;
  const cubeUVs = cubePrimitive.uvs;
  const cubeGeometry = new Geometry({
    vertices: cubePrimitive.positions,
    indices: cubeIndices,
    normals: cubeNormals,
    uvs: cubeUVs,
  });

  async function loadTexture(url: string, colorSpace: 'srgb' | 'linear' | 'data' = 'srgb') {
    const response = await fetch(url);
    const imageBitmap = await createImageBitmap(await response.blob());
    return Texture.fromImageBitmap(imageBitmap, renderer.device, colorSpace);
  }

  const albedoTexture = await loadTexture('/uvtest.png');
  const normalTexture = await loadTexture('/normal.png', 'linear');
  // const alphaTexture = await loadTexture('/alpha.jpg');

  const testMaterial = new LambertMaterial({
    albedoTexture: albedoTexture,
    normalTexture: normalTexture,
  });

  // Create meshes
  const cubeMesh = new Mesh(cubeGeometry, testMaterial);
  cubeMesh.setPosition(0, 0, 0);

  // Create a point light
  const pointLight = new PointLight();
  pointLight.setPosition(0, 0, 0);
  pointLight.intensity = 5;

  const pointLight2 = new PointLight();
  pointLight2.setPosition(0, 0, 0);
  pointLight2.intensity = 5;

  // Add objects to scene
  scene.add([cubeMesh, camera, pointLight, pointLight2]);
  scene.setAmbientLightIntensity(0.0);

  camera.setPosition(3, 3, 5);
  camera.lookAt(new Float32Array([0, 0, 0]));
  new OrbitControls({ camera, domElement: renderer.canvasManager.canvasElement });

  // Render the scene
  function render() {
    const lightDistance = 10;
    const t = renderer.elapsedTime * 0.001;
    pointLight.setPosition(Math.cos(t * 2) * lightDistance, 0, Math.sin(t) * lightDistance);
    pointLight2.setPosition(0, Math.cos(t) * lightDistance, Math.sin(t) * lightDistance);
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  render();

  // Add resize handler for camera
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
  });
}
