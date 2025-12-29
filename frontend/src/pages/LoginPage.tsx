import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import { useAppDispatch } from "../store/hooks";
import { setCredentials } from "../store/slices/authSlice";
import api from "../lib/axios";
import { loginSchema, type LoginInput } from "../lib/validators/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const LoginPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      const res = await api.post("/auth/login", data);
      dispatch(setCredentials({
        user: res.data.id,
        accessToken: res.data.accessToken,
        role: res.data.role
      }));
      navigate("/");
    } catch (error: any) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center  justify-center p-4">
      <Card className="w-[40%] min-w-[400px] shadow-xl border-gray-200">
        
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-4xl font-bold text-blue-600 mb-2">
            BigBiddie
          </CardTitle>
          <p className="text-base text-gray-500">Welcome back! Please login to your account.</p>
        </CardHeader>

        <CardContent className="px-10 pb-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" className="h-12 text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-base">Password</FormLabel>
                      <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="••••••" className="h-12 text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 space-y-4">
                <Button type="submit" variant="default" className="bg-primary w-full h-12 text-lg">
                  Sign In
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or</span>
                  </div>
                </div>

                <Button 
                  variant="secondary" 
                  type="button" 
                  className="w-full h-12 text-base"
                  onClick={() => navigate("/register")}
                >
                  Create New Account
                </Button>
              </div>

            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;