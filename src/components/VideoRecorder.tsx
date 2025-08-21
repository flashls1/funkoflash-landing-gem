import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Square, RotateCcw, Upload, Play, Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSafeLocale } from '@/utils/locale';

interface VideoRecorderProps {
  onVideoRecorded: (blob: Blob) => void;
  maxDuration?: number;
  className?: string;
  locale?: 'en' | 'es';
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({
  onVideoRecorded,
  maxDuration = 60,
  className = '',
  locale
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [duration, setDuration] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();
  const currentLocale = locale || getSafeLocale();

  const labels = {
    en: {
      startRecording: 'Start Recording',
      stopRecording: 'Stop Recording',
      retake: 'Retake',
      submit: 'Submit Video',
      preview: 'Preview',
      play: 'Play',
      pause: 'Pause',
      countdown: 'Recording starts in',
      recording: 'Recording',
      duration: 'Duration',
      maxDuration: `Max ${maxDuration}s`,
      preparingCamera: 'Preparing camera...',
      videoRecorded: 'Video recorded successfully!',
      errorCamera: 'Could not access camera',
      errorRecording: 'Error during recording'
    },
    es: {
      startRecording: 'Iniciar Grabación',
      stopRecording: 'Detener Grabación',
      retake: 'Repetir',
      submit: 'Enviar Video',
      preview: 'Vista Previa',
      play: 'Reproducir',
      pause: 'Pausar',
      countdown: 'Grabación inicia en',
      recording: 'Grabando',
      duration: 'Duración',
      maxDuration: `Máx ${maxDuration}s`,
      preparingCamera: 'Preparando cámara...',
      videoRecorded: '¡Video grabado exitosamente!',
      errorCamera: 'No se pudo acceder a la cámara',
      errorRecording: 'Error durante la grabación'
    }
  };

  const t = labels[currentLocale];

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: t.errorCamera,
        variant: 'destructive'
      });
    }
  }, [toast, t.errorCamera]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(() => {
    setCountdown(3);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          startActualRecording();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const startActualRecording = useCallback(() => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      
      toast({
        title: t.videoRecorded,
        variant: 'default'
      });
    };

    mediaRecorder.start(250);
    setIsRecording(true);
    setDuration(0);

    // Duration counter
    intervalRef.current = setInterval(() => {
      setDuration(prev => {
        const newDuration = prev + 1;
        if (newDuration >= maxDuration) {
          stopRecording();
        }
        return newDuration;
      });
    }, 1000);
  }, [maxDuration, toast, t.videoRecorded]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    stopCamera();
  }, [isRecording, stopCamera]);

  const handleStartRecording = useCallback(() => {
    startCamera().then(() => {
      setTimeout(() => {
        startCountdown();
      }, 1000);
    });
  }, [startCamera, startCountdown]);

  const handleRetake = useCallback(() => {
    setRecordedBlob(null);
    setPreviewUrl(null);
    setDuration(0);
    setIsPlaying(false);
    
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  const handleSubmit = useCallback(() => {
    if (recordedBlob) {
      onVideoRecorded(recordedBlob);
    }
  }, [recordedBlob, onVideoRecorded]);

  const togglePreview = useCallback(() => {
    if (previewRef.current) {
      if (isPlaying) {
        previewRef.current.pause();
      } else {
        previewRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  React.useEffect(() => {
    return () => {
      stopCamera();
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [stopCamera, previewUrl]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          {t.preview}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Camera/Preview Video */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          {!recordedBlob ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              ref={previewRef}
              src={previewUrl || undefined}
              className="w-full h-full object-cover"
              onEnded={() => setIsPlaying(false)}
            />
          )}

          {/* Countdown Overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-6xl font-bold">{countdown}</div>
                <div className="text-lg">{t.countdown}</div>
              </div>
            </div>
          )}

          {/* Recording Indicator */}
          {isRecording && (
            <div className="absolute top-4 left-4">
              <Badge variant="destructive" className="animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                {t.recording}
              </Badge>
            </div>
          )}

          {/* Duration Counter */}
          {isRecording && (
            <div className="absolute top-4 right-4">
              <Badge variant="outline" className="bg-black/50 text-white border-white/20">
                {formatTime(duration)} / {t.maxDuration}
              </Badge>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2 justify-center">
          {!recordedBlob ? (
            <>
              {!isRecording && countdown === null ? (
                <Button onClick={handleStartRecording} className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  {t.startRecording}
                </Button>
              ) : (
                <Button 
                  onClick={stopRecording} 
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  {t.stopRecording}
                </Button>
              )}
            </>
          ) : (
            <>
              <Button onClick={togglePreview} variant="outline" className="flex items-center gap-2">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? t.pause : t.play}
              </Button>
              <Button onClick={handleRetake} variant="outline" className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                {t.retake}
              </Button>
              <Button onClick={handleSubmit} className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {t.submit}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};