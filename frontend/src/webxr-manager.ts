import * as THREE from 'three';

export class WebXRManager {
    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera;
    private scene: THREE.Scene;
    private controller1: THREE.XRTargetRaySpace | null = null;
    private controller2: THREE.XRTargetRaySpace | null = null;
    private isVRSession: boolean = false;
    
    constructor(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
        this.renderer = renderer;
        this.camera = camera;
        this.scene = scene;
    }
    
    public async initWebXR(): Promise<boolean> {
        if (!navigator.xr) {
            console.warn('WebXR not supported');
            return false;
        }
        
        // Enable WebXR
        this.renderer.xr.enabled = true;
        
        // Set up controllers
        this.controller1 = this.renderer.xr.getController(0);
        this.controller2 = this.renderer.xr.getController(1);
        
        // Add controller models (simple visualization)
        this.setupController(this.controller1);
        this.setupController(this.controller2);
        
        return true;
    }
    
    private setupController(controller: THREE.XRTargetRaySpace) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -1)
        ]);
        
        const line = new THREE.Line(geometry);
        line.name = 'line';
        line.scale.z = 5;
        
        controller.add(line);
        this.scene.add(controller);
    }
    
    public async enterVR(): Promise<void> {
        if (!navigator.xr) {
            alert('WebXR not supported on this device');
            return;
        }
        
        try {
            const supported = await navigator.xr.isSessionSupported('immersive-vr');
            if (!supported) {
                alert('VR not supported on this device');
                return;
            }
            
            const session = await navigator.xr.requestSession('immersive-vr', {
                requiredFeatures: ['local-floor'],
                optionalFeatures: ['hand-tracking', 'bounded-floor']
            });
            
            this.isVRSession = true;
            this.renderer.xr.setSession(session);
            
            console.log('Entered VR mode');
        } catch (error) {
            console.error('Failed to enter VR:', error);
            alert('Failed to enter VR. Make sure you have a VR headset connected.');
        }
    }
    
    public exitVR(): void {
        const session = this.renderer.xr.getSession();
        if (session) {
            session.end();
            this.isVRSession = false;
        }
    }
    
    public isVRActive(): boolean {
        return this.isVRSession;
    }
}

