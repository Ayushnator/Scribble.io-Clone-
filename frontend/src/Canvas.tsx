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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineCap = 'round';
    context.lineJoin = 'round';

    const handleDrawMove = (data: DrawData) => {
      drawLine(data);
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
    const data: DrawData = { x, y, isDrawing: false, color: currentColor, lineWidth };
    drawLine(data);
    socket.emit('draw_move', roomId, data);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawingAllowed) return;
    const { x, y } = getCoordinates(e);
    const data: DrawData = { x, y, isDrawing: true, color: currentColor, lineWidth };
    drawLine(data);
    socket.emit('draw_move', roomId, data);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const drawLine = (data: DrawData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.strokeStyle = data.color;
    context.lineWidth = data.lineWidth;

    if (!data.isDrawing) {
      context.beginPath();
      context.moveTo(data.x, data.y);
    } else {
      context.lineTo(data.x, data.y);
      context.stroke();
    }
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
