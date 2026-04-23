import './style.css';
import { Geometry } from './core/Geometry';
import { Mesh } from './core/Mesh';
import { Renderer } from './core/Renderer';
import { Scene } from './core/Scene';
import simpleShader from './simple.wgsl?raw';
import { ShaderMaterial } from './core/ShaderMaterial';
import { PerspectiveCamera } from './core/PerspectiveCamera';
import { cube, sphere, torus } from 'primitive-geometry';
import { Group } from './core/Group';

const container = document.getElementById('app');

if (container) {
  // Create and init the renderer
  const renderer = new Renderer({ containerElement: container });
  await renderer.init();

  // Create a scene
  const scene = new Scene();
  scene.setClearColor([Math.random(), Math.random(), Math.random(), 1]);

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
  const cubeGeometry = new Geometry({ vertices: cubePrimitive.positions, indices: cubeIndices });

  // Create sphere geometry
  const spherePrimitive = sphere({ radius: 0.5 });
  const sphereIndices = Uint16Array.from(spherePrimitive.cells); // CONVERT FROM UINT8 TO UINT16
  const sphereGeometry = new Geometry({ vertices: spherePrimitive.positions, indices: sphereIndices });

  // Create torus geometry
  const torusPrimitive = torus({ radius: 0.5, segments: 32 });
  const torusIndices = Uint16Array.from(torusPrimitive.cells); // CONVERT FROM UINT8 TO UINT16
  const torusGeometry = new Geometry({ vertices: torusPrimitive.positions, indices: torusIndices });

  // Create a material
  const material = new ShaderMaterial({
    shader: simpleShader,
    uniforms: {
      uColor: { type: 'vec4<f32>', value: new Float32Array([Math.random(), Math.random(), Math.random(), 1]) },
    },
  });

  // Create a second material with a different color
  const materialTwo = new ShaderMaterial({
    shader: simpleShader,
    uniforms: {
      uColor: { type: 'vec4<f32>', value: new Float32Array([Math.random(), Math.random(), Math.random(), 1]) },
    },
  });

  // Create meshes
  const cubeMesh = new Mesh(cubeGeometry, material);
  cubeMesh.setPosition(-1.5, 0, 0);
  const sphereMesh = new Mesh(sphereGeometry, material);
  sphereMesh.setPosition(1.5, 0, 0);
  const torusMesh = new Mesh(torusGeometry, materialTwo);
  torusMesh.setPosition(0, 1.5, 0);

  // Create a group
  const group = new Group();
  group.add([cubeMesh, sphereMesh, torusMesh]);
  group.setPosition(0, 0, -10);

  // Add the meshes and camera to the scene
  scene.add([group, camera]);

  // Render the scene
  function render() {
    const t = renderer.elapsedTime;
    cubeMesh.setRotation(0, t * 0.001, t * 0.002);
    group.setRotation(0, t * -0.001, 0);
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  render();

  // Add resize handler for camera
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    renderer.updateCanvasElementSize();
    camera.updateProjectionMatrix();
  });
}
