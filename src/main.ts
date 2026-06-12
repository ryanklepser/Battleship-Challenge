import './style.css';
import { renderDifficultySelector } from './ui/renderer';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <header class="header">
    <h1>⚓ Battlefield Challenge</h1>
    <p>Sink the enemy fleet before they sink yours!</p>
  </header>
  <main id="game-root"></main>
`;

const gameRoot = document.querySelector<HTMLDivElement>('#game-root')!;

renderDifficultySelector(gameRoot, (difficulty) => {
  // TODO: initialize GameState and start the game loop
  console.log(`Starting game on ${difficulty} difficulty`);
  gameRoot.innerHTML = `<p>Game starting on <strong>${difficulty}</strong> mode… (gameplay coming soon)</p>`;
});
