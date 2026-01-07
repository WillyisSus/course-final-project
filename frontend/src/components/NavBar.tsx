import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logOut } from '../store/slices/authSlice';
import api from '../lib/axios';

// Icons & UI
import { Search, LogIn, User, ChevronDown, LogOut, ShoppingBag, LayoutDashboard, ListOrdered, Gavel, GavelIcon, HandCoinsIcon, PlusCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Category {
  category_id: number;
  name: string;
  parent_id?: number | null;
  sub_categories?: Category[]; 
}

const Navbar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [searchValue, setSearchValue] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  // --- Search Logic ---
  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchValue)}`);
    }
  };
  
  // --- Fetch Categories ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get<{ data: Category[] }>('/categories');
        // We assume res.data.data is ALREADY a nested tree of parents
        setCategories(res.data.data);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    fetchCategories();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        
        {/* --- LEFT SECTION --- */}
        <div className="flex items-center gap-6 flex-1">
          <Link to="/" className="text-2xl font-bold text-blue-600 flex items-center gap-2 hover:opacity-90 transition">
            <HandCoinsIcon className="w-8 h-8" />
            BigBiddie
          </Link>

          {/* CATEGORY DROPDOWN */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="hidden md:flex gap-1 font-medium text-gray-700">
                Categories <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Browse by Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* DIRECT LOOP: The backend already grouped them for us */}
              {categories.map((category) => {
                const hasChildren = category.sub_categories && category.sub_categories.length > 0;
                
                // CASE 1: Parent with Children (Submenu)
                if (hasChildren) {
                  return (
                    <DropdownMenuSub key={category.category_id}>
                      <DropdownMenuSubTrigger className="cursor-pointer py-2">
                        {category.name}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-48">
                        {category.sub_categories!.map(child => (
                           <DropdownMenuItem key={child.category_id} asChild>
                             <Link to={`/products?category=${child.category_id}`} className="cursor-pointer w-full block">
                               {child.name}
                             </Link>
                           </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  );
                }
                
                // CASE 2: Single Category (Leaf)
                return (
                  <DropdownMenuItem key={category.category_id} asChild>
                    <Link to={`/products?category=${category.category_id}`} className="cursor-pointer w-full block py-2">
                      {category.name}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Search Bar */}
          <div className="relative w-full max-w-md hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search products..." 
              className="pl-9 bg-gray-50 border-gray-200 focus-visible:bg-white transition-colors"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
        </div>

        {/* --- RIGHT SECTION (Auth) --- */}
        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            
            <> 
              {user.role === 'SELLER' && 
              (
                <Button className='flex items-center gap-2 px-2 bg-primary '>
                  <Link to="/upload" className="flex items-center gap-2">
                    <PlusCircleIcon className="w-4 h-4" />
                    Upload
                  </Link>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-blue-50">
                    <Avatar className="h-8 w-8 border border-blue-100">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">
                        {user.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start text-xs">
                      <span className="font-bold text-blue-600 uppercase tracking-wider text-[10px]">
                        {user.role}
                      </span>
                      <span className="font-medium text-gray-700 max-w-[100px] truncate">
                        {user.full_name}
                      </span>
                    </div>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer gap-2">
                    <Link to={"/profile"}>
                      <User className="w-4 h-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'SELLER' && (
                    <DropdownMenuItem className="cursor-pointer gap-2">
                      <LayoutDashboard className="w-4 h-4" /> My Listings
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="cursor-pointer gap-2">
                    <ListOrdered className="w-4 h-4" /> Bidding History
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600 focus:text-red-600 cursor-pointer gap-2 bg-red-50/50"
                    onClick={() => {
                      dispatch(logOut());
                      navigate('/login');
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
            
          ) : (
            <Link to="/login">
              <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm gap-2">
                <LogIn className="w-4 h-4" />
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;