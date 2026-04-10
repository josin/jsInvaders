// =============================================================================
// jsInvaders — Browser-based clone of nInvaders (terminal Space Invaders)
// Complete implementation: canvas character-grid rendering on 80×24 monospace grid
// =============================================================================

// ===========================================================================
// CONSTANTS
// ===========================================================================
const SCREEN_WIDTH = 80;
const SCREEN_HEIGHT = 24;
const CELL_W = 9;   // 720 / 80
const CELL_H = 20;  // 480 / 24

const PLAYER_WIDTH = 5;
const PLAYER_POSY = 22;

const BUNKER_WIDTH = 80;
const BUNKER_HEIGHT = 4;
const BUNKER_X = 0;
const BUNKER_Y = 16;

const UFO_WIDTH = 5;
const UFO_POSY = 0;

const ALIENS_MAX_MISSILES = 10;
const ALIEN_COLS = 10;
const ALIEN_ROWS = 5;

const SKILL_LEVEL = 5;

// Game states
const GAME_LOOP = 1;
const GAME_NEXTLEVEL = 2;
const GAME_PAUSED = 3;
const GAME_OVER = 4;
const GAME_EXIT = 5;
const GAME_HIGHSCORE = 6;

// Colors
const RED = "#FF0000";
const GREEN = "#00FF00";
const YELLOW = "#FFFF00";
const BLUE = "#4444FF";
const CYAN = "#00FFFF";
const MAGENTA = "#FF00FF";
const WHITE = "#FFFFFF";

// Explosion characters
const EXPLOSION_CHARS = "@~.,^#*-_=\\/%{}";

// Points
const SCORE_UFO = 500;
const SCORE_TYPE1 = 200;
const SCORE_TYPE2 = 150;
const SCORE_TYPE3 = 100;

const EXTRA_LIFE_INTERVAL = 6000;
const STARTING_LIVES = 3;

// ===========================================================================
// ALIEN SPRITES
// ===========================================================================
// 3 skin sets, each with 3 types, each with 2 animation frames
const ALIEN_SPRITES = [
  // Skin set 0
  [
    [",^,", ".-."],   // Type 1
    ["_O-", "-O_"],   // Type 2
    ["-o-", "/o\\"]   // Type 3
  ],
  // Skin set 1
  [
    ["o=o", "o-o"],   // Type 1
    ["<O>", "<o>"],   // Type 2
    ["_x_", "-x-"]    // Type 3
  ],
  // Skin set 2
  [
    ["*^*", "o^o"],   // Type 1
    ["\\_/", "/~\\"], // Type 2
    ["o o", "oo "]    // Type 3
  ]
];

// Color array: [set0-t1, set0-t2, set0-t3, set1-t1, set1-t2, set1-t3, set2-t1, set2-t2, set2-t3]
const ALIEN_COLORS = [RED, GREEN, BLUE, RED, YELLOW, WHITE, WHITE, YELLOW, RED];

// UFO frames
const UFO_FRAMES = ["<o o>", "<oo >", "<o o>", "< oo>"];

// Bunker pattern (4 rows × 80 cols)
const BUNKER_PATTERN = [
  "        ###                 ###                 ###                 ###         ",
  "       #####               #####               #####               #####        ",
  "      #######             #######             #######             #######       ",
  "      ##   ##             ##   ##             ##   ##             ##   ##       "
];

// Title banner
const TITLE_BANNER = [
  "         ____                 __",
  "   ___  /  _/__ _  _____  ___/ /__ _______",
  "  / _ \\_/ // _ \\ |/ / _ `/ _  / -_) __(_-<",
  " /_//_/___/_//_/___/\\_,_/\\_,_/\\__/_/ /___/"
];

// Game Over block letters
const GAMEOVER_TOP = [
  " #####   ####  ##   ## ######",
  "##      ##  ## ####### ##    ",
  "## ###  ###### ## # ## ##### ",
  "##  ##  ##  ## ##   ## ##    ",
  " #####  ##  ## ##   ## ######"
];
const GAMEOVER_BOTTOM = [
  " ####  ##   ## ###### ######",
  "##  ## ##   ## ##     ##   ##",
  "##  ##  ## ##  #####  ######",
  "##  ##  ## ##  ##     ##  ##",
  " ####    ###   ###### ##   ##"
];

