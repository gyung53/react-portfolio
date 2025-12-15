import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'; 
import { LPObject } from '../types';

interface ThreeControllerProps {
  onLPSelect: (id: number) => void;
  selectedId: number | null;
}

// 각 요소의 원래 위치/회전/크기를 저장하는 인터페이스
interface InitialState {
    pos: THREE.Vector3;
    quat: THREE.Quaternion;
    scale: THREE.Vector3;
}

const ThreeController: React.FC<ThreeControllerProps> = ({ onLPSelect, selectedId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  
  // Data Refs
  const lpObjectsRef = useRef<LPObject[]>([]);
  
  // 초기 상태 저장소 (복귀용)
  const initialStatesRef = useRef<Map<THREE.Object3D, InitialState>>(new Map());
  
  const isTransitioningRef = useRef(false);
  const animationFrameRef = useRef<number>(0);

  // 1. 초기화
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    
    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera: 더 가깝게 설정하여 모델이 크게 보이도록 함 (Zoom In)
    const camera = new THREE.PerspectiveCamera(45, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    camera.position.set(3.5, 2.0, 4.5); 
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace; 
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.7);
    fillLight.position.set(-5, 2, -5);
    scene.add(fillLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 2;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI / 2 - 0.1; 
    controlsRef.current = controls;

    // Load Model
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      '/LP.glb', 
      (gltf) => {
        console.log("✅ 모델 로딩 성공");
        const model = gltf.scene;

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // 양면 렌더링 설정
            const mesh = child as THREE.Mesh;
            if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(m => m.side = THREE.DoubleSide);
                } else {
                    mesh.material.side = THREE.DoubleSide;
                }
            }
          }
        });

        processModel(model, scene);
      },
      undefined,
      (error) => console.warn("⚠️ 로딩 실패:", error)
    );

    // Events
    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onClick = () => {
      if (isTransitioningRef.current || selectedId !== null || !sceneRef.current) return; 
      
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current!);
      const intersects = raycasterRef.current.intersectObjects(sceneRef.current.children, true);

      if (intersects.length > 0) {
        let target: THREE.Object3D | null = intersects[0].object;
        // 부모를 타고 올라가며 등록된 LP인지 확인
        while (target) {
            const foundLP = lpObjectsRef.current.find(lp => lp.mesh === target);
            if (foundLP) {
                onLPSelect(foundLP.id);
                return;
            }
            target = target.parent;
        }
      }
    };

    const onResize = () => {
        if(!cameraRef.current || !rendererRef.current) return;
        cameraRef.current.aspect = container.offsetWidth / container.offsetHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(container.offsetWidth, container.offsetHeight);
    };

    window.addEventListener('mousemove', onMouseMove);
    container.addEventListener('click', onClick);
    window.addEventListener('resize', onResize);

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationFrameRef.current);
      if(container) container.innerHTML = '';
    };
  }, []);

  // 선택 상태 감지
  useEffect(() => {
    if (selectedId !== null) {
      const lpData = lpObjectsRef.current.find(lp => lp.id === selectedId);
      if (lpData) animateSelection(lpData);
    } else {
      animateClose();
    }
  }, [selectedId]);


  const processModel = (model: THREE.Object3D, scene: THREE.Scene) => {
    const foundLPs: Record<number, THREE.Object3D> = {};
    const foundVinyls: Record<number, THREE.Object3D> = {};

    const vinylRegex = /^Vinyl[_\s-]*0?(\d+)/i;    
    const coverRegex = /^LP[_\s-]*Cover[_\s-]*0?(\d+)/i; 

    // 1. 모델 전체를 순회하며 LP와 Vinyl 객체 식별 (깊이 상관없이)
    model.traverse((child) => {
      const name = child.name;
      const vMatch = name.match(vinylRegex);
      const cMatch = name.match(coverRegex);

      if (vMatch) {
         foundVinyls[parseInt(vMatch[1])] = child;
      } else if (cMatch) {
         foundLPs[parseInt(cMatch[1])] = child;
      }
    });

    const attachAndSave = (obj: THREE.Object3D) => {
        scene.attach(obj); // Scene 루트로 이동 (계층 구조 평탄화)
        initialStatesRef.current.set(obj, {
            pos: obj.position.clone(),
            quat: obj.quaternion.clone(),
            scale: obj.scale.clone()
        });
    };

    // 2. LP/Vinyl을 Scene에 Attach (부모에서 분리)
    Object.values(foundLPs).forEach(obj => attachAndSave(obj));
    Object.values(foundVinyls).forEach(obj => attachAndSave(obj));

    // 3. 남은 요소들(선반 등)을 Scene에 추가하고 초기 상태 저장
    // LP/Vinyl이 빠져나간 model 껍데기와 그 안의 나머지 요소들(Shelf 등)
    scene.add(model);
    initialStatesRef.current.set(model, {
        pos: model.position.clone(),
        quat: model.quaternion.clone(),
        scale: model.scale.clone()
    });

    // 4. 데이터 구조 생성
    Object.keys(foundLPs).forEach(key => {
        const id = Number(key);
        const coverObj = foundLPs[id];
        const vinylObj = foundVinyls[id] || null;

        lpObjectsRef.current.push({
            id,
            mesh: coverObj as THREE.Mesh,
            vinyl: vinylObj,
            originalPosition: coverObj.position.clone(),
            originalRotation: coverObj.quaternion.clone(),
            originalScale: coverObj.scale.clone(),
            vinylOriginalPosition: null, vinylOriginalRotation: null, vinylOriginalScale: null
        });
    });

    console.log(`✅ 구조 처리 완료. LP: ${lpObjectsRef.current.length}개`);
  };

  const animateSelection = (targetLP: LPObject) => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    if(controlsRef.current) controlsRef.current.enabled = false;

    const duration = 1200;
    const startTime = Date.now();

    // [수정] 정면을 바라보도록 설정 (기존 90도 회전 제거)
    const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
    
    // [수정] 간격 조정 (화면 중앙에 가깝게)
    const targetPos = new THREE.Vector3(-0.85, 0, 0); 
    const vinylTargetPos = new THREE.Vector3(0.85, 0, 0); 

    // [수정] 카메라 줌인 (가까이서 크게 보기)
    const cameraStartPos = cameraRef.current!.position.clone();
    const cameraTargetPos = new THREE.Vector3(0, 0, 4.0); 

    const controlsStartTarget = controlsRef.current!.target.clone();
    const controlsTarget = new THREE.Vector3(0, 0, 0); 

    const startState = {
        lpPos: targetLP.mesh.position.clone(),
        lpQuat: targetLP.mesh.quaternion.clone(),
        lpScale: targetLP.mesh.scale.clone(),
        vPos: targetLP.vinyl?.position.clone(),
        vQuat: targetLP.vinyl?.quaternion.clone(),
    };

    const loop = () => {
        const progress = Math.min((Date.now() - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4); 

        // 1. LP Move
        targetLP.mesh.position.lerpVectors(startState.lpPos, targetPos, ease);
        targetLP.mesh.quaternion.slerpQuaternions(startState.lpQuat, targetQuat, ease);
        targetLP.mesh.scale.lerpVectors(startState.lpScale, new THREE.Vector3(1.6, 1.6, 1.6), ease); // 1.6배 확대

        // 2. Vinyl Move
        if (targetLP.vinyl && startState.vPos && startState.vQuat) {
            targetLP.vinyl.position.lerpVectors(startState.vPos, vinylTargetPos, ease);
            targetLP.vinyl.quaternion.slerpQuaternions(startState.vQuat, targetQuat, ease);
            targetLP.vinyl.scale.setScalar(1 + (1.6 - 1) * ease);
        }

        // 3. Others (Scale to 0) - Shelf 포함
        initialStatesRef.current.forEach((init, obj) => {
            if (obj === targetLP.mesh || obj === targetLP.vinyl) return; 
            
            obj.scale.lerpVectors(init.scale, new THREE.Vector3(0, 0, 0), ease);
            const dropPos = init.pos.clone().add(new THREE.Vector3(0, -5, -5));
            obj.position.lerpVectors(init.pos, dropPos, ease);
        });

        // 4. Camera & Controls
        if (cameraRef.current && controlsRef.current) {
            cameraRef.current.position.lerpVectors(cameraStartPos, cameraTargetPos, ease);
            controlsRef.current.target.lerpVectors(controlsStartTarget, controlsTarget, ease);
            cameraRef.current.lookAt(controlsRef.current.target);
        }

        if (progress < 1) requestAnimationFrame(loop);
        else isTransitioningRef.current = false;
    };
    loop();
  };

  const animateClose = () => {
    isTransitioningRef.current = true;
    
    const duration = 1000;
    const startTime = Date.now();

    const currentPositions = new Map<THREE.Object3D, { pos: THREE.Vector3, quat: THREE.Quaternion, scale: THREE.Vector3 }>();
    initialStatesRef.current.forEach((_, obj) => {
        currentPositions.set(obj, {
            pos: obj.position.clone(),
            quat: obj.quaternion.clone(),
            scale: obj.scale.clone()
        });
    });

    const cameraStartPos = cameraRef.current!.position.clone();
    // 초기 카메라 위치로 복귀 (줌인된 상태 유지)
    const cameraTargetPos = new THREE.Vector3(3.5, 2.0, 4.5); 

    const controlsStartTarget = controlsRef.current!.target.clone();
    const controlsTarget = new THREE.Vector3(0, 0, 0);

    const loop = () => {
        const progress = Math.min((Date.now() - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4);

        initialStatesRef.current.forEach((init, obj) => {
            const current = currentPositions.get(obj)!;
            
            obj.position.lerpVectors(current.pos, init.pos, ease);
            obj.quaternion.slerpQuaternions(current.quat, init.quat, ease);
            obj.scale.lerpVectors(current.scale, init.scale, ease);
        });

        if (cameraRef.current && controlsRef.current) {
            cameraRef.current.position.lerpVectors(cameraStartPos, cameraTargetPos, ease);
            controlsRef.current.target.lerpVectors(controlsStartTarget, controlsTarget, ease);
            cameraRef.current.lookAt(controlsRef.current.target);
        }

        if (progress < 1) {
            requestAnimationFrame(loop);
        } else {
            isTransitioningRef.current = false;
            if(controlsRef.current) controlsRef.current.enabled = true;
        }
    };
    loop();
  };

  return <div ref={containerRef} className="fixed left-0 md:left-[50px] top-1/2 -translate-y-1/2 w-full md:w-[840px] h-full md:h-[840px] z-10 animate-slideInLeft" />;
};

export default ThreeController;