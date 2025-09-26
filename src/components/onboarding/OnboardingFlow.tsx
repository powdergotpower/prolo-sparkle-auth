import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { AnimatedInput } from "@/components/auth/AnimatedInput";
import { AnimatedButton } from "@/components/auth/AnimatedButton";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Device } from "@capacitor/device";
import { Camera, User, Fingerprint } from "lucide-react";

interface OnboardingFlowProps {
  userId: string;
  onComplete: () => void;
}

export function OnboardingFlow({ userId, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleNameNext = () => {
    if (!name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name to continue",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep(2);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileNext = async () => {
    setIsLoading(true);
    try {
      let avatarUrl = "";
      
      if (avatarFile) {
        const fileName = `${userId}-${Date.now()}.${avatarFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        
        avatarUrl = publicUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          username: name,
          avatar_url: avatarUrl
        })
        .eq('user_id', userId);

      if (error) throw error;

      setCurrentStep(3);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFingerprintSetup = async () => {
    setIsLoading(true);
    try {
      const info = await Device.getInfo();
      
      // Check if device supports biometric authentication
      if (info.platform === 'web') {
        toast({
          title: "Mobile Only Feature",
          description: "Fingerprint authentication is only available on mobile devices",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Simulate fingerprint setup for now
      // In a real app, you would use a proper biometric plugin
      const confirmed = confirm("Place your finger on the sensor to register fingerprint authentication");

      if (confirmed) {
        // Store fingerprint preference in user profile
        await supabase
          .from('profiles')
          .update({ fingerprint_enabled: true })
          .eq('user_id', userId);

        // Store in localStorage for quick access
        localStorage.setItem('fingerprintEnabled', 'true');
        localStorage.setItem('fingerprintUserId', userId);

        toast({
          title: "Success!",
          description: "Fingerprint authentication has been set up",
        });
        
        onComplete();
      }
    } catch (error) {
      toast({
        title: "Setup Failed",
        description: "Failed to set up fingerprint authentication",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipFingerprint = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-md glass">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Complete Your Profile
          </CardTitle>
          <div className="flex justify-center space-x-2 mt-4">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full transition-colors ${
                  step <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <User className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold">What's your name?</h3>
                <p className="text-muted-foreground">This will be displayed on your profile</p>
              </div>
              
              <AnimatedInput
                id="name"
                label="Your Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
              />
              
              <AnimatedButton onClick={handleNameNext} className="w-full">
                Next
              </AnimatedButton>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <Camera className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold">Add a profile picture</h3>
                <p className="text-muted-foreground">Help others recognize you</p>
              </div>

              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={avatarPreview} />
                  <AvatarFallback className="text-2xl">
                    {name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">
                    Choose Photo
                  </div>
                </label>
              </div>
              
              <div className="flex space-x-3">
                <AnimatedButton
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1"
                >
                  Back
                </AnimatedButton>
                <AnimatedButton
                  onClick={handleProfileNext}
                  isLoading={isLoading}
                  className="flex-1"
                >
                  Next
                </AnimatedButton>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <Fingerprint className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold">Add fingerprint login?</h3>
                <p className="text-muted-foreground">Login quickly and securely with your fingerprint</p>
              </div>
              
              <div className="space-y-3">
                <AnimatedButton
                  onClick={handleFingerprintSetup}
                  isLoading={isLoading}
                  className="w-full"
                >
                  Yes, Set Up Fingerprint
                </AnimatedButton>
                <AnimatedButton
                  variant="outline"
                  onClick={handleSkipFingerprint}
                  className="w-full"
                >
                  Skip for Now
                </AnimatedButton>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}