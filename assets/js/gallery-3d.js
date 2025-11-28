import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let camera, scene, renderer, controls;
let raycaster;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const paintings = [];

// === 展厅参数 (天心阁风格：宽敞、高挑) ===
const HALL_WIDTH = 50; 
const HALL_HEIGHT = 20; 
const HALL_LENGTH = 180; 

// 手机端变量
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let touchStartX = 0; let touchStartY = 0;

init();
animate();

function init() {
    // === 1. 场景氛围：中式静美 ===
    scene = new THREE.Scene();
    // 纯白略灰的背景，配合雾气，营造无限延伸的留白感
    const fogColor = 0xfcfcfc; 
    scene.background = new THREE.Color(fogColor); 
    scene.fog = new THREE.Fog(fogColor, 20, 120); 

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 9, 60); // 入口位置

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 柔和阴影
    document.body.appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();

    // === 2. 灯光系统 (博物馆级照明) ===
    
    // 环境光：柔和均匀，照亮墙壁
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); 
    scene.add(ambientLight);

    // 建造建筑结构
    buildPavilion();

    // === 3. 挂画 (使用真实数据) ===
    // 展位布局：左右两排，使用中式装裱
    
    // 左墙作品 (Z轴递减)
    const leftX = -HALL_WIDTH/2 + 0.5;
    
    // 注意：这里直接使用了你提供的 curl 里的图片链接
    // 01 盼归
    addChineseArt('https://cdn.vxexpo.com/58d5bc94b9dc12f9341ea979c4a862ce1b98a83a/306/4482/textures/fa74d9e1d23597b982ece46cb45bd67a.jpeg?x-oss-process=image/resize,w_512/format,webp', 
        14, 18, leftX, 9, 30, Math.PI/2, "盼归", "2019年", "143x102cm");

    // 02 东非酋长
    addChineseArt('https://cdn.vxexpo.com/58d5bc94b9dc12f9341ea979c4a862ce1b98a83a/306/4482/textures/f4bd3cb05ac2e423bad8822f15716a3c.jpeg?x-oss-process=image/resize,w_512/format,webp', 
        12, 12, leftX, 9, 0, Math.PI/2, "东非酋长", "2020年", "112x96cm");

    // 03 亚丁湾水手
    addChineseArt('https://cdn.vxexpo.com/58d5bc94b9dc12f9341ea979c4a862ce1b98a83a/306/4482/textures/1c3b49b8ccc5f5aca4b7ce031b7bf3d8.jpeg?x-oss-process=image/resize,w_512/format,webp', 
        14, 18, leftX, 9, -30, Math.PI/2, "亚丁湾水手", "2019年", "143x102cm");

    // 04 舞韵系列
    addChineseArt('https://cdn.vxexpo.com/58d5bc94b9dc12f9341ea979c4a862ce1b98a83a/306/4482/textures/14d8e72f8720f9211f2cb715389b2d78.jpg?x-oss-process=image/resize,w_512/format,webp', 
        16, 10, leftX, 9, -60, Math.PI/2, "舞韵系列", "2022年", "122x70cm");


    // 右墙作品
    const rightX = HALL_WIDTH/2 - 0.5;

    // 05 远山 (横幅)
    addChineseArt('https://cdn.vxexpo.com/58d5bc94b9dc12f9341ea979c4a862ce1b98a83a/306/4482/textures/69b9d3d3b9f501ace6a16307ce49bb0b.jpeg?x-oss-process=image/resize,w_512/format,webp', 
        20, 13, rightX, 9, 30, -Math.PI/2, "远山", "2020年", "219x145cm");

    // 06 醉八仙 (长卷)
    addChineseArt('https://cdn.vxexpo.com/58d5bc94b9dc12f9341ea979c4a862ce1b98a83a/306/4482/textures/38b896ff0562bdab2e2c50a5266e635d.jpg?x-oss-process=image/resize,w_512/format,webp', 
        24, 9, rightX, 9, 0, -Math.PI/2, "醉八仙", "1987年", "600x200cm");

    // 07 阿玛
    addChineseArt('https://cdn.vxexpo.com/58d5bc94b9dc12f9341ea979c4a862ce1b98a83a/306/4482/textures/148c1456b75a37e0743b4a2d8fb1017a.jpeg?x-oss-process=image/resize,w_512/format,webp', 
        12, 15, rightX, 9, -30, -Math.PI/2, "阿玛", "2017年", "121x94cm");

    // 08 丹麦老人
    addChineseArt('https://cdn.vxexpo.com/58d5bc94b9dc12f9341ea979c4a862ce1b98a83a/306/4482/textures/219e8eb25c1396b4de7b0693daff3f59.jpeg?x-oss-process=image/resize,w_512/format,webp', 
        12, 15, rightX, 9, -60, -Math.PI/2, "丹麦老人", "2017年", "126x100cm");

    // 尽头巨幅作品：黄河母亲河
    addChineseArt('https://cdn.vxexpo.com/58d5bc94b9dc12f9341ea979c4a862ce1b98a83a/306/4482/textures/baf8494b4bc540eb16b709ba21098f94.jpeg?x-oss-process=image/resize,w_1024/format,webp', 
        30, 8, 0, 9, -HALL_LENGTH/2 + 2, 0, "黄河·母亲河", "2013年", "1800x372cm | 陈列于人民大会堂");


    setupControls();
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('closeModal', () => { if(!isMobile) controls.lock(); });
    document.addEventListener('click', onMouseClick);
}

