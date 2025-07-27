
"use client";

import Link from 'next/link';
import { ShoppingCart, User as UserIcon, LogIn, LogOut, Shirt, Search } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useAppSettings } from '@/context/AppSettingsContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { fetchProducts } from '@/services/api';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/types';

const Header = () => {
  const { itemCount, hasMounted } = useCart();
  const { user, logout } = useAuth();
  const { appSettings, loading } = useAppSettings();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (searchOpen && searchWrapperRef.current) {
      // Use setTimeout to ensure focus after render/animation
      setTimeout(() => {
        searchWrapperRef.current && searchWrapperRef.current.querySelector('input')?.focus();
      }, 50);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (searchValue.trim().length === 0) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setSearchLoading(true);
    fetchProducts({ name: searchValue, limit: 8 })
      .then(res => {
        setSearchResults(res.data.items || []);
        setShowDropdown(true);
      })
      .catch(() => setSearchResults([]))
      .finally(() => setSearchLoading(false));
  }, [searchValue]);

  // Close dropdown and search bar on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
        setSearchOpen(false);
      }
    }
    if (searchOpen || showDropdown) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [searchOpen, showDropdown]);

  return (
    <header className="sticky top-0 z-50">
      {/* Top Announcement Bar */}
      <div className="bg-black text-white py-2 overflow-hidden">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex-1 overflow-hidden">
            <div className="animate-marquee whitespace-nowrap">
              <span className="text-sm font-medium inline-block">ADDITIONAL 10% OFF ON PREPAID ORDERS</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="bg-white text-black px-3 py-1 rounded text-sm font-medium flex items-center gap-1">
              <span>🇮🇳</span>
              <span>INR</span>
              <span>▼</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            {loading ? (
              <div className="w-8 h-8 bg-gray-200 animate-pulse rounded"></div>
            ) : appSettings?.storeLogo?.url ? (
              <Image 
                src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${appSettings.storeLogo.url}`} 
                alt={appSettings.storeName || "Store Logo"} 
                width={32} 
                height={32}
                className="object-contain"
              />
            ) : (
              <Image src="/wizzzey_logo.png" alt="Wizzzey Store" width={32} height={32} className="object-contain" />
            )}
            <span className="ml-2 text-2xl font-bold text-pink-500">WIZZZEY</span>
          </Link>

          {/* Utility Icons */}
          <div className="flex items-center space-x-6">
            <span className="text-sm font-medium cursor-pointer hover:text-gray-600">TRACK ORDER</span>
            
            {/* Search */}
            <div className="relative" ref={searchWrapperRef}>
              <button
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => setSearchOpen((v) => !v)}
                aria-label="Search"
                type="button"
              >
                <Search size={20} />
              </button>
              <div
                className={`absolute right-0 top-12 w-80 z-30 transition-all duration-300 ${searchOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}
              >
                <div className="bg-white border rounded-lg shadow-lg p-3 flex items-center">
                  <input
                    type="text"
                    className="w-full px-3 py-2 outline-none"
                    placeholder="Search products..."
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                    onFocus={() => setShowDropdown(searchResults.length > 0)}
                  />
                  {searchLoading && <span className="ml-2 animate-spin"><Search size={18} /></span>}
                </div>
                {showDropdown && searchResults.length > 0 && (
                  <div className="bg-white border-x border-b rounded-b-lg shadow-lg max-h-80 overflow-y-auto">
                    {searchResults.map(product => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSearchOpen(false);
                          setShowDropdown(false);
                          setSearchValue('');
                          router.push(`/shop/product/${product.id}`);
                        }}
                      >
                        <Image
                          src={product.images?.[0] || '/wizzzey_logo.png'}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="object-cover rounded"
                        />
                        <span className="truncate flex-1">{product.name}</span>
                      </div>
                    ))}
                    {searchResults.length === 8 && (
                      <div className="px-3 py-2 text-xs text-gray-500">More results available, refine your search...</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* User Profile */}
            <Link href={user ? "/profile" : "/login"} className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
              <UserIcon size={20} />
              {user && <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>}
            </Link>

            {/* Wishlist */}
            <Link href="/wishlist" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>

            {/* Cart */}
            <Link href="/cart" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ShoppingCart size={20} />
              <span
                className={cn(
                  "absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center",
                  (hasMounted && itemCount > 0) ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                aria-hidden={!(hasMounted && itemCount > 0)}
              >
                {(hasMounted && itemCount > 0) ? itemCount : 0}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="bg-black text-white py-3">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-center space-x-8 text-sm font-medium">
            <Link href="/new-arrivals" className="hover:text-gray-300 transition-colors">NEW ARRIVALS</Link>
            <Link href="/featured" className="hover:text-gray-300 transition-colors">WIZZZEY EDIT</Link>
            <Link href="/best-sellers" className="hover:text-gray-300 transition-colors">BEST SELLERS</Link>
            <Link href="/shop?category=shirts" className="hover:text-gray-300 transition-colors">SHIRTS</Link>
            <Link href="/shop?category=sets" className="hover:text-gray-300 transition-colors">SHIRT SETS</Link>
            <Link href="/shop?category=suits" className="hover:text-gray-300 transition-colors">SUIT SETS</Link>
            <Link href="/shop?category=coords" className="hover:text-gray-300 transition-colors">CO ORDS</Link>
            <Link href="/wedding" className="hover:text-gray-300 transition-colors">WEDDING EDIT</Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
