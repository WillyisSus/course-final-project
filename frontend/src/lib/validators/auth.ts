import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  full_name: z.string().min(2, "Full name is required"),
  address: z.string().min(5, "Address is required"),
  // We'll accept string for date input flexibility, or standard Date object
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid Date"), 
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;