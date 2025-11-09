import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function AnimatedEarth() {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Create glowing data points on Earth
  const dataPoints = useMemo(() => {
    const points = [];
    // Canada cities approximate coordinates
    const cities = [
      { name: 'Halifax', lat: 44.6488, lon: -63.5752 },
      { name: 'Toronto', lat: 43.6532, lon: -79.3832 },
      { name: 'Vancouver', lat: 49.2827, lon: -123.1207 },
      { name: 'Montreal', lat: 45.5017, lon: -73.5673 },
      { name: 'Calgary', lat: 51.0447, lon: -114.0719 },
    ];

    cities.forEach(city => {
      const phi = (90 - city.lat) * (Math.PI / 180);
      const theta = (city.lon + 180) * (Math.PI / 180);
      const x = -(2.2 * Math.sin(phi) * Math.cos(theta));
      const y = 2.2 * Math.cos(phi);
      const z = 2.2 * Math.sin(phi) * Math.sin(theta);
      points.push({ position: [x, y, z], name: city.name });
    });

    return points;
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main Earth sphere */}
      <Sphere ref={meshRef} args={[2, 64, 64]}>
        <MeshDistortMaterial
          color="#1A5134"
          attach="material"
          distort={0.2}
          speed={1.5}
          roughness={0.4}
          metalness={0.6}
        />
      </Sphere>

      {/* Glowing atmosphere */}
      <Sphere args={[2.1, 64, 64]}>
        <meshBasicMaterial
          color="#00C9A7"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Data points */}
      {dataPoints.map((point, i) => (
        <group key={i} position={point.position as [number, number, number]}>
          <Sphere args={[0.05, 16, 16]}>
            <meshBasicMaterial color="#00C9A7" />
          </Sphere>
          {/* Pulsing glow */}
          <Sphere args={[0.08, 16, 16]}>
            <meshBasicMaterial
              color="#00C9A7"
              transparent
              opacity={0.4}
            />
          </Sphere>
        </group>
      ))}
    </group>
  );
}

export default function Earth3D() {
  return (
    <div className="w-full h-screen">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#00C9A7" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#FFD88D" />
        <AnimatedEarth />
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={5}
          maxDistance={12}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
