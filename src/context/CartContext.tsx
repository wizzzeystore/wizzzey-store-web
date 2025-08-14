"use client";

import type { Product, CartItem, ProductVariant } from '@/lib/types';
import React, { createContext, useContext, useState, type ReactNode, useEffect } from 'react';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedSize?: string, selectedColor?: string, variant?: ProductVariant) => void;
  removeFromCart: (productId: string, selectedSize?: string, selectedColor?: string) => void;
  updateQuantity: (productId: string, quantity: number, selectedSize?: string, selectedColor?: string) => void;
  clearCart: () => void;
  cartTotal: number;
  itemCount: number;
  hasMounted: boolean; // Added to signal client-side mount
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]); // Initialize empty
  const [hasMounted, setHasMounted] = useState(false); // For hydration safety

  // Effect to load cart from localStorage on client mount
  useEffect(() => {
    setHasMounted(true); // Signal that component has mounted
    const localData = localStorage.getItem('cartItems');
    if (localData) {
      try {
        const parsedData = JSON.parse(localData);
        if (Array.isArray(parsedData)) {
          setCartItems(parsedData);
        } else {
          console.warn("Invalid cart data in localStorage:", parsedData);
          localStorage.removeItem('cartItems'); // Clear invalid data
        }
      } catch (error) {
        console.error("Error parsing cart data from localStorage:", error);
        localStorage.removeItem('cartItems'); // Clear corrupted data
      }
    }
  }, []); // Runs once on client mount

  // Effect to save cart to localStorage whenever it changes, after mount
  useEffect(() => {
    if (hasMounted) {
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }
  }, [cartItems, hasMounted]);

  const addToCart = (product: Product, quantity: number = 1, selectedSize?: string, selectedColor?: string, variant?: ProductVariant) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item =>
        item.id === product.id &&
        item.selectedSize === selectedSize &&
        item.selectedColor === selectedColor
      );
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor
            ? { ...item, quantity: Math.max(0, item.quantity + quantity) }
            : item
        );
      }
      
      // Use variant data if available, otherwise use product data
      const cartItemData = variant ? {
        ...product,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        stock: variant.stock,
        inStock: variant.inStock,
        images: variant.images ? variant.images.map(img => img.url) : product.images,
        quantity: Math.max(1, quantity),
        selectedSize,
        selectedColor,
      } : {
        ...product,
        quantity: Math.max(1, quantity),
        selectedSize,
        selectedColor,
      };
      
      const newCartItem: CartItem = cartItemData;
      return [...prevItems, newCartItem];
    });
  };

  const removeFromCart = (productId: string, selectedSize?: string, selectedColor?: string) => {
    setCartItems(prevItems =>
      prevItems.filter(item =>
        !(item.id === productId &&
          (selectedSize === undefined || item.selectedSize === selectedSize) &&
          (selectedColor === undefined || item.selectedColor === selectedColor))
      )
    );
  };

  const updateQuantity = (productId: string, quantity: number, selectedSize?: string, selectedColor?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedSize, selectedColor);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId &&
        item.selectedSize === selectedSize &&
        item.selectedColor === selectedColor
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, itemCount, hasMounted }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
