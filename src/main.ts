import { Geometry } from './core/Geometry';
import { Mesh } from './core/Mesh';
import { Renderer } from './core/Renderer';
import { Scene } from './core/Scene';
import './style.css';
import simpleShader from './simple.wgsl?raw';
import { ShaderMaterial } from './core/ShaderMaterial';
import { UniformBuffer } from './core/UniformBuffer';

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
  const material = new ShaderMaterial({ shader: simpleShader });

  // Create a mesh with the geometry and material
  const meshUniformBuffer = new ArrayBuffer(16);
  const mesh = new Mesh(
    geometry,
    material,
    new UniformBuffer(
      {
        uColor: new Float32Array(meshUniformBuffer, 0, 4).set([0, 0.5, 1, 1]),
      },
      meshUniformBuffer,
    ),
  );

  // Add the mesh to the scene
  scene.add(mesh);

  // TODO:
  // Improve how uniforms are created and updated
  // Add camera

  // Render the scene
  function render() {
    renderer.render(scene);
    requestAnimationFrame(render);
  }

  render();
}
