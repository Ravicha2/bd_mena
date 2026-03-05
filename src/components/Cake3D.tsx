import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { Candle } from './Candle';

interface Cake3DProps {
    candleCount: number;
    // This represents how many candles have been blown out.
    // Note: the App should pass `Math.max(0, extinguishedTotal - ORB_COUNT)` 
    // so candles only blow out after orbs.
    extinguishedCandleCount: number;
}

export function Cake3D({ candleCount, extinguishedCandleCount }: Cake3DProps) {
    const groupRef = useRef<Group>(null);

    // Gentle idle rotation and floating
    useFrame((state) => {
        if (groupRef.current) {
            const t = state.clock.getElapsedTime();
            groupRef.current.rotation.y = t * 0.1;
            groupRef.current.position.y = Math.sin(t * 0.5) * 0.1 - 1; // Base position slightly lower
        }
    });

    // Calculate candle positions (arranged in a circle on top of the cake)
    const renderCandles = () => {
        const candles = [];
        const radius = 1.2; // Radius to place the candles on the top tier

        for (let i = 0; i < candleCount; i++) {
            const angle = (i / candleCount) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            // The top tier is at y = 1.5, so candles sit slightly in/on it

            candles.push(
                <Candle
                    key={`candle-${i}`}
                    position={[x, 1.5, z]}
                    isExtinguished={i < extinguishedCandleCount}
                    scale={0.8} // slightly smaller to match the thick cake
                />
            );
        }
        return candles;
    };

    return (
        <group ref={groupRef}>
            {/* Base Plate / Platter */}
            <mesh position={[0, -0.1, 0]} receiveShadow>
                <cylinderGeometry args={[2.5, 2.6, 0.1, 32]} />
                <meshStandardMaterial color="#c0c0c0" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Bottom Tier */}
            <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[2, 2, 0.8, 32]} />
                <meshStandardMaterial color="#f0d5e1" roughness={0.7} /> {/* Dusty rose / soft pink frosting */}
            </mesh>

            {/* Top Tier */}
            <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[1.5, 1.5, 0.7, 32]} />
                <meshStandardMaterial color="#f0e6d2" roughness={0.6} /> {/* Creamy vanilla top tier */}
            </mesh>

            {/* Extra Cake Details (sprinkles or drop frosting) */}
            {[...Array(12)].map((_, i) => (
                <mesh
                    key={`frosting-drop-${i}`}
                    position={[
                        Math.cos((i / 12) * Math.PI * 2) * 1.5,
                        1.4,
                        Math.sin((i / 12) * Math.PI * 2) * 1.5
                    ]}
                    castShadow
                >
                    <sphereGeometry args={[0.08, 16, 16]} />
                    <meshStandardMaterial color="#ffffff" />
                </mesh>
            ))}

            {/* Place the candles */}
            {renderCandles()}
        </group>
    );
}
