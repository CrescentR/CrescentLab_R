"use client";

import { Canvas, type ThreeEvent, useFrame } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PointsMaterial,
  Shape,
} from "three";

type PointerCaptureTarget = {
  releasePointerCapture: (pointerId: number) => void;
  setPointerCapture: (pointerId: number) => void;
};

export function CrescentScene({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  return (
    <Canvas
      camera={{ fov: 38, position: [0, 0, 5.8] }}
      dpr={[1, 1.8]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
    >
      <ambientLight intensity={0.46} />
      <directionalLight color="#dff8ff" intensity={2.8} position={[-3.2, 3.4, 4.8]} />
      <pointLight color="#63d8ff" intensity={9} position={[-2.4, 1.2, 2.8]} />
      <pointLight color="#8b7cff" intensity={7} position={[2.6, -1.5, 2.2]} />
      <pointLight color="#ffb86b" intensity={2.4} position={[0.8, 2.4, -1.6]} />
      <CrescentAssembly scrollProgress={scrollProgress} />
    </Canvas>
  );
}

function CrescentAssembly({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const followGroup = useRef<Group>(null);
  const coreGroup = useRef<Group>(null);
  const orbitOne = useRef<Group>(null);
  const orbitTwo = useRef<Group>(null);
  const particleGroup = useRef<Group>(null);
  const frontMaterial = useRef<MeshPhysicalMaterial>(null);
  const sideMaterial = useRef<MeshPhysicalMaterial>(null);
  const particleMaterial = useRef<PointsMaterial>(null);
  const pulseMesh = useRef<Mesh>(null);
  const pulseMaterial = useRef<MeshBasicMaterial>(null);
  const interaction = useRef({
    currentX: 0,
    currentY: 0,
    dragging: false,
    hovered: false,
    pulse: 0,
    startPointerX: 0,
    startPointerY: 0,
    startRotationX: 0,
    startRotationY: 0,
    targetX: 0,
    targetY: 0,
    velocityX: 0,
    velocityY: 0,
  });
  const crescentShape = useMemo(() => createCrescentShape(), []);
  const extrudeSettings = useMemo(
    () => ({ bevelEnabled: true, bevelSegments: 5, bevelSize: 0.045, bevelThickness: 0.055, curveSegments: 96, depth: 0.18, steps: 1 }),
    [],
  );
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(66 * 3);
    for (let index = 0; index < 66; index += 1) {
      const angle = index * 2.399963;
      const radius = 1.28 + ((index * 17) % 23) * 0.052;
      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = Math.sin(angle) * radius * 0.72;
      positions[index * 3 + 2] = ((index * 13) % 19) * 0.038 - 0.34;
    }
    return positions;
  }, []);

  useFrame((state, delta) => {
    if (!followGroup.current || !coreGroup.current || !orbitOne.current || !orbitTwo.current || !particleGroup.current) return;

    const controls = interaction.current;
    const activity = controls.hovered || controls.dragging ? 1.85 : 1;
    followGroup.current.rotation.x = MathUtils.damp(
      followGroup.current.rotation.x,
      -0.08 + state.pointer.y * 0.065,
      4,
      delta,
    );
    followGroup.current.rotation.y = MathUtils.damp(
      followGroup.current.rotation.y,
      0.12 + state.pointer.x * 0.09 + scrollProgress.get() * 0.55,
      4,
      delta,
    );

    if (controls.dragging) {
      const previousX = controls.currentX;
      const previousY = controls.currentY;
      controls.currentX = MathUtils.damp(controls.currentX, controls.targetX, 9, delta);
      controls.currentY = MathUtils.damp(controls.currentY, controls.targetY, 9, delta);
      controls.velocityX = MathUtils.clamp((controls.currentX - previousX) / Math.max(delta, 0.001), -2.2, 2.2);
      controls.velocityY = MathUtils.clamp((controls.currentY - previousY) / Math.max(delta, 0.001), -2.2, 2.2);
    } else {
      controls.velocityX = (controls.velocityX - controls.currentX * 19 * delta) * Math.exp(-6.5 * delta);
      controls.velocityY = (controls.velocityY - controls.currentY * 19 * delta) * Math.exp(-6.5 * delta);
      controls.currentX += controls.velocityX * delta;
      controls.currentY += controls.velocityY * delta;
    }

    const elapsed = state.clock.elapsedTime;
    coreGroup.current.rotation.x = 0.13 + controls.currentX + Math.sin(elapsed * 0.48) * 0.025;
    coreGroup.current.rotation.y = -0.2 + controls.currentY + Math.cos(elapsed * 0.38) * 0.035;
    coreGroup.current.rotation.z += delta * 0.012 * activity;
    coreGroup.current.position.x = controls.currentY * 0.08;
    coreGroup.current.position.y = -controls.currentX * 0.06;
    orbitOne.current.rotation.z += delta * 0.052 * activity;
    orbitTwo.current.rotation.z -= delta * 0.034 * activity;
    particleGroup.current.rotation.z -= delta * 0.021 * activity;

    if (frontMaterial.current && sideMaterial.current && particleMaterial.current) {
      frontMaterial.current.emissiveIntensity = MathUtils.damp(
        frontMaterial.current.emissiveIntensity,
        controls.hovered ? 1.05 : 0.72,
        5,
        delta,
      );
      sideMaterial.current.emissiveIntensity = MathUtils.damp(
        sideMaterial.current.emissiveIntensity,
        controls.hovered ? 0.58 : 0.34,
        5,
        delta,
      );
      particleMaterial.current.opacity = MathUtils.damp(
        particleMaterial.current.opacity,
        controls.hovered ? 0.88 : 0.58,
        5,
        delta,
      );
      particleMaterial.current.size = MathUtils.damp(
        particleMaterial.current.size,
        controls.hovered ? 0.031 : 0.023,
        5,
        delta,
      );
    }

    if (pulseMesh.current && pulseMaterial.current) {
      if (controls.pulse > 0) {
        controls.pulse = Math.min(1, controls.pulse + delta * 0.82);
        const pulseScale = 1 + controls.pulse * 1.25;
        pulseMesh.current.visible = true;
        pulseMesh.current.scale.setScalar(pulseScale);
        pulseMaterial.current.opacity = Math.pow(1 - controls.pulse, 2) * 0.48;
        if (controls.pulse === 1) controls.pulse = 0;
      } else {
        pulseMesh.current.visible = false;
      }
    }
  });

  const releaseCore = () => {
    const controls = interaction.current;
    if (!controls.dragging) return;
    controls.dragging = false;
    controls.targetX = 0;
    controls.targetY = 0;
    controls.pulse = 0.001;
  };

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const pointerCapture = event.target as unknown as PointerCaptureTarget;
    pointerCapture.setPointerCapture(event.pointerId);
    const controls = interaction.current;
    controls.dragging = true;
    controls.startPointerX = event.pointer.x;
    controls.startPointerY = event.pointer.y;
    controls.startRotationX = controls.currentX;
    controls.startRotationY = controls.currentY;
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    const controls = interaction.current;
    if (!controls.dragging) return;
    controls.targetX = MathUtils.clamp(
      controls.startRotationX - (event.pointer.y - controls.startPointerY) * 0.72,
      -0.48,
      0.48,
    );
    controls.targetY = MathUtils.clamp(
      controls.startRotationY + (event.pointer.x - controls.startPointerX) * 0.9,
      -0.58,
      0.58,
    );
  };

  return (
    <group ref={followGroup}>
      <group
        onPointerCancel={releaseCore}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerOut={() => { interaction.current.hovered = false; }}
        onPointerOver={() => { interaction.current.hovered = true; }}
        onPointerUp={(event) => {
          const pointerCapture = event.target as unknown as PointerCaptureTarget;
          pointerCapture.releasePointerCapture(event.pointerId);
          releaseCore();
        }}
        ref={coreGroup}
      >
        <mesh>
          <extrudeGeometry args={[crescentShape, extrudeSettings]} />
          <meshPhysicalMaterial
            attach="material-0"
            clearcoat={0.72}
            clearcoatRoughness={0.24}
            color="#766cff"
            emissive="#31286f"
            emissiveIntensity={0.72}
            metalness={0.48}
            ref={frontMaterial}
            roughness={0.28}
            side={DoubleSide}
          />
          <meshPhysicalMaterial
            attach="material-1"
            clearcoat={0.35}
            color="#252361"
            emissive="#17163d"
            emissiveIntensity={0.34}
            metalness={0.56}
            ref={sideMaterial}
            roughness={0.38}
          />
        </mesh>
      </group>

      <group ref={orbitOne} rotation={[0.2, 0.1, 0.35]}>
        <mesh>
          <torusGeometry args={[1.82, 0.012, 8, 180]} />
          <meshBasicMaterial color="#63d8ff" opacity={0.44} transparent />
        </mesh>
        <mesh position={[1.82, 0, 0]}>
          <sphereGeometry args={[0.035, 16, 16]} />
          <meshBasicMaterial color="#d9f8ff" />
        </mesh>
      </group>
      <group ref={orbitTwo} rotation={[1.18, 0.12, -0.6]}>
        <mesh>
          <torusGeometry args={[1.56, 0.009, 8, 160]} />
          <meshBasicMaterial color="#8b7cff" opacity={0.34} transparent />
        </mesh>
        <mesh position={[-1.56, 0, 0]}>
          <sphereGeometry args={[0.025, 14, 14]} />
          <meshBasicMaterial color="#a99fff" />
        </mesh>
      </group>
      <group ref={particleGroup}>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            blending={AdditiveBlending}
            color="#b7efff"
            depthWrite={false}
            opacity={0.58}
            ref={particleMaterial}
            size={0.023}
            transparent
          />
        </points>
      </group>
      <mesh ref={pulseMesh} visible={false}>
        <torusGeometry args={[1.43, 0.014, 8, 180]} />
        <meshBasicMaterial
          blending={AdditiveBlending}
          color="#8ee7ff"
          depthWrite={false}
          opacity={0}
          ref={pulseMaterial}
          transparent
        />
      </mesh>
    </group>
  );
}

function createCrescentShape() {
  const outerRadius = 1.42;
  const innerRadius = 1.28;
  const innerOffset = 0.68;
  const intersectionX = (outerRadius ** 2 - innerRadius ** 2 + innerOffset ** 2) / (2 * innerOffset);
  const outerAngle = Math.acos(intersectionX / outerRadius);
  const innerAngle = Math.acos((intersectionX - innerOffset) / innerRadius);
  const shape = new Shape();

  shape.absarc(0, 0, outerRadius, outerAngle, Math.PI * 2 - outerAngle, false);
  shape.absarc(innerOffset, 0, innerRadius, -innerAngle, innerAngle, true);
  shape.closePath();
  return shape;
}
