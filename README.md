# ⚓ Battleship Challenge

A web-based Battleship game where you play against an AI opponent with three difficulty levels: **Easy**, **Medium**, and **Expert**. Built as part of the Cognition engineering challenge.

> **Play online:** _Deployment link coming soon_

## Game Rules

**Object:** Be the first to sink all 5 of your opponent's ships.

### Fleet

| Ship        | Size |
| ----------- | ---- |
| Carrier     | 5    |
| Battleship  | 4    |
| Cruiser     | 3    |
| Submarine   | 3    |
| Destroyer   | 2    |

### Ship Placement

- Place each ship in any **horizontal or vertical** position — not diagonally.
- Ships may **not overlap** each other, extend beyond the grid edges, or share cells.
- Once the game begins, ships **cannot be moved**.

### Gameplay

1. Players alternate turns, calling one shot per turn by selecting a coordinate (e.g., D-4).
2. **Hit** — If the shot lands on a cell occupied by a ship, it's a hit (red peg / 💥).
3. **Miss** — If the shot lands on an empty cell, it's a miss (white peg / •).
4. When a hit is scored, the opponent announces **which ship** was hit.
5. **Sinking** — When all cells of a ship are hit, it is sunk. The owner must announce which ship was sunk.
6. **Winning** — The first player to sink the opponent's entire fleet wins.

### AI Difficulty Levels

- 🟢 **Easy** — Purely random shots. Good for learning the game.
- 🟡 **Medium** — Random until a hit, then hunts adjacent cells. Puts up a real fight.
- 🔴 **Expert** — Hunt/target strategy with parity (checkerboard) optimization. Plays to win.

## Tech Stack

- **TypeScript** — Type-safe game logic
- **Vite** — Fast dev server & optimized production builds
- **Vitest** — Unit testing
- **ESLint** — Code quality
- **GitHub Actions** — CI pipeline (lint, typecheck, test, build)

## Setup Instructions

```bash
# Clone the repository
git clone https://github.com/ryanklepser/Battleship-Challenge.git
cd Battleship-Challenge

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Lint
npm run lint

# Type check
npm run typecheck

# Production build
npm run build
```

## Project Structure

```
Battleship-Challenge/
├── src/
│   ├── game/          # Core game logic (board, types, rules)
│   ├── ai/            # AI opponent (strategy + ship placement)
│   ├── ui/            # Board rendering and UI components
│   ├── utils/         # Shared helpers
│   ├── main.ts        # App entry point
│   └── style.css      # Game styles
├── tests/             # Unit tests
├── public/            # Static assets
├── .github/
│   ├── workflows/     # CI pipeline
│   └── ISSUE_TEMPLATE/
├── index.html         # HTML entry point
├── vitest.config.ts   # Test configuration
├── eslint.config.js   # Lint configuration
├── tsconfig.json      # TypeScript configuration
└── package.json
```

## Contributing

1. Create a feature branch from `develop`: `git checkout -b feature/your-feature develop`
2. Make your changes and add tests
3. Ensure all checks pass: `npm run lint && npm run typecheck && npm test`
4. Open a PR targeting `develop`

## Roadmap

See the [Project Board](https://github.com/ryanklepser/Battleship-Challenge/projects) for planned features and progress.

## Challenge Deliverables

- [ ] Playable online game (link above)
- [ ] Bug documentation (see `docs/bugs.md` once available)
- [ ] Public GitHub repo (you're here!)

## License

[MIT](LICENSE)
