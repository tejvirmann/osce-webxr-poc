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
                    
                    <button id="generate-character" style="padding: 15px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 16px;">
                        🎨 Generate Character from Prompt
                    </button>
                    
                    <button id="generate-scene" style="padding: 15px; background: #FF9800; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 16px; opacity: 0.6;" disabled>
                        🏥 Generate Scene (Coming Soon)
                    </button>
                </div>
                
                <div id="generation-section" style="background: #1a1a1a; padding: 20px; border-radius: 5px; border: 1px solid #555; margin-top: 30px; display: none;">
                    <h3 style="margin-top: 0; color: #2196F3;">🎨 Generative Asset Creation</h3>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: bold;">Generation Prompt:</label>
                        <textarea id="generation-prompt" rows="4" style="width: 100%; padding: 10px; background: #1a1a1a; color: white; border: 2px solid #555; border-radius: 5px; font-family: inherit;" placeholder="E.g., 65-year-old male patient, anxious expression, hospital gown, sitting on bed, realistic style"></textarea>
                        <button id="start-generation" style="width: 100%; padding: 10px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; margin-top: 10px;">
                            ✨ Generate Character
                        </button>
                    </div>
                    
                    <div id="generation-status" style="margin-bottom: 15px; padding: 10px; background: #2a2a2a; border-radius: 5px; display: none;">
                        <div id="status-text"></div>
                        <div id="status-progress" style="margin-top: 10px; display: none;">
                            <div style="background: #333; height: 20px; border-radius: 10px; overflow: hidden;">
                                <div id="progress-bar" style="background: #4CAF50; height: 100%; width: 0%; transition: width 0.3s;"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="generation-result" style="margin-bottom: 15px; display: none;">
                        <div style="padding: 10px; background: #2a2a2a; border-radius: 5px; margin-bottom: 10px;">
                            <strong>Generated Model Ready!</strong>
                            <button id="load-generated-model" style="margin-left: 10px; padding: 5px 10px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer;">
                                Load into Scene
                            </button>
                        </div>
                        
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Not quite right? Describe what to fix:</label>
                            <textarea id="generation-feedback" rows="2" style="width: 100%; padding: 8px; background: #1a1a1a; color: white; border: 2px solid #555; border-radius: 5px; font-family: inherit;" placeholder="E.g., Make the character look more anxious, or add wrinkles, or change the pose"></textarea>
                        </div>
                        <button id="regenerate-with-feedback" style="width: 100%; padding: 10px; background: #FF9800; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                            🔄 Regenerate with Feedback
                        </button>
                    </div>
                </div>
                
                <div style="background: #1a1a1a; padding: 20px; border-radius: 5px; border: 1px solid #555; margin-top: 30px;">
                    <h4 style="margin-top: 0; color: #FFC107;">💡 Tips</h4>
                    <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                        <li>Character prompts can include age, personality traits, emotional state, and physical condition</li>
                        <li>Reaction rules define how the character responds to different cues (voice tone, actions, etc.)</li>
                        <li>Changes apply immediately to the scene and character behavior</li>
                        <li>Character uses LangGraph agents for dynamic, context-aware responses</li>
                        <li><strong>New:</strong> Generate 3D characters from prompts! The AI will refine prompts based on your feedback.</li>
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
        
        const generateCharBtn = this.panel.querySelector('#generate-character') as HTMLButtonElement;
        generateCharBtn.addEventListener('click', () => this.showGenerationSection());
        
        const startGenBtn = this.panel.querySelector('#start-generation') as HTMLButtonElement;
        startGenBtn.addEventListener('click', () => this.handleGeneration());
        
        const regenerateBtn = this.panel.querySelector('#regenerate-with-feedback') as HTMLButtonElement;
        regenerateBtn.addEventListener('click', () => this.handleRegeneration());
        
        const loadModelBtn = this.panel.querySelector('#load-generated-model') as HTMLButtonElement;
        loadModelBtn.addEventListener('click', () => this.loadGeneratedModel());
        
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
    
    private showGenerationSection() {
        const section = this.panel.querySelector('#generation-section') as HTMLDivElement;
        section.style.display = 'block';
        section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    private async handleGeneration() {
        const promptInput = this.panel.querySelector('#generation-prompt') as HTMLTextAreaElement;
        const prompt = promptInput.value.trim();
        
        if (!prompt) {
            alert('Please enter a generation prompt');
            return;
        }
        
        const statusDiv = this.panel.querySelector('#generation-status') as HTMLDivElement;
        const statusText = this.panel.querySelector('#status-text') as HTMLDivElement;
        statusDiv.style.display = 'block';
        statusText.textContent = 'Generating character... This may take 1-2 minutes.';
        
        try {
            const response = await this.apiClient.generateAsset({
                prompt: prompt,
                generation_type: 'character'
            });
            
            const taskId = response.task_id;
            statusText.textContent = `Generation started (Task: ${taskId.substring(0, 8)}...). Polling for completion...`;
            
            // Poll for completion
            await this.pollGenerationStatus(taskId, prompt);
            
        } catch (error) {
            statusText.textContent = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error('Generation error:', error);
        }
    }
    
    private async pollGenerationStatus(taskId: string, originalPrompt: string, maxAttempts: number = 60) {
        const statusText = this.panel.querySelector('#status-text') as HTMLDivElement;
        const progressBar = this.panel.querySelector('#progress-bar') as HTMLDivElement;
        const progressContainer = this.panel.querySelector('#status-progress') as HTMLDivElement;
        progressContainer.style.display = 'block';
        
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
            
            try {
                const status = await this.apiClient.getGenerationStatus(taskId);
                
                if (status.status === 'SUCCEEDED' && status.model_url) {
                    statusText.textContent = 'Generation complete!';
                    progressBar.style.width = '100%';
                    
                    // Show result section
                    const resultDiv = this.panel.querySelector('#generation-result') as HTMLDivElement;
                    resultDiv.style.display = 'block';
                    (resultDiv as any).dataset.modelUrl = status.model_url;
                    (resultDiv as any).dataset.taskId = taskId;
                    (resultDiv as any).dataset.originalPrompt = originalPrompt;
                    
                    return;
                } else if (status.status === 'FAILED') {
                    statusText.textContent = 'Generation failed. Please try again.';
                    return;
                } else {
                    const progress = status.progress || (i / maxAttempts * 100);
                    progressBar.style.width = `${progress}%`;
                    statusText.textContent = `Generating... ${Math.round(progress)}%`;
                }
            } catch (error) {
                console.error('Status check error:', error);
            }
        }
        
        statusText.textContent = 'Generation taking longer than expected. Please check back later.';
    }
    
    private async handleRegeneration() {
        const resultDiv = this.panel.querySelector('#generation-result') as HTMLDivElement;
        const feedbackInput = this.panel.querySelector('#generation-feedback') as HTMLTextAreaElement;
        const feedback = feedbackInput.value.trim();
        const originalPrompt = (resultDiv as any).dataset.originalPrompt;
        const taskId = (resultDiv as any).dataset.taskId;
        
        if (!feedback) {
            alert('Please describe what you want to change');
            return;
        }
        
        const statusText = this.panel.querySelector('#status-text') as HTMLDivElement;
        statusText.textContent = 'Refining prompt based on your feedback and regenerating...';
        
        try {
            const response = await this.apiClient.refineAndRegenerate({
                task_id: taskId,
                feedback: feedback,
                original_prompt: originalPrompt
            });
            
            const newTaskId = response.task_id;
            statusText.textContent = `Regenerating with improved prompt: "${response.refined_prompt}"`;
            
            // Poll for new generation
            await this.pollGenerationStatus(newTaskId, originalPrompt);
            feedbackInput.value = '';
            
        } catch (error) {
            statusText.textContent = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error('Regeneration error:', error);
        }
    }
    
    private async loadGeneratedModel() {
        const resultDiv = this.panel.querySelector('#generation-result') as HTMLDivElement;
        const modelUrl = (resultDiv as any).dataset.modelUrl;
        
        if (!modelUrl) {
            alert('No model URL available');
            return;
        }
        
        // Load model into scene
        try {
            await this.sceneManager.loadCharacterFromURL(modelUrl);
            alert('Character loaded into scene!');
        } catch (error) {
            alert(`Failed to load model: ${error instanceof Error ? error.message : 'Unknown error'}`);
            console.error('Load error:', error);
        }
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

