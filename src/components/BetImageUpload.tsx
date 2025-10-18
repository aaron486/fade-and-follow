import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Camera, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BetDetails {
  sport: string;
  event_name: string;
  market: string;
  selection: string;
  odds: string;
  stake_units: string;
  notes?: string;
  image_url?: string;
}

interface BetImageUploadProps {
  onBetExtracted: (betDetails: BetDetails) => void;
  onCancel: () => void;
}

const BetImageUpload: React.FC<BetImageUploadProps> = ({ onBetExtracted, onCancel }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Process the image
    setIsProcessing(true);
    try {
      // Upload image to storage first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to upload bets');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('bet-screenshots')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload image');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('bet-screenshots')
        .getPublicUrl(fileName);

      setUploadedImageUrl(publicUrl);

      // Open form immediately with placeholder data
      onBetExtracted({
        sport: 'NFL',
        event_name: '',
        market: 'ML',
        selection: '',
        odds: '-110',
        stake_units: '1',
        image_url: publicUrl,
        notes: ''
      });

      // Process OCR in background to auto-fill details
      try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
          const base64String = (reader.result as string).split(',')[1];
          
          const { data: ocrData, error: ocrError } = await supabase.functions.invoke(
            'extract-bet-from-image',
            {
              body: { imageBase64: base64String }
            }
          );

          if (ocrError) {
            console.error('OCR error:', ocrError);
            toast({
              title: 'OCR Failed',
              description: 'Please fill in details manually',
              variant: 'destructive',
            });
            return;
          }

          if (ocrData?.betDetails) {
            // Update form with OCR results
            onBetExtracted({
              ...ocrData.betDetails,
              image_url: publicUrl,
            });
            
            toast({
              title: '✅ Details Extracted',
              description: 'Bet details auto-filled from image',
            });
          }
        };
      } catch (ocrError) {
        console.error('OCR processing error:', ocrError);
      }

    } catch (error) {
      console.error('Error uploading image:', error);
      
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Could not upload image',
        variant: 'destructive',
      });
      setPreviewUrl(null);
      setUploadedImageUrl(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Upload Betting Slip</h2>
        <p className="text-muted-foreground">Attach your screenshot and fill in the details</p>
      </div>

      {previewUrl ? (
        <div className="relative">
          <img 
            src={previewUrl} 
            alt="Betting slip preview" 
            className="w-full rounded-lg border max-h-96 object-contain"
          />
          {!isProcessing && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => {
                setPreviewUrl(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {isProcessing && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="text-sm font-medium">Uploading image...</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed rounded-lg p-12 text-center space-y-4 hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex justify-center gap-4">
            <Upload className="h-12 w-12 text-muted-foreground" />
            <Camera className="h-12 w-12 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-medium">Drop your betting slip here</p>
            <p className="text-sm text-muted-foreground">or click to browse</p>
          </div>
          <p className="text-xs text-muted-foreground">Supports JPG, PNG, WEBP</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default BetImageUpload;
