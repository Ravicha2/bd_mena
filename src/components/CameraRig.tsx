import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';

interface CameraRigProps {
    allExtinguished: boolean;
    onPanComplete: () => void;
}

export function CameraRig({ allExtinguished, onPanComplete }: CameraRigProps) {
    const panCompleteRef = useRef(false);

    // We assume the initial camera target was (0,0,0) due to OrbitControls defaults.
    // We create a dummy vector to lerp the lookAt target upwards smoothly.
    const lookAtTarget = useMemo(() => new Vector3(0, 0, 0), []);

    useFrame((state) => {
        if (allExtinguished) {
            // Lerp camera position up and back to frame the sky orbs cluster
            // Sky orbs are at y=18-24, z=-5 to -20 — position camera to see them
            state.camera.position.lerp(new Vector3(0, 20, 8), 0.015);

            // Lerp the lookAt target to the center of the sky orb cluster
            lookAtTarget.lerp(new Vector3(0, 21, -12), 0.015);
            state.camera.lookAt(lookAtTarget);

            // Trigger pan complete once camera has risen enough (don't wait until the very end)
            if (!panCompleteRef.current && state.camera.position.y > 14) {
                panCompleteRef.current = true;
                onPanComplete();
            }
        }
    });

    return null;
}
