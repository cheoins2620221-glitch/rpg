# 3D RPG 프로젝트 (2단계: 조작 + 공격 + 몬스터)

## 지금 되는 것
- 초록색 초원 바닥
- 캐릭터: assets/characters의 치비 기사 .glb 모델 (public/assets/characters/knight.glb)
- **WASD 이동**: 카메라가 바라보는 방향 기준으로 앞/뒤/좌우 이동
- **마우스로 시점(방향) 회전**: 화면 클릭 시 마우스 포인터가 잠기고(Pointer Lock), 마우스를 움직이면 카메라가 캐릭터 주위를 회전. 캐릭터는 항상 카메라가 바라보는 방향을 향함
- **클릭으로 공격**: 포인터가 잠긴 상태에서 클릭하면 슬래시 이펙트가 나가고, 앞쪽 2.6 유닛 이내·정면 범위 안에 몬스터가 있으면 데미지(1)를 줌. 공격 쿨다운 0.5초
- **간단한 몬스터 1마리**: 캐릭터 앞쪽에 고정 배치, 체력 3, 맞을 때마다 체력바가 줄어들고 0이 되면 사라짐
- ESC 키로 마우스 잠금 해제 가능 (브라우저 기본 동작)

## 조작
| 입력 | 동작 |
|---|---|
| W / A / S / D | 이동 |
| 마우스 이동 (클릭 후 잠금 상태) | 시점 및 캐릭터 방향 회전 |
| 좌클릭 (잠금 상태) | 공격 |
| ESC | 마우스 잠금 해제 |

## 애니메이션 (걷기 / 공격)
업로드해주신 `chibi_knight_3d_model_Clone1.glb`에는 **애니메이션 클립이 없고 스켈레톤(뼈대)만 들어있어요.** 그래서 `Player.tsx` 안에서 다리(Thigh/Calf), 팔(Upperarm/Forearm), 척추(Spine02) 본을 매 프레임 직접 회전시키는 **절차적 애니메이션** 방식으로 구현했어요.
- 정지: 척추가 아주 살짝 흔들리는 숨쉬기 모션
- 이동: 다리가 서로 반대 방향으로 흔들리고, 뒤로 가는 다리는 무릎이 살짝 접힘. 팔도 반대쪽 다리에 맞춰 자연스럽게 스윙
- 공격: 오른팔이 짧게(0.32초) 크게 휘둘러지는 슬래시 모션, 걷기 스윙 위에 덮어씌워짐

나중에 애니메이션 클립이 포함된 모델(idle/walk/attack 등)을 구하시면, `useGLTF`가 반환하는 `animations`와 drei의 `useAnimations`로 훨씬 자연스러운 애니메이션으로 바꿀 수 있어요. 그 경우 지금의 본 직접 조작 코드는 제거하면 됩니다.

## 슬래시 이펙트
참고로 주신 파란 네온 궤적 이미지 느낌으로, 캔버스에 **바깥쪽 넓은 파란 글로우 + 중간 밝은 파란 선 + 안쪽 흰색 코어**를 겹쳐 그린 텍스처를 만들어 사용하고 있어요 (`src/game/combat/SlashEffect.tsx`). Additive Blending을 사용해서 네온처럼 빛나 보이게 했어요.

실제 effects 폴더의 스프라이트 파일로 바꾸려면:
1. `public/assets/effects/` 폴더에 스프라이트 파일을 넣고
2. `SlashEffect.tsx`의 `getSlashTexture()` 부분을 `useTexture(ASSET_PATHS.slashSprite)`로 교체
3. 여러 프레임이 이어진 스프라이트 시트라면, 프레임마다 `texture.offset` / `texture.repeat`을 갱신하는 로직 추가

## 알아둘 점 / 한계
- 몬스터는 이동/AI 없이 고정된 위치에 있는 가장 단순한 버전이에요. 다음 단계로 순찰(patrol), 플레이어 추적, 여러 마리 스폰 등을 추가할 수 있어요.
- 절차적 애니메이션은 본 이름(L_Thigh, R_Upperarm 등)에 의존하므로, 나중에 다른 캐릭터 모델로 교체하면 본 이름에 맞게 `Player.tsx`의 `bones.current.xxx = nodes.본이름` 부분을 수정해야 해요.

## 실행 방법
```
npm install
npm run dev
```
브라우저에서 열리면 화면을 한 번 클릭해 마우스를 잠근 뒤 WASD로 움직여보세요.

## 파일 구조
- `src/game/world` : 맵/바닥
- `src/game/player` : 캐릭터 이동, 카메라, 마우스/키보드 입력, 공격 판정
- `src/game/enemies` : 몬스터
- `src/game/combat` : 슬래시 이펙트
- `src/game/scene` : 전체 씬 조립 (GameScene)
- `src/game/assets.ts` : 에셋 경로 상수
- `public/assets/characters/knight.glb` : 캐릭터 3D 모델
