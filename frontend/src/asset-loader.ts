import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

/**
 * AssetLoader handles GLB/GLTF loading with Draco + KTX2 support.
 * Configure paths for decoders; defaults to CDN locations.
 */
export class AssetLoader {
    private gltfLoader: GLTFLoader;
    private dracoLoader: DRACOLoader;
    private ktx2Loader: KTX2Loader;
    private renderer: THREE.WebGLRenderer;

    constructor(renderer: THREE.WebGLRenderer) {
        this.renderer = renderer;

        // Draco
        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

        // KTX2 (Basis Universal) for GPU-native texture compression
        this.ktx2Loader = new KTX2Loader();
        this.ktx2Loader.setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/basis/');
        this.ktx2Loader.detectSupport(renderer);

        // GLTF loader with Draco + KTX2
        this.gltfLoader = new GLTFLoader();
        this.gltfLoader.setDRACOLoader(this.dracoLoader);
        this.gltfLoader.setKTX2Loader(this.ktx2Loader);
    }

    async loadGLTF(url: string): Promise<THREE.Group> {
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                url,
                (gltf) => {
                    resolve(gltf.scene);
                },
                undefined,
                (error) => reject(error)
            );
        });
    }
}


