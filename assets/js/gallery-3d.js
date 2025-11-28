import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let camera, scene, renderer, controls;
const objects = []; // 存储所有物体用于碰撞检测（本简易版暂不含复杂碰撞）
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// 1. 初始化
init();
animate();

function init() {
    // --- 创建场景和相机 ---
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff); // 白墙背景，也可以换颜色
    scene.fog = new THREE.Fog(0xffffff, 0, 750); // 远处加点雾，增加空间感

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.y = 10; // 人的视线高度 (假设单位是分米，10=1米)

    // --- 灯光 (画廊需要明亮的灯光) ---
    const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 2.5);
    light.position.set(0.5, 1, 0.75);
    scene.add(light);

    // --- 控制器 (第一人称漫游) ---
    controls = new PointerLockControls(camera, document.body);

    // 处理点击进入/ESC退出
    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');

    blocker.addEventListener('click', function () {
        controls.lock();
    });

    controls.addEventListener('lock', function () {
        instructions.style.display = 'none';
        blocker.style.display = 'none';
    });

    controls.addEventListener('unlock', function () {
        blocker.style.display = 'flex';
        instructions.style.display = '';
    });

    scene.add(controls.getObject());

    // --- 键盘按键监听 ---
    const onKeyDown = function (event) {
        switch (event.code) {
            case 'ArrowUp': case 'KeyW': moveForward = true; break;
            case 'ArrowLeft': case 'KeyA': moveLeft = true; break;
            case 'ArrowDown': case 'KeyS': moveBackward = true; break;
            case 'ArrowRight': case 'KeyD': moveRight = true; break;
        }
    };
    const onKeyUp = function (event) {
        switch (event.code) {
            case 'ArrowUp': case 'KeyW': moveForward = false; break;
            case 'ArrowLeft': case 'KeyA': moveLeft = false; break;
            case 'ArrowDown': case 'KeyS': moveBackward = false; break;
            case 'ArrowRight': case 'KeyD': moveRight = false; break;
        }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // --- 2. 搭建房间 (地板) ---
    // 地板大小：200x200单位
    const floorGeometry = new THREE.PlaneGeometry(200, 200, 10, 10);
    const floorMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc, side: THREE.DoubleSide });
    // 如果你有地板贴图，解开下面这行的注释：
    // floorMaterial.map = new THREE.TextureLoader().load('assets/images/texture-floor.jpg');
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2; // 旋转放平
    scene.add(floor);

    // --- 3. 这里的重点：开始挂画！ ---
    // 参数：图片路径, 宽度, 高度, x坐标, y坐标(高度), z坐标, 旋转角度(y轴)
    
    // 画作 1：正前方
    addPainting('assets/images/gallery/sketch-01.jpg', 10, 10, 0, 10, -50, 0);

    // 画作 2：左边墙
    addPainting('assets/images/gallery/oil-02.jpg', 15, 10, -50, 10, 0, Math.PI / 2);

    // 画作 3：右边墙
    addPainting('assets/images/ui/logo.png', 5, 5, 50, 10, 0, -Math.PI / 2);


    // --- 渲染器设置 ---
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 窗口大小改变适应
    window.addEventListener('resize', onWindowResize);
}

// --- 核心工具函数：挂画 ---
function addPainting(imageUrl, w, h, x, y, z, rotationY) {
    // 1. 加载纹理
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(imageUrl);
    texture.colorSpace = THREE.SRGBColorSpace; // 颜色校正

    // 2. 创建画框 (BoxGeometry) - 稍微有点厚度，像真正的画框
    const geometry = new THREE.BoxGeometry(w, h, 0.5); // 0.5是厚度
    
    // 3. 材质：六个面，只有正面(索引4)贴图，其他面白色
    const materials = [
        new THREE.MeshBasicMaterial({ color: 0x333333 }), // 右
        new THREE.MeshBasicMaterial({ color: 0x333333 }), // 左
        new THREE.MeshBasicMaterial({ color: 0x333333 }), // 上
        new THREE.MeshBasicMaterial({ color: 0x333333 }), // 下
        new THREE.MeshBasicMaterial({ map: texture }),    // 正面 (显示画)
        new THREE.MeshBasicMaterial({ color: 0x333333 })  // 背面
    ];

    const mesh = new THREE.Mesh(geometry, materials);

    // 4. 设置位置和旋转
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotationY;

    scene.add(mesh);
    objects.push(mesh); // 记录下来
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- 动画循环 (每一帧都在跑) ---
function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();

    if (controls.isLocked === true) {
        const delta = (time - prevTime) / 1000;

        // 减速阻尼 (松开键盘慢慢停)
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); // 保证斜着走速度一致

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta; // 400.0 是移动速度
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
    }

    prevTime = time;
    renderer.render(scene, camera);
}

