import { useCallback, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ASSET_PATHS } from '../assets';

const MOVE_SPEED = 4.5;
const CAMERA_DISTANCE = 5.5;
const CAMERA_BASE_HEIGHT = 1.6;
const MOUSE_SENSITIVITY = 0.0025;
const PITCH_MIN = 0.15;
const PITCH_MAX = 1.2;

const ATTACK_COOLDOWN_MS = 500;
const ATTACK_RANGE = 2.6;
const ATTACK_ANGLE_DOT = 0.35; // 정면 기준 약 70도 이내
const ATTACK_ANIM_MS = 320;

interface PlayerProps {
  onAttack: (position: [number, number, number], rotationY: number) => void;
  monsterPosition: [number, number, number] | null;
  onHitMonster: () => void;
}

interface Bones {
  lThigh?: THREE.Object3D;
  rThigh?: THREE.Object3D;
  lCalf?: THREE.Object3D;
  rCalf?: THREE.Object3D;
  lUpperarm?: THREE.Object3D;
  rUpperarm?: THREE.Object3D;
  lForearm?: THREE.Object3D;
  rForearm?: THREE.Object3D;
  spine02?: THREE.Object3D;
}

const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

export function Player({ onAttack, monsterPosition, onHitMonster }: PlayerProps) {
  const group = useRef<THREE.Group>(null);
  const { scene, nodes } = useGLTF(ASSET_PATHS.knight) as unknown as {
    scene: THREE.Group;
    nodes: Record<string, THREE.Object3D>;
  };
  const { camera, gl } = useThree();

  const keys = useRef({ forward: false, backward: false, left: false, right: false });
  const look = useRef({ yaw: 0, pitch: 0.45 });
  const lastAttackAt = useRef(0);
  const attackStart = useRef<number | null>(null);
  const position = useRef(new THREE.Vector3(0, 0, 0));

  // 모델마다 스케일/정면 방향이 다를 수 있어 필요하면 이 값을 조정하세요.
  const MODEL_SCALE = 1;
  const MODEL_Y_OFFSET = 0;

  // --- 애니메이션용 본(bone) 참조 ---
  // 이 모델(.glb)에는 애니메이션 클립이 들어있지 않아서(스켈레톤만 있음),
  // 본 회전을 직접 코드로 매 프레임 조작하는 "절차적 애니메이션" 방식으로
  // 걷기 / 공격 동작을 만듭니다.
  const bones = useRef<Bones>({});
  const baseRotations = useRef(new Map<THREE.Object3D, THREE.Euler>());
  const walkPhase = useRef(0);
  const moveBlend = useRef(0); // 0: 정지, 1: 이동 중 (부드럽게 보간됨)

  useEffect(() => {
    const b = bones.current;
    b.lThigh = nodes.L_Thigh;
    b.rThigh = nodes.R_Thigh;
    b.lCalf = nodes.L_Calf;
    b.rCalf = nodes.R_Calf;
    b.lUpperarm = nodes.L_Upperarm;
    b.rUpperarm = nodes.R_Upperarm;
    b.lForearm = nodes.L_Forearm;
    b.rForearm = nodes.R_Forearm;
    b.spine02 = nodes.Spine02;

    baseRotations.current.clear();
    Object.values(b).forEach((bone) => {
      if (bone) baseRotations.current.set(bone, bone.rotation.clone());
    });
  }, [nodes]);

  const setBoneRotation = (
    bone: THREE.Object3D | undefined,
    delta: [number, number, number]
  ) => {
    if (!bone) return;
    const base = baseRotations.current.get(bone);
    if (!base) return;
    bone.rotation.set(base.x + delta[0], base.y + delta[1], base.z + delta[2]);
  };

  // --- 키보드 (WASD 이동) ---
  useEffect(() => {
    const setKey = (code: string, value: boolean) => {
      switch (code) {
        case 'KeyW':
          keys.current.forward = value;
          break;
        case 'KeyS':
          keys.current.backward = value;
          break;
        case 'KeyA':
          keys.current.left = value;
          break;
        case 'KeyD':
          keys.current.right = value;
          break;
      }
    };
    const onDown = (e: KeyboardEvent) => setKey(e.code, true);
    const onUp = (e: KeyboardEvent) => setKey(e.code, false);

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  // --- 공격 처리 ---
  const attack = useCallback(() => {
    const now = performance.now();
    if (now - lastAttackAt.current < ATTACK_COOLDOWN_MS) return;
    lastAttackAt.current = now;
    attackStart.current = now;

    const yaw = look.current.yaw;
    const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));

    const spawnPos = position.current
      .clone()
      .add(forward.clone().multiplyScalar(1.1));
    spawnPos.y += 1.1;
    onAttack([spawnPos.x, spawnPos.y, spawnPos.z], yaw);

    if (monsterPosition) {
      const toMonster = new THREE.Vector3(
        monsterPosition[0] - position.current.x,
        0,
        monsterPosition[2] - position.current.z
      );
      const dist = toMonster.length();
      if (dist <= ATTACK_RANGE && dist > 0.0001) {
        toMonster.normalize();
        if (forward.dot(toMonster) >= ATTACK_ANGLE_DOT) {
          onHitMonster();
        }
      }
    }
  }, [monsterPosition, onAttack, onHitMonster]);

  // --- 마우스: 클릭으로 포인터 잠금 / 잠긴 상태에서 클릭은 공격 ---
  useEffect(() => {
    const canvas = gl.domElement;

    const onMouseDown = (e: MouseEvent) => {
      if (document.pointerLockElement === canvas) {
        if (e.button === 0) attack();
      } else {
        canvas.requestPointerLock();
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;
      look.current.yaw -= e.movementX * MOUSE_SENSITIVITY;
      look.current.pitch = Math.min(
        PITCH_MAX,
        Math.max(PITCH_MIN, look.current.pitch - e.movementY * MOUSE_SENSITIVITY)
      );
    };

    canvas.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, [attack, gl]);

  // --- 매 프레임: 이동, 캐릭터 회전, 카메라 추적, 본 애니메이션 ---
  useFrame((_, delta) => {
    const { forward, backward, left, right } = keys.current;
    const yaw = look.current.yaw;

    const forwardVec = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const rightVec = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

    const move = new THREE.Vector3();
    if (forward) move.add(forwardVec);
    if (backward) move.sub(forwardVec);
    if (right) move.add(rightVec);
    if (left) move.sub(rightVec);

    const isMoving = move.lengthSq() > 0;
    if (isMoving) {
      move.normalize().multiplyScalar(MOVE_SPEED * delta);
      position.current.add(move);
    }

    if (group.current) {
      group.current.position.set(
        position.current.x,
        position.current.y,
        position.current.z
      );
      group.current.rotation.y = yaw;
    }

    const pitch = look.current.pitch;
    const camX =
      position.current.x - Math.sin(yaw) * CAMERA_DISTANCE * Math.cos(pitch);
    const camZ =
      position.current.z - Math.cos(yaw) * CAMERA_DISTANCE * Math.cos(pitch);
    const camY = Math.sin(pitch) * CAMERA_DISTANCE + CAMERA_BASE_HEIGHT;

    camera.position.set(camX, camY, camZ);
    camera.lookAt(position.current.x, position.current.y + 1.1, position.current.z);

    // --- 절차적 본 애니메이션 ---
    moveBlend.current = THREE.MathUtils.damp(
      moveBlend.current,
      isMoving ? 1 : 0,
      6,
      delta
    );
    walkPhase.current += delta * (4 + moveBlend.current * 4);

    const swing = Math.sin(walkPhase.current) * moveBlend.current;
    const swingOpp = -swing;

    // 다리: 허벅지가 앞뒤로 흔들리고, 종아리는 뒤로 갈 때 살짝 접힘
    setBoneRotation(bones.current.lThigh, [swing * 0.55, 0, 0]);
    setBoneRotation(bones.current.rThigh, [swingOpp * 0.55, 0, 0]);
    setBoneRotation(bones.current.lCalf, [Math.max(0, -swing) * 0.7, 0, 0]);
    setBoneRotation(bones.current.rCalf, [Math.max(0, -swingOpp) * 0.7, 0, 0]);

    // 정지 시 숨쉬기 같은 미세한 상체 움직임
    const breathe =
      Math.sin(performance.now() * 0.0018) * 0.025 * (1 - moveBlend.current);
    setBoneRotation(bones.current.spine02, [breathe, 0, 0]);

    // 왼팔: 반대쪽 다리와 같이 자연스럽게 스윙
    setBoneRotation(bones.current.lUpperarm, [swingOpp * 0.35, 0, 0]);

    // 오른팔: 공격 중이 아니면 걷기 스윙, 공격 중이면 슬래시 스윙으로 대체
    if (attackStart.current !== null) {
      const t = (performance.now() - attackStart.current) / ATTACK_ANIM_MS;
      if (t >= 1) {
        attackStart.current = null;
        setBoneRotation(bones.current.rUpperarm, [swing * 0.35, 0, 0]);
        setBoneRotation(bones.current.rForearm, [0, 0, 0]);
      } else {
        const eased = easeOutCubic(Math.min(1, t));
        const angle = THREE.MathUtils.lerp(-1.0, 1.6, eased);
        setBoneRotation(bones.current.rUpperarm, [angle, 0, 0.3]);
        setBoneRotation(bones.current.rForearm, [0.4, 0, 0]);
      }
    } else {
      setBoneRotation(bones.current.rUpperarm, [swing * 0.35, 0, 0]);
      setBoneRotation(bones.current.rForearm, [0, 0, 0]);
    }
  });

  return (
    <group ref={group}>
      <primitive
        object={scene}
        scale={MODEL_SCALE}
        position={[0, MODEL_Y_OFFSET, 0]}
      />
    </group>
  );
}

useGLTF.preload(ASSET_PATHS.knight);
