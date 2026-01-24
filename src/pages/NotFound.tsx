import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import errorImg from "/images/404error.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <img src={errorImg} alt="404 Page not found" className="errorImageClass" />
        
        <a href="/" className="backToHome text-primary hover:text-primary/90">Return to Home</a>
      </div>
    </div>
  );
};

export default NotFound;
