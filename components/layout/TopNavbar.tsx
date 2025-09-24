"use client";

import { Button } from "@/components/ui/button";
import { FileText, Plus, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function TopNavbar() {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 h-16 fixed top-0 left-16 right-0 z-40">
      <div className="flex justify-between items-center h-full px-6">
        {/* Logo and Brand */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/logo.png"
              alt="Steelroot Traders"
              width={40}
              height={40}
              className="h-10 w-auto"
            />
            <div>
              <div className="text-xl font-bold text-blue-900">STEELROOT</div>
              <div className="text-xs text-teal-600 font-medium tracking-wider">
                TRADERS
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center space-x-3">
          <Link href="/quotations/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Quotation
            </Button>
          </Link>
          <Link href="/invoices/new">
            <Button className="bg-green-600 hover:bg-green-700">
              <FileText className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
          </Link>
          <Link href="/chalans/new">
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Truck className="w-4 h-4 mr-2" />
              New Delivery Note
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
