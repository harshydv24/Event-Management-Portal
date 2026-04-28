import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, RefreshCw, LogOut, CheckCircle, Loader2, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const VerifyEmail: React.FC = () => {
  const { user, isEmailVerified, resendVerificationEmail, refreshVerificationStatus, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Auto-check verification status every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const verified = await refreshVerificationStatus();
      if (verified && user) {
        navigate(`/${user.role}`);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [refreshVerificationStatus, navigate, user]);

  // Redirect if already verified
  useEffect(() => {
    if (isEmailVerified && user) {
      navigate(`/${user.role}`);
    }
  }, [isEmailVerified, user, navigate]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await resendVerificationEmail();
      setCooldown(60); // 60 second cooldown
      toast({
        title: 'Email sent!',
        description: 'Verification email has been resent. Check your inbox and spam folder.',
      });
    } catch {
      toast({
        title: 'Failed to send',
        description: 'Please wait a moment and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckStatus = async () => {
    setIsChecking(true);
    const verified = await refreshVerificationStatus();
    if (verified && user) {
      toast({ title: 'Email verified!', description: 'Redirecting to dashboard...' });
      navigate(`/${user.role}`);
    } else {
      toast({
        title: 'Not verified yet',
        description: 'Please click the link in your email first.',
        variant: 'destructive',
      });
    }
    setIsChecking(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md text-center shadow-dialog border border-border">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 surface-translucent-3 border border-border rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription className="text-base">
            We've sent a verification link to{' '}
            <span className="font-semibold text-foreground">{user?.email}</span>.
            <br />
            Please check your inbox and click the link to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="surface-translucent-2 border border-border rounded-card p-4 text-sm text-muted-foreground">
            <Lightbulb className="w-4 h-4 inline-block mr-1 -mt-0.5 text-primary" /> Don't forget to check your <strong className="text-foreground">spam/junk folder</strong> if you don't see the email.
          </div>

          <Button
            onClick={handleCheckStatus}
            className="w-full"
            disabled={isChecking}
          >
            {isChecking ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking...</>
            ) : (
              <><CheckCircle className="mr-2 h-4 w-4" /> I've Verified My Email</>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleResend}
            className="w-full"
            disabled={isResending || cooldown > 0}
          >
            {isResending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
            ) : cooldown > 0 ? (
              <><RefreshCw className="mr-2 h-4 w-4" /> Resend in {cooldown}s</>
            ) : (
              <><RefreshCw className="mr-2 h-4 w-4" /> Resend Verification Email</>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full text-muted-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign Out & Use Different Email
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
