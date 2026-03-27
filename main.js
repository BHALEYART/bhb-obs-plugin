// ═══════════════════════════════════════════════════════════════
//  BHB LIVE — Electron Main Process
//  Two-window architecture:
//    controlWin → full builder + settings UI
//    liveWin    → frameless canvas only; target for OBS Window Capture
//
//  Asset strategy:
//    - First launch: download all assets from CDN → userData/bhb-assets/
//    - Subsequent launches: serve from local cache via bhb-asset:// protocol
//    - Manifest file marks a completed download; partial downloads resume
// ═══════════════════════════════════════════════════════════════
'use strict';

const {
  app, BrowserWindow, ipcMain, globalShortcut,
  session, protocol
} = require('electron');
const path  = require('path');
const fs    = require('fs');
const https = require('https');
const http  = require('http');

// ─── PATHS ───────────────────────────────────────────────────────────────────
// userData survives app updates and lives at:
//   Mac:  ~/Library/Application Support/BHB Live/bhb-assets/
//   Win:  %APPDATA%\BHB Live\bhb-assets\
const ASSET_DIR     = path.join(app.getPath('userData'), 'bhb-assets');
const MANIFEST_PATH = path.join(ASSET_DIR, 'manifest.json');
const CDN_BASE      = 'https://bhaleyart.github.io/BigHeadCharacterCooker';

let controlWin = null;
let liveWin    = null;
const shortcutMap = new Map();

