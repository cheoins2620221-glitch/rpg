import { Suspense, useCallback, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Ground } from '../world/Ground';
import { Player } from '../player/Player';
import { Monster } from '../enemies/Monster';
import { SlashEffect, type SlashInstance } from '../combat/SlashEffect';

const MONSTER_POSITION: [number, number, number] = [4, 0, -3];
const MONSTER_MAX_HP = 3;

export function GameScene() {
  const [slashes, setSlashes] = useState<SlashInstance[]>([]);
  const [monsterHp, setMonsterHp] = useState(MONSTER_MAX_HP);
  const slashIdRef = useRef(0);

  const spawnSlash = useCallback(
    (position: [number, number, number], rotationY: number) => {
      const id = slashIdRef.current++;
      setSlashes((prev) => [...prev, { id, position, rotationY }]);
    },
    []
  );

  const removeSlash = useCallback((id: number) => {
    setSlashes((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const hitMonster = useCallback(() => {
    setMonsterHp((hp) => Math.max(0, hp - 1));
  }, []);

  return (
    <Canvas shadows camera={{ fov: 60, near: 0.1, far: 200 }}>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 12, 6]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <Suspense fallback={null}>
        <Ground />

        <Player
          onAttack={spawnSlash}
          monsterPosition={monsterHp > 0 ? MONSTER_POSITION : null}
          onHitMonster={hitMonster}
        />

        {monsterHp > 0 && (
          <Monster position={MONSTER_POSITION} hp={monsterHp} maxHp={MONSTER_MAX_HP} />
        )}

        {slashes.map((s) => (
          <SlashEffect key={s.id} instance={s} onDone={() => removeSlash(s.id)} />
        ))}
      </Suspense>
    </Canvas>
  );
}
