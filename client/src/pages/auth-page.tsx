import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { Store, Loader2 } from "lucide-react";

const loginSchema = insertUserSchema.pick({ username: true, password: true });
const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Şifrələr uyğun gəlmir",
  path: ["confirmPassword"],
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("login");

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" }
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { 
      username: "", 
      password: "", 
      confirmPassword: "",
      fullName: "",
      role: "seller"
    }
  });

  // Redirect if already logged in
  if (user) {
    navigate("/");
    return null;
  }

  const handleLogin = (data: LoginData) => {
    loginMutation.mutate(data, {
      onSuccess: () => navigate("/")
    });
  };

  const handleRegister = (data: RegisterData) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData, {
      onSuccess: () => navigate("/")
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center mb-6">
              <Store className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Mağaza İdarəetmə</h1>
            <p className="text-gray-600 mt-2">Sistemə xoş gəlmisiniz</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Giriş</TabsTrigger>
              <TabsTrigger value="register">Qeydiyyat</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Hesabınıza daxil olun</CardTitle>
                  <CardDescription>
                    İstifadəçi adı və şifrənizi daxil edin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <div>
                      <Label htmlFor="login-username">İstifadəçi adı</Label>
                      <Input
                        id="login-username"
                        {...loginForm.register("username")}
                        placeholder="İstifadəçi adınızı daxil edin"
                        className="mt-1"
                      />
                      {loginForm.formState.errors.username && (
                        <p className="text-sm text-red-600 mt-1">
                          {loginForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="login-password">Şifrə</Label>
                      <Input
                        id="login-password"
                        type="password"
                        {...loginForm.register("password")}
                        placeholder="Şifrənizi daxil edin"
                        className="mt-1"
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-red-600 mt-1">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gəzin...
                        </>
                      ) : (
                        "Daxil ol"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Yeni hesab yaradın</CardTitle>
                  <CardDescription>
                    Qeydiyyat üçün məlumatları daxil edin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                    <div>
                      <Label htmlFor="register-fullname">Ad və Soyad</Label>
                      <Input
                        id="register-fullname"
                        {...registerForm.register("fullName")}
                        placeholder="Ad və soyadınızı daxil edin"
                        className="mt-1"
                      />
                      {registerForm.formState.errors.fullName && (
                        <p className="text-sm text-red-600 mt-1">
                          {registerForm.formState.errors.fullName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="register-username">İstifadəçi adı</Label>
                      <Input
                        id="register-username"
                        {...registerForm.register("username")}
                        placeholder="İstifadəçi adını seçin"
                        className="mt-1"
                      />
                      {registerForm.formState.errors.username && (
                        <p className="text-sm text-red-600 mt-1">
                          {registerForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="register-role">Rol</Label>
                      <Select onValueChange={(value) => registerForm.setValue("role", value as "admin" | "seller")}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Rol seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="seller">Satıcı</SelectItem>
                          <SelectItem value="admin">Rəhbər</SelectItem>
                        </SelectContent>
                      </Select>
                      {registerForm.formState.errors.role && (
                        <p className="text-sm text-red-600 mt-1">
                          {registerForm.formState.errors.role.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="register-password">Şifrə</Label>
                      <Input
                        id="register-password"
                        type="password"
                        {...registerForm.register("password")}
                        placeholder="Şifrə daxil edin"
                        className="mt-1"
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-red-600 mt-1">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="register-confirm-password">Şifrəni təsdiq edin</Label>
                      <Input
                        id="register-confirm-password"
                        type="password"
                        {...registerForm.register("confirmPassword")}
                        placeholder="Şifrəni təkrar daxil edin"
                        className="mt-1"
                      />
                      {registerForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-600 mt-1">
                          {registerForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Qeydiyyat...
                        </>
                      ) : (
                        "Qeydiyyatdan keç"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <div className="mx-auto h-32 w-32 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Store className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Mağaza İdarəetmə Sistemi
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            Satış, anbar, müştəri və hesabat idarəsi üçün hərtərəfli həll. 
            Biznesinizi səmərəli idarə edin və gəlirlərinizi artırın.
          </p>
          
          <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
            <div className="bg-white/50 rounded-lg p-4">
              <div className="font-semibold text-gray-900">Satış İdarəsi</div>
              <div className="text-gray-600">Nəğd, nisyə və kredit</div>
            </div>
            <div className="bg-white/50 rounded-lg p-4">
              <div className="font-semibold text-gray-900">Anbar İzləmə</div>
              <div className="text-gray-600">Avtomatik stok xəbərdarlığı</div>
            </div>
            <div className="bg-white/50 rounded-lg p-4">
              <div className="font-semibold text-gray-900">Müştəri İdarəsi</div>
              <div className="text-gray-600">Borc və kredit izləmə</div>
            </div>
            <div className="bg-white/50 rounded-lg p-4">
              <div className="font-semibold text-gray-900">Hesabatlar</div>
              <div className="text-gray-600">Ətraflı analitika</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
