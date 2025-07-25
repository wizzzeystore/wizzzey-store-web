"use client";

import Image from 'next/image';
import type { CartItem as CartItemType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Minus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';

interface CartItemProps {
  item: CartItemType;
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (newQuantity: number) => {
    updateQuantity(item.id, newQuantity);
  };
  
  const imageUrl = item.images && item.images.length > 0 ? item.images[0] : "https://placehold.co/100x100.png";


  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors duration-150">
      <div className="flex md:block items-center gap-4 justify-center">
        <Link href={`/shop/product/${item.id}`}>
          <div className="relative w-20 h-20 md:w-24 md:h-24 overflow-hidden rounded-none shadow mx-auto md:mx-0">
            <Image
              src={imageUrl}
              alt={item.name}
              layout="fill"
              objectFit="cover"
              data-ai-hint="product clothing"
            />
          </div>
        </Link>
      </div>
      <div className="flex flex-col flex-grow w-full">
        <Link href={`/shop/product/${item.id}`}>
         <h3 className="text-md md:text-lg font-semibold hover:text-primary transition-colors text-center md:text-left">{item.name}</h3>
        </Link>
        {item.sku && <div className="text-xs text-muted-foreground text-center md:text-left">SKU: {item.sku}</div>}
        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 text-center md:text-left">
          <span className="text-sm text-muted-foreground">Price: ₹{item.price.toFixed(2)}</span>
          {item.compareAtPrice && item.compareAtPrice > item.price && (
            <span className="text-xs line-through text-muted-foreground">₹{item.compareAtPrice.toFixed(2)}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-1">
          {item.selectedSize && (
            <span className="inline-block px-2 py-0.5 text-xs border rounded bg-muted-foreground/10">Size: {item.selectedSize}</span>
          )}
          {item.selectedColor && (
            <span className="inline-flex items-center gap-1 text-xs">
              Color:
              <span className="w-4 h-4 rounded-full border border-gray-300 inline-block" style={{ backgroundColor: item.colors?.find(c => c.name === item.selectedColor)?.code || item.selectedColor }} title={item.selectedColor}></span>
              {item.selectedColor}
            </span>
          )}
        </div>
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 justify-center md:justify-start">
            {item.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 text-xs bg-accent rounded">{tag}</span>
            ))}
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-center md:space-x-2 mt-2 md:mt-0 w-full">
          <div className="flex items-center justify-center md:justify-start space-x-2 mb-2 md:mb-0">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.quantity - 1)} disabled={item.quantity <= 1}>
              <Minus size={16} />
            </Button>
            <Input
              type="number"
              value={item.quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
              min="1"
              className="w-16 h-8 text-center"
              aria-label={`Quantity for ${item.name}`}
            />
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.quantity + 1)}>
              <Plus size={16} />
            </Button>
          </div>
          <div className="flex items-center justify-between md:justify-end w-full">
            <p className="text-md md:text-lg font-semibold w-auto md:w-24 text-right md:text-right">₹{(item.price * item.quantity).toFixed(2)}</p>
            <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)} className="text-muted-foreground hover:text-destructive ml-2" aria-label={`Remove ${item.name} from cart`}>
              <X size={20} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
