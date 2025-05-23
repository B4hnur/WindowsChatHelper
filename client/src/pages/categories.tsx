import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertCategorySchema, type InsertCategory } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Folder,
  Package
} from "lucide-react";

type CategoryFormData = InsertCategory;

export default function Categories() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: {
      name: "",
      description: "",
    }
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: CategoryFormData) => {
      const res = await apiRequest("POST", "/api/categories", categoryData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Kateqoriya əlavə edildi",
        description: "Yeni kateqoriya uğurla yaradıldı",
      });
      setIsAddModalOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: () => {
      toast({
        title: "Xəta baş verdi",
        description: "Kateqoriya əlavə edilə bilmədi",
        variant: "destructive",
      });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CategoryFormData }) => {
      const res = await apiRequest("PUT", `/api/categories/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Kateqoriya yeniləndi",
        description: "Kateqoriya məlumatları uğurla yeniləndi",
      });
      setEditingCategory(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: () => {
      toast({
        title: "Xəta baş verdi",
        description: "Kateqoriya yenilənə bilmədi",
        variant: "destructive",
      });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      const res = await apiRequest("DELETE", `/api/categories/${categoryId}`);
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Kateqoriya silindi",
        description: "Kateqoriya uğurla silindi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: () => {
      toast({
        title: "Xəta baş verdi",
        description: "Kateqoriya silinə bilmədi",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      description: category.description || "",
    });
    setIsAddModalOpen(true);
  };

  const handleDelete = (categoryId: number) => {
    if (confirm("Bu kateqoriyanı silmək istədiyinizə əminsiniz?")) {
      deleteCategoryMutation.mutate(categoryId);
    }
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingCategory(null);
    form.reset();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className={`fixed inset-y-0 left-0 z-50 lg:relative lg:block ${sidebarOpen ? 'block' : 'hidden'}`}>
        <Sidebar userRole={user?.role} />
      </div>

      <div className="flex-1 lg:pl-0">
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kateqoriyalar</h1>
              <p className="mt-1 text-sm text-gray-600">Məhsul kateqoriyalarını idarə edin</p>
            </div>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingCategory(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Kateqoriya
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? "Kateqoriyanı Redaktə Et" : "Yeni Kateqoriya Əlavə Et"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Kateqoriya Adı</Label>
                    <Input
                      id="name"
                      {...form.register("name")}
                      placeholder="Kateqoriya adını daxil edin"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Açıqlama</Label>
                    <Textarea
                      id="description"
                      {...form.register("description")}
                      placeholder="Kateqoriya açıqlaması (ixtiyari)"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeModal}
                    >
                      Ləğv et
                    </Button>
                    <Button
                      type="submit"
                      disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                    >
                      {createCategoryMutation.isPending || updateCategoryMutation.isPending 
                        ? (editingCategory ? "Yenilənir..." : "Əlavə edilir...") 
                        : (editingCategory ? "Yenilə" : "Əlavə et")
                      }
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories?.map((category: any) => (
              <Card key={category.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Folder className="h-6 w-6 text-blue-600 mr-3" />
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(category.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {category.description && (
                    <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">
                        {category.products?.length || 0} məhsul
                      </span>
                    </div>
                    <Badge variant="secondary">
                      Aktiv
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {categories?.length === 0 && (
            <div className="text-center py-12">
              <Folder className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Kateqoriya yoxdur</h3>
              <p className="mt-1 text-sm text-gray-500">
                İlk kateqoriyanızı yaratmaqla başlayın.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}