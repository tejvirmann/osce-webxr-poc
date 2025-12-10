# AI-Driven Interactive 3D Scene Vision
## WebXR + LLM Orchestration for Dynamic Scenario Generation

---

## 🎯 Core Vision

Build a **web-based, AI-driven 3D simulation platform** that allows users to:
- **Generate complete 3D scenes and characters** from text prompts or images
- **Control NPC behaviors, dialogue, and reactions** using LLM orchestration
- **Interact naturally** via **any cue you define in prompts**—voice, touch, proximity, facial expressions, body language, tone of voice, timing, and more
- **Bidirectional feedback loops**: User actions → NPC reactions → User responds appropriately → NPC sees and reacts again
- **Deploy seamlessly** across laptops, VR headsets (Quest/Pico), and mobile devices
- **Create scenarios dynamically** with minimal coding (low-code approach)

**Primary Use Case**: Medical training simulations (OSCE scenarios) where students interact with AI-powered patient avatars that respond contextually to **any measurable cue**—touch, voice, facial expressions, nervousness, tone, timing, and more—all defined by prompt-based rules.

**Core Innovation**: A **LangGraph instance** continuously tracks all objective measures (face tracking, voice analysis, body position, timing, etc.) and orchestrates the entire interaction flow, feeding relevant cues to character agents based on their prompt-defined behaviors.

---

## 🏗️ Technology Stack

### Recommended Architecture

| Layer | Component | Status | Purpose |
|-------|-----------|--------|---------|
| **Orchestration** | LangGraph + Gemini/GPT-4o | Custom | **Central brain**: Tracks all objective measures (face, voice, body, timing), manages stateful control over entire simulation flow, routes cues to character agents based on prompt-defined rules |
| **Generative Assets** | World Labs Marble API | Commercial API | Generates and saves complete room prompts (walls/layout) to persistent format |
| **3D Character Generation** | Meta SAM 3D Body/Objects | Open Source | Creates customizable, rigged human mesh from single image/text |
| **3D Runtime** | XR Blocks / Three.js / WebXR | Open Source/Web Standard | **Core requirement**: Web-based on Desktop and Headset (VR/AR). XR Blocks designed for AI+XR integration |
| **Facial Animation** | NVIDIA ACE / Audio2Face | SDK/Plugin (MIT) | Generative facial expression control driven by spoken audio |
| **Body Animation** | PantoMatrix / Mootion | Open Source/Commercial API | Generative body movement control (body_action prompts) in real-time |

**Key Advantage**: All components run in the browser—no native app installation required. Works on any device with a modern browser and WebXR support.

---

## 🛠️ Tool Ecosystem

### Core Tools & Their Functions

| Tool | Primary Function | Key Capabilities | Integration Notes |
|------|------------------|-----------------|-------------------|
| **LLM_Front-End** | Dynamic NPC dialogue/behavior in Unity | Translates environment/personality (Big Five traits, anger/sarcasm) into text prompts for OpenAI GPT; supports secrets/topics | **Note**: Unity-based; for WebXR, use LLM orchestration directly |
| **LLMUnity** | Local/remote LLM integration for Unity characters with RAG | Runs .gguf models (CPU/GPU), semantic search, multi-NPC chats, function calling; cross-platform | **Note**: Unity-based; for WebXR, use web-based LLM APIs |
| **WorldGen** | Text-to-3D scene generation | Generates full 3D worlds/meshes/Gaussian splats from prompts (e.g., "detailed hospital room"); exports .ply for import | Use via API → load into Three.js scene |
| **Meshy AI** | AI 3D character/model generation from text/images | Creates rigged/animated characters in one click; supports image-to-3D; exports GLB/Unity-ready formats | Export GLB → load into Three.js via GLTFLoader |
| **OpenAI Realtime API** | Voice interaction (STT/LLM/TTS) pipeline | Captures/transcribes audio, generates voiced responses; low-latency streaming | Integrate via Web Audio API in browser |
| **XR Blocks** | AI+XR integration framework | Designed specifically for AI+XR workflows; WebXR abstraction layer | Primary framework for WebXR implementation |
| **Three.js** | 3D rendering engine | Industry-standard WebGL library; extensive ecosystem | Core rendering layer |
| **WebXR** | VR/AR web standard | Native browser support for VR/AR headsets; hand tracking, face tracking (via MediaPipe/TensorFlow.js), eye tracking | Enables Quest/Pico/phone AR support; **Can handle face/voice/body tracking** via Web APIs |
| **MediaPipe / TensorFlow.js** | Face/pose/voice analysis | Real-time face detection, emotion recognition, voice sentiment analysis, body pose estimation | Runs in browser; provides objective measures (nervousness, confidence, etc.) to LangGraph |

