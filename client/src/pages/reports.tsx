import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp,
  Users,
  Package,
  CreditCard,
  Download,
  Calendar,
  DollarSign,
  ShoppingCart,
  TrendingDown,
  Target
} from "lucide-react";

export default function Reports() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportType, setReportType] = useState("daily");

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard"],
  });

  const { data: sales } = useQuery({
    queryKey: ["/api/sales"],
  });

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: lowStockProducts } = useQuery({
    queryKey: ["/api/products/low-stock"],
  });

  // Calculate period statistics
  const today = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  const todaySales = sales?.filter((sale: any) => {
    const saleDate = new Date(sale.createdAt);
    return saleDate.toDateString() === today.toDateString();
  }) || [];

  const thisMonthSales = sales?.filter((sale: any) => {
    const saleDate = new Date(sale.createdAt);
    return saleDate >= thisMonth;
  }) || [];

  const lastMonthSales = sales?.filter((sale: any) => {
    const saleDate = new Date(sale.createdAt);
    return saleDate >= lastMonth && saleDate < thisMonth;
  }) || [];

  // Calculate top products
  const productSales = products?.map((product: any) => {
    const productSalesCount = sales?.reduce((count: number, sale: any) => {
      // This would need sale items data to be accurate
      return count;
    }, 0) || 0;
    
    return {
      ...product,
      salesCount: productSalesCount,
      revenue: productSalesCount * parseFloat(product.sellPrice || "0")
    };
  }).sort((a: any, b: any) => b.salesCount - a.salesCount).slice(0, 10) || [];

  // Performance metrics
  const thisMonthRevenue = thisMonthSales.reduce((sum: number, sale: any) => 
    sum + parseFloat(sale.total || "0"), 0
  );
  
  const lastMonthRevenue = lastMonthSales.reduce((sum: number, sale: any) => 
    sum + parseFloat(sale.total || "0"), 0
  );

  const revenueGrowth = lastMonthRevenue > 0 ? 
    ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100) : 0;

  const avgOrderValue = thisMonthSales.length > 0 ? 
    thisMonthRevenue / thisMonthSales.length : 0;

  const totalDebt = customers?.reduce((sum: number, customer: any) => 
    sum + parseFloat(customer.totalDebt || "0"), 0
  ) || 0;

  const reportCards = [
    {
      title: "Satış Hesabatı",
      description: "Dövrə görə satış statistikası",
      icon: BarChart3,
      color: "text-blue-600 bg-blue-50 border-blue-200",
      value: `₼${thisMonthRevenue.toFixed(2)}`,
      change: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%`,
      changeType: revenueGrowth >= 0 ? 'positive' : 'negative'
    },
    {
      title: "Anbar Hesabatı",
      description: "Stok vəziyyəti və hərəkət",
      icon: Package,
      color: "text-green-600 bg-green-50 border-green-200",
      value: `${products?.length || 0}`,
      change: `${lowStockProducts?.length || 0} aşağı stok`,
      changeType: 'neutral'
    },
    {
      title: "Müştəri Hesabatı",
      description: "Müştəri statistikası",
      icon: Users,
      color: "text-purple-600 bg-purple-50 border-purple-200",
      value: `${customers?.length || 0}`,
      change: `${thisMonthSales.length} bu ay satış`,
      changeType: 'positive'
    },
    {
      title: "Borc Hesabatı",
      description: "Nisyə və kredit vəziyyəti",
      icon: CreditCard,
      color: "text-red-600 bg-red-50 border-red-200",
      value: `₼${totalDebt.toFixed(2)}`,
      change: "Ümumi borc",
      changeType: 'negative'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className={`fixed inset-y-0 left-0 z-50 lg:relative lg:block ${sidebarOpen ? 'block' : 'hidden'}`}>
        <Sidebar userRole={user?.role} />
      </div>

      <div className="flex-1 lg:pl-0">
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Hesabatlar və Analitika</h1>
            <p className="mt-1 text-sm text-gray-600">Satış performansı və biznes analitikası</p>
          </div>

          {/* Report Types */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {reportCards.map((report, index) => (
              <Card key={index} className={`border-l-4 hover:shadow-lg transition-shadow cursor-pointer ${report.color}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{report.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                      <div className="mt-4">
                        <div className="text-2xl font-bold text-gray-900">{report.value}</div>
                        <div className={`text-sm ${
                          report.changeType === 'positive' ? 'text-green-600' :
                          report.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {report.change}
                        </div>
                      </div>
                    </div>
                    <report.icon className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Date Range Selector */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Hesabat Filtri</span>
                <Button variant="outline" className="flex items-center">
                  <Download className="mr-2 h-4 w-4" />
                  Eksport
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <Label>Hesabat Növü</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Gündəlik</SelectItem>
                      <SelectItem value="weekly">Həftəlik</SelectItem>
                      <SelectItem value="monthly">Aylıq</SelectItem>
                      <SelectItem value="custom">Xüsusi Dövrə</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Başlanğıc Tarixi</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Son Tarix</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <Button className="w-full">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Hesabat Al
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Sales Trend Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Satış Trendi
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">30 Gün</Button>
                    <Button size="sm">90 Gün</Button>
                    <Button size="sm" variant="outline">1 İl</Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Satış trendi grafikası</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Bu ay: {thisMonthSales.length} satış
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Aylıq Performans</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Satış Məqsədi</span>
                    <span>75%</span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-gray-500">
                    <span>₼{thisMonthRevenue.toFixed(2)}</span>
                    <span>₼25,000</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Orta Sifariş Dəyəri</span>
                    <span>₼{avgOrderValue.toFixed(2)}</span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '68%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Müştəri Məmnuniyyəti</span>
                    <span>92%</span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="products" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="products">Ən Çox Satılan</TabsTrigger>
              <TabsTrigger value="customers">Müştəri Analitikası</TabsTrigger>
              <TabsTrigger value="inventory">Anbar Analitikası</TabsTrigger>
            </TabsList>

            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle>Ən Çox Satılan Məhsullar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {productSales.slice(0, 10).map((product: any, index: number) => (
                      <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500">{product.brand || 'Marka yoxdur'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{product.stock} ədəd stok</p>
                          <p className="text-sm text-gray-500">₼{product.sellPrice}</p>
                        </div>
                      </div>
                    ))}
                    {productSales.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Məhsul satış statistikası mövcud deyil
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customers">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Müştəri Statistikaları</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Ümumi Müştəri</span>
                      <Badge variant="secondary">{customers?.length || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Borcu Olan</span>
                      <Badge variant="destructive">
                        {customers?.filter((c: any) => parseFloat(c.totalDebt || "0") > 0).length || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Bu Ay Alış-Veriş</span>
                      <Badge>{thisMonthSales.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Orta Alış-Veriş</span>
                      <Badge variant="outline">₼{avgOrderValue.toFixed(2)}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Müştərilər</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {customers?.slice(0, 5).map((customer: any, index: number) => (
                        <div key={customer.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium mr-3">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                              <p className="text-xs text-gray-500">{customer.phone}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">₼{customer.totalDebt || "0.00"}</p>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-4 text-gray-500">
                          Müştəri məlumatı yoxdur
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="inventory">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Anbar Statistikaları</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Ümumi Məhsul</span>
                      <Badge variant="secondary">{products?.length || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Aşağı Stok</span>
                      <Badge variant="destructive">{lowStockProducts?.length || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Stokda Yox</span>
                      <Badge variant="outline">
                        {products?.filter((p: any) => p.stock === 0).length || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium">Anbar Dəyəri</span>
                      <Badge>₼{dashboardStats?.inventoryValue || "0.00"}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Stok Xəbərdarlıqları</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {lowStockProducts?.slice(0, 5).map((product: any) => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded border border-yellow-200">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.brand}</p>
                          </div>
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            {product.stock} ədəd
                          </Badge>
                        </div>
                      )) || (
                        <div className="text-center py-4 text-gray-500">
                          Stok xəbərdarlığı yoxdur
                        </div>
                      )}
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
