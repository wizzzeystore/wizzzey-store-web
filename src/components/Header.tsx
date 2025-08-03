
"use client";

import Link from 'next/link';
import { ShoppingCart, User as UserIcon, LogIn, LogOut, Shirt, Search, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
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
import { Sheet, SheetTrigger, SheetContent, SheetClose } from '@/components/ui/sheet';

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
  const navRef = useRef<HTMLDivElement>(null);
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
    fetchProducts({ term: searchValue, limit: 8 })
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
    <header className="">
      {/* Top Announcement Bar */}
      {appSettings?.announcementBar?.enabled && (
        <div 
          className="py-2 overflow-hidden"
          style={{
            backgroundColor: appSettings?.announcementBar?.backgroundColor || '#000000',
            color: appSettings?.announcementBar?.textColor || '#ffffff'
          }}
        >
          <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
            <div className="flex-1 overflow-hidden w-full sm:w-auto">
              <div className="animate-marquee whitespace-nowrap">
                <span className="text-xs sm:text-sm font-medium inline-block">
                  {appSettings?.announcementBar?.text || 'ADDITIONAL 10% OFF ON PREPAID ORDERS'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 mt-2 sm:mt-0">
              <button className="bg-white text-black px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium flex items-center gap-1">
                <span>🇳🇵</span>
                <span>NPR</span>
                <span>▼</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Header Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 flex justify-between items-center">
          {/* Logo on left */}
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
            <span className="ml-2 text-lg sm:text-2xl font-bold text-pink-500">WIZZZEY</span>
          </Link>
          {/* Hamburger menu on right (mobile only), nav icons on right (desktop only) */}
          <div className="flex items-center">
            {/* Desktop nav icons */}
            <div className="hidden sm:flex items-center space-x-3 sm:space-x-6">
              <span className="text-xs sm:text-sm font-medium cursor-pointer hover:text-gray-600">TRACK ORDER</span>
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
                  className={`absolute right-0 top-12 w-64 sm:w-80 z-30 transition-all duration-300 ${searchOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}
                >
                  <div className="bg-white border rounded-lg shadow-lg p-3 flex items-center">
                    <input
                      type="text"
                      className="w-full px-3 py-2 outline-none text-xs sm:text-base"
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
            {/* Hamburger for mobile */}
            <div className="sm:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Open menu">
                    <Menu size={24} />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64 p-0">
                  <div className="flex flex-col divide-y divide-gray-200">
                    <SheetClose asChild><Link href="/profile" className="p-4 flex items-center gap-2"><UserIcon size={20} /> Profile</Link></SheetClose>
                    <SheetClose asChild><Link href="/wishlist" className="p-4 flex items-center gap-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> Wishlist</Link></SheetClose>
                    <SheetClose asChild><Link href="/cart" className="p-4 flex items-center gap-2"><ShoppingCart size={20} /> Cart</Link></SheetClose>
                    <SheetClose asChild><Link href="/orders" className="p-4 flex items-center gap-2"><Shirt size={20} /> Orders</Link></SheetClose>
                    <SheetClose asChild><Link href="/shop" className="p-4 flex items-center gap-2"><Search size={20} /> Shop</Link></SheetClose>
                    <SheetClose asChild><Link href="/" className="p-4 flex items-center gap-2"><span>Home</span></Link></SheetClose>
                    <SheetClose asChild><button onClick={logout} className="p-4 flex items-center gap-2 text-left w-full"><LogOut size={20} /> Logout</button></SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="bg-black text-white py-2 sm:py-3">
        <div className="container mx-auto px-2 sm:px-4 relative">
          {/* Chevron buttons for mobile */}
          <button
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-70 p-1 rounded-full sm:hidden"
            style={{ display: 'block' }}
            aria-label="Scroll left"
            onClick={() => {
              navRef.current && navRef.current.scrollBy({ left: -120, behavior: 'smooth' });
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-70 p-1 rounded-full sm:hidden"
            style={{ display: 'block' }}
            aria-label="Scroll right"
            onClick={() => {
              navRef.current && navRef.current.scrollBy({ left: 120, behavior: 'smooth' });
            }}
          >
            <ChevronRight size={20} />
          </button>
          <nav
            ref={navRef}
            className="flex items-center justify-start sm:justify-center space-x-4 sm:space-x-8 text-xs sm:text-sm font-medium overflow-x-auto scrollbar-hide sm:scrollbar-thin sm:scrollbar-thumb-gray-400 sm:scrollbar-track-gray-100 px-6 sm:px-0"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <Link href="/new-arrivals" className="whitespace-nowrap hover:text-gray-300 transition-colors">NEW ARRIVALS</Link>
            <Link href="/featured" className="whitespace-nowrap hover:text-gray-300 transition-colors">WIZZZEY EDIT</Link>
            <Link href="/best-sellers" className="whitespace-nowrap hover:text-gray-300 transition-colors">BEST SELLERS</Link>
            <Link href="/shop?category=shirts" className="whitespace-nowrap hover:text-gray-300 transition-colors">SHIRTS</Link>
            <Link href="/shop?category=sets" className="whitespace-nowrap hover:text-gray-300 transition-colors">SHIRT SETS</Link>
            <Link href="/shop?category=suits" className="whitespace-nowrap hover:text-gray-300 transition-colors">SUIT SETS</Link>
            <Link href="/shop?category=coords" className="whitespace-nowrap hover:text-gray-300 transition-colors">CO ORDS</Link>
            <Link href="/wedding" className="whitespace-nowrap hover:text-gray-300 transition-colors">WEDDING EDIT</Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
