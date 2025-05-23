import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Info,
  Calendar,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function Dashboard() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard"],
  });

  const { data: sales } = useQuery({
    queryKey: ["/api/sales?limit=5"],
  });

  const { data: lowStockProducts } = useQuery({
    queryKey: ["/api/products/low-stock"],
  });

  const currentDate = new Date().toLocaleDateString('az-AZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const quickActions = [
    {
      title: "Yeni Satış",
      description: "Satış əməliyyatı başladın",
      icon: ShoppingCart,
      href: "/sales",
      color: "text-blue-600 bg-blue-50 hover:bg-blue-100"
    },
    {
      title: "Mal Alışı",
      description: "Yeni məhsul əlavə edin",
      icon: Package,
      href: "/inventory",
      color: "text-green-600 bg-green-50 hover:bg-green-100"
    },
    {
      title: "Anbar",
      description: "Stok vəziyyətini izləyin",
      icon: Package,
      href: "/inventory",
      color: "text-orange-600 bg-orange-50 hover:bg-orange-100"
    },
    {
      title: "Hesabatlar",
      description: "Performans analitikası",
      icon: TrendingUp,
      href: "/reports",
      color: "text-purple-600 bg-purple-50 hover:bg-purple-100"
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 lg:relative lg:block ${sidebarOpen ? 'block' : 'hidden'}`}>
        <Sidebar userRole={user?.role} />
      </div>

      {/* Main content */}
      <div className="flex-1 lg:pl-0">
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">İdarə Paneli</h1>
            <p className="mt-1 text-sm text-gray-600">
              Bugünkü tarix: {currentDate}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="text-sm font-medium text-gray-500">Bugünkü Satış</div>
                    <div className="text-lg font-medium text-gray-900">
                      ₼{stats?.todaySales || "0.00"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ShoppingCart className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="text-sm font-medium text-gray-500">Bugünkü Sifarişlər</div>
                    <div className="text-lg font-medium text-gray-900">
                      {stats?.todayOrders || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Package className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="text-sm font-medium text-gray-500">Anbar Qalığı</div>
                    <div className="text-lg font-medium text-gray-900">
                      ₼{stats?.inventoryValue || "0.00"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CreditCard className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="text-sm font-medium text-gray-500">Borc Qalığı</div>
                    <div className="text-lg font-medium text-gray-900">
                      ₼{stats?.totalDebt || "0.00"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Tez Əməliyyatlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {quickActions.map((action, index) => (
                  <Link key={index} href={action.href}>
                    <Button
                      variant="outline"
                      className={`h-auto p-4 flex flex-col items-center space-y-2 ${action.color} border-2 border-dashed transition-colors`}
                    >
                      <action.icon className="h-6 w-6" />
                      <div className="text-center">
                        <div className="font-medium text-sm">{action.title}</div>
                        <div className="text-xs text-gray-600">{action.description}</div>
                      </div>
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities & Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Sales */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Son Satışlar</CardTitle>
                <Link href="/sales">
                  <Button variant="ghost" size="sm">
                    Hamısına bax <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sales?.slice(0, 5).map((sale: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {sale.customer?.name || "Nəğd satış"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(sale.createdAt).toLocaleTimeString('az-AZ', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        ₼{sale.total}
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-4 text-gray-500">
                      Hələ satış yoxdur
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Alerts & Notifications */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Xəbərdarlıqlar</CardTitle>
                <Badge variant="secondary">{(lowStockProducts?.length || 0) + 1}</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Low stock alerts */}
                  {lowStockProducts?.slice(0, 3).map((product: any, index: number) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">Aşağı Stok</p>
                        <p className="text-sm text-gray-500">
                          {product.name} stoku {product.stock} ədədə düşüb
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date().toLocaleTimeString('az-AZ')}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* System notification */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Info className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">Sistem Məlumatı</p>
                      <p className="text-sm text-gray-500">
                        Mağaza idarəetmə sistemi aktiv və işləyir
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Bugün</p>
                    </div>
                  </div>

                  {lowStockProducts?.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      Xəbərdarlıq yoxdur
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
