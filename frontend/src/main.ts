import * as THREE from 'three';
import { SceneManager } from './scene.js';
import { APIClient } from './api.js';
import { ConfigPanel } from './config-panel.js';

// Initialize scene
const container = document.getElementById('canvas-container');
if (!container) {
    throw new Error('Canvas container not found');
}

const sceneManager = new SceneManager(container);
const apiClient = new APIClient();
const configPanel = new ConfigPanel(sceneManager, apiClient);

// Add VR button
const webXRManager = sceneManager.getWebXRManager();
if (webXRManager) {
    const vrButton = document.createElement('button');
    vrButton.textContent = '🥽 Enter VR';
    vrButton.style.cssText = `
        position: absolute;
        top: 20px;
        right: 100px;
        z-index: 200;
        padding: 10px 15px;
        background: #9C27B0;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
    `;
    vrButton.addEventListener('click', () => {
        webXRManager.enterVR();
    });
    document.body.appendChild(vrButton);
}

// UI elements
const userInput = document.getElementById('user-input') as HTMLInputElement;
const sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
const responseDiv = document.getElementById('response') as HTMLDivElement;

// Send message handler
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;
    
    // Disable input while processing
    sendBtn.disabled = true;
    userInput.disabled = true;
    responseDiv.textContent = 'Processing...';
    
    try {
        // Send to backend
        const response = await apiClient.sendMessage(message);
        
        // Display response
        responseDiv.textContent = `Patient: ${response.message}`;
        
        // Update character (for now, just log - animation will come later)
        console.log('Character should react:', response);
        
    } catch (error) {
        console.error('Error:', error);
        responseDiv.textContent = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    } finally {
        // Re-enable input
        sendBtn.disabled = false;
        userInput.disabled = false;
        userInput.value = '';
        userInput.focus();
    }
}

// Event listeners
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    sceneManager.update();
}

animate();

// WebXR button (will be added in future phases)
console.log('Scene initialized. WebXR support coming in Phase 1.');

