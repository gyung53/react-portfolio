import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'; 
import { LPObject } from '../types';

interface ThreeControllerProps {
  onLPSelect: (id: number) => void;
  selectedId: number | null;
  onLoadComplete?: () => void;
}

interface InitialState {
    parent: THREE.Object3D | null;
    pos: THREE.Vector3;
    quat: THREE.Quaternion;
    scale: THREE.Vector3;
}

const DEFAULT_CAMERA_POS = new THREE.Vector3(8.5, 4, 5); 
const FOCUS_CAMERA_POS = new THREE.Vector3(0, 0, 10.5);   
const FOCUS_LOOK_AT = new THREE.Vector3(0, 0, 0);       

THREE.Cache.enabled = true;

// Singleton Loaders
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
dracoLoader.setDecoderConfig({ type: 'js' }); 

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// 전역 로딩 프로미스 (컴포넌트 마운트 전 시작)
let globalModelPromise: Promise<THREE.Group> | null = null;

const startPreloading = () => {
    if (!globalModelPromise) {
        globalModelPromise = new Promise((resolve, reject) => {
            gltfLoader.load(
                '/LP.glb',
                (gltf) => {
                    resolve(gltf.scene);
                },
                undefined,
                (err) => reject(err)
            );
        });
    }
    return globalModelPromise;
};

// 즉시 로딩 시작
startPreloading();

