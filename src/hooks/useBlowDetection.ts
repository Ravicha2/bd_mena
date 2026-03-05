import { useState, useEffect, useRef } from 'react';

export function useBlowDetection(
    threshold: number = 0.5,
    cooldown: number = 100,
    onBlowDetected: () => void
) {
    const [isListening, setIsListening] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const requestAnimationFrameRef = useRef<number>();
    const lastBlowTimeRef = useRef<number>(0);

    // Use a callback ref so it's always up to date
    const onBlowDetectedRef = useRef(onBlowDetected);
    useEffect(() => {
        onBlowDetectedRef.current = onBlowDetected;
    }, [onBlowDetected]);

    useEffect(() => {
        // Only request automatically if not denied
        // In production, we typically need a user interaction first for AudioContext
        let stream: MediaStream | null = null;

        const startListening = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });

                // Setup Web Audio API
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                audioContextRef.current = audioCtx;

                if (audioCtx.state === 'suspended') {
                    // This happens if autoplay policy blocks audio context start without user interaction
                    // We'll leave it suspended and let App.tsx handle resuming on first click
                }

                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 256;
                const microphone = audioCtx.createMediaStreamSource(stream);
                microphone.connect(analyser);

                analyserRef.current = analyser;
                microphoneRef.current = microphone;
                setIsListening(true);
                setPermissionDenied(false);

                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);

                const checkAudioLevel = () => {
                    if (!analyserRef.current) return;

                    analyserRef.current.getByteFrequencyData(dataArray);

                    // Calculate max volume (peak) instead of average for better blow detection
                    let maxVolume = 0;
                    for (let i = 0; i < bufferLength; i++) {
                        if (dataArray[i] > maxVolume) {
                            maxVolume = dataArray[i];
                        }
                    }

                    // Normalize volume (0 to 1) based on standard 8-bit depth (255 max)
                    const normalizedVol = maxVolume / 255;

                    const now = Date.now();
                    if (normalizedVol > threshold && (now - lastBlowTimeRef.current) > cooldown) {
                        lastBlowTimeRef.current = now;
                        onBlowDetectedRef.current();
                    }

                    requestAnimationFrameRef.current = requestAnimationFrame(checkAudioLevel);
                };

                checkAudioLevel();
            } catch (err) {
                console.error('Error accessing microphone:', err);
                setPermissionDenied(true);
            }
        };

        startListening();

        return () => {
            if (requestAnimationFrameRef.current) {
                cancelAnimationFrame(requestAnimationFrameRef.current);
            }
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(console.error);
            }
        };
    }, [threshold, cooldown]);

    // Method to manually resume AudioContext if it was suspended
    const resumeAudioContext = () => {
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
    };

    return { isListening, permissionDenied, resumeAudioContext };
}
