import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router";
import api from "../lib/axios";
import { registerSchema, type RegisterInput } from "../lib/validators/auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const RegisterPage = () => {
  const navigate = useNavigate();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { 
      email: "", password: "", confirmPassword: "", 
      full_name: "", address: "", dob: "" 
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      const { confirmPassword, ...payload } = data;
      await api.post("/auth/register", payload);
      navigate("/login");
    } catch (error) {
      console.error("Registration failed", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-[40%] min-w-[400px] shadow-xl border-gray-200">
        
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-4xl font-bold text-blue-600 mb-2">
            BigBiddie
          </CardTitle>
          <p className="text-base text-gray-500">Create an account to start bidding!</p>
        </CardHeader>

        <CardContent className="px-10 pb-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Row 1: Full Name */}
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" className="h-12 text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Row 2: Email */}
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

              {/* Row 3: Grid for Address & DOB */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" className="h-12 text-base" {...field} />
                      </FormControl>
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
                      <FormControl>
                        <Input placeholder="123 Main St" className="h-12 text-base" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Row 4: Password & Confirm Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Password</FormLabel>
                      <FormControl>
                        <Input type="password" className="h-12 text-base" {...field} />
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
                        <Input type="password" className="h-12 text-base" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-6">
                <Button type="submit" variant={"default"} className="w-full h-12 text-lg font-bold">
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