// ─── ASSET MANIFEST — every file that needs to be cached locally ─────────────
function buildAssetManifest() {
  const EYES_FILES    = ['Curious.png','Alien.png','Annoyed.png','Demonic.png','Diamond.png','Dots.png','Grumpy.png','Hypnotized.png','Infuriated.png','Insect.png','Joy.png','Light Bright.png','Monocle.png','Ouchy.png','Paranoid.png','Possessed.png','Ruby Stare.png','Spider.png','Stare.png','Stoney Eyes.png','Sunglasses.png','Surprised.png','Tears.png','Deceased.png','Too Chill.png','VR Headset.png','3D Glasses.png','Blink.png','Stern.png','Tears.gif'];
  const MOUTH_FILES   = ['Mmm.png','Simpleton.png','Stache.png','Creeper.png','Pierced.png','Fangs.png','Gold Teeth.png','Diamond Teeth.png','CandyGrill.png','Birdy.png','Panic.png','Sss.png','Ahh.png','Ehh.png','Uhh.png','LLL.png','Rrr.png','Fff.png','Ooo.png','Thh.png','Eee.png','Haha.png','Rofl.png','Bean Frown.png','Bean Smile.png','Smirk.png','Bored.png','Gas Mask.png','Scuba.png','Quacked.png'];
  const HEAD_FILES    = ['None.png','Antenna.png','Bandana Bro.png','Beanie.png','Blonde Beanie.png','Blonde Bun.png','Blue Bedhead.png','Brain Squid.png','Bravo.png','Brunette Beanie.png','Brunette Ponytail.png','Burger Crown.png','Captain Hat.png','Mullet.png','Cat Hat.png','Chad Bandana.png','Cherry Sundae.png','Clown Wig.png','Fancy Hat.png','Fireman.png','Flame Princess.png','Fossilized.png','Gamer Girl.png','Ginger Ponytail.png','Kpop.png','Yagami.png','Raven.png','Heated.png','Inferno.png','Horny Horns.png','Hunted.png','Jester.png','Kingly.png','Mad Hatter.png','Masked Up.png','Mohawk Blue.png','Mohawk Green.png','Mohawk Red.png','Mortricia.png','Outlaw.png','Overload.png','Patrol Cap.png','Pharaoh Hat.png','Pink Pigtails.png','Powdered Wig.png','Press Pass.png','Propeller.png','Rainbow Babe.png','Recon Helmet.png','Robin Hood.png','Santa Hat.png','Sewer Slime.png','Snapback Blue.png','Snapback Hippy.png','Snapback Red.png','Snapback Yellow.png','Sombrero.png','Spiritual.png','Surgeon.png','UwU Kitty.png','Valhalla Cap.png','Way Dizzy.png','FoxFamous.png','Unplugged.png'];
  const OUTFIT_FILES  = ['None.png','Blue Tee.png','Blueberry Dye.png','Degen Green.png','Degen Purple.png','Earthy Dye.png','Hodl Black.png','Hodl White.png','Locked Up.png','Moto-X.png','Orange Zip.png','Passion Dye.png','Pink Zip.png','Raider Ref.png','Red Tee.png','Smally Bigs.png','Yellow Tee.png','Blue Zip.png','Red Zip.png','White Zip.png','Hornet Zip.png','Ghostly Zip.png','Gold Jacket.png','Tuxedo.png','Thrashed.png','The Fuzz.png','Pin Striped.png','Designer Zip.png','Luxury Zip.png','Explorer.png','Power Armor.png','Shinobi.png','Thrilled.png','Trenches.png','Ski Jacket.png','Sled Jacket.png','Commando.png','Space Cadet.png','Burgler.png','Commandant.png','Golden Knight.png','Honey Bee.png','Necromancer.png','Paladin.png','Refined Suit.png','Sexy Jacket.png','Stoner Hoodie.png','The Duke.png','Rave Hoodie.png','Scuba suit temp.png','Burger Suit.png','Scrubs.png','FlaredUp.png','Shiller.png','MetalFan.png','BH-Tshirt.png','Uni-Fyed.png','SuperFlare.png','BoigaRed.png'];
  const TEXTURE_FILES = ['None.png','Blood.png','Acid.png','Ink.png','Dart Frog Blue.png','Dart Frog Red.png','Dart Frog Yellow.png','Magical.png','Puzzled.png','Rug Life Ink.png','Pulverized.png','FlaredInk.png'];
  const BODY_FILES    = ['Blank.png','Charcoal.png','High Voltage.png','Nebulous.png','Pinky.png','Shockwave.png','Tangerine.png','Turquoise.png','Woody.png','Frogger.png','Area 51.png','Dark Tone.png','Mid Tone.png','Light Tone.png','Jolly Roger.png','Cyber Punk.png','Talking Corpse.png','Day Tripper.png','Meat Lover.png','Golden God.png','Chrome Dome.png','Candy Gloss.png','Man On Fire.png','Water Boy.png','Icecream Man.png','Reptilian.png','Juiced Up.png','Toxic Waste.png','Love Potion.png','Pop Artist.png','Autopsy.png','Ghostly.png','Blue Screen.png','Networker.png','IceMan.png','TheLizard.png','Primal.png','PanduBeru.png'];
  const BG_FILES      = ['None.png','Natural.png','Mania.png','Regal.png','Lavish.png','Sunflower.png','Snowflake.png','Bleach.png','Vibes.png','Burst.png','Aquatic.png','Passionate.png','Envious.png','Enlightened.png','Haunted.png','Cursed.png','SolFlare.png','Tangerine.png','Navy.png','Crimson.png','Graphite.png','Eggshell.png','Slate.png','Kuwai.png','Velvet.png','Money.png','Sky.png'];

  const SUBSET_PATHS = [
    'EYES/SUBSET/alien.png','EYES/SUBSET/alien-blink.png','EYES/SUBSET/alien-ouchy.png','EYES/SUBSET/alien-infuriated.png','EYES/SUBSET/alien-surprised.png','EYES/SUBSET/alien-stern.png','EYES/SUBSET/alien-joy.png','EYES/SUBSET/alien-curious.png',
    'EYES/SUBSET/demonic.png','EYES/SUBSET/demonic-blink.png','EYES/SUBSET/demonic-ouchy.png','EYES/SUBSET/demonic-infuriated.png','EYES/SUBSET/demonic-surprised.png','EYES/SUBSET/demonic-stern.png','EYES/SUBSET/demonic-joy.png','EYES/SUBSET/demonic-curious.png',
    'EYES/SUBSET/diamond.png','EYES/SUBSET/diamond-blink.png','EYES/SUBSET/diamond-ouchy.png','EYES/SUBSET/diamond-infuriated.png','EYES/SUBSET/diamond-surprised.png','EYES/SUBSET/diamond-stern.png','EYES/SUBSET/diamond-joy.png','EYES/SUBSET/diamond-curious.png',
    'EYES/SUBSET/possesed.png','EYES/SUBSET/possesed-blink.png','EYES/SUBSET/possesed-ouchy.png','EYES/SUBSET/possesed-infuriated.png','EYES/SUBSET/possesed-surprised.png','EYES/SUBSET/possesed-stern.png','EYES/SUBSET/possesed-joy.png','EYES/SUBSET/possesed-curious.png',
    'EYES/SUBSET/dots.png','EYES/SUBSET/dots-blink.png','EYES/SUBSET/dots-ouchy.png','EYES/SUBSET/dots-infuriated.png','EYES/SUBSET/dots-surprised.png','EYES/SUBSET/dots-stern.png','EYES/SUBSET/dots-joy.png','EYES/SUBSET/dots-curious.png',
    'EYES/SUBSET/stoneyeyes.png','EYES/SUBSET/stoneyeyes-blink.png','EYES/SUBSET/stoneyeyes-ouchy.png','EYES/SUBSET/stoneyeyes-infuriated.png','EYES/SUBSET/stoneyeyes-surprised.png','EYES/SUBSET/stoneyeyes-stern.png','EYES/SUBSET/stoneyeyes-joy.png','EYES/SUBSET/stoneyeyes-curious.png',
    'EYES/SUBSET/vrheadset.png',
    'EYES/SUBSET/toochill.png','EYES/SUBSET/toochill-blink.png',
    'EYES/SUBSET/deceased.png','EYES/SUBSET/deceased-blink.png','EYES/SUBSET/deceased-ouchy.png',
    'EYES/SUBSET/grumpy.png','EYES/SUBSET/grumpy-ouchy.png',
    'EYES/SUBSET/paranoid.png','EYES/SUBSET/paranoid-ouchy.png',
    'EYES/SUBSET/insect.png','EYES/SUBSET/insect-ouchy.png',
    'EYES/SUBSET/annoyed.png','EYES/SUBSET/annoyed-blink.png',
  ];

  const entries = [];

  const addCat = (cat, files) => files.forEach(f =>
    entries.push({ rel: `${cat}/${f}`, url: `${CDN_BASE}/${cat}/${encodeURIComponent(f)}` })
  );

  addCat('EYES',        EYES_FILES);
  addCat('MOUTH',       MOUTH_FILES);
  addCat('HEAD',        HEAD_FILES);
  addCat('OUTFIT',      OUTFIT_FILES);
  addCat('TEXTURE',     TEXTURE_FILES);
  addCat('BODY',        BODY_FILES);
  addCat('BACKGROUNDS', BG_FILES);

  entries.push({ rel: 'GIRL/Eyelashes.png', url: `${CDN_BASE}/GIRL/Eyelashes.png` });
  entries.push({ rel: 'GIRL/Breasts.png',   url: `${CDN_BASE}/GIRL/Breasts.png`   });

  SUBSET_PATHS.forEach(rel =>
    entries.push({ rel, url: `${CDN_BASE}/${rel}` })
  );

  for (let i = 1; i <= 88; i++) {
    entries.push({ rel: `SCENES/bg${i}.png`, url: `${CDN_BASE}/SCENES/bg${i}.png` });
  }

  return entries;
}

