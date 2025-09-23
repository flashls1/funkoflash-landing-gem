import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, FileText } from 'lucide-react';

interface DocumentImageUploadProps {
  currentImageUrl?: string | null;
  onImageUploaded: (imageUrl: string) => void;
  onImageRemoved: () => void;
  label: string;
  documentType: 'passport' | 'visa';
}

export const DocumentImageUpload: React.FC<DocumentImageUploadProps> = ({
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  label,
  documentType,
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 10MB for documents)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File size must be less than 10MB',
        variant: 'destructive'
      });
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${documentType}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('talent-headshots')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('talent-headshots')
        .getPublicUrl(filePath);

      onImageUploaded(publicUrl);
      
      toast({
        title: 'Success',
        description: `${label} uploaded successfully`
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Error',
        description: `Failed to upload ${label.toLowerCase()}`,
        variant: 'destructive'
      });
      setPreview(currentImageUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview(null);
    onImageRemoved();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <Label>{label} Image</Label>
      
      <div className="flex flex-col gap-3">
        {/* Image Preview */}
        <div className="flex items-center justify-center w-full h-32 bg-white/10 border-2 border-dashed border-white/20 rounded-lg overflow-hidden">
          {preview ? (
            <img
              src={preview}
              alt={`${label} preview`}
              className="w-full h-full object-contain"
            />
          ) : (
            <FileText className="w-8 h-8 text-white/40" />
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleUploadClick}
            disabled={uploading}
            size="sm"
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : preview ? 'Change' : 'Upload'}
          </Button>
          
          {preview && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveImage}
              disabled={uploading}
              className="border-white/20 bg-white text-black hover:bg-gray-100"
            >
              <X className="w-4 h-4 mr-2" />
              Remove
            </Button>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <p className="text-xs text-white/60">
          Supported formats: JPEG, PNG, PDF scan. Maximum size: 10MB
        </p>
      </div>
    </div>
  );
};