---

## 🔄 Bidirectional Interaction System

### Core Concept: Prompt-Driven Cue Tracking

The system tracks **any objective measure you define** and routes it to character agents based on their prompt-defined reaction rules. This creates a dynamic, bidirectional feedback loop where:

1. **User (Doctor) acts** → System tracks objective measures (face, voice, body, timing)
2. **LangGraph receives cues** → Routes to character agent based on prompt rules
3. **Character (Patient) reacts** → Facial expression, body movement, dialogue
4. **User observes reaction** → Adapts behavior accordingly
5. **System tracks adaptation** → Routes new cues to character
6. **Character adapts again** → Loop continues

### LangGraph's Central Role

**LangGraph** acts as the orchestrator, maintaining a state graph that:
- **Tracks all objective measures** continuously (face tracking, voice analysis, body language, timing, touch events)
- **Maintains character states** (anxiety level, trust, pain level, emotional state)
- **Routes cues to agents** based on prompt-defined rules
- **Updates state graph** after each interaction
- **Manages the entire simulation flow** as a stateful, reactive system

### Example: Nervous Doctor → Patient Reaction Flow

```
Doctor shows nervousness (face/voice detected)
    ↓
LangGraph receives: {nervousness: 0.85, voice_tremor: true}
    ↓
LangGraph checks patient prompt: "If doctor is nervous, become anxious and question competence"
    ↓
LangGraph routes to patient agent: "Doctor is nervous. React according to your rules."
    ↓
Patient agent generates: Dialogue + facial expression + body movement
    ↓
Doctor sees patient's reaction (anxious, questioning)
    ↓
Doctor adapts: Calms down, speaks confidently
    ↓
LangGraph receives: {nervousness: 0.2, confidence: high}
    ↓
LangGraph checks patient prompt: "If doctor is calm and reassuring, trust increases"
    ↓
LangGraph routes to patient agent: "Doctor is now confident. React according to your rules."
    ↓
Patient adapts: Trust increases, anxiety decreases
    ↓
Loop continues...
```

### WebXR Capabilities

**Yes, WebXR can handle all of this!**

- **Face Tracking**: MediaPipe Face Mesh (468 facial landmarks) or TensorFlow.js Face Landmarks Detection
- **Voice Analysis**: Web Audio API captures audio → OpenAI Realtime API transcribes + analyzes sentiment
- **Body Tracking**: WebXR hand tracking (21 points per hand), MediaPipe Pose (33 body landmarks)
- **Eye Tracking**: WebXR Eye Tracking API (Quest Pro, Pico 4 Enterprise)
- **All runs in browser**: No native plugins, works on laptop/VR/phone

---

## 🔄 Workflow Overview

### 1. **Scene Generation**
   - User provides text prompt: *"Hospital room with bed, medical equipment, patient in bed"*
   - **World Labs Marble API** generates complete 3D room layout
   - **WorldGen** (alternative) creates detailed 3D meshes from prompt
   - Assets exported as GLB/PLY → loaded into Three.js scene

### 2. **Character Creation**
   - User provides image or text: *"Elderly patient, anxious, in hospital gown"*
   - **Meta SAM 3D** or **Meshy AI** generates rigged 3D character mesh
   - Character loaded into scene with initial pose/position

### 3. **AI Behavior Setup**
   - **LangGraph** orchestrates character state and responses
   - Character prompts define reaction rules: *"If doctor sounds nervous, patient becomes more anxious and questions doctor's competence"*
   - LLM (Gemini/GPT-4o) receives context: character traits, current situation, interaction history, **all tracked objective measures**
   - RAG integration pulls relevant data (patient history, medical knowledge)

