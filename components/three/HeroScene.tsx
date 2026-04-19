"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Environment } from "@react-three/drei";
import { Suspense, useRef, useEffect, useState } from "react";
import type { Mesh } from "three";

function DistortedShape() {
  const mesh = useRef<Mesh>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setPointer({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame((_, delta) => {
    if (!mesh.current) return;
    mesh.current.rotation.x += delta * 0.15;
    mesh.current.rotation.y += delta * 0.2;
    mesh.current.rotation.x += (pointer.y * 0.3 - mesh.current.rotation.x) * 0.04;
    mesh.current.rotation.y += (pointer.x * 0.3 - mesh.current.rotation.y) * 0.04;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={1.2}>
      <mesh ref={mesh} scale={1.8}>
        <icosahedronGeometry args={[1, 24]} />
        <MeshDistortMaterial
          color="#0f0f11"
          emissive="#34d399"
          emissiveIntensity={0.22}
          roughness={0.3}
          metalness={0.85}
          distort={0.42}
          speed={1.6}
          wireframe={false}
        />
      </mesh>

      {/* wireframe overlay for that techy look */}
      <mesh scale={1.82}>
        <icosahedronGeometry args={[1, 3]} />
        <meshBasicMaterial
          color="#34d399"
          wireframe
          transparent
          opacity={0.18}
        />
      </mesh>
    </Float>
  );
}

export function HeroScene() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (!mounted) {
    return <div className="h-full w-full" />;
  }

  if (isMobile) {
    return (
      <div className="relative h-full w-full">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.15),transparent_70%)]" />
        <div className="absolute inset-0 dotted-grid opacity-20" />
      </div>
    );
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 4.5], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
        <directionalLight
          position={[-5, -3, -2]}
          intensity={0.6}
          color="#34d399"
        />
        <pointLight position={[0, 0, 3]} intensity={0.8} color="#fcd34d" />
        <DistortedShape />
        <Environment preset="night" />
      </Suspense>
    </Canvas>
  );
}
