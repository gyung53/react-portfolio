import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface LPObject {
  id: number;
  mesh: THREE.Object3D;
  vinyl: THREE.Object3D | null;
  originalPosition: THREE.Vector3;
  originalRotation: THREE.Euler;
  originalScale: THREE.Vector3;
  vinylOriginalPosition: THREE.Vector3 | null;
  vinylOriginalRotation: THREE.Euler | null;
  vinylOriginalScale: THREE.Vector3 | null;
}

interface ThreeControllerProps {
  onLPSelect: (id: number) => void;
  selectedId: number | null;
}

const ThreeController: React.FC<ThreeControllerProps> = ({ onLPSelect, selectedId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  
  const lpObjectsRef = useRef<LPObject[]>([]);
  const shelfRef = useRef<{ mesh: THREE.Object3D, originalPosition: THREE.Vector3 } | null>(null);
  
  const isTransitioningRef = useRef(false);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    camera.position.set(4, 3, 4);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 8, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 2;
    controlsRef.current = controls;

    // GLTFLoader로 모델 로드
    const loader = new GLTFLoader();
    loader.load(
      '/public/LP.glb',
      (gltf) => {
        const model = gltf.scene;
        scene.add(model);
        
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        processModel(model, scene);
      },
      undefined,
      (error) => {
        console.warn("⚠️ Could not load '/public/LP.glb'.", error);
        createPlaceholders(scene);
      }
    );

    const onMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
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
      if (!cameraRef.current || !rendererRef.current) return;
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
      
      if (selectedId === null && !isTransitioningRef.current && lpObjectsRef.current.length > 0 && cameraRef.current) {
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        const intersects = raycasterRef.current.intersectObjects(sceneRef.current!.children, true);
        
        const hoveredLPId = (() => {
          if (intersects.length === 0) return null;
          let t: THREE.Object3D | null = intersects[0].object;
          while (t) {
            const f = lpObjectsRef.current.find(p => p.mesh === t);
            if (f) return f.id;
            t = t.parent;
          }
          return null;
        })();

        lpObjectsRef.current.forEach(lpData => {
          const isHovered = lpData.id === hoveredLPId;
          const targetScale = isHovered ? 1.05 : 1;
          
          const ease = 0.1;
          lpData.mesh.scale.x += (targetScale - lpData.mesh.scale.x) * ease;
          lpData.mesh.scale.y += (targetScale - lpData.mesh.scale.y) * ease;
          lpData.mesh.scale.z += (targetScale - lpData.mesh.scale.z) * ease;
        });
      }

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
      if (controlsRef.current) controlsRef.current.dispose();
      if (container && rendererRef.current && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
    };
  }, []); 

  useEffect(() => {
    if (selectedId !== null) {
      const lpData = lpObjectsRef.current.find(lp => lp.id === selectedId);
      if (lpData) {
        animateLPSelection(lpData);
      }
    } else {
      const needsReset = lpObjectsRef.current.some(lp => 
        lp.mesh.position.distanceTo(lp.originalPosition) > 0.01
      );
      if (needsReset) {
        animateClose();
      }
    }
  }, [selectedId]);

  const processModel = (model: THREE.Object3D, scene: THREE.Scene) => {
    const foundLPs: Record<number, THREE.Object3D> = {};
    const foundVinyls: Record<number, THREE.Object3D> = {};
    let foundShelf: THREE.Object3D | null = null;

    // Vinyl_1, Vinyl_2 등의 Collection (Group) 찾기
    // LP_Cover_1, LP_Cover_2 등의 Mesh 찾기
    model.traverse((child) => {
      const name = child.name.trim();

      // Shelf 찾기
      if (name === 'Shelf') {
        foundShelf = child;
        return;
      }
      
      // Vinyl Collection 찾기 (정확히 "Vinyl_1", "Vinyl_2" 형태만)
      const vinylMatch = name.match(/^Vinyl_(\d+)$/i);
      if (vinylMatch) {
        const id = parseInt(vinylMatch[1]);
        if (!foundVinyls[id]) {
          foundVinyls[id] = child;
        }
        return;
      }

      // LP Cover 찾기 (정확히 "LP_Cover_1", "LP_Cover_2" 형태만)
      const coverMatch = name.match(/^LP_Cover_(\d+)$/i);
      if (coverMatch) {
        const id = parseInt(coverMatch[1]);
        if (!foundLPs[id]) {
          foundLPs[id] = child;
        }
        return;
      }
    });

    // Shelf를 Scene에 직접 추가
    if (foundShelf) {
      scene.attach(foundShelf);
      shelfRef.current = {
        mesh: foundShelf,
        originalPosition: foundShelf.position.clone()
      };
    }

    // LP Cover와 Vinyl을 ID 순서대로 처리
    const ids = Object.keys(foundLPs).map(Number).sort((a, b) => a - b);
    
    ids.forEach(id => {
      const coverMesh = foundLPs[id];
      const vinylGroup = foundVinyls[id] || null;

      // Scene에 직접 attach (부모에서 분리)
      scene.attach(coverMesh);
      if (vinylGroup) {
        scene.attach(vinylGroup);
      }

      lpObjectsRef.current.push({
        id: id,
        mesh: coverMesh,
        vinyl: vinylGroup,
        originalPosition: coverMesh.position.clone(),
        originalRotation: coverMesh.rotation.clone(),
        originalScale: coverMesh.scale.clone(),
        vinylOriginalPosition: vinylGroup ? vinylGroup.position.clone() : null,
        vinylOriginalRotation: vinylGroup ? vinylGroup.rotation.clone() : null,
        vinylOriginalScale: vinylGroup ? vinylGroup.scale.clone() : null,
      });
    });

    console.log(`✅ Loaded ${lpObjectsRef.current.length} LP covers with their vinyls`);
  };

  const createPlaceholders = (scene: THREE.Scene) => {
    // Shelf
    const shelfGeometry = new THREE.BoxGeometry(3, 0.1, 2);
    const shelfMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
    shelf.position.set(0, -0.5, 0);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    scene.add(shelf);
    
    shelfRef.current = {
      mesh: shelf,
      originalPosition: shelf.position.clone()
    };

    const colors = [0xFF6B6B, 0x4ECDC4, 0xFFD93D, 0xFF9F1C, 0x6A0572, 0xF7FFF7];
    
    for (let i = 0; i < 6; i++) {
      // LP Cover
      const coverGeometry = new THREE.BoxGeometry(0.05, 1, 1);
      const coverMaterial = new THREE.MeshStandardMaterial({ color: colors[i] });
      const coverMesh = new THREE.Mesh(coverGeometry, coverMaterial);
      coverMesh.position.set(0, 0, i * 0.35 - 1.05);
      coverMesh.castShadow = true;
      coverMesh.receiveShadow = true;
      coverMesh.name = `LP_Cover_${i + 1}`;
      scene.add(coverMesh);
      
      // Vinyl Collection
      const vinylGroup = new THREE.Group();
      vinylGroup.name = `Vinyl_${i + 1}`;
      
      // Vinyl base (disc)
      const vinylBaseGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.02, 32);
      const vinylBaseMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
      const vinylBase = new THREE.Mesh(vinylBaseGeometry, vinylBaseMaterial);
      vinylBase.rotation.x = Math.PI / 2;
      vinylBase.castShadow = true;
      vinylBase.name = `Vinyl_${i + 1}.base`;
      
      // Vinyl label
      const labelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.03, 32);
      const labelMaterial = new THREE.MeshStandardMaterial({ color: colors[i] });
      const label = new THREE.Mesh(labelGeometry, labelMaterial);
      label.rotation.x = Math.PI / 2;
      label.position.z = 0.01;
      label.name = `vinyl_${i + 1}_top`;
      
      vinylGroup.add(vinylBase);
      vinylGroup.add(label);
      vinylGroup.position.copy(coverMesh.position);
      vinylGroup.position.x -= 0.1;
      scene.add(vinylGroup);
      
      lpObjectsRef.current.push({
        id: i + 1,
        mesh: coverMesh,
        vinyl: vinylGroup,
        originalPosition: coverMesh.position.clone(),
        originalRotation: coverMesh.rotation.clone(),
        originalScale: coverMesh.scale.clone(),
        vinylOriginalPosition: vinylGroup.position.clone(),
        vinylOriginalRotation: vinylGroup.rotation.clone(),
        vinylOriginalScale: vinylGroup.scale.clone(),
      });
    }
    
    console.log('✅ Created 6 placeholder LPs with vinyls');
  };

  const animateLPSelection = (lpData: LPObject) => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    if (controlsRef.current) controlsRef.current.enabled = false;

    const duration = 1000;
    const startTime = Date.now();

    // Camera
    const cameraStartPos = cameraRef.current!.position.clone();
    const cameraTargetPos = new THREE.Vector3(3, 1, 0);
    const lookAtStart = controlsRef.current?.target.clone() || new THREE.Vector3(0, 0, 0);
    const lookAtTarget = new THREE.Vector3(0, 0, 0);

    // Selected Cover - 왼쪽으로 이동
    const selectedCoverStartPos = lpData.mesh.position.clone();
    const selectedCoverTargetPos = new THREE.Vector3(-0.6, 0, 0);
    
    const startRotationY = lpData.mesh.rotation.y;
    const targetRotationY = lpData.originalRotation.y - Math.PI;
    
    const startRotationX = lpData.mesh.rotation.x;
    const targetRotationX = -3 * (Math.PI / 180);

    const targetScale = 1.8;

    // Selected Vinyl - 오른쪽으로 나옴
    let selectedVinylStartPos: THREE.Vector3 | null = null;
    let selectedVinylTargetPos: THREE.Vector3 | null = null;
    let vinylStartRotationY = 0;
    let vinylTargetRotationY = 0;
    
    if (lpData.vinyl) {
      selectedVinylStartPos = lpData.vinyl.position.clone();
      selectedVinylTargetPos = new THREE.Vector3(0.8, 0, 0.05);
      vinylStartRotationY = lpData.vinyl.rotation.y;
      vinylTargetRotationY = lpData.vinylOriginalRotation ? lpData.vinylOriginalRotation.y - Math.PI / 2 : 0;
    }

    // Shelf - 왼쪽으로 이동 (화면 밖)
    const shelfStartPos = shelfRef.current ? shelfRef.current.mesh.position.clone() : new THREE.Vector3();
    const shelfTargetPos = shelfStartPos.clone();
    shelfTargetPos.x -= 25;

    // 선택되지 않은 모든 LP Cover + Vinyl - 왼쪽으로 이동 (화면 밖)
    const otherLPsData = lpObjectsRef.current
      .filter(lp => lp.id !== lpData.id)
      .map(lp => ({
        lp: lp,
        coverStartPos: lp.mesh.position.clone(),
        vinylStartPos: lp.vinyl ? lp.vinyl.position.clone() : null
      }));

    const loop = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      // Camera
      if (cameraRef.current) {
        cameraRef.current.position.lerpVectors(cameraStartPos, cameraTargetPos, eased);
        const currentLookAt = new THREE.Vector3().lerpVectors(lookAtStart, lookAtTarget, eased);
        cameraRef.current.lookAt(currentLookAt);
        if (controlsRef.current) controlsRef.current.target.copy(currentLookAt);
      }

      // Selected Cover
      lpData.mesh.position.lerpVectors(selectedCoverStartPos, selectedCoverTargetPos, eased);
      lpData.mesh.scale.setScalar(1 + (targetScale - 1) * eased);
      lpData.mesh.rotation.y = startRotationY + (targetRotationY - startRotationY) * eased;
      lpData.mesh.rotation.x = startRotationX + (targetRotationX - startRotationX) * eased;

      // Selected Vinyl
      if (lpData.vinyl && selectedVinylStartPos && selectedVinylTargetPos) {
        lpData.vinyl.position.lerpVectors(selectedVinylStartPos, selectedVinylTargetPos, eased);
        lpData.vinyl.scale.setScalar(1 + (targetScale - 1) * eased);
        lpData.vinyl.rotation.y = vinylStartRotationY + (vinylTargetRotationY - vinylStartRotationY) * eased;
        lpData.vinyl.rotation.x = startRotationX + (targetRotationX - startRotationX) * eased;
      }

      // Shelf
      if (shelfRef.current) {
        shelfRef.current.mesh.position.lerpVectors(shelfStartPos, shelfTargetPos, eased);
      }

      // 다른 모든 LP Cover + Vinyl
      otherLPsData.forEach(item => {
        const coverTarget = item.coverStartPos.clone();
        coverTarget.x -= 25;
        item.lp.mesh.position.lerpVectors(item.coverStartPos, coverTarget, eased);
        
        if (item.lp.vinyl && item.vinylStartPos) {
          const vinylTarget = item.vinylStartPos.clone();
          vinylTarget.x -= 25;
          item.lp.vinyl.position.lerpVectors(item.vinylStartPos, vinylTarget, eased);
        }
      });

      if (progress < 1) {
        requestAnimationFrame(loop);
      } else {
        isTransitioningRef.current = false;
      }
    };
    loop();
  };

  const animateClose = () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    const duration = 800;
    const startTime = Date.now();

    const cameraCurrentPos = cameraRef.current!.position.clone();
    const cameraOriginalPos = new THREE.Vector3(4, 3, 4);
    
    const currentStates = lpObjectsRef.current.map(lp => ({
      pos: lp.mesh.position.clone(),
      rot: lp.mesh.rotation.clone(),
      scale: lp.mesh.scale.clone(),
      vinylPos: lp.vinyl ? lp.vinyl.position.clone() : null,
      vinylRot: lp.vinyl ? lp.vinyl.rotation.clone() : null,
      vinylScale: lp.vinyl ? lp.vinyl.scale.clone() : null
    }));
    
    const shelfCurrentPos = shelfRef.current ? shelfRef.current.mesh.position.clone() : new THREE.Vector3();

    const loop = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      if (cameraRef.current) {
        cameraRef.current.position.lerpVectors(cameraCurrentPos, cameraOriginalPos, eased);
        cameraRef.current.lookAt(0, 0, 0);
        if (controlsRef.current) controlsRef.current.target.set(0, 0, 0);
      }

      lpObjectsRef.current.forEach((lp, idx) => {
        // Cover 복원
        lp.mesh.position.lerpVectors(currentStates[idx].pos, lp.originalPosition, eased);
        lp.mesh.scale.lerpVectors(currentStates[idx].scale, lp.originalScale, eased);
        lp.mesh.rotation.y = currentStates[idx].rot.y + (lp.originalRotation.y - currentStates[idx].rot.y) * eased;
        lp.mesh.rotation.x = currentStates[idx].rot.x + (lp.originalRotation.x - currentStates[idx].rot.x) * eased;

        // Vinyl 복원
        if (lp.vinyl && currentStates[idx].vinylPos && lp.vinylOriginalPosition && lp.vinylOriginalRotation && lp.vinylOriginalScale && currentStates[idx].vinylRot && currentStates[idx].vinylScale) {
          lp.vinyl.position.lerpVectors(currentStates[idx].vinylPos!, lp.vinylOriginalPosition, eased);
          lp.vinyl.scale.lerpVectors(currentStates[idx].vinylScale!, lp.vinylOriginalScale, eased);
          lp.vinyl.rotation.y = currentStates[idx].vinylRot!.y + (lp.vinylOriginalRotation.y - currentStates[idx].vinylRot!.y) * eased;
          lp.vinyl.rotation.x = currentStates[idx].vinylRot!.x + (lp.vinylOriginalRotation.x - currentStates[idx].vinylRot!.x) * eased;
        }
      });

      // Shelf 복원
      if (shelfRef.current) {
        shelfRef.current.mesh.position.lerpVectors(shelfCurrentPos, shelfRef.current.originalPosition, eased);
      }

      if (progress < 1) {
        requestAnimationFrame(loop);
      } else {
        isTransitioningRef.current = false;
        if (controlsRef.current) controlsRef.current.enabled = true;
      }
    };
    loop();
  };

  return <div ref={containerRef} className="fixed left-0 md:left-[50px] top-1/2 -translate-y-1/2 w-full md:w-[840px] h-full md:h-[840px] z-10" />;
};

export default ThreeController;