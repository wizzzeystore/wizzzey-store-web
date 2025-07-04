"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Eye } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    addToCart(product);
    toast({
      title: "Added to cart!",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const imageUrl = product.images?.[0] || "https://placehold.co/600x800.png";
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discount = hasDiscount
    ? product.discountPercentage ||
      Math.round(100 - (product.price / product.compareAtPrice) * 100)
    : 0;
  const isLowStock = typeof product.lowStockThreshold === "number" &&
    product.stock > 0 &&
    product.stock <= product.lowStockThreshold;
  const ratings = product.ratings || { average: 0, count: 0 };

  return (
    <div className="group relative w-full rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      {product.isFeatured && (
        <span className="absolute top-2 left-2 bg-yellow-400 text-xs font-bold px-2 py-0.5 rounded z-10">
          Featured
        </span>
      )}
      
      <Link href={`/shop/product/${product.id}`} aria-label={`View ${product.name}`}>
        <div className="relative w-full aspect-[3/4] overflow-hidden">
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
              className="bg-background/80 hover:bg-background text-foreground text-xs"
              onClick={(e) => {
                e.preventDefault();
                router.push(`/shop/product/${product.id}`);
              }}
            >
              <Eye size={14} className="mr-1" /> Quick View
            </Button>
          </div>
        </div>
      </Link>

      <div className="p-3 bg-transparent">
        <div className="flex items-start justify-between gap-2 mb-1">
          <Link href={`/shop/product/${product.id}`}>
            <h3 className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors h-10">
              {product.name}
            </h3>
          </Link>
        </div>

        {product.categoryName && (
          <p className="text-xs text-muted-foreground mb-1">
            {product.categoryName}
          </p>
        )}

        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-base font-bold text-primary">
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

        <div className="flex items-center gap-0.5 mb-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={`text-sm ${i < ratings.average ? "text-yellow-400" : "text-gray-300"}`}
            >
              ★
            </span>
          ))}
          <span className="text-xs text-muted-foreground ml-0.5">
            ({ratings.count})
          </span>
        </div>

        {product.availableSizes?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1">
            {product.availableSizes.slice(0, 3).map((size) => (
              <span
                key={size}
                className="px-1.5 py-0.5 text-[10px] border rounded bg-muted/10"
              >
                {size}
              </span>
            ))}
            {product.availableSizes.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{product.availableSizes.length - 3} more
              </span>
            )}
          </div>
        )}

        {product.colors?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1">
            {product.colors.slice(0, 4).map((color) => (
              <span
                key={color.id || color._id || color.name}
                className="w-4 h-4 rounded-full border border-muted inline-block"
                style={{ backgroundColor: color.code }}
                title={color.name}
              />
            ))}
            {product.colors.length > 4 && (
              <span className="text-[10px] text-muted-foreground">
                +{product.colors.length - 4} more
              </span>
            )}
          </div>
        )}

        <Button
          variant="default"
          size="sm"
          onClick={handleAddToCart}
          className="w-full mt-2 text-xs h-8"
          disabled={product.stock === 0 || product.status === "out_of_stock"}
        >
          {product.stock === 0 || product.status === "out_of_stock" ? (
            "Out of Stock"
          ) : (
            <>
              <ShoppingCart size={14} className="mr-1" /> Add to Cart
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;