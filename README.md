# 👾 jsInvaders

**A browser-based Space Invaders clone that looks like it's running in a terminal — because it is (sort of).**

jsInvaders is a faithful recreation of [nInvaders](https://github.com/sf-refugees/ninvaders) (the ncurses terminal Space Invaders game), built with vanilla JavaScript and HTML5 Canvas. It renders on an 80×24 character grid to replicate the retro terminal aesthetic — complete with a CRT scanline overlay.

Zero dependencies. Zero build steps. Just open and play.

![jsInvaders gameplay showing rows of aliens, destructible bunkers, and the player ship on a terminal-style grid](https://github.com/user-attachments/assets/566b815e-5f8a-495e-b246-697dc81e2be4)

---

## 🚀 Quick Start

```
git clone <repo-url>
cd jsInvaders
```

Then do **one** of:

- **Double-click** `index.html` in your file browser
- **Or** serve it:
  ```
  python -m http.server
  ```
  Then open [http://localhost:8000](http://localhost:8000)

That's it. No `npm install`, no bundler, no build step.

---

## 🎮 Controls

| Action       | Keys                              |
|:-------------|:----------------------------------|
| Move left    | `←` or `H`                        |
| Move right   | `→` or `L`                        |
| Fire         | `Space` or `K`                    |
| Pause        | `P`                               |
| Quit to title| `Q`                               |

> **Turbo mode:** Holding a direction accelerates your ship to double speed.

---

## ✨ Features

- **Pure vanilla JS** — zero dependencies, single static page
- **Terminal-faithful rendering** — 80×24 character grid on a 720×480 canvas (`9×20` px cells)
- **9 alien sprite pairs** — 3 alien types × 3 skin sets, each with 2-frame animation
- **UFO mystery ship** — 4-frame animated bonus target worth 500 points
- **4 destructible bunkers** — damaged by fire from both sides (player and alien missiles)
- **Turbo movement** — sustained directional input doubles ship speed
- **7 collision types** — player/alien missiles vs aliens, bunkers, UFO, player, and alien descent
- **Scoring with extra lives** — bonus life every 6,000 points
- **Level progression** — difficulty scales with a speed formula based on remaining aliens and level
- **Persistent high scores** — top 10 stored in `localStorage`
- **Title screen** — ASCII art banner with cycling alien sprite showcase and high score table
- **Game Over screen** — block-letter banner with final score and performance rating
- **CRT scanline overlay** — CSS-driven retro monitor effect
- **Responsive layout** — scales down on smaller viewports

---

## 👽 Scoring

| Alien Type         | Points |
|:-------------------|-------:|
| Type 1 (top row)   |    200 |
| Type 2 (rows 2–3)  |    150 |
| Type 3 (rows 4–5)  |    100 |
| UFO mystery ship   |    500 |

Skin sets rotate every level, cycling through 3 visual themes with distinct color schemes.

---

## 🏆 Ratings

Your performance is judged when the game ends:

| Score         | Rating              |
|:--------------|:--------------------|
| < 5,000       | Alien Fodder        |
| < 7,500       | Easy Target         |
| < 10,000      | Barely Mediocre     |
| < 12,500      | Shows Promise       |
| < 15,000      | Alien Blaster       |
| < 20,000      | Earth Defender      |
| ≥ 20,000      | Supreme Protector   |

Quit early? You get **"Quitter"**.

---

## 🗂️ Project Structure

```
jsInvaders/
├── index.html   — HTML5 page with 720×480 canvas and high score name input overlay
├── style.css    — CRT scanline effect, retro terminal styling, responsive layout
└── game.js      — Complete game engine (renderer, entities, collisions, screens, input)
```

---

## 🏗️ Architecture

The game is organized as a set of singleton modules wired together by a central game loop:

| Module        | Responsibility                                          |
|:--------------|:--------------------------------------------------------|
| `Renderer`    | Canvas 2D character-grid drawing (`drawChar`, `drawString`) |
| `Player`      | Ship movement, missile, explosion animation, scoring    |
| `Aliens`      | 5×10 grid management, movement, missile firing          |
| `Ufo`         | Mystery ship spawning, movement, 4-frame animation      |
| `Bunkers`     | 80×4 destructible grid with pattern-based initialization|
| `Collisions`  | All 7 collision detection routines                      |
| `Input`       | Keyboard state tracking (`pressed` + `justPressed` sets)|
| `HighScores`  | Top-10 leaderboard persisted to `localStorage`          |
| `TitleScreen` | Animated title with alien showcase / high score cycling  |
| `NameInput`   | DOM overlay for high score name entry                   |
| `Game`        | State machine driving all game phases                   |

The game loop runs at **50 Hz** (`setInterval` at 20 ms) and manages six states: title screen, gameplay, next-level transition, paused, game over, and exit.

---

## 🙏 Credits

Inspired by **nInvaders** by [sf-refugees](https://github.com/sf-refugees/ninvaders) — the original ncurses Space Invaders for the terminal.

---

## 📄 License

[MIT](LICENSE)
