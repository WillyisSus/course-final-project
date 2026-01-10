import { Outlet, NavLink, useNavigate, Link, Navigate } from "react-router"; // or "react-router-dom"
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logOut } from "@/store/slices/authSlice";
import { store } from "@/store/store";
import { 
    LayoutDashboard, 
    Users, 
    Package, 
    Layers, 
    LogOut, 
    ShieldCheck 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const AdminLayout = () => {
    const { user } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    if (!user) {
        toast.error("Please log in to access the admin panel.");
        return Navigate({ to: "/login" });
    }

    if (user?.role !== "ADMIN" && user?.role !== "SELLER") { 

        toast.error("You do not have permission to access the admin panel.");
        return Navigate({ to: "/" });
    }

    const navItems = [
        { label: "Categories", href: "/admin/categories", icon: Layers },
        { label: "Users", href: "/admin/users", icon: Users },
        { label: "Products", href: "/admin/products", icon: Package },
    ];

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl flex-shrink-0 z-20">
                
                <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-800 font-bold text-lg tracking-wide">
                    <ShieldCheck className="text-blue-500 w-6 h-6" />
                    <span>Admin Panel</span>
                </div>

                <nav className="flex-1 py-6 px-3 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm
                                ${isActive 
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                }
                            `}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                            {user?.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{user?.full_name}</p>
                            <p className="text-xs text-slate-500 truncate capitalize">{user?.role}</p>
                        </div>
                    </div>
                    <Button 
                        variant="destructive" 
                        className="w-full justify-start gap-2 pl-3" 
                        asChild
                    >
                        <Link to={'/'}>
                            <LogOut className="w-4 h-4" /> To Homepage
                        </Link>
                    </Button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet /> 
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;