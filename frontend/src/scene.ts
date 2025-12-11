import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CameraController } from './camera-controller.js';
import { WebXRManager } from './webxr-manager.js';
import { AssetLoader } from './asset-loader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

export class SceneManager {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private character: THREE.Group | null = null;
    private cameraController: CameraController | null = null;
    private webXRManager: WebXRManager | null = null;
    private assetLoader: AssetLoader;
    private ambientLight: THREE.AmbientLight;
    private keyLight: THREE.DirectionalLight;
    private qualityMode: 'default' | 'high' = 'default';
    private mixers: THREE.AnimationMixer[] = [];
    private clock: THREE.Clock;
    
    constructor(container: HTMLElement) {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x101010); // Darker neutral start
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 1.6, 3);
        
        // Camera controller (for movement)
        this.cameraController = new CameraController(this.camera);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.renderer.domElement.style.cursor = 'crosshair';
        container.appendChild(this.renderer.domElement);

        // Asset loader (Draco/KTX2 ready)
        this.assetLoader = new AssetLoader(this.renderer);

        // Clock for animation mixer
        this.clock = new THREE.Clock();
        
        // Initialize WebXR
        this.webXRManager = new WebXRManager(this.renderer, this.camera, this.scene);
        this.webXRManager.initWebXR().then(supported => {
            if (supported) {
                console.log('WebXR initialized');
            }
        });

        // Environment lighting (HDRI)
        this.loadEnvironmentHDR();
        
        // Lighting
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(this.ambientLight);
        
        this.keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.keyLight.position.set(8, 12, 6);
        this.keyLight.castShadow = true;
        this.keyLight.shadow.mapSize.set(1024, 1024);
        this.keyLight.shadow.camera.near = 0.5;
        this.keyLight.shadow.camera.far = 50;
        this.scene.add(this.keyLight);
        
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(40, 40);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x6b6b6b });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.name = 'ground';
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Optional placeholder (kept but overshadowed by loaded assets)
        this.createPlaceholderCharacter();

        // Load rigged/animated humans
        // 1) Rigged human with animation (Soldier)
        this.loadModelWithAnimation(
            'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Soldier/glTF-Binary/Soldier.glb',
            new THREE.Vector3(0, 0, 0),
            1.2
        ).catch(err => console.warn('Soldier load failed', err));

        // 2) Second animated human (RiggedFigure with walk animation)
        this.loadModelWithAnimation(
            'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/RiggedFigure/glTF-Binary/RiggedFigure.glb',
            new THREE.Vector3(5, 0, 1),
            1.0
        ).catch(err => console.warn('RiggedFigure load failed', err));
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(container));
    }
    
    private createPlaceholderCharacter() {
        // Create a simple character placeholder
        const group = new THREE.Group();
        
        // Body (cylinder)
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4A90E2 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5;
        body.castShadow = true;
        group.add(body);
        
        // Head (sphere)
        const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0xFFDBB3 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.25;
        head.castShadow = true;
        group.add(head);
        
        // Position character
        group.position.set(0, 0, 0);
        this.scene.add(group);
        this.character = group;
        
        console.log('Placeholder character created. Replace with GLB model in Phase 2.');
    }
    
    private onWindowResize(container: HTMLElement) {
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }
    
    public update() {
        // Update camera controller (handles movement)
        if (this.cameraController) {
            this.cameraController.update();
        }

        // Update animation mixer
        const delta = this.clock.getDelta();
        if (this.mixers.length) {
            this.mixers.forEach(m => m.update(delta));
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    public getCharacter(): THREE.Group | null {
        return this.character;
    }
    
    public async loadCharacterFromURL(url: string): Promise<void> {
        const loader = new GLTFLoader();
        
        return new Promise<void>((resolve, reject) => {
            loader.load(
                url,
                (gltf: GLTF) => {
                    // Remove old character
                    if (this.character) {
                        this.scene.remove(this.character);
                    }
                    
                    // Add new character
                    const newCharacter = gltf.scene as THREE.Group;
                    if (newCharacter) {
                        this.character = newCharacter;
                        this.character.position.set(0, 0, 0);
                        this.scene.add(this.character);
                        
                        // Enable shadows
                        this.character.traverse((child: THREE.Object3D) => {
                            if (child instanceof THREE.Mesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                            }
                        });
                    }
                    
                    resolve();
                },
                undefined,
                (error: unknown) => {
                    reject(error instanceof Error ? error : new Error(String(error)));
                }
            );
        });
    }
    
    public getWebXRManager(): WebXRManager | null {
        return this.webXRManager;
    }
    
    public getRenderer(): THREE.WebGLRenderer {
        return this.renderer;
    }
    
    public getScene(): THREE.Scene {
        return this.scene;
    }
    
    public getCamera(): THREE.PerspectiveCamera {
        return this.camera;
    }
    
    /**
     * Toggle quality presets (default vs high-quality)
     * High-quality: higher exposure, larger shadow map, brighter key light
     * Default: balanced for perf
     */
    public setQualityPreset(mode: 'default' | 'high') {
        this.qualityMode = mode;
        
        if (mode === 'high') {
            this.renderer.toneMappingExposure = 1.3;
            this.renderer.shadowMap.enabled = true;
            this.keyLight.intensity = 1.2;
            this.keyLight.shadow.mapSize.set(2048, 2048);
            this.ambientLight.intensity = 0.5;
        } else {
            this.renderer.toneMappingExposure = 1.1;
            this.renderer.shadowMap.enabled = true;
            this.keyLight.intensity = 1.0;
            this.keyLight.shadow.mapSize.set(1024, 1024);
            this.ambientLight.intensity = 0.4;
        }
    }
    
    // Method to update scene based on configuration
    public updateSceneConfig(config: SceneConfig): void {
        // Update background color
        if (config.backgroundColor) {
            this.scene.background = new THREE.Color(config.backgroundColor);
        }
        
        // Update ground color
        const ground = this.scene.getObjectByName('ground');
        if (ground && config.groundColor) {
            (ground as THREE.Mesh).material = new THREE.MeshStandardMaterial({ 
                color: config.groundColor 
            });
        }
    }

    /**
     * Load a model and play its first animation if present
     */
    public async loadModelWithAnimation(url: string, position: THREE.Vector3, scale: number = 1): Promise<void> {
        const loader = new GLTFLoader();
        return new Promise<void>((resolve, reject) => {
            loader.load(
                url,
                (gltf: GLTF) => {
                    const model = gltf.scene as THREE.Group;
                    model.position.copy(position);
                    model.scale.set(scale, scale, scale);
                    model.traverse((child: THREE.Object3D) => {
                        if (child instanceof THREE.Mesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    this.scene.add(model);

                    // Play first animation if present
                    if (gltf.animations && gltf.animations.length > 0) {
                        const mixer = new THREE.AnimationMixer(model);
                        const action = mixer.clipAction(gltf.animations[0]);
                        action.play();
                        this.mixers.push(mixer);
                    }
                    resolve();
                },
                undefined,
                (error: unknown) => reject(error instanceof Error ? error : new Error(String(error)))
            );
        });
    }

    private async loadEnvironmentHDR() {
        // Lightweight studio HDRI for realistic lighting; replace with higher-res as needed
        const hdrUrl = 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/studio_small_09_2k.hdr';
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        pmremGenerator.compileEquirectangularShader();

        try {
            const hdrEquirect = await new RGBELoader().loadAsync(hdrUrl);
            const envMap = pmremGenerator.fromEquirectangular(hdrEquirect).texture;
            this.scene.environment = envMap;
            hdrEquirect.dispose();
            pmremGenerator.dispose();
        } catch (err) {
            console.warn('Failed to load HDR environment', err);
        }
    }
}

export interface SceneConfig {
    backgroundColor?: string;
    groundColor?: string;
    characterPrompt?: string;
}

