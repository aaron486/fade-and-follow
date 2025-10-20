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
  line?: string;
  odds: string;
  stake_units: string;
  potential_payout?: string;
  notes?: string;
  image_url?: string;
  sportsbook?: string;
  confidence?: number;
  raw_text?: string;
  needs_confirmation?: boolean;
}

interface BetImageUploadProps {
  onBetExtracted: (betDetails: BetDetails) => void;
  onCancel: () => void;
}

// Helper function to resize image for faster OCR - aggressive compression
const resizeImageForOCR = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Resize to max 800px width for smaller payload
        const maxWidth = 800;
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with more compression
        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        console.log('Image resized, base64 length:', resizedBase64.length);
        resolve(resizedBase64);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

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
        console.log('Starting OCR processing...');
        
        // Resize image for faster OCR processing
        const resizedBase64 = await resizeImageForOCR(file);
        if (!resizedBase64) {
          throw new Error('Failed to resize image');
        }
        
        console.log('Calling edge function with resized image...');
        
        const { data: ocrData, error: ocrError } = await supabase.functions.invoke(
          'extract-bet-from-image',
          {
            body: { imageBase64: resizedBase64 }
          }
        );

        console.log('Edge function response:', { data: ocrData, error: ocrError });

        if (ocrError) {
          console.error('OCR error details:', ocrError);
          toast({
            title: 'OCR Failed',
            description: ocrError.message || 'Please fill in details manually',
            variant: 'destructive',
          });
          return;
        }

        if (ocrData?.betDetails) {
          const details = ocrData.betDetails;
          
          // Validate and normalize OCR data with enhanced fields
          const normalizedData = {
            sport: details.sport || 'NFL',
            event_name: details.event_name || '',
            selection: details.selection || '',
            market: details.market || 'ML',
            line: details.line || '',
            odds: details.odds || '-110',
            stake_units: details.stake_units?.toString() || '1',
            potential_payout: details.potential_payout || '',
            notes: details.notes || '',
            image_url: publicUrl,
            sportsbook: details.sportsbook || '',
            confidence: details.confidence || 50,
            raw_text: details.raw_text || '',
            needs_confirmation: details.needs_confirmation || false
          };
          
          console.log('Enhanced OCR extracted data:', normalizedData);
          
          // Update form with OCR results
          onBetExtracted(normalizedData);
          
          // Show appropriate message based on confidence
          if (normalizedData.needs_confirmation) {
            toast({
              title: '⚠️ Low Confidence Detection',
              description: `${normalizedData.confidence}% confidence - Please verify all details carefully`,
              variant: 'destructive',
              duration: 5000,
            });
          } else {
            const sportsbookText = normalizedData.sportsbook ? ` from ${normalizedData.sportsbook}` : '';
            toast({
              title: '✅ Details Extracted',
              description: `${normalizedData.sport} - ${normalizedData.event_name || 'Fill in game details'}${sportsbookText} (${normalizedData.confidence}% confidence)`,
              duration: 4000,
            });
          }
        } else {
          console.warn('No bet details in OCR response');
        }
      } catch (ocrError) {
        console.error('OCR processing error:', ocrError);
        toast({
          title: 'OCR Processing Failed',
          description: ocrError instanceof Error ? ocrError.message : 'Could not process image',
          variant: 'destructive',
        });
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
