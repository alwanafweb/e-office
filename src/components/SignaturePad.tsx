import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, Upload, PenTool, Loader2, Cloud } from 'lucide-react';
import { useCloudflareR2 } from '../hooks/useCloudflareR2';

interface SignaturePadProps {
  signerName: string;
  signerPosition: string;
  onSaveSignature: (dataUrlOrR2Url: string) => void;
  existingSignature?: string;
  label?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  signerName,
  signerPosition,
  onSaveSignature,
  existingSignature,
  label = 'Tanda Tangan Digital',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [currentSignature, setCurrentSignature] = useState<string | undefined>(existingSignature);
  const [mode, setMode] = useState<'canvas' | 'preview'>(existingSignature ? 'preview' : 'canvas');

  const { uploadFile, isUploading, isConfigured } = useCloudflareR2();

  useEffect(() => {
    setCurrentSignature(existingSignature);
    if (existingSignature) {
      setMode('preview');
    } else {
      setMode('canvas');
      setHasDrawn(false);
    }
  }, [existingSignature]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e3a8a'; // Dark blue ink

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveCanvasData();
    }
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    setHasDrawn(false);
    setCurrentSignature(undefined);
    setMode('canvas');
    onSaveSignature('');
  };

  const saveCanvasData = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    setCurrentSignature(dataUrl);

    // Convert canvas to blob and upload to Cloudflare R2
    canvas.toBlob(async (blob) => {
      if (!blob) {
        onSaveSignature(dataUrl);
        return;
      }

      try {
        const filename = `signature-${Date.now()}.png`;
        const uploadRes = await uploadFile(blob, filename);
        const finalUrl = uploadRes.publicUrl || dataUrl;
        setCurrentSignature(finalUrl);
        onSaveSignature(finalUrl);
      } catch (err) {
        console.error('Upload ke Cloudflare R2 gagal, menggunakan fallback lokal data URL:', err);
        onSaveSignature(dataUrl);
      }
    }, 'image/png');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const filename = `signature-upload-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const uploadRes = await uploadFile(file, filename);
      const finalUrl = uploadRes.publicUrl;
      setCurrentSignature(finalUrl);
      setMode('preview');
      onSaveSignature(finalUrl);
    } catch (err) {
      console.error('Upload file tanda tangan gagal:', err);
      // Fallback to FileReader
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setCurrentSignature(result);
        setMode('preview');
        onSaveSignature(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-blue-600" />
          {label}
          {isConfigured ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200" title="Terhubung ke Cloudflare R2 Cloud Storage">
              <Cloud className="w-3 h-3 text-emerald-500" />
              Cloudflare R2
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200" title="Penyimpanan Lokal / Preview">
              Storage Mode
            </span>
          )}
        </label>
        <div className="flex items-center gap-2">
          <label className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition">
            <Upload className="w-3 h-3" />
            Upload File
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
          </label>
          <button
            type="button"
            onClick={clearCanvas}
            disabled={isUploading}
            className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition cursor-pointer disabled:opacity-50"
            title="Hapus Kanvas Tanda Tangan"
          >
            <Eraser className="w-3.5 h-3.5" />
            Hapus
          </button>
        </div>
      </div>

      <div className="relative bg-white rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors overflow-hidden">
        {isUploading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xs z-10 flex flex-col items-center justify-center gap-2 text-xs font-bold text-blue-700">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span>Mengunggah Tanda Tangan ke Cloudflare R2...</span>
          </div>
        )}

        {mode === 'preview' && currentSignature ? (
          <div className="relative p-3 flex flex-col items-center justify-center min-h-[120px] bg-blue-50/20">
            <img
              src={currentSignature}
              alt="Tanda Tangan Digital"
              className="max-h-24 object-contain"
            />
            <div className="absolute top-2 right-2 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
              <Check className="w-3 h-3" /> Terpasang
            </div>
            <button
              type="button"
              onClick={clearCanvas}
              className="mt-2 text-[11px] font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer"
            >
              <PenTool className="w-3 h-3" /> Gambar Ulang di Kanvas
            </button>
          </div>
        ) : (
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={400}
              height={130}
              className="w-full h-[120px] cursor-crosshair touch-none bg-white block"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasDrawn && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs italic select-none">
                Goreskan tanda tangan di area kanvas ini...
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-2 text-center text-xs">
        <p className="font-bold text-slate-800">{signerName}</p>
        <p className="text-slate-500">{signerPosition}</p>
      </div>
    </div>
  );
};

