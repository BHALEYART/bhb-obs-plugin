// ═══════════════════════════════════════════════════════════════
//  BHB LIVE — preload.js
// ═══════════════════════════════════════════════════════════════
'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {

  // ── Asset cache ──────────────────────────────────────────────
  checkAssetsReady:    ()         => ipcRenderer.invoke('check-assets-ready'),
  getAssetCount:       ()         => ipcRenderer.invoke('get-asset-count'),
  downloadAllAssets:   ()         => ipcRenderer.invoke('download-all-assets'),
  resetAssetCache:     ()         => ipcRenderer.invoke('reset-asset-cache'),
  onAssetProgress:     (cb)       => ipcRenderer.on('asset-progress', (_, d) => cb(d)),

  // ── Auto Updater ─────────────────────────────────────────────
  installUpdate:       ()         => ipcRenderer.invoke('install-update'),
  checkForUpdates:     ()         => ipcRenderer.invoke('check-for-updates'),
  onUpdateAvailable:   (cb)       => ipcRenderer.on('update-available',  (_, d) => cb(d)),
  onUpdateDownloaded:  (cb)       => ipcRenderer.on('update-downloaded', (_, d) => cb(d)),

  // ── Live Window ──────────────────────────────────────────────
  openLiveWindow:      (opts)     => ipcRenderer.invoke('open-live-window', opts),
  closeLiveWindow:     ()         => ipcRenderer.invoke('close-live-window'),
  isLiveOpen:          ()         => ipcRenderer.invoke('is-live-open'),
  setLiveAlwaysOnTop:  (flag)     => ipcRenderer.invoke('set-live-always-on-top', flag),
  setLiveSize:         (w, h)     => ipcRenderer.invoke('set-live-size', { w, h }),
  updateLiveState:     (state)    => ipcRenderer.invoke('update-live-state', state),

  // ── Shortcuts ────────────────────────────────────────────────
  registerShortcut:       (accel, expr) => ipcRenderer.invoke('register-shortcut', { accelerator: accel, expression: expr }),
  unregisterShortcut:     (accel)       => ipcRenderer.invoke('unregister-shortcut', accel),
  unregisterAllShortcuts: ()            => ipcRenderer.invoke('unregister-all-shortcuts'),
  getShortcuts:           ()            => ipcRenderer.invoke('get-shortcuts'),

  // ── Listeners ────────────────────────────────────────────────
  onStateUpdate:        (cb) => ipcRenderer.on('state-update',        (_, d) => cb(d)),
  onExpressionActivate: (cb) => ipcRenderer.on('expression-activate', (_, d) => cb(d)),
  onLiveWindowOpened:   (cb) => ipcRenderer.on('live-window-opened',  ()     => cb()),
  onLiveWindowClosed:   (cb) => ipcRenderer.on('live-window-closed',  ()     => cb()),

  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