// Ratings
const RATINGS = [
  { threshold: 5000, label: "Alien Fodder" },
  { threshold: 7500, label: "Easy Target" },
  { threshold: 10000, label: "Barely Mediocre" },
  { threshold: 12500, label: "Shows Promise" },
  { threshold: 15000, label: "Alien Blaster" },
  { threshold: 20000, label: "Earth Defender" },
  { threshold: Infinity, label: "Supreme Protector" }
];

// ===========================================================================
// UTILITY
// ===========================================================================
function padLeft(val, width) {
  let s = String(val);
  while (s.length < width) s = " " + s;
  return s;
}

function getRating(score, lives) {
  if (lives > 0) return "Quitter";
  for (let i = 0; i < RATINGS.length; i++) {
    if (score < RATINGS[i].threshold) return RATINGS[i].label;
  }
  return RATINGS[RATINGS.length - 1].label;
}

// ===========================================================================
// RENDERER
// ===========================================================================
const Renderer = {
  canvas: null,
  ctx: null,

  init() {
    this.canvas = document.getElementById("game");
    this.ctx = this.canvas.getContext("2d");
    this.ctx.textBaseline = "top";
    // Size the font so each character fits within a 9×20 cell.
    // 16px Courier New gives ~9px character width at textBaseline "top".
    this.ctx.font = "16px 'Courier New', Courier, monospace";
  },

  clear() {
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  },

  drawChar(col, row, ch, color) {
    if (col < 0 || col >= SCREEN_WIDTH || row < 0 || row >= SCREEN_HEIGHT) return;
    this.ctx.fillStyle = color;
    this.ctx.fillText(ch, col * CELL_W, row * CELL_H + 2);
  },

  drawString(col, row, str, color) {
    for (let i = 0; i < str.length; i++) {
      this.drawChar(col + i, row, str[i], color);
    }
  }
};

// ===========================================================================
// HIGH SCORES
// ===========================================================================
const HighScores = {
  LS_KEY: "jsInvaders_highscores",
  entries: [],

  init() {
    const stored = localStorage.getItem(this.LS_KEY);
    if (stored) {
      try {
        this.entries = JSON.parse(stored);
      } catch (_) {
        this.entries = [];
      }
    }
    if (!this.entries || this.entries.length === 0) {
      this.entries = [];
      for (let i = 0; i < 10; i++) {
        this.entries.push({
          name: "INVADER" + (i < 9 ? " " : "") + (i + 1),
          score: 1000 - i * 100
        });
      }
      this.save();
    }
  },

  save() {
    localStorage.setItem(this.LS_KEY, JSON.stringify(this.entries));
  },

  qualifies(score) {
    if (this.entries.length < 10) return true;
    return score > this.entries[this.entries.length - 1].score;
  },

  insert(name, score) {
    name = (name + "        ").substring(0, 8);
    this.entries.push({ name, score });
    this.entries.sort((a, b) => b.score - a.score);
    if (this.entries.length > 10) {
      this.entries.length = 10;
    }
    this.save();
  }
};

// ===========================================================================
// BUNKERS
// ===========================================================================
const Bunkers = {
  grid: null,

  init() {
    this.grid = [];
    for (let r = 0; r < BUNKER_HEIGHT; r++) {
      this.grid[r] = [];
      for (let c = 0; c < BUNKER_WIDTH; c++) {
        this.grid[r][c] = (BUNKER_PATTERN[r][c] === "#");
      }
    }
  },

  destroyAll() {
    for (let r = 0; r < BUNKER_HEIGHT; r++) {
      for (let c = 0; c < BUNKER_WIDTH; c++) {
        this.grid[r][c] = false;
      }
    }
  },

  hit(screenX, screenY) {
    const bx = screenX - BUNKER_X;
    const by = screenY - BUNKER_Y;
    if (bx < 0 || bx >= BUNKER_WIDTH || by < 0 || by >= BUNKER_HEIGHT) return false;
    if (this.grid[by][bx]) {
      this.grid[by][bx] = false;
      return true;
    }
    return false;
  },

  draw() {
    for (let r = 0; r < BUNKER_HEIGHT; r++) {
      for (let c = 0; c < BUNKER_WIDTH; c++) {
        if (this.grid[r][c]) {
          Renderer.drawChar(BUNKER_X + c, BUNKER_Y + r, "#", CYAN);
        }
      }
    }
  }
};

