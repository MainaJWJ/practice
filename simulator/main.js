// 색상 객체: 재료의 색상 값을 일관성 있게 유지하고 쉽게 변경할 수 있도록 합니다.
var Colors = {
    red: 0xf25346,
    yellow: 0xedeb27,
    white: 0xd8d0d1,
    brown: 0x59332e,
    pink: 0xF5986E,
    brownDark: 0x23190f,
    blue: 0x68c3c0,
    green: 0x458248,
    purple: 0x551A8B,
    lightgreen: 0x629265,
};

// SCENE, CAMERA, RENDERER 및 Three.js 월드의 기타 전역 변수.
var scene, camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH, renderer, container;

// Three.js 씬, 카메라, 렌더러를 초기화합니다.
function createScene() {
    // 창의 높이와 너비를 가져와 종횡비와 렌더러 크기를 설정합니다.
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;

    // 씬 객체를 생성합니다.
    scene = new THREE.Scene();

    // 깊이감을 위해 씬에 안개를 추가합니다. 색상은 배경과 일치합니다.
    scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

    // 카메라의 속성을 설정합니다.
    aspectRatio = WIDTH / HEIGHT;
    fieldOfView = 60; // 시야각 (도).
    nearPlane = 1; // 렌더링될 카메라에 가장 가까운 객체.
    farPlane = 10000; // 렌더링될 카메라에서 가장 먼 객체.
    camera = new THREE.PerspectiveCamera(
        fieldOfView,
        aspectRatio,
        nearPlane,
        farPlane
    );
    
    // 카메라의 초기 위치를 설정합니다.
    camera.position.x = 0;
    camera.position.z = 200;
    camera.position.y = 100;

    // WebGL 렌더러를 생성합니다.
    renderer = new THREE.WebGLRenderer({
        alpha: true, // 투명한 배경을 허용합니다.
        antialias: true // 객체의 가장자리를 부드럽게 합니다 (성능 집약적일 수 있음).
    });

    // 렌더러의 크기를 창 크기와 일치하도록 설정합니다.
    renderer.setSize(WIDTH, HEIGHT);
    // 렌더러에서 그림자 매핑을 활성화합니다.
    renderer.shadowMap.enabled = true;

    // HTML에서 'world' div를 가져와 렌더러의 캔버스 요소를 추가합니다.
    container = document.getElementById('world');
    container.appendChild(renderer.domElement);

    // 창 크기 조정 이벤트를 처리하기 위한 이벤트 리스너를 추가합니다.
    window.addEventListener('resize', handleWindowResize, false);
}

// 씬의 비율을 유지하기 위해 창 크기 조정 이벤트를 처리합니다.
function handleWindowResize() {
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix(); // 카메라 속성 변경 후 호출해야 합니다.
}

// 조명
var hemisphereLight, shadowLight;

// 씬의 조명을 설정합니다.
function createLights() {
    // 반구형 조명은 위아래에서 부드러운 주변 조명을 제공합니다.
    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9)
    
    // 방향성 조명은 평행 광선을 투사하여 햇빛을 시뮬레이션합니다.
    shadowLight = new THREE.DirectionalLight(0xffffff, .9);
    shadowLight.position.set(150, 350, 350); // 조명 위치 설정.
    shadowLight.castShadow = true; // 이 조명이 그림자를 드리우도록 활성화합니다.

    // 그림자가 보이는 영역을 정의합니다.
    shadowLight.shadow.camera.left = -400;
    shadowLight.shadow.camera.right = 400;
    shadowLight.shadow.camera.top = 400;
    shadowLight.shadow.camera.bottom = -400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;

    // 그림자 맵의 해상도를 설정합니다.
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;

    // 씬에 조명을 추가합니다.
    scene.add(hemisphereLight);
    scene.add(shadowLight);
}

// 비행기 객체 정의.
var airplaneConfigs = {
    'b-747': { configPath: 'b-747/config.json' },
    'b-757': { configPath: 'b-757/config.json' },
    'cessna': { configPath: 'cessna/config.json' }
};

