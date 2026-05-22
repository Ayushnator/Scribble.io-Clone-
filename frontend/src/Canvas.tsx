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

  const currentColor = isEraser ? '#ffffff' : color;

  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineCap = 'round';
    context.lineJoin = 'round';

    const handleDrawMove = (data: DrawData) => {
      drawRemoteStroke(data);
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
    const { x, y } = getCoordinates(e);
    lastPointRef.current = { x, y };

    const data: DrawData = { x, y, isDrawing: true, color: currentColor, lineWidth };
    drawLocalPoint(data);
    socket.emit('draw_move', roomId, data);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawingAllowed || !lastPointRef.current) return;
    
    const { x, y } = getCoordinates(e);
    const data: DrawData = { x, y, isDrawing: true, color: currentColor, lineWidth };
    
    drawLocalLine(lastPointRef.current, { x, y }, currentColor, lineWidth);
    socket.emit('draw_move', roomId, data);
    
    lastPointRef.current = { x, y };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  const drawLocalPoint = (data: DrawData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.arc(data.x, data.y, data.lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = data.color;
    ctx.fill();
  };

  const drawLocalLine = (
    from: { x: number; y: number },
    to: { x: number; y: number },
    color: string,
    lineWidth: number
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const drawRemoteStroke = (data: DrawData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!lastPointRef.current) {
      drawLocalPoint(data);
      lastPointRef.current = { x: data.x, y: data.y };
    } else {
      drawLocalLine(lastPointRef.current, { x: data.x, y: data.y }, data.color, data.lineWidth);
      lastPointRef.current = { x: data.x, y: data.y };
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lastPointRef.current = null;
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
