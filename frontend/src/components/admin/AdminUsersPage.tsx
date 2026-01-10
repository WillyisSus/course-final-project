import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/axios";
import { 
    Check, 
    X, 
    Trash2, 
    MoreHorizontal, 
    Plus, 
    Search,
    UserCog,
    KeyRound,
    ShieldAlert,
    Loader2,
    CalendarIcon,
    ArrowUpCircle
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";


interface User {
    user_id: number;
    email: string;
    address?: string;
    dob?: string;
    full_name: string;
    positive_rating: string;
    negative_rating: string;
    seller_exp_date?: string;
    role: 'BIDDER' | 'SELLER' | 'ADMIN';
    is_verified: boolean;
}

interface UpgradeRequest {
    request_id: number;
    user_id: number;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    created_at: string;
    user: {
        user_id: number;
        full_name: string;
        positive_rating: string;
        negative_rating: string;
    };
}


const userFormSchema = z.object({
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
  role: z.enum(['BIDDER', 'SELLER', 'ADMIN']),
  // We'll accept string for date input flexibility, or standard Date object
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid Date"), 
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const resetPasswordSchema = z.object({
    new_password: z.string().min(6, "Password must be at least 6 characters"),
});

type UserFormValues = z.infer<typeof userFormSchema>;
type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;


const AdminUsersPage = () => {
    const [requests, setRequests] = useState<UpgradeRequest[]>([]);
    const [requestStatus, setRequestStatus] = useState<string>("PENDING");
    const [loadingRequests, setLoadingRequests] = useState(false);
    
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [userSearch, setUserSearch] = useState("");

    const [requestAction, setRequestAction] = useState<{ type: 'APPROVE' | 'REJECT' | 'DELETE', item: UpgradeRequest } | null>(null);
    
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null); // Null = Create Mode
    const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
    const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const userForm = useForm<UserFormValues>({
        resolver: zodResolver(userFormSchema),
        defaultValues: {
            role: "BIDDER",
            email: "",
            full_name: "",
            address: "",
            dob: "",
            password: ""
        }
    });

    const resetPassForm = useForm<ResetPasswordValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { new_password: "" }
    });


    const fetchRequests = async () => {
        setLoadingRequests(true);
        try {
            const res = await api.get(`/upgrade-requests?status=${requestStatus}`);
            setRequests(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch requests", error);
        } finally {
            setLoadingRequests(false);
        }
    };

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await api.get('/users');
            setUsers(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch users", error);
            toast.error("Failed to load users");
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => { fetchRequests(); }, [requestStatus]);
    useEffect(() => { fetchUsers(); }, []);


    const handleRequestAction = async () => {
        if (!requestAction) return;
        
        try {
            if (requestAction.type === 'DELETE') {
                await api.delete(`/upgrade-requests/${requestAction.item.request_id}`);
                toast.success("Request deleted");
            } else {
                const status = requestAction.type === 'APPROVE' ? 'APPROVED' : 'REJECTED';
                await api.put(`/upgrade-requests/${requestAction.item.request_id}`, { status });
                toast.success(`Request ${status.toLowerCase()} successfully`);
            }
            fetchRequests(); 
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Action failed");
        } finally {
            setRequestAction(null);
        }
    };


    const onUserSubmit = async (data: UserFormValues) => {
        try {
            if (editingUser) {
 
                const { password, ...updatePayload } = data; 
                await api.put(`/users/${editingUser.user_id}`, updatePayload);
                toast.success("User updated successfully");
            } else {
                // Create
                await api.post('/users', data);
                toast.success("User created successfully");
            }
            setIsUserModalOpen(false);
            setEditingUser(null);
            userForm.reset();
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save user");
        }
    };

    const onResetPasswordSubmit = async (data: ResetPasswordValues) => {
        if (!passwordResetUser) return;
        try {
            await api.put(`/users/${passwordResetUser.user_id}/reset-password`, data);
            toast.success(`Password reset for ${passwordResetUser.full_name}`);
            setIsResetPassModalOpen(false);
            setPasswordResetUser(null);
            resetPassForm.reset();
        } catch (error: any) {
            toast.error("Failed to reset password");
        }
    };

    const onDeleteUserConfirm = async () => {
        if (!userToDelete) return;
        try {
            await api.delete(`/users/${userToDelete.user_id}`);
            toast.success("User removed successfully");
            setUserToDelete(null);
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete user");
        }
    };

    // Open User Modal Logic
    const openCreateUserModal = () => {
        setEditingUser(null);
        userForm.reset({
            role: "BIDDER",
            email: "",
            full_name: "",
            address: "",
            dob: "",
            password: ""
        });
        setIsUserModalOpen(true);
    };

    const openEditUserModal = (user: User) => {
        setEditingUser(user);
        userForm.reset({
            role: user.role,
            email: user.email,
            full_name: user.full_name,
            address: user.address || "",
            dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : "",
            password: "" // Password usually empty on edit
        });
        setIsUserModalOpen(true);
    };


    // --- FILTER USERS ---
    const filteredUsers = users.filter(u => 
        u.full_name.toLowerCase().includes(userSearch.toLowerCase()) || 
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-300 pb-10">
            
            <h1 className="text-3xl font-bold text-slate-900">User Management</h1>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b bg-slate-50/50">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                <ArrowUpCircle className="w-5 h-5 text-blue-600" />
                                Seller Upgrade Requests
                            </CardTitle>
                            <CardDescription>Manage users requesting to become Sellers.</CardDescription>
                        </div>
                        <Select value={requestStatus} onValueChange={setRequestStatus}>
                            <SelectTrigger className="w-[180px] bg-white">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PENDING">Pending Requests</SelectItem>
                                <SelectItem value="APPROVED">Approved History</SelectItem>
                                <SelectItem value="REJECTED">Rejected History</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="max-h-[680px] overflow-y-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                                <TableRow>
                                    <TableHead>User ID</TableHead>
                                    <TableHead>Full name</TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead>Request Date</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingRequests ? (
                                    <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell></TableRow>
                                ) : requests.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No {requestStatus.toLowerCase()} requests found.</TableCell></TableRow>
                                ) : (
                                    requests.map((req) => (
                                        <TableRow key={req.request_id}>
                                            <TableCell className="font-mono text-xs text-muted-foreground">#{req.user.user_id}</TableCell>
                                            <TableCell className="font-medium">{req.user.full_name}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-2 text-xs">
                                                    <span className="text-green-600">+{req.user.positive_rating}</span>
                                                    <span className="text-red-600">-{req.user.negative_rating}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(req.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="max-w-[300px]">
                                                <p className="truncate text-sm" title={req.reason}>{req.reason}</p>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={req.status === 'APPROVED' ? 'default' : req.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                                                    {req.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                {req.status === 'PENDING' ? (
                                                    <>
                                                        <Button 
                                                            size="icon" variant="outline" className="h-8 w-8 text-green-600 border-green-200 hover:bg-green-50"
                                                            onClick={() => setRequestAction({ type: 'APPROVE', item: req })}
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </Button>
                                                        <Button 
                                                            size="icon" variant="outline" className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50"
                                                            onClick={() => setRequestAction({ type: 'REJECT', item: req })}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button 
                                                        size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-600"
                                                        onClick={() => setRequestAction({ type: 'DELETE', item: req })}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>


            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b bg-slate-50/50">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                <UserCog className="w-5 h-5 text-slate-700" />
                                All Users
                            </CardTitle>
                            <CardDescription>Manage registered users, roles, and accounts.</CardDescription>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                <Input 
                                    placeholder="Search users..." 
                                    className="pl-9 bg-white" 
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                />
                            </div>
                            <Button className="gap-2" onClick={openCreateUserModal}>
                                <Plus className="w-4 h-4" /> Add User
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="max-h-[680px] overflow-y-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                                <TableRow>
                                    <TableHead>User ID</TableHead>
                                    <TableHead>Full Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingUsers ? (
                                    <TableRow><TableCell colSpan={7} className="h-24 text-center">Loading...</TableCell></TableRow>
                                ) : filteredUsers.length === 0 ? (
                                    <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">No users found.</TableCell></TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.user_id}>
                                            <TableCell className="font-mono text-xs text-muted-foreground">#{user.user_id}</TableCell>
                                            <TableCell className="font-medium">{user.full_name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={
                                                    user.role === 'ADMIN' ? 'border-purple-200 text-purple-700 bg-purple-50' :
                                                    user.role === 'SELLER' ? 'border-amber-200 text-amber-700 bg-amber-50' :
                                                    'border-slate-200 text-slate-600'
                                                }>
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1 text-xs">
                                                    <span className="font-semibold text-green-600">+{user.positive_rating}</span> / 
                                                    <span className="font-semibold text-red-600">-{user.negative_rating}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {user.is_verified ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                                                        <Check className="w-3 h-3" /> Verified
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                                                        Unverified
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => openEditUserModal(user)}>
                                                            <UserCog className="mr-2 w-4 h-4" /> Edit Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => { setPasswordResetUser(user); setIsResetPassModalOpen(true); }}>
                                                            <KeyRound className="mr-2 w-4 h-4" /> Reset Password
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            className="text-red-600 focus:text-red-600"
                                                            onClick={() => setUserToDelete(user)}
                                                        >
                                                            <Trash2 className="mr-2 w-4 h-4" /> Delete User
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingUser ? "Edit User" : "Create New User"}</DialogTitle>
                        <DialogDescription>
                            {editingUser ? "Update user account details." : "Add a new user to the system."}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...userForm}>
                        <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={userForm.control}
                                    name="full_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full Name</FormLabel>
                                            <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={userForm.control}
                                    name="role"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Role</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="BIDDER">Bidder</SelectItem>
                                                    <SelectItem value="SELLER">Seller</SelectItem>
                                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={userForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl><Input type="email" placeholder="john@example.com" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            {!editingUser && (
                                <FormField
                                    control={userForm.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl><Input type="password" placeholder="••••••" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            
                            <FormField
                                control={userForm.control}
                                name="dob"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date of Birth</FormLabel>
                                        <FormControl><Input type="date" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={userForm.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Address</FormLabel>
                                        <FormControl><Input placeholder="123 Main St..." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsUserModalOpen(false)}>Cancel</Button>
                                <Button type="submit">{editingUser ? "Save Changes" : "Create User"}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={isResetPassModalOpen} onOpenChange={setIsResetPassModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>Set a new password for <strong>{passwordResetUser?.full_name}</strong>.</DialogDescription>
                    </DialogHeader>
                    <Form {...resetPassForm}>
                        <form onSubmit={resetPassForm.handleSubmit(onResetPasswordSubmit)} className="space-y-4">
                            <FormField
                                control={resetPassForm.control}
                                name="new_password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New Password</FormLabel>
                                        <FormControl><Input type="password" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsResetPassModalOpen(false)}>Cancel</Button>
                                <Button type="submit">Update Password</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the user account for <strong>{userToDelete?.full_name}</strong>. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onDeleteUserConfirm} className="bg-red-600 hover:bg-red-700">Delete User</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!requestAction} onOpenChange={(open) => !open && setRequestAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {requestAction?.type === 'APPROVE' ? "Approve Upgrade Request" : 
                             requestAction?.type === 'REJECT' ? "Reject Upgrade Request" : "Delete Request History"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {requestAction?.type === 'APPROVE' && `Are you sure you want to promote ${requestAction.item.user.full_name} to SELLER?`}
                            {requestAction?.type === 'REJECT' && `Are you sure you want to reject the application from ${requestAction.item.user.full_name}?`}
                            {requestAction?.type === 'DELETE' && "This will remove the request record permanently."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleRequestAction}
                            className={requestAction?.type === 'APPROVE' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                        >
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AdminUsersPage;