var AirPlane = function (modelName, callback) {
    this.mesh = new THREE.Object3D();
    var self = this; // 'this' 컨텍스트를 유지합니다.

    var configPath = airplaneConfigs[modelName].configPath;
    fetch(configPath)
        .then(response => response.json())
        .then(config => {
            self.config = config; // 나중에 사용하기 위해 config를 저장합니다.

            var mtlLoader = new THREE.MTLLoader();
            mtlLoader.setPath(modelName + '/');
            mtlLoader.load(config.model.mtl, function (materials) {
                materials.preload();
                var objLoader = new THREE.OBJLoader();
                objLoader.setMaterials(materials);
                objLoader.setPath(modelName + '/');
                objLoader.load(config.model.obj, function (object) {
                    object.traverse(function (child) {
                        if (child instanceof THREE.Mesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    object.rotation.x = config.model.rotation.x;
                    object.rotation.y = config.model.rotation.y;
                    object.rotation.z = config.model.rotation.z;
                    self.mesh.add(object);
                    if (callback) callback();
                });
            });
        });
};

// 지면 객체 정의.
Land = function (config) {
    var geom = new THREE.PlaneGeometry(20000, 20000, 1, 1);
    geom.rotateX(-Math.PI / 2); // 평면을 수평으로 회전합니다.
    var mat = new THREE.MeshPhongMaterial({
        color: parseInt(config.landColor, 16),
        shading: THREE.FlatShading,
    });
    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.receiveShadow = true; // 지면은 그림자를 받아야 합니다.
}

var worldObjectBlueprints = {};

// 월드 객체 정의 (이전에는 숲).
World = function (worldName, config) {
    this.mesh = new THREE.Object3D();
    var blueprints = worldObjectBlueprints[worldName];

    if (config.objects && blueprints) {
        config.objects.forEach(objConfig => {
            var blueprint = blueprints[objConfig.type];
            if (blueprint) {
                for (let i = 0; i < objConfig.count; i++) {
                    let obj = new blueprint();
                    obj.mesh.position.x = (Math.random() - 0.5) * 4000;
                    obj.mesh.position.y = 0;
                    obj.mesh.position.z = (Math.random() - 0.5) * 4000;

                    if (objConfig.type === 'building') {
                        const sx = 20 + Math.random() * 30;
                        const sy = 150 + Math.random() * 250;
                        const sz = 20 + Math.random() * 30;
                        obj.mesh.scale.set(sx, sy, sz);
                        obj.mesh.position.y = sy / 2;
                    } else {
                        const s = (objConfig.type === 'tree') ? (.3 + Math.random() * .75) : (.1 + Math.random() * .3);
                        obj.mesh.scale.set(s, s, s);
                    }
                    this.mesh.add(obj.mesh);
                }
            }
        });
    }
}

// 게임 객체 및 컨트롤을 위한 전역 변수.
var airplane;
var keys = {}; // 키보드 키 상태를 저장하는 객체.
var airplaneSpeed = 3; // 기본 속도는 이제 3배 빠릅니다.
var land;
var world; // forest에서 world로 변경됨
var yawAngle = 0; // 좌우 회전 각도.
var pitchAngle = 0; // 상하 회전 각도.
var kills = 0; // 격추 횟수
var hits = 0; // 맞힌 횟수

// AI 관련 전역 변수
var aiAircrafts = [];
var worldBoundary = 2000;

// 키보드 입력에 대한 이벤트 리스너.
document.addEventListener('keydown', handleKeyDown, false);
document.addEventListener('keyup', handleKeyUp, false);

// 키가 눌렸을 때 키 상태를 true로 설정합니다.
function handleKeyDown(event) {
    keys[event.key] = true;

    if (event.key === '1') {
        changeAirplane('b-747');
    }
    if (event.key === '2') {
        changeAirplane('b-757');
    }

    if (event.key === 'Control' && !isFiring) {
        startFiring();
    }
}

// 키가 놓였을 때 키 상태를 false로 설정합니다.
function handleKeyUp(event) {
    keys[event.key] = false;

    if (event.key === 'Control') {
        stopFiring();
    }
}

var bullets = [];
var fireInterval;
var isFiring = false;

function startFiring() {
    if (!airplane || !airplane.config || !airplane.config.machineGun) return;
    isFiring = true;
    fireInterval = setInterval(createBullet, airplane.config.machineGun.fireRate);
}

function stopFiring() {
    isFiring = false;
    clearInterval(fireInterval);
}

function createBullet() {
    if (!airplane || !airplane.config || !airplane.config.machineGun) return;

    var machineGunConfig = airplane.config.machineGun;
    var bulletGeometry = new THREE.ConeGeometry(machineGunConfig.bulletSize, machineGunConfig.bulletLength, 4); // 4 for sharper cone
    var bulletMaterial = new THREE.MeshBasicMaterial({ color: parseInt(machineGunConfig.bulletColor, 16) });
    var bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

    var forwardVector = new THREE.Vector3(1, 0, 0);
    forwardVector.applyQuaternion(airplane.mesh.quaternion);

    bullet.position.copy(airplane.mesh.position);
    bullet.quaternion.copy(airplane.mesh.quaternion);
    bullet.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2));

    bullet.previousPosition = bullet.position.clone(); // 이전 위치 저장

    var bulletSpeed = airplane.config.performance.speed * machineGunConfig.bulletSpeedMultiplier;
    bullet.velocity = forwardVector.multiplyScalar(bulletSpeed);

    scene.add(bullet);
    bullets.push(bullet);
}

function updateBullets() {
    for (var i = bullets.length - 1; i >= 0; i--) {
        var bullet = bullets[i];
        bullet.previousPosition.copy(bullet.position); // 현재 위치를 이전 위치로 업데이트
        bullet.position.add(bullet.velocity);

        // 총알과 AI 항공기 충돌 감지 (Raycasting)
        var hitObjects = aiAircrafts.map(a => a.hitBoxMesh).filter(m => m !== undefined);
        
        var direction = bullet.velocity.clone();
        if (direction.lengthSq() === 0) { // Check for zero vector
            // console.warn("Bullet velocity is zero, skipping raycast.");
            continue; // Skip this bullet if velocity is zero
        }
        direction.normalize(); // Normalize only if not zero

        var raycaster = new THREE.Raycaster(bullet.previousPosition, direction);
        var intersects = raycaster.intersectObjects(hitObjects);

        if (intersects.length > 0) { // 충돌 발생
            // 충돌한 객체가 어떤 AI 항공기의 것인지 찾습니다.
            var hitAiPlane = null;
            for (var k = 0; k < aiAircrafts.length; k++) {
                if (aiAircrafts[k].hitBoxMesh === intersects[0].object) {
                    hitAiPlane = aiAircrafts[k];
                    break;
                }
            }

            if (hitAiPlane) {
                scene.remove(bullet);
                bullets.splice(i, 1);

                hitAiPlane.health -= 10;
                hits++;
                document.getElementById('hit-counter').innerText = 'Hits: ' + hits;

                if (hitAiPlane.health <= 0) {
                    scene.remove(hitAiPlane.mesh);
                    scene.remove(hitAiPlane.healthBar); // 체력바 제거
                    scene.remove(hitAiPlane.hitBoxMesh); // 피격 판정 영역 메시 제거
                    // aiAircrafts 배열에서 제거
                    for (var k = 0; k < aiAircrafts.length; k++) {
                        if (aiAircrafts[k] === hitAiPlane) {
                            aiAircrafts.splice(k, 1);
                            break;
                        }
                    }
                    createAiAircraft(); // 새 AI 항공기 생성
                    kills++;
                    document.getElementById('kill-counter').innerText = 'Kills: ' + kills;
                }
            }
            // 총알 하나는 하나의 비행기만 맞출 수 있습니다.
            continue; // 다음 총알로 넘어감
        }

        // 화면 밖으로 나가면 총알 제거
        if (bullet.position.x > 10000 || bullet.position.x < -10000 ||
            bullet.position.y > 10000 || bullet.position.y < -10000 ||
            bullet.position.z > 10000 || bullet.position.z < -10000) {
            scene.remove(bullet);
            bullets.splice(i, 1);
        }
    }
}

function updateAiAircrafts() {
    var radar = document.getElementById('radar');
    // 기존 블립만 제거 (동심원과 지시선은 유지)
    var blips = radar.querySelectorAll('.blip');
    blips.forEach(function(blip) {
        blip.remove();
    });

    aiAircrafts.forEach(function(aiPlane) {
        if (!aiPlane.mesh) return;

        // AI 로직 (이전과 동일)
        if (Math.random() > 0.99) {
            aiPlane.mesh.rotation.y += (Math.random() - 0.5) * 0.5;
        }
        if (aiPlane.mesh.position.x > worldBoundary || aiPlane.mesh.position.x < -worldBoundary ||
            aiPlane.mesh.position.z > worldBoundary || aiPlane.mesh.position.z < -worldBoundary) {
            var direction = new THREE.Vector3(0, aiPlane.mesh.position.y, 0).sub(aiPlane.mesh.position).normalize();
            aiPlane.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction);
        }
        var forwardVector = new THREE.Vector3(1, 0, 0);
        forwardVector.applyQuaternion(aiPlane.mesh.quaternion);
        aiPlane.mesh.position.add(forwardVector.multiplyScalar(aiPlane.config.performance.speed));

        // 피격 판정 영역 메시 위치 업데이트
        if (aiPlane.hitBoxMesh) {
            aiPlane.hitBoxMesh.position.copy(aiPlane.mesh.position);
        }

        // 체력바 업데이트 (이전과 동일)
        if (aiPlane.healthBar) {
            aiPlane.healthBar.position.copy(aiPlane.mesh.position).add(new THREE.Vector3(0, -20, 0)); // 항공기 아래에 위치
            const distance = camera.position.distanceTo(aiPlane.mesh.position);
            const healthBarWidth = 0.5; // px, 1에서 0.5로 줄여 길이를 절반으로 조정
            const scale = (healthBarWidth / window.innerWidth) * distance * Math.tan(camera.fov * Math.PI / 360) * 2;
            aiPlane.healthBar.scale.x = (aiPlane.health / 100) * scale;
            aiPlane.healthBar.scale.y = scale / 10;
            aiPlane.healthBar.scale.z = 1;
            aiPlane.healthBar.lookAt(camera.position);
        }

        // 레이더에 적기 위치 표시
        var relativePos = aiPlane.mesh.position.clone().sub(airplane.mesh.position);

        // 내 기체의 회전(quaternion)을 사용하여 적기의 상대 위치를 변환합니다.
        // 레이더는 수평적인 관계만 표시해야 하므로, yawAngle만 사용합니다.
        var playerYawQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yawAngle);
        var inversePlayerYawQuaternion = playerYawQuaternion.inverse();
        var localPos = relativePos.clone().applyQuaternion(inversePlayerYawQuaternion);

        // 레이더 좌표로 변환 (12시 방향이 정면, X는 오른쪽, Z는 앞)
        // 레이더 크기 200px, 중앙 100px
        // 비행기 로컬 좌표계: +X 전방, +Y 상방, +Z 우측
        var radarX = 100 + (localPos.z / worldBoundary) * 100; // localPos.z는 우측/좌측 (레이더 X축)
        var radarY = 100 - (localPos.x / worldBoundary) * 100; // localPos.x는 전방/후방 (레이더 Y축, 화면 Y축은 반전)

        // 레이더 범위 내에 있을 때만 표시
        if (Math.abs(localPos.x) < worldBoundary && Math.abs(localPos.z) < worldBoundary) {
            var blip = document.createElement('div');
            blip.className = 'blip';
            blip.style.left = radarX + 'px';
            blip.style.top = radarY + 'px';
            blip.style.backgroundColor = aiPlane.config.future_expansion.radarColor; // config에서 색상 로드
            radar.appendChild(blip);
        } else { // 레이더 범위 밖에 있을 때
            // 적기의 방향을 레이더 외곽에 표시
            var angle = Math.atan2(localPos.z, localPos.x); // localPos.z는 X축, localPos.x는 Y축
            var radius = 95; // 레이더 원의 반지름 (100px - blip 크기)

            var blip = document.createElement('div');
            blip.className = 'blip';
            blip.style.width = '2px';
            blip.style.height = '2px';
            blip.style.backgroundColor = aiPlane.config.future_expansion.radarColor; // config에서 색상 로드
            blip.style.borderRadius = '50%';
            blip.style.position = 'absolute';

            // 각도를 화면 좌표에 매핑: 12시 (위)는 -Y, 3시 (오른쪽)는 +X
            blip.style.left = (100 + radius * Math.sin(angle)) + 'px';
            blip.style.top = (100 - radius * Math.cos(angle)) + 'px'; // 화면 Y축은 아래로 갈수록 증가하므로 반전
            radar.appendChild(blip);
        }
    });
}

