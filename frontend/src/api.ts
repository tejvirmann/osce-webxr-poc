// API client for communicating with backend
// In development: use localhost, in production: use relative path for Vercel
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isDevelopment ? 'http://localhost:8000' : '/api';

export class APIClient {
    private baseUrl: string;
    
    constructor() {
        this.baseUrl = API_BASE_URL;
    }
    
    async sendMessage(message: string): Promise<{ message: string }> {
        const response = await fetch(`${this.baseUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }
        
        return await response.json();
    }
    
    async getCharacterState(): Promise<any> {
        const response = await fetch(`${this.baseUrl}/api/state`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }
        
        return await response.json();
    }
    
    async updateCharacterConfig(config: { prompt?: string; rules?: string }): Promise<any> {
        const response = await fetch(`${this.baseUrl}/api/config`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(config),
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }
        
        return await response.json();
    }
}

