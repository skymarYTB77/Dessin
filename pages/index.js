import { useState, useRef, useEffect } from "react";
import Head from "next/head";
import { saveAs } from 'file-saver';
import { ArrowLeft, ArrowRight, Upload, Download } from 'lucide-react';

// Preload all icons
const TOOL_ICONS = {
  shapes: "https://res.cloudinary.com/dp1u62e2c/image/upload/v1743539989/Formes_eewjls.svg",
  text: "https://res.cloudinary.com/dp1u62e2c/image/upload/v1743539989/Texte_h5aj5w.svg",
  move: "https://res.cloudinary.com/dp1u62e2c/image/upload/v1743539989/D%C3%A9placement_j5l717.svg",
  highlighter: "https://res.cloudinary.com/dp1u62e2c/image/upload/v1743539984/Surligneur_hstp54.svg",
  pen: "https://res.cloudinary.com/dp1u62e2c/image/upload/v1743539988/Crayon_epjp5a.svg",
  eraser: "https://res.cloudinary.com/dp1u62e2c/image/upload/v1743539982/Gomme_stz1qy.svg"
};

const IMPORT_ICONS = {
  text: "https://res.cloudinary.com/dp1u62e2c/image/upload/v1743539981/Fichier_texte_kisujz_tapu2j.svg",
  image: "https://res.cloudinary.com/dp1u62e2c/image/upload/v1743539991/Fichier_image_qa3n88.svg"
};

const EXPORT_ICONS = {
  png: "https://res.cloudinary.com/dp1u62e2c/image/upload/v1743540591/PNG_iykbt7.svg",
  svg: "https://res.cloudinary.com/dp1u62e2c/image/upload/v1743540591/SVG_hagukj.svg"
};

const SHAPE_ICONS = {
  square: "https://res.cloudinary.com/dp1u62e2c/image/upload/v1743539988/Carr%C3%A9_jwcutj.svg",
  roundedSquare: "https://res.cloudinary.com/dp1u62e2c/image/upload/v1743539987/Carr%C3%A9_arrondi_ykir0x.svg",
  circle: "https://res.cloudinary.com/dp1u62e2c/image/upload/v1743422718/icons8-formes-100_ayguj9.png",
  arrow1: "https://res.cloudinary.com/dp1u62e2c/image/upload/v1743539982/Fl%C3%A8che_c7nlpq.svg",
  arrow2: "https://res.cloudinary.com/dp1u62e2c/image/upload/v1743539981/Fl%C3%A8che_2_yht7fm.svg",
  arrow3: "https://res.cloudinary.com/dp1u62e2c/image/upload/v1743539982/Fl%C3%A8che_3_mcuoxg.svg",
  line: "https://res.cloudinary.com/dp1u62e2c/image/upload/v1743539983/Ligne_ty80ds.svg",
  bubble1: "https://res.cloudinary.com/dp1u62e2c/image/upload/v1743539990/Bulle_m9ut5g.svg",
  bubble2: "https://res.cloudinary.com/dp1u62e2c/image/upload/v1743539984/Bulle_2_t4bjsb.svg",
  bubble3: "https://res.cloudinary.com/dp1u62e2c/image/upload/v1743539985/Bulle_3_wkcbyn.svg",
  bubble4: "https://res.cloudinary.com/dp1u62e2c/image/upload/v1743539986/Bulle_4_xoswdk.svg"
};

