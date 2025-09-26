import { useState } from "react";
import { motion } from "framer-motion";
import { Device } from "@capacitor/device";
import { AnimatedButton } from "./AnimatedButton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Fingerprint } from "lucide-react";

interface FingerprintLoginProps {
  onSuccess: () => void;
  onFallback: () => void;
}

export function FingerprintLogin({ onSuccess, onFallback }: FingerprintLoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFingerprintAuth = async () => {
    setIsLoading(true);
    try {
      const info = await Device.getInfo();
      
      if (info.platform === 'web') {
        toast({
          title: "Mobile Only Feature",
          description: "Please use email/password login",
          variant: "destructive",
        });
        onFallback();
        return;
      }

      // Get stored user ID from localStorage
      const storedUserId = localStorage.getItem('fingerprintUserId');
      
      if (!storedUserId) {
        toast({
          title: "Setup Required",
          description: "Please login with email/password first",
          variant: "destructive",
        });
        onFallback();
        return;
      }

      // Simulate fingerprint authentication
      const authenticated = confirm("Place your finger on the sensor to authenticate");

      if (authenticated) {
        // Verify user still exists and get their email
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('email')
          .eq('user_id', storedUserId)
          .eq('fingerprint_enabled', true)
          .maybeSingle();

        if (error || !profile) {
          toast({
            title: "Authentication Failed",
            description: "Please login with email/password",
            variant: "destructive",
          });
          onFallback();
          return;
        }

        toast({
          title: "Welcome back!",
          description: "Successfully authenticated with fingerprint",
        });
        
        onSuccess();
      } else {
        onFallback();
      }
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: "Please try again or use email/password",
        variant: "destructive",
      });
      onFallback();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6"
    >
      <div className="space-y-4">
        <Fingerprint className="w-20 h-20 mx-auto text-primary animate-pulse" />
        <div>
          <h2 className="text-2xl font-bold">Fingerprint Login</h2>
          <p className="text-muted-foreground">Touch the sensor to authenticate</p>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatedButton
          onClick={handleFingerprintAuth}
          isLoading={isLoading}
          className="w-full"
        >
          Authenticate with Fingerprint
        </AnimatedButton>
        
        <AnimatedButton
          variant="ghost"
          onClick={onFallback}
          className="w-full"
        >
          Use Email/Password Instead
        </AnimatedButton>
      </div>
    </motion.div>
  );
}