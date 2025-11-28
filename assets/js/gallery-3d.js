import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let camera, scene, renderer, controls;
let raycaster;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const paintings = [];

// === 参数 ===
const IMG_COUNT = 12; 
const TOTAL_PAINTINGS = 50; 
const SPACING = 25; 
const ROWS_PER_LOOP = Math.ceil(TOTAL_PAINTINGS / 2); 
const LOOP_DISTANCE = ROWS_PER_LOOP * SPACING; 
const HALL_WIDTH = 50; 
const HALL_HEIGHT = 20; 

let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let touchStartX = 0; let touchStartY = 0;

init();
animate();

function init() {
    scene = new THREE.Scene();
    
    // === 1. 暗色模式修改点 ===
    // 使用极深的灰黑色背景，护眼且高级
    const fogColor = 0x050505; 
    scene.background = new THREE.Color(fogColor); 
    // 雾气让远处的黑暗更加深邃
    scene.fog = new THREE.Fog(fogColor, 20, 150); 

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 9, 30); 

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();

    // === 2. 灯光修改点 (明暗对比) ===
    // 环境光调暗，不再是亮堂堂的
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.15); 
    scene.add(ambientLight);

    buildEndlessHall();

    // === 挂画循环逻辑 (保持不变) ===
    const leftX = -HALL_WIDTH/2 + 0.5;
    const rightX = HALL_WIDTH/2 - 0.5;
    const BUFFER_ROWS = 8; 

    for (let i = -BUFFER_ROWS; i < ROWS_PER_LOOP + BUFFER_ROWS; i++) {
        let normalizedRowIndex = (i % ROWS_PER_LOOP + ROWS_PER_LOOP) % ROWS_PER_LOOP;
        let leftImgIdx = (normalizedRowIndex * 2) % IMG_COUNT; 
        let rightImgIdx = (normalizedRowIndex * 2 + 1) % IMG_COUNT;
        const zPos = -i * SPACING;

        let leftArtNum = (normalizedRowIndex * 2) + 1; 
        let leftImgPath = `assets/images/gallery/eg${leftImgIdx + 1}.jpg`;
        let lW = 12 + (leftImgIdx % 3) * 2; 
        let lH = 12 + (leftImgIdx % 2) * 4;
        
        addChineseArt(leftImgPath, lW, lH, leftX, 9, zPos, Math.PI/2, 
            `作品 No.${leftArtNum}`, "Yanxu", `系列作品 ${leftArtNum}/50`);

        let rightArtNum = (normalizedRowIndex * 2) + 2;
        let rightImgPath = `assets/images/gallery/eg${rightImgIdx + 1}.jpg`;
        let rW = 12 + (rightImgIdx % 3) * 2;
        let rH = 12 + (rightImgIdx % 2) * 4;

        addChineseArt(rightImgPath, rW, rH, rightX, 9, zPos, -Math.PI/2, 
            `作品 No.${rightArtNum}`, "Yanxu", `系列作品 ${rightArtNum}/50`);
    }

    setupControls();
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('closeModal', () => { if(!isMobile) controls.lock(); });
    document.addEventListener('click', onMouseClick);
}

// === 建造结构 (暗黑材质) ===
function buildEndlessHall() {
    // 1. 地板：深色反光地面 (像黑色大理石)
    const floorGeo = new THREE.PlaneGeometry(HALL_WIDTH, 2000);
    const floorMat = new THREE.MeshStandardMaterial({ 
        color: 0x111111, // 接近黑色
        roughness: 0.2,  // 比较光滑，有倒影
        metalness: 0.4   // 稍微有点金属感
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // 2. 墙壁：深灰色哑光墙
    const wallMat = new THREE.MeshStandardMaterial({ 
        color: 0x222222, // 深灰
        roughness: 0.9   // 粗糙，不反光，吸光
    });
    const wallGeo = new THREE.PlaneGeometry(2000, HALL_HEIGHT);
    
    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-HALL_WIDTH/2, HALL_HEIGHT/2, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.position.set(HALL_WIDTH/2, HALL_HEIGHT/2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // 踢脚线
    const skirtMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const skirtGeo = new THREE.BoxGeometry(0.2, 0.8, 2000);
    const s1 = new THREE.Mesh(skirtGeo, skirtMat); s1.position.set(-HALL_WIDTH/2 + 0.1, 0.4, 0); scene.add(s1);
    const s2 = new THREE.Mesh(skirtGeo, skirtMat); s2.position.set(HALL_WIDTH/2 - 0.1, 0.4, 0); scene.add(s2);
}

function addChineseArt(url, w, h, x, y, z, ry, title, author, desc) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = ry;

    // 框 (深黑胡桃)
    const frameGeo = new THREE.BoxGeometry(w + 2, h + 2, 0.4);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1a120b, roughness: 0.5 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.castShadow = true;
    group.add(frame);

    // 衬纸 (深米灰色，不要太亮，太亮会刺眼)
    const mountGeo = new THREE.PlaneGeometry(w + 1.6, h + 1.6);
    const mountMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.9 });
    const mount = new THREE.Mesh(mountGeo, mountMat);
    mount.position.z = 0.21;
    group.add(mount);

    // 画心
    const texture = new THREE.TextureLoader().load(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    const canvasGeo = new THREE.PlaneGeometry(w, h);
    const canvasMat = new THREE.MeshBasicMaterial({ map: texture });
    const canvas = new THREE.Mesh(canvasGeo, canvasMat);
    canvas.position.z = 0.22;
    
    // 绑定数据
    canvas.userData = { url: url, title: title, date: author, desc: desc };
    paintings.push(canvas); 
    group.add(canvas);

    // 射灯 (暖光，聚焦画作)
    const spotLight = new THREE.SpotLight(0xfff0e0, 200); // 强度增加到200，因为环境黑
    spotLight.position.set(0, 15, 8); 
    spotLight.target = canvas;
    spotLight.angle = Math.PI / 6;
    spotLight.penumbra = 0.4; // 边缘柔和
    spotLight.distance = 35;
    spotLight.castShadow = true;
    group.add(spotLight);
    group.add(spotLight.target);

    scene.add(group);
}

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

// === 核心修改：显示详情 + 生成随机热度 ===
function showDetailModal(data) {
    const modal = document.getElementById('detail-modal');
    document.getElementById('detail-img').src = data.url;
    document.getElementById('modal-title').innerText = data.title;
    document.getElementById('modal-desc').innerText = data.date + " · " + data.desc;
    
    // 生成“假”的浏览数
    // 算法：根据标题的字符代码求和，确保同一幅画每次打开数字一样
    let seed = 0;
    for (let i = 0; i < data.title.length; i++) {
        seed += data.title.charCodeAt(i);
    }
    // 算出 1000 - 50000 之间的数字
    const views = (seed * 12345) % 49000 + 1000;
    
    // 加上逗号 (1,234)
    document.getElementById('view-count').innerText = views.toLocaleString();

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
            controls.moveRight(-velocity.x * delta);
            controls.moveForward(-velocity.z * delta);
        } else {
            const dir = new THREE.Vector3(); camera.getWorldDirection(dir); dir.y = 0; dir.normalize();
            if(moveForward) camera.position.addScaledVector(dir, speed * delta * 0.15);
            if(moveBackward) camera.position.addScaledVector(dir, -speed * delta * 0.15);
        }

        if (camera.position.z < -LOOP_DISTANCE) camera.position.z += LOOP_DISTANCE;
        else if (camera.position.z > 0) camera.position.z -= LOOP_DISTANCE;
    }
    prevTime = time;
    renderer.render(scene, camera);
}
