import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, insertCategorySchema, insertStoreSettingsSchema, type StoreSettings } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings as SettingsIcon, 
  Users,
  Plus,
  Edit3,
  Trash2,
  Save,
  Printer,
  Smartphone,
  DollarSign,
  Calendar,
  Tag,
  Shield,
  Database,
  Bell,
  Palette
} from "lucide-react";
import { z } from "zod";

const userFormSchema = insertUserSchema.extend({
  confirmPassword: z.string().optional()
}).refine((data) => {
  if (data.password && data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Şifrələr uyğun gəlmir",
  path: ["confirmPassword"],
});

type UserFormData = z.infer<typeof userFormSchema>;
type CategoryFormData = z.infer<typeof insertCategorySchema>;

interface SystemSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  currency: string;
  taxRate: number;
  receiptTemplate: string;
  lowStockThreshold: number;
  notifications: boolean;
  autoBackup: boolean;
  theme: string;
  language: string;
}

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  // Store Settings
  const { data: storeSettings } = useQuery<StoreSettings>({
    queryKey: ["/api/store-settings"]
  });

  const updateStoreSettingsMutation = useMutation({
    mutationFn: async (settingsData: any) => {
      const res = await apiRequest("PUT", "/api/store-settings", settingsData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-settings"] });
      toast({
        title: "Uğurlu",
        description: "Mağaza məlumatları yeniləndi",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Xəta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Redirect non-admin users
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Giriş Rədd Edildi</h2>
              <p className="text-gray-600">Bu bölmə yalnız rəhbərlər üçün nəzərdə tutulmuşdur.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    enabled: false // Would need to implement this endpoint
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      role: "seller",
      isActive: true,
    }
  });

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: {
      name: "",
      description: "",
    }
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const { confirmPassword, ...submitData } = userData;
      const res = await apiRequest("POST", "/api/register", submitData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "İstifadəçi yaradıldı",
        description: "Yeni istifadəçi uğurla əlavə edildi",
      });
      setIsUserModalOpen(false);
      userForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: () => {
      toast({
        title: "Xəta baş verdi",
        description: "İstifadəçi yaradıla bilmədi",
        variant: "destructive",
      });
    }
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: CategoryFormData) => {
      const res = await apiRequest("POST", "/api/categories", categoryData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Kateqoriya yaradıldı",
        description: "Yeni kateqoriya uğurla əlavə edildi",
      });
      setIsCategoryModalOpen(false);
      categoryForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: () => {
      toast({
        title: "Xəta baş verdi",
        description: "Kateqoriya yaradıla bilmədi",
        variant: "destructive",
      });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CategoryFormData> }) => {
      const res = await apiRequest("PUT", `/api/categories/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Kateqoriya yeniləndi",
        description: "Kateqoriya məlumatları uğurla yeniləndi",
      });
      setEditingCategory(null);
      setIsCategoryModalOpen(false);
      categoryForm.reset();
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

  const handleUserSubmit = (data: UserFormData) => {
    createUserMutation.mutate(data);
  };

  const handleCategorySubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    categoryForm.reset({
      name: category.name,
      description: category.description || "",
    });
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = (categoryId: number) => {
    if (confirm("Bu kateqoriyanı silmək istədiyinizə əminsiniz?")) {
      deleteCategoryMutation.mutate(categoryId);
    }
  };

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleStoreSettingsSubmit = useCallback((data: any) => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout to debounce API calls
    timeoutRef.current = setTimeout(() => {
      updateStoreSettingsMutation.mutate(data);
    }, 1000); // Wait 1 second before saving
  }, [updateStoreSettingsMutation]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className={`fixed inset-y-0 left-0 z-50 lg:relative lg:block ${sidebarOpen ? 'block' : 'hidden'}`}>
        <Sidebar userRole={user?.role} />
      </div>

      <div className="flex-1 lg:pl-0">
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Sistem Tənzimləmələri</h1>
            <p className="mt-1 text-sm text-gray-600">Sistem parametrləri və konfiqurasiya</p>
          </div>

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general" className="flex items-center">
                <SettingsIcon className="mr-2 h-4 w-4" />
                Ümumi
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                İstifadəçilər
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center">
                <Tag className="mr-2 h-4 w-4" />
                Kateqoriyalar
              </TabsTrigger>
              <TabsTrigger value="receipt" className="flex items-center">
                <Printer className="mr-2 h-4 w-4" />
                Çek Formatı
              </TabsTrigger>
              <TabsTrigger value="backup" className="flex items-center">
                <Database className="mr-2 h-4 w-4" />
                Yedəkləmə
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Mağaza Məlumatları</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="storeName">Mağaza Adı</Label>
                      <Input
                        id="storeName"
                        value={storeSettings?.storeName || ""}
                        onChange={(e) => handleStoreSettingsSubmit({ storeName: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="storeAddress">Ünvan</Label>
                      <Input
                        id="storeAddress"
                        value={storeSettings?.storeAddress || ""}
                        onChange={(e) => handleStoreSettingsSubmit({ storeAddress: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="storePhone">Telefon</Label>
                      <Input
                        id="storePhone"
                        value={storeSettings?.storePhone || ""}
                        onChange={(e) => handleStoreSettingsSubmit({ storePhone: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="storeVoen">VÖEN</Label>
                      <Input
                        id="storeVoen"
                        value={storeSettings?.storeVoen || ""}
                        onChange={(e) => handleStoreSettingsSubmit({ storeVoen: e.target.value })}
                        className="mt-1"
                        placeholder="1234567890"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Valyuta və Vergi</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="currency">Valyuta</Label>
                      <Select value={storeSettings?.currency || "AZN"} onValueChange={(value) => 
                        handleStoreSettingsSubmit({ currency: value })
                      }>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AZN">Azərbaycan Manatı (₼)</SelectItem>
                          <SelectItem value="USD">ABŞ Dolları ($)</SelectItem>
                          <SelectItem value="EUR">Avro (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="taxRate">ƏDV Dərəcəsi (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        value={storeSettings?.taxRate || 18}
                        onChange={(e) => handleStoreSettingsSubmit({ taxRate: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lowStockThreshold">Aşağı Stok Hədd</Label>
                      <Input
                        id="lowStockThreshold"
                        type="number"
                        value={storeSettings?.lowStockThreshold || 5}
                        onChange={(e) => handleStoreSettingsSubmit({ lowStockThreshold: Number(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sistem Tənzimləmələri</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Bildirişlər</Label>
                        <p className="text-sm text-gray-500">Sistem bildirişlərini aktivləşdir</p>
                      </div>
                      <Switch
                        checked={storeSettings?.notifications || true}
                        onCheckedChange={(checked) => handleStoreSettingsSubmit({ notifications: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Avtomatik Yedəkləmə</Label>
                        <p className="text-sm text-gray-500">Gündəlik avtomatik yedəkləmə</p>
                      </div>
                      <Switch
                        checked={storeSettings?.autoBackup || true}
                        onCheckedChange={(checked) => handleStoreSettingsSubmit({ autoBackup: checked })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="theme">Tema</Label>
                      <Select value={storeSettings?.theme || "light"} onValueChange={(value) => 
                        handleStoreSettingsSubmit({ theme: value })
                      }>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Açıq</SelectItem>
                          <SelectItem value="dark">Tünd</SelectItem>
                          <SelectItem value="auto">Avtomatik</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tənzimləmələri Yadda Saxla</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => toast({
                        title: "Məlumat",
                        description: "Tənzimləmələr avtomatik yadda saxlanır",
                      })} 
                      className="w-full"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Tənzimləmələr Avtomatik Saxlanır
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">İstifadəçi İdarəsi</h3>
                    <p className="text-sm text-gray-600">Sistem istifadəçilərini idarə edin</p>
                  </div>
                  <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Yeni İstifadəçi
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Yeni İstifadəçi Əlavə Et</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={userForm.handleSubmit(handleUserSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="fullName">Ad və Soyad</Label>
                            <Input
                              id="fullName"
                              {...userForm.register("fullName")}
                              placeholder="Ad və soyadını daxil edin"
                            />
                          </div>
                          <div>
                            <Label htmlFor="username">İstifadəçi adı</Label>
                            <Input
                              id="username"
                              {...userForm.register("username")}
                              placeholder="İstifadəçi adını daxil edin"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="role">Rol</Label>
                          <Select onValueChange={(value) => userForm.setValue("role", value as "admin" | "seller")}>
                            <SelectTrigger>
                              <SelectValue placeholder="Rol seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="seller">Satıcı</SelectItem>
                              <SelectItem value="admin">Rəhbər</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="password">Şifrə</Label>
                            <Input
                              id="password"
                              type="password"
                              {...userForm.register("password")}
                              placeholder="Şifrə daxil edin"
                            />
                          </div>
                          <div>
                            <Label htmlFor="confirmPassword">Şifrəni təsdiq edin</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              {...userForm.register("confirmPassword")}
                              placeholder="Şifrəni təkrar daxil edin"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsUserModalOpen(false)}
                          >
                            Ləğv et
                          </Button>
                          <Button
                            type="submit"
                            disabled={createUserMutation.isPending}
                          >
                            {createUserMutation.isPending ? "Yaradılır..." : "Yarat"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <div className="text-center py-12">
                      <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">İstifadəçi Siyahısı</h3>
                      <p className="text-gray-600">İstifadəçi idarəsi API endpoint-i tətbiq edilməlidir</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="categories">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Məhsul Kateqoriyaları</h3>
                    <p className="text-sm text-gray-600">Məhsul kateqoriyalarını idarə edin</p>
                  </div>
                  <Dialog 
                    open={isCategoryModalOpen} 
                    onOpenChange={(open) => {
                      setIsCategoryModalOpen(open);
                      if (!open) {
                        setEditingCategory(null);
                        categoryForm.reset();
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button>
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
                      <form onSubmit={categoryForm.handleSubmit(handleCategorySubmit)} className="space-y-4">
                        <div>
                          <Label htmlFor="categoryName">Kateqoriya Adı</Label>
                          <Input
                            id="categoryName"
                            {...categoryForm.register("name")}
                            placeholder="Kateqoriya adını daxil edin"
                          />
                        </div>
                        <div>
                          <Label htmlFor="categoryDescription">Təsvir</Label>
                          <Input
                            id="categoryDescription"
                            {...categoryForm.register("description")}
                            placeholder="Kateqoriya təsvirini daxil edin"
                          />
                        </div>
                        <div className="flex justify-end space-x-2 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsCategoryModalOpen(false);
                              setEditingCategory(null);
                              categoryForm.reset();
                            }}
                          >
                            Ləğv et
                          </Button>
                          <Button
                            type="submit"
                            disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                          >
                            {(createCategoryMutation.isPending || updateCategoryMutation.isPending) 
                              ? (editingCategory ? "Yenilənir..." : "Yaradılır...")
                              : (editingCategory ? "Yenilə" : "Yarat")
                            }
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <Card>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kateqoriya
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Təsvir
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Əməliyyatlar
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {categories?.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                              Hələ kateqoriya əlavə edilməyib
                            </td>
                          </tr>
                        ) : (
                          categories?.map((category: any) => (
                            <tr key={category.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Tag className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{category.name}</div>
                                    <div className="text-sm text-gray-500">ID: {category.id}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {category.description || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditCategory(category)}
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteCategory(category.id)}
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
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="receipt">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Çek Formatı Tənzimləmələri</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="receiptTemplate">Çek Şablonu</Label>
                      <Select value={storeSettings?.receiptTemplate || "standard"} onValueChange={(value) => 
                        handleStoreSettingsSubmit({ receiptTemplate: value })
                      }>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standart</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="detailed">Ətraflı</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Çekdə Göstərilən Məlumatlar</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch id="showLogo" defaultChecked />
                          <Label htmlFor="showLogo">Mağaza Loqosu</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="showAddress" defaultChecked />
                          <Label htmlFor="showAddress">Mağaza Ünvanı</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="showTax" defaultChecked />
                          <Label htmlFor="showTax">Vergi Məlumatı</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="showBarcode" defaultChecked />
                          <Label htmlFor="showBarcode">Məhsul Barkodları</Label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Çek Önizləməsi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white border-2 border-dashed border-gray-300 p-4 font-mono text-xs">
                      <div className="text-center mb-4">
                        <div className="font-bold">{storeSettings?.storeName || "Mağaza Adı"}</div>
                        <div>{storeSettings?.storeAddress || "Mağaza Ünvanı"}</div>
                        <div>{storeSettings?.storePhone || "Telefon Nömrəsi"}</div>
                      </div>
                      <div className="border-b border-gray-300 mb-2"></div>
                      <div className="mb-2">
                        <div>Tarix: {new Date().toLocaleDateString('az-AZ')}</div>
                        <div>Satış #: SAL123456789</div>
                        <div>Satıcı: {user?.fullName}</div>
                      </div>
                      <div className="border-b border-gray-300 mb-2"></div>
                      <div className="mb-2">
                        <div className="flex justify-between">
                          <span>Nümunə Məhsul</span>
                          <span>₼25.00</span>
                        </div>
                        <div className="text-gray-500">  1 x ₼25.00</div>
                      </div>
                      <div className="border-b border-gray-300 mb-2"></div>
                      <div className="mb-2">
                        <div className="flex justify-between">
                          <span>Alt Cəm:</span>
                          <span>₼25.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ƏDV ({Number(storeSettings?.taxRate) || 18}%):</span>
                          <span>₼{(25 * (Number(storeSettings?.taxRate) || 18) / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span>Ümumi:</span>
                          <span>₼{(25 + 25 * (Number(storeSettings?.taxRate) || 18) / 100).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="text-center mt-4">
                        <div>Təşəkkür edirik!</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="backup">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Yedəkləmə Tənzimləmələri</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Avtomatik Yedəkləmə</Label>
                        <p className="text-sm text-gray-500">Gündəlik avtomatik yedəkləmə</p>
                      </div>
                      <Switch
                        checked={storeSettings?.autoBackup || true}
                        onCheckedChange={(checked) => handleStoreSettingsSubmit({ autoBackup: checked })}
                      />
                    </div>
                    <div>
                      <Label>Yedəkləmə Vaxtı</Label>
                      <Input
                        type="time"
                        defaultValue="02:00"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Yedəkləmə Qovluğu</Label>
                      <Input
                        defaultValue="/backups"
                        className="mt-1"
                        readOnly
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Əl ilə Yedəkləmə</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-4">
                        Sistemin tam yedəyini indi yaradın. Bu proses bir neçə dəqiqə çəkə bilər.
                      </p>
                      <Button className="w-full">
                        <Database className="mr-2 h-4 w-4" />
                        Yedək Yarat
                      </Button>
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-600 mb-4">
                        Əvvəlcədən yaradılmış yedəyi bərpa edin.
                      </p>
                      <Button variant="outline" className="w-full">
                        <Database className="mr-2 h-4 w-4" />
                        Yedəkdən Bərpa Et
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Yedəkləmə Tarixçəsi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">backup_2024_12_15_02_00.sql</div>
                          <div className="text-sm text-gray-500">15 Dekabr 2024, 02:00</div>
                        </div>
                        <div className="flex space-x-2">
                          <Badge variant="secondary">Avtomatik</Badge>
                          <Button size="sm" variant="outline">Yüklə</Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">backup_2024_12_14_02_00.sql</div>
                          <div className="text-sm text-gray-500">14 Dekabr 2024, 02:00</div>
                        </div>
                        <div className="flex space-x-2">
                          <Badge variant="secondary">Avtomatik</Badge>
                          <Button size="sm" variant="outline">Yüklə</Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">backup_manual_2024_12_13.sql</div>
                          <div className="text-sm text-gray-500">13 Dekabr 2024, 14:30</div>
                        </div>
                        <div className="flex space-x-2">
                          <Badge>Əl ilə</Badge>
                          <Button size="sm" variant="outline">Yüklə</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
