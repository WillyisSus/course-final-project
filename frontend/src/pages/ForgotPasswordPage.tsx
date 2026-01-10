import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useNavigate } from "react-router";
import { z } from "zod";
import api from "@/lib/axios";
import { Eye, EyeOff, ArrowLeft, Mail, Lock } from "lucide-react";
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

const requestSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

// 2. Schema for Resetting Password
const resetSchema = z.object({
  email: z.email("Please enter a valid email address"),
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

type RequestInputs = z.infer<typeof requestSchema>;
type ResetInputs = z.infer<typeof resetSchema>;

const ForgotPasswordPage = () => {
  const { token } = useParams<{ token?: string }>(); // Check for token in URL
  const navigate = useNavigate();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestForm = useForm<RequestInputs>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: "" },
  });

  const resetForm = useForm<ResetInputs>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });


  const onRequestSubmit = async (data: RequestInputs) => {
    setIsSubmitting(true);
    try {
      await api.post("/auth/forgot-password", data);
      toast.success("If that email exists, we've sent a reset link!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send reset link.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResetSubmit = async (data: ResetInputs) => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      await api.post("/auth/reset-password", {
        email: data.email,
        new_password: data.password,
        token: token 
      });
      toast.success("Password reset successfully! Please login.");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reset password. Link might be expired.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-[60%] min-w-[400px] shadow-xl border-gray-200">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-3xl font-bold text-blue-600 mb-2">
            {token ? "Reset Password" : "Forgot Password?"}
          </CardTitle>
          <CardDescription className="text-base text-gray-500">
            {token 
              ? "Enter your email and new password to restore access."
              : "Enter your email address and we'll send you a link to reset your password."
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="px-10 pb-10">
          {!token ? (
            <Form {...requestForm}>
              <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="space-y-6">
                <FormField
                  control={requestForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                            <Input 
                                placeholder="john@example.com" 
                                className="h-12 text-base pl-10" 
                                {...field} 
                            />
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
                    {isSubmitting ? "Sending..." : "Send Reset Link"}
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
          ) : (
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-6">
                 <FormField
                  control={resetForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Confirm Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" className="h-12 text-base" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={resetForm.control}
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
                            {showPassword ? (
                                <EyeOff className="h-5 w-5 text-gray-400" />
                            ) : (
                                <Eye className="h-5 w-5 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={resetForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Confirm New Password</FormLabel>
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
                            {showConfirmPassword ? (
                                <EyeOff className="h-5 w-5 text-gray-400" />
                            ) : (
                                <Eye className="h-5 w-5 text-gray-400" />
                            )}
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
                     Cancel
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;