import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Camera, 
  X, 
  RotateCcw,
  Flashlight,
  FlashlightOff,
  Keyboard
} from "lucide-react";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCamera, setCurrentCamera] = useState<string>("");

  useEffect(() => {
    startCamera();
    getCameras();
    
    return () => {
      stopCamera();
    };
  }, []);

  const getCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameras(videoDevices);
      
      // Try to find back camera (usually contains "back" or "rear" in label)
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      );
      
      if (backCamera) {
        setCurrentCamera(backCamera.deviceId);
      } else if (videoDevices.length > 0) {
        setCurrentCamera(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Error getting cameras:', error);
    }
  };

  const startCamera = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' }, // Prefer back camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }
      };

      if (currentCamera) {
        constraints.video = {
          ...constraints.video,
          deviceId: { exact: currentCamera }
        };
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      
      setIsScanning(true);
      startBarcodeDetection();
    } catch (error) {
      console.error('Error starting camera:', error);
      toast({
        title: "Kamera xətası",
        description: "Kameraya giriş mümkün olmadı. Əl ilə daxil etmə rejimini istifadə edin.",
        variant: "destructive",
      });
      setShowManualInput(true);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  const restartCamera = async () => {
    stopCamera();
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  const toggleFlash = async () => {
    if (stream) {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      
      if (capabilities.torch) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !flashOn } as any]
          });
          setFlashOn(!flashOn);
        } catch (error) {
          console.error('Flash not supported:', error);
          toast({
            title: "Flash dəstəklənmir",
            description: "Bu cihazda flash işığı mövcud deyil",
            variant: "destructive",
          });
        }
      }
    }
  };

  const startBarcodeDetection = () => {
    // In a real implementation, you would use a library like:
    // - ZXing-js for JavaScript barcode scanning
    // - QuaggaJS for barcode detection
    // - Or the experimental BarcodeDetector API if available
    
    // For now, we'll simulate barcode detection
    if ('BarcodeDetector' in window) {
      // Use experimental BarcodeDetector API if available
      const barcodeDetector = new (window as any).BarcodeDetector({
        formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e']
      });

      const detect = async () => {
        if (videoRef.current && isScanning) {
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const barcode = barcodes[0].rawValue;
              onScan(barcode);
              onClose();
              return;
            }
          } catch (error) {
            console.error('Barcode detection error:', error);
          }
          
          // Continue scanning
          setTimeout(detect, 100);
        }
      };
      
      detect();
    } else {
      // Fallback: show manual input after a few seconds
      setTimeout(() => {
        if (isScanning) {
          toast({
            title: "Barkod skaneri dəstəklənmir",
            description: "Barkodu əl ilə daxil etməyə keçin",
            variant: "destructive",
          });
          setShowManualInput(true);
        }
      }, 3000);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      onClose();
    }
  };

  const switchCamera = async () => {
    if (cameras.length > 1) {
      const currentIndex = cameras.findIndex(camera => camera.deviceId === currentCamera);
      const nextIndex = (currentIndex + 1) % cameras.length;
      const nextCamera = cameras[nextIndex];
      
      setCurrentCamera(nextCamera.deviceId);
      stopCamera();
      
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Camera className="mr-2 h-5 w-5" />
              Barkod Skaneri
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!showManualInput ? (
            <>
              {/* Camera View */}
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                
                {/* Scanning Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="barcode-overlay">
                    <div className="border-2 border-primary rounded-lg w-48 h-24 relative">
                      <div className="absolute inset-0 border-4 border-transparent">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary"></div>
                      </div>
                      
                      {/* Scanning Line Animation */}
                      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-primary opacity-75 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Camera Controls */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={toggleFlash}
                    className="bg-black/50 hover:bg-black/70 text-white"
                  >
                    {flashOn ? <FlashlightOff className="h-4 w-4" /> : <Flashlight className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={restartCamera}
                    className="bg-black/50 hover:bg-black/70 text-white"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  
                  {cameras.length > 1 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={switchCamera}
                      className="bg-black/50 hover:bg-black/70 text-white"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Barkodu kamera görüş sahəsinə yerləşdirin
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowManualInput(true)}
                  className="flex items-center"
                >
                  <Keyboard className="mr-2 h-4 w-4" />
                  Əl ilə daxil edin
                </Button>
              </div>
            </>
          ) : (
            /* Manual Input */
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <Label htmlFor="manualBarcode">Barkodu əl ilə daxil edin</Label>
                <Input
                  id="manualBarcode"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Barkodu yazın və Enter basın"
                  autoFocus
                  className="mt-2"
                />
              </div>
              
              <div className="flex space-x-2">
                <Button type="submit" disabled={!manualInput.trim()}>
                  Təsdiq et
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowManualInput(false)}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Kameraya qayıt
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
