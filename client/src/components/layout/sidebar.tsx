import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package,
  Users,
  Truck,
  CreditCard,
  BarChart3,
  Settings,
  Store
} from "lucide-react";

const navigation = [
  { name: "İdarə Paneli", href: "/", icon: LayoutDashboard },
  { name: "Satış", href: "/sales", icon: ShoppingCart },
  { name: "Anbar", href: "/inventory", icon: Package },
  { name: "Müştərilər", href: "/customers", icon: Users },
  { name: "Tədarükçülər", href: "/suppliers", icon: Truck },
  { name: "Nisyə/Kredit", href: "/credit", icon: CreditCard },
  { name: "Hesabatlar", href: "/reports", icon: BarChart3 },
  { name: "Tənzimləmələr", href: "/settings", icon: Settings, adminOnly: true },
];

interface SidebarProps {
  userRole?: string;
}

export function Sidebar({ userRole }: SidebarProps) {
  const [location] = useLocation();

  const filteredNavigation = navigation.filter(
    item => !item.adminOnly || userRole === "admin"
  );

  return (
    <div className="flex h-full w-64 flex-col bg-white shadow-lg">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center bg-primary">
        <Store className="h-6 w-6 text-white mr-2" />
        <span className="text-white text-xl font-semibold">Mağaza Sistemi</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {filteredNavigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-blue-50 border-r-4 border-primary text-primary"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </a>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
