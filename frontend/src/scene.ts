import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CameraController } from './camera-controller.js';
import { WebXRManager } from './webxr-manager.js';
import { AssetLoader } from './asset-loader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { AnimationGenerator } from './animation-generator.js';

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
    private loadedModels: Map<string, { gltf: GLTF; skeleton: THREE.Skeleton | null }> = new Map();
    private animationGenerator: AnimationGenerator | null = null;
    private activeAnimations: Map<string, { code: string; startTime: number; duration: number; updateFn: (time: number) => void }> = new Map();
    
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
        
        // Clean up any existing unwanted characters (placeholder, white character, etc.)
        this.cleanupUnwantedCharacters();
        
        // Load RiggedFigure (white character with moving arms) from CDN
        this.loadRiggedFigure();
        
        // Load Rocket model (realistic 3D model) from CDN
        this.loadRocketModel();
        
        // Load person GLB files from assets folder
        // These will be positioned at (-2, 0, 0) and (2, 0, 0)
        this.loadPersonModels();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(container));
    }
    
    // Placeholder character function removed - we now load GLB models from assets folder
    // This function is kept for reference but never called
    private createPlaceholderCharacter() {
        // DISABLED: Placeholder character is no longer used
        // We now load person_0.glb and person_1.glb from the assets folder
        console.warn('createPlaceholderCharacter() called but is disabled. Use loadPersonModels() instead.');
    }
    
    /**
     * Remove any unwanted placeholder characters or old models from the scene
     */
    private cleanupUnwantedCharacters() {
        // Remove placeholder character if it exists
        if (this.character) {
            this.scene.remove(this.character);
            this.character = null;
            console.log('🧹 Removed placeholder character');
        }
        
        // Remove any objects that might be unwanted characters (blue cylinders, white characters, etc.)
        const objectsToRemove: THREE.Object3D[] = [];
        this.scene.traverse((child) => {
            // Remove placeholder-like objects (cylinders at origin, spheres that look like heads)
            if (child instanceof THREE.Mesh) {
                const geometry = child.geometry;
                const material = child.material;
                
                // Check for blue cylinder (placeholder body)
                if (geometry instanceof THREE.CylinderGeometry && 
                    material instanceof THREE.MeshStandardMaterial &&
                    material.color.getHex() === 0x4A90E2) {
                    objectsToRemove.push(child);
                }
                
                // Check for white/very light colored meshes that might be unwanted characters
                if (material instanceof THREE.MeshStandardMaterial) {
                    const color = material.color;
                    if (color.r > 0.95 && color.g > 0.95 && color.b > 0.95 && 
                        child.parent && child.parent.name !== 'person_0.glb' && child.parent.name !== 'person_1.glb') {
                        // Only remove if it's not part of our loaded person models
                        const isPartOfPersonModel = child.parent?.name?.includes('person') || 
                                                     child.parent?.parent?.name?.includes('person');
                        if (!isPartOfPersonModel) {
                            objectsToRemove.push(child.parent || child);
                        }
                    }
                }
            }
        });
        
        objectsToRemove.forEach(obj => {
            if (obj.parent) {
                obj.parent.remove(obj);
            } else {
                this.scene.remove(obj);
            }
            console.log(`🧹 Removed unwanted object: ${obj.name || 'unnamed'}`);
        });
        
        if (objectsToRemove.length > 0) {
            console.log(`🧹 Cleaned up ${objectsToRemove.length} unwanted character(s)`);
        }
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

        // Update animation mixer (for GLB embedded animations)
        const delta = this.clock.getDelta();
        if (this.mixers.length) {
            this.mixers.forEach(m => m.update(delta));
        }
        
        // Update active programmatic animations
        const currentTime = this.clock.getElapsedTime();
        this.activeAnimations.forEach((anim, animKey) => {
            const elapsed = currentTime - anim.startTime;
            // Always update (duration is set to 999999 for continuous animation)
            try {
                anim.updateFn(elapsed);
            } catch (error) {
                console.warn(`Error updating animation for ${animKey}:`, error);
            }
        });
        
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
                        this.character = null;
                    }
                    
                    // Add new character
                    const newCharacter = gltf.scene as THREE.Group;
                    if (newCharacter) {
                        this.character = newCharacter;
                        this.character.position.set(0, 0, 0);
                        this.scene.add(this.character);
                        
                        // Enable shadows and change color to make it distinct
                        this.character.traverse((child: THREE.Object3D) => {
                            if (child instanceof THREE.Mesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                                // Change white materials to a different color (e.g., light blue)
                                if (child.material instanceof THREE.MeshStandardMaterial) {
                                    if (child.material.color.getHex() === 0xffffff || 
                                        child.material.color.r > 0.9 && child.material.color.g > 0.9 && child.material.color.b > 0.9) {
                                        child.material.color.setHex(0x87CEEB); // Sky blue
                                        child.material.needsUpdate = true;
                                    }
                                } else if (Array.isArray(child.material)) {
                                    child.material.forEach((mat: THREE.Material) => {
                                        if (mat instanceof THREE.MeshStandardMaterial) {
                                            if (mat.color.getHex() === 0xffffff || 
                                                mat.color.r > 0.9 && mat.color.g > 0.9 && mat.color.b > 0.9) {
                                                mat.color.setHex(0x87CEEB); // Sky blue
                                                mat.needsUpdate = true;
                                            }
                                        }
                                    });
                                }
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
    
    /**
     * Load person GLB models from assets folder
     * Expected result: person_0.glb at (-2, 0, 0) and person_1.glb at (2, 0, 0)
     */
    private async loadPersonModels() {
        console.log('🎬 Loading person models from assets folder...');
        const personFiles = ['person_0.glb', 'person_1.glb'];
        const positions = [
            new THREE.Vector3(-2, 0, 0),  // Left side - Y will be adjusted based on model bounds
            new THREE.Vector3(2, 0, 0)   // Right side - Y will be adjusted based on model bounds
        ];
        
        for (let i = 0; i < personFiles.length; i++) {
            const filename = personFiles[i];
            const position = positions[i];
            console.log(`📦 Attempting to load ${filename} at position (${position.x}, ${position.y}, ${position.z})...`);
            
            // Try multiple path variations to handle different server configurations
            // http-server serves from frontend/ directory, so assets are at dist/assets/
            const pathVariations = [
                `./dist/assets/${filename}`,   // Relative from HTML (frontend/dist/assets/)
                `dist/assets/${filename}`,     // Without leading dot
                `/dist/assets/${filename}`,    // Absolute from server root
                `./assets/${filename}`,       // Alternative: direct assets folder
                `assets/${filename}`,          // Fallback
                `../assets/${filename}`        // From root assets folder
            ];
            
            let loaded = false;
            let lastError: Error | null = null;
            
            for (const path of pathVariations) {
                try {
                    console.log(`  🔄 Trying path: ${path}`);
                    await this.loadPersonModel(path, position, filename);
                    console.log(`✅ Successfully loaded ${filename} from ${path}`);
                    loaded = true;
                    break;
                } catch (err) {
                    lastError = err instanceof Error ? err : new Error(String(err));
                    console.log(`  ❌ Failed from ${path}: ${lastError.message}`);
                    continue;
                }
            }
            
            if (!loaded) {
                console.error(`❌ Failed to load ${filename} from all path variations:`);
                pathVariations.forEach(p => console.error(`   - ${p}`));
                console.error(`   Last error: ${lastError?.message || 'Unknown error'}`);
                console.error(`   Make sure the file exists and run: npm run copy-assets`);
                console.error(`   Try accessing directly: ${window.location.origin}/dist/assets/${filename}`);
            }
        }
        
        console.log(`📊 Total loaded models: ${this.loadedModels.size}`);
        this.loadedModels.forEach((model, name) => {
            console.log(`   - ${name}: skeleton=${model.skeleton ? 'Yes' : 'No'}`);
        });
    }
    
    /**
     * Load a person model and store its skeleton for animation
     */
    private async loadPersonModel(
        url: string, 
        position: THREE.Vector3, 
        modelName: string
    ): Promise<void> {
        const loader = new GLTFLoader();
        
        return new Promise<void>((resolve, reject) => {
            loader.load(
                url,
                (gltf: GLTF) => {
                    console.log(`✅ Successfully loaded GLTF for ${modelName}`);
                    const model = gltf.scene as THREE.Group;
                    model.name = modelName;
                    
                    // Calculate bounding box to position model on ground
                    const box = new THREE.Box3().setFromObject(model);
                    const size = box.getSize(new THREE.Vector3());
                    const center = box.getCenter(new THREE.Vector3());
                    
                    // Position model: X and Z from position, Y adjusted so bottom is at ground level
                    model.position.set(
                        position.x,
                        position.y - box.min.y, // Move up so bottom of model is at Y=0
                        position.z
                    );
                    
                    console.log(`📐 Model ${modelName} bounds:`, {
                        size: `(${size.x.toFixed(2)}, ${size.y.toFixed(2)}, ${size.z.toFixed(2)})`,
                        center: `(${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})`,
                        minY: box.min.y.toFixed(2),
                        finalY: model.position.y.toFixed(2)
                    });
                    
                    // Enable shadows and change white materials to a distinct color
                    model.traverse((child: THREE.Object3D) => {
                        if (child instanceof THREE.Mesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            
                            // Change white/very light materials to a distinct color (light blue)
                            if (child.material instanceof THREE.MeshStandardMaterial) {
                                const color = child.material.color;
                                if (color.getHex() === 0xffffff || 
                                    (color.r > 0.9 && color.g > 0.9 && color.b > 0.9)) {
                                    child.material.color.setHex(0x87CEEB); // Sky blue
                                    child.material.needsUpdate = true;
                                    console.log(`🎨 Changed white material to sky blue for ${modelName}`);
                                }
                            } else if (Array.isArray(child.material)) {
                                child.material.forEach((mat: THREE.Material) => {
                                    if (mat instanceof THREE.MeshStandardMaterial) {
                                        const color = mat.color;
                                        if (color.getHex() === 0xffffff || 
                                            (color.r > 0.9 && color.g > 0.9 && color.b > 0.9)) {
                                            mat.color.setHex(0x87CEEB); // Sky blue
                                            mat.needsUpdate = true;
                                            console.log(`🎨 Changed white material to sky blue for ${modelName}`);
                                        }
                                    }
                                });
                            }
                        }
                    });
                    
                    this.scene.add(model);
                    console.log(`✅ Added ${modelName} to scene at position (${model.position.x.toFixed(2)}, ${model.position.y.toFixed(2)}, ${model.position.z.toFixed(2)})`);
                    
                    // Extract skeleton - try multiple methods
                    let skeleton: THREE.Skeleton | null = null;
                    let skinnedMesh: THREE.SkinnedMesh | null = null;
                    const boneObjects: THREE.Object3D[] = [];
                    
                    // Method 1: Look for SkinnedMesh (standard rigged model)
                    gltf.scene.traverse((child) => {
                        if (child instanceof THREE.SkinnedMesh) {
                            skeleton = child.skeleton;
                            skinnedMesh = child;
                        }
                    });
                    
                    // Method 2: If no SkinnedMesh, look for bone meshes (mesh_1 to mesh_85)
                    // Structure: Object3D/HumanMesh, Object3D/joints (mesh_86-173), Object3D/bones (mesh_1-85)
                    if (!skeleton) {
                        console.log(`   🔍 No SkinnedMesh found, searching for bone meshes (mesh_1 to mesh_85)...`);
                        gltf.scene.traverse((child) => {
                            const name = child.name || '';
                            // Look for mesh_1 through mesh_85 (these are the bones)
                            const meshMatch = name.match(/^mesh_(\d+)$/);
                            if (meshMatch) {
                                const meshNum = parseInt(meshMatch[1], 10);
                                if (meshNum >= 1 && meshNum <= 85) {
                                    boneObjects.push(child);
                                }
                            }
                        });
                        
                        console.log(`   📦 Found ${boneObjects.length} bone meshes (mesh_1 to mesh_85)`);
                        if (boneObjects.length > 0) {
                            // Sort by mesh number for easier debugging
                            boneObjects.sort((a, b) => {
                                const aMatch = (a.name || '0').match(/\d+/);
                                const bMatch = (b.name || '0').match(/\d+/);
                                const aNum = parseInt(aMatch?.[0] || '0', 10);
                                const bNum = parseInt(bMatch?.[0] || '0', 10);
                                return aNum - bNum;
                            });
                            console.log(`   🦴 Bone mesh range: ${boneObjects[0]?.name} to ${boneObjects[boneObjects.length - 1]?.name}`);
                            console.log(`   🦴 Sample bones:`, boneObjects.slice(0, 10).map(b => b.name).join(', '));
                        }
                    }
                    
                    // Store model and skeleton
                    const modelData: any = { gltf, skeleton };
                    
                    // If we found bone objects, analyze their structure to identify body parts
                    if (boneObjects.length > 0) {
                        // mesh_1 is likely the root bone (hips/pelvis)
                        const rootBone = boneObjects.find(b => b.name === 'mesh_1') || boneObjects[0];
                        
                        if (rootBone) {
                            console.log(`   🎯 Root bone (likely hips): "${rootBone.name}"`);
                        }
                        
                        // Analyze bone structure to identify likely body parts
                        const boneAnalysis = this.analyzeBoneStructure(boneObjects, rootBone);
                        console.log(`   📊 Bone analysis:`, boneAnalysis);
                        
                        modelData.boneObjects = boneObjects;
                        modelData.rootBone = rootBone;
                        modelData.boneAnalysis = boneAnalysis;
                    }
                    
                    this.loadedModels.set(modelName, modelData);
                    
                    console.log(`✅ Loaded ${modelName} with skeleton:`, skeleton ? 'Yes' : 'No');
                    if (skeleton) {
                        const bones = (skeleton as any).bones as THREE.Bone[] | undefined;
                        if (bones && bones.length > 0) {
                            console.log(`   📊 Total bones: ${bones.length}`);
                            console.log(`   🦴 All bone names:`, bones.map((b: THREE.Bone) => b.name || 'unnamed').join(', '));
                            console.log(`   🔍 Root bones (no parent):`, bones.filter((b: THREE.Bone) => !b.parent || !b.parent.name).map((b: THREE.Bone) => b.name || 'unnamed').join(', '));
                            
                            // Store bone names for easy access
                            (modelData as any).boneNames = bones.map((b: THREE.Bone) => b.name || 'unnamed');
                        } else {
                            console.warn(`   ⚠️ Skeleton has no bones array`);
                        }
                    } else {
                        console.warn(`   ⚠️ No skeleton found in ${modelName}`);
                    }
                    
                    // Apply a simple test animation to get it moving immediately
                    const storedModelName = modelName; // Capture for closure
                    setTimeout(() => {
                        this.applySimpleTestAnimation(storedModelName).catch(err => {
                            console.warn(`Failed to apply test animation to ${storedModelName}:`, err);
                        });
                    }, 500);
                    
                    // Apply default animations after a longer delay
                    setTimeout(() => {
                        this.applyDefaultAnimations(storedModelName).catch(err => {
                            console.warn(`Failed to apply default animations to ${storedModelName}:`, err);
                        });
                    }, 2000);
                    
                    resolve();
                },
                (progress) => {
                    if (progress.total > 0) {
                        const percent = (progress.loaded / progress.total) * 100;
                        console.log(`Loading ${modelName}: ${percent.toFixed(1)}%`);
                    }
                },
                (error: unknown) => {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    console.error(`❌ Failed to load ${modelName} from ${url}:`, errorMsg);
                    reject(new Error(`Failed to load ${modelName} from ${url}: ${errorMsg}`));
                }
            );
        });
    }
    
    /**
     * Get a loaded model by name
     */
    public getLoadedModel(name: string): { gltf: GLTF; skeleton: THREE.Skeleton | null } | null {
        return this.loadedModels.get(name) || null;
    }
    
    /**
     * Get all loaded model names
     */
    public getLoadedModelNames(): string[] {
        return Array.from(this.loadedModels.keys());
    }
    
    /**
     * Set animation generator (injected from main.ts)
     */
    public setAnimationGenerator(generator: AnimationGenerator) {
        this.animationGenerator = generator;
    }
    
    /**
     * Apply animation to a model by name
     * Creates a time-based animation that updates over time
     */
    public async applyAnimationToModel(
        modelName: string,
        animationCode: string,
        duration: number = 2.0
    ): Promise<void> {
        const modelData = this.loadedModels.get(modelName);
        if (!modelData || !modelData.skeleton) {
            throw new Error(`Model ${modelName} not found or has no skeleton`);
        }
        
        if (!this.animationGenerator) {
            throw new Error('Animation generator not initialized');
        }
        
        // Create an animation function that updates over time
        const updateFn = (elapsedTime: number) => {
            // Normalize time to 0-1 for the animation
            const progress = Math.min(elapsedTime / duration, 1.0);
            
            try {
                // Execute the animation code with progress parameter
                const animationFunction = new Function(
                    'skeleton',
                    'THREE',
                    'progress',
                    't',
                    `
                    // Helper function to get bone by name
                    skeleton.getBoneByName = function(name) {
                        if (!this.bones) return null;
                        for (let i = 0; i < this.bones.length; i++) {
                            if (this.bones[i].name === name) {
                                return this.bones[i];
                            }
                        }
                        return null;
                    };
                    
                    // Helper for smooth interpolation
                    const easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                    const smoothT = easeInOut(progress);
                    
                    ${animationCode}
                    
                    // Update skeleton matrices after bone changes
                    if (skeleton.bones && skeleton.bones.length > 0) {
                        skeleton.bones.forEach(bone => {
                            bone.updateMatrixWorld(true);
                        });
                    }
                    `
                );
                
                animationFunction(
                    modelData.skeleton,
                    THREE,
                    progress,
                    progress
                );
                
                // Force skeleton update
                if (modelData.skeleton) {
                    (modelData.skeleton as any).update();
                }
            } catch (error) {
                console.warn(`Error executing animation code for ${modelName}:`, error);
            }
        };
        
        // Store the active animation
        this.activeAnimations.set(modelName, {
            code: animationCode,
            startTime: this.clock.getElapsedTime(),
            duration: duration,
            updateFn: updateFn
        });
        
        console.log(`🎬 Animation applied to ${modelName} (duration: ${duration}s)`);
    }
    
    /**
     * Load Rocket model (realistic 3D model) from CDN
     */
    private async loadRocketModel(): Promise<void> {
        // Using working glTF sample model URLs from reliable CDNs
        const modelUrls = [
            // Try Three.js examples (most reliable)
            'https://threejs.org/examples/models/gltf/DamagedHelmet/DamagedHelmet.glb',
            'https://threejs.org/examples/models/gltf/FlightHelmet/FlightHelmet.glb',
            // Try jsDelivr CDN with specific version
            'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/models/gltf/DamagedHelmet/DamagedHelmet.glb',
            'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/models/gltf/FlightHelmet/FlightHelmet.glb',
            // Try unpkg CDN
            'https://unpkg.com/three@0.160.0/examples/models/gltf/DamagedHelmet/DamagedHelmet.glb',
            // Final fallback: Duck model from known working source
            'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb'
        ];
        
        const position = new THREE.Vector3(0, 0, 2); // Center, in front
        
        console.log('🚀 Loading Rocket/Realistic model from CDN...');
        
        let loaded = false;
        for (const rocketUrl of modelUrls) {
            try {
                console.log(`   🔄 Trying: ${rocketUrl.split('/').pop()}`);
                const loader = new GLTFLoader();
                const gltf = await new Promise<GLTF>((resolve, reject) => {
                    loader.load(
                        rocketUrl,
                        (gltf) => resolve(gltf),
                        undefined,
                        (error) => reject(error)
                    );
                });
                
                const model = gltf.scene as THREE.Group;
                
                // Calculate bounding box to position on ground
                const box = new THREE.Box3().setFromObject(model);
                const size = box.getSize(new THREE.Vector3());
                const maxSize = Math.max(size.x, size.y, size.z);
                const scale = maxSize > 0 ? 2 / maxSize : 1; // Scale to roughly 2 units
                
                model.position.set(
                    position.x,
                    position.y - box.min.y * scale + 0.5, // Position on ground with slight elevation
                    position.z
                );
                model.scale.set(scale, scale, scale);
                model.name = 'Rocket';
                
                // Enable shadows and enhance materials
                model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        // Enhance material for realism
                        if (child.material instanceof THREE.MeshStandardMaterial) {
                            child.material.metalness = 0.8;
                            child.material.roughness = 0.2;
                        }
                    }
                });
                
                this.scene.add(model);
                
                // Add a subtle rotation animation
                const startTime = this.clock.getElapsedTime();
                this.activeAnimations.set('rocket_rotation', {
                    code: '// Rocket rotation',
                    startTime: startTime,
                    duration: 999999,
                    updateFn: (elapsed: number) => {
                        const time = this.clock.getElapsedTime() - startTime;
                        model.rotation.y = time * 0.2; // Slow rotation
                    }
                });
                
                console.log(`✅ Model loaded successfully: ${rocketUrl.split('/').pop()}`);
                loaded = true;
                break;
                
            } catch (error) {
                console.log(`   ⚠️ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                continue;
            }
        }
        
        if (!loaded) {
            console.warn('⚠️ Could not load any model from CDN. All URLs failed.');
        }
    }
    
    /**
     * Load RiggedFigure (white character with moving arms) from CDN
     */
    private async loadRiggedFigure(): Promise<void> {
        const riggedFigureUrl = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/RiggedFigure/glTF-Binary/RiggedFigure.glb';
        const position = new THREE.Vector3(0, 0, -2); // Center, slightly back
        
        console.log('🎭 Loading RiggedFigure (white character) from CDN...');
        
        try {
            const loader = new GLTFLoader();
            const gltf = await new Promise<GLTF>((resolve, reject) => {
                loader.load(
                    riggedFigureUrl,
                    (gltf) => resolve(gltf),
                    undefined,
                    (error) => reject(error)
                );
            });
            
            const model = gltf.scene as THREE.Group;
            
            // Calculate bounding box to position on ground
            const box = new THREE.Box3().setFromObject(model);
            model.position.set(
                position.x,
                position.y - box.min.y, // Position on ground
                position.z
            );
            model.name = 'RiggedFigure';
            
            // Enable shadows
            model.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            this.scene.add(model);
            
            // Play animation if available
            if (gltf.animations && gltf.animations.length > 0) {
                const mixer = new THREE.AnimationMixer(model);
                const action = mixer.clipAction(gltf.animations[0]);
                action.play();
                this.mixers.push(mixer);
                console.log(`✅ RiggedFigure loaded with ${gltf.animations.length} animation(s)`);
            } else {
                console.log('✅ RiggedFigure loaded (no animations)');
            }
            
        } catch (error) {
            console.warn('⚠️ Failed to load RiggedFigure:', error instanceof Error ? error.message : error);
        }
    }
    
    /**
     * Analyze bone structure to identify likely body parts based on hierarchy and position
     */
    private analyzeBoneStructure(bones: THREE.Object3D[], rootBone: THREE.Object3D): any {
        const analysis: any = {
            root: rootBone.name,
            likelyArms: [] as string[],
            likelyLegs: [] as string[],
            likelySpine: [] as string[],
            likelyHead: [] as string[],
            hierarchy: {} as Record<string, any>
        };
        
        // Get world positions of bones relative to root
        const rootWorldPos = new THREE.Vector3();
        rootBone.getWorldPosition(rootWorldPos);
        
        bones.forEach(bone => {
            const worldPos = new THREE.Vector3();
            bone.getWorldPosition(worldPos);
            const relativePos = worldPos.clone().sub(rootWorldPos);
            
            const meshMatch = (bone.name || '').match(/^mesh_(\d+)$/);
            if (!meshMatch) return;
            
            const meshNum = parseInt(meshMatch[1], 10);
            const boneInfo: any = {
                name: bone.name,
                number: meshNum,
                position: relativePos,
                children: [] as string[],
                depth: 0
            };
            
            // Find children
            bone.children.forEach(child => {
                const childName = child.name || '';
                const childMatch = childName.match(/^mesh_(\d+)$/);
                if (childMatch) {
                    const childNum = parseInt(childMatch[1], 10);
                    if (childNum >= 1 && childNum <= 85) {
                        boneInfo.children.push(childName);
                    }
                }
            });
            
            // Calculate depth (distance from root in hierarchy)
            let depth = 0;
            let current: THREE.Object3D | null = bone;
            while (current && current !== rootBone) {
                depth++;
                current = current.parent as THREE.Object3D | null;
            }
            boneInfo.depth = depth;
            
            // Identify likely body parts based on position and hierarchy
            const y = relativePos.y;
            const x = Math.abs(relativePos.x);
            const z = Math.abs(relativePos.z);
            
            // Likely arms: higher Y, significant X offset, depth 2-4
            if (y > 0.3 && x > 0.2 && depth >= 2 && depth <= 4) {
                analysis.likelyArms.push(bone.name);
            }
            
            // Likely legs: lower Y, depth 1-3
            if (y < -0.1 && depth >= 1 && depth <= 3) {
                analysis.likelyLegs.push(bone.name);
            }
            
            // Likely spine: near center (low X/Z), positive Y, depth 1-3
            if (x < 0.1 && z < 0.1 && y > 0 && depth >= 1 && depth <= 3) {
                analysis.likelySpine.push(bone.name);
            }
            
            // Likely head: highest Y, depth 3-5
            if (y > 1.0 && depth >= 3) {
                analysis.likelyHead.push(bone.name);
            }
            
            analysis.hierarchy[bone.name] = boneInfo;
        });
        
        return analysis;
    }
    
    /**
     * Apply a simple test animation to verify the animation system works
     * This creates a simple waving motion that should work on any rigged character
     */
    private async applySimpleTestAnimation(modelName: string): Promise<void> {
        const modelData = this.loadedModels.get(modelName);
        if (!modelData) {
            console.warn(`Cannot apply test animation: ${modelName} not found`);
            return;
        }
        
        // Try to get bones from skeleton first
        let bones: THREE.Bone[] | THREE.Object3D[] | undefined = undefined;
        let skeleton: THREE.Skeleton | null = modelData.skeleton;
        
        if (skeleton) {
            bones = (skeleton as any).bones as THREE.Bone[] | undefined;
        }
        
        // If no skeleton, try to use bone objects from Object3D hierarchy
        if ((!bones || bones.length === 0) && (modelData as any).boneObjects) {
            console.log(`   🔄 Using Object3D bone objects instead of skeleton`);
            bones = (modelData as any).boneObjects as THREE.Object3D[];
        }
        
        if (!bones || bones.length === 0) {
            console.warn(`No bones found for test animation on ${modelName}`);
            return;
        }
        
        console.log(`🎬 Applying simple test animation to ${modelName}...`);
        
        // Use bone analysis to find a good bone to animate
        const boneAnalysis = (modelData as any).boneAnalysis;
        let armBone: THREE.Bone | THREE.Object3D | null = null;
        let boneName = '';
        
        // First, try to use bone analysis to find likely arm bones
        if (boneAnalysis && boneAnalysis.likelyArms && boneAnalysis.likelyArms.length > 0) {
            // Use the first likely arm bone
            const armBoneName = boneAnalysis.likelyArms[0];
            armBone = bones.find(b => b.name === armBoneName) as THREE.Bone | THREE.Object3D | null;
            boneName = armBoneName;
            console.log(`   🎯 Using bone analysis - found likely arm: "${boneName}"`);
        }
        
        // Fallback: try bones in the 15-35 range (likely arms based on typical rigging)
        if (!armBone && bones.length > 10) {
            for (let i = 0; i < bones.length; i++) {
                const bone = bones[i];
                const meshMatch = (bone.name || '').match(/^mesh_(\d+)$/);
                if (meshMatch) {
                    const meshNum = parseInt(meshMatch[1], 10);
                    // Prefer bones in the 15-35 range (likely arms)
                    if (meshNum >= 15 && meshNum <= 35) {
                        armBone = bone as THREE.Bone | THREE.Object3D;
                        boneName = bone.name || 'unnamed';
                        break;
                    }
                }
            }
        }
        
        // Final fallback: use any bone that's not root
        if (!armBone) {
            const rootBone = (modelData as any).rootBone;
            armBone = bones.find(b => b !== rootBone) || bones[Math.min(10, bones.length - 1)];
            boneName = armBone?.name || 'unknown';
        }
        
        if (!armBone) {
            console.warn(`Could not find suitable bone for test animation on ${modelName}`);
            console.log(`   Available bones:`, bones.slice(0, 10).map(b => b.name || 'unnamed').join(', '));
            return;
        }
        
        console.log(`   ✅ Using bone: "${boneName}" for test animation`);
        
        // Create a simple animation that moves MULTIPLE bones to make it obvious
        const startTime = this.clock.getElapsedTime();
        const animationDuration = 999999; // Run forever
        
        // Get a few bones to animate (not just one)
        const bonesToAnimate = bones.slice(0, Math.min(10, bones.length)); // Animate first 10 bones
        console.log(`   🎬 Animating ${bonesToAnimate.length} bones:`, bonesToAnimate.map(b => b.name).join(', '));
        
        const testAnimation = {
            code: `// Simple test animation - move multiple bones`,
            startTime: startTime,
            duration: animationDuration,
            updateFn: (elapsed: number) => {
                const time = this.clock.getElapsedTime() - startTime;
                
                // Animate multiple bones with different patterns
                bonesToAnimate.forEach((bone, index) => {
                    if (!bone) return;
                    
                    // Different bones move in different patterns
                    const phase = (index / bonesToAnimate.length) * Math.PI * 2;
                    const waveAmount = Math.sin(time * 2 + phase) * 0.5;
                    const waveAmount2 = Math.cos(time * 1.5 + phase) * 0.3;
                    
                    // Rotate around different axes
                    bone.rotation.z = waveAmount;
                    bone.rotation.x = waveAmount2;
                    bone.rotation.y = Math.sin(time * 1.2 + phase) * 0.2;
                    
                    // Update bone matrix
                    bone.updateMatrixWorld(true);
                });
                
                // Also try rotating the entire model slightly
                const modelGroup = this.scene.getObjectByName(modelName);
                if (modelGroup) {
                    modelGroup.rotation.y = Math.sin(time * 0.5) * 0.1; // Slight rotation
                }
            }
        };
        
        // Store the animation
        this.activeAnimations.set(modelName + '_test', testAnimation);
        
        console.log(`✅ Test animation applied to ${modelName} - ${bonesToAnimate.length} bones should be moving!`);
    }
    
    /**
     * Apply default animations to a character based on their model name
     * Applies the first animation as default pose and stores all for later use
     */
    private async applyDefaultAnimations(modelName: string): Promise<void> {
        if (!this.animationGenerator) {
            console.warn('Animation generator not ready yet, skipping default animations');
            return;
        }
        
        const modelData = this.loadedModels.get(modelName);
        if (!modelData || !modelData.skeleton) {
            console.warn(`Cannot apply default animations: ${modelName} has no skeleton`);
            return;
        }
        
        // Define default animations for each character
        const defaultAnimations: Record<string, string[]> = {
            'person_0.glb': ['wave hello', 'stand idle', 'do the splits'],
            'person_1.glb': ['sit down', 'stretch', 'jump']
        };
        
        const animations = defaultAnimations[modelName];
        if (!animations || animations.length === 0) {
            return;
        }
        
        console.log(`🎬 Setting up default animations for ${modelName}:`, animations);
        
        // Store animations for later access
        (modelData as any).defaultAnimations = animations;
        (modelData as any).currentAnimationIndex = 0;
        
        // Apply the first animation as the initial pose
        try {
            const firstAnimation = animations[0];
            console.log(`  Applying initial animation: "${firstAnimation}"`);
            
            // Extract bone structure
            const boneStructure = this.animationGenerator.extractBoneStructure(modelData.gltf);
            if (boneStructure.length === 0) {
                console.warn(`  No bones found for ${modelName}, skipping animation`);
                return;
            }
            
            // Generate and apply animation
            const result = await this.animationGenerator.generateAnimation(
                boneStructure,
                firstAnimation
            );
            
            if (result.code) {
                await this.applyAnimationToModel(modelName, result.code);
                console.log(`  ✓ Applied "${firstAnimation}" to ${modelName}`);
            }
        } catch (error) {
            console.warn(`  Failed to apply default animation to ${modelName}:`, error);
        }
        (modelData as any).defaultAnimations = animations;
        (modelData as any).currentAnimationIndex = 0;
        
        // Apply the first animation as the default pose
        try {
            const boneStructure = this.animationGenerator.extractBoneStructure(modelData.gltf);
            
            if (boneStructure.length === 0) {
                console.warn(`No bones found in ${modelName}, skipping default animations`);
                return;
            }
            
            const firstAnimation = animations[0];
            const result = await this.animationGenerator.generateAnimation(
                boneStructure,
                firstAnimation
            );
            
            if (result.code) {
                // Apply animation with duration for smooth movement
                await this.applyAnimationToModel(modelName, result.code, 2.0);
                console.log(`✓ Applied default animation "${firstAnimation}" to ${modelName}`);
            }
        } catch (error) {
            console.error(`Failed to apply default animation to ${modelName}:`, error);
        }
    }
    
    /**
     * Get default animations for a model
     */
    public getDefaultAnimations(modelName: string): string[] {
        const modelData = this.loadedModels.get(modelName);
        if (!modelData) {
            return [];
        }
        return (modelData as any).defaultAnimations || [];
    }
    
    /**
     * Apply a specific default animation by index
     */
    public async applyDefaultAnimation(modelName: string, animationIndex: number): Promise<void> {
        const modelData = this.loadedModels.get(modelName);
        if (!modelData || !modelData.skeleton || !this.animationGenerator) {
            throw new Error(`Model ${modelName} not found or animation generator not ready`);
        }
        
        const animations = (modelData as any).defaultAnimations;
        if (!animations || animationIndex < 0 || animationIndex >= animations.length) {
            throw new Error(`Invalid animation index ${animationIndex} for ${modelName}`);
        }
        
        const animationPrompt = animations[animationIndex];
        const boneStructure = this.animationGenerator.extractBoneStructure(modelData.gltf);
        const result = await this.animationGenerator.generateAnimation(
            boneStructure,
            animationPrompt
        );
        
        if (result.code) {
            this.animationGenerator.executeAnimationCode(
                result.code,
                modelData.skeleton,
                THREE
            );
            (modelData as any).currentAnimationIndex = animationIndex;
            console.log(`Applied default animation "${animationPrompt}" (index ${animationIndex}) to ${modelName}`);
        }
    }
}

export interface SceneConfig {
    backgroundColor?: string;
    groundColor?: string;
    characterPrompt?: string;
}

