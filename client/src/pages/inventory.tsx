import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  AlertTriangle, 
  XCircle,
  Plus,
  Search,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { z } from "zod";

const productFormSchema = insertProductSchema.extend({
  categoryId: z.number().optional(),
  supplierId: z.number().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function Inventory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products", { search: searchQuery }],
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: suppliers } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard"],
  });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      barcode: "",
      costPrice: "0.00",
      sellPrice: "0.00",
      stock: 0,
      minStock: 5,
      isActive: true,
    }
  });

  const createProductMutation = useMutation({
    mutationFn: async (productData: ProductFormData) => {
      const res = await apiRequest("POST", "/api/products", productData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Məhsul əlavə edildi",
        description: "Yeni məhsul uğurla yaradıldı",
      });
      setIsAddModalOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: () => {
      toast({
        title: "Xəta baş verdi",
        description: "Məhsul əlavə edilə bilmədi",
        variant: "destructive",
      });
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const res = await apiRequest("DELETE", `/api/products/${productId}`);
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Məhsul silindi",
        description: "Məhsul uğurla silindi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: () => {
      toast({
        title: "Xəta baş verdi",
        description: "Məhsul silinə bilmədi",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (data: ProductFormData) => {
    createProductMutation.mutate(data);
  };

  const handleDelete = (productId: number) => {
    if (confirm("Bu məhsulu silmək istədiyinizə əminsiniz?")) {
      deleteProductMutation.mutate(productId);
    }
  };

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) {
      return { label: "Stokda yox", variant: "destructive" as const, icon: XCircle };
    } else if (stock <= minStock) {
      return { label: "Aşağı stok", variant: "secondary" as const, icon: AlertTriangle };
    } else {
      return { label: "Stokda var", variant: "default" as const, icon: Package };
    }
  };

  const filteredProducts = products?.filter((item: any) => {
    const product = item.products || item; // Handle nested structure
    const matchesSearch = !searchQuery || 
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !categoryFilter || categoryFilter === "all" || product.categoryId?.toString() === categoryFilter;
    
    const matchesStock = !stockFilter || stockFilter === "all" ||
      (stockFilter === "instock" && product.stock > product.minStock) ||
      (stockFilter === "lowstock" && product.stock <= product.minStock && product.stock > 0) ||
      (stockFilter === "outofstock" && product.stock === 0);
    
    return matchesSearch && matchesCategory && matchesStock;
  }) || [];

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
              <h1 className="text-2xl font-bold text-gray-900">Anbar İdarəsi</h1>
              <p className="mt-1 text-sm text-gray-600">Məhsul stokları və anbar əməliyyatları</p>
            </div>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Məhsul
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Yeni Məhsul Əlavə Et</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Məhsul Adı</Label>
                      <Input
                        id="name"
                        {...form.register("name")}
                        placeholder="Məhsul adını daxil edin"
                      />
                    </div>
                    <div>
                      <Label htmlFor="barcode">Barkod</Label>
                      <Input
                        id="barcode"
                        {...form.register("barcode")}
                        placeholder="Barkodu daxil edin"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="brand">Marka</Label>
                      <Input
                        id="brand"
                        {...form.register("brand")}
                        placeholder="Marka adını daxil edin"
                      />
                    </div>
                    <div>
                      <Label htmlFor="categoryId">Kateqoriya</Label>
                      <Select onValueChange={(value) => form.setValue("categoryId", parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Kateqoriya seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.map((category: any) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="costPrice">Alış Qiyməti</Label>
                      <Input
                        id="costPrice"
                        type="number"
                        step="0.01"
                        {...form.register("costPrice")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sellPrice">Satış Qiyməti</Label>
                      <Input
                        id="sellPrice"
                        type="number"
                        step="0.01"
                        {...form.register("sellPrice")}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stock">Stok Miqdarı</Label>
                      <Input
                        id="stock"
                        type="number"
                        {...form.register("stock", { valueAsNumber: true })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="minStock">Minimum Stok</Label>
                      <Input
                        id="minStock"
                        type="number"
                        {...form.register("minStock", { valueAsNumber: true })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Təsvir</Label>
                    <Input
                      id="description"
                      {...form.register("description")}
                      placeholder="Məhsul təsvirini daxil edin"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddModalOpen(false)}
                    >
                      Ləğv et
                    </Button>
                    <Button
                      type="submit"
                      disabled={createProductMutation.isPending}
                    >
                      {createProductMutation.isPending ? "Əlavə edilir..." : "Əlavə et"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Inventory Stats */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <Package className="h-6 w-6 text-blue-600 mr-4" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Ümumi Məhsul</div>
                    <div className="text-lg font-medium text-gray-900">
                      {products?.length || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <AlertTriangle className="h-6 w-6 text-yellow-600 mr-4" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Aşağı Stok</div>
                    <div className="text-lg font-medium text-gray-900">
                      {products?.filter((item: any) => {
                        const product = item.products || item;
                        return product.stock <= (product.minStock || 5);
                      }).length || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <XCircle className="h-6 w-6 text-red-600 mr-4" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Stokda Yox</div>
                    <div className="text-lg font-medium text-gray-900">
                      {filteredProducts.filter((p: any) => p.stock === 0).length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <Label>Axtarış</Label>
                  <Input
                    placeholder="Məhsul adı və ya barkod..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Kateqoriya</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Hamısı" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Hamısı</SelectItem>
                      {categories?.map((category: any) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Stok Vəziyyəti</Label>
                  <Select value={stockFilter} onValueChange={setStockFilter}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Hamısı" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Hamısı</SelectItem>
                      <SelectItem value="instock">Stokda var</SelectItem>
                      <SelectItem value="lowstock">Aşağı stok</SelectItem>
                      <SelectItem value="outofstock">Stokda yox</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => {
                      setSearchQuery("");
                      setCategoryFilter("");
                      setStockFilter("");
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Təmizlə
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Məhsul
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Barkod
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kateqoriya
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stok
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alış Qiyməti
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Satış Qiyməti
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Əməliyyatlar
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedProducts.map((item: any) => {
                    const product = item.products || item; // Handle nested structure
                    const stockStatus = getStockStatus(product.stock, product.minStock);
                    return (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.name || "-"}</div>
                              <div className="text-sm text-gray-500">{product.brand || "-"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.barcode || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {categories?.find((c: any) => c.id === product.categoryId)?.name || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={stockStatus.variant} className="flex items-center w-fit">
                            <stockStatus.icon className="h-3 w-3 mr-1" />
                            {product.stock || 0} ədəd
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₼{product.costPrice || "0.00"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₼{product.sellPrice || "0.00"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2">
                            <Button size="sm" variant="ghost">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(product.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Əvvəlki
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Növbəti
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                    {" - "}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
                    </span>
                    {" / "}
                    <span className="font-medium">{filteredProducts.length}</span>
                    {" nəticə"}
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      {currentPage}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </nav>
                </div>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