// ===========================================================================
// PLAYER
// ===========================================================================
const Player = {
  posX: 0,
  lives: STARTING_LIVES,
  score: 0,
  exploding: false,
  explosionFrame: 0,
  explosionTimer: null,
  missile: { active: false, x: 0, y: 0, counter: 0 },
  lastDir: 0,

  init() {
    this.posX = 0;
    this.lives = STARTING_LIVES;
    this.score = 0;
    this.exploding = false;
    this.explosionFrame = 0;
    if (this.explosionTimer) {
      clearTimeout(this.explosionTimer);
      this.explosionTimer = null;
    }
    this.missile.active = false;
    this.lastDir = 0;
  },

  resetForLevel() {
    this.posX = 0;
    this.missile.active = false;
    this.exploding = false;
    this.lastDir = 0;
  },

  moveLeft() {
    const speed = (this.lastDir === -1) ? 2 : 1;
    this.lastDir = -1;
    this.posX -= speed;
    if (this.posX < 0) this.posX = 0;
  },

  moveRight() {
    const speed = (this.lastDir === 1) ? 2 : 1;
    this.lastDir = 1;
    this.posX += speed;
    const max = SCREEN_WIDTH - PLAYER_WIDTH;
    if (this.posX > max) this.posX = max;
  },

  fire() {
    if (this.missile.active || this.exploding) return;
    this.missile.active = true;
    this.missile.x = this.posX + Math.floor(PLAYER_WIDTH / 2);
    this.missile.y = PLAYER_POSY - 1;
    this.missile.counter = 0;
  },

  updateMissile() {
    if (!this.missile.active) return;
    this.missile.counter++;
    if (this.missile.counter > 1) {
      this.missile.counter = 0;
      this.missile.y--;
      if (this.missile.y < 0) {
        this.missile.active = false;
      }
    }
  },

  addScore(pts) {
    const oldScore = this.score;
    this.score += pts;
    const oldBracket = Math.floor(oldScore / EXTRA_LIFE_INTERVAL);
    const newBracket = Math.floor(this.score / EXTRA_LIFE_INTERVAL);
    if (newBracket > oldBracket) {
      this.lives++;
    }
  },

  startExplosion() {
    this.exploding = true;
    this.explosionFrame = 0;

    const runFrame = () => {
      this.explosionFrame++;
      if (this.explosionFrame >= 5) {
        this.exploding = false;
        this.lives--;
        if (this.lives <= 0) {
          Game.state = GAME_OVER;
          Game.overCounter = 0;
        }
        return;
      }
      this.explosionTimer = setTimeout(runFrame, 100);
    };
    this.explosionTimer = setTimeout(runFrame, 100);
  },

  draw() {
    if (this.exploding) {
      for (let i = 0; i < PLAYER_WIDTH; i++) {
        const ch = EXPLOSION_CHARS[Math.floor(Math.random() * EXPLOSION_CHARS.length)];
        Renderer.drawChar(this.posX + i, PLAYER_POSY, ch, YELLOW);
      }
    } else {
      Renderer.drawString(this.posX, PLAYER_POSY, "/-^-\\", YELLOW);
    }
  },

  drawMissile() {
    if (this.missile.active) {
      Renderer.drawChar(this.missile.x, this.missile.y, "!", WHITE);
    }
  }
};

