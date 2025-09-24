"use client";

import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Building2,
  Calculator,
  FileText,
  Package,
  Plus,
  Settings,
  Users,
  FolderOpen,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Documents", href: "/documents", icon: FolderOpen },
  { name: "Quotations", href: "/quotations", icon: FileText },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Chalans", href: "/chalans", icon: Truck },
  { name: "Products", href: "/products", icon: Package },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Vendors", href: "/vendors", icon: Building2 },
  { name: "Pricing", href: "/pricing", icon: Calculator },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-sm transition-all duration-300 z-50 ${
        isExpanded ? "w-64" : "w-16"
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="flex items-center h-16 px-4 border-b border-gray-200">
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/logo.png"
              alt="Steelroot Traders"
              width={32}
              height={32}
              className="h-8 w-8 flex-shrink-0"
            />
            <div
              className={`transition-all duration-300 ${
                isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
              } overflow-hidden`}
            >
              <div className="text-sm font-bold text-blue-900 whitespace-nowrap">
                STEELROOT
              </div>
              <div className="text-xs text-teal-600 font-medium tracking-wider whitespace-nowrap">
                TRADERS
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors group ${
                  isActive
                    ? "bg-blue-100 text-blue-900"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span
                  className={`ml-3 transition-all duration-300 ${
                    isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
                  } overflow-hidden whitespace-nowrap`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Quick Action Button */}
        <div className="p-4 border-t border-gray-200">
          <Link href="/quotations/new">
            <Button
              className={`w-full bg-blue-600 hover:bg-blue-700 transition-all duration-300 ${
                isExpanded ? "px-4" : "px-2"
              }`}
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span
                className={`ml-2 transition-all duration-300 ${
                  isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
                } overflow-hidden whitespace-nowrap`}
              >
                New Quote
              </span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
