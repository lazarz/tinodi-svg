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
        <div className="p-4 border rounded-lg shadow-sm bg-white">
            <audio
                ref={audioRef}
                src={src}
                controls
                onTimeUpdate={handleTimeUpdate}
                onPlay={handlePlay}
                className="w-full"
                style={{ height: '100px', width: '1200px', border: '1px solid #ccc' }}
            />
            <div className="mt-2 text-sm text-gray-500">
                Events registered: {events.length}
            </div>
            <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
                <h3>Audio Rekordér</h3>
                {!isRecording ? (
                    <button onClick={startRecording}>🔴 Spustiť nahrávanie</button>
                ) : (
                    <button onClick={stopRecording}>⏹ Zastaviť nahrávanie</button>
                )}

                {audioURL && (
                    <div style={{ marginTop: '20px' }}>
                        <h4>Nahrávka:</h4>
                        <audio src={audioURL} controls/>
                        <br/>
                        <a href={audioURL} download="nahravka.mp3">Stiahnuť súbor</a>
                    </div>
                )}
            </div>
            );
            <button onClick={handleUserClick}> Zaznamenaj cas</button>
            <button onClick={() => playNoteTone("C7")}> Zahraj 440</button>
        </div>
    );
};

export default TimedAudioPlayer;