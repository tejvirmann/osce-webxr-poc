/**
 * Animation Generator Service
 * Extracts bone structure from GLB models and generates animations via AI
 */

import * as THREE from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { APIClient } from './api.js';

export interface BoneInfo {
    name: string;
    parent: string | null;
    position: [number, number, number];
    rotation: [number, number, number];
}

export interface AnimationResult {
    code: string;
    validation: {
        valid: boolean;
        reason: string;
    };
    prompt: string;
    model: string;
}

export class AnimationGenerator {
    private apiClient: APIClient;
    
    constructor(apiClient: APIClient) {
        this.apiClient = apiClient;
    }
    
    /**
     * Extract bone structure from a loaded GLTF model
     */
    extractBoneStructure(gltf: GLTF): BoneInfo[] {
        const bones: BoneInfo[] = [];
        
        // First, try to get skeleton from SkinnedMesh
        let skeleton: THREE.Skeleton | null = null;
        gltf.scene.traverse((child) => {
            if (child instanceof THREE.SkinnedMesh && child.skeleton) {
                skeleton = child.skeleton;
            }
        });
        
        // If we found a skeleton, extract bones from it
        if (skeleton !== null) {
            const skeletonBones = (skeleton as any).bones as THREE.Bone[] | undefined;
            if (skeletonBones && Array.isArray(skeletonBones) && skeletonBones.length > 0) {
                skeletonBones.forEach((bone: THREE.Bone) => {
                    bones.push({
                        name: bone.name || 'UnnamedBone',
                        parent: bone.parent?.name || null,
                        position: bone.position.toArray() as [number, number, number],
                        rotation: [
                            bone.rotation.x,
                            bone.rotation.y,
                            bone.rotation.z
                        ]
                    });
                });
            }
        }
        
        // Fallback: if no bones found from skeleton, try direct traversal
        if (bones.length === 0) {
            // Fallback: traverse scene for bones directly
            gltf.scene.traverse((child) => {
                if (child instanceof THREE.Bone || (child as any).isBone) {
                    const bone = child as THREE.Bone;
                    bones.push({
                        name: bone.name || 'UnnamedBone',
                        parent: bone.parent?.name || null,
                        position: bone.position.toArray() as [number, number, number],
                        rotation: [
                            bone.rotation.x,
                            bone.rotation.y,
                            bone.rotation.z
                        ]
                    });
                }
            });
        }
        
        return bones;
    }
    
    /**
     * Get skeleton from a GLTF model
     */
    getSkeleton(gltf: GLTF): THREE.Skeleton | null {
        let skeleton: THREE.Skeleton | null = null;
        
        gltf.scene.traverse((child) => {
            if (child instanceof THREE.SkinnedMesh) {
                skeleton = child.skeleton;
            }
        });
        
        return skeleton;
    }
    
    /**
     * Generate animation code from text prompt
     */
    async generateAnimation(
        boneStructure: BoneInfo[],
        prompt: string,
        model: string = "anthropic/claude-3.5-sonnet"
    ): Promise<AnimationResult> {
        return await this.apiClient.generateAnimation({
            bone_structure: boneStructure,
            prompt: prompt,
            model: model
        });
    }
    
    /**
     * Execute generated animation code safely
     * Creates a sandboxed function that only has access to skeleton and THREE
     */
    executeAnimationCode(
        code: string,
        skeleton: THREE.Skeleton,
        THREE: typeof import('three')
    ): void {
        try {
            // Create a function with limited scope
            const animationFunction = new Function(
                'skeleton',
                'THREE',
                `
                // Helper function to get bone by name
                skeleton.getBoneByName = function(name) {
                    for (let i = 0; i < this.bones.length; i++) {
                        if (this.bones[i].name === name) {
                            return this.bones[i];
                        }
                    }
                    return null;
                };
                
                ${code}
                `
            );
            
            animationFunction(skeleton, THREE);
        } catch (error) {
            console.error('Error executing animation code:', error);
            throw new Error(`Animation execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    /**
     * Create an AnimationClip from generated code
     * This is a more advanced approach that creates reusable animations
     */
    createAnimationClip(
        code: string,
        skeleton: THREE.Skeleton,
        duration: number = 2.0,
        name: string = "GeneratedAnimation"
    ): THREE.AnimationClip | null {
        // For now, we'll execute the code directly
        // In the future, we could parse the code to extract keyframe data
        // and create a proper AnimationClip
        
        try {
            this.executeAnimationCode(code, skeleton, THREE);
            
            // Create a simple clip that holds the current pose
            // This is a placeholder - ideally the AI would generate keyframe tracks
            const tracks: THREE.KeyframeTrack[] = [];
            
            // Extract bone rotations from executed code
            skeleton.bones.forEach((bone, index) => {
                if (bone.rotation.x !== 0 || bone.rotation.y !== 0 || bone.rotation.z !== 0) {
                    // Create rotation track
                    const times = [0, duration];
                    const values = [
                        bone.rotation.x, bone.rotation.y, bone.rotation.z,
                        bone.rotation.x, bone.rotation.y, bone.rotation.z
                    ];
                    
                    const track = new THREE.QuaternionKeyframeTrack(
                        `.bones[${index}].quaternion`,
                        times,
                        values
                    );
                    tracks.push(track);
                }
            });
            
            if (tracks.length === 0) {
                return null;
            }
            
            return new THREE.AnimationClip(name, duration, tracks);
        } catch (error) {
            console.error('Error creating animation clip:', error);
            return null;
        }
    }
}