// ─── MANIFEST CHECK ───────────────────────────────────────────────────────────
function assetsReady() {
  try {
    if (!fs.existsSync(MANIFEST_PATH)) return false;
    const m = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    return m.complete === true && m.version === 1;
  } catch (_) { return false; }
}

// ─── CUSTOM PROTOCOL — bhb-asset:// ──────────────────────────────────────────
// Must be declared before app.whenReady()
protocol.registerSchemesAsPrivileged([{
  scheme:     'bhb-asset',
  privileges: { standard: true, secure: true, supportFetchAPI: true, bypassCSP: true }
}]);

function registerAssetProtocol() {
  protocol.registerFileProtocol('bhb-asset', (request, callback) => {
    const rel      = decodeURIComponent(request.url.replace(/^bhb-asset:\/\//, ''));
    const filePath = path.normalize(path.join(ASSET_DIR, rel));
    // Security: ensure resolved path is inside ASSET_DIR
    if (!filePath.startsWith(ASSET_DIR)) {
      return callback({ error: -10 }); // net::ERR_ACCESS_DENIED
    }
    callback({ path: filePath });
  });
}

// ─── DOWNLOADER ───────────────────────────────────────────────────────────────
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });

    const get = (u, hops = 0) => {
      if (hops > 5) return reject(new Error('Too many redirects'));
      const mod = u.startsWith('https') ? https : http;
      const req = mod.get(u, { timeout: 30000 }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return get(res.headers.location, hops + 1);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const tmp = destPath + '.tmp';
        const out = fs.createWriteStream(tmp);
        res.pipe(out);
        out.on('finish', () => out.close(() => {
          try { fs.renameSync(tmp, destPath); resolve(); }
          catch (e) { reject(e); }
        }));
        out.on('error', (e) => { try { fs.unlinkSync(tmp); } catch(_) {} reject(e); });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    };

    get(url);
  });
}

