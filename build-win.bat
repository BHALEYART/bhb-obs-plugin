@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1

:: ═══════════════════════════════════════════════════════════════════
::  BHB Live — Windows Builder
::  Produces:  dist\BHB Live Setup 1.0.0.exe
::
::  Run this on a Windows PC:
::    Double-click build-win.bat
::    (or right-click → Run as administrator if PowerShell blocked)
::
::  Requirements: Node.js 18+, npm
::  Get Node from: https://nodejs.org
:: ═══════════════════════════════════════════════════════════════════

title BHB Live — Windows Builder

echo.
echo  ╔══════════════════════════════════════╗
echo  ║      BHB LIVE — WINDOWS BUILDER      ║
echo  ╚══════════════════════════════════════╝
echo.

:: ── 1. Check Node.js ─────────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
  echo  [ERROR] Node.js not found.
  echo.
  echo  Download and install from: https://nodejs.org
  echo  Then re-run this script.
  echo.
  pause
  exit /b 1
)

for /f "tokens=*" %%v in ('node -v 2^>nul') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER%

where npm >nul 2>&1
if errorlevel 1 (
  echo  [ERROR] npm not found. Install Node.js from https://nodejs.org
  pause
  exit /b 1
)
for /f "tokens=*" %%v in ('npm -v 2^>nul') do set NPM_VER=%%v
echo  [OK] npm %NPM_VER%

:: ── 2. Navigate to script directory ──────────────────────────────
cd /d "%~dp0"

:: ── 3. Install dependencies ───────────────────────────────────────
echo.
echo  [....] Installing dependencies...
call npm install --prefer-offline 2>&1
if errorlevel 1 (
  echo  [WARN] npm install had warnings — continuing...
)
echo  [OK] Dependencies installed

:: ── 4. Generate icon if missing ───────────────────────────────────
if not exist "build\icon.ico" (
  if not exist "build\icon.png" (
    echo.
    echo  [....] Generating app icon...
    call npm install canvas --save-optional --quiet >nul 2>&1
    call node scripts\gen-icon.js 2>nul
    if errorlevel 1 (
      echo  [WARN] Auto icon generation failed.
      echo         Creating placeholder icon via PowerShell...

      :: Use PowerShell to create a minimal valid PNG
      powershell -NoProfile -ExecutionPolicy Bypass -Command ^
        "$b = [System.Convert]::FromBase64String('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='); [IO.File]::WriteAllBytes('%cd%\build\icon.png', $b)" 2>nul
      if exist "build\icon.png" (
        echo  [OK] Placeholder icon created
      ) else (
        echo  [WARN] Could not create icon - build will use Electron default
      )
    ) else (
      echo  [OK] Icon generated
    )
  ) else (
    echo  [OK] Icon found ^(PNG^)
  )
) else (
  echo  [OK] Icon found ^(ICO^)
)

:: ── 5. Create license file if missing ────────────────────────────
if not exist "build\license.txt" (
  echo BHB Live — Big Head Billionaires OBS Plugin > build\license.txt
  echo Copyright ^(c^) 2025 Big Head Billionaires. All rights reserved. >> build\license.txt
)

:: ── 6. Clean previous build ───────────────────────────────────────
if exist "dist" (
  echo.
  echo  [....] Cleaning previous dist...
  rmdir /s /q dist 2>nul
)

:: ── 7. Build ──────────────────────────────────────────────────────
echo.
echo  [....] Building Windows installer (x64)...
echo         This downloads Electron binaries the first time (~200 MB) — please wait.
echo.

call npx electron-builder --win --x64 2>&1
if errorlevel 1 (
  echo.
  echo  [ERROR] Build failed. See output above.
  pause
  exit /b 1
)

:: ── 8. Done ───────────────────────────────────────────────────────
echo.

:: Check for output
set EXE_FILE=
for /f "tokens=*" %%f in ('dir /b /s "dist\*.exe" 2^>nul ^| findstr /i "Setup"') do (
  set EXE_FILE=%%f
  goto :found
)
:found

if defined EXE_FILE (
  echo  ╔══════════════════════════════════════════╗
  echo  ║  ✓  BUILD COMPLETE!                      ║
  echo  ╚══════════════════════════════════════════╝
  echo.
  echo  Output: !EXE_FILE!
  echo.
  echo  Distribute this .exe to Windows users.
  echo  They can double-click to install like any normal Windows app.
  echo.
  :: Open dist folder
  explorer "dist" 2>nul
) else (
  echo  [ERROR] Build failed - no installer .exe found in dist\
  echo  Check the output above for errors.
)

echo.
pause
