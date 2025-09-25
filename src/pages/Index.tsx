import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StartupAnimation } from "@/components/StartupAnimation";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [showStartup, setShowStartup] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleStartupComplete = () => {
    setShowStartup(false);
    navigate("/login");
  };

  if (showStartup) {
    return <StartupAnimation onComplete={handleStartupComplete} />;
  }

  return null;
};

export default Index;