// ===========================================================================
// ALIENS
// ===========================================================================
const Aliens = {
  grid: null,
  posX: 0,
  posY: 1,
  direction: 1,
  animFrame: 0,
  moveCounter: 0,
  shipnum: 50,
  hasDescended: false,
  missiles: [],
  missileMoveCounter: 0,
  missileFireAccum: 0,
  left: 0,
  right: 9,
  bottom: 4,

  init() {
    this.grid = [];
    for (let r = 0; r < ALIEN_ROWS; r++) {
      this.grid[r] = [];
      for (let c = 0; c < ALIEN_COLS; c++) {
        this.grid[r][c] = true;
      }
    }
    this.posX = 5;
    this.posY = 1;
    this.direction = 1;
    this.animFrame = 0;
    this.moveCounter = 0;
    this.shipnum = ALIEN_ROWS * ALIEN_COLS;
    this.hasDescended = false;
    this.missiles = [];
    this.missileMoveCounter = 0;
    this.missileFireAccum = 0;
    this.updateBounds();
  },

  updateBounds() {
    this.left = ALIEN_COLS;
    this.right = -1;
    this.bottom = -1;
    for (let r = 0; r < ALIEN_ROWS; r++) {
      for (let c = 0; c < ALIEN_COLS; c++) {
        if (this.grid[r][c]) {
          if (c < this.left) this.left = c;
          if (c > this.right) this.right = c;
          if (r > this.bottom) this.bottom = r;
        }
      }
    }
  },

  getWeite() {
    let w = Math.floor((this.shipnum + (SKILL_LEVEL * 10) - (Game.level * 5) + 5) / 10);
    if (w < 0) w = 0;
    return w;
  },

  update() {
    const weite = this.getWeite();
    this.moveCounter++;
    if (this.moveCounter > weite) {
      this.moveCounter = 0;
      this.animFrame = 1 - this.animFrame;

      const formLeftCol = this.posX + this.left * 3;
      const formRightCol = this.posX + this.right * 3 + 2;

      if (this.direction === 1 && formRightCol >= SCREEN_WIDTH - 1) {
        this.posY++;
        this.direction = -1;
        this.hasDescended = true;
        this.checkDescent();
        return;
      }
      if (this.direction === -1 && formLeftCol <= 0) {
        this.posY++;
        this.direction = 1;
        this.hasDescended = true;
        this.checkDescent();
        return;
      }

      this.posX += this.direction;
    }

    this.checkDescent();
  },

  checkDescent() {
    const bottomRow = this.posY + this.bottom * 2;
    if (bottomRow >= BUNKER_Y) {
      Bunkers.destroyAll();
    }
    if (bottomRow >= SCREEN_HEIGHT - 2) {
      Player.lives = 0;
      Game.state = GAME_OVER;
      Game.overCounter = 0;
    }
  },

  updateMissiles() {
    // Move existing missiles
    this.missileMoveCounter++;
    if (this.missileMoveCounter > 5) {
      this.missileMoveCounter = 0;
      for (let i = this.missiles.length - 1; i >= 0; i--) {
        this.missiles[i].y++;
        if (this.missiles[i].y >= SCREEN_HEIGHT) {
          this.missiles.splice(i, 1);
        }
      }
    }

    // Fire new missiles
    if (this.shipnum <= 0) return;
    this.missileFireAccum += 10;
    const threshold = (SKILL_LEVEL * 8) * (this.shipnum + 2);
    if (this.missileFireAccum > threshold && this.missiles.length < ALIENS_MAX_MISSILES) {
      this.missileFireAccum = 0;
      this.fireFromRandomColumn();
    }
  },

  fireFromRandomColumn() {
    const aliveCols = [];
    for (let c = 0; c < ALIEN_COLS; c++) {
      for (let r = ALIEN_ROWS - 1; r >= 0; r--) {
        if (this.grid[r][c]) {
          aliveCols.push({ col: c, row: r });
          break;
        }
      }
    }
    if (aliveCols.length === 0) return;
    const pick = aliveCols[Math.floor(Math.random() * aliveCols.length)];
    const mx = this.posX + pick.col * 3 + 1;
    const my = this.posY + pick.row * 2 + 1;
    this.missiles.push({ x: mx, y: my });
  },

  getSkinSet() {
    let lvl = Game.level;
    if (lvl < 1) lvl = 1;
    return (lvl - 1) % 3;
  },

  getAlienType(row) {
    if (row === 0) return 0;
    if (row <= 2) return 1;
    return 2;
  },

  getAlienColor(skinSet, type) {
    return ALIEN_COLORS[skinSet * 3 + type];
  },

  getAlienScore(row) {
    const type = this.getAlienType(row);
    if (type === 0) return SCORE_TYPE1;
    if (type === 1) return SCORE_TYPE2;
    return SCORE_TYPE3;
  },

  draw() {
    const skinSet = this.getSkinSet();
    for (let r = 0; r < ALIEN_ROWS; r++) {
      for (let c = 0; c < ALIEN_COLS; c++) {
        if (!this.grid[r][c]) continue;
        const type = this.getAlienType(r);
        const sprite = ALIEN_SPRITES[skinSet][type][this.animFrame];
        const color = this.getAlienColor(skinSet, type);
        const sx = this.posX + c * 3;
        const sy = this.posY + r * 2;
        Renderer.drawString(sx, sy, sprite, color);
      }
    }
  },

  drawMissiles() {
    for (let i = 0; i < this.missiles.length; i++) {
      Renderer.drawChar(this.missiles[i].x, this.missiles[i].y, ":", CYAN);
    }
  }
};

