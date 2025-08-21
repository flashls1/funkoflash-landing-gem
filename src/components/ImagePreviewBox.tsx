import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Eye, Download, Video, FileText, Image as ImageIcon } from 'lucide-react';
import { TalentAsset, AssetCategory } from '@/features/talent-assets/data';

interface ImagePreviewBoxProps {
  selectedAsset: TalentAsset | null;
  onPreviewClick?: (asset: TalentAsset) => void;
  className?: string;
}

export const ImagePreviewBox: React.FC<ImagePreviewBoxProps> = ({
  selectedAsset,
  onPreviewClick,
  className = ''
}) => {
  const [showFullPreview, setShowFullPreview] = useState(false);

  const getAssetIcon = (category: AssetCategory) => {
    switch (category) {
      case 'headshot':
      case 'character_image':
        return <ImageIcon className="h-8 w-8" />;
      case 'bio':
        return <FileText className="h-8 w-8" />;
      case 'promo_video':
        return <Video className="h-8 w-8" />;
      default:
        return <ImageIcon className="h-8 w-8" />;
    }
  };

  const isImageAsset = (category: AssetCategory) => {
    return category === 'headshot' || category === 'character_image';
  };

  const isVideoAsset = (category: AssetCategory) => {
    return category === 'promo_video';
  };

  if (!selectedAsset) {
    return (
      <Card className={`w-full h-64 ${className}`}>
        <CardContent className="h-full flex flex-col items-center justify-center text-muted-foreground">
          <Eye className="h-12 w-12 mb-2" />
          <p className="text-sm text-center">Select an asset to preview</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={`w-full h-64 ${className}`}>
        <CardContent className="h-full p-3">
          <div className="h-full flex flex-col">
            <div className="flex-1 relative bg-muted rounded overflow-hidden">
              {isImageAsset(selectedAsset.category) && selectedAsset.file_url ? (
                <img
                  src={selectedAsset.file_url}
                  alt={selectedAsset.title}
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setShowFullPreview(true)}
                />
              ) : isVideoAsset(selectedAsset.category) && selectedAsset.file_url ? (
                <video
                  src={selectedAsset.file_url}
                  className="w-full h-full object-cover cursor-pointer"
                  controls={false}
                  onClick={() => setShowFullPreview(true)}
                  poster=""
                />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => setShowFullPreview(true)}
                >
                  {getAssetIcon(selectedAsset.category)}
                </div>
              )}
            </div>
            
            <div className="mt-2 space-y-1">
              <h4 className="text-sm font-medium truncate">{selectedAsset.title}</h4>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowFullPreview(true)}
                  className="flex-1 h-7 text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </Button>
                {selectedAsset.file_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = selectedAsset.file_url!;
                      link.download = selectedAsset.title;
                      link.click();
                    }}
                    className="h-7 px-2"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full Preview Dialog */}
      <Dialog open={showFullPreview} onOpenChange={setShowFullPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedAsset.title}</DialogTitle>
          </DialogHeader>
          <div className="w-full">
            {isImageAsset(selectedAsset.category) && selectedAsset.file_url ? (
              <AspectRatio ratio={16 / 9}>
                <img
                  src={selectedAsset.file_url}
                  alt={selectedAsset.title}
                  className="w-full h-full object-contain rounded"
                />
              </AspectRatio>
            ) : isVideoAsset(selectedAsset.category) && selectedAsset.file_url ? (
              <AspectRatio ratio={16 / 9}>
                <video
                  src={selectedAsset.file_url}
                  className="w-full h-full object-contain rounded"
                  controls
                />
              </AspectRatio>
            ) : (
              <div className="w-full h-64 flex items-center justify-center bg-muted rounded">
                {getAssetIcon(selectedAsset.category)}
                <div className="ml-4">
                  <p className="font-medium">{selectedAsset.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAsset.description || 'No preview available'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};