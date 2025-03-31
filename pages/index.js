import { useState, useRef, useEffect } from "react";
import { SendHorizontal, LoaderCircle, Trash2, X, Pen, Eraser, Square, Circle, Type, Image as ImageIcon, Download, Upload, ArrowLeft, ArrowRight, MousePointer } from "lucide-react";
import Head from "next/head";
import { saveAs } from 'file-saver';

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
  const [tool, setTool] = useState(null);
  const [penSize, setPenSize] = useState(5);
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(1);
  const [isResizing, setIsResizing] = useState(false);
  const [text, setText] = useState("");
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [isAddingText, setIsAddingText] = useState(false);
  const [fontSize, setFontSize] = useState(20);
  const [fontFamily, setFontFamily] = useState("serif");
  const [showShapesMenu, setShowShapesMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [lastDrawingState, setLastDrawingState] = useState(null);
  const [currentShape, setCurrentShape] = useState(null);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [tempCanvas, setTempCanvas] = useState(null);

  useEffect(() => {
    if (canvasRef.current) {
      initializeCanvas();
      // Créer un canvas temporaire pour le dessin des formes
      const temp = document.createElement('canvas');
      temp.width = canvasRef.current.width;
      temp.height = canvasRef.current.height;
      setTempCanvas(temp);
      saveDrawingState();
    }
  }, []);

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
    setLastDrawingState(imageData);
  };

  const undo = () => {
    if (undoStack.length <= 1) return;
    const currentState = undoStack[undoStack.length - 1];
    const previousState = undoStack[undoStack.length - 2];
    
    setRedoStack(prev => [...prev, currentState]);
    setUndoStack(prev => prev.slice(0, -1));
    
    const img = new Image();
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
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = nextState;
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.nativeEvent.offsetX || (e.nativeEvent.touches?.[0]?.clientX - rect.left)) * scaleX,
      y: (e.nativeEvent.offsetY || (e.nativeEvent.touches?.[0]?.clientY - rect.top)) * scaleY
    };
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

    if (!tool) {
      // Mode sélection/déplacement
      if (selectedImage && isPointInImage(x, y)) {
        setIsDragging(true);
        setDragStart({ x: x - imagePosition.x, y: y - imagePosition.y });
        return;
      }
    }

    setStartPoint({ x, y });
    setIsDrawing(true);

    if (tool === 'pen' || tool === 'eraser') {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else if (tempCanvas) {
      // Copier le canvas principal sur le canvas temporaire
      const tempCtx = tempCanvas.getContext("2d");
      tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvasRef.current, 0, 0);
    }
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

  const draw = (e) => {
    if (!isDrawing && !isDragging) return;
    if (e.type === 'touchmove') {
      e.preventDefault();
    }
    
    const { x, y } = getCoordinates(e);
    
    if (isDragging && selectedImage) {
      setImagePosition({
        x: x - dragStart.x,
        y: y - dragStart.y
      });
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Redessiner l'image à la nouvelle position
      ctx.save();
      ctx.translate(imagePosition.x, imagePosition.y);
      ctx.scale(imageScale, imageScale);
      ctx.drawImage(selectedImage, -selectedImage.width/2, -selectedImage.height/2);
      ctx.restore();
      
      return;
    }

    if (!tool) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    switch (tool) {
      case "pen":
        ctx.strokeStyle = penColor;
        ctx.lineWidth = penSize;
        ctx.lineCap = "round";
        ctx.lineTo(x, y);
        ctx.stroke();
        break;
      case "eraser":
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = penSize;
        ctx.lineCap = "round";
        ctx.lineTo(x, y);
        ctx.stroke();
        break;
      case "rectangle":
      case "circle":
      case "line":
        // Dessiner sur le canvas temporaire
        const tempCtx = tempCanvas.getContext("2d");
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(canvasRef.current, 0, 0);
        tempCtx.strokeStyle = penColor;
        tempCtx.lineWidth = penSize;

        if (tool === "rectangle") {
          tempCtx.beginPath();
          tempCtx.rect(startPoint.x, startPoint.y, x - startPoint.x, y - startPoint.y);
          tempCtx.stroke();
        } else if (tool === "circle") {
          const radius = Math.sqrt(Math.pow(x - startPoint.x, 2) + Math.pow(y - startPoint.y, 2));
          tempCtx.beginPath();
          tempCtx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
          tempCtx.stroke();
        } else if (tool === "line") {
          tempCtx.beginPath();
          tempCtx.moveTo(startPoint.x, startPoint.y);
          tempCtx.lineTo(x, y);
          tempCtx.stroke();
        }

        // Copier le canvas temporaire sur le canvas principal
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(tempCanvas, 0, 0);
        break;
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      if (['rectangle', 'circle', 'line'].includes(tool)) {
        // Finaliser le dessin de la forme
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(tempCanvas, 0, 0);
      }
      saveDrawingState();
    }
    setIsDrawing(false);
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setSelectedImage(img);
          const canvas = canvasRef.current;
          setImagePosition({
            x: canvas.width / 2,
            y: canvas.height / 2
          });
          setImageScale(0.3);
          
          // Dessiner l'image
          const ctx = canvas.getContext("2d");
          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.scale(0.3, 0.3);
          ctx.drawImage(img, -img.width/2, -img.height/2);
          ctx.restore();
          
          saveDrawingState();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveImage = () => {
    if (canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        saveAs(blob, 'drawing.png');
      });
    }
  };

  const handleColorChange = (e) => {
    setPenColor(e.target.value);
  };

  const openColorPicker = () => {
    if (colorInputRef.current) {
      colorInputRef.current.click();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      openColorPicker();
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canvasRef.current) return;
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
                className={`w-10 h-10 rounded-full flex items-center justify-center ${!tool ? 'bg-white' : 'hover:bg-gray-200'} shadow-sm transition-all`}
                onClick={() => setTool(null)}
              >
                <MousePointer className="w-5 h-5 text-gray-700" />
              </button>
              <button
                type="button"
                className={`w-10 h-10 rounded-full flex items-center justify-center ${tool === 'pen' ? 'bg-white' : 'hover:bg-gray-200'} shadow-sm transition-all`}
                onClick={() => setTool('pen')}
              >
                <Pen className="w-5 h-5 text-gray-700" />
              </button>
              <button
                type="button"
                className={`w-10 h-10 rounded-full flex items-center justify-center ${tool === 'eraser' ? 'bg-white' : 'hover:bg-gray-200'} shadow-sm transition-all`}
                onClick={() => setTool('eraser')}
              >
                <Eraser className="w-5 h-5 text-gray-700" />
              </button>
              <div className="relative">
                <button
                  type="button"
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${['rectangle', 'circle', 'line'].includes(tool) ? 'bg-white' : 'hover:bg-gray-200'} shadow-sm transition-all`}
                  onClick={() => setShowShapesMenu(!showShapesMenu)}
                >
                  <Square className="w-5 h-5 text-gray-700" />
                </button>
                {showShapesMenu && (
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg p-2 z-10">
                    <button
                      className="block w-full p-2 text-left hover:bg-gray-100 rounded"
                      onClick={() => { setTool('rectangle'); setShowShapesMenu(false); }}
                    >
                      Rectangle
                    </button>
                    <button
                      className="block w-full p-2 text-left hover:bg-gray-100 rounded"
                      onClick={() => { setTool('circle'); setShowShapesMenu(false); }}
                    >
                      Circle
                    </button>
                    <button
                      className="block w-full p-2 text-left hover:bg-gray-100 rounded"
                      onClick={() => { setTool('line'); setShowShapesMenu(false); }}
                    >
                      Line
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                className={`w-10 h-10 rounded-full flex items-center justify-center ${tool === 'text' ? 'bg-white' : 'hover:bg-gray-200'} shadow-sm transition-all`}
                onClick={() => setTool('text')}
              >
                <Type className="w-5 h-5 text-gray-700" />
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
                onClick={openColorPicker}
                onKeyDown={handleKeyDown}
                style={{ backgroundColor: penColor }}
              >
                <input
                  ref={colorInputRef}
                  type="color"
                  value={penColor}
                  onChange={handleColorChange}
                  className="opacity-0 absolute w-px h-px"
                />
              </button>
              <button
                type="button"
                onClick={undo}
                disabled={undoStack.length <= 1}
                className={`w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-200 shadow-sm transition-all ${undoStack.length <= 1 ? 'opacity-50' : ''}`}
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={redoStack.length === 0}
                className={`w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-200 shadow-sm transition-all ${redoStack.length === 0 ? 'opacity-50' : ''}`}
              >
                <ArrowRight className="w-5 h-5 text-gray-700" />
              </button>
            </div>
            
            <div className="flex items-center space-x-2 bg-gray-300 rounded-full p-2 shadow-sm">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-200 shadow-sm transition-all"
              >
                <Upload className="w-5 h-5 text-gray-700" />
              </button>
              <button
                type="button"
                onClick={handleSaveImage}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-200 shadow-sm transition-all"
              >
                <Download className="w-5 h-5 text-gray-700" />
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-200 shadow-sm transition-all"
              >
                <Trash2 className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>

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
            className="w-full rounded-lg border-2 border-gray-200 bg-white shadow-lg mb-4 touch-none hover:cursor-crosshair"
          />

          <form onSubmit={handleSubmit} className="w-full">
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
                {isLoading ? (
                  <LoaderCircle className="w-6 h-6 animate-spin" />
                ) : (
                  <SendHorizontal className="w-6 h-6" />
                )}
              </button>
            </div>
          </form>
        </div>

        {showErrorModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-700">Error</h3>
                <button 
                  onClick={() => setShowErrorModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
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
              <p className="text-gray-600 mb-6">Voulez-vous supprimer ce dessin ?</p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    clearCanvas();
                    setShowDeleteConfirm(false);
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}