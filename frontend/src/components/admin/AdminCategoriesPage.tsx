import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/axios";
import { 
    Layers, 
    Plus, 
    Search,
    Edit,
    Trash2,
    ChevronRight,
    FolderTree,
    Loader2,
    AlertTriangle
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// --- TYPES ---
export interface Category {
  category_id: number;
  name: string;
  parent_id?: number | null;
  sub_categories: Category[]; 
}

// --- SCHEMAS ---
const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  parent_id: z.string().optional(), 
});

type CategoryFormValues = z.infer<typeof categorySchema>;

const AdminCategoriesPage = () => {
    // Data States
    const [categories, setCategories] = useState<Category[]>([]); 
    const [flatCategories, setFlatCategories] = useState<Category[]>([]); 
    const [loading, setLoading] = useState(true);
    
    // UI States
    const [searchTerm, setSearchTerm] = useState("");
    
    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    
    // Selection States
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    const [deleting, setDeleting] = useState(false);

    // --- FORMS ---
    const createForm = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: { name: "", parent_id: "root" },
    });

    const updateForm = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: { name: "", parent_id: "root" },
    });

    // --- FETCH DATA ---
    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await api.get('/categories');
            const data = res.data.data || []; 
            setCategories(data); 
            setFlatCategories(flattenCategories(data));
        } catch (error) {
            console.error("Failed to load categories", error);
            toast.error("Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // --- HANDLERS: CREATE ---
    const onCreateSubmit = async (data: CategoryFormValues) => {
        try {
            const payload = {
                name: data.name,
                parent_id: data.parent_id === "root" ? null : parseInt(data.parent_id!),
            };
            await api.post('/categories', payload);
            toast.success("Category created successfully");
            setIsCreateModalOpen(false);
            createForm.reset();
            fetchCategories(); 
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create category");
        }
    };

    // --- HANDLERS: UPDATE ---
    const handleEditClick = (category: Category) => {
        setEditingCategory(category);
        updateForm.reset({
            name: category.name,
            parent_id: category.parent_id ? category.parent_id.toString() : "root",
        });
        setIsEditModalOpen(true);
    };

    const onUpdateSubmit = async (data: CategoryFormValues) => {
        if (!editingCategory) return;
        const newParentId = data.parent_id === "root" ? null : parseInt(data.parent_id!);

        if (editingCategory.sub_categories?.length > 0 && newParentId !== null) {
            toast.error("This category has sub-categories. Move them first before making this a sub-category.");
            return;
        }

        try {
            await api.put(`/categories/${editingCategory.category_id}`, {
                name: data.name,
                parent_id: newParentId,
            });
            toast.success("Category updated successfully");
            setIsEditModalOpen(false);
            setEditingCategory(null);
            fetchCategories();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update category");
        }
    };

    // --- HANDLERS: DELETE ---
    const handleDeleteClick = (category: Category) => {
        // 1. Check Constraint
        if (category.sub_categories && category.sub_categories.length > 0) {
            toast.error("You cannot delete a category with sub categories.");
            return;
        }
        
        // 2. Open Alert if safe
        setCategoryToDelete(category);
        setIsDeleteAlertOpen(true);
    };

    const onDeleteConfirm = async () => {
        if (!categoryToDelete) return;
        setDeleting(true);
        try {
            await api.delete(`/categories/${categoryToDelete.category_id}`);
            toast.success("Category deleted successfully");
            setIsDeleteAlertOpen(false);
            setCategoryToDelete(null);
            fetchCategories();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete category");
        } finally {
            setDeleting(false);
        }
    };

    // --- HELPERS ---
    const flattenCategories = (cats: Category[], level: number = 0, parentName: string | null = null): any[] => {
        let result: any[] = [];
        cats.forEach(cat => {
            result.push({ ...cat, level, parentName });
            if (cat.sub_categories?.length > 0) {
                result = result.concat(flattenCategories(cat.sub_categories, level + 1, cat.name));
            }
        });
        return result;
    };

    const filteredCategories = flatCategories.filter(cat => 
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && categories.length === 0) return <div className="space-y-4"><Skeleton className="h-10 w-48"/><Skeleton className="h-64 w-full"/></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Categories</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage product categories structure.</p>
                </div>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4" /> Add Category
                </Button>
            </div>

            {/* Main Table */}
            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FolderTree className="w-5 h-5 text-slate-500" /> All Categories
                        </CardTitle>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                type="search"
                                placeholder="Search..."
                                className="pl-9 h-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="border-t">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="w-[80px]">ID</TableHead>
                                    <TableHead>Category Name</TableHead>
                                    <TableHead>Parent Category</TableHead>
                                    <TableHead className="text-center">Sub-categories</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCategories.length > 0 ? (
                                    filteredCategories.map((cat: any) => (
                                        <TableRow key={cat.category_id} className="hover:bg-slate-50/50">
                                            <TableCell className="font-mono text-xs text-muted-foreground">#{cat.category_id}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 font-medium" style={{ paddingLeft: `${cat.level * 24}px` }}>
                                                    {cat.level > 0 && <ChevronRight className="w-4 h-4 text-slate-300" />}
                                                    <span className={cat.level === 0 ? "text-slate-900 font-bold" : "text-slate-600"}>{cat.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {cat.parentName ? (
                                                    <Badge variant="outline" className="text-xs font-normal text-slate-500">{cat.parentName}</Badge>
                                                ) : <span className="text-xs text-slate-400 italic">Root Category</span>}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {cat.sub_categories?.length > 0 ? (
                                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700">{cat.sub_categories.length}</Badge>
                                                ) : <span className="text-slate-300 text-xs">-</span>}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-slate-500 hover:text-blue-600"
                                                        onClick={() => handleEditClick(cat)}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-slate-500 hover:text-red-600"
                                                        onClick={() => handleDeleteClick(cat)} // ✅ Hooked up here
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No categories found.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* --- CREATE MODAL --- */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add New Category</DialogTitle>
                        <DialogDescription>Create a new root category or a sub-category.</DialogDescription>
                    </DialogHeader>
                    <Form {...createForm}>
                        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4 py-2">
                            <FormField
                                control={createForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category Name</FormLabel>
                                        <FormControl><Input placeholder="e.g. Electronics" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={createForm.control}
                                name="parent_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Parent Category</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select parent" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="root" className="font-semibold text-blue-600">No Parent (Create Root)</SelectItem>
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat.category_id} value={cat.category_id.toString()}>{cat.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={createForm.formState.isSubmitting}>Create</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* --- UPDATE MODAL --- */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Update Category</DialogTitle>
                        <DialogDescription>Edit details for <span className="font-semibold text-slate-900">{editingCategory?.name}</span>.</DialogDescription>
                    </DialogHeader>

                    {editingCategory?.sub_categories && editingCategory.sub_categories.length > 0 && (
                         <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex gap-3 items-start text-xs text-amber-800">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>This category contains sub-categories. You cannot assign it to a parent unless you remove its children first.</span>
                        </div>
                    )}

                    <Form {...updateForm}>
                        <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="space-y-4 py-2">
                            <FormField
                                control={updateForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category Name</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={updateForm.control}
                                name="parent_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Parent Category</FormLabel>
                                        <Select 
                                            onValueChange={field.onChange} 
                                            value={field.value}
                                            disabled={editingCategory?.sub_categories && editingCategory.sub_categories.length > 0}
                                        >
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select parent" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="root" className="font-semibold text-blue-600">No Parent (Root Category)</SelectItem>
                                                {categories
                                                    .filter(cat => cat.category_id !== editingCategory?.category_id)
                                                    .map((cat) => (
                                                        <SelectItem key={cat.category_id} value={cat.category_id.toString()}>{cat.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={updateForm.formState.isSubmitting}>Save Changes</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* --- DELETE CONFIRMATION ALERT --- */}
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure to delete this Category: <span className="font-bold text-slate-900">{categoryToDelete?.name}</span>? 
                            <br />
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={onDeleteConfirm} 
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleting ? "Deleting..." : "Confirm Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AdminCategoriesPage;