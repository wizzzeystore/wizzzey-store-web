"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import type { Product } from '@/lib/types';
import { fetchProductById, fetchProducts, fetchBrands, fetchSizeChartById } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, ArrowLeft, CheckCircle, Star, Ruler } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProductCard from '@/components/ProductCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { id } = params;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [randomCategoryProducts, setRandomCategoryProducts] = useState<Product[]>([]);
  const [brandName, setBrandName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [sizeChartModalOpen, setSizeChartModalOpen] = useState(false);
  const [sizeChartImageUrl, setSizeChartImageUrl] = useState<string | null>(null);
  const [sizeChartLoading, setSizeChartLoading] = useState(false);

  const { addToCart } = useCart();

  useEffect(() => {
    if (typeof id === 'string') {
      setLoading(true);
      fetchProductById(id)
        .then(async data => {
          if (data) {
            setProduct(data);
            if (data.availableSizes && data.availableSizes.length > 0) {
              setSelectedSize(data.availableSizes[0]);
            }
            if (data.colors && data.colors.length > 0) {
              setSelectedColor(data.colors[0].name);
            }
            if (data.brandId) {
              try {
                const brands = await fetchBrands();
                const brand = brands.find(b => b.id === data.brandId);
                setBrandName(brand ? brand.name : null);
              } catch (e) {
                setBrandName(null);
              }
            } else {
              setBrandName(null);
            }
            fetchProducts({ page: 1, limit: 12, categoryId: data.categoryId }).then(categoryData => {
              // Filter for related products with same brandId, exclude current product
              const related = categoryData.data.items.filter(p => p.id !== data.id && p.brandId === data.brandId);
              setRelatedProducts(related);
              // For random category products, exclude current and related products
              const relatedIds = new Set([data.id, ...related.map(p => p.id)]);
              setRandomCategoryProducts(categoryData.data.items.filter(p => !relatedIds.has(p.id)));
            });
          } else {
            toast({
              title: 'Product Not Found',
              description: 'The product you are looking for does not exist or could not be loaded.',
              variant: 'destructive',
            });
          }
        })
        .catch(error => {
          console.error("Failed to fetch product:", error);
          toast({
            title: 'Error Loading Product',
            description: error.message || 'There was an issue loading the product details.',
            variant: 'destructive',
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, router, toast]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity, selectedSize, selectedColor);
      toast({
        title: "Added to cart!",
        description: `${product.name} (x${quantity}) has been added to your cart.`,
        action: (
          <Button variant="outline" size="sm" onClick={() => router.push('/cart')}>
            View Cart
          </Button>
        ),
      });
    }
  };

  const handleSizeChartModalOpen = async () => {
    if (!product?.sizeChart) return;
    
    setSizeChartLoading(true);
    try {
      const sizeChart = await fetchSizeChartById(product.sizeChart as string);
      if (sizeChart?.image) {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
        const imageUrl = sizeChart.image.startsWith('http') 
          ? sizeChart.image 
          : `${baseUrl}${sizeChart.image}`;
        setSizeChartImageUrl(imageUrl);
      } else {
        setSizeChartImageUrl(null);
      }
    } catch (error) {
      console.error('Failed to fetch size chart:', error);
      setSizeChartImageUrl(null);
      toast({
        title: 'Error Loading Size Chart',
        description: 'Failed to load the size chart image.',
        variant: 'destructive',
      });
    } finally {
      setSizeChartLoading(false);
    }
    setSizeChartModalOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><LoadingSpinner size={64} /></div>;
  }

  if (!product) {
    return <div className="text-center py-10 text-xl">Product not found. It might have been removed or the link is incorrect.</div>;
  }
  
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const allImages = product.images && product.images.length > 0 ? product.images : ["https://placehold.co/600x800.png"];
  const mainImage = allImages[selectedImageIndex] || allImages[0];
  console.log('Log: img mainImage: ', mainImage);
  console.log('Log: img allImages: ', allImages);
  const thumbnailImages = allImages.length > 1 ? allImages : [];
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discount = hasDiscount
    ? product.discountPercentage || Math.round(100 - (product.price / (product.compareAtPrice || product.price)) * 100)
    : 0;
  const ratings = product.ratings || { average: 0, count: 0 };

  console.log('Log: product: ', product);

  return (
    <div className="container mx-auto py-6">
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        <ArrowLeft size={16} className="mr-2" /> Back to Shop
      </Button>
      
      <div className="grid md:grid-cols-[auto,1fr] gap-4">
        {/* Product Images */}
        <div className="flex md:flex-row flex-col gap-3 min-w-0">
          {/* Main Image */}
          <div className="relative w-full aspect-[4/5] shadow-lg overflow-hidden rounded-lg flex-1 min-w-0">
            <Image
              src={mainImage}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          {/* Thumbnails (Desktop: right, Mobile: bottom) */}
          {thumbnailImages.length > 1 && (
            <div
              className={
                "md:ml-4 flex md:flex-col flex-row gap-2 " +
                "md:max-h-[420px] md:overflow-y-auto md:w-20 w-full"
              }
            >
              {thumbnailImages.map((img, index) => (
                <div
                  key={index}
                  className={`relative aspect-square w-16 h-16 shadow-md overflow-hidden rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedImageIndex === index ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-primary/50'
                  }`}
                  onMouseEnter={!isMobile ? () => setSelectedImageIndex(index) : undefined}
                  onClick={isMobile ? () => setSelectedImageIndex(index) : undefined}
                  style={{ flex: '0 0 auto' }}
                >
                  <Image
                    src={img}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            {product.isFeatured && <span className="bg-yellow-400 text-xs font-bold px-2 py-1 rounded">Featured</span>}
          </div>
          
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">{product.name}</h1>
          {brandName && (
            <div className="mb-2 text-sm text-muted-foreground">
              Brand: <span className="font-semibold text-foreground">{brandName}</span>
            </div>
          )}
          
          <div className="flex items-center mb-3">
            <div className="flex text-yellow-400">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={16} fill={i < ratings.average ? 'currentColor' : 'none'} />)}
            </div>
            <span className="ml-2 text-sm text-muted-foreground">({ratings.count} Reviews)</span>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            {hasDiscount && (
              <>
                <span className="text-2xl font-semibold text-primary">₹{product.price.toFixed(2)}</span>
                <span className="text-lg line-through text-muted-foreground">₹{product.compareAtPrice?.toFixed(2)}</span>
                <span className="text-sm text-green-600 font-semibold">{discount}% OFF</span>
              </>
            )}
            {!hasDiscount && (
              <span className="text-2xl font-semibold text-primary">₹{product.price.toFixed(2)}</span>
            )}
          </div>

          {/* Size Selection */}
          {product.availableSizes && product.availableSizes.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">Size:</label>
              <div className="flex gap-2">
                {product.availableSizes.map(size => (
                  <Button 
                    key={size} 
                    variant={selectedSize === size ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Size Chart Link - Show even if no sizes available */}
          {product.sizeChart && (
            <div className="mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSizeChartModalOpen}
                className="text-blue-600 hover:text-blue-800 border-blue-200 hover:border-blue-300"
                disabled={sizeChartLoading}
              >
                <Ruler size={16} className="mr-2" />
                {sizeChartLoading ? 'Loading...' : 'View Size Chart'}
              </Button>
            </div>
          )}

          {/* Color Selection */}
          {product.colors && product.colors.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">Color:</label>
              <div className="flex gap-2">
                {product.colors.map(color => (
                  <Button 
                    key={color.name} 
                    variant={selectedColor === color.name ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedColor(color.name)}
                    className="p-0 w-8 h-8 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: selectedColor === color.name ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}
                  >
                    <span className="block w-6 h-6 rounded-full" style={{ backgroundColor: color.code }}></span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity and Add to Cart */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-foreground">Quantity:</label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center"
              />
            </div>


            {(product.stock || 0) === 0 || product.status === 'out_of_stock' ? (
              <Button size="lg" disabled className="w-full md:w-auto">
                Out of Stock
              </Button>
            ) : (
              <Button size="lg" onClick={handleAddToCart} className="w-full md:w-auto">
                <ShoppingCart size={18} className="mr-2" /> Add to Cart
              </Button>
            )}
          </div>

          {(product.stock || 0) > 0 && (
            <div className="flex items-center text-green-600 mb-4">
              <CheckCircle size={16} className="mr-2"/>
              <span className="text-sm">In Stock - Ships in 4-5 business days</span>
            </div>
          )}

          {/* Product Details Section */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3">Product Details</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              {product.description && (
                <div className="mb-3">
                  <span className="font-medium text-foreground">Description:</span>
                  <p className="mt-1 text-sm leading-relaxed" dangerouslySetInnerHTML={{
                    __html: product.description.replace(/(\r\n|\n|\r)/g, '<br />')
                  }} />
                </div>
              )}
              {product.weight?.value && product.weight?.unit && (
                <div><span className="font-medium text-foreground">Weight:</span> {product.weight.value} {product.weight.unit}</div>
              )}
              {product.dimensions?.length && product.dimensions?.width && product.dimensions?.height && product.dimensions?.unit && (
                <div><span className="font-medium text-foreground">Dimensions:</span> {product.dimensions.length} x {product.dimensions.width} x {product.dimensions.height} {product.dimensions.unit}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4 text-center">You Might Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 justify-center">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Random Category Products */}
      {randomCategoryProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4 text-center">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 justify-center">
            {randomCategoryProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Size Chart Modal */}
      <Dialog open={sizeChartModalOpen} onOpenChange={setSizeChartModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ruler size={20} />
              Size Chart - {product.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {sizeChartLoading ? (
              <div className="flex justify-center items-center py-8">
                <LoadingSpinner size={32} />
              </div>
            ) : sizeChartImageUrl ? (
              <div className="relative w-full max-w-2xl">
                <Image
                  src={sizeChartImageUrl}
                  alt={`Size chart for ${product.name}`}
                  width={800}
                  height={600}
                  className="w-full h-auto object-contain rounded-lg"
                  priority
                />
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No size chart image available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

