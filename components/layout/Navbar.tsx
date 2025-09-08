'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, 
  FileText, 
  Users, 
  Package, 
  Building2, 
  BarChart3, 
  Settings,
  Plus,
  Calculator
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Quotations', href: '/quotations', icon: FileText },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Vendors', href: '/vendors', icon: Building2 },
  { name: 'Pricing', href: '/pricing', icon: Calculator },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
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
              <div className="hidden sm:block">
                <div className="text-xl font-bold text-blue-900">STEELROOT</div>
                <div className="text-xs text-teal-600 font-medium tracking-wider">TRADERS</div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/quotations/new">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Quote
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col space-y-4 mt-8">
                  {/* Mobile Logo */}
                  <div className="flex items-center space-x-3 px-4 pb-4 border-b">
                    <Image
                      src="/logo.png"
                      alt="Steelroot Traders"
                      width={32}
                      height={32}
                      className="h-8 w-auto"
                    />
                    <div>
                      <div className="text-lg font-bold text-blue-900">STEELROOT</div>
                      <div className="text-xs text-teal-600 font-medium tracking-wider">TRADERS</div>
                    </div>
                  </div>

                  {/* Mobile Navigation */}
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center space-x-3 text-gray-600 hover:text-blue-600 px-4 py-3 rounded-md text-sm font-medium transition-colors"
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}

                  {/* Mobile Quick Action */}
                  <div className="px-4 pt-4 border-t">
                    <Link href="/quotations/new" onClick={() => setIsOpen(false)}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        New Quotation
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
