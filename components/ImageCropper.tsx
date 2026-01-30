import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Slider } from 'lucide-react';

interface Props {
  imageSrc: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
}

export const ImageCropper: React.FC<Props> = ({ imageSrc, onCropComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous'); 
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    // set canvas size to match the bounding box
    canvas.width = image.width;
    canvas.height = image.height;

    // draw image
    ctx.drawImage(image, 0, 0);

    // croppedAreaPixels values are bounding box relative
    // extract the cropped image using these values
    const data = ctx.getImageData(
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height
    );

    // set canvas width to final desired crop size - this will clear existing context
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // paste generated rotate image with correct offsets for x,y crop values.
    ctx.putImageData(data, 0, 0);

    // As Base64 string
    return canvas.toDataURL('image/jpeg');
  };

  const handleSave = async () => {
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedImage) {
        onCropComplete(croppedImage);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[500px]">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
            <h3 className="font-bold">Crop Image</h3>
            <button onClick={onCancel} className="text-slate-400 hover:text-white">✕</button>
        </div>
        
        <div className="relative flex-1 bg-slate-100">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1} // Square aspect ratio for Logo
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={onZoomChange}
          />
        </div>

        <div className="p-4 bg-white border-t border-slate-100 space-y-4">
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Zoom</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
            </div>
            <div className="flex gap-2">
                <button onClick={onCancel} className="flex-1 py-2 text-slate-500 font-bold border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={handleSave} className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Save Logo</button>
            </div>
        </div>
      </div>
    </div>
  );
};
