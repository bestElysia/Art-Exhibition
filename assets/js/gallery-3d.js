import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let camera, scene, renderer, controls;
let raycaster;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const paintings = [];

// === 展厅参数 (加长走廊以展示更多重复画作) ===
const HALL_WIDTH = 50; 
const HALL_HEIGHT = 20; 
const HALL_LENGTH = 220; // 加长到 220

// 手机端变量
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let touchStartX = 0; let touchStartY = 0;

init();
animate();

function init() {
    // === 1. 场景氛围：中式静美 ===
    scene = new THREE.Scene();
    const fogColor = 0xfcfcfc; 
    scene.background = new THREE.Color(fogColor); 
    // 调整雾气范围，适应更长的走廊
    scene.fog = new THREE.Fog(fogColor, 20, 160); 

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    // 初始位置往后挪一点，留出入口空间
    camera.position.set(0, 9, 80); 

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();

    // === 2. 灯光系统 ===
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); 
    scene.add(ambientLight);

    buildPavilion();

    // === 3. 挂画 (本地图片循环使用) ===
    
    // 定义本地图片数组 (eg1.jpg ~ eg12.jpg)
    const localImages = Array.from({length: 12}, (_, i) => `assets/images/gallery/eg${i + 1}.jpg`);

    // 获取图片的辅助函数（实现循环：如果索引超过11，就回到0）
    const getImg = (index) => localImages[index % localImages.length];

    // 定义几种不同的画作尺寸和信息配置，用于循环，避免太单调
    const artConfigs = [
        { w: 14, h: 18, title: "系列作品·壹", size: "140x180cm" },
        { w: 12, h: 12, title: "系列作品·贰", size: "120x120cm" },
        { w: 18, h: 12, title: "横幅创作·叁", size: "180x120cm" },
        { w: 10, h: 16, title: "立轴条幅·肆", size: "100x160cm" }
    ];
    const getCfg = (index) => artConfigs[index % artConfigs.length];

    // 墙壁坐标
    const leftX = -HALL_WIDTH/2 + 0.5;
    const rightX = HALL_WIDTH/2 - 0.5;
    
    // 起始 Z 坐标和间距
    let currentZ = 60;
    const spacing = 25; 

    // 总共放置 16 幅画在两侧墙壁 (展示 12 张图的循环)
    for (let i = 0; i < 16; i++) {
        const imgPath = getImg(i); // 获取图片路径 (循环)
        const cfg = getCfg(i);     // 获取尺寸配置 (循环)
        const yearStr = (2020 + (i % 5)) + "年"; // 简单生成个年份

        if (i % 2 === 0) {
            // 偶数挂左墙
            addChineseArt(imgPath, cfg.w, cfg.h, leftX, 9, currentZ, Math.PI/2, cfg.title, yearStr, cfg.size);
        } else {
            // 奇数挂右墙，并后移 Z 坐标
            addChineseArt(imgPath, cfg.w, cfg.h, rightX, 9, currentZ, -Math.PI/2, cfg.title, yearStr, cfg.size);
            currentZ -= spacing; // 每挂完一对，向后移动
        }
    }

    // 尽头巨幅作品 (使用 eg12 作为压轴，或者你可以指定任何一张)
    addChineseArt('assets/images/gallery/eg12.jpg', 
        30, 8, 0, 9, -HALL_LENGTH/2 + 2, 0, "特展巨作", "2024年", "300x80cm | 走廊尽头");


    setupControls();
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('closeModal', () => { if(!isMobile) controls.lock(); });
    document.addEventListener('click', onMouseClick);
}

// === 建造展厅 (保持不变) ===
function buildPavilion() {
    const floorGeo = new THREE.PlaneGeometry(HALL_WIDTH, HALL_LENGTH);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8, metalness: 0.1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    const createWall = (w, h, x, y, z, ry) => {
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
        mesh.position.set(x, y, z);
        mesh.rotation.y = ry;
        mesh.receiveShadow = true;
        scene.add(mesh);
    };

    createWall(HALL_LENGTH, HALL_HEIGHT, -HALL_WIDTH/2, HALL_HEIGHT/2, 0, Math.PI/2);
    createWall(HALL_LENGTH, HALL_HEIGHT, HALL_WIDTH/2, HALL_HEIGHT/2, 0, -Math.PI/2);
    createWall(HALL_WIDTH, HALL_HEIGHT, 0, HALL_HEIGHT/2, -HALL_LENGTH/2, 0);
    createWall(HALL_WIDTH, HALL_HEIGHT, 0, HALL_HEIGHT/2, HALL_LENGTH/2, Math.PI);

    const skirtMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const skirtGeoLR = new THREE.BoxGeometry(0.2, 0.8, HALL_LENGTH);
    const leftSkirt = new THREE.Mesh(skirtGeoLR, skirtMat);
    leftSkirt.position.set(-HALL_WIDTH/2 + 0.1, 0.4, 0);
    scene.add(leftSkirt);
    const rightSkirt = new THREE.Mesh(skirtGeoLR, skirtMat);
    rightSkirt.position.set(HALL_WIDTH/2 - 0.1, 0.4, 0);
    scene.add(rightSkirt);
}

