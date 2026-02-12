import { useRef, useState } from 'react';
// import SvgCanvas from "./SvgCanvas.jsx";
import mySong from './assets/Potta.m4a'; // Import súboru
import TimedAudioPlayer, { AudioEvent } from "./TimedAudioPlayer.tsx";
import SvgCanvas from "./SvgCanvas.tsx";

function App() {
    const [elements, setElements] = useState([]); // Stores all shapes
    const [currentPath, setCurrentPath] = useState(null); // The shape being drawn right now
    const svgRef = useRef(null);

    // Helper to get coordinates relative to the SVG element
    const getCoords = (e: { clientX: number; clientY: number; }) => {
        const svg = svgRef.current;
        const CTM = svg.getScreenCTM();
        return {
            x: (e.clientX - CTM.e) / CTM.a,
            y: (e.clientY - CTM.f) / CTM.d
        };
    };

    const handleMouseDown = (e) => {
        const { x, y } = getCoords(e);
        // Start a new path (M = Move To)
        setCurrentPath(`M ${x} ${y}`);
    };

    const handleMouseMove = (e) => {
        if (!currentPath) return;
        const { x, y } = getCoords(e);
        // Add lines to the path (L = Line To)
        setCurrentPath((prev) => `${prev} L ${x} ${y}`);
    };

    const handleMouseUp = () => {
        if (currentPath) {
            setElements([...elements, currentPath]);
            setCurrentPath(null);
        }
    };
    const [activeNote, setActiveNote] = useState(null);
    const myEvents: AudioEvent[] = [
        {
            id: 'nota1',
            time: 5,
            action: () => {
                console.log('5')
                setActiveNote('Prvá nota!')
            }
        },
        {
            id: 'nota2',
            time: 10,
            action: () => {
                console.log('10')
                setActiveNote('Druhá nota!')
            }
        },
        {
            id: 'nota3',
            time: 15,
            action: () => {
                console.log('15')
                setActiveNote('Druhá nota!')
            }
        },
    ];
    const [notes, setNotes] = useState<Note[]>([]);
    return (
        <div>
            <SvgCanvas notes={notes} setNotes={setNotes}></SvgCanvas>
            <TimedAudioPlayer setNotes={setNotes} notes={notes} src={mySong} events={myEvents}></TimedAudioPlayer>
        </div>
    )
}

export interface Note {
    id: number;
    x: number;
    y: number;
    type: 'quarter' | 'half' | 'whole';
    tone: string;
    time: number;
}

export default App;