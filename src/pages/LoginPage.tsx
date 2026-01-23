import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Users, Building2, ArrowLeft, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AuthMode = 'login' | 'signup';

const roleConfig = {
  student: {
    icon: GraduationCap,
    title: 'Student Portal',
    description: 'View and register for campus events',
    color: 'bg-student text-student-foreground',
    borderColor: 'border-student',
  },
  club: {
    icon: Users,
    title: 'Club Portal',
    description: 'Manage your club and create events',
    color: 'bg-club text-club-foreground',
    borderColor: 'border-club',
  },
  department: {
    icon: Building2,
    title: 'Department Portal',
    description: 'Approve and oversee campus events',
    color: 'bg-department text-department-foreground',
    borderColor: 'border-department',
  },
};

const LoginPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [uid, setUid] = useState('');

  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setIsLoading(true);

    try {
      if (authMode === 'login') {
        const success = await login(email, password, selectedRole);
        if (success) {
          toast({ title: 'Welcome back!😛', description: 'You have successfully logged in.' });
          navigate(`/${selectedRole}`);
        } else {
          toast({ title: 'Login failed🥺', description: 'Kindly re-check your credentials', variant: 'destructive' });
        }
      } else {
        const success = await signup(email, password, name, selectedRole, uid);
        if (success) {
          toast({ title: 'Account created!🥳', description: 'Welcome to the Event Portal.' });
          navigate(`/${selectedRole}`);
        } else {
          toast({ title: 'Signup failed', description: 'An account with this email already exists.', variant: 'destructive' });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setUid('');
  };

  // ========== ROLE SELECTION PAGE UI UPGRADE ==========
  if (!selectedRole) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">

        {/* Mixed campus + event background */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-90"
            style={{ backgroundImage: "url('bac-1.jpg')" }}
          />
          <div className="absolute inset-0 backdrop-blur-[5px] bg-black/40" />
        </div>

        <div className="relative w-full max-w-5xl text-white animate-fade-in">
          <h1 className="text-5xl font-extrabold tracking-tight mb-3">
            Event Management Portal
          </h1>
          <p className="text-lg text-gray-200 mb-10">
            Select your role to continue
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {(Object.entries(roleConfig) as [UserRole, typeof roleConfig.student][]).map(([role, config]) => {
              const Icon = config.icon;
              return (
                <Card
                  key={role}
                  className="cursor-pointer transition-all duration-300 bg-white/10 backdrop-blur-lg border border-white/20 hover:border-white/40 hover:shadow-2xl hover:-translate-y-1 rounded-xl"
                  onClick={() => { setSelectedRole(role); resetForm(); }}
                >
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto w-14 h-14 rounded-full bg-white/80 flex items-center justify-center mb-4 shadow-md">
                      <Icon className="w-7 h-7 text-gray-800" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-white">
                      {config.title}
                    </CardTitle>
                    <CardDescription className="text-gray-200">
                      {config.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" variant="secondary">
                      Continue as {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ========== LOGIN / SIGNUP FORM UI UPGRADE ==========
  const config = roleConfig[selectedRole];
  const Icon = config.icon;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-700/20 via-purple-700/20 to-pink-600/20 backdrop-blur-md" />

      <Card className="relative w-full max-w-md shadow-2xl border border-white/20 backdrop-blur-xl bg-white/90 animate-scale-in">
        <CardHeader className="text-center space-y-3 relative">
          <Button
            variant="ghost"
            className="absolute left-4 top-4"
            onClick={() => setSelectedRole(null)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-2">
            <Icon className="w-7 h-7" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
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


            <form onSubmit={handleSubmit} className="space-y-4">

              {/* changed below this @rishabh */}
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
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
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

              {/* Created this */}
              {authMode === "login" && (
                <div className="animate-fade-in space-y-4">

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
                  {selectedRole === "club" && (                  
                  <div className="space-y-1.5 relative">
                    <Label>Email</Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
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
                  )}

                  {/* Email */}
                  {selectedRole === "department" && (                  
                  <div className="space-y-1.5 relative">
                    <Label>Email</Label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
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
                  )}
                </div>
              )}

              {/* Password */}
              <div className="space-y-1.5 relative">
                <Label>Password</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
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
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {authMode === "login" ? "Login" : "Create Account"}
              </Button>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
