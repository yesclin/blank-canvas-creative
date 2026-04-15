import { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, Check, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SelfieCaptureProps {
  onCapture: (dataUrl: string | null) => void;
  onCameraUnavailable?: () => void;
}

export function SelfieCapture({ onCapture, onCameraUnavailable }: SelfieCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const startCamera = useCallback(async () => {
    setStarting(true);
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setError('Câmera não disponível. Verifique as permissões do navegador.');
      onCameraUnavailable?.();
    } finally {
      setStarting(false);
    }
  }, [onCameraUnavailable]);

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    onCapture(dataUrl);
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
  };

  const retake = async () => {
    setCapturedImage(null);
    onCapture(null);
    await startCamera();
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative rounded-lg overflow-hidden bg-black aspect-[4/3] max-w-sm mx-auto">
        {capturedImage ? (
          <img src={capturedImage} alt="Selfie capturada" className="w-full h-full object-cover" />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex justify-center gap-3">
        {capturedImage ? (
          <>
            <Button variant="outline" size="sm" onClick={retake}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Refazer
            </Button>
            <Button size="sm" variant="default" disabled>
              <Check className="h-3.5 w-3.5 mr-1" /> Capturada
            </Button>
          </>
        ) : (
          <Button onClick={capture} disabled={starting || !stream}>
            <Camera className="h-4 w-4 mr-2" />
            {starting ? 'Iniciando câmera...' : 'Capturar Selfie'}
          </Button>
        )}
      </div>
    </div>
  );
}
