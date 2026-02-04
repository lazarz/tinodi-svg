import React, { useState, useRef, useEffect } from 'react';

const ZoomPanSvg = () => {
    const svgRef = useRef(null);
    const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 1000, h: 800 });
    const [isPanning, setIsPanning] = useState(false);
    const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });

    // 1. Zoom Logic (Mouse Wheel)
    const handleWheel = (e) => {
        e.preventDefault();
        const scaleFactor = e.deltaY > 0 ? 1.1 : 0.9; // Zoom out or in

        setViewBox((prev) => ({
            ...prev,
            w: prev.w * scaleFactor,
            h: prev.h * scaleFactor,
            // Adjust x and y slightly to zoom toward the cursor (optional complexity)
            x: prev.x - (prev.w * scaleFactor - prev.w) / 2,
            y: prev.y - (prev.h * scaleFactor - prev.h) / 2,
        }));
    };

    // 2. Pan Logic (Mouse Drag)
    const handleMouseDown = (e) => {
        if (e.button === 1 || e.shiftKey) { // Middle click or Shift+Click to pan
            setIsPanning(true);
            setStartPoint({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseMove = (e) => {
        if (!isPanning) return;

        const dx = (e.clientX - startPoint.x) * (viewBox.w / svgRef.current.clientWidth);
        const dy = (e.clientY - startPoint.y) * (viewBox.h / svgRef.current.clientHeight);

        setViewBox((prev) => ({
            ...prev,
            x: prev.x - dx,
            y: prev.y - dy,
        }));

        setStartPoint({ x: e.clientX, y: e.clientY });
    };

    const stopPanning = () => setIsPanning(false);

    return (
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#282c34' }}>
            <div style={{ position: 'absolute', color: 'white', padding: '10px', pointerEvents: 'none' }}>
                Use <b>Wheel</b> to Zoom | <b>Shift + Drag</b> to Pan
            </div>

            <svg
                ref={svgRef}
                viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={stopPanning}
                onMouseLeave={stopPanning}
                style={{ width: '100%', height: '100%', cursor: isPanning ? 'grabbing' : 'default' }}
            >
                {/* A simple grid to visualize the movement */}
                <defs>
                    <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                        <path d="M 100 0 L 0 0 0 100" fill="none" stroke="gray" strokeWidth="0.5" />
                    </pattern>
                </defs>
                <rect x="-5000" y="-5000" width="10000" height="10000" fill="url(#grid)" />

                {/* Sample SVG Object */}
                <circle cx="500" cy="400" r="50" fill="cyan" />
                <text x="470" y="470" fill="white" fontSize="20">Center (500, 400)</text>
            </svg>
        </div>
    );
};

export default ZoomPanSvg;