// ─── IPC: DOWNLOAD MANAGEMENT ────────────────────────────────────────────────
ipcMain.handle('check-assets-ready',  () => assetsReady());
ipcMain.handle('get-asset-count',     () => buildAssetManifest().length);

ipcMain.handle('download-all-assets', async (event) => {
  const entries     = buildAssetManifest();
  const total       = entries.length;
  let   done        = 0;
  let   failed      = 0;
  let   idx         = 0;
  const CONCURRENCY = 8;

  const worker = async () => {
    while (idx < total) {
      const entry = entries[idx++];
      const dest  = path.join(ASSET_DIR, entry.rel);

      if (fs.existsSync(dest)) {
        // Already on disk — count as done, skip download
        done++;
        event.sender.send('asset-progress', { done, total, failed, file: entry.rel, skipped: true });
        continue;
      }

      try {
        await downloadFile(entry.url, dest);
      } catch (e) {
        failed++;
        console.warn(`BHB asset download failed [${entry.rel}]: ${e.message}`);
      }

      done++;
      event.sender.send('asset-progress', { done, total, failed, file: entry.rel });
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  // Write manifest if ≥90% succeeded (some subset images may not exist for all traits)
  if ((done - failed) / total >= 0.9) {
    fs.mkdirSync(ASSET_DIR, { recursive: true });
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify({
      complete:     true,
      version:      1,
      downloadedAt: new Date().toISOString(),
      total, failed,
    }));
    return { ok: true, done, total, failed };
  }

  return { ok: false, done, total, failed, error: 'Too many failed downloads — check your connection and try again.' };
});

ipcMain.handle('reset-asset-cache', () => {
  try {
    if (fs.existsSync(MANIFEST_PATH)) fs.unlinkSync(MANIFEST_PATH);
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

// ─── PERMISSIONS ─────────────────────────────────────────────────────────────
function setupPermissions() {
  session.defaultSession.setPermissionRequestHandler((_, permission, callback) => {
    callback(['media', 'microphone', 'audioCapture', 'clipboard-read'].includes(permission));
  });
  session.defaultSession.setPermissionCheckHandler((_, permission) => {
    return ['media', 'microphone', 'audioCapture'].includes(permission);
  });
}

// ─── WINDOWS ─────────────────────────────────────────────────────────────────
function createControlWindow() {
  controlWin = new BrowserWindow({
    width: 1220, height: 860, minWidth: 980, minHeight: 680,
    title: 'BHB Live — Control',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), nodeIntegration: false, contextIsolation: true },
    backgroundColor: '#0d0d0d',
    show: false,
  });
  controlWin.loadFile('control.html');
  controlWin.once('ready-to-show', () => controlWin.show());
  controlWin.on('closed', () => {
    if (liveWin && !liveWin.isDestroyed()) liveWin.close();
    app.quit();
  });
}

function createLiveWindow(opts = {}) {
  if (liveWin && !liveWin.isDestroyed()) { liveWin.focus(); return; }
  liveWin = new BrowserWindow({
    width: opts.width || 1000, height: opts.height || 1000,
    minWidth: 320, minHeight: 320,
    title: 'BHB Live — OBS Capture',
    frame: false, transparent: !!opts.transparent,
    alwaysOnTop: !!opts.alwaysOnTop, resizable: true, hasShadow: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), nodeIntegration: false, contextIsolation: true },
    backgroundColor: opts.transparent ? '#00000000' : '#000000',
    show: false,
  });
  liveWin.loadFile('live.html');
  liveWin.once('ready-to-show', () => {
    liveWin.show();
    if (controlWin && !controlWin.isDestroyed()) controlWin.webContents.send('live-window-opened');
  });
  liveWin.on('closed', () => {
    liveWin = null;
    if (controlWin && !controlWin.isDestroyed()) controlWin.webContents.send('live-window-closed');
  });
}

