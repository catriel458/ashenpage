"use client";

import { useState, useRef, useCallback } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface CoverCropperProps {
  onUpload: (file: File) => void;
  onCancel: () => void;
}

function centerAspectCrop(width: number, height: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, width, height),
    width,
    height
  );
}

export default function CoverCropper({ onUpload, onCancel }: CoverCropperProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ASPECT = 16 / 9;

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSrc(reader.result as string);
    reader.readAsDataURL(file);
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, ASPECT));
  }

  const getCroppedBlob = useCallback((): Promise<Blob | null> => {
    if (!completedCrop || !imgRef.current) return Promise.resolve(null);

    const canvas = document.createElement("canvas");
    const img = imgRef.current;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    const ctx = canvas.getContext("2d");
    if (!ctx) return Promise.resolve(null);

    ctx.drawImage(
      img,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  }, [completedCrop]);

  async function handleConfirm() {
    const blob = await getCroppedBlob();
    if (!blob) return;
    const file = new File([blob], "cover.jpg", { type: "image/jpeg" });
    onUpload(file);
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Ajustar portada</h3>
          <button onClick={onCancel} className="text-zinc-600 hover:text-white transition-colors text-lg">×</button>
        </div>

        {!src ? (
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-zinc-700 rounded-lg p-12 flex flex-col items-center gap-3 cursor-pointer hover:border-zinc-500 transition-colors"
          >
            <span className="text-3xl">🖼</span>
            <p className="text-zinc-400 text-sm">Hacé click para elegir una imagen</p>
            <p className="text-zinc-700 text-xs">JPG, PNG, WEBP — máx 5MB</p>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onSelectFile} />
          </div>
        ) : (
          <>
            <p className="text-zinc-600 text-xs">Mové y redimensioná el recuadro para elegir el área de la portada</p>
            <div className="flex justify-center max-h-96 overflow-auto">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={ASPECT}
                className="max-w-full"
              >
                <img
                  ref={imgRef}
                  src={src}
                  alt="crop"
                  onLoad={onImageLoad}
                  className="max-w-full max-h-80 object-contain"
                />
              </ReactCrop>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setSrc(null); setCrop(undefined); setCompletedCrop(undefined); }}
                className="flex-1 border border-zinc-700 text-zinc-400 py-2 rounded-lg text-sm hover:border-zinc-500 transition-colors"
              >
                Elegir otra
              </button>
              <button
                onClick={handleConfirm}
                disabled={!completedCrop}
                className="flex-1 bg-white text-zinc-900 py-2 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                Usar esta portada
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}