// ===========================================================================
// UFO
// ===========================================================================
const Ufo = {
  active: false,
  posX: 0,
  animFrame: 0,
  moveCounter: 0,

  init() {
    this.active = false;
    this.posX = 0;
    this.animFrame = 0;
    this.moveCounter = 0;
  },

  trySpawn() {
    if (this.active) return;
    if (!Aliens.hasDescended) return;
    if (Math.random() < 1 / 200) {
      this.active = true;
      this.posX = SCREEN_WIDTH - UFO_WIDTH;
      this.animFrame = 0;
      this.moveCounter = 0;
    }
  },

  update() {
    if (!this.active) return;
    this.moveCounter++;
    if (this.moveCounter > 3) {
      this.moveCounter = 0;
      this.posX--;
      this.animFrame = (this.animFrame + 1) % 4;
      if (this.posX <= 1) {
        this.active = false;
      }
    }
  },

  draw() {
    if (!this.active) return;
    const sprite = UFO_FRAMES[this.animFrame];
    Renderer.drawString(this.posX, UFO_POSY, sprite, MAGENTA);
  }
};

// ===========================================================================
// COLLISIONS
// ===========================================================================
const Collisions = {
  check() {
    this.playerMissileVsAliens();
    this.playerMissileVsBunker();
    this.playerMissileVsUfo();
    this.alienMissilesVsPlayer();
    this.alienMissilesVsBunker();
  },

  playerMissileVsAliens() {
    const m = Player.missile;
    if (!m.active) return;

    const formLeft = Aliens.posX + Aliens.left * 3;
    const formRight = Aliens.posX + Aliens.right * 3 + 2;
    const formTop = Aliens.posY;
    const formBottom = Aliens.posY + Aliens.bottom * 2;

    if (m.x < formLeft || m.x > formRight || m.y < formTop || m.y > formBottom) return;

    const relX = m.x - Aliens.posX;
    const relY = m.y - Aliens.posY;
    // Aliens are spaced every 2 rows; odd relY means empty gap between rows
    if (relY < 0 || relY % 2 !== 0) return;
    const col = Math.floor(relX / 3);
    const row = relY / 2;

    if (col < 0 || col >= ALIEN_COLS || row < 0 || row >= ALIEN_ROWS) return;
    if (!Aliens.grid[row][col]) return;

    // Hit!
    Aliens.grid[row][col] = false;
    Aliens.shipnum--;
    Player.addScore(Aliens.getAlienScore(row));
    m.active = false;
    Aliens.updateBounds();

    if (Aliens.shipnum <= 0) {
      Game.state = GAME_NEXTLEVEL;
      Game.nextLevelCounter = 0;
    }
  },

  playerMissileVsBunker() {
    const m = Player.missile;
    if (!m.active) return;
    if (Bunkers.hit(m.x, m.y)) {
      m.active = false;
    }
  },

  playerMissileVsUfo() {
    const m = Player.missile;
    if (!m.active || !Ufo.active) return;
    if (m.y === UFO_POSY && m.x >= Ufo.posX && m.x < Ufo.posX + UFO_WIDTH) {
      m.active = false;
      Ufo.active = false;
      Player.addScore(SCORE_UFO);
    }
  },

  alienMissilesVsPlayer() {
    if (Player.exploding) return;
    for (let i = Aliens.missiles.length - 1; i >= 0; i--) {
      const am = Aliens.missiles[i];
      if (am.y === PLAYER_POSY && am.x >= Player.posX && am.x < Player.posX + PLAYER_WIDTH) {
        Aliens.missiles.splice(i, 1);
        Player.startExplosion();
        return;
      }
    }
  },

  alienMissilesVsBunker() {
    for (let i = Aliens.missiles.length - 1; i >= 0; i--) {
      const am = Aliens.missiles[i];
      if (Bunkers.hit(am.x, am.y)) {
        Aliens.missiles.splice(i, 1);
      }
    }
  }
};