// === 建造展厅 (天心阁风格) ===
function buildPavilion() {
    // 1. 地板：深灰色哑光石材 (模拟地砖)
    const floorGeo = new THREE.PlaneGeometry(HALL_WIDTH, HALL_LENGTH);
    const floorMat = new THREE.MeshStandardMaterial({ 
        color: 0x333333, // 深灰
        roughness: 0.8,  // 粗糙，不反光，符合中式内敛
        metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // 2. 墙壁：纯白/米白 (留白艺术)
    const wallMat = new THREE.MeshStandardMaterial({ 
        color: 0xffffff, 
        roughness: 0.9 // 哑光白墙
    });
    
    // 墙体辅助函数
    const createWall = (w, h, x, y, z, ry) => {
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
        mesh.position.set(x, y, z);
        mesh.rotation.y = ry;
        mesh.receiveShadow = true;
        scene.add(mesh);
    };

    // 左墙、右墙、前墙、后墙
    createWall(HALL_LENGTH, HALL_HEIGHT, -HALL_WIDTH/2, HALL_HEIGHT/2, 0, Math.PI/2);
    createWall(HALL_LENGTH, HALL_HEIGHT, HALL_WIDTH/2, HALL_HEIGHT/2, 0, -Math.PI/2);
    createWall(HALL_WIDTH, HALL_HEIGHT, 0, HALL_HEIGHT/2, -HALL_LENGTH/2, 0);
    createWall(HALL_WIDTH, HALL_HEIGHT, 0, HALL_HEIGHT/2, HALL_LENGTH/2, Math.PI);

    // 3. 踢脚线 (细节)：深色，连接墙地
    const skirtMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const skirtGeoLR = new THREE.BoxGeometry(0.2, 0.8, HALL_LENGTH);
    const leftSkirt = new THREE.Mesh(skirtGeoLR, skirtMat);
    leftSkirt.position.set(-HALL_WIDTH/2 + 0.1, 0.4, 0);
    scene.add(leftSkirt);
    
    const rightSkirt = new THREE.Mesh(skirtGeoLR, skirtMat);
    rightSkirt.position.set(HALL_WIDTH/2 - 0.1, 0.4, 0);
    scene.add(rightSkirt);
}

// === 核心：中式装裱挂画系统 ===
function addChineseArt(url, w, h, x, y, z, ry, title, year, size) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = ry;

    // 1. 外框 (深色红木/黑胡桃)
    const frameWidth = 0.4; // 框条宽度
    const frameDepth = 0.4; // 框厚度
    // 实际上我们需要创建一个比画大一圈的盒子作为框
    // 装裱留白：假设每边留白 1.5 单位 (绫罗衬纸)
    const margin = 1.5; 
    const totalW = w + margin * 2;
    const totalH = h + margin * 2;

    const frameGeo = new THREE.BoxGeometry(totalW + frameWidth, totalH + frameWidth, frameDepth);
    const frameMat = new THREE.MeshStandardMaterial({ 
        color: 0x3d291e, // 深红木色
        roughness: 0.6,
        metalness: 0.1 
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.castShadow = true;
    group.add(frame);

    // 2. 衬纸 (绫罗/卡纸) - 米白色
    const mountGeo = new THREE.PlaneGeometry(totalW, totalH);
    const mountMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.9 });
    const mount = new THREE.Mesh(mountGeo, mountMat);
    mount.position.z = frameDepth/2 + 0.01;
    group.add(mount);

    // 3. 画心 (图片)
    const texture = new THREE.TextureLoader().load(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    const canvasGeo = new THREE.PlaneGeometry(w, h);
    const canvasMat = new THREE.MeshBasicMaterial({ map: texture });
    const canvas = new THREE.Mesh(canvasGeo, canvasMat);
    canvas.position.z = frameDepth/2 + 0.02; // 比衬纸再突出一丁点
    
    // 绑定数据用于点击
    canvas.userData = { url: url, title: title, date: year, desc: size };
    paintings.push(canvas); 
    group.add(canvas);

    // 4. 铭牌 (极简风)
    // 不用金牌，用墙面贴字或极简黑字白牌
    const labelGeo = new THREE.PlaneGeometry(3, 1.2);
    const labelTexture = createMinimalLabel(title, year);
    const labelMat = new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true });
    const label = new THREE.Mesh(labelGeo, labelMat);
    label.position.set(0, -totalH/2 - 2, 0.1); 
    group.add(label);

    // 5. 射灯 (博物馆重点照明)
    // 照亮画作，产生光斑
    const spotLight = new THREE.SpotLight(0xfff5e1, 150); // 暖光
    spotLight.position.set(0, 15, 10); // 画上方
    spotLight.target = canvas;
    spotLight.angle = Math.PI / 5;
    spotLight.penumbra = 0.5; // 边缘柔化
    spotLight.distance = 40;
    spotLight.castShadow = true;
    
    group.add(spotLight);
    group.add(spotLight.target);

    scene.add(group);
}

// 辅助：生成极简铭牌
function createMinimalLabel(title, year) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // 透明背景，或者半透明白底
    ctx.fillStyle = 'rgba(255, 255, 255, 0.0)'; 
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    
    // 标题
    ctx.font = 'bold 60px "Songti SC", serif';
    ctx.fillText(title, 256, 100);
    
    // 年份
    ctx.font = '40px sans-serif';
    ctx.fillStyle = '#666666';
    ctx.fillText(year, 256, 180);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
}

// === 交互逻辑 (保持不变，优化点击) ===
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

// === 控制器 (复用之前优化过的逻辑) ===
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
    }
    prevTime = time;
    renderer.render(scene, camera);
}
