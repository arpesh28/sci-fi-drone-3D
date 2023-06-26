import * as THREE from "three";
import * as dat from "lil-gui";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/**
 * Loaders
 */
const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

//  Debug
const gui = new dat.GUI();
const global = {};

//  Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Update All Materials
 */
const updateAllMaterials = () => {
  scene.traverse((child) => {
    if (child.isMesh && child.material.isMeshStandardMaterial) {
      child.material.envMapIntensity = global.envMapIntensity;
    }
  });
};

/**
 * Environment Maps
 */
global.envMapIntensity = 0.5;
global.backgroundBlurriness = 0.03;
gui.add(global, "envMapIntensity", 0, 10, 0.001).onChange(updateAllMaterials);
gui.add(scene, "backgroundBlurriness").min(0).max(1).step(0.001);
gui.add(scene, "backgroundIntensity").min(0).max(10).step(0.001);

const environmentMap = textureLoader.load("/environmentMaps/2/warm.jpg");
environmentMap.mapping = THREE.EquirectangularReflectionMapping;
environmentMap.colorSpace = THREE.SRGBColorSpace;
scene.background = environmentMap;
scene.environment = environmentMap;
scene.backgroundIntensity = 1.15;
scene.backgroundBlurriness = global.backgroundBlurriness;

let mixer = null;
gltfLoader.load("/models/3/scene.gltf", (gltf) => {
  mixer = new THREE.AnimationMixer(gltf.scene);
  const action = mixer.clipAction(gltf.animations[0]);
  action.play();
  gltf.scene.position.set(0, 3, 0);
  gltf.scene.scale.set(1.7, 1.7, 1.7);
  scene.add(gltf.scene);
  updateAllMaterials();
});

//  Circular Shield
const circle1 = new THREE.Mesh(
  new THREE.TorusGeometry(4, 0.2, 16, 100),
  new THREE.MeshBasicMaterial({ color: new THREE.Color(10, 2, 2) })
);
circle1.position.set(0, 3, 0);
circle1.rotation.x = Math.PI * 0.5;
circle1.layers.enable(1);
const circle2 = new THREE.Mesh(
  new THREE.TorusGeometry(5, 0.2, 16, 100),
  new THREE.MeshBasicMaterial({ color: new THREE.Color(10, 2, 2) })
);
circle2.position.set(0, 3, 0);
circle2.rotation.x = Math.PI * 0.5;
circle2.layers.enable(1);

scene.add(circle1, circle2);

//  Cube render target
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
  type: THREE.HalfFloatType,
});
scene.environment = cubeRenderTarget.texture;

const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget);
cubeCamera.layers.set(1);

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight("#ffffff", 0.5);
// scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight("#ffffff", 1);
sunLight.position.set(0, 10, 10);
// sunLight.rotation.x = Math.PI * 2;
// scene.add(sunLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(0, 5, -10);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.target.y = 3.5;
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;
const tick = () => {
  // Time
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  //  Real Time EnvironmentMap
  if (circle1 && circle2) {
    circle1.rotation.set(
      Math.PI * elapsedTime * 0.2,
      Math.PI * elapsedTime * 0.2,
      Math.PI * elapsedTime * 0.2
    );
    circle2.rotation.set(
      -Math.PI * elapsedTime * 0.2,
      -Math.PI * elapsedTime * 0.2,
      -Math.PI * elapsedTime * 0.2
    );
    cubeCamera.update(renderer, scene);
  }

  //  Update Mixer
  mixer?.update(deltaTime);

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
