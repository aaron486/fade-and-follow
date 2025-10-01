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
}

interface BetImageUploadProps {
  onBetExtracted: (betDetails: BetDetails) => void;
  onCancel: () => void;
}

const BetImageUpload: React.FC<BetImageUploadProps> = ({ onBetExtracted, onCancel }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
      // Convert to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      console.log('Sending image to AI for processing...');
      
      const { data, error } = await supabase.functions.invoke('extract-bet-from-image', {
        body: { imageBase64: base64 }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to process image');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.betDetails) {
        throw new Error('No bet details extracted');
      }

      console.log('Bet details extracted:', data.betDetails);

      toast({
        title: 'Success!',
        description: 'Bet details extracted from image',
      });

      onBetExtracted(data.betDetails);
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: 'Processing Failed',
        description: error instanceof Error ? error.message : 'Could not extract bet details from image',
        variant: 'destructive',
      });
      setPreviewUrl(null);
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
        <p className="text-muted-foreground">AI will automatically extract your bet details</p>
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
                <p className="text-sm font-medium">Analyzing betting slip...</p>
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
