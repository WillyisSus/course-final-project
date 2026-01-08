import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "../lib/axios";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { verifyUserSuccess } from "../store/slices/authSlice";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

// Simple Schema for 6-digit OTP
const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
});

type OtpInput = z.infer<typeof otpSchema>;

const VerifyOtpPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const form = useForm<OtpInput>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  // --- SUBMIT OTP ---
  const onSubmit = async (data: OtpInput) => {
    setLoading(true);
    try {
      // POST to backend
      await api.post("/auth/verify-otp", { otp: data.otp });

      // Update Redux state immediately
      dispatch(verifyUserSuccess());

      // Success Feedback
      // toast.success("Account Verified Successfully!");

      // Redirect to Home
      navigate("/");
    } catch (error: any) {
      console.error("Verification failed", error);
      form.setError("root", {
        message: error.response?.data?.message || "Invalid or Expired OTP Code",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- RESEND OTP ---
  const handleResend = async () => {
    setResending(true);
    try {
      await api.get("/auth/verify-otp");
      toast.info("A new code has been sent to your email."); // Or use toast
      form.clearErrors();
    } catch (error: any) {
      console.error("Resend failed", error);
      toast.error(error.response?.data?.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-gray-200 text-center">
        <CardHeader className="pb-6">
          <div className="mx-auto bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="text-blue-600 w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Verify Your Account
          </CardTitle>
          <CardDescription>
            We have sent a 6-digit verification code to
            <br />
            <span className="font-semibold text-gray-900">{user?.email}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="px-10 pb-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">OTP Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123456"
                        className="text-center text-3xl tracking-[0.5em] h-16 font-bold border-2 focus-visible:ring-blue-500"
                        maxLength={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Backend Error Message Display */}
              {form.formState.errors.root && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600 font-medium">
                  {form.formState.errors.root.message}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 font-bold transition-all"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" /> Verifying...
                  </>
                ) : (
                  "Verify & Continue"
                )}
              </Button>

              <div className="text-sm text-gray-500 flex flex-col items-center gap-2 pt-2">
                <p>Didn't receive the code?</p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-blue-600 font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resending ? "Sending..." : "Click to Resend OTP"}
                </button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyOtpPage;
