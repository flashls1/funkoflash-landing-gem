import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Eye, FileText, Image, Video, File } from 'lucide-react';

interface AttachmentPreviewProps {
  url: string;
  fileName: string;
  fileType: string;
  size?: 'sm' | 'md' | 'lg';
  showDownload?: boolean;
}

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ 
  url, 
  fileName, 
  fileType, 
  size = 'md',
  showDownload = true 
}) => {
  const isImage = fileType.startsWith('image/');
  const isVideo = fileType.startsWith('video/');
  const isPDF = fileType === 'application/pdf';
  const isDocument = fileType.includes('document') || fileType.includes('word') || fileType.includes('text');

  const sizeClasses = {
    sm: 'max-w-32 max-h-32',
    md: 'max-w-48 max-h-48',
    lg: 'max-w-64 max-h-64'
  };

  const getFileIcon = () => {
    if (isImage) return <Image className="h-4 w-4" />;
    if (isVideo) return <Video className="h-4 w-4" />;
    if (isPDF) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = () => {
    window.open(url, '_blank');
  };

  if (isImage) {
    return (
      <div className={`relative group rounded-lg overflow-hidden border ${sizeClasses[size]} animate-fade-in`}>
        <img 
          src={url} 
          alt={fileName}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleView}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {showDownload && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleDownload}
              className="h-8 w-8 p-0"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <p className="text-white text-xs truncate">{fileName}</p>
        </div>
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className={`relative rounded-lg overflow-hidden border ${sizeClasses[size]} animate-fade-in`}>
        <video 
          src={url}
          className="w-full h-full object-cover"
          controls
          preload="metadata"
        >
          Your browser does not support video playback.
        </video>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <p className="text-white text-xs truncate">{fileName}</p>
        </div>
      </div>
    );
  }

  // For non-media files, show a file card
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors animate-fade-in">
      <div className="flex-shrink-0">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          {getFileIcon()}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{fileName}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {fileType.split('/')[1]?.toUpperCase() || 'FILE'}
          </Badge>
        </div>
      </div>
      <div className="flex-shrink-0 flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleView}
          className="h-8 w-8 p-0"
        >
          <Eye className="h-4 w-4" />
        </Button>
        {showDownload && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            className="h-8 w-8 p-0"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default AttachmentPreview;