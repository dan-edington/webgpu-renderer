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
  const mesh = new Mesh(
    geometry,
    material,
    new UniformBuffer({
      uColor: { type: 'vec4<f32>', value: new Float32Array([0, 1, 0, 1]) },
    }),
  );

  // Add the mesh to the scene
  scene.add(mesh);

  // TODO:
  // Add camera

  // Render the scene
  function render() {
    renderer.render(scene);
    requestAnimationFrame(render);
  }

  render();
}
