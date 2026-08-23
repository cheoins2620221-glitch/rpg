import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';

export interface SlashInstance {
  id: number;
  position: [number, number, number];
  rotationY: number;
}

interface SlashEffectProps {
  instance: SlashInstance;
  onDone: () => void;
}

const DURATION_MS = 260;

// 실제 슬래시 스프라이트 파일이 없어도 바로 동작하도록,
// 사용자가 참고로 준 파란색 네온 궤적 이미지 스타일을 캔버스로 그려서 텍스처로 사용합니다.
// (바깥쪽 넓고 흐린 파란 글로우 + 중간 밝은 파란 선 + 안쪽 얇은 흰색 코어를 겹쳐서
//  빛나는 곡선 궤적처럼 보이게 함)
// 나중에 assets/effects 안의 실제 스프라이트로 바꾸려면:
//   1) public/assets/effects/slash.png (또는 프레임별 이미지들)을 넣고
//   2) 아래 getSlashTexture() 대신 useTexture(ASSET_PATHS.slashSprite) 사용
//   3) 스프라이트 시트라면 프레임 수에 맞춰 map.repeat / map.offset을 매 프레임 갱신
function createSlashTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, size, size);

  const drawStroke = (
    lineWidth: number,
    color: string,
    blur: number,
    alpha: number
  ) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(30, size - 30);
    ctx.quadraticCurveTo(size * 0.42, size * 0.4, size - 30, 30);
    ctx.stroke();
    ctx.restore();
  };

  // 바깥쪽 넓은 파란 글로우
  drawStroke(46, '#1e6bff', 45, 0.5);
  // 중간 밝은 파란 선
  drawStroke(22, '#4fb2ff', 26, 0.85);
  // 안쪽 얇은 흰색-하늘색 코어
  drawStroke(8, '#eaf7ff', 12, 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

let cachedTexture: THREE.CanvasTexture | null = null;
function getSlashTexture() {
  if (!cachedTexture) cachedTexture = createSlashTexture();
  return cachedTexture;
}

export function SlashEffect({ instance, onDone }: SlashEffectProps) {
  const start = useRef(performance.now());
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => getSlashTexture(), []);

  useEffect(() => {
    const timer = setTimeout(onDone, DURATION_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  useFrame(() => {
    const t = Math.min(1, (performance.now() - start.current) / DURATION_MS);
    if (!meshRef.current) return;
    const scale = 0.6 + t * 0.9;
    meshRef.current.scale.set(scale, scale, scale);
    const material = meshRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = 1 - t;
  });

  return (
    <Billboard position={instance.position}>
      <mesh ref={meshRef}>
        <planeGeometry args={[1.7, 1.7]} />
        <meshBasicMaterial
          map={texture}
          transparent
          depthWrite={false}
          color="#ffffff"
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </Billboard>
  );
}