// ─── APP LIFECYCLE ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  setupPermissions();
  registerAssetProtocol();
  createControlWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createControlWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('will-quit', () => globalShortcut.unregisterAll());

// ─── IPC: LIVE WINDOW ────────────────────────────────────────────────────────
ipcMain.handle('open-live-window',       async (_, o) => { createLiveWindow(o); return { ok: true }; });
ipcMain.handle('close-live-window',      () => { if (liveWin && !liveWin.isDestroyed()) liveWin.close(); return { ok: true }; });
ipcMain.handle('is-live-open',           () => !!(liveWin && !liveWin.isDestroyed()));
ipcMain.handle('set-live-always-on-top', (_, f) => { if (liveWin && !liveWin.isDestroyed()) liveWin.setAlwaysOnTop(f); });
ipcMain.handle('set-live-size',          (_, { w, h }) => { if (liveWin && !liveWin.isDestroyed()) liveWin.setSize(Math.max(200,w), Math.max(200,h)); });
ipcMain.handle('update-live-state',      (_, s) => { if (liveWin && !liveWin.isDestroyed()) liveWin.webContents.send('state-update', s); return { ok: true }; });

// ─── IPC: SHORTCUTS ──────────────────────────────────────────────────────────
ipcMain.handle('register-shortcut', (_, { accelerator, expression }) => {
  if (shortcutMap.has(accelerator)) {
    try { globalShortcut.unregister(accelerator); } catch(_) {}
    shortcutMap.delete(accelerator);
  }
  for (const [k, expr] of shortcutMap.entries()) {
    if (expr === expression && k !== accelerator) {
      try { globalShortcut.unregister(k); } catch(_) {}
      shortcutMap.delete(k); break;
    }
  }
  try {
    const ok = globalShortcut.register(accelerator, () => {
      if (liveWin    && !liveWin.isDestroyed())    liveWin.webContents.send('expression-activate', expression);
      if (controlWin && !controlWin.isDestroyed()) controlWin.webContents.send('expression-activate', expression);
    });
    if (ok) { shortcutMap.set(accelerator, expression); return { ok: true }; }
    return { ok: false, error: 'Key already in use by another application' };
  } catch (e) { return { ok: false, error: e.message }; }
});
ipcMain.handle('unregister-shortcut',      (_, a) => { try { globalShortcut.unregister(a); shortcutMap.delete(a); return { ok: true }; } catch(e) { return { ok: false, error: e.message }; } });
ipcMain.handle('unregister-all-shortcuts', () => { globalShortcut.unregisterAll(); shortcutMap.clear(); return { ok: true }; });
ipcMain.handle('get-shortcuts',            () => Object.fromEntries(shortcutMap));
