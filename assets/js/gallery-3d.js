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
    scene = new THREE.Scene();
    // 场景背景色改为深色，防止穿模看到白光
    scene.background = new THREE.Color(0x111111); 
    // 雾效改为黑色/深灰色，增加神秘感和深邃感
    scene.fog = new THREE.Fog(0x111111, 10, 100); 

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, 10, 0); // 站在房间正中央

    // === 灯光优化 ===
    // 1. 环境光 (整体亮度) - 稍微调暗一点，突出画作
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // 2. 顶部射灯 (模拟画廊顶灯)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(0, 50, 0);
    scene.add(dirLight);

    // === 2. 搭建房间 (装修) ===
    buildRoom();

    // === 3. 挂画 (位置已根据新墙壁微调) ===
    // 画框尺寸
    const W = 12; 
    const H = 10;
    
    // --- 左墙画作 (墙在 x = -35) ---
    // 画挂在 x = -34.5 (贴着墙)
    addPainting('assets/images/gallery/eg1.jpg', W, H, -34.5, 10, -30, Math.PI/2);
    addPainting('assets/images/gallery/eg2.jpg', W, H, -34.5, 10, -10, Math.PI/2);
    addPainting('assets/images/gallery/eg3.jpg', W, H, -34.5, 10,  10, Math.PI/2);
    addPainting('assets/images/gallery/eg4.jpg', W, H, -34.5, 10,  30, Math.PI/2);

    // --- 右墙画作 (墙在 x = 35) ---
    // 画挂在 x = 34.5
    addPainting('assets/images/gallery/eg5.jpg', W, H,  34.5, 10, -30, -Math.PI/2);
    addPainting('assets/images/gallery/eg6.jpg', W, H,  34.5, 10, -10, -Math.PI/2);
    addPainting('assets/images/gallery/eg7.jpg', W, H,  34.5, 10,  10, -Math.PI/2);
    addPainting('assets/images/gallery/eg8.jpg', W, H,  34.5, 10,  30, -Math.PI/2);

    // --- 前方墙画作 (墙在 z = -60) ---
    // 画挂在 z = -59.5
    addPainting('assets/images/gallery/eg9.jpg',  W, H, -12, 10, -59.5, 0);
    addPainting('assets/images/gallery/eg10.jpg', W, H,  12, 10, -59.5, 0);

    // --- 后方墙画作 (墙在 z = 60) ---
    // 画挂在 z = 59.5
    addPainting('assets/images/gallery/eg11.jpg', W, H, -12, 10,  59.5, Math.PI);
    addPainting('assets/images/gallery/eg12.jpg', W, H,  12, 10,  59.5, Math.PI);


    // === 控制器 & 渲染器 ===
    controls = new PointerLockControls(camera, document.body);
    const blocker = document.getElementById('blocker');
    
    blocker.addEventListener('click', () => controls.lock());
    controls.addEventListener('lock', () => { blocker.style.opacity = 0; setTimeout(() => blocker.style.display='none', 400); });
    controls.addEventListener('unlock', () => { blocker.style.display = 'flex'; setTimeout(() => blocker.style.opacity = 1, 10); });
    scene.add(controls.getObject());

    // 键盘
    const onKeyDown = (e) => {
        switch (e.code) {
            case 'ArrowUp': case 'KeyW': moveForward = true; break;
            case 'ArrowLeft': case 'KeyA': moveLeft = true; break;
            case 'ArrowDown': case 'KeyS': moveBackward = true; break;
            case 'ArrowRight': case 'KeyD': moveRight = true; break;
        }
    };
    const onKeyUp = (e) => {
        switch (e.code) {
            case 'ArrowUp': case 'KeyW': moveForward = false; break;
            case 'ArrowLeft': case 'KeyA': moveLeft = false; break;
            case 'ArrowDown': case 'KeyS': moveBackward = false; break;
            case 'ArrowRight': case 'KeyD': moveRight = false; break;
        }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    window.addEventListener('resize', onWindowResize);
}

// === 装修队：建造房间 ===
function buildRoom() {
    // 房间尺寸：宽70，深120，高25
    const roomWidth = 70;
    const roomDepth = 120;
    const roomHeight = 25;

    // 1. 地板 (深灰色混凝土质感)
    const floorGeo = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const floorMat = new THREE.MeshStandardMaterial({ 
        color: 0x333333, // 深灰
        roughness: 0.8,  // 粗糙一点，不反光
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    scene.add(floor);

    // 2. 天花板 (纯白)
    const ceilGeo = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const ceilMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = roomHeight;
    scene.add(ceiling);

    // 3. 墙壁材质 (浅灰色，高级灰)
    const wallMat = new THREE.MeshStandardMaterial({ 
        color: 0xe0e0e0, // 浅灰
        roughness: 0.5 
    });

    // 左墙
    createWall(roomDepth, roomHeight, -roomWidth/2, roomHeight/2, 0, Math.PI/2, wallMat);
    // 右墙
    createWall(roomDepth, roomHeight, roomWidth/2, roomHeight/2, 0, -Math.PI/2, wallMat);
    // 前墙
    createWall(roomWidth, roomHeight, 0, roomHeight/2, -roomDepth/2, 0, wallMat);
    // 后墙
    createWall(roomWidth, roomHeight, 0, roomHeight/2, roomDepth/2, Math.PI, wallMat);
}

// 辅助函数：造一面墙
function createWall(w, h, x, y, z, ry, material) {
    const geo = new THREE.PlaneGeometry(w, h);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y, z);
    mesh.rotation.y = ry;
    scene.add(mesh);
}

// 辅助函数：挂画
function addPainting(url, w, h, x, y, z, ry) {
    const texture = new THREE.TextureLoader().load(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    
    // 画框：BoxGeometry (宽, 高, 厚度)
    const geometry = new THREE.BoxGeometry(w, h, 0.3);
    
    // 材质
    const matFrame = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 }); // 黑色磨砂边框
    const matCanvas = new THREE.MeshBasicMaterial({ map: texture }); // 画心
    
    // 材质数组：右左上下前后
    const materials = [
        matFrame, // 右
        matFrame, // 左
        matFrame, // 上
        matFrame, // 下
        matCanvas, // 正面 (画)
        matFrame  // 背面
    ];

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

        // 移动速度 (如果你觉得太快，把 200 改小)
        const speed = 250.0;
        if (moveForward || moveBackward) velocity.z -= direction.z * speed * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * speed * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
    }
    prevTime = time;
    renderer.render(scene, camera);
}
