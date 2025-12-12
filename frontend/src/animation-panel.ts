/**
 * Animation Panel UI
 * Allows users to generate animations via text prompts
 */

import { SceneManager } from './scene.js';
import { AnimationGenerator } from './animation-generator.js';
import { APIClient } from './api.js';

export class AnimationPanel {
    private panel!: HTMLDivElement;
    private sceneManager: SceneManager;
    private animationGenerator: AnimationGenerator;
    private isOpen: boolean = false;
    
    constructor(sceneManager: SceneManager, animationGenerator: AnimationGenerator) {
        this.sceneManager = sceneManager;
        this.animationGenerator = animationGenerator;
        this.createPanel();
    }
    
    private createPanel() {
        // Create animation button
        const animBtn = document.createElement('button');
        animBtn.textContent = '🎬 Animate';
        animBtn.style.cssText = `
            position: absolute;
            top: 20px;
            left: 20px;
            z-index: 200;
            padding: 10px 15px;
            background: #FF5722;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
        `;
        animBtn.addEventListener('click', () => this.toggle());
        document.body.appendChild(animBtn);
        
        // Create panel
        this.panel = document.createElement('div');
        this.panel.style.cssText = `
            position: absolute;
            top: 60px;
            left: 20px;
            width: 400px;
            max-height: 80vh;
            background: rgba(0, 0, 0, 0.95);
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 200;
            overflow-y: auto;
            display: none;
            border: 2px solid #FF5722;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        `;
        
        this.panel.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h2 style="margin: 0 0 10px 0; color: #FF5722;">🎬 Animation Generator</h2>
                <p style="margin: 0; color: #aaa; font-size: 12px;">
                    Generate custom body movements using AI. Describe the motion you want!
                </p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: bold;">
                    Select Character:
                </label>
                <select id="character-select" style="width: 100%; padding: 8px; background: #1a1a1a; color: white; border: 2px solid #555; border-radius: 5px;">
                    <option value="">Loading models...</option>
                </select>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: bold;">
                    Animation Prompt:
                </label>
                <textarea id="animation-prompt" rows="4" style="width: 100%; padding: 10px; background: #1a1a1a; color: white; border: 2px solid #555; border-radius: 5px; font-family: inherit; resize: vertical;" placeholder="E.g., do the splits slowly and gracefully, wave hello, jump up and down, sit down, stand up and stretch"></textarea>
            </div>
            
            <button id="generate-animation" style="width: 100%; padding: 12px; background: #FF5722; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 16px; margin-bottom: 15px;">
                ✨ Generate Animation
            </button>
            
            <div id="animation-status" style="margin-bottom: 15px; padding: 10px; background: #2a2a2a; border-radius: 5px; display: none;">
                <div id="status-text" style="color: #FFC107;"></div>
            </div>
            
            <div id="animation-result" style="display: none; margin-bottom: 15px;">
                <div style="padding: 10px; background: #2a2a2a; border-radius: 5px; margin-bottom: 10px;">
                    <strong style="color: #4CAF50;">✓ Animation Generated!</strong>
                    <button id="apply-animation" style="margin-left: 10px; padding: 5px 10px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer;">
                        Apply to Character
                    </button>
                </div>
                <details style="margin-top: 10px;">
                    <summary style="cursor: pointer; color: #2196F3;">View Generated Code</summary>
                    <pre id="generated-code" style="background: #1a1a1a; padding: 10px; border-radius: 5px; overflow-x: auto; font-size: 11px; margin-top: 5px; max-height: 200px; overflow-y: auto;"></pre>
                </details>
            </div>
            
            <div style="background: #1a1a1a; padding: 15px; border-radius: 5px; border: 1px solid #555; margin-top: 20px;">
                <h4 style="margin-top: 0; color: #FFC107;">💡 Examples</h4>
                <ul style="margin: 0; padding-left: 20px; line-height: 1.8; font-size: 12px;">
                    <li>"do the splits slowly and gracefully"</li>
                    <li>"wave hello with right hand"</li>
                    <li>"jump up and down three times"</li>
                    <li>"sit down in a chair"</li>
                    <li>"stand up and stretch arms overhead"</li>
                    <li>"do a backflip"</li>
                </ul>
            </div>
            
            <button id="close-animation-panel" style="position: absolute; top: 10px; right: 10px; background: #f44336; color: white; border: none; border-radius: 3px; padding: 5px 10px; cursor: pointer; font-size: 12px;">
                ✕
            </button>
        `;
        
        document.body.appendChild(this.panel);
        
        // Event listeners
        const generateBtn = this.panel.querySelector('#generate-animation') as HTMLButtonElement;
        generateBtn.addEventListener('click', () => this.handleGenerate());
        
        const applyBtn = this.panel.querySelector('#apply-animation') as HTMLButtonElement;
        applyBtn.addEventListener('click', () => this.handleApply());
        
        const closeBtn = this.panel.querySelector('#close-animation-panel') as HTMLButtonElement;
        closeBtn.addEventListener('click', () => this.toggle());
        
        const promptInput = this.panel.querySelector('#animation-prompt') as HTMLTextAreaElement;
        promptInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.handleGenerate();
            }
        });
        
        // Load model names
        this.updateModelList();
    }
    
    private updateModelList() {
        const select = this.panel.querySelector('#character-select') as HTMLSelectElement;
        const modelNames = this.sceneManager.getLoadedModelNames();
        
        select.innerHTML = '';
        if (modelNames.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No models loaded';
            select.appendChild(option);
        } else {
            modelNames.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                select.appendChild(option);
            });
        }
    }
    
    private toggle() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.panel.style.display = 'block';
            this.updateModelList();
        } else {
            this.panel.style.display = 'none';
        }
    }
    
    private async handleGenerate() {
        const select = this.panel.querySelector('#character-select') as HTMLSelectElement;
        const promptInput = this.panel.querySelector('#animation-prompt') as HTMLTextAreaElement;
        const statusDiv = this.panel.querySelector('#animation-status') as HTMLDivElement;
        const statusText = this.panel.querySelector('#status-text') as HTMLDivElement;
        const resultDiv = this.panel.querySelector('#animation-result') as HTMLDivElement;
        
        const modelName = select.value;
        const prompt = promptInput.value.trim();
        
        if (!modelName) {
            alert('Please select a character');
            return;
        }
        
        if (!prompt) {
            alert('Please enter an animation prompt');
            return;
        }
        
        // Show status
        statusDiv.style.display = 'block';
        statusText.textContent = 'Extracting bone structure...';
        resultDiv.style.display = 'none';
        
        try {
            // Get model
            const modelData = this.sceneManager.getLoadedModel(modelName);
            if (!modelData) {
                throw new Error(`Model ${modelName} not found`);
            }
            
            // Extract bone structure
            statusText.textContent = 'Extracting bone structure from model...';
            const boneStructure = this.animationGenerator.extractBoneStructure(modelData.gltf);
            
            if (boneStructure.length === 0) {
                throw new Error('No bones found in model. Make sure the model is rigged.');
            }
            
            statusText.textContent = `Found ${boneStructure.length} bones. Generating animation code...`;
            
            // Generate animation
            const result = await this.animationGenerator.generateAnimation(
                boneStructure,
                prompt
            );
            
            if (!result.code) {
                throw new Error('Failed to generate animation code');
            }
            
            // Show result
            statusText.textContent = `✓ Animation code generated! (${result.code.length} characters)`;
            statusText.style.color = '#4CAF50';
            
            const codePre = this.panel.querySelector('#generated-code') as HTMLPreElement;
            codePre.textContent = result.code;
            
            resultDiv.style.display = 'block';
            (resultDiv as any).dataset.modelName = modelName;
            (resultDiv as any).dataset.animationCode = result.code;
            
        } catch (error) {
            statusText.textContent = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
            statusText.style.color = '#f44336';
            console.error('Animation generation error:', error);
        }
    }
    
    private async handleApply() {
        const resultDiv = this.panel.querySelector('#animation-result') as HTMLDivElement;
        const modelName = (resultDiv as any).dataset.modelName;
        const animationCode = (resultDiv as any).dataset.animationCode;
        
        if (!modelName || !animationCode) {
            alert('No animation to apply');
            return;
        }
        
        try {
            await this.sceneManager.applyAnimationToModel(modelName, animationCode);
            alert(`Animation applied to ${modelName}!`);
        } catch (error) {
            alert(`Failed to apply animation: ${error instanceof Error ? error.message : 'Unknown error'}`);
            console.error('Animation apply error:', error);
        }
    }
}
