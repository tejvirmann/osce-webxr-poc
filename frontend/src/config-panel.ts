import { SceneManager, SceneConfig } from './scene.js';
import { APIClient } from './api.js';

export class ConfigPanel {
    private panel!: HTMLDivElement;
    private sceneManager: SceneManager;
    private apiClient: APIClient;
    private isOpen: boolean = false;
    
    constructor(sceneManager: SceneManager, apiClient: APIClient) {
        this.sceneManager = sceneManager;
        this.apiClient = apiClient;
        this.createPanel();
    }
    
    private createPanel() {
        // Create config button
        const configBtn = document.createElement('button');
        configBtn.textContent = '⚙️ Config';
        configBtn.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 200;
            padding: 10px 15px;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        `;
        configBtn.addEventListener('click', () => this.toggle());
        document.body.appendChild(configBtn);
        
        // Create panel
        this.panel = document.createElement('div');
        this.panel.style.cssText = `
            position: absolute;
            top: 60px;
            right: 20px;
            width: 350px;
            max-height: 80vh;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 200;
            overflow-y: auto;
            display: none;
            border: 2px solid #4CAF50;
        `;
        
        this.panel.innerHTML = `
            <div style="max-width: 1200px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #4CAF50; padding-bottom: 20px;">
                    <h2 style="margin: 0; font-size: 28px;">Scene Configuration</h2>
                    <button id="close-config" style="padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                        ✕ Close
                    </button>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
                    <div>
                        <h3 style="margin-top: 0; color: #4CAF50;">Visual Settings</h3>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: bold;">Background Color:</label>
                            <input type="color" id="bg-color" value="#87CEEB" style="width: 100%; padding: 8px; border-radius: 5px; border: 2px solid #555; cursor: pointer;">
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: bold;">Ground Color:</label>
                            <input type="color" id="ground-color" value="#90EE90" style="width: 100%; padding: 8px; border-radius: 5px; border: 2px solid #555; cursor: pointer;">
                        </div>
                    </div>
                    
                    <div>
                        <h3 style="margin-top: 0; color: #4CAF50;">Character Settings</h3>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: bold;">Character Prompt:</label>
                            <textarea id="character-prompt" rows="6" style="width: 100%; padding: 10px; background: #1a1a1a; color: white; border: 2px solid #555; border-radius: 5px; font-family: inherit; resize: vertical;" placeholder="E.g., 65-year-old patient, anxious, pain level 7, sarcastic personality. Describe the character's appearance, personality, and current state."></textarea>
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 30px;">
                    <h3 style="margin-top: 0; color: #4CAF50;">Reaction Rules</h3>
                    <label style="display: block; margin-bottom: 8px; font-weight: bold;">Define how the character reacts to different situations:</label>
                    <textarea id="reaction-rules" rows="8" style="width: 100%; padding: 10px; background: #1a1a1a; color: white; border: 2px solid #555; border-radius: 5px; font-family: inherit; resize: vertical;" placeholder="E.g., 
- If doctor is nervous, become more anxious and question their competence
- If doctor is calm and reassuring, trust increases and anxiety decreases
- If doctor touches arm roughly, flinch and express pain
- If doctor shows empathy, open up more about symptoms"></textarea>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <button id="apply-config" style="padding: 15px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 16px;">
                        ✓ Apply Configuration
                    </button>
                    
                    <button id="generate-scene" style="padding: 15px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 16px; opacity: 0.6;" disabled>
                        🎨 Generate Scene (Coming Soon)
                    </button>
                </div>
                
                <div style="background: #1a1a1a; padding: 20px; border-radius: 5px; border: 1px solid #555; margin-top: 30px;">
                    <h4 style="margin-top: 0; color: #FFC107;">💡 Tips</h4>
                    <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                        <li>Character prompts can include age, personality traits, emotional state, and physical condition</li>
                        <li>Reaction rules define how the character responds to different cues (voice tone, actions, etc.)</li>
                        <li>Changes apply immediately to the scene and character behavior</li>
                        <li>Character uses LangGraph agents for dynamic, context-aware responses</li>
                    </ul>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.panel);
        
        // Event listeners
        const applyBtn = this.panel.querySelector('#apply-config') as HTMLButtonElement;
        applyBtn.addEventListener('click', () => this.applyConfig());
        
        const closeBtn = this.panel.querySelector('#close-config') as HTMLButtonElement;
        closeBtn.addEventListener('click', () => this.toggle());
        
        const bgColor = this.panel.querySelector('#bg-color') as HTMLInputElement;
        const groundColor = this.panel.querySelector('#ground-color') as HTMLInputElement;
        
        bgColor.addEventListener('change', () => this.updatePreview());
        groundColor.addEventListener('change', () => this.updatePreview());
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.toggle();
            }
        });
    }
    
    private toggle() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.panel.style.display = 'block';
            this.expandToFullscreen();
        } else {
            this.panel.style.display = 'none';
            this.collapseFromFullscreen();
        }
    }
    
    private expandToFullscreen() {
        this.panel.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            max-height: 100vh;
            background: rgba(0, 0, 0, 0.95);
            color: white;
            padding: 40px;
            border-radius: 0;
            z-index: 1000;
            overflow-y: auto;
            display: block;
            border: none;
        `;
    }
    
    private collapseFromFullscreen() {
        this.panel.style.cssText = `
            position: absolute;
            top: 60px;
            right: 20px;
            width: 350px;
            max-height: 80vh;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 200;
            overflow-y: auto;
            display: none;
            border: 2px solid #4CAF50;
        `;
    }
    
    private updatePreview() {
        const bgColor = (this.panel.querySelector('#bg-color') as HTMLInputElement).value;
        const groundColor = (this.panel.querySelector('#ground-color') as HTMLInputElement).value;
        
        this.sceneManager.updateSceneConfig({
            backgroundColor: bgColor,
            groundColor: groundColor
        });
    }
    
    private async applyConfig() {
        const bgColor = (this.panel.querySelector('#bg-color') as HTMLInputElement).value;
        const groundColor = (this.panel.querySelector('#ground-color') as HTMLInputElement).value;
        const characterPrompt = (this.panel.querySelector('#character-prompt') as HTMLTextAreaElement).value;
        const reactionRules = (this.panel.querySelector('#reaction-rules') as HTMLTextAreaElement).value;
        
        // Update scene
        this.sceneManager.updateSceneConfig({
            backgroundColor: bgColor,
            groundColor: groundColor,
            characterPrompt: characterPrompt
        });
        
        // Send character config to backend
        if (characterPrompt || reactionRules) {
            try {
                await this.apiClient.updateCharacterConfig({
                    prompt: characterPrompt,
                    rules: reactionRules
                });
                alert('Configuration applied! Character will use these settings.');
            } catch (error) {
                console.error('Failed to update character config:', error);
            }
        }
        
        this.toggle();
    }
}