### 4. **Continuous Cue Tracking & LangGraph Orchestration**
   - **LangGraph instance** runs continuously, tracking:
     - **Face tracking**: Facial expressions, micro-expressions (via MediaPipe/TensorFlow.js)
     - **Voice analysis**: Tone, pace, nervousness indicators (via OpenAI Realtime API + sentiment analysis)
     - **Body language**: Posture, hand movements, proximity (via WebXR hand tracking)
     - **Timing**: Response delays, hesitation patterns
     - **Environmental**: Touch events, object interactions
   - **Any cue you define** in prompts can be tracked and fed to character agents
   - LangGraph maintains state graph: tracks all interactions, measures, and character states

### 5. **Interaction Triggers & Bidirectional Flow**
   - **Objective Measure Detection**: 
     - Face tracking detects nervousness → LangGraph receives: *"Doctor: nervousness_score=0.8, voice_tremor=detected"*
     - Voice analysis detects hesitation → LangGraph receives: *"Doctor: speech_pace=slow, confidence=low"*
   - **LangGraph Routes to Character Agent**: Based on patient's prompt rules, LangGraph sends: *"Patient agent: Doctor is nervous (nervousness=0.8). Your prompt says: 'If doctor is nervous, become more anxious and question their competence.' React."*
   - **Character Response**: Patient agent generates reaction (dialogue, facial expression, body movement)
   - **User Sees Response**: Doctor (user) observes patient's reaction
   - **User Responds Appropriately**: Doctor calms down, reassures patient
   - **LangGraph Tracks Again**: Detects doctor's improved composure → routes to patient: *"Doctor is now calm and reassuring. Your prompt says: 'If doctor shows competence, trust increases.' React."*
   - **Bidirectional Loop Continues**: Each interaction informs the next

### 6. **Response Generation**
   - LLM generates appropriate dialogue/behavior based on character traits **and received cues**
   - **Reaction Types**:
     - **Facial expressions**: Wince, smile, frown, surprise (via NVIDIA ACE/Audio2Face)
     - **Body movements**: Jump, flinch, lean forward, cross arms (via PantoMatrix/Mootion)
     - **Dialogue**: Contextual speech based on prompt rules (via OpenAI TTS)
   - LangGraph updates character state in state graph
   - Scene updates in real-time

### 7. **Multi-Platform Deployment**
   - **Laptop**: Standard web browser (Chrome/Firefox/Safari)
   - **VR Headset**: WebXR → Quest 3/Pico (hand tracking for natural interactions)
   - **Phone**: Mobile browser with WebXR AR support (touch-based interactions)

---

## 📋 Example Scenario: Doctor-Patient Interaction with Bidirectional Cue Tracking

### Setup
1. **Scene**: "Hospital examination room, bed, medical equipment"
2. **Character Prompt**: *"Patient: 65-year-old, anxious, pain level 7, sarcastic personality. **Reaction rules**: If doctor sounds nervous, become more anxious and question their competence. If doctor is calm and reassuring, trust increases and anxiety decreases. If doctor touches arm roughly, flinch and express pain."*
3. **LangGraph State**: Continuously tracking doctor's face, voice, body language, and all interactions

### Flow: Nervous Doctor Detection → Patient Reaction → Doctor Response → Patient Adaptation

#### **Step 1: Doctor Shows Nervousness**
- **Face Tracking** (MediaPipe): Detects micro-expressions, tense facial muscles
- **Voice Analysis** (OpenAI Realtime + sentiment): Detects tremor, slow speech pace, hesitation
- **LangGraph Receives**: *"Doctor: nervousness_score=0.85, voice_tremor=detected, speech_pace=slow, confidence_level=low"*

#### **Step 2: LangGraph Routes to Patient Agent**
- LangGraph checks patient's prompt rules: *"If doctor sounds nervous, become more anxious and question their competence"*
- LangGraph sends to patient agent: *"Patient agent: Doctor is showing signs of nervousness (score=0.85, voice tremor detected). Your prompt says to become more anxious and question their competence. Current state: anxious, pain level 7. Generate reaction."*