// ===========================================================================
// INPUT
// ===========================================================================
const Input = {
  pressed: new Set(),
  justPressed: new Set(),
  _nameInputActive: false,

  init() {
    document.addEventListener("keydown", (e) => {
      if (this._nameInputActive) return;
      const key = e.key;
      if (key === "ArrowLeft" || key === "ArrowRight" || key === " " ||
          key === "ArrowUp" || key === "ArrowDown") {
        e.preventDefault();
      }
      if (!this.pressed.has(key)) {
        this.justPressed.add(key);
      }
      this.pressed.add(key);
    });
    document.addEventListener("keyup", (e) => {
      if (this._nameInputActive) return;
      this.pressed.delete(e.key);
    });
  },

  isPressed(key) {
    return this.pressed.has(key);
  },

  wasJustPressed(key) {
    return this.justPressed.has(key);
  },

  clearJustPressed() {
    this.justPressed.clear();
  }
};

// ===========================================================================
// STATUS BAR
// ===========================================================================
function drawStatusBar() {
  let livesStr = "";
  let displayLives = Math.min(Player.lives - 1, 5);
  if (displayLives < 0) displayLives = 0;
  for (let i = 0; i < displayLives; i++) {
    if (i > 0) livesStr += " ";
    livesStr += "/-\\";
  }

  const text = "Level: " + padLeft(Game.level, 2) + "  Score: " + padLeft(Player.score, 7) + "  Lives: " + livesStr;
  let col = Math.floor((SCREEN_WIDTH - text.length) / 2);
  if (col < 0) col = 0;
  Renderer.drawString(col, 23, text, RED);
}

// ===========================================================================
// TITLE SCREEN
// ===========================================================================
const TitleScreen = {
  counter: 0,
  frameAccum: 0,

  reset() {
    this.counter = 0;
    this.frameAccum = 0;
  },

  update() {
    this.frameAccum++;
    if (this.frameAccum > 6) {
      this.frameAccum = 0;
      this.counter = (this.counter + 1) % 180;
    }
  },

  draw() {
    for (let i = 0; i < TITLE_BANNER.length; i++) {
      Renderer.drawString(0, 1 + i, TITLE_BANNER[i], YELLOW);
    }

    const phase = Math.floor(this.counter / 30);
    if (phase % 2 === 0) {
      const skinSet = Math.floor(phase / 2);
      this.drawAlienInfo(skinSet);
    } else {
      this.drawHighScores();
    }

    const msg = "Press SPACE to start";
    const col = Math.floor((SCREEN_WIDTH - msg.length) / 2);
    Renderer.drawString(col, 22, msg, RED);
  },

  drawAlienInfo(skinSet) {
    const startRow = 7;
    for (let t = 0; t < 3; t++) {
      const sprite0 = ALIEN_SPRITES[skinSet][t][0];
      const sprite1 = ALIEN_SPRITES[skinSet][t][1];
      let points;
      if (t === 0) points = SCORE_TYPE1;
      else if (t === 1) points = SCORE_TYPE2;
      else points = SCORE_TYPE3;

      const color = ALIEN_COLORS[skinSet * 3 + t];
      const row = startRow + t * 3;
      const col = 20;
      Renderer.drawString(col, row, sprite0, color);
      Renderer.drawString(col + 4, row, sprite1, color);
      Renderer.drawString(col + 8, row, "= " + points, WHITE);
    }

    const ufoRow = startRow + 10;
    Renderer.drawString(20, ufoRow, UFO_FRAMES[0], MAGENTA);
    Renderer.drawString(26, ufoRow, "= " + SCORE_UFO, WHITE);
  },

  drawHighScores() {
    const headerRow = 7;
    const header = "*** HIGH SCORES ***";
    const hcol = Math.floor((SCREEN_WIDTH - header.length) / 2);
    Renderer.drawString(hcol, headerRow, header, YELLOW);

    for (let i = 0; i < HighScores.entries.length; i++) {
      const entry = HighScores.entries[i];
      const rank = padLeft(i + 1, 2) + ". " + entry.name + "  " + padLeft(entry.score, 7);
      const col = Math.floor((SCREEN_WIDTH - rank.length) / 2);
      Renderer.drawString(col, headerRow + 2 + i, rank, GREEN);
    }
  }
};