// 비행기를 생성하고 씬에 추가합니다.
function createPlane(modelName, callback) {
    airplane = new AirPlane(modelName, function() {
        var scale = airplane.config.model.scale || 0.0125; // config에 없으면 기본값 사용
        airplane.mesh.scale.set(scale, scale, scale); 
        airplane.mesh.position.y = 100;
        scene.add(airplane.mesh);
        if (callback) callback();
    });
}

// 지면을 생성하고 씬에 추가합니다.
function createLand(config) {
    land = new Land(config);
    land.mesh.position.y = 0;
    scene.add(land.mesh);
}

// 월드를 생성하고 씬에 추가합니다.
function createWorld(worldName, config) {
    world = new World(worldName, config);
    world.mesh.position.y = 0;
    scene.add(world.mesh);
}

function createAiAircraft() {
    var modelNames = Object.keys(airplaneConfigs);
    var randomModelName = modelNames[Math.floor(Math.random() * modelNames.length)];

    var aiPlane = new AirPlane(randomModelName, function() {
        var scale = aiPlane.config.model.scale || 0.0125;
        aiPlane.mesh.scale.set(scale, scale, scale);
        aiPlane.mesh.position.x = (Math.random() - 0.5) * worldBoundary;
        aiPlane.mesh.position.y = 100 + Math.random() * 200;
        aiPlane.mesh.position.z = (Math.random() - 0.5) * worldBoundary;

        // 체력바 추가
        var healthBarGeometry = new THREE.BoxGeometry(100, 10, 10);
        var healthBarMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        var healthBar = new THREE.Mesh(healthBarGeometry, healthBarMaterial);
        aiPlane.healthBar = healthBar;
        aiPlane.health = aiPlane.config.combat.health; // config에서 체력 로드

        // AI 속도 관리: AI 속도를 플레이어 기본 속도보다 낮게 설정
        if (airplane && airplane.config) {
            aiPlane.config.performance.speed = 1 + Math.random() * (airplane.config.performance.speed - 1);
        } else {
            // 플레이어 항공기 설정이 아직 로드되지 않은 경우 (createPlane 호출 후에는 발생하지 않아야 함)
            aiPlane.config.performance.speed = 1 + Math.random() * 2; // 기본 랜덤 속도
        }

        // 피격 판정 영역 시각화 (THREE.Mesh)
        var hitBoxSize = aiPlane.config.combat.hitboxSize * 2; // config에서 피격 크기 로드
        var hitBoxGeometry = new THREE.BoxGeometry(hitBoxSize, hitBoxSize, hitBoxSize);
        var hitBoxMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.2, wireframe: true }); // 녹색, 투명, 와이어프레임
        var hitBoxMesh = new THREE.Mesh(hitBoxGeometry, hitBoxMaterial);
        aiPlane.hitBoxMesh = hitBoxMesh;
        scene.add(hitBoxMesh);

        scene.add(aiPlane.mesh);
        scene.add(healthBar); // 씬에 직접 추가
        aiAircrafts.push(aiPlane);
    });
}

