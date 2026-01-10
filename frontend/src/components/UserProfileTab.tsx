import { useEffect, useState } from "react";
import { Link } from "react-router";
import api from "@/lib/axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDispatch } from "react-redux";
import { logOut } from "@/store/slices/authSlice";
import { store } from "@/store/store";
import { profileSchema, updatePasswordSchema } from "@/lib/validators/auth";
import type { UpdateAccountInput, UpdatePasswordInput } from "@/lib/validators/auth";
import { toast } from "sonner";
import { useAppSelector } from "@/store/hooks";

// Icons
import {
  User,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  Edit,
  Lock,
  ArrowUpCircle,
  Clock,
  Loader2,
  MapPin,
  AlertTriangle,
  KeyRound,
  Pencil,
  Calendar,
  Eye,
  EyeOff,
  ThumbsUp
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

// --- TYPES & SCHEMAS ---

interface UpgradeRequest {
  request_id: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
}

const UserProfileTab = () => {
  const { user } = useAppSelector((state) => state.auth);
  
  // State: Upgrade Request
  const [request, setRequest] = useState<UpgradeRequest | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(false);

  // State: Modals & Form Data
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [fullUserData, setFullUserData] = useState<any>(null); // For prefilling form (address, dob)
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- FORMS ---
  const profileForm = useForm<UpdateAccountInput>({
      resolver: zodResolver(profileSchema),
      defaultValues: { full_name: user?.full_name || "", address: user?.address || "", email: user?.email || "", dob: user?.dob || ""},
  });

  const passwordForm = useForm<UpdatePasswordInput>({
      resolver: zodResolver(updatePasswordSchema),
      defaultValues: { old_password: "", new_password: "", confirm_password: "" },
  });

  // 1. Fetch Upgrade Request Status
  useEffect(() => {
    const fetchUpgradeRequest = async () => {
      if (!user || user.role !== "BIDDER") return;
      try {
        const res = await api.get(`/upgrade-requests?user_id=${user.user_id}`);
        if (res.data.data && res.data.data.length > 0) {
          setRequest(res.data.data[0]);
        }
      } catch (error) {
        console.error("Failed to check upgrade status", error);
      }
    };
    fetchUpgradeRequest();
  }, [user?.user_id, user?.role]);

  // 2. Fetch Full User Data (for Form Prefill)
  useEffect(() => {
    const fetchUserData = async () => {
        try {
            const res = await api.get('/users/account');
            setFullUserData(res.data.data);
        } catch (error) {
            console.error("Failed to fetch full user data", error);
        }
    };
    if (user) fetchUserData();
  }, [user]);

  // 3. Prefill Profile Form when Modal Opens
  useEffect(() => {
    if (isProfileModalOpen && fullUserData) {
        profileForm.reset({
            email: fullUserData.email || "",
            full_name: fullUserData.full_name || "",
            address: fullUserData.address || "",
            dob: fullUserData.dob || "",
        });
    }
  }, [isProfileModalOpen, fullUserData, profileForm]);


  // --- HANDLERS ---

  const handleRequestUpgrade = async () => {
    setLoadingRequest(true);
    try {
      const payload = { reason: "I want to be a Seller for a special week" };
      const res = await api.post("/upgrade-requests", payload);
      setRequest(res.data.data);
      toast.success("Request submitted successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit request");
    } finally {
      setLoadingRequest(false);
    }
  };

  const onProfileSubmit = async (data: UpdateAccountInput) => {
    try {
        await api.put('/auth/update-account', data);
        setIsProfileModalOpen(false);
        toast.success("Account updated successfully! Please log in again.");
        store.dispatch(logOut()); 
    } catch (error: any) {
        console.error("Profile update failed", error);
        toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  const onPasswordSubmit = async (data: UpdatePasswordInput) => {
    try {
        await api.put('/auth/change-password', {
            old_password: data.old_password,
            new_password: data.new_password
        });
        setIsPasswordModalOpen(false);
        passwordForm.reset();
        toast.success("Password changed successfully.");
    } catch (error: any) {
        console.error("Password change failed", error);
        toast.error(error.response?.data?.message || "Failed to change password");
    }
  };

  // --- SCORE CALCULATION ---
  const calculateScore = () => {
    if (!user) return 0;
    const pos = Number(user.positive_rating || 0);
    const neg = Number(user.negative_rating || 0);
    const total = pos + neg;
    return total > 0 ? Math.round((pos / total) * 100) : 0;
  };

  if (!user) return <div className="p-10 text-center text-muted-foreground">Please log in to view your profile.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
      
      {/* LEFT COLUMN: User Card & Upgrade Request */}
      <div className="md:col-span-1">
        <Card className="h-full">
          <CardHeader className="flex flex-col items-center text-center pb-4">
            <Avatar className="w-24 h-24 mb-4">
              <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                {user.full_name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <CardTitle>{user.full_name}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col items-center gap-4">
            {/* Status Badges Container */}
            <div className="flex flex-wrap justify-center gap-2 w-full">
                {/* Verification Badge */}
                <Badge
                    variant={user.is_verified ? "default" : "destructive"}
                    className="gap-1.5 py-1 px-3"
                >
                    {user.is_verified ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {user.is_verified ? "Verified" : "Unverified"}
                </Badge>

                {/* Positive Score Badge */}
                <Badge 
                    variant="secondary" 
                    className="gap-1.5 py-1 px-3 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {calculateScore()}% Positive
                </Badge>
            </div>

            <Separator />

            {/* UPGRADE SELLER LOGIC */}
            {user.role === "BIDDER" && (
              <div className="w-full">
                {request ? (
                  <div className="bg-muted/50 p-4 rounded-lg border text-sm space-y-3 w-full text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-muted-foreground">Request Status</span>
                      {request.status === "PENDING" && <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">Pending</Badge>}
                      {request.status === "APPROVED" && <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Approved</Badge>}
                      {request.status === "REJECTED" && <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Rejected</Badge>}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase">Submitted On</p>
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        {new Date(request.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={handleRequestUpgrade}
                    disabled={loadingRequest}
                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loadingRequest ? "Submitting..." : <><ArrowUpCircle className="w-4 h-4" /> Request to be Seller</>}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COLUMN: Account Details & Action Buttons */}
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-muted-foreground" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</label>
                <p className="font-medium text-foreground">{user.full_name}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium text-foreground">{user.email}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Role</label>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium text-foreground">{user.role}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User ID</label>
                <p className="font-medium text-foreground">#{user.user_id}</p>
              </div>
              {/* Display Address if available from full fetch */}
              <div className="space-y-1.5">
                 <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Address</label>
                 <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium text-foreground">{fullUserData?.address || "No address provided"}</p>
                 </div>
              </div>
              <div className="space-y-1.5">
                 <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date of birth</label>
                 <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p className="font-medium text-foreground">{fullUserData?.dob || "No birthday"}</p>
                 </div>
              </div>
            </div>

            <Separator />

            {/* ACTION BUTTONS (Now Active) */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                className="gap-2" 
                onClick={() => setIsProfileModalOpen(true)}
              >
                  <Edit className="w-4 h-4" /> Update Information
              </Button>
              <Button 
                variant="outline" 
                className="gap-2" 
                onClick={() => setIsPasswordModalOpen(true)}
              >
                  <Lock className="w-4 h-4" /> Change Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- MODAL 1: UPDATE PROFILE --- */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle>Update Profile</DialogTitle>
                <DialogDescription>
                    Update your personal information below. You will need to log in again after saving.
                </DialogDescription>
            </DialogHeader>

            {/* Warning Note */}
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex gap-3 items-start text-sm text-amber-800">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                    <span className="font-semibold block mb-1">Important:</span>
                    Please ensure your email is valid. You will need it to use the "Forgot Password" feature if you lose access to your account.
                </div>
            </div>

            <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4 py-2">
                    <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl><Input placeholder="john@example.com" type="email" {...field} value={field.value || ""} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={profileForm.control}
                        name="full_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl><Input placeholder="John Doe" {...field} value={field.value || ""} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={profileForm.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl><Input placeholder="123 Main St..." {...field} value={field.value || ""} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={profileForm.control}
                        name="dob"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Date of Birth</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="date" 
                                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                        onChange={(e) => field.onChange(e.target.value ? e.target.value.toString() : null)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsProfileModalOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                            {profileForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>

      {/* --- MODAL 2: CHANGE PASSWORD --- */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
                <DialogDescription>Enter your current password and a new strong password.</DialogDescription>
            </DialogHeader>
            <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                        control={passwordForm.control}
                        name="old_password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Current Password</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input 
                                            type={showOldPassword ? "text" : "password"} 
                                            {...field} 
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowOldPassword(!showOldPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={passwordForm.control}
                        name="new_password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input 
                                            type={showNewPassword ? "text" : "password"} 
                                            {...field} 
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={passwordForm.control}
                        name="confirm_password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input 
                                            type={showConfirmPassword ? "text" : "password"} 
                                            {...field} 
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsPasswordModalOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={passwordForm.formState.isSubmitting}>Update Password</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserProfileTab;