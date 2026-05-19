import '../style.css';
import { sphere } from 'primitive-geometry';

import { TonyGL } from '../../src/core/newAPI/TonyGL';

const container = document.getElementById('app');

if (container) {
  const t = await TonyGL({ containerElement: container, alpha: true });

  const spherePrimitive = sphere({ radius: 2, nx: 32, ny: 32 });

  const sphereGeometry = t.createGeometry({
    name: 'Sphere',
    vertices: spherePrimitive.positions,
    indices: Uint16Array.from(spherePrimitive.cells),
    normals: spherePrimitive.normals,
    uvs: spherePrimitive.uvs,
  });

  const scene = t.createScene();
  console.log(scene);

  // Add resize handler for camera
  // window.addEventListener('resize', () => {
  //   camera.aspect = container.clientWidth / container.clientHeight;
  // });
}
