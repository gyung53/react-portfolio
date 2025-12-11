import * as THREE from 'three';

export interface Project {
  id: number;
  name: string;
  type: string;
  thumbnail: string;
  bgImage: string;
  overview: string;
}

export interface LPObject {
  mesh: THREE.Object3D;
  vinyl: THREE.Object3D | null;
  originalPosition: THREE.Vector3;
  originalRotation: THREE.Euler;
  originalScale: THREE.Vector3;
  vinylOriginalPosition: THREE.Vector3 | null;
  vinylOriginalRotation: THREE.Euler | null;
  vinylOriginalScale: THREE.Vector3 | null;
  id: number;
}