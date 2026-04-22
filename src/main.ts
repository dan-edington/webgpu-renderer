import './style.css';
import { Geometry } from './core/Geometry';
import { Mesh } from './core/Mesh';
import { Renderer } from './core/Renderer';
import { Scene } from './core/Scene';
import simpleShader from './simple.wgsl?raw';
import { ShaderMaterial } from './core/ShaderMaterial';
import { PerspectiveCamera } from './core/PerspectiveCamera';

const container = document.getElementById('app');

if (container) {
  // Create and init the renderer
  const renderer = new Renderer({ containerElement: container });
  await renderer.init();

  // Create a scene
  const scene = new Scene();

  // Draw 2 triangles to create a quad (CCW winding order)
  const vertices = new Float32Array([-0.8, 0.8, 0, 0.8, 0.8, 0, 0.8, -0.8, 0, -0.8, -0.8, 0]);
  const vertexIndices = new Uint16Array([0, 3, 2, 2, 1, 0]);
  const geometry = new Geometry({ vertices, indices: vertexIndices });

  // Create a material
  const material = new ShaderMaterial({
    shader: simpleShader,
    uniforms: {
      uColor: { type: 'vec4<f32>', value: new Float32Array([0, 1, 0, 1]) },
    },
  });

  // Create a mesh with the geometry and material
  const mesh = new Mesh(geometry, material);

  // Create a camera and add to scene
  const camera = new PerspectiveCamera({
    near: 0.1,
    far: 100,
    fov: (60 * Math.PI) / 180,
    aspect: container.clientWidth / container.clientHeight,
  });

  camera.setPosition(0, 0, 4);
  scene.add(camera);

  // Add the mesh to the scene
  scene.add(mesh);

  // Render the scene
  function render() {
    renderer.render(scene, camera);
    const t = renderer.elapsedTime;
    camera.setRotation(0, 0, Math.PI * 2 * (t / 10) * 0.001);
    camera.setPosition(0, 0, 4 + Math.sin(t * 0.001) * 2);

    requestAnimationFrame(render);
  }

  render();

  // Add resize handler for camera
  window.addEventListener('resize', () => {
    if (camera) {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
    }
  });
}