const ThreeController: React.FC<ThreeControllerProps> = ({ onLPSelect, selectedId, onLoadComplete }) => {
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
  const activeIdRef = useRef<number | null>(null);
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

    // 모델 로드 처리
    handleModelLoad(scene);

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

  const handleModelLoad = (scene: THREE.Scene) => {
      // Use the global promise ensuring we don't re-download
      startPreloading()!
        .then((model) => {
            console.log("✅ GLB Processed in Scene");
            
            // Clone if needed, but for singleton scene just use it
            // Reset transforms just in case
            model.position.set(0,0,0);
            model.rotation.set(0,0,0);
            model.scale.set(1,1,1);

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

            modelWrapperRef.current.clear();
            scene.add(modelWrapperRef.current);
            modelWrapperRef.current.add(model);

            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            model.position.x = -center.x;
            model.position.y = -center.y;
            model.position.z = -center.z;

            const maxDim = Math.max(size.x, size.y, size.z);
            if (maxDim > 0) {
                const scale = 4.5 / maxDim;
                modelWrapperRef.current.scale.setScalar(scale);
                initialWrapperScaleRef.current = scale;
            }

            identifyLPObjects(model);

            // Notify Parent that loading is DONE
            if (onLoadComplete) onLoadComplete();
        })
        .catch(err => {
            console.error("Failed to load model", err);
            // Even on error, notify complete so UI doesn't hang
            if (onLoadComplete) onLoadComplete();
        });
  };

  const identifyLPObjects = (model: THREE.Object3D) => {
    const foundLPs: Record<number, THREE.Mesh> = {};
    const foundVinyls: Record<number, THREE.Object3D> = {};
    
    lpObjectsRef.current = [];

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
            originalPosition: mesh.position.clone(),
            originalRotation: mesh.quaternion.clone(),
            originalScale: mesh.scale.clone(),
            vinylOriginalPosition: vinyl ? vinyl.position.clone() : null,
            vinylOriginalRotation: vinyl ? vinyl.quaternion.clone() : null,
            vinylOriginalScale: vinyl ? vinyl.scale.clone() : null
        });
    });
  };

  const handleClick = (event: PointerEvent) => {
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

  // Animation Logic (Same as before)
  useEffect(() => {
    const prevId = activeIdRef.current;
    const nextId = selectedId;

    if (prevId === null && nextId !== null) {
        animateSelection(nextId);
    } else if (prevId !== null && nextId === null) {
        animateClose();
    } else if (prevId !== null && nextId !== null && prevId !== nextId) {
        animateSwitch(prevId, nextId);
    }

    activeIdRef.current = nextId;
  }, [selectedId]);

  // ... (animateSelection, animateClose, animateSwitch code remains identical) ...
  const restoreObject = (obj: THREE.Object3D) => {
      const init = initialStatesRef.current.get(obj);
      if (init && init.parent) {
          init.parent.add(obj); 
          obj.position.copy(init.pos);
          obj.quaternion.copy(init.quat);
          obj.scale.copy(init.scale);
      }
  };

  const getTargetTransform = () => {
      const coverVisualPos = new THREE.Vector3(-0.6, 0, 6); 
      const vinylVisualPos = new THREE.Vector3(0.8, 0, 5.5);
      
      const coverDummy = new THREE.Object3D();
      coverDummy.rotation.set(0, -Math.PI / 2 - 0.35, 0); 
      const coverQuat = coverDummy.quaternion.clone();

      const vinylDummy = new THREE.Object3D();
      vinylDummy.rotation.set(0, Math.PI / 2, 0); 
      vinylDummy.rotateZ(-Math.PI / 2); 
      const vinylQuat = vinylDummy.quaternion.clone();

      return { coverVisualPos, vinylVisualPos, coverQuat, vinylQuat };
  };

  const getAdjustedPosition = (obj: THREE.Object3D, targetVisualPos: THREE.Vector3, targetQuat: THREE.Quaternion) => {
      let offsetVector = new THREE.Vector3(0, 0, 0);

      if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
          const center = new THREE.Vector3();
          mesh.geometry.boundingBox!.getCenter(center);
          offsetVector.copy(center);
      } else {
          const box = new THREE.Box3().setFromObject(obj);
          const center = new THREE.Vector3();
          box.getCenter(center);
          offsetVector.copy(obj.worldToLocal(center));
      }

      offsetVector.multiply(obj.scale);

      const rotatedOffset = offsetVector.clone().applyQuaternion(targetQuat);
      return targetVisualPos.clone().sub(rotatedOffset);
  };

  const animateSelection = (id: number) => {
      const targetLP = lpObjectsRef.current.find(lp => lp.id === id);
      if (!targetLP || !sceneRef.current || !cameraRef.current) return;

      isTransitioningRef.current = true;
      if (controlsRef.current) controlsRef.current.enabled = false;

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

      const { coverVisualPos, vinylVisualPos, coverQuat, vinylQuat } = getTargetTransform();
      
      const coverTargetPos = getAdjustedPosition(targetLP.mesh, coverVisualPos, coverQuat);
      let vinylTargetPos = new THREE.Vector3();
      if (targetLP.vinyl) {
          vinylTargetPos = getAdjustedPosition(targetLP.vinyl, vinylVisualPos, vinylQuat);
      }

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

          if (cameraRef.current) {
              cameraRef.current.position.lerpVectors(startCamPos, FOCUS_CAMERA_POS, ease);
              cameraRef.current.quaternion.slerpQuaternions(startCamQuat, endCamQuat, ease);
          }

          if (modelWrapperRef.current) {
              const currentScale = wrapperStartScale * (1 - ease);
              modelWrapperRef.current.scale.setScalar(currentScale);
              modelWrapperRef.current.position.y = -20 * ease; 
              if (progress > 0.95) modelWrapperRef.current.visible = false;
          }

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

          if (cameraRef.current) {
               cameraRef.current.position.lerpVectors(startCamPos, DEFAULT_CAMERA_POS, ease);
               cameraRef.current.quaternion.slerpQuaternions(startCamQuat, endCamQuat, ease);
          }

          if (modelWrapperRef.current) {
               modelWrapperRef.current.scale.setScalar(targetWrapperScale * ease);
               modelWrapperRef.current.position.y = -20 * (1 - ease);
          }
          
          const currentWrapperScale = targetWrapperScale * ease;

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
      
      // 1. Cleanup Previous
      [prevLP.mesh, prevLP.vinyl].forEach(obj => {
          if(obj) restoreObject(obj);
      });
      initialStatesRef.current.forEach((val, key) => {
          if (key === prevLP.mesh || key === prevLP.vinyl) {
              initialStatesRef.current.delete(key);
          }
      });

      // 2. Setup Next
      const meshTargetScale = nextLP.originalScale.clone().multiplyScalar(initialWrapperScaleRef.current);
      const vinylTargetScale = (nextLP.vinylOriginalScale || new THREE.Vector3(1,1,1)).clone().multiplyScalar(initialWrapperScaleRef.current);

      [nextLP.mesh, nextLP.vinyl].forEach(obj => {
          if (obj) {
              initialStatesRef.current.set(obj, {
                  parent: obj.parent,
                  pos: obj.position.clone(),
                  quat: obj.quaternion.clone(),
                  scale: obj.scale.clone()
              });
              
              sceneRef.current!.add(obj);
              
              obj.visible = true;
              const targetScale = (obj === nextLP.vinyl) ? vinylTargetScale : meshTargetScale;
              obj.scale.copy(targetScale);
              obj.updateMatrixWorld(true);
          }
      });

      // 3. Calculate Targets
      const { coverVisualPos, vinylVisualPos, coverQuat, vinylQuat } = getTargetTransform();
      
      const coverTargetPos = getAdjustedPosition(nextLP.mesh, coverVisualPos, coverQuat);
      let vinylTargetPos = new THREE.Vector3();
      if (nextLP.vinyl) {
          vinylTargetPos = getAdjustedPosition(nextLP.vinyl, vinylVisualPos, vinylQuat);
      } else {
          vinylTargetPos = vinylVisualPos.clone();
      }

      // 4. Reset to Small Scale for Pop-up Animation
      [nextLP.mesh, nextLP.vinyl].forEach(obj => {
          if (obj) {
              obj.position.set(0, 0, 6);
              obj.quaternion.set(0,0,0,1);
              obj.scale.setScalar(0.001); 
          }
      });

      const duration = 600;
      const startTime = Date.now();
      
      const loop = () => {
          const progress = Math.min((Date.now() - startTime) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);

          // Animate Scale
          nextLP.mesh.scale.copy(meshTargetScale).multiplyScalar(ease);
          // Animate Position/Rotation
          nextLP.mesh.position.lerpVectors(new THREE.Vector3(0,0,6), coverTargetPos, ease);
          nextLP.mesh.quaternion.slerpQuaternions(new THREE.Quaternion(), coverQuat, ease);

          if (nextLP.vinyl) {
              nextLP.vinyl.scale.copy(vinylTargetScale).multiplyScalar(ease);
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

  return (
    <div 
        ref={containerRef} 
        className="fixed left-0 md:left-[50px] top-1/2 -translate-y-1/2 w-full md:w-[840px] h-full md:h-[840px] z-10 animate-slideInLeft cursor-pointer" 
    />
  );
};

export default ThreeController;