function changeWorld(worldName) {
    var worldPath = 'worlds/' + worldName + '/';
    var configPath = worldPath + 'config.json';
    var scriptPath = worldPath + 'main.js';

    // 스크립트 로더
    var script = document.createElement('script');
    script.src = scriptPath;
    script.onload = function() {
        fetch(configPath)
            .then(response => response.json())
            .then(config => {
                if (land && land.mesh) {
                    scene.remove(land.mesh);
                }
                if (world && world.mesh) {
                    scene.remove(world.mesh);
                }
                scene.fog = new THREE.Fog(parseInt(config.fogColor, 16), 100, 950);
                createLand(config);
                createWorld(worldName, config);
            });
    };
    document.head.appendChild(script);
}

// 사용자 입력에 따라 비행기의 위치와 회전을 업데이트합니다.
function updatePlane() {
    if (!airplane || !airplane.config) return; // 비행기 또는 설정이 로드되지 않았으면 아무것도 하지 않습니다.

    var pitchSpeed = airplane.config.performance.turnSensitivity;
    var turnSpeed = airplane.config.performance.turnSensitivity;
    var maxPitch = 80 * Math.PI / 180; // 80도 (라디안).

    // 키보드 입력에 따라 피치 및 요 각도를 업데이트합니다.
    if (keys["ArrowDown"]) { // 아래쪽 화살표는 기수를 올립니다.
        pitchAngle = Math.min(maxPitch, pitchAngle + pitchSpeed);
    }
    if (keys["ArrowUp"]) { // 위쪽 화살표는 기수를 내립니다.
        pitchAngle = Math.max(-maxPitch, pitchAngle - pitchSpeed);
    }
    if (keys["ArrowLeft"]) { // 왼쪽 화살표는 왼쪽으로 요합니다.
        yawAngle += turnSpeed;
    }
    if (keys["ArrowRight"]) { // 오른쪽 화살표는 오른쪽으로 요합니다.
        yawAngle -= turnSpeed;
    }

    // 요 및 피치 회전을 위한 쿼터니언을 생성합니다.
    var yawQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yawAngle);
    var pitchQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), pitchAngle);

    // 회전을 결합합니다: 먼저 요를 적용한 다음 피치를 적용합니다.
    // 이렇게 하면 위/아래 피칭이 비행기의 현재 요 방향에 상대적으로 이루어집니다.
    airplane.mesh.quaternion.copy(yawQ).multiply(pitchQ);

    // 스페이스바가 눌렸는지 여부에 따라 현재 속도와 프로펠러 회전을 결정합니다.
    var currentSpeed = airplane.config.performance.speed;
    if (keys[" "]) { // 스페이스바는 키 코드 32이지만, " "가 더 읽기 쉽습니다.
        currentSpeed *= airplane.config.performance.boostMultiplier;
    }

    // 현재 방향을 따라 비행기를 앞으로 이동시킵니다.
            var forwardVector = new THREE.Vector3(1, 0, 0); // 로컬 전방 방향은 +X.
            forwardVector.applyQuaternion(airplane.mesh.quaternion); // 월드 공간으로 변환.
            airplane.mesh.position.add(forwardVector.multiplyScalar(currentSpeed));
        }

