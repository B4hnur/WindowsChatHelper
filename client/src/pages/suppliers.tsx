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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSupplierSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { 
  Truck, 
  Plus,
  Search,
  Edit3,
  Trash2,
  Phone,
  Mail,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { z } from "zod";

type SupplierFormData = z.infer<typeof insertSupplierSchema>;

export default function Suppliers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(insertSupplierSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
    }
  });

  const createSupplierMutation = useMutation({
    mutationFn: async (supplierData: SupplierFormData) => {
      const res = await apiRequest("POST", "/api/suppliers", supplierData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Tədarükçü əlavə edildi",
        description: "Yeni tədarükçü uğurla yaradıldı",
      });
      setIsAddModalOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
    },
    onError: () => {
      toast({
        title: "Xəta baş verdi",
        description: "Tədarükçü əlavə edilə bilmədi",
        variant: "destructive",
      });
    }
  });

  const updateSupplierMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<SupplierFormData> }) => {
      const res = await apiRequest("PUT", `/api/suppliers/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Tədarükçü yeniləndi",
        description: "Tədarükçü məlumatları uğurla yeniləndi",
      });
      setEditingSupplier(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
    },
    onError: () => {
      toast({
        title: "Xəta baş verdi",
        description: "Tədarükçü yenilənə bilmədi",
        variant: "destructive",
      });
    }
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: async (supplierId: number) => {
      const res = await apiRequest("DELETE", `/api/suppliers/${supplierId}`);
      return res;
    },
    onSuccess: () => {
      toast({
        title: "Tədarükçü silindi",
        description: "Tədarükçü uğurla silindi",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
    },
    onError: () => {
      toast({
        title: "Xəta baş verdi",
        description: "Tədarükçü silinə bilmədi",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (data: SupplierFormData) => {
    if (editingSupplier) {
      updateSupplierMutation.mutate({ id: editingSupplier.id, data });
    } else {
      createSupplierMutation.mutate(data);
    }
  };

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    form.reset({
      name: supplier.name,
      contactPerson: supplier.contactPerson || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
    });
    setIsAddModalOpen(true);
  };

  const handleDelete = (supplierId: number) => {
    if (confirm("Bu tədarükçünü silmək istədiyinizə əminsiniz?")) {
      deleteSupplierMutation.mutate(supplierId);
    }
  };

  const filteredSuppliers = suppliers?.filter((supplier: any) =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const paginatedSuppliers = filteredSuppliers.slice(
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
              <h1 className="text-2xl font-bold text-gray-900">Tədarükçü İdarəsi</h1>
              <p className="mt-1 text-sm text-gray-600">Tədarükçü məlumatları və alqı-satqı tarixçəsi</p>
            </div>
            <Dialog 
              open={isAddModalOpen} 
              onOpenChange={(open) => {
                setIsAddModalOpen(open);
                if (!open) {
                  setEditingSupplier(null);
                  form.reset();
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Tədarükçü
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingSupplier ? "Tədarükçü Məlumatlarını Redaktə Et" : "Yeni Tədarükçü Əlavə Et"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Şirkət Adı*</Label>
                      <Input
                        id="name"
                        {...form.register("name")}
                        placeholder="Şirkət adını daxil edin"
                      />
                      {form.formState.errors.name && (
                        <p className="text-sm text-red-600 mt-1">
                          {form.formState.errors.name.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="contactPerson">Əlaqə Şəxsi</Label>
                      <Input
                        id="contactPerson"
                        {...form.register("contactPerson")}
                        placeholder="Əlaqə şəxsinin adını daxil edin"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Telefon</Label>
                      <Input
                        id="phone"
                        {...form.register("phone")}
                        placeholder="Telefon nömrəsini daxil edin"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        {...form.register("email")}
                        placeholder="E-mail ünvanını daxil edin"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Ünvan</Label>
                    <Input
                      id="address"
                      {...form.register("address")}
                      placeholder="Ünvanı daxil edin"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddModalOpen(false);
                        setEditingSupplier(null);
                        form.reset();
                      }}
                    >
                      Ləğv et
                    </Button>
                    <Button
                      type="submit"
                      disabled={createSupplierMutation.isPending || updateSupplierMutation.isPending}
                    >
                      {(createSupplierMutation.isPending || updateSupplierMutation.isPending) 
                        ? (editingSupplier ? "Yenilənir..." : "Əlavə edilir...")
                        : (editingSupplier ? "Yenilə" : "Əlavə et")
                      }
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Supplier Stats */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <Truck className="h-6 w-6 text-blue-600 mr-4" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Ümumi Tədarükçü</div>
                    <div className="text-lg font-medium text-gray-900">
                      {suppliers?.length || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <User className="h-6 w-6 text-green-600 mr-4" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Əlaqə Şəxsi Olan</div>
                    <div className="text-lg font-medium text-gray-900">
                      {suppliers?.filter((s: any) => s.contactPerson).length || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <Mail className="h-6 w-6 text-purple-600 mr-4" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">E-mail Olan</div>
                    <div className="text-lg font-medium text-gray-900">
                      {suppliers?.filter((s: any) => s.email).length || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Label>Axtarış</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Şirkət adı, əlaqə şəxsi, telefon və ya e-mail..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => setSearchQuery("")}
                    variant="outline"
                  >
                    Təmizlə
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suppliers Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tədarükçü
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Əlaqə Şəxsi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Əlaqə Məlumatları
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ünvan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qeydiyyat Tarixi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Əməliyyatlar
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        {searchQuery ? "Axtarış nəticəsi tapılmadı" : "Hələ tədarükçü əlavə edilməyib"}
                      </td>
                    </tr>
                  ) : (
                    paginatedSuppliers.map((supplier: any) => (
                      <tr key={supplier.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                              <Truck className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                              <div className="text-sm text-gray-500">ID: {supplier.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            {supplier.contactPerson ? (
                              <>
                                <User className="h-3 w-3 mr-1 text-gray-400" />
                                {supplier.contactPerson}
                              </>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {supplier.phone && (
                              <div className="flex items-center text-sm text-gray-900">
                                <Phone className="h-3 w-3 mr-1 text-gray-400" />
                                {supplier.phone}
                              </div>
                            )}
                            {supplier.email && (
                              <div className="flex items-center text-sm text-gray-500">
                                <Mail className="h-3 w-3 mr-1 text-gray-400" />
                                {supplier.email}
                              </div>
                            )}
                            {!supplier.phone && !supplier.email && (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            {supplier.address ? (
                              <>
                                <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                                {supplier.address}
                              </>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(supplier.createdAt).toLocaleDateString('az-AZ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(supplier)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(supplier.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
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
                        {Math.min(currentPage * itemsPerPage, filteredSuppliers.length)}
                      </span>
                      {" / "}
                      <span className="font-medium">{filteredSuppliers.length}</span>
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
            )}
          </Card>
        </main>
      </div>
    </div>
  );
}
