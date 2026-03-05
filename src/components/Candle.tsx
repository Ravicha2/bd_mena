import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, PointLight, MathUtils } from 'three';

interface CandleProps {
    position: [number, number, number];
    isExtinguished: boolean;
    scale?: number;
}

export function Candle({ position, isExtinguished, scale = 1 }: CandleProps) {
    const flameRef = useRef<Mesh>(null);
    const lightRef = useRef<PointLight>(null);

    // Animate the flame flickering and scaling down when extinguished
    useFrame((state) => {
        if (!flameRef.current || !lightRef.current) return;

        if (isExtinguished) {
            // Smoothly scale down flame
            flameRef.current.scale.lerp({ x: 0, y: 0, z: 0 }, 0.1);
            // Smoothly fade out light
            lightRef.current.intensity = MathUtils.lerp(lightRef.current.intensity, 0, 0.1);
        } else {
            // Natural flame flicker
            const time = state.clock.getElapsedTime();
            const flicker = Math.sin(time * 20) * 0.1 + Math.sin(time * 30) * 0.05 + 1;

            flameRef.current.scale.set(1, flicker, 1);
            lightRef.current.intensity = 1.5 + flicker * 0.2;
        }
    });

    return (
        <group position={position} scale={scale}>
            {/* Candle Body */}
            <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.06, 0.06, 1, 16]} />
                <meshStandardMaterial color="#fffdd0" roughness={0.3} />
            </mesh>

            {/* Wick */}
            <mesh position={[0, 1.05, 0]}>
                <cylinderGeometry args={[0.005, 0.005, 0.1, 8]} />
                <meshStandardMaterial color="#333333" />
            </mesh>

            {/* Flame */}
            {/* We use scale logic inside useFrame instead of conditionally unmounting so we get a smooth fade out */}
            <mesh ref={flameRef} position={[0, 1.15, 0]}>
                <coneGeometry args={[0.04, 0.15, 16]} />
                {/* Emissive material makes it glow in the dark */}
                <meshStandardMaterial
                    color="#ffb347"
                    emissive="#ffa500"
                    emissiveIntensity={2}
                    toneMapped={false}
                />
            </mesh>

            {/* Pointlight attached to the flame */}
            <pointLight
                ref={lightRef}
                position={[0, 1.2, 0]}
                color="#ffcc66"
                distance={3}
                decay={2}
                castShadow
            />
        </group>
    );
}