#### **Step 3: Patient Reacts**
- **LLM Generates**: *"Are you sure you know what you're doing? You seem a bit... nervous. Should I be worried?"*
- **Reactions Executed**:
  - **Facial Expression** (NVIDIA ACE): Eyes widen, brow furrows, anxious expression
  - **Body Movement** (Mootion): Sits up slightly, leans away from doctor, crosses arms defensively
  - **Dialogue** (TTS): Speech plays with anxious, questioning tone
- **LangGraph Updates State**: Patient anxiety increased, trust decreased

#### **Step 4: Doctor (User) Observes and Responds**
- Doctor sees patient's reaction (facial expression, body language, dialogue)
- Doctor recognizes their nervousness was detected
- Doctor takes a breath, calms down, speaks more confidently

#### **Step 5: LangGraph Tracks Doctor's Improvement**
- **Face Tracking**: Detects more relaxed expression
- **Voice Analysis**: Detects improved confidence, steady pace
- **LangGraph Receives**: *"Doctor: nervousness_score=0.2, voice_steady=true, confidence_level=high, composure=improved"*

#### **Step 6: LangGraph Routes to Patient Agent Again**
- LangGraph checks patient's prompt rules: *"If doctor is calm and reassuring, trust increases and anxiety decreases"*
- LangGraph sends: *"Patient agent: Doctor has improved composure (nervousness=0.2, confidence=high). Your prompt says trust increases and anxiety decreases. Current state: anxious, questioning. Generate reaction."*

#### **Step 7: Patient Adapts**
- **LLM Generates**: *"Okay, I can see you're more confident now. That helps. What do you think is wrong with my arm?"*
- **Reactions Executed**:
  - **Facial Expression**: Relaxes slightly, maintains some caution
  - **Body Movement**: Uncrosses arms, leans forward slightly, more open posture
  - **Dialogue**: Speech plays with cautious but more trusting tone
- **LangGraph Updates State**: Patient anxiety decreased, trust increased

#### **Step 8: Continuous Loop**
- Doctor continues examination, touches patient's arm gently
- LangGraph tracks: *"Doctor: touch_gentle=true, proximity=close, timing=appropriate"*
- Patient's prompt rules: *"If doctor touches arm roughly, flinch. If gentle, allow examination."*
- Patient reacts appropriately: Allows gentle touch, minimal flinch
- Loop continues with each interaction informing the next

### Key Points
- **Any cue can be tracked**: Face, voice, body, timing, touch, proximity—all defined by prompts
- **LangGraph orchestrates everything**: Central state machine tracking all measures and routing to agents
- **Bidirectional feedback**: User actions → NPC reactions → User adapts → NPC sees and adapts
- **Prompt-driven reactions**: Character behaviors defined in prompts, not hardcoded
- **WebXR handles it all**: Face tracking via MediaPipe, voice via Web Audio API, body via WebXR hand tracking

---

## 🎯 Key Requirements

### ✅ Must-Have
- **Web-based**: Runs in browser, no app installation
- **Multi-platform**: Laptop, VR headset, phone
- **Generative**: Create scenes/characters from prompts
- **Flexible cue tracking**: **Any cue you define in prompts**—face, voice, body, timing, touch, proximity, etc.
- **Bidirectional interactions**: User actions → NPC reactions → User adapts → NPC adapts
- **LangGraph orchestration**: Central state machine tracking all objective measures and routing cues to agents
- **AI-driven**: LLM controls character behaviors dynamically based on prompt-defined rules
- **Low-code**: Minimal programming required

### 🎨 Nice-to-Have
- RAG integration for domain knowledge (medical databases)
- Persistent scene storage
- Multi-user scenarios
- Custom animation triggers
- Export scenarios for sharing

---

## 🚀 Implementation Approach

### Phase 1: Foundation
- Set up Three.js + WebXR basic scene
- Integrate XR Blocks for AI+XR workflow
- Basic LLM orchestration (LangGraph + OpenAI API)
- Simple character loading (GLB import)

