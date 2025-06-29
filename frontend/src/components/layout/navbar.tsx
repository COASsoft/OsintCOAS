'use client';

import Link from 'next/link';
import { useState } from 'react';
import { 
  Shield, 
  Menu, 
  X, 
  Search, 
  BarChart3, 
  FileText, 
  Settings,
  Home 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Herramientas OSINT', href: '/tools', icon: Search },
  { name: 'Estadísticas', href: '/stats', icon: BarChart3 },
  { name: 'Reportes', href: '/reports', icon: FileText },
  { name: 'Configuración', href: '/settings', icon: Settings },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo y título */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900">COAS TEAM</span>
                <span className="text-xs text-gray-500 -mt-1">OSINT Platform</span>
              </div>
            </Link>
          </div>

          {/* Navegación desktop */}
          <div className="hidden md:flex md:items-center md:space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Botón de estado del servidor */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">API Online</span>
            </div>
          </div>

          {/* Botón móvil */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            
            {/* Estado del servidor en móvil */}
            <div className="flex items-center space-x-2 px-3 py-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">API Online</span>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}