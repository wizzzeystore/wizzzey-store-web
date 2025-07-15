
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
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

  // Close dropdown on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        searchInputRef.current &&
        !(searchInputRef.current as HTMLInputElement).contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [showDropdown]);

  return (
    <header className="bg-card">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary font-headline">
          {loading ? (
            <div className="w-[100px] h-[100px] bg-gray-200 animate-pulse rounded"></div>
          ) : appSettings?.storeLogo?.url ? (
            <Image 
              src={`${process.env.NEXT_PUBLIC_API_URL}${appSettings.storeLogo.url}`} 
              alt={appSettings.storeName || "Store Logo"} 
              width={100} 
              height={100}
              className="object-contain"
            />
          ) : (
            <Image src="/wizzzey_logo.png" alt="Wizzzey Store" width={100} height={100} />
          )}
        </Link>
        <nav className="flex items-center space-x-4 md:space-x-6">
          <div className="relative flex items-center">
            <button
              className="p-2 hover:bg-muted rounded-full transition-colors"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search"
              type="button"
            >
              <Search size={22} />
            </button>
            <div
              className={`absolute left-0 top-12 w-72 md:w-96 z-30 transition-all duration-300 ${searchOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}
            >
              <div className="bg-white border rounded shadow-lg p-2 flex items-center">
                <input
                  ref={searchInputRef}
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
                <div className="bg-white border-x border-b rounded-b shadow-lg max-h-80 overflow-y-auto">
                  {searchResults.map(product => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-muted cursor-pointer"
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
                    <div className="px-3 py-2 text-xs text-muted-foreground">More results available, refine your search...</div>
                  )}
                </div>
              )}
            </div>
          </div>
          <Link href="/" className="text-foreground hover:text-primary transition-colors">
            Home
          </Link>
          <Link href="/shop" className="text-foreground hover:text-primary transition-colors">
            Shop
          </Link>
          <Link href="/cart" className="relative flex items-center text-foreground hover:text-primary transition-colors">
            <ShoppingCart size={24} />
            <span
              className={cn(
                "absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center transition-opacity duration-200",
                (hasMounted && itemCount > 0) ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
              aria-hidden={!(hasMounted && itemCount > 0)}
            >
              {(hasMounted && itemCount > 0) ? itemCount : null}
            </span>
            <span className="ml-1 md:hidden">Cart</span> {/* This is the text "Cart" for mobile */}
          </Link>
          {user ? (
            <>
              <Link href="/profile" className="flex items-center text-foreground hover:text-primary transition-colors">
                <UserIcon size={24} />
                <span className="ml-1 hidden md:inline">Profile</span>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout} className="flex items-center text-foreground hover:text-primary transition-colors">
                <LogOut size={20} className="mr-1" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            </>
          ) : (
            <Link href="/login" className="flex items-center text-foreground hover:text-primary transition-colors">
              <LogIn size={24} />
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
