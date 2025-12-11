declare module 'three/examples/jsm/controls/OrbitControls' {
    import { EventDispatcher, PerspectiveCamera } from 'three';

    export class OrbitControls extends EventDispatcher {
        constructor(object: PerspectiveCamera, domElement?: HTMLElement);
        update(): void;
        dispose(): void;
        enableDamping: boolean;
        dampingFactor: number;
        minDistance: number;
        maxDistance: number;
        maxPolarAngle: number;
        enabled: boolean;
    }
    export default OrbitControls;
}

declare module 'three/examples/jsm/loaders/GLTFLoader' {
    import { LoadingManager, Loader, Object3D } from 'three';

    export interface GLTF {
        scene: Object3D;
        scenes: Object3D[];
        animations: any[];
        parser?: any;
        userData?: any;
    }

    export class GLTFLoader extends Loader {
        constructor(manager?: LoadingManager);
        load(url: string, onLoad: (gltf: GLTF) => void, onProgress?: (event: ProgressEvent) => void, onError?: (event: ErrorEvent) => void): void;
        parse(data: ArrayBuffer | string, path: string, onLoad: (gltf: GLTF) => void, onError?: (event: ErrorEvent) => void): void;
    }

    export default GLTFLoader;
}
