#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  BHB Live — Mac Builder
#  Produces:  dist/BHB Live-1.0.0-universal.dmg
#
#  Run this on your Mac:
#    chmod +x build-mac.sh
#    ./build-mac.sh
#
#  Requirements: Node.js 18+, npm
#  Get Node from: https://nodejs.org
# ═══════════════════════════════════════════════════════════════════

set -e  # exit on any error

YELLOW='\033[0;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
RESET='\033[0m'

echo ""
echo -e "${YELLOW}╔══════════════════════════════════════╗${RESET}"
echo -e "${YELLOW}║        BHB LIVE — MAC BUILDER        ║${RESET}"
echo -e "${YELLOW}╚══════════════════════════════════════╝${RESET}"
echo ""

# ── 1. Check Node.js ─────────────────────────────────────────────
if ! command -v node &> /dev/null; then
  echo -e "${RED}✗  Node.js not found.${RESET}"
  echo "   Download and install from: https://nodejs.org"
  echo "   Then re-run this script."
  exit 1
fi

NODE_VER=$(node -v)
echo -e "${GREEN}✓  Node.js ${NODE_VER}${RESET}"

if ! command -v npm &> /dev/null; then
  echo -e "${RED}✗  npm not found. Install Node.js from https://nodejs.org${RESET}"
  exit 1
fi
echo -e "${GREEN}✓  npm $(npm -v)${RESET}"

# ── 2. Navigate to project root ───────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── 3. Install dependencies ───────────────────────────────────────
echo ""
echo -e "${CYAN}▸  Installing dependencies…${RESET}"
npm install --prefer-offline 2>&1 | tail -5
echo -e "${GREEN}✓  Dependencies installed${RESET}"

# ── 4. Generate icon if missing ───────────────────────────────────
if [ ! -f "build/icon.icns" ] && [ ! -f "build/icon.png" ]; then
  echo ""
  echo -e "${CYAN}▸  Generating app icon…${RESET}"

  # Try canvas-based icon generator
  npm install canvas --save-optional --quiet 2>/dev/null || true
  node scripts/gen-icon.js 2>/dev/null && echo -e "${GREEN}✓  Icon generated${RESET}" || {
    echo -e "${YELLOW}⚠  Could not auto-generate icon.${RESET}"
    echo "   Creating a minimal placeholder icon…"
    # Create a minimal valid 1x1 PNG as absolute fallback (electron-builder will scale it)
    python3 -c "
import struct, zlib, base64
def png_chunk(name, data):
    c = zlib.crc32(name + data) & 0xffffffff
    return struct.pack('>I', len(data)) + name + data + struct.pack('>I', c)
sig  = b'\\x89PNG\\r\\n\\x1a\\n'
ihdr = png_chunk(b'IHDR', struct.pack('>IIBBBBB', 1, 1, 8, 2, 0, 0, 0))
raw  = b'\\x00\\x0d\\x0d\\x0d'
idat = png_chunk(b'IDAT', zlib.compress(raw))
iend = png_chunk(b'IEND', b'')
open('build/icon.png','wb').write(sig+ihdr+idat+iend)
print('Minimal placeholder icon written.')
" 2>/dev/null || echo "   (Skipping icon — build may use a default)"
  }
else
  echo -e "${GREEN}✓  Icon found${RESET}"
fi

# ── 5. Create license file if missing ────────────────────────────
if [ ! -f "build/license.txt" ]; then
  echo "BHB Live — Big Head Billionaires OBS Plugin" > build/license.txt
  echo "Copyright © 2025 Big Head Billionaires. All rights reserved." >> build/license.txt
fi

# ── 6. Clean previous build ───────────────────────────────────────
if [ -d "dist" ]; then
  echo ""
  echo -e "${CYAN}▸  Cleaning previous dist…${RESET}"
  rm -rf dist
fi

# ── 7. Build ──────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}▸  Building Mac installer (universal — Intel + Apple Silicon)…${RESET}"
echo "   This downloads Electron binaries the first time (~200 MB) — please wait."
echo ""

# Try universal first (works on any Mac); fall back to current arch
npx electron-builder --mac --universal 2>&1 || {
  echo ""
  echo -e "${YELLOW}⚠  Universal build failed — trying current architecture only…${RESET}"
  npx electron-builder --mac 2>&1
}

# ── 8. Done ───────────────────────────────────────────────────────
echo ""
if ls dist/*.dmg 1>/dev/null 2>&1; then
  DMG=$(ls dist/*.dmg | head -1)
  SIZE=$(du -sh "$DMG" | cut -f1)
  echo -e "${GREEN}╔══════════════════════════════════════════╗${RESET}"
  echo -e "${GREEN}║  ✓  BUILD COMPLETE!                      ║${RESET}"
  echo -e "${GREEN}╚══════════════════════════════════════════╝${RESET}"
  echo ""
  echo -e "  Output: ${CYAN}${DMG}${RESET}  (${SIZE})"
  echo ""
  echo "  Distribute this .dmg file to Mac users."
  echo "  ⚠  Unsigned app — users must right-click → Open (first launch only)."
  echo "     Or: System Preferences → Security & Privacy → Allow Anyway"
  echo ""
  # Open dist folder
  open dist/ 2>/dev/null || true
else
  echo -e "${RED}✗  Build failed — no .dmg found in dist/${RESET}"
  echo "   Check the output above for errors."
  exit 1
fi
