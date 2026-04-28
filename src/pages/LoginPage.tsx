import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types";
import ThemeToggle from "@/components/ThemeToggle";
import FloatingDoodles from "@/components/FloatingDoodles";
import MagneticEyesLogo from "@/components/MorphingLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GraduationCap,
  Users,
  Building2,
  ArrowLeft,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AuthMode = "login" | "signup";
type PageState = "roles" | "transitioning" | "form";

const roleConfig = {
  student: {
    icon: GraduationCap,
    title: "Student Portal",
    description: "View and register for your campus events",
  },
  club: {
    icon: Users,
    title: "Club Portal",
    description: "Manage your club and create events",
  },
  department: {
    icon: Building2,
    title: "Department Portal",
    description: "Approve and oversee all the campus events",
  },
};

const LoginPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [pageState, setPageState] = useState<PageState>("roles");
  const [hoveredRoleIndex, setHoveredRoleIndex] = useState<number | null>(null);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [uid, setUid] = useState("");

  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setIsLoading(true);

    // for dialoge box after login or sign, etc
    try {
      if (authMode === "login") {
        const success = await login(email, password, selectedRole);
        if (success) {
          toast({
            title: "Welcome back!",
            description: "You have successfully logged in.",
          });
          navigate(`/${selectedRole}`);
        } else {
          toast({
            title: "Login failed",
            description: "Kindly re-check your credentials",
            variant: "destructive",
          });
        }
      } else {
        try {
          const success = await signup(email, password, name, selectedRole, uid);
          if (success) {
            toast({
              title: "Account created!",
              description: "Please check your email to verify your account.",
            });
            navigate('/verify-email');
          }
        } catch (err: unknown) {
          const firebaseErr = err as { code?: string; message?: string };
          let errorMsg = "Something went wrong. Please try again.";

          switch (firebaseErr.code) {
            case "auth/email-already-in-use":
              errorMsg = "An account with this email already exists. Try logging in instead.";
              break;
            case "auth/weak-password":
              errorMsg = "Password must be at least 6 characters long.";
              break;
            case "auth/invalid-email":
              errorMsg = "Please enter a valid email address.";
              break;
            case "auth/network-request-failed":
              errorMsg = "Network error. Please check your internet connection.";
              break;
            default:
              errorMsg = firebaseErr.message || errorMsg;
          }

          toast({
            title: "Signup failed",
            description: errorMsg,
            variant: "destructive",
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setUid("");
  };

  // Smooth transition: role selection → login form
  const handleRoleSelect = useCallback((role: UserRole) => {
    setPageState("transitioning");
    setHoveredRoleIndex(null);
    resetForm();

    setTimeout(() => {
      setSelectedRole(role);
      setPageState("form");
    }, 300);
  }, []);

  // Smooth transition: login form → role selection
  const handleBack = useCallback(() => {
    setPageState("transitioning");

    setTimeout(() => {
      setSelectedRole(null);
      setPageState("roles");
    }, 300);
  }, []);

  // ========== ROLE SELECTION PAGE ==========
  if (!selectedRole) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-background">
        <div className="absolute inset-0 surface-1" />
        <FloatingDoodles />

        <div
          className={`relative w-full max-w-5xl text-foreground text-center z-10 ${pageState === "transitioning" ? "animate-scale-out-fade" : ""
            }`}
        >
          {/* Custom Interactive Logo — stagger delay 0ms */}
          <MagneticEyesLogo
            className="mx-auto mb-8 opacity-0 animate-stagger-fade-up"
            style={{ animationDelay: "0ms" }}
            activeIndex={hoveredRoleIndex}
          />

          {/* Heading — stagger delay 100ms */}
          <h1
            className="text-5xl font-semibold tracking-tight mb-3 opacity-0 animate-stagger-fade-up"
            style={{ letterSpacing: "-1.056px", animationDelay: "100ms" }}
          >
            Event Management Portal
          </h1>

          {/* Subtitle — stagger delay 200ms */}
          <p
            className="text-lg font-medium text-muted-foreground mb-10 opacity-0 animate-stagger-fade-up"
            style={{ animationDelay: "200ms" }}
          >
            Select your role to continue
          </p>

          {/* Role Cards — stagger delay 350ms, 450ms, 550ms */}
          <div className="grid md:grid-cols-3 gap-6">
            {(
              Object.entries(roleConfig) as [
                UserRole,
                typeof roleConfig.student,
              ][]
            ).map(([role, config], index) => {
              const Icon = config.icon;
              return (
                <div
                  key={role}
                  className="opacity-0 animate-stagger-fade-up"
                  style={{ animationDelay: `${350 + index * 100}ms` }}
                >
                  <Card
                    className="h-full cursor-pointer transition-all duration-300
                      surface-translucent-2 border border-border shadow-elevated
                      hover:surface-translucent-3 hover:border-foreground/20 hover:scale-[1.01]
                      rounded-panel"
                    onClick={() => handleRoleSelect(role)}
                    onMouseEnter={() => setHoveredRoleIndex(index)}
                    onMouseLeave={() => setHoveredRoleIndex(null)}
                  >
                    <CardHeader className="text-center pb-4">
                      <div className="mx-auto w-14 h-14 rounded-full surface-translucent-3 border border-border flex items-center justify-center mb-4">
                        <Icon className="w-7 h-7 text-foreground" />
                      </div>
                      <CardTitle className="text-xl font-semibold text-foreground">
                        {config.title}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {config.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full" variant="outline">
                        Continue as {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ========== LOGIN / SIGNUP FORM ==========
  const config = roleConfig[selectedRole];
  const Icon = config.icon;

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-background">
        <div className="absolute inset-0 surface-1" />
        <FloatingDoodles />

        <Card
          className={`relative w-full max-w-md rounded-panel surface-translucent-2 border border-border shadow-dialog z-10 ${pageState === "transitioning"
            ? "animate-scale-out-fade"
            : "animate-scale-in-fade"
            }`}
        >
          <CardHeader className="text-center space-y-4 relative">
            {/* Back button — icon-only, matching theme toggle style */}
            <button
              onClick={handleBack}
              className="absolute left-5 top-5 rounded-full w-9 h-9 p-0 flex items-center justify-center
                surface-translucent-2 border border-standard
                text-foreground/80 hover:text-foreground
                hover:surface-translucent-3
                transition-all duration-200 cursor-pointer"
              title="Back to role selection"
              aria-label="Back to role selection"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="absolute right-5 top-1">
              <ThemeToggle />
            </div>

            <div className="mx-auto w-14 h-14 rounded-full surface-translucent-3 border border-border flex items-center justify-center mb-2">
              <Icon className="w-7 h-7 text-foreground" /> {/* icon on login/sign up box */}
            </div>

            <CardTitle className="text-2xl font-semibold tracking-tight">
              {config.title}
            </CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs
              value={authMode}
              onValueChange={(v) => setAuthMode(v as AuthMode)}
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>


              {/* form for sign up */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {authMode === "signup" && (
                  <div className="animate-fade-in space-y-4">
                    <div className="space-y-1.5">
                      <Label>Full Name</Label>
                      <Input
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>

                    {selectedRole === "student" && (
                      <div className="space-y-1.5 animate-fade-in">
                        <Label>University ID (UID)</Label>
                        <Input
                          placeholder="Enter your UID"
                          value={uid}
                          onChange={(e) => setUid(e.target.value)}
                          required
                        />
                      </div>
                    )}

                    {/* Email */}
                    <div className="space-y-1.5 relative">
                      <Label>Email</Label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          className="pl-10"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* input part for login */}
                {authMode === "login" && (
                  <div className="animate-fade-in space-y-4">
                    {/* Email — shown for ALL roles (Firebase Auth requires email) */}
                    <div className="space-y-1.5 relative">
                      <Label>Email</Label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          className="pl-10"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Password */}
                <div className="space-y-1.5 relative">
                  <Label>Password</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-10 pr-10"
                      type={showPwd ? "text" : "password"}
                      placeholder="•••••••"
                      value={password}
                      minLength={6}
                      required
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      {showPwd ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {authMode === "login" && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer"
                    >
                      Forgot Password?{" "}
                      {/* not working right now, it will be after integration with backend*/}
                    </button>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  ) : (
                    authMode === "login" ? "Login" : "Create Account"
                  )}
                </Button>
              </form>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* footer */}
      <footer className="surface-2 border-t border-border">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          © 2026 University Event Management System. All rights reserved.
        </div>
      </footer>
    </>
  );
};

export default LoginPage;
