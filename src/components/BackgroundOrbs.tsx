import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, PointLight } from 'three';

interface OrbProps {
    position: [number, number, number];
    isExtinguished: boolean;
    baseColor: string;
    speed: number;
    offset: number;
}

function Orb({ position, isExtinguished, baseColor, speed, offset }: OrbProps) {
    const meshRef = useRef<Mesh>(null);
    const lightRef = useRef<PointLight>(null);

    const blownTimeRef = useRef<number | null>(null);

    useFrame((state) => {
        if (!meshRef.current || !lightRef.current) return;

        if (isExtinguished) {
            // Blow away animation
            if (blownTimeRef.current === null) {
                blownTimeRef.current = state.clock.getElapsedTime();
            } else {
                const timeSinceBlown = state.clock.getElapsedTime() - blownTimeRef.current;
                // Animate upward off-screen with slight drift
                meshRef.current.position.y += 0.05 + timeSinceBlown * 0.03; // Accelerate upwards
                meshRef.current.position.x += Math.sin(timeSinceBlown * 3 + offset) * 0.02;
                meshRef.current.position.z += Math.cos(timeSinceBlown * 3 + offset) * 0.02;

                // For sky orbs we don't scale out entirely because they join the sky. 
                // But we can scale back to normal (1) from any pulse state so they blend in.
                meshRef.current.scale.lerp({ x: 1, y: 1, z: 1 }, 0.05);
            }
        } else {
            const time = state.clock.getElapsedTime();
            // Gentle floating animation — use local y (relative to group, which already sets world position)
            meshRef.current.position.y = Math.sin(time * speed + offset) * 0.5;
            // Pulse animation
            const scale = 1 + Math.sin(time * speed * 2 + offset) * 0.1;
            meshRef.current.scale.set(scale, scale, scale);
        }
    });

    return (
        <group position={position}>
            <mesh ref={meshRef}>
                <sphereGeometry args={[0.1, 16, 16]} />
                <meshStandardMaterial
                    color={baseColor}
                    emissive={baseColor}
                    emissiveIntensity={1.5}
                    transparent
                    opacity={0.8}
                />
            </mesh>
            <pointLight
                ref={lightRef}
                color={baseColor}
                intensity={1}
                distance={5}
            />
        </group>
    );
}

interface BackgroundOrbsProps {
    count: number;
    extinguishedCount: number;
}

export function BackgroundOrbs({ count, extinguishedCount }: BackgroundOrbsProps) {
    // Warm, candle-like and firefly-like tones (yellows, soft oranges, pale warm whites)
    const colors = useMemo(() => ['#ffddcf', '#ffcc99', '#ffeb99', '#ffb366', '#fff5cc'], []);

    // Generate random positions, colors, and animation offsets for the lower orbs
    const orbsData = useMemo(() => {
        const data = [];
        for (let i = 0; i < count; i++) {
            // Distribute orbs in a wide circle/sphere surrounding the center cake
            const angle = (i / count) * Math.PI * 2;
            const radius = 4 + Math.random() * 3; // Keep away from center (r > 4)
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = -1 + Math.random() * 4; // Varying heights

            data.push({
                id: `orb-${i}`,
                position: [x, y, z] as [number, number, number],
                color: colors[i % colors.length],
                speed: 0.5 + Math.random() * 0.5,
                offset: Math.random() * Math.PI * 2
            });
        }
        return data;
    }, [count, colors]);

    // Generate pre-populated sky orbs high above the scene
    const skyOrbsData = useMemo(() => {
        const data = [];
        const skyCount = 40; // Pre-populate more orbs!
        for (let i = 0; i < skyCount; i++) {
            // Position them explicitly in front of the camera (which is at z=10 looking towards z=0)
            const x = -15 + Math.random() * 30; // spread horizontally (-15 to +15)
            const z = -5 - Math.random() * 15;  // deep into the background (-5 to -20)
            const y = 16 + Math.random() * 10; // Compressed height range between 16 and 26 to fit screen

            data.push({
                id: `sky-${i}`,
                position: [x, y, z] as [number, number, number],
                color: colors[i % colors.length],
                speed: 0.2 + Math.random() * 0.3, // Slower bobbing in the sky
                offset: Math.random() * Math.PI * 2
            });
        }
        return data;
    }, [colors]);

    return (
        <group>
            {/* Lower scene orbs */}
            {orbsData.map((orb, index) => (
                <Orb
                    key={orb.id}
                    position={orb.position}
                    baseColor={orb.color}
                    speed={orb.speed}
                    offset={orb.offset}
                    // The first N blows extinguish orbs
                    isExtinguished={index < extinguishedCount}
                />
            ))}

            {/* Sky orbs - naturally never extinguished, they just loop their animation */}
            {skyOrbsData.map((orb) => (
                <Orb
                    key={orb.id}
                    position={orb.position}
                    baseColor={orb.color}
                    speed={orb.speed}
                    offset={orb.offset}
                    isExtinguished={false}
                />
            ))}
        </group>
    );
}
