import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { LPObject } from '../types';

interface ThreeControllerProps {
  onLPSelect: (id: number) => void;
  selectedId: number | null;
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
  const lpObjectsRef = useRef<LPObject[]>([]);
  const shelfObjectsRef = useRef<{ mesh: THREE.Object3D, originalPosition: THREE.Vector3 }[]>([]);
  
  const isTransitioningRef = useRef(false);
  const animationFrameRef = useRef<number>(0);

  // Initialize Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, container.offsetWidth / container.offsetHeight, 0.1, 1000);
    camera.position.set(4, 3, 4);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 3, -5);
    scene.add(fillLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 2;
    controlsRef.current = controls;

    // Load Model
    const loader = new GLTFLoader();
    loader.load(
      '/assets/LP.glb', 
      (gltf) => {
        const model = gltf.scene;
        scene.add(model);
        
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        processModel(model);
      },
      undefined,
      (error) => {
        console.warn("⚠️ Could not load '/assets/LP.glb'. Using Vinyl-shaped placeholders.", error);
        createPlaceholders(scene);
      }
    );

    // Events
    const onMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onClick = (event: MouseEvent) => {
      if (isTransitioningRef.current || selectedId !== null) return; 

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current!);
      const lpMeshes = lpObjectsRef.current.map(lp => lp.mesh);
      const intersects = raycasterRef.current.intersectObjects(lpMeshes, true);

      if (intersects.length > 0) {
        let clickedObject = intersects[0].object;
        let clickedLP: LPObject | undefined;
        
        let checkObject: THREE.Object3D | null = clickedObject;
        for (let i = 0; i < 5; i++) {
          if (!checkObject) break;
          clickedLP = lpObjectsRef.current.find(lp => lp.mesh === checkObject);
          if (clickedLP) break;
          checkObject = checkObject.parent;
        }

        if (clickedLP) {
           onLPSelect(clickedLP.id);
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
         const intersects = raycasterRef.current.intersectObjects(lpObjectsRef.current.map(lp => lp.mesh));
         
         lpObjectsRef.current.forEach(lpData => {
            const isHovered = intersects.some(intersect => intersect.object === lpData.mesh);
            const targetScale = isHovered ? 1.05 : 1;
            lpData.mesh.scale.x += (targetScale - lpData.mesh.scale.x) * 0.1;
            lpData.mesh.scale.y += (targetScale - lpData.mesh.scale.y) * 0.1;
            lpData.mesh.scale.z += (targetScale - lpData.mesh.scale.z) * 0.1;
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
      if (container && rendererRef.current) {
        container.removeChild(rendererRef.current.domElement);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    if (selectedId !== null) {
      const lpData = lpObjectsRef.current.find(lp => lp.id === selectedId);
      if (lpData) {
        animateLPSelection(lpData);
      }
    } else {
      if (lpObjectsRef.current.some(lp => lp.mesh.position.x !== lp.originalPosition.x)) {
         animateClose();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);


  const reduceSaturation = (object: THREE.Object3D) => {
    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((mat) => {
            if ((mat as THREE.MeshStandardMaterial).color) {
              const hsl = { h: 0, s: 0, l: 0 };
              (mat as THREE.MeshStandardMaterial).color.getHSL(hsl);
              (mat as THREE.MeshStandardMaterial).color.setHSL(hsl.h, hsl.s * 0.3, hsl.l);
            }
          });
        }
      }
    });
  };

  const processModel = (model: THREE.Object3D) => {
    const foundLPs: any[] = [];
    const foundVinyls: any[] = [];

    model.traverse((child) => {
      const nameLower = child.name.toLowerCase();
      if (nameLower.includes('lp') && nameLower.includes('cover')) {
        const idMatch = child.name.match(/\d+/);
        if (idMatch) {
          foundLPs.push({ mesh: child, id: parseInt(idMatch[0]), name: child.name });
        }
      }
      if (nameLower.includes('vinyl')) {
        const idMatch = child.name.match(/\d+/);
        if (idMatch) {
          foundVinyls.push({ mesh: child, id: parseInt(idMatch[0]), name: child.name });
        }
      }
       if (child.name === 'Cube' || nameLower.includes('cylinder') || nameLower.includes('shelf')) {
        reduceSaturation(child);
        shelfObjectsRef.current.push({ mesh: child, originalPosition: child.position.clone() });
      }
    });

    foundLPs.forEach(lpData => {
      const matchedVinyl = foundVinyls.find(v => v.id === lpData.id);
      reduceSaturation(lpData.mesh);
      if (matchedVinyl) reduceSaturation(matchedVinyl.mesh);
      
      lpObjectsRef.current.push({
        mesh: lpData.mesh,
        vinyl: matchedVinyl ? matchedVinyl.mesh : null,
        originalPosition: lpData.mesh.position.clone(),
        originalRotation: lpData.mesh.rotation.clone(),
        originalScale: lpData.mesh.scale.clone(),
        vinylOriginalPosition: matchedVinyl ? matchedVinyl.mesh.position.clone() : null,
        vinylOriginalRotation: matchedVinyl ? matchedVinyl.mesh.rotation.clone() : null,
        vinylOriginalScale: matchedVinyl ? matchedVinyl.mesh.scale.clone() : null,
        id: lpData.id
      });
    });

    lpObjectsRef.current.sort((a, b) => a.id - b.id);
  };

  const createPlaceholders = (scene: THREE.Scene) => {
    // Create Vinyl-like placeholders instead of boxes
    const colors = [0xFF6B6B, 0x4ECDC4, 0xFFD93D, 0xFF9F1C, 0x6A0572, 0xF7FFF7];
    
    for (let i = 0; i < 6; i++) {
        const geometry = new THREE.CylinderGeometry(1, 1, 0.05, 32);
        const material = new THREE.MeshStandardMaterial({ 
            color: colors[i],
            roughness: 0.2,
            metalness: 0.1
        });
        const mesh = new THREE.Mesh(geometry, material);
        // Rotate to stand up
        mesh.rotation.x = Math.PI / 2;
        mesh.rotation.y = Math.PI / 4; // Slight angle
        
        // Stack them
        mesh.position.set(0, 0, i * 0.3 - 0.9); 
        mesh.castShadow = true;
        scene.add(mesh);
        
        lpObjectsRef.current.push({
            mesh: mesh,
            vinyl: null,
            originalPosition: mesh.position.clone(),
            originalRotation: mesh.rotation.clone(),
            originalScale: mesh.scale.clone(),
            vinylOriginalPosition: null,
            vinylOriginalRotation: null,
            vinylOriginalScale: null,
            id: i + 1
        });
    }
  };

  const animateLPSelection = (lpData: LPObject) => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    if (controlsRef.current) controlsRef.current.enabled = false;

    const duration = 1000;
    const startTime = Date.now();

    const cameraStartPos = cameraRef.current!.position.clone();
    const cameraTargetPos = new THREE.Vector3(0, 0, 4.2);
    const lookAtStart = new THREE.Vector3(0, 0, 0);
    const lookAtTarget = new THREE.Vector3(0, 0, 0);

    const selectedCoverStartPos = lpData.mesh.position.clone();
    const selectedCoverTargetPos = new THREE.Vector3(-0.4, 0, 0);
    const targetScale = 1.92;
    
    const startRotationY = lpData.mesh.rotation.y;
    const targetRotationY = lpData.originalRotation.y - Math.PI / 2;
    const startRotationX = lpData.mesh.rotation.x;
    const targetRotationX = -3 * (Math.PI / 180);

    const shelfStartPositions = shelfObjectsRef.current.map(obj => obj.mesh.position.clone());
    const otherLPsStartPos = lpObjectsRef.current
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

        if (cameraRef.current) {
            cameraRef.current.position.lerpVectors(cameraStartPos, cameraTargetPos, eased);
            const currentLookAt = new THREE.Vector3().lerpVectors(lookAtStart, lookAtTarget, eased);
            cameraRef.current.lookAt(currentLookAt);
        }

        lpData.mesh.position.lerpVectors(selectedCoverStartPos, selectedCoverTargetPos, eased);
        lpData.mesh.scale.setScalar(1 + (targetScale - 1) * eased);
        lpData.mesh.rotation.y = startRotationY + (targetRotationY - startRotationY) * eased;
        lpData.mesh.rotation.x = startRotationX + (targetRotationX - startRotationX) * eased;

        shelfObjectsRef.current.forEach((shelfObj, index) => {
            const targetPos = shelfStartPositions[index].clone();
            targetPos.z += 10;
            shelfObj.mesh.position.lerpVectors(shelfStartPositions[index], targetPos, eased);
        });

        otherLPsStartPos.forEach(item => {
            const coverTarget = item.coverStartPos.clone();
            coverTarget.z += 10;
            item.lp.mesh.position.lerpVectors(item.coverStartPos, coverTarget, eased);
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
    }));
    
    const shelfCurrentPos = shelfObjectsRef.current.map(s => s.mesh.position.clone());

    const loop = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        if (cameraRef.current) {
            cameraRef.current.position.lerpVectors(cameraCurrentPos, cameraOriginalPos, eased);
            cameraRef.current.lookAt(0,0,0);
        }

        lpObjectsRef.current.forEach((lp, idx) => {
            lp.mesh.position.lerpVectors(currentStates[idx].pos, lp.originalPosition, eased);
            lp.mesh.scale.lerpVectors(currentStates[idx].scale, lp.originalScale, eased);
            lp.mesh.rotation.y = currentStates[idx].rot.y + (lp.originalRotation.y - currentStates[idx].rot.y) * eased;
            lp.mesh.rotation.x = currentStates[idx].rot.x + (lp.originalRotation.x - currentStates[idx].rot.x) * eased;
        });

        shelfObjectsRef.current.forEach((shelf, idx) => {
            shelf.mesh.position.lerpVectors(shelfCurrentPos[idx], shelf.originalPosition, eased);
        });

        if (progress < 1) {
            requestAnimationFrame(loop);
        } else {
            isTransitioningRef.current = false;
            if (controlsRef.current) controlsRef.current.enabled = true;
        }
    };
    loop();
  };

  return <div ref={containerRef} className="fixed left-0 md:left-[50px] top-1/2 -translate-y-1/2 w-full md:w-[840px] h-full md:h-[840px] z-10 animate-slideInLeft" />;
};

export default ThreeController;