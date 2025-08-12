"use client";

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Product, Category, PaginatedResponse } from '@/lib/types';
import { getMockCategories } from '@/lib/mock-data'; // Keep getMockCategories for now
import { fetchCategories, fetchProducts } from '@/services/api'; // Use the new API service
import { useAppSettings } from '@/context/AppSettingsContext';
import ProductCard from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ChevronRight, Zap, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { date } from 'zod';

// Component that handles the search params logic
function HomePageContent() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [topSellingProducts, setTopSellingProducts] = useState<Product[]>([]);
  const [featuredCategories, setFeaturedCategories] = useState<Category[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingTopSelling, setLoadingTopSelling] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const { toast } = useToast(); // Initialize toast
  const searchParams = useSearchParams();
  const router = useRouter();
  const { appSettings, loading: loadingSettings } = useAppSettings();

  // Check for products_ids parameter and redirect to shop page
  useEffect(() => {
    const productsIds = searchParams.get('products_ids');
    if (productsIds) {
      // Redirect to shop page with the products_ids parameter
      router.push(`/shop?products_ids=${encodeURIComponent(productsIds)}`);
    }
  }, [searchParams, router]);

  useEffect(() => {
    setLoadingProducts(true);
    fetchProducts({ page: 1, limit: 12, isFeatured: true }) // Fetch 12 featured products
      .then((response: PaginatedResponse<Product>) => {
        if (response && response.data && Array.isArray(response.data.items)) {
          console.log('Log: response.data.items', response.data.items);
          setFeaturedProducts(response.data.items);
        } else {
          console.warn("Featured products API response is not in the expected format or items are missing:", response);
          setFeaturedProducts([]);
        }
      })
      .catch(error => {
        console.error("Failed to fetch featured products:", error);
        toast({ // Display toast on error
          title: "Error Loading Products",
          description: error.message || "Could not fetch products. Please try again later.",
          variant: "destructive",
        });
        setFeaturedProducts([]);
      })
      .finally(() => {
        setLoadingProducts(false);
      });

    // Fetch top selling products (random, non-featured)
    setLoadingTopSelling(true);
    fetchProducts({ page: 1, limit: 12, random: true })
      .then((response: PaginatedResponse<Product>) => {
        if (response && response.data && Array.isArray(response.data.items)) {
          console.log('Log: top selling products', response.data.items);
          setTopSellingProducts(response.data.items);
        } else {
          console.warn("Top selling products API response is not in the expected format or items are missing:", response);
          setTopSellingProducts([]);
        }
      })
      .catch(error => {
        console.error("Failed to fetch top selling products:", error);
        toast({ // Display toast on error
          title: "Error Loading Top Selling Products",
          description: error.message || "Could not fetch top selling products. Please try again later.",
          variant: "destructive",
        });
        setTopSellingProducts([]);
      })
      .finally(() => {
        setLoadingTopSelling(false);
      });

    setLoadingCategories(true);
    fetchCategories().then(data => {
      setFeaturedCategories(data.slice(0, 12));
    })
      .catch(error => {
        console.error("Failed to fetch featured categories:", error);
        toast({ // Display toast on error
          title: "Error Loading Categories",
          description: error.message || "Could not fetch categories.",
          variant: "destructive",
        });
        setFeaturedCategories([]);
      })
      .finally(() => {
        setLoadingCategories(false);
      });
  }, [toast]); // Add toast to dependency array

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 rounded-none overflow-hidden h-[500px]">
        <div className="absolute inset-0 z-[-1] overflow-hidden">
          {loadingSettings ? (
            <div className="w-full h-full bg-gray-200 animate-pulse"></div>
          ) : appSettings?.heroImage?.url || appSettings?.heroImageMobile?.url ? (
            <picture>
              {appSettings?.heroImageMobile?.url && (
                <source
                  srcSet={`${process.env.NEXT_PUBLIC_API_BASE_URL}${appSettings.heroImageMobile.url}`}
                  media="(max-width: 767px)"
                />
              )}
              {appSettings?.heroImage?.url && (
                <source
                  srcSet={`${process.env.NEXT_PUBLIC_API_BASE_URL}${appSettings.heroImage.url}`}
                  media="(min-width: 768px)"
                />
              )}
              <img
                src={
                  appSettings?.heroImageMobile?.url
                    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${appSettings.heroImageMobile.url}`
                    : appSettings?.heroImage?.url
                    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${appSettings.heroImage.url}`
                    : "/hero.jpg"
                }
                alt={
                  appSettings?.heroImageMobile?.originalName ||
                  appSettings?.heroImage?.originalName ||
                  "Hero background"
                }
                className="w-full h-full object-cover"
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                data-ai-hint="fashion runway model"
              />
            </picture>
          ) : (
            <Image src="/hero.jpg" alt="Fashion background" layout="fill" objectFit="cover" className="opacity-80" data-ai-hint="fashion runway model" />
          )}
        </div>
      </section>

      <section className="container mx-auto text-center">
        <Link href="/shop">
            <Button size="lg" className="animate-bounce-subtle group">
              Shop Now <ChevronRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
      </section>

      {/* Categories Section (moved above Featured Products) */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold font-headline">Shop by Category</h2>
        </div>
        {loadingCategories ? (
          <div className="relative">
            <div className="flex items-center space-x-4 overflow-hidden">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="flex flex-col items-center w-24">
                  <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-4 w-16 bg-gray-200 rounded mt-2 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ) : featuredCategories.length > 0 ? (
          <div className="relative">
            <div
              className="overflow-x-auto scrollbar-hide sm:scrollbar-thin sm:scrollbar-thumb-gray-400 sm:scrollbar-track-gray-100"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <div className="flex w-max mx-auto items-center space-x-4 px-1">
                {featuredCategories.map((category) => (
                  <Link
                    href={`/shop?category=${category.id}`}
                    key={category.id}
                    className="group flex-shrink-0 flex flex-col items-center w-24"
                  >
                    <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-200 shadow-sm group-hover:shadow-md transition-shadow">
                      <Image
                        src={category.image?.url || `https://placehold.co/300x300.png`}
                        alt={category.image?.originalName || category.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="mt-2 text-sm text-center truncate w-full">{category.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p>No categories to display.</p>
        )}
      </section>

      {/* Featured Products Section */}
      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold font-headline">Featured Collection</h2>
          <Link href="/shop">
            <Button variant="outline" className="group">
              View All <ChevronRight size={18} className="ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
        </div>
        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-card p-4 shadow-md rounded-none h-[400px] flex items-center justify-center"><LoadingSpinner /></div>)}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p>No featured products available at the moment. Try refreshing the page or check back later.</p>
        )}
      </section>

      {/* Top Selling Products Section */}
      <section>
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <TrendingUp size={32} className="text-primary" />
            <h2 className="text-3xl font-bold font-headline">Top Selling Products</h2>
          </div>
          <Link href="/shop">
            <Button variant="outline" className="group">
              View All <ChevronRight size={18} className="ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
        </div>
        {loadingTopSelling ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-card p-4 shadow-md rounded-none h-[400px] flex items-center justify-center"><LoadingSpinner /></div>)}
          </div>
        ) : topSellingProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {topSellingProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p>No top selling products available at the moment. Try refreshing the page or check back later.</p>
        )}
      </section>

      

      {/* New Arrivals / Call to Action */}
      <section className="relative py-16">
        {loadingSettings ? (
          <div className="container mx-auto text-center">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-300 rounded mb-4 mx-auto w-64"></div>
              <div className="h-6 bg-gray-300 rounded mb-8 mx-auto w-96"></div>
              <div className="h-12 bg-gray-300 rounded w-48 mx-auto"></div>
            </div>
          </div>
        ) : appSettings?.footerImage?.url || appSettings?.footerImageMobile?.url ? (
          <div className="overflow-hidden rounded-lg" onClick={() => router.push(`/shop?sortBy=createdAt&sortOrder=desc`)} style={{ cursor: 'pointer' }}>
            <picture>
              {appSettings?.footerImageMobile?.url && (
                <source
                  srcSet={`${process.env.NEXT_PUBLIC_API_BASE_URL}${appSettings.footerImageMobile.url}`}
                  media="(max-width: 767px)"
                />
              )}
              {appSettings?.footerImage?.url && (
                <source
                  srcSet={`${process.env.NEXT_PUBLIC_API_BASE_URL}${appSettings.footerImage.url}`}
                  media="(min-width: 768px)"
                />
              )}
              <img
                src={
                  appSettings?.footerImageMobile?.url
                    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${appSettings.footerImageMobile.url}`
                    : appSettings?.footerImage?.url
                    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${appSettings.footerImage.url}`
                    : "/hero.jpg"
                }
                alt={
                  appSettings?.footerImageMobile?.originalName ||
                  appSettings?.footerImage?.originalName ||
                  "Footer background"
                }
                className="w-full h-[400px] object-cover"
                style={{ objectFit: 'cover', width: '100%', height: '400px' }}
                data-ai-hint="fashion footer image"
              />
            </picture>
          </div>
        ) : (
          <div className="container mx-auto text-center">
            <Zap size={48} className="mx-auto mb-4 text-primary" />
            <h2 className="text-3xl font-bold mb-4 font-headline">
              {appSettings?.footerText?.title || 'Fresh Styles Just In!'}
            </h2>
            <p className="text-lg mb-8 max-w-xl mx-auto">
              {appSettings?.footerText?.description || "Don't miss out on our newest arrivals. Update your wardrobe with the latest looks."}
            </p>
            <Link href={appSettings?.footerText?.buttonLink || "/shop?sortBy=createdAt&sortOrder=desc"}>
              <Button size="lg" variant="secondary" className="bg-background text-primary hover:bg-primary/10">
                {appSettings?.footerText?.buttonText || 'Explore New Arrivals'}
              </Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="space-y-16">
        <section className="relative bg-gradient-to-r from-primary/10 via-background to-accent/10 py-20 md:py-32 rounded-none overflow-hidden">
          <div className="container mx-auto text-center">
            <div className="animate-pulse">
              <div className="h-16 bg-gray-300 rounded mb-6"></div>
              <div className="h-8 bg-gray-300 rounded mb-10 max-w-2xl mx-auto"></div>
              <div className="h-12 bg-gray-300 rounded w-32 mx-auto"></div>
            </div>
          </div>
        </section>
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner size={64} />
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