// ===========================================================================
// GAME OVER SCREEN
// ===========================================================================
function drawGameOver() {
  const startRow = 4;
  const topWidth = GAMEOVER_TOP[0].length;
  const botWidth = GAMEOVER_BOTTOM[0].length;
  const topCol = Math.floor((SCREEN_WIDTH - topWidth) / 2);
  const botCol = Math.floor((SCREEN_WIDTH - botWidth) / 2);

  for (let i = 0; i < GAMEOVER_TOP.length; i++) {
    Renderer.drawString(topCol, startRow + i, GAMEOVER_TOP[i], WHITE);
  }
  for (let j = 0; j < GAMEOVER_BOTTOM.length; j++) {
    Renderer.drawString(botCol, startRow + GAMEOVER_TOP.length + 1 + j, GAMEOVER_BOTTOM[j], WHITE);
  }

  const scoreMsg = "Final Score: " + Player.score;
  const scol = Math.floor((SCREEN_WIDTH - scoreMsg.length) / 2);
  Renderer.drawString(scol, startRow + 12, scoreMsg, YELLOW);

  const rating = getRating(Player.score, Player.lives);
  const ratingMsg = "Rating: " + rating;
  const rcol = Math.floor((SCREEN_WIDTH - ratingMsg.length) / 2);
  Renderer.drawString(rcol, startRow + 14, ratingMsg, GREEN);
}

// ===========================================================================
// NAME INPUT
// ===========================================================================
const NameInput = {
  overlay: null,
  inputField: null,
  active: false,

  init() {
    this.overlay = document.getElementById("name-input-overlay");
    this.inputField = document.getElementById("name-input-field");
  },

  show() {
    if (!this.overlay) return;
    this.active = true;
    Input._nameInputActive = true;
    this.overlay.classList.remove("hidden");
    if (this.inputField) {
      this.inputField.value = "";
      this.inputField.focus();
    }
  },

  hide() {
    if (!this.overlay) return;
    this.active = false;
    Input._nameInputActive = false;
    this.overlay.classList.add("hidden");
  },

  getName() {
    if (!this.inputField) return "PLAYER";
    let v = this.inputField.value.trim().toUpperCase();
    if (v.length === 0) v = "PLAYER";
    return v.substring(0, 8);
  }
};

