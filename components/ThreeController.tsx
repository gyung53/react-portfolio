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

interface InitialState {
    parent: THREE.Object3D | null;
    pos: THREE.Vector3;
    quat: THREE.Quaternion;
    scale: THREE.Vector3;
}

// [상수 정의]
const DEFAULT_CAMERA_POS = new THREE.Vector3(3, 2, 11); // 탐색 시 카메라 위치
// [수정] 줌아웃을 위해 Z값 증가 (12 -> 17)
const FOCUS_CAMERA_POS = new THREE.Vector3(0, 0, 14.5);   
const FOCUS_LOOK_AT = new THREE.Vector3(0, 0, 0);       

const ThreeController: React.FC<ThreeControllerProps> = ({ onLPSelect, selectedId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Three.js Core Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  
  // Model & State Refs
  const modelWrapperRef = useRef<THREE.Group>(new THREE.Group()); 
  const lpObjectsRef = useRef<LPObject[]>([]);
  const initialStatesRef = useRef<Map<THREE.Object3D, InitialState>>(new Map());
  const initialWrapperScaleRef = useRef<number>(1); 
  
  // Logic Refs
  const isTransitioningRef = useRef(false);
  const activeIdRef = useRef<number | null>(null); // 현재 화면에 나와있는 LP ID 트래킹
  const animationFrameRef = useRef<number>(0);
  const pointerDownRef = useRef<{x: number, y: number} | null>(null);

  // 1. 초기화
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    
    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    camera.position.copy(DEFAULT_CAMERA_POS); 
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
    fillLight.position.set(-5, 2, -5);
    scene.add(fillLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 30;
    controls.maxPolarAngle = Math.PI / 2;
    controls.target.set(0, 0, 0); 
    controlsRef.current = controls;

    // Model Loader
    loadModel(scene);

    // Events
    const onResize = () => {
        if(!cameraRef.current || !rendererRef.current) return;
        cameraRef.current.aspect = container.offsetWidth / container.offsetHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(container.offsetWidth, container.offsetHeight);
    };

    const onPointerDown = (e: PointerEvent) => {
        pointerDownRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
        if (!pointerDownRef.current) return;
        const dx = Math.abs(e.clientX - pointerDownRef.current.x);
        const dy = Math.abs(e.clientY - pointerDownRef.current.y);
        if (dx < 5 && dy < 5) handleClick(e);
        pointerDownRef.current = null;
    };

    window.addEventListener('resize', onResize);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // Animation Loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      if (controlsRef.current) controlsRef.current.update();
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      window.removeEventListener('resize', onResize);
      if (rendererRef.current) {
          rendererRef.current.domElement.removeEventListener('pointerdown', onPointerDown);
          rendererRef.current.domElement.removeEventListener('pointerup', onPointerUp);
      }
      cancelAnimationFrame(animationFrameRef.current);
      if(container) container.innerHTML = '';
    };
  }, []);

  // 2. 모델 로드
  const loadModel = (scene: THREE.Scene) => {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      '/LP.glb',
      (gltf) => {
        console.log("✅ GLB Loaded");
        const model = gltf.scene;
        
        model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
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

        scene.add(modelWrapperRef.current);
        modelWrapperRef.current.add(model);

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        model.position.x = -center.x;
        model.position.y = -center.y;
        model.position.z = -center.z;

        // 초기 크기 (4.5)
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
            const scale = 4.5 / maxDim;
            modelWrapperRef.current.scale.setScalar(scale);
            initialWrapperScaleRef.current = scale;
        }

        identifyLPObjects(model);
      },
      undefined,
      (err) => console.error("❌ Loading Error:", err)
    );
  };

  const identifyLPObjects = (model: THREE.Object3D) => {
    const foundLPs: Record<number, THREE.Mesh> = {};
    const foundVinyls: Record<number, THREE.Object3D> = {};

    const vinylRegex = /^Vinyl[_\s-]*0?(\d+)/i;    
    const coverRegex = /^LP[_\s-]*Cover[_\s-]*0?(\d+)/i; 

    model.traverse((child) => {
        const name = child.name;
        const vMatch = name.match(vinylRegex);
        const cMatch = name.match(coverRegex);

        if (vMatch) foundVinyls[parseInt(vMatch[1])] = child;
        if (cMatch) foundLPs[parseInt(cMatch[1])] = child as THREE.Mesh;
    });

    Object.keys(foundLPs).forEach((key) => {
        const id = Number(key);
        const mesh = foundLPs[id];
        const vinyl = foundVinyls[id] || null;

        lpObjectsRef.current.push({
            id,
            mesh,
            vinyl,
            originalPosition: new THREE.Vector3(),
            originalRotation: new THREE.Quaternion(),
            originalScale: new THREE.Vector3(),
            vinylOriginalPosition: null, vinylOriginalRotation: null, vinylOriginalScale: null
        });
    });
  };

  // 3. 클릭 핸들러
  const handleClick = (event: PointerEvent) => {
      // 선택 모드일 때는 클릭 무시 (UI 패널로 제어)
      if (selectedId !== null) return;
      if (isTransitioningRef.current || !rendererRef.current || !cameraRef.current || !sceneRef.current) return;

      const rect = rendererRef.current.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);
      
      const intersects = raycasterRef.current.intersectObjects(modelWrapperRef.current.children, true);

      if (intersects.length > 0) {
          let target: THREE.Object3D | null = intersects[0].object;
          while (target) {
              const found = lpObjectsRef.current.find(item => item.mesh === target);
              if (found) {
                  onLPSelect(found.id);
                  return;
              }
              target = target.parent;
          }
      }
  };

  // 4. 애니메이션 제어 (State Change Handler)
  useEffect(() => {
    const prevId = activeIdRef.current;
    const nextId = selectedId;

    if (prevId === null && nextId !== null) {
        // [Open] Shelf -> LP
        animateSelection(nextId);
    } else if (prevId !== null && nextId === null) {
        // [Close] LP -> Shelf
        animateClose();
    } else if (prevId !== null && nextId !== null && prevId !== nextId) {
        // [Switch] LP A -> LP B
        animateSwitch(prevId, nextId);
    }

    activeIdRef.current = nextId;
  }, [selectedId]);

  // --- Animation Logic ---

  // [Common] Restore Object Helper
  const restoreObject = (obj: THREE.Object3D) => {
      const init = initialStatesRef.current.get(obj);
      if (init && init.parent) {
          init.parent.attach(obj);
          obj.position.copy(init.pos);
          obj.quaternion.copy(init.quat);
          obj.scale.copy(init.scale);
      }
  };

  // [Helper] 타겟 좌표 및 회전값 계산
  const getTargetTransform = () => {
      // [수정] Z 위치를 10 -> 6으로 변경 (카메라 17과의 거리 확보하여 줌아웃 효과)
      // [수정] X 간격을 넓힘 (-0.65 -> -1.6)
      const coverTargetPos = new THREE.Vector3(-0.4, 0, 6); 
      const vinylTargetPos = new THREE.Vector3(0.6, 0, 5.5);
      
      const coverDummy = new THREE.Object3D();
      coverDummy.rotation.set(0, -Math.PI / 2, 0); 
      const coverQuat = coverDummy.quaternion.clone();

      // [수정] 바이닐 각도 조정 (누워있는 문제 해결)
      // 커버와 같은 기본 회전에서 Z축으로 -90도 회전시켜 세움
      const vinylDummy = new THREE.Object3D();
      vinylDummy.rotation.set(0, -Math.PI / 2, 0); 
      vinylDummy.rotateZ(-Math.PI / 2); // 세우기
      const vinylQuat = vinylDummy.quaternion.clone();

      return { coverTargetPos, vinylTargetPos, coverQuat, vinylQuat };
  };

  const animateSelection = (id: number) => {
      const targetLP = lpObjectsRef.current.find(lp => lp.id === id);
      if (!targetLP || !sceneRef.current || !cameraRef.current) return;

      isTransitioningRef.current = true;
      if (controlsRef.current) controlsRef.current.enabled = false;

      // 1. 상태 저장 및 Scene Attach
      [targetLP.mesh, targetLP.vinyl].forEach(obj => {
          if (obj) {
              initialStatesRef.current.set(obj, {
                  parent: obj.parent,
                  pos: obj.position.clone(),
                  quat: obj.quaternion.clone(),
                  scale: obj.scale.clone()
              });
              sceneRef.current!.attach(obj);
          }
      });

      // 2. 타겟 계산
      const { coverTargetPos, vinylTargetPos, coverQuat, vinylQuat } = getTargetTransform();

      // 3. 카메라 타겟 state
      const startCamPos = cameraRef.current.position.clone();
      const startCamQuat = cameraRef.current.quaternion.clone();
      
      const endCamDummy = cameraRef.current.clone();
      endCamDummy.position.copy(FOCUS_CAMERA_POS);
      endCamDummy.lookAt(FOCUS_LOOK_AT);
      const endCamQuat = endCamDummy.quaternion.clone();

      const startState = {
          meshPos: targetLP.mesh.position.clone(),
          meshQuat: targetLP.mesh.quaternion.clone(),
          vPos: targetLP.vinyl ? targetLP.vinyl.position.clone() : new THREE.Vector3(),
          vQuat: targetLP.vinyl ? targetLP.vinyl.quaternion.clone() : new THREE.Quaternion(),
      };

      const wrapperStartScale = initialWrapperScaleRef.current;
      const duration = 1000;
      const startTime = Date.now();

      const loop = () => {
          const progress = Math.min((Date.now() - startTime) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 4);

          // A. Camera Animation
          if (cameraRef.current) {
              cameraRef.current.position.lerpVectors(startCamPos, FOCUS_CAMERA_POS, ease);
              cameraRef.current.quaternion.slerpQuaternions(startCamQuat, endCamQuat, ease);
          }

          // B. Wrapper Animation (Hide)
          if (modelWrapperRef.current) {
              const currentScale = wrapperStartScale * (1 - ease);
              modelWrapperRef.current.scale.setScalar(currentScale);
              modelWrapperRef.current.position.y = -20 * ease; 
              if (progress > 0.95) modelWrapperRef.current.visible = false;
          }

          // C. LP Animation
          targetLP.mesh.position.lerpVectors(startState.meshPos, coverTargetPos, ease);
          targetLP.mesh.quaternion.slerpQuaternions(startState.meshQuat, coverQuat, ease);
          
          if (targetLP.vinyl) {
              targetLP.vinyl.position.lerpVectors(startState.vPos, vinylTargetPos, ease);
              targetLP.vinyl.quaternion.slerpQuaternions(startState.vQuat, vinylQuat, ease);
          }

          if (progress < 1) requestAnimationFrame(loop);
          else {
              isTransitioningRef.current = false;
              if (controlsRef.current) {
                  controlsRef.current.target.copy(FOCUS_LOOK_AT);
                  controlsRef.current.update();
              }
          }
      };
      loop();
  };

  const animateClose = () => {
      const targets: THREE.Object3D[] = [];
      initialStatesRef.current.forEach((_, obj) => targets.push(obj));
      
      if (targets.length === 0) {
          if (modelWrapperRef.current) {
              modelWrapperRef.current.visible = true;
              modelWrapperRef.current.scale.setScalar(initialWrapperScaleRef.current);
              modelWrapperRef.current.position.y = 0;
          }
          return;
      }
      
      isTransitioningRef.current = true;
      const duration = 800;
      const startTime = Date.now();

      if (modelWrapperRef.current) {
          modelWrapperRef.current.visible = true;
      }
      const targetWrapperScale = initialWrapperScaleRef.current;
      
      const startCamPos = cameraRef.current!.position.clone();
      const startCamQuat = cameraRef.current!.quaternion.clone();
      
      const endCamDummy = cameraRef.current!.clone();
      endCamDummy.position.copy(DEFAULT_CAMERA_POS);
      endCamDummy.lookAt(0,0,0);
      const endCamQuat = endCamDummy.quaternion.clone();

      const startLocalStates = targets.map(obj => ({
          obj,
          pos: obj.position.clone(),
          quat: obj.quaternion.clone(),
      }));

      const loop = () => {
          const progress = Math.min((Date.now() - startTime) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 4);

          // A. Camera Reset
          if (cameraRef.current) {
               cameraRef.current.position.lerpVectors(startCamPos, DEFAULT_CAMERA_POS, ease);
               cameraRef.current.quaternion.slerpQuaternions(startCamQuat, endCamQuat, ease);
          }

          // B. Wrapper Reset
          if (modelWrapperRef.current) {
               modelWrapperRef.current.scale.setScalar(targetWrapperScale * ease);
               modelWrapperRef.current.position.y = -20 * (1 - ease);
          }
          
          const currentWrapperScale = targetWrapperScale * ease;

          // C. Object Return
          targets.forEach((obj, i) => {
               const init = initialStatesRef.current.get(obj)!;
               const start = startLocalStates[i];
               
               obj.quaternion.slerpQuaternions(start.quat, init.quat, ease);
               
               const targetWorldPos = init.pos.clone().multiplyScalar(currentWrapperScale);
               targetWorldPos.y += (-20 * (1 - ease));

               obj.position.lerpVectors(start.pos, targetWorldPos, ease);
          });

          if (progress < 1) requestAnimationFrame(loop);
          else {
              targets.forEach(obj => restoreObject(obj));
              initialStatesRef.current.clear();
              
              if (controlsRef.current) {
                  controlsRef.current.enabled = true;
                  controlsRef.current.target.set(0,0,0);
                  controlsRef.current.update();
              }
              isTransitioningRef.current = false;
          }
      };
      loop();
  };

  const animateSwitch = (prevId: number, nextId: number) => {
      const prevLP = lpObjectsRef.current.find(lp => lp.id === prevId);
      const nextLP = lpObjectsRef.current.find(lp => lp.id === nextId);

      if (!prevLP || !nextLP || !sceneRef.current) return;
      
      // Cleanup Previous
      [prevLP.mesh, prevLP.vinyl].forEach(obj => {
          if(obj) restoreObject(obj);
      });
      initialStatesRef.current.forEach((val, key) => {
          if (key === prevLP.mesh || key === prevLP.vinyl) {
              initialStatesRef.current.delete(key);
          }
      });

      // Setup Next
      [nextLP.mesh, nextLP.vinyl].forEach(obj => {
          if (obj) {
              initialStatesRef.current.set(obj, {
                  parent: obj.parent,
                  pos: obj.position.clone(),
                  quat: obj.quaternion.clone(),
                  scale: obj.scale.clone()
              });
              sceneRef.current!.attach(obj);
              obj.position.set(0, 0, 6); // Start from Z=6 (match target Z)
              obj.scale.setScalar(0);
          }
      });

      // Targets
      const { coverTargetPos, vinylTargetPos, coverQuat, vinylQuat } = getTargetTransform();

      const duration = 600;
      const startTime = Date.now();
      
      const loop = () => {
          const progress = Math.min((Date.now() - startTime) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);

          nextLP.mesh.scale.setScalar(ease);
          nextLP.mesh.position.lerpVectors(new THREE.Vector3(0,0,6), coverTargetPos, ease);
          nextLP.mesh.quaternion.slerpQuaternions(new THREE.Quaternion(), coverQuat, ease);

          if (nextLP.vinyl) {
              nextLP.vinyl.scale.setScalar(ease);
              nextLP.vinyl.position.lerpVectors(new THREE.Vector3(0,0,6), vinylTargetPos, ease);
              nextLP.vinyl.quaternion.slerpQuaternions(new THREE.Quaternion(), vinylQuat, ease);
          }
          
          if (cameraRef.current) {
               cameraRef.current.position.lerpVectors(cameraRef.current.position, FOCUS_CAMERA_POS, 0.1);
               cameraRef.current.lookAt(FOCUS_LOOK_AT);
          }

          if (progress < 1) requestAnimationFrame(loop);
      };
      loop();
  };

  return <div ref={containerRef} className="fixed left-0 md:left-[50px] top-1/2 -translate-y-1/2 w-full md:w-[840px] h-full md:h-[840px] z-10 animate-slideInLeft cursor-pointer" />;
};

export default ThreeController;``