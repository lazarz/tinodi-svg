import React, { useState, useRef } from 'react';
import SvgCanvas from "./SvgCanvas.jsx";
import ZoomPanSvg from "./ZoomPanSvg.jsx";

function App() {
    const [elements, setElements] = useState([]); // Stores all shapes
    const [currentPath, setCurrentPath] = useState(null); // The shape being drawn right now
    const svgRef = useRef(null);

    // Helper to get coordinates relative to the SVG element
    const getCoords = (e) => {
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

    return (<ZoomPanSvg></ZoomPanSvg>
    )
}

export default App;