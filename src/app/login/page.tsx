"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("91");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in both email and password");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const supabase = createClient();
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError("");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "An error occurred during Google sign in");
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setError("Please enter your mobile number");
      return;
    }
    
    try {
      setIsLoading(true);
      setError("");
      const supabase = createClient();
      
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: `+${countryCode}${phone}`,
      });

      if (otpError) throw otpError;
      
      setShowOtpInput(true);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter the OTP sent to your phone");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const supabase = createClient();
      
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: `+${countryCode}${phone}`,
        token: otp,
        type: 'sms'
      });

      if (verifyError) throw verifyError;

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] w-full flex">
      {/* Left side - Branding/Image */}
      <div className="hidden lg:flex w-1/2 bg-primary relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-secondary opacity-90 z-0" />
        {/* Subtle decorative pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div className="relative z-10 text-white max-w-lg">
          <Link href="/" className="inline-block mb-12">
            <span className="font-serif text-4xl font-bold tracking-tight">
              Jodibanao
            </span>
          </Link>
          <h1 className="text-4xl lg:text-5xl font-serif font-bold leading-tight mb-6">
            Welcome back to your perfect match.
          </h1>
          <p className="text-white/80 text-lg mb-8">
            Log in to continue your journey, view your matches, and connect with people who share your values.
          </p>
          
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-xl">
            <p className="italic font-serif text-lg mb-4">&quot;We found each other on Jodibanao. It was an instant connection because our core values aligned perfectly.&quot;</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">A&S</div>
              <div>
                <p className="font-semibold text-sm">Amit & Sneha</p>
                <p className="text-xs text-white/60">Matched Oct 2024</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-block">
              <span className="font-serif text-3xl font-bold tracking-tight text-primary">
                Jodibanao
              </span>
            </Link>
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-serif font-bold text-foreground mb-2">Login to your account</h2>
            <p className="text-muted-foreground">Don&apos;t have an account? <Link href="/register" className="text-primary hover:underline font-medium">Sign up</Link></p>
          </div>

          <Card className="border-border/50 shadow-lg shadow-primary/5">
            <CardContent className="pt-6">
              <div className="flex bg-muted/50 p-1 rounded-lg mb-6">
                <button 
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${loginMethod === "password" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/50"}`}
                  onClick={() => setLoginMethod("password")}
                >
                  Email & Password
                </button>
                <button 
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${loginMethod === "otp" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/50"}`}
                  onClick={() => setLoginMethod("otp")}
                >
                  Login with OTP
                </button>
              </div>

              {loginMethod === "password" ? (
                <form className="space-y-4" onSubmit={handleLogin}>
                  {error && (
                    <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md font-medium">
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="name@example.com" 
                      className="bg-white" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input 
                        id="password" 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        className="bg-white pr-10" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary-hover text-white py-6 mt-2 text-md font-semibold font-sans"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    Log in
                  </Button>
                </form>
              ) : (
                <form className="space-y-4" onSubmit={showOtpInput ? handleVerifyOtp : handleSendOtp}>
                  {!showOtpInput ? (
                    <div className="space-y-2">
                      <Label htmlFor="phone">Mobile Number</Label>
                      <div className="flex gap-2">
                        <Select value={countryCode} onValueChange={(v) => setCountryCode(v ?? "91")}>
                          <SelectTrigger className="w-[80px] bg-white">
                            <SelectValue placeholder="+91" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="91">+91</SelectItem>
                            <SelectItem value="1">+1</SelectItem>
                            <SelectItem value="44">+44</SelectItem>
                            <SelectItem value="971">+971</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input 
                          id="phone" 
                          type="tel" 
                          placeholder="98765 43210" 
                          className="flex-1 bg-white" 
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="otp">Enter 6-digit OTP</Label>
                      <Input 
                        id="otp" 
                        type="text" 
                        placeholder="123456" 
                        className="bg-white text-center tracking-widest text-lg" 
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                      />
                    </div>
                  )}
                  <Button 
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-hover text-white py-6 mt-2 text-md font-semibold font-sans"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    {showOtpInput ? "Verify & Log in" : "Send OTP"}
                  </Button>
                  
                  {showOtpInput && (
                    <div className="text-center mt-4">
                      <Button 
                        type="button" 
                        variant="link" 
                        className="text-xs text-muted-foreground"
                        onClick={() => setShowOtpInput(false)}
                      >
                        Change mobile number
                      </Button>
                    </div>
                  )}
                </form>
              )}

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground font-medium">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Button 
                  variant="outline" 
                  className="w-full bg-white hover:bg-muted py-6" 
                  type="button" 
                  onClick={handleGoogleLogin} 
                  disabled={isLoading}
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign in with Google
                </Button>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col text-center border-t border-border/50 bg-muted/20 py-4">
              <p className="text-xs text-muted-foreground px-6">
                By logging in, you agree to our <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link> and <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
