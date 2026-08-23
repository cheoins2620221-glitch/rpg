// 3D 모델/이펙트 에셋 경로를 한곳에서 관리합니다.
// 파일들은 public/assets/... 아래에 위치해야 "/assets/..." 경로로 바로 로드됩니다.
export const ASSET_PATHS = {
  knight: '/assets/characters/knight.glb',
  // 실제 슬래시 스프라이트를 쓰려면 public/assets/effects/slash.png 에 파일을 넣고
  // src/game/combat/SlashEffect.tsx 에서 이 경로를 사용하도록 교체하세요.
  slashSprite: '/assets/effects/slash.png',
} as const;
