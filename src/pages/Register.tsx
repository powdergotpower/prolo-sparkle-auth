import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AnimatedInput } from "@/components/auth/AnimatedInput";
import { AnimatedButton } from "@/components/auth/AnimatedButton";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: {
      username?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!username) newErrors.username = "Username is required";
    else if (username.length < 3) newErrors.username = "Username must be at least 3 characters";

    if (!email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email is invalid";

    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";

    if (!confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // 1️⃣ Check if email or username already exists
      const { data: existingUsers } = await supabase
        .from("profiles")
        .select("email, username")
        .or(`email.eq.${email},username.eq.${username}`);

      if (existingUsers && existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        if (existingUser.email === email) {
          toast({
            title: "Registration Failed",
            description: "This email is already registered",
            variant: "destructive",
          });
          return;
        }
        if (existingUser.username === username) {
          toast({
            title: "Registration Failed", 
            description: "This username is already taken",
            variant: "destructive",
          });
          return;
        }
      }

      // 2️⃣ Sign up user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });

      if (authError) {
        console.error('Auth Error:', authError);
        toast({
          title: "Registration Failed",
          description: authError.message,
          variant: "destructive",
        });
        return;
      }

      if (!authData.user) {
        toast({
          title: "Registration Failed",
          description: "Failed to create user account",
          variant: "destructive",
        });
        return;
      }

      // 3️⃣ Insert into 'profiles' table
      const { error: profileError } = await supabase
        .from("profiles")
        .insert([{
          user_id: authData.user.id,
          username,
          email,
          charms: 0,
          level: 1
        }]);

      if (profileError) {
        console.error('Profile Error Details:', profileError);
        
        let errorMessage = "Database error occurred";
        
        if (profileError.code === '23505') { // Unique constraint violation
          if (profileError.message.includes('profiles_email_key')) {
            errorMessage = "This email is already registered";
          } else if (profileError.message.includes('profiles_username_key')) {
            errorMessage = "This username is already taken";
          } else if (profileError.message.includes('profiles_user_id_key')) {
            errorMessage = "User profile already exists";
          } else {
            errorMessage = "A user with this information already exists";
          }
        } else {
          errorMessage = `Database error: ${profileError.message}`;
        }
        
        toast({
          title: "Registration Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      // 4️⃣ Success
      toast({
        title: "Registration Successful!",
        description: "Welcome! Please check your email to verify your account.",
      });

      navigate("/login");
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Join our community today">
      <form onSubmit={handleRegister} className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <AnimatedInput 
            id="username" 
            label="Username" 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            error={errors.username} 
            placeholder="Choose a username" 
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <AnimatedInput 
            id="email" 
            label="Email" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            error={errors.email} 
            placeholder="Enter your email" 
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
          <AnimatedInput 
            id="password" 
            label="Password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            error={errors.password} 
            placeholder="Create a password" 
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }}>
          <AnimatedInput 
            id="confirmPassword" 
            label="Confirm Password" 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            error={errors.confirmPassword} 
            placeholder="Confirm your password" 
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.5 }} className="space-y-4">
          <AnimatedButton type="submit" className="w-full" isLoading={isLoading}>
            Create Account
          </AnimatedButton>
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary hover:text-primary-glow transition-colors">
              Sign In
            </Link>
          </div>
        </motion.div>
      </form>
    </AuthLayout>
  );
          }
