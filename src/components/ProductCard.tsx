"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Eye } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (product.availableSizes && product.availableSizes.length > 0) {
      setSelectedSize(product.availableSizes[0]);
    } else {
      setSelectedSize(undefined);
    }
  }, [product.availableSizes]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    addToCart(product, 1, selectedSize);
    toast({
      title: "Added to cart!",
      description: `${product.name} (${selectedSize ? `Size: ${selectedSize}` : "No size"}) has been added to your cart.`,
    });
  };

  const allImages =
    product.images && product.images.length > 0
      ? product.images
      : ["https://placehold.co/600x800.png"];
  const imageUrl =
    isHovered && allImages.length > 1 ? allImages[1] : allImages[0];
  const hasDiscount =
    product.compareAtPrice && product.compareAtPrice > product.price;
  const discount = hasDiscount
    ? product.discountPercentage ||
      Math.round(
        100 - (product.price / (product.compareAtPrice || product.price)) * 100
      )
    : 0;
  const isLowStock =
    typeof product.lowStockThreshold === "number" &&
    (product.stock || 0) > 0 &&
    (product.stock || 0) <= product.lowStockThreshold;
  const ratings = product.ratings || { average: 0, count: 0 };

  return (
    <div className="group relative w-full max-w-[200px] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      {product.isFeatured && (
        <span className="absolute top-1 left-1 bg-yellow-400 text-xs font-bold px-1.5 py-0.5 rounded z-10">
          Featured
        </span>
      )}

      <Link
        href={`/shop/product/${product.id}`}
        aria-label={`View ${product.name}`}
      >
        <div
          className="relative w-full aspect-[4/5] overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Button
              variant="outline"
              size="sm"
              className="bg-background/80 hover:bg-background text-foreground text-xs h-7 w-7 p-0"
              onClick={(e) => {
                e.preventDefault();
                router.push(`/shop/product/${product.id}`);
              }}
            >
              <Eye size={12} />
            </Button>
          </div>
        </div>
      </Link>

      <div className="p-2 bg-transparent">
        <div className="flex items-start justify-between gap-1 mb-1">
          <Link href={`/shop/product/${product.id}`}>
            <h3 className="text-xs font-medium line-clamp-2 hover:text-primary transition-colors h-8">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="flex items-center gap-1 mb-1">
          <span className="text-sm font-bold text-primary">
            ₹{product.price.toFixed(2)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-xs line-through text-muted-foreground">
                ₹{product.compareAtPrice?.toFixed(2)}
              </span>
              <span className="text-xs text-green-600 font-semibold">
                {discount}% OFF
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-0.5 mb-1 justify-between">
          {product.availableSizes && product.availableSizes.length > 0 ? (
            <div className="flex gap-1 mb-1">
              {product.availableSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`px-2 py-1 rounded border text-xs font-medium transition-colors duration-200 ${
                    selectedSize === size
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSize(size);
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          ) : null}
          <Button
            variant="default"
            size="sm"
            onClick={handleAddToCart}
            className="w-8 mt-1 text-xs h-7 p-0"
            disabled={
              (product.stock || 0) === 0 || product.status === "out_of_stock" || (product.availableSizes && product.availableSizes.length > 0 && !selectedSize)
            }
          >
            {(product.stock || 0) === 0 || product.status === "out_of_stock"
              ? "Out of Stock"
              : <ShoppingCart size={14} />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
