# WebXR GLB Support

## ✅ Yes, GLB files work perfectly in WebXR!

GLB (GLTF Binary) files are fully supported in WebXR environments. Here's what you need to know:

### Compatibility

- **WebXR Standard**: GLB files are part of the glTF 2.0 specification, which is the standard format for 3D assets in WebXR
- **Three.js Support**: Three.js's `GLTFLoader` works seamlessly in both desktop and WebXR modes
- **VR Headsets**: All major VR headsets (Quest, Pico, etc.) support GLB files through WebXR

### What Works in WebXR

1. **Static Models**: GLB files with meshes, materials, and textures
2. **Animated Models**: GLB files with skeletal animations (bone-based animations)
3. **Rigged Characters**: Characters with skeletons that can be animated programmatically
4. **Materials & Textures**: All standard PBR materials work in WebXR
5. **Shadows**: Shadow casting and receiving works in WebXR (with proper setup)

### Current Implementation

Our scene manager (`SceneManager`) loads GLB files using Three.js's `GLTFLoader`, which works identically in:
- **Desktop mode**: Regular browser rendering
- **WebXR mode**: VR/AR headset rendering

The same GLB files (`person_0.glb`, `person_1.glb`) will display correctly in both modes.

### Animation Support

- **Built-in Animations**: GLB files can contain embedded animations that play automatically
- **Programmatic Animations**: We can manipulate bone positions/rotations to create custom animations
- **Real-time Updates**: Animation updates work in real-time in WebXR, maintaining 90fps for smooth VR experience

### Performance Considerations

- **File Size**: Keep GLB files optimized (< 10MB recommended for WebXR)
- **Polygon Count**: Lower poly models perform better in VR (aim for < 50k triangles per character)
- **Texture Resolution**: Use compressed textures (KTX2/Basis) for better performance
- **Animation Complexity**: Fewer bones = better performance

### Testing WebXR with GLBs

1. **Desktop Testing**: Load your GLB files normally - if they work on desktop, they'll work in WebXR
2. **VR Testing**: Click the "🥽 Enter VR" button to test in your VR headset
3. **Mobile AR**: WebXR also supports AR on mobile devices (iOS Safari, Chrome Android)

### Troubleshooting

If GLB files don't appear in WebXR:
1. Check browser console for loading errors
2. Verify file paths are correct (relative paths work in WebXR)
3. Ensure files are served over HTTPS (required for WebXR)
4. Check that the GLB file is valid (use a GLB validator tool)

### Resources

- [glTF 2.0 Specification](https://www.khronos.org/gltf/)
- [Three.js GLTFLoader Documentation](https://threejs.org/docs/#examples/en/loaders/GLTFLoader)
- [WebXR Device API](https://www.w3.org/TR/webxr/)