// ===========================================================================
// GAME CONTROLLER
// ===========================================================================
const Game = {
  state: GAME_HIGHSCORE,
  level: 0,
  overCounter: 0,
  intervalId: null,
  nextLevelCounter: 0,

  init() {
    Renderer.init();
    HighScores.init();
    Input.init();
    NameInput.init();
    TitleScreen.reset();

    // Setup name input handler
    const submitBtn = document.getElementById("name-input-submit");
    if (submitBtn) {
      submitBtn.addEventListener("click", () => {
        this.submitHighScore();
      });
    }
    if (NameInput.inputField) {
      NameInput.inputField.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          this.submitHighScore();
        }
        e.stopPropagation();
      });
      NameInput.inputField.addEventListener("keyup", (e) => {
        e.stopPropagation();
      });
    }

    NameInput.hide();
    this.start();
  },

  start() {
    this.intervalId = setInterval(() => {
      this.tick();
    }, 20);
  },

  tick() {
    if (NameInput.active) {
      Renderer.clear();
      drawGameOver();
      Input.clearJustPressed();
      return;
    }

    switch (this.state) {
      case GAME_HIGHSCORE:
        this.tickHighScore();
        break;
      case GAME_LOOP:
        this.tickGame();
        break;
      case GAME_NEXTLEVEL:
        this.tickNextLevel();
        break;
      case GAME_PAUSED:
        this.tickPaused();
        break;
      case GAME_OVER:
        this.tickGameOver();
        break;
      case GAME_EXIT:
        break;
    }

    Input.clearJustPressed();
  },

  // --- Title / High Score ---
  tickHighScore() {
    if (Input.wasJustPressed(" ")) {
      this.startNewGame();
      return;
    }

    TitleScreen.update();
    Renderer.clear();
    TitleScreen.draw();
  },

  startNewGame() {
    this.level = 0;
    Player.init();
    this.state = GAME_NEXTLEVEL;
    this.nextLevelCounter = 0;
  },

  // --- Next Level ---
  tickNextLevel() {
    this.nextLevelCounter++;
    if (this.nextLevelCounter > 25) {
      this.level++;
      Aliens.init();
      Player.resetForLevel();
      Ufo.init();
      Bunkers.init();
      this.state = GAME_LOOP;
    }

    Renderer.clear();
    const msg = "Level " + (this.level + 1);
    const col = Math.floor((SCREEN_WIDTH - msg.length) / 2);
    Renderer.drawString(col, 12, msg, GREEN);
  },

  // --- Main Game ---
  tickGame() {
    this.processInput();

    if (!Player.exploding) {
      Player.updateMissile();
    }
    Aliens.update();
    Aliens.updateMissiles();
    Ufo.trySpawn();
    Ufo.update();

    if (!Player.exploding) {
      Collisions.check();
    } else {
      Collisions.alienMissilesVsBunker();
    }

    // Render
    Renderer.clear();
    Bunkers.draw();
    Player.draw();
    Player.drawMissile();
    Aliens.draw();
    Aliens.drawMissiles();
    Ufo.draw();
    drawStatusBar();
  },

  processInput() {
    if (Input.wasJustPressed("p") || Input.wasJustPressed("P")) {
      this.state = GAME_PAUSED;
      return;
    }
    if (Input.wasJustPressed("q") || Input.wasJustPressed("Q")) {
      this.state = GAME_HIGHSCORE;
      TitleScreen.reset();
      console.log("Rating: " + getRating(Player.score, Player.lives));
      return;
    }

    // Cheats
    if (Input.wasJustPressed("W")) {
      this.state = GAME_NEXTLEVEL;
      this.nextLevelCounter = 0;
      return;
    }
    if (Input.wasJustPressed("L")) {
      Player.lives++;
    }

    if (Player.exploding) return;

    // Movement
    let moved = false;
    if (Input.isPressed("ArrowLeft") || Input.isPressed("h") || Input.isPressed("H")) {
      Player.moveLeft();
      moved = true;
    }
    if (Input.isPressed("ArrowRight") || Input.isPressed("l")) {
      Player.moveRight();
      moved = true;
    }
    if (!moved) {
      Player.lastDir = 0;
    }

    // Fire
    if (Input.isPressed(" ") || Input.isPressed("k") || Input.isPressed("K")) {
      Player.fire();
    }
  },

  // --- Paused ---
  tickPaused() {
    if (Input.wasJustPressed("p") || Input.wasJustPressed("P")) {
      this.state = GAME_LOOP;
      return;
    }

    Renderer.clear();
    Bunkers.draw();
    Player.draw();
    Player.drawMissile();
    Aliens.draw();
    Aliens.drawMissiles();
    Ufo.draw();
    drawStatusBar();

    const msg = "*** PAUSED ***";
    const col = Math.floor((SCREEN_WIDTH - msg.length) / 2);
    Renderer.drawString(col, 10, msg, YELLOW);
  },

  // --- Game Over ---
  tickGameOver() {
    this.overCounter++;
    Renderer.clear();
    drawGameOver();

    if (this.overCounter >= 100) {
      if (HighScores.qualifies(Player.score)) {
        NameInput.show();
      } else {
        this.state = GAME_HIGHSCORE;
        TitleScreen.reset();
      }
    }
  },

  submitHighScore() {
    const name = NameInput.getName();
    HighScores.insert(name, Player.score);
    NameInput.hide();
    this.state = GAME_HIGHSCORE;
    TitleScreen.reset();
  }
};

// ===========================================================================
// BOOTSTRAP
// ===========================================================================
Game.init();
