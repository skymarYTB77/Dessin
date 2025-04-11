import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image, Transformer } from 'react-konva';
import useImage from 'use-image';
import { Upload } from 'lucide-react';

const KonvaImage = ({ imageProps, isSelected, onSelect, onChange }) => {
  const imageRef = useRef();
  const transformerRef = useRef();
  const [image] = useImage(imageProps.src);

  useEffect(() => {
    if (isSelected && transformerRef.current && imageRef.current) {
      transformerRef.current.nodes([imageRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Image
        {...imageProps}
        ref={imageRef}
        image={image}
        draggable
        onClick={onSelect}
        onDragEnd={(e) => {
          onChange({
            ...imageProps,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={() => {
          const node = imageRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          const rotation = node.rotation();

          node.scaleX(1);
          node.scaleY(1);

          onChange({
            ...imageProps,
            x: node.x(),
            y: node.y(),
            width: Math.max(50, node.width() * scaleX),
            height: Math.max(50, node.height() * scaleY),
            rotation: rotation,
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            return newBox.width < 50 || newBox.height < 50 ? oldBox : newBox;
          }}
          rotationEnabled={true}
        />
      )}
    </>
  );
};

const KonvaDrawing = () => {
  const [images, setImages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage = {
          id: Date.now().toString(),
          src: e.target.result,
          x: Math.random() * (window.innerWidth - 100),
          y: Math.random() * (window.innerHeight - 100),
          width: 200,
          height: 200,
          rotation: 0,
        };
        setImages((prev) => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelect = (id) => {
    setSelectedId(id === selectedId ? null : id);
  };

  const handleImageChange = (newProps) => {
    setImages(images.map((img) => (img.id === newProps.id ? newProps : img)));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Zone de dessin Konva</h1>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors"
        >
          <Upload size={20} />
          Ajouter une image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <Stage
          width={window.innerWidth - 32}
          height={window.innerHeight - 200}
          onClick={(e) => {
            if (e.target === e.target.getStage()) {
              setSelectedId(null);
            }
          }}
        >
          <Layer>
            {images.map((img) => (
              <KonvaImage
                key={img.id}
                imageProps={img}
                isSelected={img.id === selectedId}
                onSelect={() => handleSelect(img.id)}
                onChange={handleImageChange}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default KonvaDrawing;