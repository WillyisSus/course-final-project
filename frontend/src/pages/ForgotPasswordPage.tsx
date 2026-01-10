import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router"; 
import { z } from "zod";
import api from "@/lib/axios";
import { Eye, EyeOff, ArrowLeft, Mail, Lock, KeyRound, Timer } from "lucide-react";
import { toast } from "sonner";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

// --- VALIDATION SCHEMA ---
const forgotPasswordSchema = z.object({
  email: z.email("Please enter a valid email address"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[a-z]/, "Must contain a lowercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[^a-zA-Z0-9]/, "Must contain a special character"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ForgotPasswordInputs = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  
  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0); // Countdown timer in seconds
  const [loadingOtp, setLoadingOtp] = useState(false);

  // Countdown Effect
  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const form = useForm<ForgotPasswordInputs>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { 
      email: "", 
      otp: "", 
      password: "", 
      confirmPassword: "" 
    },
  });

  // --- HANDLERS ---

  // 1. Send OTP
  const handleSendOtp = async () => {
    // Validate only email field first
    const isEmailValid = await form.trigger("email");
    if (!isEmailValid) return;

    const email = form.getValues("email");
    setLoadingOtp(true);

    try {
      // Assuming this endpoint sends the OTP email
      await api.post("/auth/forgot-password", { email });
      
      toast.success("OTP code sent to your email!");
      setOtpSent(true);
      setTimer(60); // Start 60s cooldown
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoadingOtp(false);
    }
  };

  // 2. Submit Reset
  const onSubmit = async (data: ForgotPasswordInputs) => {
    setIsSubmitting(true);
    try {
      await api.post("/auth/reset-password", {
        email: data.email,
        otp: data.otp,
        new_password: data.password,
      });
      
      toast.success("Password reset successfully! Please login.");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reset password. Check OTP and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-[60%] min-w-[400px] shadow-xl border-gray-200">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-3xl font-bold text-blue-600 mb-2">
            Reset Password
          </CardTitle>
          <CardDescription className="text-base text-gray-500">
            Enter your email to receive a verification code, then set your new password.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-10 pb-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              
              {/* Email Field with OTP Button */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Email Address</FormLabel>
                    <div className="flex gap-3">
                      <FormControl>
                        <div className="relative w-full">
                            <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                            <Input 
                                placeholder="john@example.com" 
                                className="h-12 text-base pl-10" 
                                {...field} 
                                disabled={otpSent && timer > 0} // Optional: Lock email while timer runs
                            />
                        </div>
                      </FormControl>
                      <Button 
                        type="button"
                        className="h-12 w-32 shrink-0"
                        variant={otpSent ? "outline" : "default"}
                        onClick={handleSendOtp}
                        disabled={loadingOtp || timer > 0}
                      >
                        {loadingOtp ? (
                          "Sending..."
                        ) : timer > 0 ? (
                          <span className="flex items-center gap-1 text-orange-600">
                            <Timer className="w-4 h-4" /> {timer}s
                          </span>
                        ) : (
                          otpSent ? "Resend" : "Get OTP"
                        )}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="my-2" />

              {/* OTP Field */}
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">OTP Code</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                        <Input 
                            placeholder="123456" 
                            maxLength={6}
                            className="h-12 text-base pl-10 tracking-widest" 
                            {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* New Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••"
                          className="h-12 text-base pl-10 pr-10"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirm Password */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••"
                          className="h-12 text-base pl-10 pr-10"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 space-y-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 font-bold"
                >
                  {isSubmitting ? "Resetting..." : "Reset Password"}
                </Button>
                <Button 
                  variant="ghost" 
                  type="button" 
                  className="w-full text-gray-600" 
                  onClick={() => navigate("/login")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;