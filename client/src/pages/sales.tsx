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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { ReceiptPrinter } from "@/components/receipt-printer";
import { 
  Minus, 
  Plus, 
  Trash2, 
  Scan, 
  PrinterCheck,
  Check
} from "lucide-react";

interface CartItem {
  productId: number;
  name: string;
  barcode: string;
  unitPrice: string;
  quantity: number;
  total: string;
}

export default function Sales() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [paymentType, setPaymentType] = useState<"cash" | "credit" | "installment">("cash");
  const [discount, setDiscount] = useState<number>(0);
  const [showScanner, setShowScanner] = useState(false);
  const [completedSale, setCompletedSale] = useState<any>(null);

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
  });

  const scanProductMutation = useMutation({
    mutationFn: async (barcode: string) => {
      const res = await apiRequest("GET", `/api/products/barcode/${barcode}`);
      return await res.json();
    },
    onSuccess: (product) => {
      addToCart(product);
    },
    onError: () => {
      toast({
        title: "Məhsul tapılmadı",
        description: "Bu barkodla məhsul mövcud deyil",
        variant: "destructive",
      });
    }
  });

  const createSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      const res = await apiRequest("POST", "/api/sales", saleData);
      return await res.json();
    },
    onSuccess: (sale) => {
      toast({
        title: "Satış tamamlandı",
        description: `Satış nömrəsi: ${sale.saleNumber}`,
      });
      setCompletedSale(sale);
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: () => {
      toast({
        title: "Xəta baş verdi",
        description: "Satış tamamlana bilmədi",
        variant: "destructive",
      });
    }
  });

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      updateQuantity(existingItem.productId, existingItem.quantity + 1);
    } else {
      const newItem: CartItem = {
        productId: product.id,
        name: product.name,
        barcode: product.barcode || "",
        unitPrice: product.sellPrice,
        quantity: 1,
        total: product.sellPrice
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item => {
      if (item.productId === productId) {
        const total = (parseFloat(item.unitPrice) * newQuantity).toFixed(2);
        return { ...item, quantity: newQuantity, total };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer("");
    setPaymentType("cash");
    setDiscount(0);
    setBarcodeInput("");
  };

  const handleBarcodeScan = (barcode: string) => {
    scanProductMutation.mutate(barcode);
    setBarcodeInput("");
    setShowScanner(false);
  };

  const handleBarcodeInput = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      handleBarcodeScan(barcodeInput.trim());
    }
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + parseFloat(item.total), 0);
  };

  const calculateDiscountAmount = () => {
    return (calculateSubtotal() * discount) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscountAmount();
  };

  const completeSale = () => {
    if (cart.length === 0) {
      toast({
        title: "Səbət boşdur",
        description: "Satış üçün məhsul əlavə edin",
        variant: "destructive",
      });
      return;
    }

    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscountAmount();
    const total = calculateTotal();

    const saleData = {
      sale: {
        customerId: selectedCustomer ? parseInt(selectedCustomer) : null,
        paymentType,
        subtotal: subtotal.toFixed(2),
        discount: discountAmount.toFixed(2),
        total: total.toFixed(2),
        paidAmount: paymentType === 'cash' ? total.toFixed(2) : "0.00",
        remainingAmount: paymentType === 'cash' ? "0.00" : total.toFixed(2),
      },
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      }))
    };

    createSaleMutation.mutate(saleData);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className={`fixed inset-y-0 left-0 z-50 lg:relative lg:block ${sidebarOpen ? 'block' : 'hidden'}`}>
        <Sidebar userRole={user?.role} />
      </div>

      <div className="flex-1 lg:pl-0">
        <Topbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Satış Modulu</h1>
            <p className="mt-1 text-sm text-gray-600">Yeni satış əməliyyatı aparın</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Product Selection */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Məhsul Seçimi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Barcode Scanner */}
                  <div>
                    <Label>Barkod Skan</Label>
                    <div className="flex mt-2">
                      <Input
                        placeholder="Barkodu skan edin və ya daxil edin..."
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        onKeyPress={handleBarcodeInput}
                        className="flex-1 rounded-r-none"
                      />
                      <Button
                        onClick={() => setShowScanner(true)}
                        className="rounded-l-none"
                        type="button"
                      >
                        <Scan className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Cart Items */}
                  <div className="space-y-3">
                    {cart.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Məhsul seçin və ya barkod skan edin
                      </div>
                    ) : (
                      cart.map((item) => (
                        <div key={item.productId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center">
                            <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <span className="text-xs font-medium">{item.name.charAt(0)}</span>
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-900">{item.name}</p>
                              <p className="text-sm text-gray-500">Barkod: {item.barcode}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="font-medium w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium text-gray-900 min-w-16 text-right">
                              ₼{item.total}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFromCart(item.productId)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sale Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Satış Məlumatları</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Customer Selection */}
                  <div>
                    <Label>Müştəri</Label>
                    <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Nəğd satış" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Nəğd satış</SelectItem>
                        {customers?.map((customer: any) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment Type */}
                  <div>
                    <Label>Ödəniş növü</Label>
                    <RadioGroup 
                      value={paymentType} 
                      onValueChange={(value: "cash" | "credit" | "installment") => setPaymentType(value)}
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cash" id="cash" />
                        <Label htmlFor="cash">Nəğd</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="credit" id="credit" />
                        <Label htmlFor="credit">Nisyə</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="installment" id="installment" />
                        <Label htmlFor="installment">Kreditlə</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Discount */}
                  <div>
                    <Label>Endirim (%)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="mt-2"
                      min="0"
                      max="100"
                    />
                  </div>

                  {/* Total Calculation */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Məbləğ:</span>
                      <span>₼{calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Endirim:</span>
                      <span>₼{calculateDiscountAmount().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold border-t pt-2">
                      <span>Ümumi:</span>
                      <span>₼{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4">
                    <Button
                      onClick={completeSale}
                      disabled={cart.length === 0 || createSaleMutation.isPending}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {createSaleMutation.isPending ? "Təsdiq edilir..." : "Satışı Tamamla"}
                    </Button>
                    
                    {completedSale && (
                      <ReceiptPrinter sale={completedSale} />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
