import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Printer, 
  Download,
  Eye,
  Share,
  Mail
} from "lucide-react";

interface ReceiptPrinterProps {
  sale: any;
  items?: any[];
}

export function ReceiptPrinter({ sale, items = [] }: ReceiptPrinterProps) {
  const { toast } = useToast();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const currentDate = new Date().toLocaleDateString('az-AZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handlePrint = () => {
    if (receiptRef.current) {
      const printContent = receiptRef.current.innerHTML;
      const originalContent = document.body.innerHTML;
      
      document.body.innerHTML = `
        <div class="receipt-print">
          ${printContent}
        </div>
      `;
      
      // Add print styles
      const style = document.createElement('style');
      style.textContent = `
        @media print {
          body { margin: 0; padding: 20px; font-family: 'Courier New', monospace; }
          .receipt-print { max-width: 80mm; margin: 0 auto; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
      `;
      document.head.appendChild(style);
      
      window.print();
      
      // Restore original content
      document.body.innerHTML = originalContent;
      
      toast({
        title: "Çek çap edildi",
        description: "Çek uğurla çap edildi",
      });
    }
  };

  const handleDownload = () => {
    if (receiptRef.current) {
      const receiptContent = receiptRef.current.innerText;
      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `çek_${sale.saleNumber || 'receipt'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Çek yükləndi",
        description: "Çek faylı yükləndi",
      });
    }
  };

  const handleEmailSend = () => {
    const subject = `Çek - ${sale.saleNumber}`;
    const body = `Satış çeki əlavə edilmişdir.\n\nSatış nömrəsi: ${sale.saleNumber}\nTarix: ${currentDate}\nMəbləğ: ₼${sale.total}`;
    
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Çek - ${sale.saleNumber}`,
          text: `Satış çeki\nNömrə: ${sale.saleNumber}\nMəbləğ: ₼${sale.total}`,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      const shareText = `Çek: ${sale.saleNumber}\nMəbləğ: ₼${sale.total}`;
      navigator.clipboard.writeText(shareText).then(() => {
        toast({
          title: "Məlumat kopyalandı",
          description: "Çek məlumatları buferə kopyalandı",
        });
      });
    }
  };

  const Receipt = () => (
    <div ref={receiptRef} className="receipt bg-white p-6 font-mono text-sm max-w-sm mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-lg font-bold mb-2">MAĞAZA İDARƏETMƏ SİSTEMİ</div>
        <div className="text-sm text-gray-600">
          <div>Bakı şəhəri, Nəsimi rayonu</div>
          <div>Telefon: +994 12 555 55 55</div>
          <div>VÖEN: 1234567890</div>
        </div>
      </div>

      {/* Sale Info */}
      <div className="border-t border-b border-gray-300 py-3 mb-4">
        <div className="flex justify-between mb-1">
          <span>Çek №:</span>
          <span className="font-bold">{sale.saleNumber}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>Tarix:</span>
          <span>{currentDate}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span>Satıcı:</span>
          <span>{sale.user?.fullName || 'Sistem'}</span>
        </div>
        {sale.customer && (
          <div className="flex justify-between">
            <span>Müştəri:</span>
            <span>{sale.customer.name}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="mb-4">
        <div className="font-bold mb-2">MƏHSULLAR:</div>
        {items.length > 0 ? (
          items.map((item: any, index: number) => (
            <div key={index} className="mb-3">
              <div className="flex justify-between">
                <span className="flex-1">{item.product?.name || `Məhsul ${index + 1}`}</span>
                <span>₼{item.total}</span>
              </div>
              <div className="text-xs text-gray-600 ml-2">
                {item.quantity} x ₼{item.unitPrice}
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-500 italic">Məhsul detalları mövcud deyil</div>
        )}
      </div>

      {/* Totals */}
      <div className="border-t border-gray-300 pt-3 mb-4">
        <div className="flex justify-between mb-1">
          <span>Alt cəm:</span>
          <span>₼{sale.subtotal}</span>
        </div>
        {parseFloat(sale.discount || "0") > 0 && (
          <div className="flex justify-between mb-1">
            <span>Endirim:</span>
            <span>-₼{sale.discount}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
          <span>ÜMUMİ:</span>
          <span>₼{sale.total}</span>
        </div>
      </div>

      {/* Payment Info */}
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span>Ödəniş növü:</span>
          <span>
            {sale.paymentType === 'cash' ? 'Nəğd' :
             sale.paymentType === 'credit' ? 'Nisyə' :
             sale.paymentType === 'installment' ? 'Taksit' : sale.paymentType}
          </span>
        </div>
        <div className="flex justify-between mb-1">
          <span>Ödənilən:</span>
          <span>₼{sale.paidAmount}</span>
        </div>
        {parseFloat(sale.remainingAmount || "0") > 0 && (
          <div className="flex justify-between font-bold text-red-600">
            <span>Qalıq borc:</span>
            <span>₼{sale.remainingAmount}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center border-t border-gray-300 pt-4">
        <div className="mb-2">TƏŞƏKKÜR EDİRİK!</div>
        <div className="text-xs text-gray-600">
          <div>Çek 30 gün ərzində saxlanmalıdır</div>
          <div>Zəmanətli məhsullar üçün çek tələb olunur</div>
        </div>
      </div>

      {/* Barcode representation */}
      <div className="text-center mt-4">
        <div className="font-mono text-xs tracking-widest bg-gray-100 p-2 rounded">
          |||| | |||| ||| || ||||
        </div>
        <div className="text-xs text-gray-500 mt-1">{sale.saleNumber}</div>
      </div>
    </div>
  );

  return (
    <div className="flex space-x-2">
      {/* Print Button */}
      <Button onClick={handlePrint} className="flex-1">
        <Printer className="mr-2 h-4 w-4" />
        Çap Et
      </Button>

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Çek Önizləməsi</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <Receipt />
          </div>
          <div className="flex space-x-2 mt-4">
            <Button onClick={handlePrint} className="flex-1">
              <Printer className="mr-2 h-4 w-4" />
              Çap Et
            </Button>
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="h-4 w-4" />
            </Button>
            <Button onClick={handleEmailSend} variant="outline" size="sm">
              <Mail className="h-4 w-4" />
            </Button>
            <Button onClick={handleShare} variant="outline" size="sm">
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
