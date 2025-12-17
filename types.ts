import * as THREE from 'three';

export interface ProjectLink {
  title: string;
  url: string;
}

export interface Project {
  id: number;
  name: string;
  type: string;
  thumbnail: string;
  bgImage: string;
  overview: string;
  startDate: string;
  endDate: string;
  links: ProjectLink[]; // Replaced fixed urls with dynamic links
}

export interface LPObject {
  mesh: THREE.Object3D;
  vinyl: THREE.Object3D | null;
  originalPosition: THREE.Vector3;
  originalRotation: THREE.Quaternion;
  originalScale: THREE.Vector3;
  vinylOriginalPosition: THREE.Vector3 | null;
  vinylOriginalRotation: THREE.Quaternion | null;
  vinylOriginalScale: THREE.Vector3 | null;
  id: number;
}