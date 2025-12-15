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

const ThreeController: React.FC<ThreeControllerProps> = ({ onLPSelect, selectedId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Three.js Core Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  
  // Model & State Refs
  const modelWrapperRef = useRef<THREE.Group>(new THREE.Group()); // 모델 전체를 감싸는 래퍼
  const lpObjectsRef = useRef<LPObject[]>([]);
  const initialStatesRef = useRef<Map<THREE.Object3D, InitialState>>(new Map());
  
  const isTransitioningRef = useRef(false);
  const animationFrameRef = useRef<number>(0);
  
  // Click Handling Refs
  const pointerDownRef = useRef<{x: number, y: number} | null>(null);

  // 1. 초기화 (Scene, Camera, Renderer)
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    
    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera: 대각선 뷰 유지
    const camera = new THREE.PerspectiveCamera(45, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    camera.position.set(3, 2, 11); 
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
        
        if (dx < 5 && dy < 5) {
            handleClick(e);
        }
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

  // 2. 모델 로드 및 처리 로직
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

        // 적절한 크기로 조정 (4.5)
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
            const scale = 4.5 / maxDim;
            modelWrapperRef.current.scale.setScalar(scale);
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
      if (isTransitioningRef.current || selectedId !== null || !rendererRef.current || !cameraRef.current || !sceneRef.current) return;

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

  // 4. 선택 애니메이션
  useEffect(() => {
    if (selectedId !== null) {
      const lpData = lpObjectsRef.current.find(lp => lp.id === selectedId);
      if (lpData) animateSelection(lpData);
    } else {
      animateClose();
    }
  }, [selectedId]);

  const animateSelection = (targetLP: LPObject) => {
      if (isTransitioningRef.current || !sceneRef.current || !cameraRef.current) return;
      isTransitioningRef.current = true;
      if (controlsRef.current) controlsRef.current.enabled = false;

      const duration = 1000;
      const startTime = Date.now();

      // 상태 저장
      initialStatesRef.current.set(targetLP.mesh, {
          parent: targetLP.mesh.parent,
          pos: targetLP.mesh.position.clone(),
          quat: targetLP.mesh.quaternion.clone(),
          scale: targetLP.mesh.scale.clone()
      });
      sceneRef.current.attach(targetLP.mesh);

      if (targetLP.vinyl) {
          initialStatesRef.current.set(targetLP.vinyl, {
              parent: targetLP.vinyl.parent,
              pos: targetLP.vinyl.position.clone(),
              quat: targetLP.vinyl.quaternion.clone(),
              scale: targetLP.vinyl.scale.clone()
          });
          sceneRef.current.attach(targetLP.vinyl);
      }

      // [수정] 목표 위치: 카메라와 적당한 거리 (z=5)
      // 카메라는 (3, 2, 11)에 위치.
      const targetPos = new THREE.Vector3(-1.5, 0, 5); 
      const vinylTargetPos = new THREE.Vector3(1.5, 0, 5);
      
      // [수정] 목표 회전: 카메라를 정확히 바라보도록 설정 (LookAt)
      // 1. Cover: 카메라를 바라본 뒤 -90도 Y회전 (Spine->Face 보정)
      const dummy = new THREE.Object3D();
      dummy.position.copy(targetPos);
      dummy.lookAt(cameraRef.current.position);
      dummy.rotateY(-Math.PI / 2);
      const coverTargetQuat = dummy.quaternion.clone();

      // 2. Vinyl: 카메라를 바라본 뒤 +90도 Y회전 (Cover와 반대 방향으로 뒤집기 - Backside issue 해결)
      dummy.position.copy(vinylTargetPos);
      dummy.lookAt(cameraRef.current.position);
      dummy.rotateY(Math.PI / 2);
      const vinylTargetQuat = dummy.quaternion.clone();
      
      const startState = {
          meshPos: targetLP.mesh.position.clone(),
          meshQuat: targetLP.mesh.quaternion.clone(),
          meshScale: targetLP.mesh.scale.clone(),
          vPos: targetLP.vinyl ? targetLP.vinyl.position.clone() : new THREE.Vector3(),
          vQuat: targetLP.vinyl ? targetLP.vinyl.quaternion.clone() : new THREE.Quaternion(),
      };

      const loop = () => {
          const progress = Math.min((Date.now() - startTime) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 4);

          // [수정] Wrapper 애니메이션: Z축 이동 대신 Y축 아래로 드롭 + 스케일 축소
          // 화면 밖으로 깔끔하게 사라지게 함 (Screenshot like motion 제거)
          if (modelWrapperRef.current) {
              const wrapperY = -ease * 50; 
              const wrapperScale = 1 - ease; // 0으로 축소
              
              modelWrapperRef.current.position.y = wrapperY;
              // 원래 스케일 기준이므로 비율 계산 필요하지만, 0으로 가는것은 상관없음.
              // 초기 스케일이 있으므로 저장해두면 좋으나, 여기선 animateClose에서 복구하므로
              // 현재 프레임에서 계산된 스케일을 적용.
              // 초기 스케일은 loadModel에서 설정됨 (approx 0.7~1.0 factor).
              // 간단히 scalar 0으로 보냄.
              // 복잡함을 피하기 위해 scale.setScalar(initial * (1-ease)) 방식이 좋지만,
              // Wrapper의 스케일은 일정하지 않으므로 (모델따라 다름), 
              // 여기서는 그냥 엄청 밑으로 내리는게 제일 깔끔할 수도 있음.
              // 하지만 scale 0이 가장 확실함.
              
              // 현재 scale 값을 모르므로 lerp가 애매할 수 있음.
              // 따라서 그냥 Y를 아주 멀리 보내는 것(-100)으로 처리.
              modelWrapperRef.current.position.y = -100 * ease; 
              modelWrapperRef.current.visible = progress < 0.9; // 거의 다 사라지면 안보이게
          }

          // LP 이동
          targetLP.mesh.position.lerpVectors(startState.meshPos, targetPos, ease);
          targetLP.mesh.quaternion.slerpQuaternions(startState.meshQuat, coverTargetQuat, ease);
          
          // Vinyl 이동
          if (targetLP.vinyl) {
              targetLP.vinyl.position.lerpVectors(startState.vPos, vinylTargetPos, ease);
              targetLP.vinyl.quaternion.slerpQuaternions(startState.vQuat, vinylTargetQuat, ease);
          }

          if (progress < 1) requestAnimationFrame(loop);
          else isTransitioningRef.current = false;
      };
      loop();
  };

  const animateClose = () => {
      const targets: THREE.Object3D[] = [];
      initialStatesRef.current.forEach((_, obj) => targets.push(obj));
      
      if (targets.length === 0) return;
      isTransitioningRef.current = true;

      const duration = 800;
      const startTime = Date.now();

      // Wrapper 원상복구 준비
      if (modelWrapperRef.current) modelWrapperRef.current.visible = true;

      const loop = () => {
          const progress = Math.min((Date.now() - startTime) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 4);

          // Wrapper 복구 (Y: -100 -> 0)
          if (modelWrapperRef.current) {
               modelWrapperRef.current.position.y = -100 * (1 - ease);
          }

          if (progress < 1) requestAnimationFrame(loop);
          else {
               // 복구 완료 후 Attach
               targets.forEach(obj => {
                  const init = initialStatesRef.current.get(obj);
                  if (init && init.parent) {
                      init.parent.attach(obj);
                      obj.position.copy(init.pos);
                      obj.quaternion.copy(init.quat);
                      obj.scale.copy(init.scale);
                  }
               });

              isTransitioningRef.current = false;
              initialStatesRef.current.clear();
              if (controlsRef.current) controlsRef.current.enabled = true;
          }
      };
      
      // Scene상에서 원래 위치로 돌아오는 애니메이션
      const startLocalStates = targets.map(obj => ({
          obj,
          pos: obj.position.clone(),
          quat: obj.quaternion.clone(),
      }));

      const animationLoop = () => {
           const progress = Math.min((Date.now() - startTime) / duration, 1);
           const ease = 1 - Math.pow(1 - progress, 4);
           
           if (modelWrapperRef.current) {
                modelWrapperRef.current.position.y = -100 * (1 - ease);
           }
           
           targets.forEach((obj, i) => {
               const init = initialStatesRef.current.get(obj)!;
               const start = startLocalStates[i];
               
               // 회전 복구 (로컬 회전과 유사하게 Scene상 회전 트윈)
               obj.quaternion.slerpQuaternions(start.quat, init.quat, ease);
               
               // 위치 복구 (Scene 0,0,0 기준 대략적인 원래 위치)
               // Wrapper Scale 보정
               const currentScale = modelWrapperRef.current ? modelWrapperRef.current.scale.x : 1;
               const targetWorldPos = init.pos.clone().multiplyScalar(currentScale);
               
               obj.position.lerpVectors(start.pos, targetWorldPos, ease);
           });

           if (progress < 1) requestAnimationFrame(animationLoop);
           else {
               targets.forEach(obj => {
                  const init = initialStatesRef.current.get(obj);
                  if (init && init.parent) {
                      init.parent.attach(obj);
                      obj.position.copy(init.pos);
                      obj.quaternion.copy(init.quat);
                      obj.scale.copy(init.scale);
                  }
               });
               isTransitioningRef.current = false;
               initialStatesRef.current.clear();
               if (controlsRef.current) controlsRef.current.enabled = true;
           }
      };
      animationLoop();
  };

  return <div ref={containerRef} className="fixed left-0 md:left-[50px] top-1/2 -translate-y-1/2 w-full md:w-[840px] h-full md:h-[840px] z-10 animate-slideInLeft cursor-pointer" />;
};

export default ThreeController;