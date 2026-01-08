import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/lib/axios";
import { toast } from "sonner";
import { UploadCloud, X, DollarSign, Calendar, Loader2 } from "lucide-react";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/types/product";
import { SelectGroup, SelectLabel } from "@radix-ui/react-select";
// 1. Zod Schema (Matches your Backend Schema)
const formSchema = z.object({
  name: z.string().min(5, "Name must be at least 5 characters"),
  category_id: z.string().min(1, "Please select a category"),
  price_start: z.coerce.number().min(1, "Start price must be positive"),
  price_step: z.coerce.number().min(1, "Step price must be positive"),
  price_buy_now: z.coerce.number().optional().or(z.literal("")), // Allow empty string or number
  end_date: z.string().refine((val) => new Date(val) > new Date(), {
    message: "End date must be in the future",
  }),
  description: z.string().min(10, "Description must be at least 10 characters"),
  is_auto_extend: z.boolean().default(false),
  allow_first_time_bidder: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof formSchema>;

const UploadProductPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: any) => state.auth);
  if (!user) {
    navigate("/login");
  }
  if (user?.role !== "SELLER" && user?.role !== "ADMIN") {
    navigate("/forbidden");
  }
  const [categories, setCategories] = useState<Category[]>([]);

  // File state is managed manually since it's not natively supported by RHF + Zod perfectly yet
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Categories
  useEffect(() => {
    api.get("/categories").then((res) => setCategories(res.data.data || []));
  }, []);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      price_start: 0,
      price_step: 0,
      description: "",
      is_auto_extend: false,
      allow_first_time_bidder: true,
      end_date: "",
      // price_buy_now is optional, so it's okay to omit,
      // or you can set it to undefined/"" if needed.
    },
  });

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);

      if (selectedImages.length + files.length > 4) {
        toast.error("Maximum 4 images allowed");
        // IMPORTANT: Reset value even on error so user can retry
        e.target.value = "";
        return;
      }
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setSelectedImages((prev) => [...prev, ...files]);
      setPreviews((prev) => [...prev, ...newPreviews]);
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // 3. Submit Handler
  const onSubmit = async (values: ProductFormValues) => {
    if (selectedImages.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();

      // Append all text fields
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, String(value));
        }
      });

      // Append files (Matches 'upload.array("images")' in backend)
      selectedImages.forEach((file) => formData.append("images", file));

      const res = await api.post("/products", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Auction created successfully!");
      if (res.data?.data?.product_id)
        navigate(`/products/${res.data.data.product_id}`);
      else {
        navigate("/");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to create auction");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return <div className="p-10 text-center">Please log in.</div>;

  return (
    <div className="container self-center maxpy-10">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Create New Auction
        </h1>
        <p className="text-muted-foreground">
          List your item for thousands of potential bidders.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* SECTION 1: DETAILS */}
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>
                Basic information about your item
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Vintage Gibson Les Paul"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((parent) =>
                            parent.sub_categories.length > 0 ? (
                              // CASE A: Parent has sub-categories -> Render Group
                              <SelectGroup key={parent.category_id}>
                                <SelectLabel className="pl-2 py-1 text-xs font-bold text-muted-foreground uppercase tracking-wider bg-gray-50">
                                  {parent.name}
                                </SelectLabel>
                                {parent.sub_categories.map((child: any) => (
                                  <SelectItem
                                    key={child.category_id}
                                    value={String(child.category_id)}
                                    className="pl-6"
                                  >
                                    {child.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            ) : (
                              // CASE B: Parent has NO sub-categories (Atomic) -> Render as Item
                              <SelectItem
                                key={parent.category_id}
                                value={String(parent.category_id)}
                              >
                                {parent.name}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Auction End Date</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="datetime-local"
                            className="pl-9"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* SECTION 2: PRICING */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Strategy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="price_start"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starting Price</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            className="pl-9"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(
                                value === "" ? undefined : Number(value) * 1000
                              );
                            }}
                            value={String(field.value ?? "")}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price_step"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Step Price</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            className="pl-9"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value;

                              field.onChange(
                                value === "" ? undefined : Number(value) * 1000
                              );
                            }}
                            value={String(field.value ?? "")}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price_buy_now"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Buy Now (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            className="pl-9"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value;

                              field.onChange(
                                value === "" ? undefined : Number(value)
                              );
                            }}
                            value={String(field.value ?? "")}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_auto_extend"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Enable Auto-Extend</FormLabel>
                      <FormDescription>
                        Auction extends by 10 minutes if a bid is placed in the
                        last 5 minutes.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="allow_first_time_bidder"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Allow First-time Bidders</FormLabel>
                      <FormDescription>
                        Permit bidders without prior bids to participate in this
                        auction.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* SECTION 3: MEDIA */}
          <Card>
            <CardHeader>
              <CardTitle>Description & Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-[120px]"
                        placeholder="Detailed description..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormLabel>Product Images (Max 4)</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="col-span-1 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors relative">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                      disabled={selectedImages.length >= 4}
                    />
                    <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground font-medium">
                      Upload
                    </span>
                  </div>

                  {previews.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative col-span-1 h-32 border rounded-lg overflow-hidden group"
                    >
                      <img
                        src={src}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                      {idx === 0 && (
                        <div className="absolute bottom-0 w-full bg-primary text-primary-foreground text-[10px] text-center py-0.5">
                          Primary
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/profile")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[150px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Publishing...
                </>
              ) : (
                "Publish Auction"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default UploadProductPage;
