import { useState, useRef, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { AnimatePresence, motion } from 'framer-motion';

import { useBlowDetection } from './hooks/useBlowDetection';
import { Cake3D } from './components/Cake3D';
import { BackgroundOrbs } from './components/BackgroundOrbs';
import { CameraRig } from './components/CameraRig';

// --- Configuration Constants ---
export const CANDLE_COUNT = 5;
export const ORB_COUNT = 20;
export const TOTAL_BLOWS = CANDLE_COUNT + ORB_COUNT;
export const BLOW_THRESHOLD = 0.4;
export const BLOW_COOLDOWN = 30; // allow rapid sequential blowing

function App() {
    const [extinguishedCount, setExtinguishedCount] = useState(0);
    const [audioStarted, setAudioStarted] = useState(false);
    const [panComplete, setPanComplete] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Initialize blow detection
    const { permissionDenied, resumeAudioContext } = useBlowDetection(
        BLOW_THRESHOLD,
        BLOW_COOLDOWN,
        () => {
            setExtinguishedCount((prev) => Math.min(prev + 1, TOTAL_BLOWS));
        }
    );

    // Handle interaction to start Web Audio context and BGM
    const handleUserInteraction = () => {
        if (!audioStarted) {
            resumeAudioContext();
            if (audioRef.current) {
                audioRef.current.play().catch(console.error);
                audioRef.current.volume = 0.4;
            }
            setAudioStarted(true);
        }
    };

    // Add global interaction listener for autoplay policies
    useEffect(() => {
        window.addEventListener('click', handleUserInteraction);
        window.addEventListener('touchstart', handleUserInteraction);
        return () => {
            window.removeEventListener('click', handleUserInteraction);
            window.removeEventListener('touchstart', handleUserInteraction);
        };
    }, [audioStarted]);

    const allExtinguished = extinguishedCount >= TOTAL_BLOWS;
    const orbsExtinguished = Math.min(extinguishedCount, ORB_COUNT);
    const candlesExtinguished = Math.max(0, extinguishedCount - ORB_COUNT);

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>

            {/* Background Music */}
            {/* REPLACE WITH FINAL SONG (e.g., romantic instrumental piano/strings) */}
            <audio
                ref={audioRef}
                src="https://cdn.pixabay.com/download/audio/2022/10/25/audio_24e365cbdb.mp3?filename=romantic-piano-123493.mp3"
                loop
            />

            {/* R3F Canvas */}
            <Canvas shadows>
                <PerspectiveCamera makeDefault position={[0, 4, 10]} fov={45} />
                {!allExtinguished && (
                    <OrbitControls
                        enablePan={false}
                        enableZoom={true}
                        minPolarAngle={Math.PI / 4}
                        maxPolarAngle={Math.PI / 2}
                        minDistance={5}
                        maxDistance={15}
                    />
                )}
                <CameraRig
                    allExtinguished={allExtinguished}
                    onPanComplete={() => setPanComplete(true)}
                />

                {/* Soft immersive lighting */}
                <ambientLight intensity={0.2} color="#445588" />
                <directionalLight
                    position={[5, 10, 5]}
                    intensity={0.5}
                    color="#ffdcb4"
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                />
                {/* Adds natural subtle reflections to materials */}
                <Environment preset="night" />

                <Suspense fallback={null}>
                    <BackgroundOrbs
                        count={ORB_COUNT}
                        extinguishedCount={orbsExtinguished}
                    />
                    <Cake3D
                        candleCount={CANDLE_COUNT}
                        extinguishedCandleCount={candlesExtinguished}
                    />
                </Suspense>
            </Canvas>

            {/* UI Overlay: Audio permission fallback */}
            {permissionDenied && (
                <div style={{ position: 'absolute', top: 20, left: 20, color: 'red', zIndex: 10 }}>
                    <p>Microphone access was denied. Cannot blow candles.</p>
                </div>
            )}

            {/* Start Instruction */}
            {!audioStarted && !allExtinguished && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: '#f3e8ff',
                    textAlign: 'center',
                    pointerEvents: 'none',
                    zIndex: 10,
                }}>
                    <p style={{ fontStyle: 'italic', fontSize: '1.2rem', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                        Tap anywhere to begin
                    </p>
                </div>
            )}

            {/* Constant Instruction & Counter Overlay */}
            {audioStarted && !allExtinguished && (
                <>
                    <div style={{ position: 'absolute', top: 20, right: 30, color: 'rgba(255,255,255,0.7)', zIndex: 10, fontFamily: 'Playfair Display' }}>
                        <span>
                            Extinguished: {extinguishedCount} / {TOTAL_BLOWS}
                        </span>
                    </div>

                    <div style={{
                        position: 'absolute',
                        bottom: '10%',
                        width: '100%',
                        textAlign: 'center',
                        pointerEvents: 'none',
                        animation: 'pulse 3s infinite ease-in-out'
                    }}>
                        <p style={{
                            fontStyle: 'italic',
                            fontSize: '1.5rem',
                            color: '#f3e8ff',
                            textShadow: '0px 2px 8px rgba(0,0,0,0.8)'
                        }}>
                            Make a wish, then blow…
                        </p>
                    </div>
                </>
            )}

            {/* Final Happy Birthday Overlay */}
            <AnimatePresence>
                {(allExtinguished && panComplete) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'none',
                            zIndex: 100,
                            // Soft vignette that allows the sky orbs to shine through
                            background: 'radial-gradient(circle, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 100%)'
                        }}
                    >
                        <motion.h1
                            initial={{ scale: 0.8, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0, ease: 'easeOut' }}
                            style={{
                                fontFamily: "'Great Vibes', cursive",
                                fontSize: 'clamp(4rem, 10vw, 8rem)',
                                background: '-webkit-linear-gradient(45deg, #ffd700, #ffb347, #ff6b6b)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                textShadow: '0 0 40px rgba(255, 215, 0, 0.3)',
                                textAlign: 'center',
                                margin: 0,
                                padding: '0 20px',
                            }}
                        >
                            Happy Birthday
                        </motion.h1>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
      `}</style>
        </div>
    );
}

export default App;