// === 中式装裱挂画系统 (保持不变) ===
function addChineseArt(url, w, h, x, y, z, ry, title, year, size) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = ry;

    const frameWidth = 0.4; const frameDepth = 0.4; const margin = 1.5; 
    const totalW = w + margin * 2; const totalH = h + margin * 2;

    const frameGeo = new THREE.BoxGeometry(totalW + frameWidth, totalH + frameWidth, frameDepth);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x3d291e, roughness: 0.6, metalness: 0.1 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.castShadow = true;
    group.add(frame);

    const mountGeo = new THREE.PlaneGeometry(totalW, totalH);
    const mountMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.9 });
    const mount = new THREE.Mesh(mountGeo, mountMat);
    mount.position.z = frameDepth/2 + 0.01;
    group.add(mount);

    const texture = new THREE.TextureLoader().load(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    const canvasGeo = new THREE.PlaneGeometry(w, h);
    const canvasMat = new THREE.MeshBasicMaterial({ map: texture });
    const canvas = new THREE.Mesh(canvasGeo, canvasMat);
    canvas.position.z = frameDepth/2 + 0.02; 
    
    canvas.userData = { url: url, title: title, date: year, desc: size };
    paintings.push(canvas); 
    group.add(canvas);

    const labelGeo = new THREE.PlaneGeometry(3, 1.2);
    const labelTexture = createMinimalLabel(title, year);
    const labelMat = new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true });
    const label = new THREE.Mesh(labelGeo, labelMat);
    label.position.set(0, -totalH/2 - 2, 0.1); 
    group.add(label);

    const spotLight = new THREE.SpotLight(0xfff5e1, 150); 
    spotLight.position.set(0, 15, 10); 
    spotLight.target = canvas;
    spotLight.angle = Math.PI / 5;
    spotLight.penumbra = 0.5; 
    spotLight.distance = 40;
    spotLight.castShadow = true;
    group.add(spotLight);
    group.add(spotLight.target);

    scene.add(group);
}

function createMinimalLabel(title, year) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(255, 255, 255, 0.0)'; 
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#333333'; ctx.textAlign = 'center';
    ctx.font = 'bold 60px "Songti SC", serif';
    ctx.fillText(title, 256, 100);
    ctx.font = '40px sans-serif'; ctx.fillStyle = '#666666';
    ctx.fillText(year, 256, 180);
    return new THREE.CanvasTexture(canvas);
}

// === 交互与控制器 (保持不变) ===
function onMouseClick(event) {
    if (controls.isLocked || isMobile) {
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const intersects = raycaster.intersectObjects(paintings);
        if (intersects.length > 0) {
            const data = intersects[0].object.userData;
            showDetailModal(data);
            if(!isMobile) controls.unlock();
        }
    }
}

function showDetailModal(data) {
    const modal = document.getElementById('detail-modal');
    document.getElementById('detail-img').src = data.url;
    document.getElementById('modal-title').innerText = data.title;
    document.getElementById('modal-desc').innerText = data.date + " · " + data.desc;
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}

function setupControls() {
    const blocker = document.getElementById('blocker');
    if (!isMobile) {
        controls = new PointerLockControls(camera, document.body);
        blocker.addEventListener('click', () => controls.lock());
        controls.addEventListener('lock', () => { blocker.style.opacity=0; setTimeout(()=>blocker.style.display='none',600); });
        controls.addEventListener('unlock', () => { 
            if(document.getElementById('detail-modal').style.display !== 'flex') {
                blocker.style.display='flex'; setTimeout(()=>blocker.style.opacity=1,10);
            }
        });
        scene.add(controls.getObject());
        const onKey = (e, isDown) => {
            switch(e.code){ case 'KeyW':moveForward=isDown;break; case 'KeyA':moveLeft=isDown;break; case 'KeyS':moveBackward=isDown;break; case 'KeyD':moveRight=isDown;break; }
        };
        document.addEventListener('keydown', (e)=>onKey(e,true));
        document.addEventListener('keyup', (e)=>onKey(e,false));
    } else {
        blocker.addEventListener('click', () => { blocker.style.opacity=0; setTimeout(()=>blocker.style.display='none',600); });
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].pageX; touchStartY = e.touches[0].pageY;
            if(e.touches[0].pageY < window.innerHeight/2) moveForward = true; else moveBackward = true;
        }, {passive:false});
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const deltaX = (e.touches[0].pageX - touchStartX) * 0.005;
            camera.rotation.y -= deltaX;
            touchStartX = e.touches[0].pageX;
        }, {passive:false});
        document.addEventListener('touchend', () => { moveForward=false; moveBackward=false; });
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    const delta = Math.min((time - prevTime) / 1000, 0.1); 

    if (controls?.isLocked || (isMobile && document.getElementById('detail-modal').style.display !== 'flex')) {
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();
        const speed = 250.0;
        if (moveForward || moveBackward) velocity.z -= direction.z * speed * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * speed * delta;
        if (!isMobile) {
            controls.moveRight(-velocity.x * delta); controls.moveForward(-velocity.z * delta);
        } else {
            const dir = new THREE.Vector3(); camera.getWorldDirection(dir); dir.y = 0; dir.normalize();
            if(moveForward) camera.position.addScaledVector(dir, speed * delta * 0.15);
            if(moveBackward) camera.position.addScaledVector(dir, -speed * delta * 0.15);
        }
    }
    prevTime = time;
    renderer.render(scene, camera);
}
