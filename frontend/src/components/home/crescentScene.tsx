"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  BufferGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  MathUtils,
  MeshStandardMaterial,
  Shape,
} from "three";

const EXTRUDE_DEPTH = 0.14;

export function CrescentScene() {
  return (
    <Canvas
      camera={{ fov: 34, position: [0, 0.08, 5.2] }}
      dpr={[1, 1.6]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
    >
      <hemisphereLight args={["#f8f6f0", "#b7c4bc", 0.95]} />
      <ambientLight intensity={0.7} />
      <directionalLight color="#fffdf8" intensity={1.35} position={[-2.4, 3.2, 3.8]} />
      <directionalLight color="#d7e2db" intensity={0.55} position={[2.8, -1.4, 2.2]} />
      <CrescentAssembly />
    </Canvas>
  );
}

function CrescentAssembly() {
  const root = useRef<Group>(null);
  const crescent = useRef<Group>(null);
  const orbitA = useRef<Group>(null);
  const orbitB = useRef<Group>(null);
  const orbitC = useRef<Group>(null);
  const pointer = useRef({ x: 0, y: 0 });

  const crescentGeometry = useMemo(() => {
    const geometry = new ExtrudeGeometry(createCrescentShape(), {
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.018,
      bevelThickness: 0.02,
      curveSegments: 96,
      depth: EXTRUDE_DEPTH,
      steps: 1,
    });
    geometry.translate(0, 0, -EXTRUDE_DEPTH / 2);
    geometry.computeVertexNormals();
    return geometry;
  }, []);

  const materials = useMemo(() => {
    const face = new MeshStandardMaterial({
      color: "#4d7163",
      metalness: 0.04,
      roughness: 0.82,
      side: DoubleSide,
    });
    const edge = new MeshStandardMaterial({
      color: "#2f4a41",
      metalness: 0.06,
      roughness: 0.9,
    });
    return [face, edge];
  }, []);

  const ringA = useMemo(() => createOrbitLine(1.92, 0.78, 180, "#7f9589", 0.55), []);
  const ringB = useMemo(() => createOrbitLine(1.58, 1.12, 160, "#9aa79f", 0.38), []);
  const ringC = useMemo(() => createOrbitLine(1.22, 1.22, 120, "#b8b4a8", 0.28), []);

  useFrame((state, delta) => {
    if (!root.current || !crescent.current || !orbitA.current || !orbitB.current || !orbitC.current) return;

    pointer.current.x = MathUtils.damp(pointer.current.x, state.pointer.x, 3.2, delta);
    pointer.current.y = MathUtils.damp(pointer.current.y, state.pointer.y, 3.2, delta);

    root.current.rotation.x = -0.08 + pointer.current.y * 0.12;
    root.current.rotation.y = 0.16 + pointer.current.x * 0.16;

    const t = state.clock.elapsedTime;
    crescent.current.rotation.x = 0.38 + Math.sin(t * 0.35) * 0.04;
    crescent.current.rotation.y = t * 0.32;
    crescent.current.rotation.z = Math.sin(t * 0.22) * 0.06;
    crescent.current.position.y = Math.sin(t * 0.5) * 0.035;

    orbitA.current.rotation.z = t * 0.18;
    orbitB.current.rotation.z = -t * 0.12;
    orbitC.current.rotation.x = t * 0.08;
  });

  return (
    <group ref={root}>
      <group ref={crescent}>
        <mesh geometry={crescentGeometry} material={materials} />
      </group>

      <group ref={orbitA} rotation={[0.55, 0.15, 0.2]}>
        <primitive object={ringA} />
        <mesh position={[1.92, 0, 0]}>
          <sphereGeometry args={[0.028, 16, 16]} />
          <meshBasicMaterial color="#b06a55" />
        </mesh>
      </group>

      <group ref={orbitB} rotation={[1.05, -0.2, -0.35]}>
        <primitive object={ringB} />
        <mesh position={[0, 1.12, 0]}>
          <sphereGeometry args={[0.016, 12, 12]} />
          <meshBasicMaterial color="#3f7d6a" />
        </mesh>
      </group>

      <group ref={orbitC} rotation={[0.2, 0.4, 0.1]}>
        <primitive object={ringC} />
      </group>
    </group>
  );
}

function createOrbitLine(
  radiusX: number,
  radiusY: number,
  segments: number,
  color: string,
  opacity: number,
) {
  const positions: number[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    positions.push(Math.cos(angle) * radiusX, Math.sin(angle) * radiusY, 0);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  return new Line(
    geometry,
    new LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }),
  );
}

/** 更纤细的月牙轮廓：外弧饱满、内弧收得干净 */
function createCrescentShape() {
  const outerRadius = 1.28;
  const innerRadius = 1.02;
  const innerOffset = 0.52;
  const intersectionX = (outerRadius ** 2 - innerRadius ** 2 + innerOffset ** 2) / (2 * innerOffset);
  const outerAngle = Math.acos(MathUtils.clamp(intersectionX / outerRadius, -1, 1));
  const innerAngle = Math.acos(MathUtils.clamp((intersectionX - innerOffset) / innerRadius, -1, 1));
  const shape = new Shape();

  shape.absarc(0, 0, outerRadius, outerAngle, Math.PI * 2 - outerAngle, false);
  shape.absarc(innerOffset, 0, innerRadius, -innerAngle, innerAngle, true);
  shape.closePath();
  return shape;
}
