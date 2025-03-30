import { useState, useRef, useEffect } from "react";
import { SendHorizontal, LoaderCircle, Trash2, X } from "lucide-react";
import Head from "next/head";

export default function Home() {
  const canvasRef = useRef(null);
  const backgroundImageRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState("#000000");
  const colorInputRef = useRef(null);
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");

  useEffect(() => {
    if (generatedImage && canvasRef.current) {
      const img = new window.Image();
      img.onload = () => {
        backgroundImageRef.current = img;
        drawImageToCanvas();
      };
      img.src = generatedImage;
    }
  }, [generatedImage]);

  useEffect(() => {
    if (canvasRef.current) {
      initializeCanvas();
    }
  }, []);

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const drawImageToCanvas = () => {
    if (!canvasRef.current || !backgroundImageRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImageRef.current, 0, 0, canvas.width, canvas.height);
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
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCoordinates(e);
    if (e.type === 'touchstart') {
      e.preventDefault();
    }
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e.type === 'touchmove') {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCoordinates(e);
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.strokeStyle = penColor;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setGeneratedImage(null);
    backgroundImageRef.current = null;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    setIsLoading(true);
    
    try {
      const canvas = canvasRef.current;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.fillStyle = '#FFFFFF';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, 0, 0);
      const drawingData = tempCanvas.toDataURL("image/png").split(",")[1];
      
      const requestPayload = {
        prompt,
        drawingData,
        customApiKey
      };
      
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });
      
      const data = await response.json();
      
      if (data.success && data.imageData) {
        const imageUrl = `data:image/png;base64,${data.imageData}`;
        setGeneratedImage(imageUrl);
      } else {
        console.error("Failed to generate image:", data.error);
        if (data.error && (
          data.error.includes("Resource has been exhausted") || 
          data.error.includes("quota") ||
          response.status === 429 ||
          response.status === 500
        )) {
          setErrorMessage(data.error);
          setShowErrorModal(true);
        } else {
          alert("Failed to generate image. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error submitting drawing:", error);
      setErrorMessage(error.message || "An unexpected error occurred.");
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
  };

  const handleApiKeySubmit = (e) => {
    e.preventDefault();
    setShowErrorModal(false);
  };

  useEffect(() => {
    const preventTouchDefault = (e) => {
      if (isDrawing) {
        e.preventDefault();
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('touchstart', preventTouchDefault, { passive: false });
      canvas.addEventListener('touchmove', preventTouchDefault, { passive: false });
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('touchstart', preventTouchDefault);
        canvas.removeEventListener('touchmove', preventTouchDefault);
      }
    };
  }, [isDrawing]);

  return (
    <>
      <Head>
        <title>Gemini Drawing</title>
        <meta name="description" content="Gemini Drawing" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="flex justify-end mb-4">
            <menu className="flex items-center bg-gray-300 rounded-full p-2 shadow-sm">
              <button 
                type="button"
                className="w-10 h-10 rounded-full overflow-hidden mr-2 flex items-center justify-center border-2 border-white shadow-sm transition-transform hover:scale-110"
                onClick={openColorPicker}
                onKeyDown={handleKeyDown}
                aria-label="Open color picker"
                style={{ backgroundColor: penColor }}
              >
                <input
                  ref={colorInputRef}
                  type="color"
                  value={penColor}
                  onChange={handleColorChange}
                  className="opacity-0 absolute w-px h-px"
                  aria-label="Select pen color"
                />
              </button>
              <button
                type="button"
                onClick={clearCanvas}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm transition-all hover:bg-gray-50 hover:scale-110"
              >
                <Trash2 className="w-5 h-5 text-gray-700" aria-label="Clear Canvas" />
              </button>
            </menu>
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
                  <LoaderCircle className="w-6 h-6 animate-spin" aria-label="Loading" />
                ) : (
                  <SendHorizontal className="w-6 h-6" aria-label="Submit" />
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
                  onClick={closeErrorModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 mb-4">{errorMessage}</p>
              <div className="flex justify-end">
                <button
                  onClick={closeErrorModal}
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}