import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CameraController } from './camera-controller.js';
import { WebXRManager } from './webxr-manager.js';

export class SceneManager {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private character: THREE.Group | null = null;
    private cameraController: CameraController | null = null;
    private webXRManager: WebXRManager | null = null;
    
    constructor(container: HTMLElement) {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        
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
        this.renderer.domElement.style.cursor = 'crosshair';
        container.appendChild(this.renderer.domElement);
        
        // Initialize WebXR
        this.webXRManager = new WebXRManager(this.renderer, this.camera, this.scene);
        this.webXRManager.initWebXR().then(supported => {
            if (supported) {
                console.log('WebXR initialized');
            }
        });
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(20, 20);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x90EE90 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.name = 'ground';
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Simple character placeholder (cube for now)
        this.createPlaceholderCharacter();
        
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
        
        // Rotate character slowly (for visual feedback)
        if (this.character) {
            this.character.rotation.y += 0.005;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    public getCharacter(): THREE.Group | null {
        return this.character;
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
}

export interface SceneConfig {
    backgroundColor?: string;
    groundColor?: string;
    characterPrompt?: string;
}

