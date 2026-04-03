# BHB Live — OBS Plugin

Live avatar for Big Head Billionaires characters, built for OBS streaming.  
Works like VTube Studio — mic lip sync, auto blink, expression hotkeys, scene backgrounds.

---

## Building the Installer

### Requirements (both platforms)
- **Node.js 18+** → https://nodejs.org  
  That's it. The scripts handle everything else.

---

### Mac → `.dmg`

```bash
# In Terminal, from this folder:
chmod +x build-mac.sh
./build-mac.sh
```

Output: `dist/BHB Live-1.0.0-universal.dmg` (runs on Intel + Apple Silicon)

**First launch note:** The app is unsigned. macOS will warn you.  
→ Right-click the app → **Open** → Click "Open" in the dialog.  
→ After the first launch it works normally forever.

If that doesn't work: **System Settings → Privacy & Security → scroll down → "Allow Anyway"**

---

### Windows → `.exe` installer

Double-click `build-win.bat`

Output: `dist/BHB Live Setup 1.0.0.exe`

Users double-click to install. Picks install location, creates desktop shortcut.

---

## OBS Setup

1. Launch **BHB Live** from Applications (Mac) or Start Menu (Windows)
2. Build your character in the left panel
3. Set background: **Green Screen** recommended for OBS keying
4. Click **GO LIVE** → frameless canvas window opens
5. In OBS: **Add Source → Window Capture → `BHB Live — OBS Capture`**
6. Add a **Chroma Key** filter (for green/blue screen)
7. Resize to fit your scene

The live window has a thin drag strip at top to reposition, and resize from bottom edge.

---

## Features

### Character Builder
- Full trait selector: Body, Head/Hat, Outfit, Texture, Eyes, Mouth, Background Layer
- 4 named memory slots — save/load characters, push to live anytime

### Backgrounds
- Green Screen / Blue Screen — chroma key in OBS
- None — transparent canvas
- Character BG — uses BACKGROUNDS trait layer
- Scene — 88 preset backgrounds (same as Animator)

### Lip Sync
- Real-time mic → mouth animation (Mmm / Eee / Ehh / Ahh)
- Toggle on/off, Ehh or Ooo style, mic level meter in panel

### Auto Blink
- Randomized blink with natural jitter, toggle on/off, 1–12s interval slider

### Expression Keybinds
- Assign any key to 8 expressions: Stare, Curious, Joy, Surprised, Stern, Infuriated, Ouchy, Blink
- CLEAR key to snap back to default eyes
- Global — work even when OBS is focused
- Press same key again to toggle off

---

## File Structure

```
bhb-obs-plugin/
├── build-mac.sh               ← Run on Mac to build .dmg
├── build-win.bat              ← Run on Windows to build .exe
├── main.js                    ← Electron main process
├── preload.js                 ← IPC bridge
├── control.html               ← Control panel
├── live.html                  ← OBS capture window
├── package.json
├── scripts/gen-icon.js        ← Auto icon generator
└── build/
    └── entitlements.mac.plist ← Mac mic permission
```

---

## Troubleshooting

**Mic denied on Mac** → System Settings → Privacy & Security → Microphone → enable BHB Live

**"Damaged" or "unidentified developer" on Mac** → Terminal: `xattr -cr /Applications/BHB\ Live.app` then right-click → Open

**Build fails (network)** → Electron binaries download from GitHub on first build (~200 MB). Check internet/firewall.

**Keybind "already in use"** → Another app claimed that key. Try a different one.
