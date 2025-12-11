import * as THREE from 'three';

export class CameraController {
    private camera: THREE.PerspectiveCamera;
    private moveSpeed: number = 0.1;
    private rotationSpeed: number = 0.002;
    
    // Movement state
    private keys: Set<string> = new Set();
    private isPointerLocked: boolean = false;
    
    // Rotation state
    private euler: THREE.Euler = new THREE.Euler(0, 0, 0, 'YXZ');
    private pitch: number = 0;
    private yaw: number = 0;
    
    constructor(camera: THREE.PerspectiveCamera) {
        this.camera = camera;
        this.setupControls();
    }
    
    private setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys.add(e.key.toLowerCase());
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys.delete(e.key.toLowerCase());
        });
        
        // Mouse controls (click to lock pointer)
        const canvas = document.body;
        
        document.addEventListener('click', () => {
            if (!this.isPointerLocked && canvas.requestPointerLock) {
                canvas.requestPointerLock();
            }
        });
        
        // Pointer lock change
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement !== null;
        });
        
        // Escape to unlock
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPointerLocked) {
                document.exitPointerLock();
            }
        });
        
        // Mouse movement for rotation
        document.addEventListener('mousemove', (e) => {
            if (this.isPointerLocked) {
                this.yaw -= e.movementX * this.rotationSpeed;
                this.pitch -= e.movementY * this.rotationSpeed;
                
                // Limit pitch to avoid flipping
                this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
                
                this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
            }
        });
    }
    
    public update() {
        // Don't move if typing in input field
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            return;
        }
        
        if (!this.isPointerLocked) return;
        
        const direction = new THREE.Vector3();
        const right = new THREE.Vector3();
        const forward = new THREE.Vector3();
        
        // Get camera direction (forward)
        this.camera.getWorldDirection(forward);
        forward.y = 0; // Keep movement horizontal
        forward.normalize();
        
        // Get right vector
        right.crossVectors(forward, this.camera.up).normalize();
        
        // Movement based on keys
        const moveVector = new THREE.Vector3();
        
        // WASD or Arrow keys
        if (this.keys.has('w') || this.keys.has('arrowup')) {
            moveVector.add(forward);
        }
        if (this.keys.has('s') || this.keys.has('arrowdown')) {
            moveVector.sub(forward);
        }
        if (this.keys.has('a') || this.keys.has('arrowleft')) {
            moveVector.sub(right);
        }
        if (this.keys.has('d') || this.keys.has('arrowright')) {
            moveVector.add(right);
        }
        
        // Normalize and apply speed
        if (moveVector.length() > 0) {
            moveVector.normalize();
            moveVector.multiplyScalar(this.moveSpeed);
            this.camera.position.add(moveVector);
        }
    }
    
    public getCamera(): THREE.PerspectiveCamera {
        return this.camera;
    }
}