### Phase 2: Generation
- Integrate World Labs Marble API for scene generation
- Integrate Meshy AI / Meta SAM 3D for character generation
- Dynamic asset loading via Three.js loaders

### Phase 3: Interaction & Cue Tracking
- WebXR hand tracking integration
- Face tracking (MediaPipe/TensorFlow.js) for emotion/nervousness detection
- Voice analysis (OpenAI Realtime API + sentiment analysis)
- Body language tracking (WebXR pose estimation)
- Proximity/touch detection system
- **LangGraph state management**: Central orchestrator tracking all cues and routing to agents
- Bidirectional feedback loop implementation

### Phase 4: Animation
- NVIDIA ACE / Audio2Face integration
- PantoMatrix / Mootion body animation
- Lip-sync and gesture synchronization

### Phase 5: Polish & Deploy
- Multi-platform testing (laptop/VR/phone)
- Performance optimization
- UI/UX for scenario creation
- Documentation

---

## 💻 Hardware Considerations

### Your Setup: 2019 M1 MacBook
- **Limitation**: Local LLM inference may be slow
- **Solution**: Use cloud APIs (OpenAI, Groq, Anthropic) for heavy LLM loads
- **Alternative**: Test with tiny local models (1-3B parameters) for prototyping
- **Face/Voice Tracking**: MediaPipe and TensorFlow.js run efficiently in browser on M1

### Target Devices
- **Laptop**: Any modern browser (Chrome/Firefox/Safari) with camera/mic access for face/voice tracking
- **VR Headset**: Quest 3/Pico via WebXR (hand tracking, eye tracking, face tracking via headset sensors)
- **Phone**: iOS/Android browsers with WebXR AR support (camera for face tracking, touch for interactions)

### WebXR Capabilities for Cue Tracking
**Yes, WebXR can handle this!** WebXR + Web APIs provide:
- **Face Tracking**: MediaPipe Face Mesh (468 landmarks) or TensorFlow.js Face Landmarks Detection
- **Voice Analysis**: Web Audio API + OpenAI Realtime API for real-time transcription and sentiment
- **Body Tracking**: WebXR hand tracking (21 points per hand), MediaPipe Pose (33 body landmarks)
- **Eye Tracking**: WebXR Eye Tracking API (Quest Pro, Pico 4 Enterprise)
- **All in the browser**: No native plugins required, works across platforms

---

## 🎓 Use Cases

1. **Medical Training (OSCE)**: Students practice patient interactions with AI avatars
2. **Therapy Simulations**: Practice difficult conversations in safe environment
3. **Storytelling**: Interactive narratives with AI characters
4. **Training Scenarios**: Any domain requiring realistic human interaction practice

---

## 📝 Next Steps

1. **Choose Core Framework**: XR Blocks vs. vanilla Three.js + WebXR
2. **Set Up Development Environment**: Node.js, build tools, WebXR polyfills
3. **Prototype Basic Scene**: Load a simple GLB character, basic WebXR setup
4. **Integrate First LLM**: Simple OpenAI API call for character dialogue
5. **Add First Interaction**: Mouse/touch trigger → LLM response
6. **Iterate**: Add voice, animations, scene generation

---

## 🔗 Key Resources

- **XR Blocks**: AI+XR integration framework
- **Three.js**: WebGL 3D library
- **WebXR**: Browser VR/AR standard (hand tracking, eye tracking)
- **LangGraph**: LLM orchestration framework (central state machine for cue tracking)
- **MediaPipe**: Face/pose/hand tracking in browser
- **TensorFlow.js**: Face/emotion detection, sentiment analysis
- **OpenAI Realtime API**: Voice interaction pipeline (STT + sentiment)
- **World Labs Marble API**: Scene generation
- **Meta SAM 3D**: Character generation
- **NVIDIA ACE**: Facial animation
- **PantoMatrix/Mootion**: Body animation

---

## 📄 Document Version

**Created**: 2024  
**Purpose**: Clear vision statement for AI-driven WebXR 3D simulation platform  
**Status**: Planning/Development Phase

---

*This document serves as the single source of truth for the project vision. Update as requirements evolve.*

