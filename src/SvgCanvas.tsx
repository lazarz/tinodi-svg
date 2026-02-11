import React, { useRef, useState } from 'react';

interface Note {
    id: number;
    x: number;
    y: number;
    type: 'quarter' | 'half' | 'whole';
}

const SvgCanvas = () => {
    const [paths, setPaths] = useState([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [mode, setMode] = useState<'draw' | 'note'>('draw');
    const svgRef = useRef(null);
    const svgPaddingTop = 50;
    // 1. Define your internal coordinate system (ViewBox)
    const VB_WIDTH = 1000;
    const VB_HEIGHT = 200;

    const getRelativeCoords = (e) => {
        const svg = svgRef.current;
        const point = svg.createSVGPoint();
        point.x = e.clientX;
        point.y = e.clientY;

        // This magic line converts Screen Pixels to ViewBox Coordinates
        const { x, y } = point.matrixTransform(svg.getScreenCTM().inverse());
        return { x, y };
    };

    const startDrawing = (e) => {
        const { x, y } = getRelativeCoords(e);

        if (mode === 'note') {
            // Snap to nearest staff line
            const staffLines = [svgPaddingTop+10, svgPaddingTop+20, svgPaddingTop+30, svgPaddingTop+40, svgPaddingTop+50];
            const snappedY = staffLines.reduce((prev, curr) =>
                Math.abs(curr - y) < Math.abs(prev - y) ? curr : prev
            );

            const newNote: Note = {
                id: Date.now(),
                x,
                y: snappedY,
                type: 'quarter'
            };
            setNotes([...notes, newNote]);
        } else {
            const newPath = { d: `M ${x} ${y}`, id: Date.now() };
            setPaths([...paths, newPath]);
            setIsDrawing(true);
        }
    };

    const draw = (e) => {
        if (!isDrawing || mode === 'note') return;
        const { x, y } = getRelativeCoords(e);
        setPaths((prev) => {
            const last = prev[prev.length - 1];
            const updated = { ...last, d: `${last.d} L ${x} ${y}` };
            return [...prev.slice(0, -1), updated];
        });
    };

    const renderNote = (note: Note) => {
        console.log(note)
        const noteHeadRadius = 6;
        const stemHeight = 40;
        const stemWidth = 2;

        return (
            <g key={note.id}>
                {/* Note head (ellipse for quarter/half notes, circle for whole notes) */}
                <ellipse
                    cx={note.x}
                    cy={note.y}
                    rx={noteHeadRadius}
                    ry={noteHeadRadius - 1}
                    fill={note.type === 'whole' || note.type === 'half' ? 'none' : 'black'}
                    stroke="black"
                    strokeWidth="1.5"
                />

                {/* Stem (not for whole notes) */}
                {note.type !== 'whole' && (
                    <line
                        x1={note.x + noteHeadRadius - 1}
                        y1={note.y}
                        x2={note.x + noteHeadRadius - 1}
                        y2={note.y - stemHeight}
                        stroke="black"
                        strokeWidth={stemWidth}
                    />
                )}

                {/* Flag for quarter note */}
                {note.type === 'quarter' && (
                    <path
                        d={`M ${note.x + noteHeadRadius - 1} ${note.y - stemHeight} 
                            Q ${note.x + noteHeadRadius + 8} ${note.y - stemHeight + 5} 
                            ${note.x + noteHeadRadius + 5} ${note.y - stemHeight + 12}`}
                        fill="black"
                        stroke="black"
                        strokeWidth="1"
                    />
                )}
            </g>
        );
    };
    return (
        <div>
            <div style={{ marginBottom: '10px' }}>
                <button
                    onClick={() => setMode('draw')}
                    style={{
                        padding: '8px 16px',
                        marginRight: '8px',
                        background: mode === 'draw' ? '#4CAF50' : '#ddd',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '4px'
                    }}
                >
                    Draw Mode
                </button>
                <button
                    onClick={() => setMode('note')}
                    style={{
                        padding: '8px 16px',
                        background: mode === 'note' ? '#4CAF50' : '#ddd',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '4px'
                    }}
                >
                    Note Mode
                </button>
                <button
                    onClick={() => setNotes([])}
                    style={{
                        padding: '8px 16px',
                        marginLeft: '8px',
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '4px'
                    }}
                >
                    Clear Notes
                </button>
            </div>
            <svg ref={svgRef} enableBackground={'new 0 0 1000 200'}
                // VIEWPORT: How big it looks on screen (can be % or px)
                 viewTarget={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
                // VIEWBOX: The internal logical dimensions [min-x min-y width height]
                 viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
                 preserveAspectRatio="xMidYMid meet"
                 onMouseDown={startDrawing}
                 onMouseMove={draw}
                 onMouseUp={() => setIsDrawing(false)}
                 onMouseLeave={() => setIsDrawing(false)}
            >
                {/* Staff lines */}
                <line x1="0" y1={svgPaddingTop} x2="1000" y2={svgPaddingTop} stroke="#999" strokeWidth="2"/>
                <line x1="0" y1={svgPaddingTop + 10} x2="1000" y2={svgPaddingTop + 10} stroke="#999" strokeWidth="2"/>
                <line x1="0" y1={svgPaddingTop + 20} x2="1000" y2={svgPaddingTop + 20} stroke="#999" strokeWidth="2"/>
                <line x1="0" y1={svgPaddingTop + 30} x2="1000" y2={svgPaddingTop + 30} stroke="#999" strokeWidth="2"/>
                <line x1="0" y1={svgPaddingTop + 40} x2="1000" y2={svgPaddingTop + 40} stroke="#999" strokeWidth="2"/>

                {/* Render notes */}
                {notes.map(note => renderNote(note))}
            </svg>
        </div>
    );
};

export default SvgCanvas;