import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let camera, scene, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// === 1. 初始化场景 ===
init();
animate();

function init() {
    // 创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff); // 白墙
    // 添加雾效，让远处边缘柔和消失，制造无限空间感
    scene.fog = new THREE.Fog(0xffffff, 10, 150); 

    // 创建相机 (人眼)
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.y = 12; // 视线高度 (约1.2米)
    camera.position.z = 0;  // 初始位置在房间中心

    // 添加灯光
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 2.0); // 环境光
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    // === 2. 控制器设置 ===
    controls = new PointerLockControls(camera, document.body);
    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');

    blocker.addEventListener('click', () => controls.lock());
    controls.addEventListener('lock', () => { blocker.style.display = 'none'; });
    controls.addEventListener('unlock', () => { blocker.style.display = 'flex'; });
    scene.add(controls.getObject());

    // 键盘监听
    const onKeyDown = (event) => {
        switch (event.code) {
            case 'ArrowUp': case 'KeyW': moveForward = true; break;
            case 'ArrowLeft': case 'KeyA': moveLeft = true; break;
            case 'ArrowDown': case 'KeyS': moveBackward = true; break;
            case 'ArrowRight': case 'KeyD': moveRight = true; break;
        }
    };
    const onKeyUp = (event) => {
        switch (event.code) {
            case 'ArrowUp': case 'KeyW': moveForward = false; break;
            case 'ArrowLeft': case 'KeyA': moveLeft = false; break;
            case 'ArrowDown': case 'KeyS': moveBackward = false; break;
            case 'ArrowRight': case 'KeyD': moveRight = false; break;
        }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // === 3. 搭建地板 ===
    const floorGeo = new THREE.PlaneGeometry(200, 200);
    const floorMat = new THREE.MeshBasicMaterial({ color: 0xeeeeee, side: THREE.DoubleSide });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // === 4. 核心：挂画 (12张) ===
    // 假设画框尺寸：宽12，高10 (你可以根据需要自己改)
    const W = 12; 
    const H = 10;
    
    // --- 左墙 (x = -30) ---
    // 面向右边 (旋转 90度)
    addPainting('assets/images/gallery/eg1.jpg', W, H, -30, 10, -30, Math.PI/2);
    addPainting('assets/images/gallery/eg2.jpg', W, H, -30, 10, -10, Math.PI/2);
    addPainting('assets/images/gallery/eg3.jpg', W, H, -30, 10,  10, Math.PI/2);
    addPainting('assets/images/gallery/eg4.jpg', W, H, -30, 10,  30, Math.PI/2);

    // --- 右墙 (x = 30) ---
    // 面向左边 (旋转 -90度)
    addPainting('assets/images/gallery/eg5.jpg', W, H,  30, 10, -30, -Math.PI/2);
    addPainting('assets/images/gallery/eg6.jpg', W, H,  30, 10, -10, -Math.PI/2);
    addPainting('assets/images/gallery/eg7.jpg', W, H,  30, 10,  10, -Math.PI/2);
    addPainting('assets/images/gallery/eg8.jpg', W, H,  30, 10,  30, -Math.PI/2);

    // --- 前方墙 (z = -50) ---
    // 面向你 (旋转 0)
    addPainting('assets/images/gallery/eg9.jpg',  W, H, -12, 10, -50, 0);
    addPainting('assets/images/gallery/eg10.jpg', W, H,  12, 10, -50, 0);

    // --- 后方墙 (z = 50) ---
    // 背向你 (旋转 180度)
    addPainting('assets/images/gallery/eg11.jpg', W, H, -12, 10,  50, Math.PI);
    addPainting('assets/images/gallery/eg12.jpg', W, H,  12, 10,  50, Math.PI);


    // === 渲染器 ===
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    window.addEventListener('resize', onWindowResize);
}

// 辅助函数：创建画框
function addPainting(url, w, h, x, y, z, ry) {
    const texture = new THREE.TextureLoader().load(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    
    // 画框几何体 (有点厚度)
    const geometry = new THREE.BoxGeometry(w, h, 0.5);
    
    // 材质
    const matSide = new THREE.MeshBasicMaterial({ color: 0x222222 }); // 深色边框
    const matImg = new THREE.MeshBasicMaterial({ map: texture });     // 画
    const materials = [matSide, matSide, matSide, matSide, matImg, matSide]; // 只有正面贴图

    const mesh = new THREE.Mesh(geometry, materials);
    mesh.position.set(x, y, z);
    mesh.rotation.y = ry;
    scene.add(mesh);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();

    if (controls.isLocked) {
        const delta = (time - prevTime) / 1000;
        
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
    }
    prevTime = time;
    renderer.render(scene, camera);
}
