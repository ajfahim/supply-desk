"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Plus, Truck, User, ChevronDown, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function TopNavbar() {
  const { data: session, status } = useSession();

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
          {session && (
            <>
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
              
              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 p-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{session.user.username}</p>
                      <p className="text-xs text-gray-500 capitalize">{session.user.role.replace('_', ' ')}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-red-600 focus:text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          
          {status === 'loading' && (
            <div className="text-sm text-gray-500">Loading...</div>
          )}
          
          {status === 'unauthenticated' && (
            <Link href="/auth/signin">
              <Button variant="outline">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