export default function Home() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState("#000000");
  const colorInputRef = useRef(null);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [customApiKey, setCustomApiKey] = useState("AIzaSyCQ04jOofo0N5Mk_uyds3uGB7lH9so1bE8");
  const [tool, setTool] = useState('pen');
  const [penSize, setPenSize] = useState(5);
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(1);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
  const [initialScale, setInitialScale] = useState(1);
  const [showShapesMenu, setShowShapesMenu] = useState(false);
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [text, setText] = useState("");
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [isAddingText, setIsAddingText] = useState(false);
  const [fontSize, setFontSize] = useState(20);
  const [fontFamily, setFontFamily] = useState("serif");
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const preloadImage = (src) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
    };

    Object.values(TOOL_ICONS).forEach(preloadImage);
    Object.values(IMPORT_ICONS).forEach(preloadImage);
    Object.values(EXPORT_ICONS).forEach(preloadImage);
    Object.values(SHAPE_ICONS).forEach(preloadImage);
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      initializeCanvas();
      saveDrawingState();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, redoStack]);

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setSelectedImage(null);
    saveDrawingState();
  };

  const saveDrawingState = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL();
    setUndoStack(prev => [...prev, imageData]);
    setRedoStack([]);
  };

  const undo = () => {
    if (undoStack.length <= 1) return;
    const currentState = undoStack[undoStack.length - 1];
    const previousState = undoStack[undoStack.length - 2];
    
    setRedoStack(prev => [...prev, currentState]);
    setUndoStack(prev => prev.slice(0, -1));
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = previousState;
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];
    
    setUndoStack(prev => [...prev, nextState]);
    setRedoStack(prev => prev.slice(0, -1));
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = nextState;
  };

  const isPointInResizeHandle = (x, y) => {
    if (!selectedImage) return false;
    const handleSize = 10;
    const imageWidth = selectedImage.width * imageScale;
    const imageHeight = selectedImage.height * imageScale;
    
    return (
      x >= imagePosition.x + imageWidth/2 - handleSize &&
      x <= imagePosition.x + imageWidth/2 + handleSize &&
      y >= imagePosition.y + imageHeight/2 - handleSize &&
      y <= imagePosition.y + imageHeight/2 + handleSize
    );
  };

  const startDrawing = (e) => {
    const { x, y } = getCoordinates(e);
    
    if (e.type === 'touchstart') {
      e.preventDefault();
    }

    if (tool === 'text') {
      setTextPosition({ x, y });
      setIsAddingText(true);
      return;
    }

    if (tool === 'move') {
      if (selectedImage) {
        if (isPointInResizeHandle(x, y)) {
          setIsResizing(true);
          setResizeStart({ x, y });
          setInitialScale(imageScale);
          return;
        } else if (isPointInImage(x, y)) {
          setIsDragging(true);
          setDragStart({ x: x - imagePosition.x, y: y - imagePosition.y });
          return;
        }
      }
      return;
    }

    setIsDrawing(true);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    if (tool === 'highlighter') {
      ctx.globalAlpha = 0.3;
    } else {
      ctx.globalAlpha = 1.0;
    }
  };

  const draw = (e) => {
    if (!isDrawing && !isDragging && !isResizing) return;
    
    if (e.type === 'touchmove') {
      e.preventDefault();
    }
    
    const { x, y } = getCoordinates(e);
    
    if (isResizing && selectedImage) {
      const dx = x - resizeStart.x;
      const dy = y - resizeStart.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const scaleFactor = 1 + distance / 100;
      
      setImageScale(initialScale * scaleFactor);
      redrawCanvas();
      return;
    }

    if (isDragging && selectedImage) {
      setImagePosition({
        x: x - dragStart.x,
        y: y - dragStart.y
      });
      redrawCanvas();
      return;
    }

    if (!isDrawing || tool === 'move') return;

    const ctx = canvasRef.current.getContext("2d");
    ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : 
                     tool === 'highlighter' ? penColor : penColor;
    ctx.lineWidth = tool === 'highlighter' ? penSize * 2 : penSize;
    ctx.lineCap = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const redrawCanvas = () => {
    if (!canvasRef.current || !selectedImage) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    // Clear canvas and redraw background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Redraw the last state from undo stack if available
    if (undoStack.length > 0) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        
        // Draw the selected image on top
        ctx.save();
        ctx.translate(imagePosition.x, imagePosition.y);
        ctx.scale(imageScale, imageScale);
        ctx.drawImage(selectedImage, -selectedImage.width/2, -selectedImage.height/2);
        ctx.restore();
        
        // Draw resize handle
        if (selectedImage) {
          const handleSize = 5;
          const imageWidth = selectedImage.width * imageScale;
          const imageHeight = selectedImage.height * imageScale;
          
          ctx.fillStyle = "#000000";
          ctx.fillRect(
            imagePosition.x + imageWidth/2 - handleSize,
            imagePosition.y + imageHeight/2 - handleSize,
            handleSize * 2,
            handleSize * 2
          );
        }
      };
      img.src = undoStack[undoStack.length - 1];
    }
  };

  const stopDrawing = () => {
    if (isDrawing || isDragging || isResizing) {
      saveDrawingState();
    }
    setIsDrawing(false);
    setIsDragging(false);
    setIsResizing(false);
    
    if (tool === 'highlighter') {
      const ctx = canvasRef.current.getContext("2d");
      ctx.globalAlpha = 1.0;
    }
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let x, y;
    if (e.type.includes('touch')) {
      x = (e.touches[0].clientX - rect.left) * scaleX;
      y = (e.touches[0].clientY - rect.top) * scaleY;
    } else {
      x = e.nativeEvent.offsetX * scaleX;
      y = e.nativeEvent.offsetY * scaleY;
    }
    
    return { x, y };
  };

  const isPointInImage = (x, y) => {
    if (!selectedImage) return false;
    const halfWidth = (selectedImage.width * imageScale) / 2;
    const halfHeight = (selectedImage.height * imageScale) / 2;
    return (
      x >= imagePosition.x - halfWidth &&
      x <= imagePosition.x + halfWidth &&
      y >= imagePosition.y - halfHeight &&
      y <= imagePosition.y + halfHeight
    );
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          setSelectedImage(img);
          const canvas = canvasRef.current;
          setImagePosition({
            x: canvas.width / 2,
            y: canvas.height / 2
          });
          setImageScale(0.3);
          redrawCanvas();
          saveDrawingState();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExport = (format) => {
    if (canvasRef.current) {
      if (format === 'png') {
        canvasRef.current.toBlob((blob) => {
          saveAs(blob, 'drawing.png');
        });
      } else if (format === 'svg') {
        const svgData = convertCanvasToSVG();
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        saveAs(blob, 'drawing.svg');
      }
    }
    setShowExportMenu(false);
  };

  const convertCanvasToSVG = () => {
    const canvas = canvasRef.current;
    const svg = `
      <svg width="${canvas.width}" height="${canvas.height}" xmlns="http://www.w3.org/2000/svg">
        <image href="${canvas.toDataURL()}" width="${canvas.width}" height="${canvas.height}"/>
      </svg>
    `;
    return svg;
  };

  const addText = () => {
    if (!text || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = penColor;
    ctx.fillText(text, textPosition.x, textPosition.y);
    
    setText("");
    setIsAddingText(false);
    saveDrawingState();
  };

  return (
    <>
      <Head>
        <title>Gemini Drawing</title>
        <meta name="description" content="Gemini Drawing" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2 bg-gray-300 rounded-full p-2 shadow-sm">
              <button
                type="button"
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-200 shadow-sm transition-all"
                onClick={undo}
                disabled={undoStack.length <= 1}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-200 shadow-sm transition-all"
                onClick={redo}
                disabled={redoStack.length === 0}
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-gray-400 mx-2" />
              <button
                type="button"
                className={`w-10 h-10 rounded-full flex items-center justify-center ${tool === 'move' ? 'bg-white' : 'hover:bg-gray-200'} shadow-sm transition-all`}
                onClick={() => setTool('move')}
              >
                <img src={TOOL_ICONS.move} alt="Move" className="w-5 h-5" />
              </button>
              <button
                type="button"
                className={`w-10 h-10 rounded-full flex items-center justify-center ${tool === 'pen' ? 'bg-white' : 'hover:bg-gray-200'} shadow-sm transition-all`}
                onClick={() => setTool('pen')}
              >
                <img src={TOOL_ICONS.pen} alt="Pen" className="w-5 h-5" />
              </button>
              <button
                type="button"
                className={`w-10 h-10 rounded-full flex items-center justify-center ${tool === 'highlighter' ? 'bg-white' : 'hover:bg-gray-200'} shadow-sm transition-all`}
                onClick={() => setTool('highlighter')}
              >
                <img src={TOOL_ICONS.highlighter} alt="Highlighter" className="w-5 h-5" />
              </button>
              <button
                type="button"
                className={`w-10 h-10 rounded-full flex items-center justify-center ${tool === 'eraser' ? 'bg-white' : 'hover:bg-gray-200'} shadow-sm transition-all`}
                onClick={() => setTool('eraser')}
              >
                <img src={TOOL_ICONS.eraser} alt="Eraser" className="w-5 h-5" />
              </button>
              
              <div className="relative">
                <button
                  type="button"
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${showShapesMenu ? 'bg-white' : 'hover:bg-gray-200'} shadow-sm transition-all`}
                  onClick={() => setShowShapesMenu(!showShapesMenu)}
                >
                  <img src={TOOL_ICONS.shapes} alt="Shapes" className="w-5 h-5" />
                </button>
                
                {showShapesMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg p-2 z-10 grid grid-cols-3 gap-2 w-[300px]">
                    {Object.entries(SHAPE_ICONS).map(([key, src]) => (
                      <button
                        key={key}
                        className="p-2 hover:bg-gray-100 rounded flex items-center justify-center"
                        onClick={() => {
                          setShowShapesMenu(false);
                          const img = new Image();
                          img.crossOrigin = "anonymous";
                          img.onload = () => {
                            setSelectedImage(img);
                            const canvas = canvasRef.current;
                            setImagePosition({
                              x: canvas.width / 2,
                              y: canvas.height / 2
                            });
                            setImageScale(0.3);
                            setTool('move');
                            redrawCanvas();
                            saveDrawingState();
                          };
                          img.src = src;
                        }}
                      >
                        <img src={src} alt={key} className="w-8 h-8" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                className={`w-10 h-10 rounded-full flex items-center justify-center ${tool === 'text' ? 'bg-white' : 'hover:bg-gray-200'} shadow-sm transition-all`}
                onClick={() => setTool('text')}
              >
                <img src={TOOL_ICONS.text} alt="Text" className="w-5 h-5" />
              </button>

              <input
                type="range"
                min="1"
                max="50"
                value={penSize}
                onChange={(e) => setPenSize(parseInt(e.target.value))}
                className="w-24"
              />
              
              <button 
                type="button"
                className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border-2 border-white shadow-sm transition-transform hover:scale-110"
                onClick={() => colorInputRef.current?.click()}
                style={{ backgroundColor: penColor }}
              >
                <input
                  ref={colorInputRef}
                  type="color"
                  value={penColor}
                  onChange={(e) => setPenColor(e.target.value)}
                  className="opacity-0 absolute w-px h-px"
                />
              </button>
            </div>
            
            <div className="flex items-center space-x-2 bg-gray-300 rounded-full p-2 shadow-sm">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowImportMenu(!showImportMenu)}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-200 shadow-sm transition-all"
                >
                  <Upload className="w-5 h-5" />
                </button>
                
                {showImportMenu && (
                  <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg p-2 z-10 min-w-[160px]">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.txt,.md"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      className="block w-full p-2 text-left hover:bg-gray-100 rounded flex items-center"
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowImportMenu(false);
                      }}
                    >
                      <img src={IMPORT_ICONS.image} alt="Image" className="w-5 h-5 mr-2" />
                      Import Image
                    </button>
                    <button
                      className="block w-full p-2 text-left hover:bg-gray-100 rounded flex items-center"
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowImportMenu(false);
                      }}
                    >
                      <img src={IMPORT_ICONS.text} alt="Text" className="w-5 h-5 mr-2" />
                      Import Text
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-200 shadow-sm transition-all"
                >
                  <Download className="w-5 h-5" />
                </button>
                
                {showExportMenu && (
                  <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg p-2 z-10 min-w-[160px]">
                    <button
                      className="block w-full p-2 text-left hover:bg-gray-100 rounded flex items-center"
                      onClick={() => handleExport('png')}
                    >
                      <img src={EXPORT_ICONS.png} alt="PNG" className="w-5 h-5 mr-2" />
                      Export as PNG
                    </button>
                    <button
                      className="block w-full p-2 text-left hover:bg-gray-100 rounded flex items-center"
                      onClick={() => handleExport('svg')}
                    >
                      <img src={EXPORT_ICONS.svg} alt="SVG" className="w-5 h-5 mr-2" />
                      Export as SVG
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            width={960}
            height={540}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full rounded-lg border-2 border-gray-200 bg-white shadow-lg mb-4 touch-none"
            style={{ cursor: tool === 'move' ? 'move' : 'crosshair' }}
          />

          {isAddingText && (
            <div className="absolute z-10 bg-white p-4 rounded-lg shadow-lg">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter text..."
                  className="border p-2 rounded"
                />
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="border p-2 rounded"
                >
                  <option value="serif">Serif</option>
                  <option value="sans-serif">Sans-serif</option>
                  <option value="monospace">Monospace</option>
                  <option value="cursive">Cursive</option>
                  <option value="fantasy">Fantasy</option>
                </select>
                <input
                  type="number"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  min="8"
                  max="72"
                  className="border p-2 rounded w-20"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsAddingText(false)}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={addText}
                  className="px-4 py-2 bg-black text-white rounded"
                >
                  Add Text
                </button>
              </div>
            </div>
          )}

          <form onSubmit={async (e) => {
            e.preventDefault();
            setIsLoading(true);
            try {
              const canvas = canvasRef.current;
              const drawingData = canvas.toDataURL("image/png").split(",")[1];
              
              const response = await fetch("/api/generate", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  prompt,
                  drawingData,
                  customApiKey
                }),
              });
              
              const data = await response.json();
              
              if (data.success && data.imageData) {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => {
                  const ctx = canvas.getContext("2d");
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                  saveDrawingState();
                };
                img.src = `data:image/png;base64,${data.imageData}`;
              } else {
                setErrorMessage(data.error || "Failed to generate image");
                setShowErrorModal(true);
              }
            } catch (error) {
              console.error("Error:", error);
              setErrorMessage(error.message || "An unexpected error occurred");
              setShowErrorModal(true);
            } finally {
              setIsLoading(false);
            }
          }} className="w-full">
            <div className="relative">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what to add..."
                className="w-full p-4 pr-14 text-base border-2 border-gray-200 rounded-lg bg-white text-gray-800 shadow-sm focus:ring-2 focus:ring-gray-200 focus:outline-none transition-all"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Loading..." : "Generate"}
              </button>
            </div>
          </form>
        </div>

        {showErrorModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-700">Error</h3>
                <button onClick={() => setShowErrorModal(false)} className="text-gray-400 hover:text-gray-500">
                  ×
                </button>
              </div>
              <p className="text-gray-600 mb-4">{errorMessage}</p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-700 mb-4">Confirmation</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this drawing?</p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    clearCanvas();
                    setShowDeleteConfirm(false);
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}