import './style.css';
import { Geometry } from '../src/core/Geometry';
import { Mesh } from '../src/core/Mesh';
import { Renderer } from '../src/core/renderer/Renderer';
import { Scene } from '../src/core/Scene';
import { PerspectiveCamera } from '../src/core/PerspectiveCamera';
import { cube, sphere, torus } from 'primitive-geometry';
import { Group } from '../src/core/Group';
import { LambertMaterial } from '../src/core/materials/LambertMaterial';
import { PointLight } from '../src/core/lights/PointLight';
import { UnlitMaterial } from '../src/core/materials/UnlitMaterial';

const container = document.getElementById('app');

if (container) {
  // Create and init the renderer
  const renderer = new Renderer({ containerElement: container });
  await renderer.init();

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

  camera.setPosition(0, 0, 4);

  // Create cube geometry
  const cubePrimitive = cube({ sx: 1, sy: 1, sz: 1, nx: 1, ny: 1, nz: 1 });
  const cubeIndices = Uint16Array.from(cubePrimitive.cells); // CONVERT FROM UINT8 TO UINT16
  const cubeNormals = cubePrimitive.normals;
  const cubeGeometry = new Geometry({ vertices: cubePrimitive.positions, indices: cubeIndices, normals: cubeNormals });

  // Create sphere geometry
  const spherePrimitive = sphere({ radius: 0.5 });
  const sphereIndices = Uint16Array.from(spherePrimitive.cells); // CONVERT FROM UINT8 TO UINT16
  const sphereNormals = spherePrimitive.normals;
  const sphereGeometry = new Geometry({
    vertices: spherePrimitive.positions,
    indices: sphereIndices,
    normals: sphereNormals,
  });

  // Create torus geometry
  const torusPrimitive = torus({ radius: 0.5, segments: 32 });
  const torusIndices = Uint16Array.from(torusPrimitive.cells); // CONVERT FROM UINT8 TO UINT16
  const torusNormals = torusPrimitive.normals;
  const torusGeometry = new Geometry({
    vertices: torusPrimitive.positions,
    indices: torusIndices,
    normals: torusNormals,
  });

  // Create a material
  const material = new LambertMaterial({
    color: [1, 0, 1, 1],
  });

  // Create a second material with a different color
  const materialTwo = new LambertMaterial({
    color: [0, 1, 1, 1],
  });

  const unlitMaterial = new UnlitMaterial({
    color: [1, 1, 0, 1],
  });

  // Create meshes
  const cubeMesh = new Mesh(cubeGeometry, unlitMaterial);
  cubeMesh.setPosition(-1.5, 0, 0);
  const sphereMesh = new Mesh(sphereGeometry, material);
  sphereMesh.setPosition(1.5, 0, 0);
  const torusMesh = new Mesh(torusGeometry, materialTwo);
  torusMesh.setPosition(0, 1.5, 0);

  // Create a group
  const group = new Group();
  group.add([cubeMesh, sphereMesh, torusMesh]);
  group.setPosition(0, 0, -10);

  // Create a point light
  const pointLight = new PointLight();
  pointLight.setPosition(0, 2, 2);

  // Add objects to scene
  scene.add([group, camera, pointLight]);

  scene.setAmbientLightIntensity(0);

  // Render the scene
  function render() {
    const t = renderer.elapsedTime * 0.1;
    cubeMesh.setRotation(t * 0.001, 0, t * 0.002);
    torusMesh.setPosition(0, Math.sin(t * 0.001), 0);
    group.setRotation(0, t * -0.005, 0);
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  render();

  // Add resize handler for camera
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
  });
}
