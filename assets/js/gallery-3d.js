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
    
    // === 1. 氛围修改：晨光暖阳 ===
    // 背景色：柔和的暖杏色/晨曦光
    const fogColor = 0xffeadd; 
    scene.background = new THREE.Color(fogColor); 
    // 雾气：柔和的金色雾霭，让远处融入晨光中
    scene.fog = new THREE.FogExp2(fogColor, 0.008); // 使用指数雾，过渡更自然柔和

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 9, 30); 

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    // 开启更柔和的阴影类型
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
    // 开启色调映射，让光照更真实
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2; 
    document.body.appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();

    // === 2. 灯光系统大改造 (模拟晨光) ===
    
    // A. 环境光：大幅增强，使用暖金色，照亮整个空间
    const ambientLight = new THREE.AmbientLight(0xffdcb4, 0.7); 
    scene.add(ambientLight);

    // B. 主光源：模拟太阳的平行光 (关键!)
    // 从左后方射入，营造长长的柔和影子
    const sunLight = new THREE.DirectionalLight(0xffaa77, 1.5); // 暖橙色太阳光
    sunLight.position.set(-30, 50, 50); // 太阳位置
    sunLight.castShadow = true;
    // 扩大太阳光阴影范围
    sunLight.shadow.camera.left = -100; sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100; sunLight.shadow.camera.bottom = -100;
    sunLight.shadow.camera.far = 200;
    sunLight.shadow.mapSize.width = 2048; sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.001; // 防止阴影波纹
    scene.add(sunLight);

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
        let lW = 12 + (leftImgIdx % 3) * 2; let lH = 12 + (leftImgIdx % 2) * 4;
        
        addChineseArt(leftImgPath, lW, lH, leftX, 9, zPos, Math.PI/2, 
            `作品 No.${leftArtNum}`, "Yanxu系列", `系列作品 ${leftArtNum}/50`);

        let rightArtNum = (normalizedRowIndex * 2) + 2;
        let rightImgPath = `assets/images/gallery/eg${rightImgIdx + 1}.jpg`;
        let rW = 12 + (rightImgIdx % 3) * 2; let rH = 12 + (rightImgIdx % 2) * 4;

        addChineseArt(rightImgPath, rW, rH, rightX, 9, zPos, -Math.PI/2, 
            `作品 No.${rightArtNum}`, "Yanxu系列", `系列作品 ${rightArtNum}/50`);
    }

    setupControls();
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('closeModal', () => { if(!isMobile) controls.lock(); });
    document.addEventListener('click', onMouseClick);
}

// === 建造结构 (明亮材质) ===
function buildEndlessHall() {
    // 1. 地板：暖米色亚光石材 (受光更好)
    const floorGeo = new THREE.PlaneGeometry(HALL_WIDTH, 2000);
    const floorMat = new THREE.MeshStandardMaterial({ 
        color: 0xe3d2c0, // 暖米色
        roughness: 0.6,  // 比较粗糙，柔和反光
        metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true; // 接收太阳光阴影
    scene.add(floor);

    // 2. 墙壁：暖白奶油色墙面
    const wallMat = new THREE.MeshStandardMaterial({ 
        color: 0xfff8ed, // 奶油白
        roughness: 0.9   // 哑光
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

    // 踢脚线：浅棕木色
    const skirtMat = new THREE.MeshStandardMaterial({ color: 0x8c7662, roughness:0.8 });
    const skirtGeo = new THREE.BoxGeometry(0.2, 0.8, 2000);
    const s1 = new THREE.Mesh(skirtGeo, skirtMat); s1.position.set(-HALL_WIDTH/2 + 0.1, 0.4, 0); s1.receiveShadow=true; scene.add(s1);
    const s2 = new THREE.Mesh(skirtGeo, skirtMat); s2.position.set(HALL_WIDTH/2 - 0.1, 0.4, 0); s2.receiveShadow=true; scene.add(s2);
}

function addChineseArt(url, w, h, x, y, z, ry, title, subtitle, desc) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = ry;

    // 框 (深胡桃木，对比墙面)
    const frameGeo = new THREE.BoxGeometry(w + 2, h + 2, 0.4);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x3d291e, roughness: 0.7 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.castShadow = true; // 框投射阴影
    group.add(frame);

    // 衬纸 (暖米白，雅致)
    const mountGeo = new THREE.PlaneGeometry(w + 1.6, h + 1.6);
    const mountMat = new THREE.MeshStandardMaterial({ color: 0xfdfaf5, roughness: 0.9 });
    const mount = new THREE.Mesh(mountGeo, mountMat);
    mount.position.z = 0.21;
    group.add(mount);

    // 画心
    const texture = new THREE.TextureLoader().load(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    const canvasGeo = new THREE.PlaneGeometry(w, h);
    // 使用 StandardMaterial 让画作也能受光照影响 (更真实)
    const canvasMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 });
    const canvas = new THREE.Mesh(canvasGeo, canvasMat);
    canvas.position.z = 0.22;
    
    // 绑定数据 (新增了 longDesc 占位符)
    canvas.userData = { 
        url: url, title: title, subtitle: subtitle, desc: desc,
        longDesc: "这是一段关于这幅画作的详细介绍占位符。清晨温暖的阳光穿透长廊，洒落在水墨之间，笔触的干湿浓淡在金色的光辉中更显层次。艺术家通过对传统技法的现代诠释，表达了对自然与心境的独特感悟。" 
    };
    paintings.push(canvas); 
    group.add(canvas);

    // 射灯 (辅助光，削弱强度，因为环境已经很亮了)
    const spotLight = new THREE.SpotLight(0xffe0b0, 50); // 暖光，强度大幅降低
    spotLight.position.set(0, 15, 8); 
    spotLight.target = canvas;
    spotLight.angle = Math.PI / 5;
    spotLight.penumbra = 0.6; 
    spotLight.distance = 30;
    // spotLight.castShadow = true; // 关闭射灯阴影，主要靠太阳光投射，避免双重阴影太乱
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

// === 更新弹窗数据显示逻辑 ===
function showDetailModal(data) {
    const modal = document.getElementById('detail-modal');
    document.getElementById('detail-img').src = data.url;
    document.getElementById('modal-title').innerText = data.title;
    document.getElementById('modal-subtitle').innerText = data.subtitle + " · " + data.desc;
    
    // 填充新的简介字段
    document.getElementById('modal-long-desc').innerText = data.longDesc;
    
    // 生成随机热度
    let seed = 0;
    for (let i = 0; i < data.title.length; i++) { seed += data.title.charCodeAt(i); }
    const views = (seed * 12345) % 49000 + 1000;
    
    // 只显示数字
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
