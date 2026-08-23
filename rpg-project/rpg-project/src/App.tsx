import { GameScene } from './game/scene/GameScene';
import './App.css';

function App() {
  return (
    <div className="app-root">
      <GameScene />
      <div className="hud-hint">
        화면을 클릭해 마우스를 잠그세요 · WASD 이동 · 마우스로 시점 회전 · 클릭으로 공격 · ESC로 잠금 해제
      </div>
    </div>
  );
}

export default App;
