/**
 * Vertical Jump: Retro Ascent (Monochrome / Muted Edition)
 * 1-FPS Animated Biomes, Collectible Retro Hats, and Full Menu System
 */

(function () {
  'use strict';

  // --- DOM Elements ---
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  const menuAvatarCanvas = document.getElementById('menu-avatar-canvas');
  const wardrobeAvatarCanvas = document.getElementById('wardrobe-avatar-canvas');

  const scoreDisplay = document.getElementById('score-display');
  const highScoreDisplay = document.getElementById('high-score-display');
  const biomeBadge = document.getElementById('biome-badge');
  const finalScore = document.getElementById('final-score');
  const finalAltitude = document.getElementById('final-altitude');
  const finalBiome = document.getElementById('final-biome');
  const finalBest = document.getElementById('final-best');

  // Overlays
  const menuOverlay = document.getElementById('menu-overlay');
  const wardrobeOverlay = document.getElementById('wardrobe-overlay');
  const statsOverlay = document.getElementById('stats-overlay');
  const pauseOverlay = document.getElementById('pause-overlay');
  const gameOverOverlay = document.getElementById('game-over-overlay');
  const toastBanner = document.getElementById('toast-banner');
  const toastText = document.getElementById('toast-text');

  const allOverlays = [menuOverlay, wardrobeOverlay, statsOverlay, pauseOverlay, gameOverOverlay];

  function setActiveOverlay(target) {
    allOverlays.forEach(overlay => {
      if (overlay) {
        overlay.classList.remove('active');
      }
    });
    if (target) {
      target.classList.add('active');
    }
  }

  // Menu Buttons
  const btnPlay = document.getElementById('btn-play');
  const btnWardrobe = document.getElementById('btn-wardrobe');
  const btnStats = document.getElementById('btn-stats');
  const btnWardrobeBack = document.getElementById('btn-wardrobe-back');
  const btnStatsBack = document.getElementById('btn-stats-back');
  const btnResume = document.getElementById('btn-resume');
  const btnPauseMenu = document.getElementById('btn-pause-menu');
  const btnRestart = document.getElementById('btn-restart');
  const btnGameoverMenu = document.getElementById('btn-gameover-menu');
  const pauseBtn = document.getElementById('pause-btn');
  const soundBtn = document.getElementById('sound-btn');

  // Wardrobe elements
  const hatsGridContainer = document.getElementById('hats-grid-container');
  const wardrobeCounter = document.getElementById('wardrobe-counter');
  const wardrobePreviewTitle = document.getElementById('wardrobe-preview-title');
  const wardrobePreviewDesc = document.getElementById('wardrobe-preview-desc');
  const btnEquipSelected = document.getElementById('btn-equip-selected');
  const menuEquippedLabel = document.getElementById('menu-equipped-label');

  // Stats elements
  const statHighScore = document.getElementById('stat-high-score');
  const statHighBiome = document.getElementById('stat-high-biome');
  const statBoxesOpened = document.getElementById('stat-boxes-opened');
  const statHatsCount = document.getElementById('stat-hats-count');
  const statTotalJumps = document.getElementById('stat-total-jumps');

  // Touch controls
  const touchLeft = document.getElementById('touch-left');
  const touchRight = document.getElementById('touch-right');

  // --- Sound Engine (8-Bit Retro Audio) ---
  class RetroAudioEngine {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.ctx = new AudioContext();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      return this.enabled;
    }

    playTone(freq, type = 'square', duration = 0.08, volume = 0.08) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
      } catch (e) { }
    }

    playMenuBlip() {
      this.playTone(440, 'square', 0.04, 0.06);
    }

    playJump() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        osc.type = 'square';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.08);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
      } catch (e) { }
    }

    playBoost() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.16);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.16);
      } catch (e) { }
    }

    playUnlockFanfare() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const notes = [330, 440, 550, 660];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playTone(freq, 'triangle', 0.09, 0.09);
        }, idx * 55);
      });
    }

    playGameOver() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.3);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
      } catch (e) { }
    }
  }

  const sound = new RetroAudioEngine();

  // --- Collectible Retro Hats (Muted / Monochrome 2-Bit Art) ---
  const HATS = [
    {
      id: 'none',
      name: 'NO HAT',
      desc: 'Classic bare square jumper.',
      trailType: null,
      draw: (ctx, x, y, size, facingLeft) => { }
    },
    {
      id: 'cap',
      name: 'RETRO CAP',
      desc: 'Classic 8-bit shaded cap with speed dash trail.',
      trailType: 'dash',
      draw: (ctx, x, y, size, facingLeft) => {
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(x + 2, y - 6, size - 4, 6);
        ctx.fillStyle = '#888888';
        if (facingLeft) {
          ctx.fillRect(x - 4, y - 2, 8, 3);
        } else {
          ctx.fillRect(x + size - 4, y - 2, 8, 3);
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + (size / 2) - 2, y - 5, 4, 3);
      }
    },
    {
      id: 'crown',
      name: 'PIXEL CROWN',
      desc: 'Regal monochrome crown with sparkle dust.',
      trailType: 'silver_sparkles',
      draw: (ctx, x, y, size, facingLeft) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 2, y - 2, size - 4, 3);
        ctx.fillRect(x + 2, y - 8, 4, 6);
        ctx.fillRect(x + (size / 2) - 2, y - 10, 4, 8);
        ctx.fillRect(x + size - 6, y - 8, 4, 6);
        ctx.fillStyle = '#888888';
        ctx.fillRect(x + (size / 2) - 1, y - 5, 2, 2);
      }
    },
    {
      id: 'propeller',
      name: 'PROPELLER BEANIE',
      desc: 'Shaded beanie with a 1-FPS spinning propeller.',
      trailType: 'wind_swirl',
      draw: (ctx, x, y, size, facingLeft, frame) => {
        ctx.fillStyle = '#aaaaaa';
        ctx.fillRect(x + 3, y - 5, size - 6, 5);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 7, y - 5, size - 14, 5);
        ctx.fillStyle = '#444444';
        ctx.fillRect(x + (size / 2) - 1, y - 9, 2, 4);
        ctx.fillStyle = '#ffffff';
        const isFrameA = (frame % 2 === 0);
        if (isFrameA) {
          ctx.fillRect(x + (size / 2) - 7, y - 10, 14, 2);
        } else {
          ctx.fillRect(x + (size / 2) - 2, y - 11, 4, 4);
        }
      }
    },
    {
      id: 'wizard',
      name: 'WIZARD CONE',
      desc: 'Pointed cone with magical stardust trail.',
      trailType: 'stardust',
      draw: (ctx, x, y, size, facingLeft) => {
        ctx.fillStyle = '#888888';
        ctx.fillRect(x, y - 2, size, 3);
        ctx.fillStyle = '#aaaaaa';
        ctx.fillRect(x + 3, y - 6, size - 6, 4);
        ctx.fillRect(x + 6, y - 10, size - 12, 4);
        ctx.fillRect(x + (size / 2) - 2, y - 14, 4, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + (size / 2) - 1, y - 16, 3, 3);
      }
      // teat
    },
    {
      id: 'cowboy',
      name: 'COWBOY STETSON',
      desc: 'Wide brim Stetson with desert sand puff trail.',
      trailType: 'dust',
      draw: (ctx, x, y, size, facingLeft) => {
        ctx.fillStyle = '#aaaaaa';
        ctx.fillRect(x - 3, y - 3, size + 6, 3);
        ctx.fillStyle = '#888888';
        ctx.fillRect(x + 4, y - 8, size - 8, 5);
        ctx.fillStyle = '#333333';
        ctx.fillRect(x + 3, y - 4, size - 6, 2);
      }
    },
    {
      id: 'ninja',
      name: 'NINJA BANDANA',
      desc: 'Dark headband with 1-FPS fluttering shadow tail.',
      trailType: 'shadow',
      draw: (ctx, x, y, size, facingLeft, frame) => {
        ctx.fillStyle = '#333333';
        ctx.fillRect(x, y + 2, size, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + (size / 2) - 3, y + 3, 6, 2);
        ctx.fillStyle = '#555555';
        const wave = (frame % 2 === 0) ? 0 : 2;
        if (facingLeft) {
          ctx.fillRect(x + size, y + 3 + wave, 6, 2);
          ctx.fillRect(x + size + 4, y + 4 + wave, 4, 2);
        } else {
          ctx.fillRect(x - 6, y + 3 + wave, 6, 2);
          ctx.fillRect(x - 8, y + 4 + wave, 4, 2);
        }
      }
    },
    {
      id: 'tophat',
      name: 'TOP HAT',
      desc: 'Dapper black cylinder with monocle glint.',
      trailType: 'monocle',
      draw: (ctx, x, y, size, facingLeft) => {
        ctx.fillStyle = '#222222';
        ctx.fillRect(x - 2, y - 2, size + 4, 3);
        ctx.fillRect(x + 3, y - 12, size - 6, 10);
        ctx.fillStyle = '#888888';
        ctx.fillRect(x + 3, y - 4, size - 6, 2);
      }
    },
    {
      id: 'chef',
      name: 'CHEF TOQUE',
      desc: 'Pleated white chef hat with steam puff trail.',
      trailType: 'steam',
      draw: (ctx, x, y, size, facingLeft) => {
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(x + 2, y - 3, size - 4, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y - 11, size, 8);
        ctx.fillStyle = '#999999';
        ctx.fillRect(x + 4, y - 11, 2, 7);
        ctx.fillRect(x + 10, y - 11, 2, 7);
        ctx.fillRect(x + 16, y - 11, 2, 7);
      }
    },
    {
      id: 'astro',
      name: 'SPACE HELMET',
      desc: 'Bubble astronaut visor with rocket smoke trail.',
      trailType: 'thruster',
      draw: (ctx, x, y, size, facingLeft) => {
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(x - 1, y - 5, size + 2, size + 4);
        ctx.fillStyle = '#333333';
        const visorX = facingLeft ? x : x + 5;
        ctx.fillRect(visorX, y - 1, size - 5, 10);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(visorX + 2, y, 2, 4);
      }
    }
  ];

  // --- Saved Player State ---
  let unlockedHats = JSON.parse(localStorage.getItem('retro_unlocked_hats') || '["none", "cap", "crown"]');
  let equippedHatId = localStorage.getItem('retro_equipped_hat') || 'cap';
  let selectedWardrobeHatId = equippedHatId;

  let totalJumpsCount = parseInt(localStorage.getItem('retro_total_jumps') || '0', 10);
  let boxesOpenedCount = parseInt(localStorage.getItem('retro_boxes_opened') || '0', 10);
  let highScore = parseInt(localStorage.getItem('retro_high_score') || '0', 10);
  let highestBiomeReached = localStorage.getItem('retro_high_biome') || 'MINE';

  // --- 1-FPS Flipbook Clock ---
  let global1FpsFrame = 0;
  setInterval(() => {
    global1FpsFrame = (global1FpsFrame + 1) % 10000;
  }, 1000);

  // --- Muted / Monochrome Biomes ---
  const BIOMES = [
    {
      id: 'MINE',
      name: 'MINE',
      minAlt: 0,
      maxAlt: 800,
      bgColor: '#141416',
      platformColor: '#3a3a42',
      drawBg: (ctx, width, height, scrollY, frame) => {
        ctx.fillStyle = '#0e0e10';
        for (let y = (scrollY * 0.2) % 60; y < height; y += 60) {
          ctx.fillRect(0, y, width, 1);
        }
        ctx.fillStyle = '#222226';
        ctx.fillRect(18, 0, 8, height);
        ctx.fillRect(width - 26, 0, 8, height);

        // 1-FPS Flickering Torch (Grayscale)
        const torchY = (height * 0.45 + scrollY * 0.3) % height;
        ctx.fillStyle = '#44444a';
        ctx.fillRect(width - 22, torchY, 4, 14);

        ctx.fillStyle = (frame % 2 === 0) ? '#cccccc' : '#ffffff';
        ctx.fillRect(width - 24, torchY - 6, 8, 6);
        ctx.fillStyle = '#888888';
        ctx.fillRect(width - 22, torchY - 4, 4, 4);

        // Twinkling crystal glints
        ctx.fillStyle = (frame % 2 === 0) ? '#ffffff' : '#666666';
        ctx.fillRect(20, (height * 0.2 + scrollY * 0.2) % height, 2, 2);
        ctx.fillRect(width - 40, (height * 0.75 + scrollY * 0.2) % height, 3, 3);
      }
    },
    {
      id: 'FOREST',
      name: 'FOREST',
      minAlt: 800,
      maxAlt: 2000,
      bgColor: '#1a1c1e',
      platformColor: '#44464c',
      drawBg: (ctx, width, height, scrollY, frame) => {
        ctx.fillStyle = '#121315';
        for (let i = 0; i < 6; i++) {
          const treeX = i * 75 + ((scrollY * 0.1) % 75);
          ctx.beginPath();
          ctx.moveTo(treeX, height);
          ctx.lineTo(treeX + 25, height - 110);
          ctx.lineTo(treeX + 50, height);
          ctx.fill();
        }

        // 1-FPS Blinking Fireflies
        const fireflyPhase = frame % 3;
        ctx.fillStyle = '#ffffff';
        if (fireflyPhase === 0) {
          ctx.fillRect(80, (height * 0.3 + scrollY * 0.4) % height, 2, 2);
        } else if (fireflyPhase === 1) {
          ctx.fillRect(280, (height * 0.6 + scrollY * 0.4) % height, 2, 2);
        } else {
          ctx.fillRect(160, (height * 0.75 + scrollY * 0.4) % height, 2, 2);
        }
      }
    },
    {
      id: 'SKY',
      name: 'SKY',
      minAlt: 2000,
      maxAlt: 4000,
      bgColor: '#26282e',
      platformColor: '#5a5c66',
      drawBg: (ctx, width, height, scrollY, frame) => {
        ctx.fillStyle = '#343840';
        const cloudOffset = (frame * 6 + scrollY * 0.15) % (width + 120) - 60;
        ctx.fillRect(cloudOffset, (height * 0.2) % height, 65, 16);
        ctx.fillRect(cloudOffset + 12, (height * 0.2 - 6) % height, 36, 6);

        const cloudOffset2 = ((frame * 4 + 180) + scrollY * 0.1) % (width + 120) - 60;
        ctx.fillRect(cloudOffset2, (height * 0.65) % height, 80, 20);
        ctx.fillRect(cloudOffset2 + 16, (height * 0.65 - 8) % height, 44, 8);

        // 1-FPS Retro Bird
        const birdX = (width - ((frame * 8) % (width + 60)));
        const birdY = (height * 0.4 + scrollY * 0.2) % height;
        ctx.fillStyle = '#666a74';
        if (frame % 2 === 0) {
          ctx.fillRect(birdX, birdY, 3, 2);
          ctx.fillRect(birdX - 3, birdY - 2, 2, 2);
          ctx.fillRect(birdX + 3, birdY - 2, 2, 2);
        } else {
          ctx.fillRect(birdX, birdY, 3, 2);
          ctx.fillRect(birdX - 3, birdY + 2, 2, 2);
          ctx.fillRect(birdX + 3, birdY + 2, 2, 2);
        }
      }
    },
    {
      id: 'MOON',
      name: 'MOON',
      minAlt: 4000,
      maxAlt: 6000,
      bgColor: '#101014',
      platformColor: '#70707a',
      drawBg: (ctx, width, height, scrollY, frame) => {
        const moonY = Math.max(40, 120 - (scrollY - 4000) * 0.15);
        ctx.fillStyle = '#e0e0e4';
        ctx.beginPath();
        ctx.arc(width / 2, moonY, 40, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#b0b0b8';
        ctx.beginPath();
        ctx.arc(width / 2 - 12, moonY - 8, 9, 0, Math.PI * 2);
        ctx.arc(width / 2 + 14, moonY + 10, 12, 0, Math.PI * 2);
        ctx.arc(width / 2 - 6, moonY + 16, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = (frame % 2 === 0) ? '#ffffff' : '#888888';
        ctx.fillRect(50, 60, 2, 2);
        ctx.fillRect(340, 90, 2, 2);
        ctx.fillRect(90, 260, 2, 2);
        ctx.fillRect(310, 320, 2, 2);
      }
    },
    {
      id: 'COSMOS',
      name: 'COSMOS',
      minAlt: 6000,
      maxAlt: 999999,
      bgColor: '#08080a',
      platformColor: '#848490',
      drawBg: (ctx, width, height, scrollY, frame) => {
        const starPhase = frame % 4;
        ctx.fillStyle = '#ffffff';
        if (starPhase % 2 === 0) {
          ctx.fillRect(40, (height * 0.15 + scrollY * 0.05) % height, 2, 2);
          ctx.fillRect(240, (height * 0.45 + scrollY * 0.05) % height, 2, 2);
        } else {
          ctx.fillRect(140, (height * 0.25 + scrollY * 0.05) % height, 2, 2);
          ctx.fillRect(320, (height * 0.75 + scrollY * 0.05) % height, 2, 2);
        }

        ctx.fillStyle = '#33333a';
        const astX = (frame * 5) % (width + 40) - 20;
        const astY = (height * 0.35 + scrollY * 0.1) % height;
        ctx.fillRect(astX, astY, 5, 5);
      }
    }
  ];

  function getCurrentBiome(altitude) {
    for (let i = BIOMES.length - 1; i >= 0; i--) {
      if (altitude >= BIOMES[i].minAlt) {
        return BIOMES[i];
      }
    }
    return BIOMES[0];
  }

  // --- Particles System (Muted Grayscale Trails) ---
  const particles = [];

  function spawnHatTrail(x, y, trailType) {
    if (!trailType) return;

    if (trailType === 'silver_sparkles' || trailType === 'stardust' || trailType === 'monocle') {
      particles.push({
        x: x + Math.random() * 20,
        y: y + 20,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 1 + Math.random() * 2,
        size: 2,
        color: '#ffffff',
        life: 18
      });
    } else if (trailType === 'dash' || trailType === 'dust' || trailType === 'wind_swirl') {
      particles.push({
        x: x + 4 + Math.random() * 12,
        y: y + 20,
        vx: (Math.random() - 0.5) * 2,
        vy: 1.5,
        size: 2,
        color: '#888888',
        life: 14
      });
    } else if (trailType === 'thruster' || trailType === 'steam') {
      particles.push({
        x: x + 6 + Math.random() * 8,
        y: y + 22,
        vx: (Math.random() - 0.5) * 1,
        vy: 2 + Math.random() * 1.5,
        size: 3,
        color: '#cccccc',
        life: 16
      });
    } else if (trailType === 'shadow') {
      particles.push({
        x: x + 2 + Math.random() * 16,
        y: y + 20,
        vx: (Math.random() - 0.5) * 1,
        vy: 1,
        size: 3,
        color: '#333333',
        life: 15
      });
    }
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function drawParticles(ctx) {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
  }

  // --- Floating Mystery Box Entity [?] ---
  class MysteryBox {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.width = 22;
      this.height = 22;
      this.collected = false;
    }

    update() { }

    draw(ctx, frame) {
      if (this.collected) return;

      ctx.fillStyle = '#3a3a42';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.strokeStyle = '#666670';
      ctx.strokeRect(this.x + 0.5, this.y + 0.5, this.width - 1, this.height - 1);

      ctx.fillStyle = (frame % 2 === 0) ? '#ffffff' : '#aaaaaa';
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', this.x + this.width / 2, this.y + this.height / 2 + 1);
    }
  }

  // --- Platform Class ---
  const PLATFORM_WIDTH = 64;
  const PLATFORM_HEIGHT = 12;

  class Platform {
    constructor(x, y, type = 'normal') {
      this.x = x;
      this.y = y;
      this.width = PLATFORM_WIDTH;
      this.height = PLATFORM_HEIGHT;
      this.type = type;
      this.broken = false;
      this.opacity = 1;
      this.vx = (Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random() * 0.8);
    }

    update() {
      if (this.type === 'moving') {
        this.x += this.vx;
        if (this.x <= 0) {
          this.x = 0;
          this.vx *= -1;
        } else if (this.x + this.width >= 400) {
          this.x = 400 - this.width;
          this.vx *= -1;
        }
      }

      if (this.broken) {
        this.y += 6;
        this.opacity -= 0.08;
      }
    }

    draw(ctx, currentBiome) {
      if (this.opacity <= 0) return;

      ctx.save();
      ctx.globalAlpha = Math.max(0, this.opacity);

      if (this.type === 'normal') {
        ctx.fillStyle = currentBiome.platformColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#18181c';
        ctx.strokeRect(this.x + 0.5, this.y + 0.5, this.width - 1, this.height - 1);
      } else if (this.type === 'moving') {
        ctx.fillStyle = '#4e505a';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#222228';
        ctx.strokeRect(this.x + 0.5, this.y + 0.5, this.width - 1, this.height - 1);
      } else if (this.type === 'fragile') {
        ctx.fillStyle = '#888890';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#55555c';
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(this.x + 0.5, this.y + 0.5, this.width - 1, this.height - 1);
      } else if (this.type === 'boost') {
        ctx.fillStyle = currentBiome.platformColor;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#18181c';
        ctx.strokeRect(this.x + 0.5, this.y + 0.5, this.width - 1, this.height - 1);

        const springW = 14;
        const springH = 5;
        const springX = this.x + (this.width - springW) / 2;
        const springY = this.y - springH;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(springX, springY, springW, springH);
      }

      ctx.restore();
    }
  }

  // --- Player Object ---
  const player = {
    x: 189,
    y: 450,
    width: 22,
    height: 22,
    vx: 0,
    vy: -10.5,
    facingLeft: false,

    reset() {
      this.x = 189;
      this.y = 450;
      this.vx = 0;
      this.vy = -10.5;
      this.facingLeft = false;
    },

    update() {
      if (keys.left) {
        this.vx -= 0.85;
        this.facingLeft = true;
      }
      if (keys.right) {
        this.vx += 0.85;
        this.facingLeft = false;
      }

      this.vx *= 0.84;
      if (Math.abs(this.vx) > 6.5) this.vx = Math.sign(this.vx) * 6.5;
      if (Math.abs(this.vx) < 0.05) this.vx = 0;

      this.x += this.vx;

      if (this.x + this.width < 0) this.x = 400;
      else if (this.x > 400) this.x = -this.width;

      this.vy += 0.34;
      this.y += this.vy;

      if (this.vy < 0) {
        const equippedHat = HATS.find(h => h.id === equippedHatId);
        if (equippedHat && equippedHat.trailType) {
          spawnHatTrail(this.x, this.y, equippedHat.trailType);
        }
      }
    },

    draw(ctx) {
      ctx.fillStyle = '#e6e6e6';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.strokeStyle = '#18181c';
      ctx.strokeRect(this.x + 0.5, this.y + 0.5, this.width - 1, this.height - 1);

      ctx.fillStyle = '#18181c';
      const eyeOffset = this.facingLeft ? 4 : 12;
      ctx.fillRect(this.x + eyeOffset, this.y + 5, 3, 4);
      ctx.fillRect(this.x + eyeOffset + 5, this.y + 5, 3, 4);

      const equippedHat = HATS.find(h => h.id === equippedHatId);
      if (equippedHat && equippedHat.draw) {
        equippedHat.draw(ctx, this.x, this.y, this.width, this.facingLeft, global1FpsFrame);
      }
    }
  };

  // --- Game State Variables ---
  let gameState = 'MENU';
  let score = 0;
  let maxAltitude = 0;
  let platforms = [];
  let mysteryBoxes = [];
  let hasReachedMoonThisRun = false;

  const keys = { left: false, right: false };

  // --- Platform Spawner ---
  function initGameWorld() {
    platforms = [];
    mysteryBoxes = [];
    hasReachedMoonThisRun = false;

    platforms.push(new Platform(200 - PLATFORM_WIDTH / 2, 540, 'normal'));

    let currentY = 540;
    while (currentY > 0) {
      currentY -= (55 + Math.random() * 30);
      const x = Math.random() * (400 - PLATFORM_WIDTH);
      platforms.push(generatePlatformAt(x, currentY));
    }
  }

  function generatePlatformAt(x, y) {
    const r = Math.random();
    let type = 'normal';

    const heightProgress = Math.min(1, maxAltitude / 6000);
    const fragileChance = 0.1 + heightProgress * 0.15;
    const movingChance = 0.15 + heightProgress * 0.2;
    const boostChance = 0.1;

    if (r < boostChance) type = 'boost';
    else if (r < boostChance + fragileChance) type = 'fragile';
    else if (r < boostChance + fragileChance + movingChance) type = 'moving';

    if (Math.random() < 0.08 && mysteryBoxes.length < 3) {
      mysteryBoxes.push(new MysteryBox(x + 20, y - 45));
    }

    return new Platform(x, y, type);
  }

  function spawnNextPlatform() {
    let highestY = 600;
    for (let i = 0; i < platforms.length; i++) {
      if (platforms[i].y < highestY) highestY = platforms[i].y;
    }

    const spacing = 55 + Math.random() * 30;
    const newY = highestY - spacing;
    const newX = Math.random() * (400 - PLATFORM_WIDTH);
    platforms.push(generatePlatformAt(newX, newY));
  }

  // --- Toast Notification ---
  let toastTimer = null;
  function showToast(text) {
    if (toastTimer) clearTimeout(toastTimer);
    document.getElementById('toast-icon').textContent = '★';
    toastText.textContent = text;
    toastBanner.classList.remove('hidden');

    toastTimer = setTimeout(() => {
      toastBanner.classList.add('hidden');
      toastTimer = null;
    }, 2200);
  }

  // --- Mystery Box Unlock ---
  function collectMysteryBox(box) {
    box.collected = true;
    boxesOpenedCount++;
    localStorage.setItem('retro_boxes_opened', boxesOpenedCount.toString());
    sound.playUnlockFanfare();

    const lockedHats = HATS.filter(h => !unlockedHats.includes(h.id));
    if (lockedHats.length > 0) {
      const newHat = lockedHats[Math.floor(Math.random() * lockedHats.length)];
      unlockedHats.push(newHat.id);
      localStorage.setItem('retro_unlocked_hats', JSON.stringify(unlockedHats));
      showToast(`UNLOCKED: ${newHat.name}!`);
      updateWardrobeUI();
    } else {
      maxAltitude += 2500;
      score = Math.floor(maxAltitude / 10);
      showToast('+250 PTS BONUS!');
    }
  }

  // --- Wardrobe UI ---
  function updateWardrobeUI() {
    wardrobeCounter.textContent = `UNLOCKED: ${unlockedHats.length}/${HATS.length}`;
    menuEquippedLabel.textContent = `HAT: ${HATS.find(h => h.id === equippedHatId)?.name || 'NONE'}`;

    hatsGridContainer.innerHTML = '';
    HATS.forEach(hat => {
      const isUnlocked = unlockedHats.includes(hat.id);
      const isEquipped = (hat.id === equippedHatId);
      const isSelected = (hat.id === selectedWardrobeHatId);

      const card = document.createElement('div');
      card.className = `hat-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;

      const miniCanvas = document.createElement('canvas');
      miniCanvas.width = 36;
      miniCanvas.height = 36;
      const mctx = miniCanvas.getContext('2d');
      drawAvatarPreview(mctx, 36, 36, hat.id, false);

      const nameLabel = document.createElement('span');
      nameLabel.className = 'hat-name';
      nameLabel.textContent = isUnlocked ? hat.name : '???';

      const tag = document.createElement('span');
      tag.className = `hat-status-tag ${isEquipped ? 'equipped' : isUnlocked ? 'unlocked' : 'locked'}`;
      tag.textContent = isEquipped ? 'EQUIPPED' : isUnlocked ? 'UNLOCKED' : 'LOCKED';

      card.appendChild(miniCanvas);
      card.appendChild(nameLabel);
      card.appendChild(tag);

      card.addEventListener('click', () => {
        sound.playMenuBlip();
        selectedWardrobeHatId = hat.id;
        updateSelectedHatDetails();
        updateWardrobeUI();
      });

      hatsGridContainer.appendChild(card);
    });

    updateSelectedHatDetails();
  }

  function updateSelectedHatDetails() {
    const hat = HATS.find(h => h.id === selectedWardrobeHatId);
    if (!hat) return;

    const isUnlocked = unlockedHats.includes(hat.id);
    const isEquipped = (hat.id === equippedHatId);

    wardrobePreviewTitle.textContent = isUnlocked ? hat.name : 'LOCKED HAT [?]';
    wardrobePreviewDesc.textContent = isUnlocked ? hat.desc : 'Collect [?] Mystery Boxes during runs to unlock this hat!';

    if (!isUnlocked) {
      btnEquipSelected.textContent = 'LOCKED';
      btnEquipSelected.disabled = true;
      btnEquipSelected.className = 'pixel-btn mini-btn';
    } else if (isEquipped) {
      btnEquipSelected.textContent = 'EQUIPPED';
      btnEquipSelected.disabled = true;
      btnEquipSelected.className = 'pixel-btn mini-btn';
    } else {
      btnEquipSelected.textContent = 'EQUIP HAT';
      btnEquipSelected.disabled = false;
      btnEquipSelected.className = 'pixel-btn mini-btn primary-btn';
    }

    const wctx = wardrobeAvatarCanvas.getContext('2d');
    drawAvatarPreview(wctx, 72, 72, isUnlocked ? hat.id : 'none', true);
  }

  btnEquipSelected.addEventListener('click', () => {
    if (!unlockedHats.includes(selectedWardrobeHatId)) return;
    equippedHatId = selectedWardrobeHatId;
    localStorage.setItem('retro_equipped_hat', equippedHatId);
    sound.playMenuBlip();
    updateWardrobeUI();
    showToast(`EQUIPPED: ${HATS.find(h => h.id === equippedHatId)?.name}!`);
  });

  // --- Avatar Preview Renderer ---
  function drawAvatarPreview(pctx, w, h, hatId, showBobbing = true) {
    pctx.clearRect(0, 0, w, h);

    const size = Math.floor(w * 0.45);
    const bob = showBobbing && (global1FpsFrame % 2 === 0) ? -2 : 0;
    const px = Math.floor((w - size) / 2);
    const py = Math.floor((h - size) / 2) + 6 + bob;

    pctx.fillStyle = '#e6e6e6';
    pctx.fillRect(px, py, size, size);
    pctx.strokeStyle = '#18181c';
    pctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);

    pctx.fillStyle = '#18181c';
    pctx.fillRect(px + 6, py + 5, 3, 3);
    pctx.fillRect(px + size - 9, py + 5, 3, 3);

    const hat = HATS.find(h => h.id === hatId);
    if (hat && hat.draw) {
      hat.draw(pctx, px, py, size, false, global1FpsFrame);
    }
  }

  // --- Stats Modal ---
  function updateStatsUI() {
    statHighScore.textContent = highScore;
    statHighBiome.textContent = highestBiomeReached;
    statBoxesOpened.textContent = boxesOpenedCount;
    statHatsCount.textContent = `${unlockedHats.length} / ${HATS.length}`;
    statTotalJumps.textContent = totalJumpsCount;
  }

  // --- State Transitions ---
  function showMenu() {
    gameState = 'MENU';
    sound.playMenuBlip();
    setActiveOverlay(menuOverlay);
    updateWardrobeUI();
  }

  function showWardrobe() {
    gameState = 'WARDROBE';
    sound.playMenuBlip();
    selectedWardrobeHatId = equippedHatId;
    updateWardrobeUI();
    setActiveOverlay(wardrobeOverlay);
  }

  function showStats() {
    gameState = 'STATS';
    sound.playMenuBlip();
    updateStatsUI();
    setActiveOverlay(statsOverlay);
  }

  function startRun() {
    sound.init();
    sound.playMenuBlip();
    maxAltitude = 0;
    score = 0;
    scoreDisplay.textContent = '0';
    player.reset();
    initGameWorld();

    gameState = 'PLAYING';
    setActiveOverlay(null); // Completely close all overlay menus!
  }

  function pauseRun() {
    if (gameState !== 'PLAYING') return;
    gameState = 'PAUSED';
    setActiveOverlay(pauseOverlay);
  }

  function resumeRun() {
    if (gameState !== 'PAUSED') return;
    gameState = 'PLAYING';
    setActiveOverlay(null);
  }

  function triggerGameOver() {
    gameState = 'GAMEOVER';
    sound.playGameOver();

    const currentBiome = getCurrentBiome(maxAltitude);
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('retro_high_score', highScore.toString());
      highScoreDisplay.textContent = highScore;
    }

    highestBiomeReached = currentBiome.name;
    localStorage.setItem('retro_high_biome', highestBiomeReached);

    finalScore.textContent = score;
    finalAltitude.textContent = `${Math.floor(maxAltitude / 10)}m`;
    finalBiome.textContent = currentBiome.name;
    finalBest.textContent = highScore;

    setActiveOverlay(gameOverOverlay);
  }

  // --- Update & Physics ---
  function update() {
    if (gameState !== 'PLAYING') return;

    player.update();
    updateParticles();

    if (player.vy > 0) {
      for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];
        if (p.broken) continue;

        if (
          player.x + player.width > p.x &&
          player.x < p.x + p.width &&
          player.y + player.height >= p.y &&
          player.y + player.height <= p.y + p.height + player.vy
        ) {
          player.y = p.y - player.height;
          totalJumpsCount++;
          localStorage.setItem('retro_total_jumps', totalJumpsCount.toString());

          if (p.type === 'boost') {
            player.vy = -16.5;
            sound.playBoost();
          } else {
            player.vy = -10.5;
            sound.playJump();
          }

          if (p.type === 'fragile') p.broken = true;
          break;
        }
      }
    }

    // Check Mystery Box Collision
    for (let i = 0; i < mysteryBoxes.length; i++) {
      const box = mysteryBoxes[i];
      if (box.collected) continue;

      if (
        player.x + player.width > box.x &&
        player.x < box.x + box.width &&
        player.y + player.height > box.y &&
        player.y < box.y + box.height
      ) {
        collectMysteryBox(box);
      }
    }

    // Camera scrolling
    const midScreen = 600 * 0.45;
    if (player.y < midScreen) {
      const scrollDiff = midScreen - player.y;
      player.y = midScreen;
      maxAltitude += scrollDiff;
      score = Math.floor(maxAltitude / 10);
      scoreDisplay.textContent = score;

      const currentBiome = getCurrentBiome(maxAltitude);
      biomeBadge.textContent = currentBiome.name;

      if (maxAltitude >= 40000 && !hasReachedMoonThisRun) {
        hasReachedMoonThisRun = true;
        showToast('MOON REACHED!');
        sound.playUnlockFanfare();
      }

      for (let i = 0; i < platforms.length; i++) platforms[i].y += scrollDiff;
      for (let i = 0; i < mysteryBoxes.length; i++) mysteryBoxes[i].y += scrollDiff;
      for (let i = 0; i < particles.length; i++) particles[i].y += scrollDiff;
    }

    // Recycle platforms
    for (let i = platforms.length - 1; i >= 0; i--) {
      const p = platforms[i];
      p.update();
      if (p.y > 620 || p.opacity <= 0) {
        platforms.splice(i, 1);
        spawnNextPlatform();
      }
    }

    // Recycle mystery boxes
    for (let i = mysteryBoxes.length - 1; i >= 0; i--) {
      if (mysteryBoxes[i].y > 620 || mysteryBoxes[i].collected) {
        mysteryBoxes.splice(i, 1);
      }
    }

    // Fall death check
    if (player.y > 630) {
      triggerGameOver();
    }
  }

  // --- Render Frame ---
  function draw() {
    const currentBiome = getCurrentBiome(maxAltitude);

    // 1. Draw Biome Background (Muted Grayscale)
    ctx.fillStyle = currentBiome.bgColor;
    ctx.fillRect(0, 0, 400, 600);
    currentBiome.drawBg(ctx, 400, 600, maxAltitude, global1FpsFrame);

    // 2. Draw Platforms
    for (let i = 0; i < platforms.length; i++) {
      platforms[i].draw(ctx, currentBiome);
    }

    // 3. Draw Mystery Boxes
    for (let i = 0; i < mysteryBoxes.length; i++) {
      mysteryBoxes[i].draw(ctx, global1FpsFrame);
    }

    // 4. Draw Particles
    drawParticles(ctx);

    // 5. Draw Player
    if (gameState === 'PLAYING' || gameState === 'PAUSED') {
      player.draw(ctx);
    }

    // 6. Update Menu Avatar Mirror
    if (gameState === 'MENU') {
      const mctx = menuAvatarCanvas.getContext('2d');
      drawAvatarPreview(mctx, 60, 60, equippedHatId, true);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // --- Event Listeners ---
  btnPlay.addEventListener('click', startRun);
  btnWardrobe.addEventListener('click', showWardrobe);
  btnStats.addEventListener('click', showStats);
  btnWardrobeBack.addEventListener('click', showMenu);
  btnStatsBack.addEventListener('click', showMenu);
  btnResume.addEventListener('click', resumeRun);
  btnPauseMenu.addEventListener('click', showMenu);
  btnRestart.addEventListener('click', startRun);
  btnGameoverMenu.addEventListener('click', showMenu);

  pauseBtn.addEventListener('click', () => {
    if (gameState === 'PLAYING') pauseRun();
    else if (gameState === 'PAUSED') resumeRun();
  });

  soundBtn.addEventListener('click', () => {
    const isEnabled = sound.toggle();
    soundBtn.textContent = isEnabled ? '🔊' : '🔇';
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
    else if (e.code === 'KeyP' || e.code === 'Escape') {
      if (gameState === 'PLAYING') pauseRun();
      else if (gameState === 'PAUSED') resumeRun();
    } else if (e.code === 'Space') {
      if (gameState === 'MENU' || gameState === 'GAMEOVER') startRun();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
  });

  function bindTouch(btn, key) {
    const press = (e) => { e.preventDefault(); keys[key] = true; };
    const release = (e) => { e.preventDefault(); keys[key] = false; };
    btn.addEventListener('touchstart', press, { passive: false });
    btn.addEventListener('touchend', release, { passive: false });
    btn.addEventListener('mousedown', press);
    btn.addEventListener('mouseup', release);
    btn.addEventListener('mouseleave', release);
  }
  bindTouch(touchLeft, 'left');
  bindTouch(touchRight, 'right');

  canvas.addEventListener('touchstart', (e) => {
    const rect = canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    if (touchX < rect.width / 2) {
      keys.left = true;
      keys.right = false;
    } else {
      keys.right = true;
      keys.left = false;
    }
  }, { passive: true });

  canvas.addEventListener('touchend', () => {
    keys.left = false;
    keys.right = false;
  }, { passive: true });

  initGameWorld();
  showMenu();
  requestAnimationFrame(loop);
})();
