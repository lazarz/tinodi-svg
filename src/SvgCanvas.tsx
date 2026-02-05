import React, { useState, useRef } from 'react';

const SvgCanvas = () => {
    const [paths, setPaths] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const svgRef = useRef(null);

    // 1. Define your internal coordinate system (ViewBox)
    const VB_WIDTH = 1500;
    const VB_HEIGHT = 800;

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
        const newPath = { d: `M ${x} ${y}`, id: Date.now() };
        setPaths([...paths, newPath]);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const { x, y } = getRelativeCoords(e);
        setPaths((prev) => {
            const last = prev[prev.length - 1];
            const updated = { ...last, d: `${last.d} L ${x} ${y}` };
            return [...prev.slice(0, -1), updated];
        });
    };

    return (
        <div style={{ width: '100%', height: '90vh', background: '#eee', padding: '20px' }}>
            <svg
                ref={svgRef}
                // VIEWPORT: How big it looks on screen (can be % or px)
                style={{ width: '100%', height: '100%', border: '1px solid #000', background: '#fff' }}
                // VIEWBOX: The internal logical dimensions [min-x min-y width height]
                viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
                preserveAspectRatio="xMidYMid meet"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={() => setIsDrawing(false)}
                onMouseLeave={() => setIsDrawing(false)}
            >
                <line x1="0" y1="160" x2="1500" y2="160" stroke="#999" strokeWidth="2" />
                <line x1="0" y1="170" x2="1500" y2="170" stroke="#999" strokeWidth="2" />
                <line x1="0" y1="180" x2="1500" y2="180" stroke="#999" strokeWidth="2" />
                <line x1="0" y1="190" x2="1500" y2="190" stroke="#999" strokeWidth="2" />
                <line x1="0" y1="200" x2="1500" y2="200" stroke="#999" strokeWidth="2" />
            </svg>
        </div>
    );
};

export default SvgCanvas;