import { Billboard } from '@react-three/drei';

interface MonsterProps {
  position: [number, number, number];
  hp: number;
  maxHp: number;
}

const BAR_WIDTH = 1.2;

export function Monster({ position, hp, maxHp }: MonsterProps) {
  const ratio = Math.max(0, Math.min(1, hp / maxHp));

  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.9, 0]}>
        <capsuleGeometry args={[0.5, 1.0, 4, 8]} />
        <meshStandardMaterial color="#b5432c" />
      </mesh>

      <Billboard position={[0, 2.1, 0]}>
        <mesh>
          <planeGeometry args={[BAR_WIDTH, 0.14]} />
          <meshBasicMaterial color="#222222" />
        </mesh>
        <mesh position={[-(BAR_WIDTH * (1 - ratio)) / 2, 0, 0.001]}>
          <planeGeometry args={[BAR_WIDTH * ratio, 0.1]} />
          <meshBasicMaterial color="#e53935" />
        </mesh>
      </Billboard>
    </group>
  );
}
