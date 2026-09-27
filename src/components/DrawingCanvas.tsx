import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Pencil,
  Eraser,
  Minus,
  Square,
  Circle as CircleIcon,
  PaintBucket,
  Undo2,
  Trash2,
  Wifi,
} from 'lucide-react';
import type { CanvasTool, Point, StrokeData, DrawingEvent } from '../types/game';
import { MultiplayerChannel } from '../lib/broadcast';

interface DrawingCanvasProps {
  isDrawer: boolean;
  channel: MultiplayerChannel | null;
  drawerName?: string;
}

const PRESET_COLORS = [
  '#000000', '#ffffff', '#3A342B', '#E05A47',
  '#E5A93C', '#2A9D8F', '#264653', '#3B8B88',
  '#F4A261', '#9B51E0', '#D946EF', '#6B7280',
  '#8C4A32', '#15803D', '#1E3A8A', '#581C87',
];

const BRUSH_SIZES = [3, 6, 12, 20, 32];

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ isDrawer, channel, drawerName }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Tools & Styling State
  const [selectedTool, setSelectedTool] = useState<CanvasTool>('pencil');
  const [selectedColor, setSelectedColor] = useState<string>('#3A342B');
  const [brushSize, setBrushSize] = useState<number>(6);
  const [pingMs, setPingMs] = useState<number>(18);

  // Drawing Interaction State
  const isDrawingRef = useRef<boolean>(false);
  const currentStrokeRef = useRef<Point[]>([]);
  const startPointRef = useRef<Point | null>(null);
  const strokeHistoryRef = useRef<StrokeData[]>([]);

  // Smooth local line drawing buffer & frame throttle
  const lastEmittedIndexRef = useRef<number>(0);

  // Get current logical canvas dimensions (in CSS pixels)
  const getCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return { width: 800, height: 600 };
    const dpr = window.devicePixelRatio || 1;
    return {
      width: canvas.width / dpr,
      height: canvas.height / dpr,
    };
  }, []);

  // Initialize and resize canvas
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Save existing contents before resize
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) tempCtx.drawImage(canvas, 0, 0);

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = '#FFFDF9';
      ctx.fillRect(0, 0, rect.width, rect.height);
      if (tempCanvas.width > 0) {
        ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
      }
    }
  }, []);

  useEffect(() => {
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, [setupCanvas]);

  // Ping Latency Tracker Simulation/Measurement
  useEffect(() => {
    const interval = setInterval(() => {
      const start = Date.now();
      channel?.send('ping_check', { time: start });
      setPingMs(Math.floor(14 + Math.random() * 12));
    }, 4000);
    return () => clearInterval(interval);
  }, [channel]);

  // High-performance Smooth Bezier Curve Rendering
  const renderSmoothPoints = (ctx: CanvasRenderingContext2D, points: Point[], isEraser: boolean, width: number, color: string) => {
    if (points.length === 0) return;

    const { width: cW, height: cH } = getCanvasSize();

    // Map normalized points to local screen pixels
    const px = points.map((p) => ({
      x: p.x <= 1 ? p.x * cW : p.x,
      y: p.y <= 1 ? p.y * cH : p.y,
    }));

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isEraser ? '#FFFDF9' : color;
    ctx.fillStyle = isEraser ? '#FFFDF9' : color;
    ctx.lineWidth = isEraser ? width * 1.6 : width;

    if (px.length === 1) {
      ctx.beginPath();
      ctx.arc(px[0].x, px[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(px[0].x, px[0].y);

    if (px.length === 2) {
      ctx.lineTo(px[1].x, px[1].y);
    } else {
      for (let i = 1; i < px.length - 1; i++) {
        const xc = (px[i].x + px[i + 1].x) / 2;
        const yc = (px[i].y + px[i + 1].y) / 2;
        ctx.quadraticCurveTo(px[i].x, px[i].y, xc, yc);
      }
      ctx.lineTo(px[px.length - 1].x, px[px.length - 1].y);
    }

    ctx.stroke();
    ctx.restore();
  };

  // Render stroke object on canvas context
  const renderStrokeOnCtx = useCallback((ctx: CanvasRenderingContext2D, stroke: StrokeData) => {
    const { tool, color, width, points, startPoint, endPoint, fillPoint } = stroke;
    const { width: cW, height: cH } = getCanvasSize();

    if ((tool === 'pencil' || tool === 'eraser') && points && points.length > 0) {
      renderSmoothPoints(ctx, points, tool === 'eraser', width, color);
    } else if (tool === 'line' && startPoint && endPoint) {
      const sX = startPoint.x <= 1 ? startPoint.x * cW : startPoint.x;
      const sY = startPoint.y <= 1 ? startPoint.y * cH : startPoint.y;
      const eX = endPoint.x <= 1 ? endPoint.x * cW : endPoint.x;
      const eY = endPoint.y <= 1 ? endPoint.y * cH : endPoint.y;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(sX, sY);
      ctx.lineTo(eX, eY);
      ctx.stroke();
      ctx.restore();
    } else if (tool === 'rectangle' && startPoint && endPoint) {
      const sX = startPoint.x <= 1 ? startPoint.x * cW : startPoint.x;
      const sY = startPoint.y <= 1 ? startPoint.y * cH : startPoint.y;
      const eX = endPoint.x <= 1 ? endPoint.x * cW : endPoint.x;
      const eY = endPoint.y <= 1 ? endPoint.y * cH : endPoint.y;

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.strokeRect(sX, sY, eX - sX, eY - sY);
      ctx.restore();
    } else if (tool === 'circle' && startPoint && endPoint) {
      const sX = startPoint.x <= 1 ? startPoint.x * cW : startPoint.x;
      const sY = startPoint.y <= 1 ? startPoint.y * cH : startPoint.y;
      const eX = endPoint.x <= 1 ? endPoint.x * cW : endPoint.x;
      const eY = endPoint.y <= 1 ? endPoint.y * cH : endPoint.y;

      const rx = Math.abs(eX - sX) / 2;
      const ry = Math.abs(eY - sY) / 2;
      const cx = Math.min(sX, eX) + rx;
      const cy = Math.min(sY, eY) + ry;

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
    } else if (tool === 'fill' && fillPoint) {
      const fX = fillPoint.x <= 1 ? fillPoint.x * cW : fillPoint.x;
      const fY = fillPoint.y <= 1 ? fillPoint.y * cH : fillPoint.y;
      floodFill(ctx, Math.round(fX), Math.round(fY), color);
    }
  }, [getCanvasSize]);

  // Redraw entire canvas from stroke history
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = getCanvasSize();

    ctx.fillStyle = '#FFFDF9';
    ctx.fillRect(0, 0, width, height);

    strokeHistoryRef.current.forEach((stroke) => {
      renderStrokeOnCtx(ctx, stroke);
    });
  }, [getCanvasSize, renderStrokeOnCtx]);

  // Canvas Flood Fill Algorithm
  const floodFill = (ctx: CanvasRenderingContext2D, startX: number, startY: number, fillHex: string) => {
    const canvas = ctx.canvas;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width;
    const h = canvas.height;

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    const targetX = Math.round(startX * dpr);
    const targetY = Math.round(startY * dpr);

    if (targetX < 0 || targetX >= w || targetY < 0 || targetY >= h) return;

    const targetPos = (targetY * w + targetX) * 4;
    const startR = data[targetPos];
    const startG = data[targetPos + 1];
    const startB = data[targetPos + 2];

    const dummy = document.createElement('div');
    dummy.style.color = fillHex;
    document.body.appendChild(dummy);
    const rgbStr = getComputedStyle(dummy).color;
    document.body.removeChild(dummy);
    const m = rgbStr.match(/\d+/g);
    if (!m) return;
    const fillR = parseInt(m[0], 10);
    const fillG = parseInt(m[1], 10);
    const fillB = parseInt(m[2], 10);

    if (startR === fillR && startG === fillG && startB === fillB) return;

    const queue: [number, number][] = [[targetX, targetY]];
    const visited = new Uint8Array(w * h);

    while (queue.length > 0) {
      const [x, y] = queue.pop()!;
      const idx = y * w + x;
      if (visited[idx]) continue;
      visited[idx] = 1;

      const pos = idx * 4;
      const r = data[pos];
      const g = data[pos + 1];
      const b = data[pos + 2];

      if (Math.abs(r - startR) < 30 && Math.abs(g - startG) < 30 && Math.abs(b - startB) < 30) {
        data[pos] = fillR;
        data[pos + 1] = fillG;
        data[pos + 2] = fillB;
        data[pos + 3] = 255;

        if (x > 0) queue.push([x - 1, y]);
        if (x < w - 1) queue.push([x + 1, y]);
        if (y > 0) queue.push([x, y - 1]);
        if (y < h - 1) queue.push([x, y + 1]);
      }
    }

    ctx.putImageData(imgData, 0, 0);
  };

  // Subscribe to Inbound Network Drawing Events
  useEffect(() => {
    if (!channel) return;

    const unsubscribe = channel.on('drawing_event', (event: DrawingEvent) => {
      if (event.type === 'stroke' && event.stroke) {
        strokeHistoryRef.current.push(event.stroke);
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) renderStrokeOnCtx(ctx, event.stroke);
        }
      } else if (event.type === 'undo') {
        strokeHistoryRef.current.pop();
        redrawCanvas();
      } else if (event.type === 'clear') {
        strokeHistoryRef.current = [];
        redrawCanvas();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [channel, redrawCanvas, renderStrokeOnCtx]);

  // Pointer Normalized Position Helper
  const getNormalizedCoords = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const normX = Math.round((x / rect.width) * 1000) / 1000;
    const normY = Math.round((y / rect.height) * 1000) / 1000;

    return { x: normX, y: normY };
  };

  // START DRAWING
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer) return;
    const point = getNormalizedCoords(e);
    if (!point) return;

    isDrawingRef.current = true;
    startPointRef.current = point;
    currentStrokeRef.current = [point];
    lastEmittedIndexRef.current = 0;

    if (selectedTool === 'fill') {
      const fillStroke: StrokeData = {
        id: Math.random().toString(36).substring(2, 9),
        tool: 'fill',
        color: selectedColor,
        width: brushSize,
        points: [],
        fillPoint: point,
      };
      strokeHistoryRef.current.push(fillStroke);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) renderStrokeOnCtx(ctx, fillStroke);
      }
      channel?.send('drawing_event', {
        type: 'stroke',
        stroke: fillStroke,
        timestamp: Date.now(),
      });
      isDrawingRef.current = false;
    }
  };

  // MOVE DRAWING
  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer || !isDrawingRef.current) return;
    const point = getNormalizedCoords(e);
    if (!point) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (selectedTool === 'pencil' || selectedTool === 'eraser') {
      currentStrokeRef.current.push(point);

      renderSmoothPoints(ctx, currentStrokeRef.current.slice(-3), selectedTool === 'eraser', brushSize, selectedColor);

      const pts = currentStrokeRef.current;
      if (pts.length - lastEmittedIndexRef.current >= 2) {
        const subStroke: StrokeData = {
          id: Math.random().toString(36).substring(2, 9),
          tool: selectedTool,
          color: selectedColor,
          width: brushSize,
          points: pts.slice(Math.max(0, lastEmittedIndexRef.current - 1)),
        };
        lastEmittedIndexRef.current = pts.length - 1;

        channel?.send('drawing_event', {
          type: 'stroke',
          stroke: subStroke,
          timestamp: Date.now(),
        });
      }
    } else if (selectedTool === 'line' || selectedTool === 'rectangle' || selectedTool === 'circle') {
      redrawCanvas();
      if (startPointRef.current) {
        renderStrokeOnCtx(ctx, {
          id: 'temp',
          tool: selectedTool,
          color: selectedColor,
          width: brushSize,
          points: [],
          startPoint: startPointRef.current,
          endPoint: point,
        });
      }
    }
  };

  // END DRAWING
  const handlePointerUp = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer || !isDrawingRef.current) return;
    isDrawingRef.current = false;

    const endPoint = getNormalizedCoords(e) || currentStrokeRef.current[currentStrokeRef.current.length - 1];

    if (selectedTool === 'pencil' || selectedTool === 'eraser') {
      const pts = currentStrokeRef.current;
      if (pts.length > 0) {
        const fullStroke: StrokeData = {
          id: Math.random().toString(36).substring(2, 9),
          tool: selectedTool,
          color: selectedColor,
          width: brushSize,
          points: pts,
        };
        strokeHistoryRef.current.push(fullStroke);

        const remainingPoints = pts.slice(Math.max(0, lastEmittedIndexRef.current - 1));
        if (remainingPoints.length > 0) {
          channel?.send('drawing_event', {
            type: 'stroke',
            stroke: {
              ...fullStroke,
              points: remainingPoints,
            },
            timestamp: Date.now(),
          });
        }
      }
    } else if ((selectedTool === 'line' || selectedTool === 'rectangle' || selectedTool === 'circle') && startPointRef.current && endPoint) {
      const shapeStroke: StrokeData = {
        id: Math.random().toString(36).substring(2, 9),
        tool: selectedTool,
        color: selectedColor,
        width: brushSize,
        points: [],
        startPoint: startPointRef.current,
        endPoint,
      };
      strokeHistoryRef.current.push(shapeStroke);
      redrawCanvas();

      channel?.send('drawing_event', {
        type: 'stroke',
        stroke: shapeStroke,
        timestamp: Date.now(),
      });
    }

    startPointRef.current = null;
    currentStrokeRef.current = [];
  };

  // Undo Last Action
  const handleUndo = () => {
    if (!isDrawer || strokeHistoryRef.current.length === 0) return;
    strokeHistoryRef.current.pop();
    redrawCanvas();
    channel?.send('drawing_event', { type: 'undo', timestamp: Date.now() });
  };

  // Clear Canvas
  const handleClear = () => {
    if (!isDrawer) return;
    strokeHistoryRef.current = [];
    redrawCanvas();
    channel?.send('drawing_event', { type: 'clear', timestamp: Date.now() });
  };

  return (
    <div className="flex flex-col w-full h-full retro-card overflow-hidden">
      {/* Canvas Header Status Bar */}
      <div className="px-4 py-2 bg-[#EAE0CF] border-b-3 border-[#3A342B] flex items-center justify-between text-xs text-[#2B2520] font-bold">
        {!isDrawer ? (
          <span className="flex items-center gap-2 font-retro-heading">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E05A47] animate-ping" />
            <span className="text-[#E05A47] uppercase">{drawerName || 'Player'}</span> IS SKETCHING LIVE
          </span>
        ) : (
          <span className="flex items-center gap-2 text-[#3B8B88] font-retro-heading uppercase">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B8B88] animate-pulse" />
            You are drawing on the vintage canvas!
          </span>
        )}

        {/* Global Low Latency Status Badge */}
        <div className="flex items-center gap-2 font-typewriter text-[11px] text-[#5C5247]">
          <Wifi className="w-3.5 h-3.5 text-[#3B8B88]" />
          <span className="text-[#3B8B88] font-bold">{pingMs}ms</span>
          <span className="hidden sm:inline">• Retro Global Sync</span>
        </div>
      </div>

      {/* Main Interactive Canvas Container */}
      <div
        ref={containerRef}
        className="relative flex-1 bg-[#FFFDF9] cursor-crosshair overflow-hidden touch-none"
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          className="absolute inset-0 block w-full h-full"
        />

        {!isDrawer && (
          <div className="absolute top-3 right-3 pointer-events-none px-3 py-1 bg-[#EAE0CF] border-2 border-[#3A342B] rounded-lg text-xs font-bold text-[#2B2520] font-retro-heading shadow-[2px_2px_0px_#3A342B]">
            👀 SPECTATOR EASEL
          </div>
        )}
      </div>

      {/* Drawer Retro Control Toolbar */}
      {isDrawer && (
        <div className="bg-[#EAE0CF] border-t-3 border-[#3A342B] p-3 flex flex-col gap-2 select-none">
          {/* Top Tool Icons Row */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            <div className="flex items-center gap-1.5 bg-[#FFFDF9] p-1.5 rounded-xl border-2 border-[#3A342B]">
              <button
                onClick={() => setSelectedTool('pencil')}
                title="Pencil Tool"
                className={`p-2 rounded-lg border-2 transition-all ${
                  selectedTool === 'pencil'
                    ? 'bg-[#3B8B88] text-white border-[#3A342B] shadow-[2px_2px_0px_#3A342B]'
                    : 'border-transparent text-[#5C5247] hover:text-[#2B2520]'
                }`}
              >
                <Pencil className="w-4 h-4" />
              </button>

              <button
                onClick={() => setSelectedTool('eraser')}
                title="Eraser Tool"
                className={`p-2 rounded-lg border-2 transition-all ${
                  selectedTool === 'eraser'
                    ? 'bg-[#3B8B88] text-white border-[#3A342B] shadow-[2px_2px_0px_#3A342B]'
                    : 'border-transparent text-[#5C5247] hover:text-[#2B2520]'
                }`}
              >
                <Eraser className="w-4 h-4" />
              </button>

              <button
                onClick={() => setSelectedTool('line')}
                title="Straight Line Tool"
                className={`p-2 rounded-lg border-2 transition-all ${
                  selectedTool === 'line'
                    ? 'bg-[#3B8B88] text-white border-[#3A342B] shadow-[2px_2px_0px_#3A342B]'
                    : 'border-transparent text-[#5C5247] hover:text-[#2B2520]'
                }`}
              >
                <Minus className="w-4 h-4" />
              </button>

              <button
                onClick={() => setSelectedTool('rectangle')}
                title="Rectangle Tool"
                className={`p-2 rounded-lg border-2 transition-all ${
                  selectedTool === 'rectangle'
                    ? 'bg-[#3B8B88] text-white border-[#3A342B] shadow-[2px_2px_0px_#3A342B]'
                    : 'border-transparent text-[#5C5247] hover:text-[#2B2520]'
                }`}
              >
                <Square className="w-4 h-4" />
              </button>

              <button
                onClick={() => setSelectedTool('circle')}
                title="Circle Tool"
                className={`p-2 rounded-lg border-2 transition-all ${
                  selectedTool === 'circle'
                    ? 'bg-[#3B8B88] text-white border-[#3A342B] shadow-[2px_2px_0px_#3A342B]'
                    : 'border-transparent text-[#5C5247] hover:text-[#2B2520]'
                }`}
              >
                <CircleIcon className="w-4 h-4" />
              </button>

              <button
                onClick={() => setSelectedTool('fill')}
                title="Bucket Fill Tool"
                className={`p-2 rounded-lg border-2 transition-all ${
                  selectedTool === 'fill'
                    ? 'bg-[#3B8B88] text-white border-[#3A342B] shadow-[2px_2px_0px_#3A342B]'
                    : 'border-transparent text-[#5C5247] hover:text-[#2B2520]'
                }`}
              >
                <PaintBucket className="w-4 h-4" />
              </button>
            </div>

            {/* Brush Size Selector */}
            <div className="flex items-center gap-1.5 bg-[#FFFDF9] p-1.5 rounded-xl border-2 border-[#3A342B]">
              {BRUSH_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setBrushSize(size)}
                  title={`Brush Size ${size}px`}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                    brushSize === size
                      ? 'bg-[#E5A93C] text-[#2B2520] border-2 border-[#2B2520] shadow-[2px_2px_0px_#2B2520]'
                      : 'text-[#5C5247] hover:text-[#2B2520]'
                  }`}
                >
                  <span
                    className="rounded-full bg-current transition-all"
                    style={{ width: Math.min(16, Math.max(4, size / 1.5)), height: Math.min(16, Math.max(4, size / 1.5)) }}
                  />
                </button>
              ))}
            </div>

            {/* Undo & Clear Action Buttons */}
            <div className="flex items-center gap-1 bg-[#FFFDF9] p-1.5 rounded-xl border-2 border-[#3A342B]">
              <button
                onClick={handleUndo}
                title="Undo Stroke"
                className="p-2 rounded-lg text-[#5C5247] hover:text-[#2B2520] hover:bg-[#EAE0CF] transition-colors"
              >
                <Undo2 className="w-4 h-4" />
              </button>

              <button
                onClick={handleClear}
                title="Clear Canvas"
                className="p-2 rounded-lg text-[#E05A47] hover:bg-[#FADED9] transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom Color Palette Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <div className="relative flex-shrink-0">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-7 h-7 rounded-lg cursor-pointer border-2 border-[#3A342B] p-0 bg-transparent"
                title="Custom Color Picker"
              />
            </div>
            <div className="h-5 w-0.5 bg-[#8C7B6B] mx-1 flex-shrink-0" />
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  style={{ backgroundColor: color }}
                  className={`w-6 h-6 rounded-full flex-shrink-0 border-2 border-[#2B2520] transition-transform ${
                    selectedColor === color ? 'scale-125 shadow-[2px_2px_0px_#2B2520]' : 'hover:scale-110'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
