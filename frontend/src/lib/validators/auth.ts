import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export const updatePasswordSchema = z.object({
  old_password: z.string().min(8, { message: "Old password must be at least 8 characters long" }),
  new_password: z.string()
    .min(8, { message: "New password must be at least 8 characters long" })
    .regex(/[A-Z]/, { message: "New password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "New password must contain at least one lowercase letter" }) 
    .regex(/[0-9]/, { message: "New password must contain at least one number" })
    .regex(/[^a-zA-Z0-9]/, { message: "New password must contain at least one special character" }),
    confirm_password: z.string().min(8, "Password must be at least 8 characters"),
  
}).refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
});;
export const profileSchema = z.object({
    address: z.string().min(3, "Username must be at least 3 characters"),
    full_name: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.email("Please enter a valid email address"),
    dob: z.string().refine((val) => !isNaN(Date.parse(val)), {
        error: "Invalid date format",
    }),
});

export const registerSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string()
  .min(8, { message: "Password must be at least 8 characters long" })
  .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
  .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
  .regex(/[0-9]/, { message: "Password must contain at least one number" })
  .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character" }),
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
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type UpdateAccountInput = z.infer<typeof profileSchema>;