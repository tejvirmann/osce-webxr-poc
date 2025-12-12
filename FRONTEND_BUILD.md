# Frontend Build Instructions

## ⚠️ Important: TypeScript Must Be Compiled!

The frontend uses **TypeScript**, which must be compiled to JavaScript before the browser can use it.

## Quick Fix

If you're seeing old code (placeholder characters, etc.), you need to **rebuild**:

```bash
# From the root directory:
cd frontend
npm run build

# Or from root:
npm run build
```

## Development Workflow

### Option 1: Manual Build (Current)
1. Make changes to `.ts` files in `frontend/src/`
2. Run `npm run build` in the `frontend/` directory
3. Refresh browser (hard refresh: `Cmd+Shift+R` on Mac, `Ctrl+Shift+R` on Windows)

### Option 2: Watch Mode (Recommended for Development)
Run TypeScript in watch mode to auto-compile on changes:

```bash
# Terminal 1: Watch for TypeScript changes
cd frontend
npm run watch

# Terminal 2: Start server
cd frontend
npm run dev
```

## Build Process

When you run `npm run build`:
1. **TypeScript Compilation**: `tsc` compiles `.ts` files to `.js` in `frontend/dist/`
2. **Asset Copying**: Copies `assets/*.glb` files to `frontend/dist/assets/`
3. **Server**: Serves files from `frontend/dist/` directory

## File Structure

```
frontend/
├── src/              # TypeScript source files (.ts)
│   ├── scene.ts      # ← Your changes go here
│   ├── main.ts
│   └── ...
├── dist/             # Compiled JavaScript (.js) ← Browser reads from here
│   ├── scene.js      # ← This is what the browser uses
│   ├── main.js
│   └── assets/       # GLB files copied here
└── index.html         # References dist/main.js
```

## Troubleshooting

### "I made changes but nothing changed"
1. **Did you rebuild?** Run `npm run build` in `frontend/` directory
2. **Hard refresh browser**: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
3. **Check dist folder**: Make sure `frontend/dist/scene.js` has your changes

### "I see old code"
- Browser is caching old JavaScript
- Solution: Hard refresh (`Cmd+Shift+R` or `Ctrl+Shift+R`)
- Or: Clear browser cache

### "TypeScript errors"
- Check `frontend/tsconfig.json` is correct
- Run `tsc --noEmit` to see errors without building

## Current Status

✅ **Fixed**: The `cleanupUnwantedCharacters()` function is now in the compiled code
✅ **Fixed**: White character color change code is compiled
✅ **Fixed**: Placeholder character is disabled

**Next Step**: Hard refresh your browser to see the changes!
