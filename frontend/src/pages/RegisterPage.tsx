import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router";
import ReCAPTCHA from "react-google-recaptcha"; // <--- Import this
import api from "../lib/axios";
import { registerSchema, type RegisterInput } from "../lib/validators/auth";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const RegisterPage = () => {
  const navigate = useNavigate();
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  
  // State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null); // <--- Store token

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { 
      email: "", password: "", confirmPassword: "", 
      full_name: "", address: "", dob: ""
    },
  });

  const onCaptchaChange = (token: string | null) => {
    console.log(token)
    setCaptchaToken(token);
  };

  const onSubmit = async (data: RegisterInput) => {
    // 1. Block if Captcha is missing
    if (!captchaToken) {
      alert("Please verify that you are not a robot.");
      return;
    }

    try {
      const { confirmPassword, ...payload } = data;
      const registerBody = {
        ...payload,
        recaptcha_token: captchaToken
      }
      console.log(registerBody)
      console.log();
      // 2. Send token to backend along with form data
      await api.post("/auth/register", registerBody)
      
      navigate("/login");
    } catch (error) {
      console.error("Registration failed", error);
      recaptchaRef.current?.reset(); // Reset captcha on error
      setCaptchaToken(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-[60%] min-w-[400px] shadow-xl border-gray-200">
        
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-4xl font-bold text-blue-600 mb-2">
            BigBiddie
          </CardTitle>
          <p className="text-base text-gray-500">Create an account to start bidding!</p>
        </CardHeader>

        <CardContent className="px-10 pb-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* --- (Existing Input Fields: Name, Email, Address, DOB...) --- */}
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Full Name</FormLabel>
                    <FormControl><Input placeholder="John Doe" className="h-12 text-base" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Email</FormLabel>
                    <FormControl><Input placeholder="john@example.com" className="h-12 text-base" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Date of Birth</FormLabel>
                      <FormControl><Input type="date" className="h-12 text-base" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Address</FormLabel>
                      <FormControl><Input placeholder="123 Main St" className="h-12 text-base" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showPassword ? "text" : "password"} className="h-12 text-base pr-10" {...field} />
                          <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Confirm Password</FormLabel>
                      <FormControl>
                         <div className="relative">
                          <Input type={showConfirmPassword ? "text" : "password"} className="h-12 text-base pr-10" {...field} />
                          <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                            {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* --- NEW: ReCAPTCHA Section --- */}
              <div className="flex justify-center pt-2">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey="6Ld9XDosAAAAAImp6oFiP21_oK-kTc5MX0NZfF1Z" // <--- Paste your Site Key here
                  onChange={onCaptchaChange}
                />
              </div>

              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={!captchaToken} // Optional: Disable button until verified
                  className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 font-bold disabled:opacity-50"
                >
                  Create Account
                </Button>
                
                <div className="mt-4 text-center text-sm text-gray-500">
                  Already have an account?{" "}
                  <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                    Login here
                  </Link>
                </div>
              </div>

            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;