// 메인 애니메이션 루프.
function loop() {
    // 비행기 상태를 업데이트합니다.
    updatePlane();
    updateBullets();
    updateAiAircrafts();

    // 카메라가 비행기를 뒤에서 약간 위에서 따라가도록 설정합니다.
    var relativeCameraOffset = new THREE.Vector3(-800, 800, 0); // 더 먼 거리를 위해 X 조정
    var cameraOffset = relativeCameraOffset.applyMatrix4(airplane.mesh.matrixWorld);

    // 카메라를 새 오프셋 위치로 부드럽게 이동시킵니다.
    camera.position.lerp(cameraOffset, 0.1);
    camera.up.set(0, 1, 0); // 카메라의 위쪽 방향을 월드의 위쪽과 정렬합니다.
    
    // 카메라가 비행기 앞의 지점을 바라보도록 합니다.
    var lookAtTarget = new THREE.Vector3(1, 0, 0);
    lookAtTarget.applyQuaternion(airplane.mesh.quaternion);
    lookAtTarget.multiplyScalar(500);
    lookAtTarget.add(airplane.mesh.position);
    camera.lookAt(lookAtTarget);

    // 카메라 시점에서 씬을 렌더링합니다.
    renderer.render(scene, camera);
    // 다음 애니메이션 프레임을 요청합니다.
    requestAnimationFrame(loop);
}

function changeAirplane(modelName) {
    if (airplane && airplane.mesh) {
        scene.remove(airplane.mesh);
    }
    pitchAngle = 0;
    yawAngle = 0;
    createPlane(modelName, function() {
        // 비행기가 로드된 후 필요한 경우 추가 작업을 수행합니다.
    });
}

// 초기화 함수.
function init(event) {
    createScene();
    createLights();
    createRadar(); // 레이더 생성 함수 호출
    createPlane('b-747', function() {
        changeWorld('default');
        for (var i = 0; i < 10; i++) {
            createAiAircraft();
        }
        loop(); // 비행기가 로드된 후 애니메이션 루프를 시작합니다.
    });
}

// 페이지가 완전히 로드되면 애플리케이션을 시작합니다.
window.addEventListener('load', init, false);

function createRadar() {
    var radar = document.getElementById('radar');
    // 동심원 생성
    for (var i = 0; i < 5; i++) {
        var circle = document.createElement('div');
        circle.className = 'concentric-circle';
        radar.appendChild(circle);
    }
}