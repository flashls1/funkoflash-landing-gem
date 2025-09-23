import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, FileText } from 'lucide-react';

interface DocumentImageUploadProps {
  currentImageUrl?: string | null;
  onImageUploaded: (imageUrl: string, iv: string) => void;
  onImageRemoved: () => void;
  label: string;
  documentType: 'passport' | 'visa';
  talentId?: string;
}

export const DocumentImageUpload: React.FC<DocumentImageUploadProps> = ({
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  label,
  documentType,
  talentId = 'temp'
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast({
        title: 'Error',
        description: 'Please select an image or PDF file',
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

    // Create preview for images only
    if (file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
    }

    setUploading(true);
    try {
      // Convert file to base64
      const fileData = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });

      // Encrypt the file using the edge function
      const { data, error } = await supabase.functions.invoke('document-encryption', {
        body: {
          action: 'encrypt',
          fileData,
          fileName: file.name,
          talentId,
          documentType
        }
      });

      if (error) throw error;

      const { fileUrl, iv } = data;

      onImageUploaded(fileUrl, iv);
      
      toast({
        title: 'Success',
        description: `${label} uploaded and encrypted successfully`
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Error',
        description: `Failed to upload and encrypt ${label.toLowerCase()}`,
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
      <Label className="text-blue-300">{label} Image</Label>
      
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
          accept="image/*,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        <p className="text-xs text-white/60">
          AES-256 encrypted • Supported formats: JPEG, PNG, PDF scan • Maximum size: 10MB
        </p>
      </div>
    </div>
  );
};