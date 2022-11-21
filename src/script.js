import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "lil-gui";

/**
 * Base
 */
// Debug
const gui = new dat.GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Texture Loader
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load(
  "/particlePack_1.1/PNG (Transparent)/star_01.png"
);

/**
 * Galaxy
 */
const parameters = {};
parameters.count = 100000; // How many points?
parameters.size = 0.01; // How big is each point?
parameters.radius = 5; // How far will our galaxy extend from the center in every direction?
parameters.branches = 3; // How many branches will radiate from the center?
parameters.curve = 1; // How much curve will each branch have?
parameters.randomness = 0.2; // How random are the coordinates of the points?
parameters.randomnessPower = 3; // How much spread between the random co-ords?
parameters.insideColor = "#ff6030"; // What is the color at the center?
parameters.outsideColor = "#1b3984"; // What is the color at the edges?

// We need to intialize our variable in the global scope to access them later
// we'll instantiate THREEJS classes for each inside our loop
let geometry = null;
let material = null;
let points = null;
let galaxyGroup = null;

const generateGalaxy = () => {
  /**
   * When parameters change we must dispose of the old one
   */
  if (points !== null) {
    //we need to dispose to free memory in our gpu
    geometry.dispose();
    material.dispose();
    //and we'll just remove the group from our scene
    scene.remove(galaxyGroup);
  }

  geometry = new THREE.BufferGeometry();
  galaxyGroup = new THREE.Group();

  // Each point requires a (x, y, z) coordinate && an RGB value (red, blue, green)
  // hence why we multiply our number of points x 3
  const positions = new Float32Array(parameters.count * 3);
  const colors = new Float32Array(parameters.count * 3);

  //To lerp two colors we'ee need an innerColor and an outerColor to our galaxy
  const colorInside = new THREE.Color(parameters.insideColor);
  const colorOutside = new THREE.Color(parameters.outsideColor);

  for (let i = 0; i < parameters.count; i++) {
    // We will loop the array by multiples of 3 to account for xyz co-ords
    const i3 = i * 3;

    const radius = Math.random() * parameters.radius;
    const curveAngle = radius * parameters.curve;
    const branchAngle =
      ((i % parameters.branches) / parameters.branches) * Math.PI * 2;

    const randomX =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1) *
      parameters.randomness *
      radius;
    const randomY =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1) *
      parameters.randomness *
      radius;
    const randomZ =
      Math.pow(Math.random(), parameters.randomnessPower) *
      (Math.random() < 0.5 ? 1 : -1) *
      parameters.randomness *
      radius;

    positions[i3 + 0] = Math.cos(branchAngle + curveAngle) * radius + randomX;
    positions[i3 + 1] = randomY;
    positions[i3 + 2] = Math.sin(branchAngle + curveAngle) * radius + randomZ;

    const mixedColor = colorInside.clone();
    mixedColor.lerp(colorOutside, radius / parameters.radius);

    colors[i3] = mixedColor.r;
    colors[i3 + 1] = mixedColor.g;
    colors[i3 + 2] = mixedColor.b;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  material = new THREE.PointsMaterial({
    size: parameters.size,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    map: texture
  });

  points = new THREE.Points(geometry, material);
  galaxyGroup.add(points);
  scene.add(galaxyGroup);
};

gui.add(parameters, "count", 100, 100000, 100).onFinishChange(generateGalaxy);
gui.add(parameters, "size", 0.001, 0.1, 0.0001).onFinishChange(generateGalaxy);
gui.add(parameters, "radius", 0.01, 20, 0.01).onFinishChange(generateGalaxy);
gui.add(parameters, "branches", 2, 20, 1).onFinishChange(generateGalaxy);
gui.add(parameters, "curve", -5, 5, 0.001).onFinishChange(generateGalaxy);
gui.add(parameters, "randomness", 0, 2, 0.001).onFinishChange(generateGalaxy);
gui
  .add(parameters, "randomnessPower", 1, 10, 0.001)
  .onFinishChange(generateGalaxy);
gui.addColor(parameters, "insideColor").onFinishChange(generateGalaxy);
gui.addColor(parameters, "outsideColor").onFinishChange(generateGalaxy);

generateGalaxy();

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
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
camera.position.x = 3;
camera.position.y = 3;
camera.position.z = 3;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Rotate galaxy
  galaxyGroup.rotation.y = elapsedTime * 0.05;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
