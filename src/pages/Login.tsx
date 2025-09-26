import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AnimatedInput } from "@/components/auth/AnimatedInput";
import { AnimatedButton } from "@/components/auth/AnimatedButton";
import { FingerprintLogin } from "@/components/auth/FingerprintLogin";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [showFingerprint, setShowFingerprint] = useState(false);
  const [errors, setErrors] = useState<{ emailOrUsername?: string; password?: string }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if fingerprint is enabled
    const fingerprintEnabled = localStorage.getItem('fingerprintEnabled');
    if (fingerprintEnabled === 'true') {
      setShowFingerprint(true);
    }
  }, []);

  const validateForm = () => {
    const newErrors: { emailOrUsername?: string; password?: string } = {};
    
    if (!emailOrUsername) {
      newErrors.emailOrUsername = "Email or username is required";
    }
    
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      let loginEmail = emailOrUsername;
      
      // Check if input is username (not email format)
      if (!emailOrUsername.includes('@')) {
        // Look up email by username
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("email")
          .eq("username", emailOrUsername)
          .maybeSingle();
          
        if (profileError || !profile) {
          toast({
            title: "Login Failed",
            description: "Username not found",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        loginEmail = profile.email;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "Successfully logged in.",
        });
        navigate("/dashboard");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsResetLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
      
      if (error) {
        toast({
          title: "Reset Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Reset Email Sent",
          description: "Check your email for password reset instructions",
        });
        setResetEmail("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  if (showFingerprint) {
    return (
      <AuthLayout 
        title="Welcome Back" 
        subtitle="Sign in to your account to continue"
      >
        <FingerprintLogin 
          onSuccess={() => navigate("/dashboard")}
          onFallback={() => setShowFingerprint(false)}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="Sign in to your account to continue"
    >
      <form onSubmit={handleLogin} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <AnimatedInput
            id="emailOrUsername"
            label="Email or Username"
            type="text"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            error={errors.emailOrUsername}
            placeholder="Enter your email or username"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <AnimatedInput
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            placeholder="Enter your password"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="space-y-4"
        >
          <AnimatedButton
            type="submit"
            className="w-full"
            isLoading={isLoading}
          >
            Sign In
          </AnimatedButton>

          <div className="flex items-center justify-between text-sm">
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="text-primary hover:text-primary-glow transition-colors"
                >
                  Forgot Password?
                </button>
              </DialogTrigger>
              <DialogContent className="glass">
                <DialogHeader>
                  <DialogTitle>Reset Password</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <AnimatedInput
                    id="resetEmail"
                    label="Email Address"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                  <AnimatedButton
                    onClick={handlePasswordReset}
                    isLoading={isResetLoading}
                    className="w-full"
                  >
                    Send Reset Email
                  </AnimatedButton>
                </div>
              </DialogContent>
            </Dialog>

            <Link
              to="/register"
              className="text-accent hover:text-accent-glow transition-colors"
            >
              Create Account
            </Link>
          </div>
        </motion.div>
      </form>
    </AuthLayout>
  );
}