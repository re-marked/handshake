import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import { CatmullRomCurve3, Vector3 } from "three";

function Cork() {
  return (
    <mesh receiveShadow>
      <planeGeometry args={[24, 18]} />
      <meshStandardMaterial color="#c4a882" roughness={0.95} metalness={0} />
    </mesh>
  );
}

function Pin({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[0.14, 24, 24]} />
      <meshStandardMaterial color="#c0392b" metalness={0.3} roughness={0.2} />
    </mesh>
  );
}

function catenary(p1: Vector3, p2: Vector3, segments = 48): Vector3[] {
  const dist = p1.distanceTo(p2);
  const sag = dist * 0.16;
  const pts: Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    pts.push(
      new Vector3(
        p1.x + (p2.x - p1.x) * t,
        p1.y + (p2.y - p1.y) * t - Math.sin(t * Math.PI) * sag,
        p1.z + (p2.z - p1.z) * t
      )
    );
  }
  return pts;
}

function Yarn({
  from,
  to,
}: {
  from: [number, number, number];
  to: [number, number, number];
}) {
  const curve = useMemo(() => {
    const p1 = new Vector3(...from);
    const p2 = new Vector3(...to);
    return new CatmullRomCurve3(catenary(p1, p2));
  }, [from[0], from[1], from[2], to[0], to[1], to[2]]);

  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, 96, 0.038, 10, false]} />
      <meshStandardMaterial color="#7a1c1c" roughness={0.97} metalness={0} />
    </mesh>
  );
}

export default function Scene() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 18], fov: 48 }}
      style={{ width: "100%", height: "100%", background: "#1a1714" }}
    >
      {/* warm ambient fill — very dim so the spot does the work */}
      <ambientLight intensity={0.12} color="#ffaa55" />

      {/* the lamp — top-left, warm, soft shadows */}
      <spotLight
        position={[-5, 7, 12]}
        angle={0.55}
        penumbra={0.9}
        intensity={4}
        color="#ffd49a"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
      />

      <Cork />
      <Pin position={[-5, 2.5, 0.08]} />
      <Pin position={[4, -1.5, 0.08]} />
      <Yarn from={[-5, 2.5, 0.08]} to={[4, -1.5, 0.08]} />

      {/* pan + zoom only, no rotation — the board is flat */}
      <OrbitControls enableRotate={false} enablePan enableZoom />
    </Canvas>
  );
}
