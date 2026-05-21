import { useRef, useEffect, useState } from 'react';
import socket from './socket';
import { DrawData } from './types';
import './App.css';

interface CanvasProps {
  roomId: string;
  isDrawingAllowed: boolean;
}

function Canvas({ roomId, isDrawingAllowed }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(5);
  const [isEraser, setIsEraser] = useState(false);

  // Track drawing state for local drawing
  const lastLocalPointRef = useRef<{ x: number; y: number } | null>(null);
  const isLocalDrawingRef = useRef(false);
  
  // Track last point for incoming draw events (for syncing)
  const lastRemotePointRef = useRef<{ x: number; y: number } | null>(null);

  const currentColor = isEraser ? '#ffffff' : color;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineCap = 'round';
    context.lineJoin = 'round';

    const handleDrawMove = (data: DrawData) => {
      drawRemoteLine(data);
    };

    const handleClearCanvas = () => {
      clearCanvas();
    };

    socket.on('draw_move', handleDrawMove);
    socket.on('clear_canvas', handleClearCanvas);

    return () => {
      socket.off('draw_move', handleDrawMove);
      socket.off('clear_canvas', handleClearCanvas);
    };
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingAllowed) return;
    setIsDrawing(true);
    isLocalDrawingRef.current = true;
    const { x, y } = getCoordinates(e);
    lastLocalPointRef.current = { x, y };

    // Start a new stroke
    const data: DrawData = { x, y, isDrawing: true, color: currentColor, lineWidth };
    drawLocalLine(data);
    socket.emit('draw_move', roomId, data);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawingAllowed) return;
    const { x, y } = getCoordinates(e);

    if (lastLocalPointRef.current) {
      const data: DrawData = {
        x,
        y,
        isDrawing: true,
        color: currentColor,
        lineWidth
      };
      drawLocalLine(data);
      socket.emit('draw_move', roomId, data);
    }

    lastLocalPointRef.current = { x, y };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    isLocalDrawingRef.current = false;
    lastLocalPointRef.current = null;
  };

  const drawLocalLine = (data: DrawData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.strokeStyle = data.color;
    context.lineWidth = data.lineWidth;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    if (lastLocalPointRef.current === null) {
      context.beginPath();
      context.moveTo(data.x, data.y);
    } else {
      context.lineTo(data.x, data.y);
      context.stroke();
      context.beginPath();
      context.moveTo(data.x, data.y);
    }
  };

  const drawRemoteLine = (data: DrawData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.strokeStyle = data.color;
    context.lineWidth = data.lineWidth;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    if (lastRemotePointRef.current === null) {
      context.beginPath();
      context.moveTo(data.x, data.y);
    } else {
      context.lineTo(data.x, data.y);
      context.stroke();
      context.beginPath();
      context.moveTo(data.x, data.y);
    }
    lastRemotePointRef.current = { x: data.x, y: data.y };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleClear = () => {
    if (!isDrawingAllowed) return;
    clearCanvas();
    socket.emit('clear_canvas', roomId);
  };

  const handleUndo = () => {
    if (!isDrawingAllowed) return;
    socket.emit('undo_draw', roomId);
  };

  return (
    <div className="canvas-container">
      <div className="tools">
        <button onClick={handleClear} disabled={!isDrawingAllowed}>Clear</button>
        <button onClick={handleUndo} disabled={!isDrawingAllowed}>↩️ Undo</button>
        <button 
          onClick={() => setIsEraser(!isEraser)} 
          className={isEraser ? 'active' : ''}
          disabled={!isDrawingAllowed}
        >
          {isEraser ? '✏️ Pen' : '🧽 Eraser'}
        </button>
        {!isEraser && (
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            disabled={!isDrawingAllowed}
          />
        )}
        <input
          type="range"
          min="1"
          max="50"
          value={lineWidth}
          onChange={(e) => setLineWidth(parseInt(e.target.value))}
          disabled={!isDrawingAllowed}
        />
        <span>{lineWidth}px</span>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        style={{ cursor: isDrawingAllowed ? 'crosshair' : 'not-allowed' }}
      />
    </div>
  );
}

export default Canvas;
