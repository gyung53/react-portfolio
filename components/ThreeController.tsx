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

// 초기 상태 저장용 (복귀를 위해 필수)
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
  const shelfPartsRef = useRef<THREE.Object3D[]>([]); 
  const initialStatesRef = useRef<Map<THREE.Object3D, InitialState>>(new Map());
  
  const isTransitioningRef = useRef(false);
  const animationFrameRef = useRef<number>(0);

  // 1. Scene 초기화
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    
    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera: [수정] 완전한 정면 뷰를 위해 Z축으로만 이동
    const camera = new THREE.PerspectiveCamera(45, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    camera.position.set(0, 0, 9); // 정면에서 멀리 떨어짐
    camera.lookAt(0, 0, 0);       // 중앙 응시
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 5, 10); // 정면 조명 강화
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
    fillLight.position.set(-5, 0, 5);
    scene.add(fillLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 4;
    controls.maxDistance = 15;
    // [수정] 밑면/윗면을 너무 많이 보지 못하게 각도 제한 (사용자 요청 반영)
    controls.minPolarAngle = Math.PI / 3; // 위쪽 제한
    controls.maxPolarAngle = Math.PI / 1.5; // 아래쪽 제한
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
        
        // 그림자 설정
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // 구조 정리 (Flatten)
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


  // 📌 모델 평탄화 (모든 요소를 독립적으로 만듦)
  const processModel = (model: THREE.Object3D, scene: THREE.Scene) => {
    const foundLPs: Record<number, THREE.Object3D> = {};
    const foundVinyls: Record<number, THREE.Object3D> = {};
    const others: THREE.Object3D[] = [];

    const vinylRegex = /^Vinyl_?(\d+)/i;    
    const coverRegex = /^LP_Cover_?(\d+)/i; 

    // Scene Graph 복사 (순회 중 변경 방지)
    const children = [...model.children];

    children.forEach((child) => {
      const name = child.name;
      const vMatch = name.match(vinylRegex);
      const cMatch = name.match(coverRegex);

      if (vMatch && !name.includes('.')) {
         foundVinyls[parseInt(vMatch[1])] = child;
      } else if (cMatch) {
         foundLPs[parseInt(cMatch[1])] = child;
      } else if (name !== 'Camera' && name !== 'Light') {
         others.push(child);
      }
    });

    // Scene에 붙이고 초기 상태 저장하는 함수
    const attachAndSave = (obj: THREE.Object3D) => {
        scene.attach(obj);
        initialStatesRef.current.set(obj, {
            pos: obj.position.clone(),
            quat: obj.quaternion.clone(),
            scale: obj.scale.clone()
        });
    };

    others.forEach(obj => {
        attachAndSave(obj);
        shelfPartsRef.current.push(obj);
    });

    Object.keys(foundLPs).forEach(key => {
        const id = Number(key);
        const coverObj = foundLPs[id];
        const vinylObj = foundVinyls[id] || null;

        attachAndSave(coverObj);
        if (vinylObj) attachAndSave(vinylObj);

        lpObjectsRef.current.push({
            id,
            mesh: coverObj as THREE.Mesh,
            vinyl: vinylObj,
            originalPosition: coverObj.position.clone(), // 미사용 (Map 사용)
            originalRotation: coverObj.quaternion.clone(),
            originalScale: coverObj.scale.clone(),
            vinylOriginalPosition: null, vinylOriginalRotation: null, vinylOriginalScale: null
        });
    });
  };

  // 📌 선택 애니메이션 (정가운데 정렬)
  const animateSelection = (targetLP: LPObject) => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    if(controlsRef.current) controlsRef.current.enabled = false; // 컨트롤 잠금

    const duration = 1000;
    const startTime = Date.now();

    // 1. 선택된 LP 목표: 화면 정중앙 (0,0,0)보다 약간 앞
    // 카메라가 (0,0,9)에 있으므로 (0,0,5) 정도면 꽉 차게 보임
    const targetPos = new THREE.Vector3(0, 0, 5); 
    
    // 🔥 회전: 무조건 정면(0,0,0)을 보게 함
    const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
    
    // 확대
    const targetScale = new THREE.Vector3(2.5, 2.5, 2.5);

    // 2. Vinyl 목표: 커버 위로 솟아오름
    const vinylTargetPos = new THREE.Vector3(0, 1.2, 4.9); // 커버(Z=5)보다 살짝 뒤(Z=4.9), 위로(Y=1.2)

    // 3. 선반 및 나머지 목표: 뒤쪽 아래로 물러남 (사용자가 원한 방향)
    const dropOffset = new THREE.Vector3(0, -10, -5); 

    // 현재 상태 캡처
    const startState = {
        lpPos: targetLP.mesh.position.clone(),
        lpQuat: targetLP.mesh.quaternion.clone(),
        lpScale: targetLP.mesh.scale.clone(),
        vPos: targetLP.vinyl?.position.clone(),
        vQuat: targetLP.vinyl?.quaternion.clone(),
        vScale: targetLP.vinyl?.scale.clone(),
    };

    const loop = () => {
        const progress = Math.min((Date.now() - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);

        // A. Target LP 이동
        targetLP.mesh.position.lerpVectors(startState.lpPos, targetPos, ease);
        targetLP.mesh.quaternion.slerpQuaternions(startState.lpQuat, targetQuat, ease);
        targetLP.mesh.scale.lerpVectors(startState.lpScale, targetScale, ease);

        // B. Target Vinyl 이동
        if (targetLP.vinyl && startState.vPos && startState.vQuat && startState.vScale) {
            targetLP.vinyl.position.lerpVectors(startState.vPos, vinylTargetPos, ease);
            targetLP.vinyl.quaternion.slerpQuaternions(startState.vQuat, targetQuat, ease);
            targetLP.vinyl.scale.lerpVectors(startState.vScale, targetScale, ease);
        }

        // C. 나머지 모두 치우기
        initialStatesRef.current.forEach((init, obj) => {
            if (obj === targetLP.mesh || obj === targetLP.vinyl) return; // 주인공 제외
            
            const targetDropPos = init.pos.clone().add(dropOffset);
            obj.position.lerpVectors(init.pos, targetDropPos, ease);
        });

        if (progress < 1) requestAnimationFrame(loop);
        else isTransitioningRef.current = false;
    };
    loop();
  };

  // 📌 복귀 애니메이션 (X 버튼)
  const animateClose = () => {
    isTransitioningRef.current = true;
    
    const duration = 800;
    const startTime = Date.now();

    // 현재 위치들 캡처
    const currentPositions = new Map<THREE.Object3D, { pos: THREE.Vector3, quat: THREE.Quaternion, scale: THREE.Vector3 }>();
    initialStatesRef.current.forEach((_, obj) => {
        currentPositions.set(obj, {
            pos: obj.position.clone(),
            quat: obj.quaternion.clone(),
            scale: obj.scale.clone()
        });
    });

    const loop = () => {
        const progress = Math.min((Date.now() - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);

        initialStatesRef.current.forEach((init, obj) => {
            const current = currentPositions.get(obj)!;
            
            obj.position.lerpVectors(current.pos, init.pos, ease);
            obj.quaternion.slerpQuaternions(current.quat, init.quat, ease);
            obj.scale.lerpVectors(current.scale, init.scale, ease);
        });

        if (progress < 1) {
            requestAnimationFrame(loop);
        } else {
            isTransitioningRef.current = false;
            if(controlsRef.current) controlsRef.current.enabled = true; // 컨트롤 잠금 해제
        }
    };
    loop();
  };

  return <div ref={containerRef} className="fixed left-0 md:left-[50px] top-1/2 -translate-y-1/2 w-full md:w-[840px] h-full md:h-[840px] z-10 animate-slideInLeft" />;
};

export default ThreeController;