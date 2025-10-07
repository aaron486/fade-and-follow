import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2 } from 'lucide-react';

export const AdminActions = () => {
  const [scraping, setScraping] = useState(false);
  const { toast } = useToast();

  const handleScrapeCelebrityPicks = async () => {
    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-celebrity-picks');
      
      if (error) throw error;

      toast({
        title: "Scraping Started!",
        description: "Celebrity picks are being scraped in the background. This may take several minutes.",
      });
    } catch (error) {
      console.error('Error triggering scrape:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start scraping",
        variant: "destructive",
      });
    } finally {
      setScraping(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          onClick={handleScrapeCelebrityPicks}
          disabled={scraping}
          className="w-full"
        >
          {scraping ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scraping...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Scrape Celebrity Picks
            </>
          )}
        </Button>
        <p className="text-sm text-muted-foreground">
          Scrapes latest picks from all {localStorage.getItem('influencer_count') || '90+'} influencers on Twitter
        </p>
      </CardContent>
    </Card>
  );
};
