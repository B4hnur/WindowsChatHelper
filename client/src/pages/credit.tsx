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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCreditPaymentSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  Plus,
  Search,
  DollarSign,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { z } from "zod";

const paymentFormSchema = insertCreditPaymentSchema.omit({ userId: true });
type PaymentFormData = z.infer<typeof paymentFormSchema>;

export default function Credit() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: creditPayments } = useQuery({
    queryKey: ["/api/credit-payments"],
  });

  const { data: sales } = useQuery({
    queryKey: ["/api/sales"],
  });

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: "0.00",
      note: "",
    }
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (paymentData: PaymentFormData) => {
      const res = await apiRequest("POST", "/api/credit-payments", paymentData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Ödəniş qeydə alındı",
        description: "Kredit ödənişi uğurla əlavə edildi",
      });
      setIsPaymentModalOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/credit-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
    },
    onError: () => {
      toast({
        title: "Xəta baş verdi",
        description: "Ödəniş qeydə alına bilmədi",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (data: PaymentFormData) => {
    createPaymentMutation.mutate(data);
  };

  // Filter customers with debt
  const customersWithDebt = customers?.filter((customer: any) => 
    parseFloat(customer.totalDebt || "0") > 0
  ) || [];

  // Filter credit sales
  const creditSales = sales?.filter((sale: any) => 
    sale.paymentType === 'credit' || sale.paymentType === 'installment'
  ) || [];

  // Calculate statistics
  const totalDebt = customers?.reduce((sum: number, customer: any) => 
    sum + parseFloat(customer.totalDebt || "0"), 0
  ) || 0;

  const totalPayments = creditPayments?.reduce((sum: number, payment: any) => 
    sum + parseFloat(payment.amount || "0"), 0
  ) || 0;

  const overduePayments = creditSales.filter((sale: any) => {
    const saleDate = new Date(sale.createdAt);
    const daysDiff = Math.floor((Date.now() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
    return parseFloat(sale.remainingAmount || "0") > 0 && daysDiff > 30;
  });

  // Filter and paginate data
  const filteredCustomers = customersWithDebt.filter((customer: any) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPayments = creditPayments?.filter((payment: any) => {
    if (!selectedCustomer) return true;
    return payment.customerId.toString() === selectedCustomer;
  }) || [];

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
              <h1 className="text-2xl font-bold text-gray-900">Nisyə və Kredit İdarəsi</h1>
              <p className="mt-1 text-sm text-gray-600">Müştəri borcları və kredit ödənişləri</p>
            </div>
            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Ödəniş
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Kredit Ödənişi Əlavə Et</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="customerId">Müştəri*</Label>
                    <Select onValueChange={(value) => form.setValue("customerId", parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Müştəri seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {customersWithDebt.map((customer: any) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name} - ₼{parseFloat(customer.totalDebt || "0").toFixed(2)} borc
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="saleId">Satış*</Label>
                    <Select onValueChange={(value) => form.setValue("saleId", parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Satış seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {creditSales.map((sale: any) => (
                          <SelectItem key={sale.id} value={sale.id.toString()}>
                            {sale.saleNumber} - ₼{sale.remainingAmount} qalıq
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="amount">Ödəniş Məbləği*</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      {...form.register("amount")}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="note">Qeyd</Label>
                    <Input
                      id="note"
                      {...form.register("note")}
                      placeholder="Ödəniş qeydi"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsPaymentModalOpen(false)}
                    >
                      Ləğv et
                    </Button>
                    <Button
                      type="submit"
                      disabled={createPaymentMutation.isPending}
                    >
                      {createPaymentMutation.isPending ? "Əlavə edilir..." : "Əlavə et"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Credit Stats */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-4 mb-8">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <CreditCard className="h-6 w-6 text-red-600 mr-4" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Ümumi Borc</div>
                    <div className="text-lg font-medium text-gray-900">
                      ₼{totalDebt.toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <DollarSign className="h-6 w-6 text-green-600 mr-4" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Ödənilən Məbləğ</div>
                    <div className="text-lg font-medium text-gray-900">
                      ₼{totalPayments.toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <Users className="h-6 w-6 text-blue-600 mr-4" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Borcu Olan</div>
                    <div className="text-lg font-medium text-gray-900">
                      {customersWithDebt.length}
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
                    <div className="text-sm font-medium text-gray-500">Gecikmiş Ödəniş</div>
                    <div className="text-lg font-medium text-gray-900">
                      {overduePayments.length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="customers" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="customers">Borcu Olan Müştərilər</TabsTrigger>
              <TabsTrigger value="payments">Ödəniş Tarixçəsi</TabsTrigger>
            </TabsList>

            <TabsContent value="customers">
              {/* Search for customers */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <Label>Axtarış</Label>
                      <div className="relative mt-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Müştəri adı və ya telefon..."
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

              {/* Customers with debt table */}
              <Card>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Müştəri
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Borc Məbləği
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Son Ödəniş
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Əməliyyatlar
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                            {searchQuery ? "Axtarış nəticəsi tapılmadı" : "Borcu olan müştəri yoxdur"}
                          </td>
                        </tr>
                      ) : (
                        paginatedCustomers.map((customer: any) => {
                          const lastPayment = creditPayments?.filter((p: any) => p.customerId === customer.id)
                            .sort((a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0];
                          
                          const debt = parseFloat(customer.totalDebt || "0");
                          const isOverdue = debt > 0; // Simplified overdue logic
                          
                          return (
                            <tr key={customer.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Users className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                                    <div className="text-sm text-gray-500">{customer.phone}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-lg font-semibold text-red-600">
                                  ₼{debt.toFixed(2)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {lastPayment ? 
                                  new Date(lastPayment.paymentDate).toLocaleDateString('az-AZ') : 
                                  "Ödəniş yoxdur"
                                }
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge 
                                  variant={isOverdue ? "destructive" : "secondary"}
                                  className="flex items-center w-fit"
                                >
                                  {isOverdue ? (
                                    <>
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Gecikmiş
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Normal
                                    </>
                                  )}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    form.setValue("customerId", customer.id);
                                    setIsPaymentModalOpen(true);
                                  }}
                                >
                                  Ödəniş Al
                                </Button>
                              </td>
                            </tr>
                          );
                        })
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
                            {Math.min(currentPage * itemsPerPage, filteredCustomers.length)}
                          </span>
                          {" / "}
                          <span className="font-medium">{filteredCustomers.length}</span>
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
            </TabsContent>

            <TabsContent value="payments">
              {/* Payment filter */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <Label>Müştəriyə görə süzgəc</Label>
                      <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Bütün müştərilər" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Bütün müştərilər</SelectItem>
                          {customers?.map((customer: any) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={() => setSelectedCustomer("")}
                        variant="outline"
                      >
                        Təmizlə
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment history table */}
              <Card>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tarix
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Müştəri
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Satış Nömrəsi
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Məbləğ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Qeyd
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Qəbul edən
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPayments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            {selectedCustomer ? "Bu müştəri üçün ödəniş yoxdur" : "Hələ ödəniş qeydə alınmayıb"}
                          </td>
                        </tr>
                      ) : (
                        filteredPayments.slice(0, 20).map((payment: any) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(payment.paymentDate).toLocaleDateString('az-AZ')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {payment.customer?.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {payment.sale?.saleNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-green-600">
                                ₼{parseFloat(payment.amount).toFixed(2)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {payment.note || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {payment.user?.fullName}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
