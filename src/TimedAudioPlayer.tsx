import { useRef, useState } from 'react';
import * as Tone from 'tone';

export interface AudioEvent {
    time: number; // Time in seconds
    action: () => void;
    id: string;
}

interface AudioPlayerProps {
    src: string;
    events: AudioEvent[];
}

const TimedAudioPlayer = ({ src, events }: AudioPlayerProps) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [triggeredEvents, setTriggeredEvents] = useState<Set<string>>(new Set());
    const [isRecording, setIsRecording] = useState(false);
    const [audioURL, setAudioURL] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // Audio control states
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [loop, setLoop] = useState(false);

    const startRecording = async () => {
        // 1. Požiadame o prístup k mikrofónu
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // 2. Vytvoríme inštanciu MediaRecorder
        mediaRecorderRef.current = new MediaRecorder(stream);

        // 3. Zbierame dáta (chunks), keď sú dostupné
        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        // 4. Po zastavení vytvoríme finálny zvukový súbor
        mediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mpeg' });
            const url = URL.createObjectURL(audioBlob);
            setAudioURL(url);
            audioChunksRef.current = []; // Vyčistíme buffer
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
    };

    const stopRecording = () => {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        // Zastavíme všetky stopy mikrofónu (vypne sa kontrolka na notebooku)
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    };
    const handleTimeUpdate = () => {
        if (!audioRef.current) return;

        const currentTime = audioRef.current.currentTime;
        setCurrentTime(currentTime);

        events.forEach((event) => {
            // Trigger if we passed the time AND haven't triggered it yet
            if (currentTime >= event.time && !triggeredEvents.has(event.id)) {
                event.action();

                // Mark as triggered so it doesn't fire 60 times in one second
                setTriggeredEvents((prev) => new Set(prev).add(event.id));
            }
        });
    };

    // Reset events if the audio is restarted or src changes
    const handlePlay = () => {
        if (audioRef.current?.currentTime === 0) {
            setTriggeredEvents(new Set());
        }
        setIsPlaying(true);
    };

    const handlePause = () => {
        setIsPlaying(false);
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    // Control handlers
    const togglePlayPause = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    };

    const handleSpeedChange = (speed: number) => {
        setPlaybackSpeed(speed);
        if (audioRef.current) {
            audioRef.current.playbackRate = speed;
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        setCurrentTime(newTime);
        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
        }
    };

    const skipTime = (seconds: number) => {
        if (!audioRef.current) return;
        const newTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const toggleLoop = () => {
        setLoop(!loop);
        if (audioRef.current) {
            audioRef.current.loop = !loop;
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleUserClick = () => {
        // audioRef.current.currentTime nám povie presný čas v sekundách
        const timestamp = audioRef.current.currentTime;
        console.log("Používateľ klikol v čase:", timestamp);

        // Tu môžeš uložiť čas k danej note/objektu
        console.log('time', timestamp);
    };

    const playTone = (freq = 440, duration = 0.5) => {
        // 1. Vytvorenie audio kontextu (mozog operácie)
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        // 2. Vytvorenie oscilátora (zdroj zvuku)
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain(); // Ovládač hlasitosti

        oscillator.type = 'sine'; // Typ vlny: 'sine', 'square', 'sawtooth', 'triangle'
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime); // Frekvencia v Hz (440 = komorné A)

        // 3. Nastavenie "Fade out" efektu, aby zvuk nepraskal
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // 4. Štart a stop
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration);
    };

    const playNoteTone = async (note) => {
        // Tone.js potrebuje interakciu používateľa na spustenie audio kontextu
        await Tone.start();
// DuoSynth - bohatý zvuk vhodný pre sólové husľové party
        const synth = new Tone.AMSynth().toDestination();
        synth.triggerAttackRelease(note, "0.2s"); // Zahrá notu (napr. "C4") v dĺžke osminovej noty
    };

    return (
        <div style={styles.container}>
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onPlay={handlePlay}
                onPause={handlePause}
                onLoadedMetadata={handleLoadedMetadata}
                style={{ display: 'none' }}
            />

            {/* Custom Audio Controls */}
            <div style={styles.controlsContainer}>
                <h3 style={styles.title}>Audio Player</h3>

                {/* Progress Bar */}
                <div style={styles.progressContainer}>
                    <span style={styles.timeDisplay}>{formatTime(currentTime)}</span>
                    <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        style={styles.progressBar}
                    />
                    <span style={styles.timeDisplay}>{formatTime(duration)}</span>
                </div>

                {/* Main Controls */}
                <div style={styles.mainControls}>
                    <button onClick={() => skipTime(-10)} style={styles.controlButton} title="Skip -10s">
                        ⏪
                    </button>
                    <button onClick={() => skipTime(-5)} style={styles.controlButton} title="Skip -5s">
                        ⏮
                    </button>
                    <button onClick={togglePlayPause} style={styles.playButton}>
                        {isPlaying ? '⏸' : '▶'}
                    </button>
                    <button onClick={() => skipTime(5)} style={styles.controlButton} title="Skip +5s">
                        ⏭
                    </button>
                    <button onClick={() => skipTime(10)} style={styles.controlButton} title="Skip +10s">
                        ⏩
                    </button>
                    <button 
                        onClick={toggleLoop} 
                        style={{...styles.controlButton, ...(loop ? styles.activeButton : {})}}
                        title="Loop"
                    >
                        🔁
                    </button>
                </div>

                {/* Volume Control */}
                <div style={styles.volumeContainer}>
                    <span style={styles.label}>🔊 Volume:</span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={handleVolumeChange}
                        style={styles.slider}
                    />
                    <span style={styles.valueDisplay}>{Math.round(volume * 100)}%</span>
                </div>

                {/* Playback Speed */}
                <div style={styles.speedContainer}>
                    <span style={styles.label}>⚡ Speed:</span>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                        <button
                            key={speed}
                            onClick={() => handleSpeedChange(speed)}
                            style={{
                                ...styles.speedButton,
                                ...(playbackSpeed === speed ? styles.activeSpeedButton : {})
                            }}
                        >
                            {speed}x
                        </button>
                    ))}
                </div>

                <div style={styles.infoText}>
                    Events registered: {events.length}
                </div>
            </div>

            {/* Recording Section */}
            {false && <div style={styles.recordingSection}>
                <h3 style={styles.subtitle}>Audio Rekordér</h3>
                {!isRecording ? (
                    <button onClick={startRecording} style={styles.recordButton}>🔴 Spustiť nahrávanie</button>
                ) : (
                    <button onClick={stopRecording} style={styles.stopButton}>⏹ Zastaviť nahrávanie</button>
                )}

                {audioURL && (
                    <div style={styles.recordingResult}>
                        <h4 style={styles.subtitle}>Nahrávka:</h4>
                        <audio src={audioURL} controls style={styles.recordedAudio}/>
                        <br/>
                        <a href={audioURL} download="nahravka.mp3" style={styles.downloadLink}>Stiahnuť súbor</a>
                    </div>
                )}
            </div>
            }

            {/* Additional Controls */}
            <div style={styles.additionalControls}>
                <button onClick={handleUserClick} style={styles.utilButton}>⏱ Zaznamenaj čas</button>
                <button onClick={() => playNoteTone("C7")} style={styles.utilButton}>🎵 Zahraj C7</button>
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '20px',
        color: '#383',
    },
    controlsContainer: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        color: 'white',
        marginBottom: '20px',
    },
    title: {
        margin: '0 0 20px 0',
        fontSize: '24px',
        fontWeight: '600',
        textAlign: 'center' as const,
    },
    subtitle: {
        margin: '0 0 12px 0',
        fontSize: '18px',
        fontWeight: '500',
    },
    progressContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px',
    },
    progressBar: {
        flex: 1,
        height: '8px',
        borderRadius: '4px',
        outline: 'none',
        cursor: 'pointer',
        background: 'rgba(255, 255, 255, 0.3)',
    },
    timeDisplay: {
        fontSize: '14px',
        fontWeight: '500',
        minWidth: '45px',
        textAlign: 'center' as const,
    },
    mainControls: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px',
    },
    controlButton: {
        background: 'rgba(255, 255, 255, 0.2)',
        border: 'none',
        borderRadius: '8px',
        width: '44px',
        height: '44px',
        fontSize: '20px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        color: 'white',
    },
    playButton: {
        background: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '56px',
        height: '56px',
        fontSize: '24px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        color: '#667eea',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
    activeButton: {
        background: 'rgba(255, 255, 255, 0.4)',
    },
    volumeContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
    },
    speedContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap' as const,
        marginBottom: '16px',
    },
    label: {
        fontSize: '14px',
        fontWeight: '500',
        minWidth: '80px',
    },
    slider: {
        flex: 1,
        height: '6px',
        borderRadius: '3px',
        outline: 'none',
        cursor: 'pointer',
        background: 'rgba(255, 255, 255, 0.3)',
    },
    valueDisplay: {
        fontSize: '14px',
        fontWeight: '500',
        minWidth: '45px',
        textAlign: 'right' as const,
    },
    speedButton: {
        background: 'rgba(255, 255, 255, 0.2)',
        border: 'none',
        borderRadius: '6px',
        padding: '6px 12px',
        fontSize: '13px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        color: 'white',
        fontWeight: '500',
    },
    activeSpeedButton: {
        background: 'white',
        color: '#667eea',
    },
    infoText: {
        fontSize: '13px',
        opacity: 0.9,
        textAlign: 'center' as const,
    },
    recordingSection: {
        background: '#f7fafc',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        border: '1px solid #e2e8f0',
    },
    recordButton: {
        background: '#f56565',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 20px',
        fontSize: '15px',
        cursor: 'pointer',
        fontWeight: '500',
        transition: 'all 0.2s',
    },
    stopButton: {
        background: '#4a5568',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 20px',
        fontSize: '15px',
        cursor: 'pointer',
        fontWeight: '500',
        transition: 'all 0.2s',
    },
    recordingResult: {
        marginTop: '20px',
        padding: '16px',
        background: 'white',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
    },
    recordedAudio: {
        width: '100%',
        marginTop: '12px',
    },
    downloadLink: {
        display: 'inline-block',
        marginTop: '12px',
        color: '#667eea',
        textDecoration: 'none',
        fontWeight: '500',
        padding: '8px 16px',
        background: '#edf2f7',
        borderRadius: '6px',
        transition: 'all 0.2s',
    },
    additionalControls: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap' as const,
    },
    utilButton: {
        background: '#48bb78',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 20px',
        fontSize: '14px',
        cursor: 'pointer',
        fontWeight: '500',
        transition: 'all 0.2s',
    },
};

export default TimedAudioPlayer;