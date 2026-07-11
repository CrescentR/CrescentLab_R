"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import type { MotionValue } from "motion/react";
import { useMemo, useRef } from "react";
import { AdditiveBlending, DoubleSide, Group, MathUtils } from "three";

export function CrescentScene({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  return (
    <Canvas
      camera={{ fov: 38, position: [0, 0, 5.8] }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
    >
      <ambientLight intensity={0.32} />
      <pointLight color="#63d8ff" intensity={6} position={[-2.2, 1.6, 3]} />
      <pointLight color="#8b7cff" intensity={5} position={[2.4, -1.2, 2]} />
      <CrescentAssembly scrollProgress={scrollProgress} />
    </Canvas>
  );
}

function CrescentAssembly({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const followGroup = useRef<Group>(null);
  const rotatingGroup = useRef<Group>(null);
  const particlePositions = useMemo(() => {
    const positions = new Float32Array(54 * 3);
    for (let index = 0; index < 54; index += 1) {
      const angle = index * 2.399963;
      const radius = 1.25 + ((index * 17) % 19) * 0.055;
      positions[index * 3] = Math.cos(angle) * radius;
      positions[index * 3 + 1] = Math.sin(angle) * radius * 0.72;
      positions[index * 3 + 2] = ((index * 13) % 17) * 0.04 - 0.32;
    }
    return positions;
  }, []);

  useFrame((state, delta) => {
    if (!followGroup.current || !rotatingGroup.current) return;
    followGroup.current.rotation.x = MathUtils.damp(followGroup.current.rotation.x, state.pointer.y * 0.1, 4, delta);
    followGroup.current.rotation.y = MathUtils.damp(
      followGroup.current.rotation.y,
      state.pointer.x * 0.14 + scrollProgress.get() * 0.9,
      4,
      delta,
    );
    rotatingGroup.current.rotation.z += delta * 0.035;
  });

  return (
    <group ref={followGroup} rotation={[-0.08, 0.12, -0.15]}>
      <group ref={rotatingGroup}>
        <mesh>
          <circleGeometry args={[1.42, 96]} />
          <meshStandardMaterial
            color="#8b7cff"
            emissive="#31286f"
            emissiveIntensity={0.65}
            metalness={0.58}
            roughness={0.34}
            side={DoubleSide}
          />
        </mesh>
        <mesh position={[0.52, 0.12, 0.035]}>
          <circleGeometry args={[1.3, 96]} />
          <meshBasicMaterial color="#07070a" side={DoubleSide} />
        </mesh>
        <mesh rotation={[0.2, 0.1, 0.35]}>
          <torusGeometry args={[1.82, 0.012, 8, 180]} />
          <meshBasicMaterial color="#63d8ff" opacity={0.42} transparent />
        </mesh>
        <mesh rotation={[1.18, 0.12, -0.6]}>
          <torusGeometry args={[1.56, 0.009, 8, 160]} />
          <meshBasicMaterial color="#8b7cff" opacity={0.34} transparent />
        </mesh>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
          </bufferGeometry>
          <pointsMaterial
            blending={AdditiveBlending}
            color="#b7efff"
            depthWrite={false}
            opacity={0.65}
            size={0.024}
            transparent
          />
        </points>
      </group>
    </group>
  );
}
