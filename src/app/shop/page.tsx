"use client";

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Product, PaginatedResponse, Category, AvailableFilters, AppliedFilters, Size, Color, Brand } from '@/lib/types';
import { fetchProducts, fetchCategories, fetchBrands } from '@/services/api'; 
import ProductCard from '@/components/ProductCard';
import FilterPanel from '@/components/FilterPanel';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List, Filter } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';


// AppliedFiltersState is what the FilterPanel outputs and what is stored in the URL
type AppliedFiltersStateFromPanel = {
  priceRange?: [number, number];
  categoryIds?: string[]; // FilterPanel can select multiple categories
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  productsIds?: string[]; // Added for products_ids
  sizes?: Size[];
  colors?: Color[];
  brandIds?: string[];
};

// AppliedFiltersForApi is what's passed to the fetchProducts service
// and reflects the API's capability (e.g. single categoryId)
type AppliedFiltersForApi = {
  page?: number;
  limit?: number;
  categoryId?: string; // API expects single categoryId
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  product_ids?: string[]; // Array of product IDs to fetch specific products
  brandId?: string;
  random?: boolean;
};

function ShopContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [productsResponse, setProductsResponse] = useState<PaginatedResponse<Product> | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [currentFiltersForPanel, setCurrentFiltersForPanel] = useState<AppliedFiltersStateFromPanel>({});
  
  // Default price range, can be updated by API response if available
  const [apiPriceRange, setApiPriceRange] = useState<{min: number, max: number} | null>(null);

  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);

  const parseFiltersFromUrl = useCallback((): AppliedFiltersStateFromPanel & { sizes?: Size[], colors?: Color[], brandIds?: string[] } => {
    const sortBy = searchParams.get('sortBy') || undefined;
    const sortOrder = (searchParams.get('sortOrder') || undefined) as 'asc' | 'desc' | undefined;
    const categoryIdsFromUrl = searchParams.getAll('category'); // Can be multiple from URL
    const minPriceStr = searchParams.get('minPrice');
    const maxPriceStr = searchParams.get('maxPrice');
    const productsIdsStr = searchParams.get('products_ids'); // Get products_ids from URL
    
    let priceRangeVal: [number, number] | undefined = undefined;
    if (minPriceStr && maxPriceStr) {
        priceRangeVal = [parseFloat(minPriceStr), parseFloat(maxPriceStr)];
    }
    
    let productsIds: string[] | undefined = undefined;
    if (productsIdsStr) {
      // New format: comma-separated IDs, no brackets, no array
      const ids = productsIdsStr.split(',').map(id => id.trim()).filter(id => id.length > 0);
      if (ids.length > 0) {
        productsIds = ids;
      }
    }
    
    console.log('Final parsed productsIds:', productsIds);
    
    // Add size, color, brandIds parsing
    const sizesStr = searchParams.get('sizes');
    const colorsStr = searchParams.get('colors');
    const brandIdsStr = searchParams.get('brandIds');
    let sizes: Size[] | undefined = undefined;
    if (sizesStr) {
      try {
        sizes = JSON.parse(sizesStr);
      } catch {
        sizes = sizesStr.split(',').map(s => s.trim()).filter(Boolean) as Size[];
      }
    }
    let colors: Color[] | undefined = undefined;
    if (colorsStr) {
      try {
        colors = JSON.parse(colorsStr);
      } catch {
        colors = colorsStr.split(',').map(c => c.trim()).filter(Boolean) as Color[];
      }
    }
    let brandIds: string[] | undefined = undefined;
    if (brandIdsStr) {
      try {
        brandIds = JSON.parse(brandIdsStr);
      } catch {
        brandIds = brandIdsStr.split(',').map(b => b.trim()).filter(Boolean);
      }
    }
    
    return {
      sortBy,
      sortOrder,
      categoryIds: categoryIdsFromUrl.length > 0 ? categoryIdsFromUrl : undefined,
      priceRange: priceRangeVal,
      productsIds,
      sizes,
      colors,
      brandIds,
    };
  }, [searchParams]);

  useEffect(() => {
    setLoadingCategories(true);
    fetchCategories()
      .then(data => {
        setCategories(data);
      })
      .catch(error => {
        console.error("Failed to fetch categories:", error);
        toast({ title: "Error Loading Categories", description: error.message || "Could not fetch category options.", variant: "destructive"});
        setCategories([]); 
      })
      .finally(() => {
        setLoadingCategories(false);
      });
    // Fetch brands
    setLoadingBrands(true);
    fetchBrands()
      .then(data => setBrands(data))
      .catch(error => {
        console.error("Failed to fetch brands:", error);
        toast({ title: "Error Loading Brands", description: error.message || "Could not fetch brands.", variant: "destructive"});
        setBrands([]);
      })
      .finally(() => setLoadingBrands(false));
  }, [toast]);


  const loadProducts = useCallback(async (filtersToApply: AppliedFiltersStateFromPanel & { sizes?: Size[], colors?: Color[], brandIds?: string[] }, page: number = 1) => {
    setLoadingProducts(true);
    try {
      // Use random only on first page and only when absolutely no filters/sorting are applied
      const isFirstPage = page === 1;
      const noSorting = !filtersToApply.sortBy && !filtersToApply.sortOrder;
      const noSpecificProducts = !(filtersToApply.productsIds && filtersToApply.productsIds.length > 0);
      const noCategory = !(filtersToApply.categoryIds && filtersToApply.categoryIds.length > 0);
      const noPrice = !(filtersToApply.priceRange && (typeof filtersToApply.priceRange[0] === 'number' || typeof filtersToApply.priceRange[1] === 'number'));
      const noSizes = !(filtersToApply.sizes && filtersToApply.sizes.length > 0);
      const noColors = !(filtersToApply.colors && filtersToApply.colors.length > 0);
      const noBrands = !(filtersToApply.brandIds && filtersToApply.brandIds.length > 0);
      const useRandom = isFirstPage && noSorting && noSpecificProducts && noCategory && noPrice && noSizes && noColors && noBrands;

      const serviceParams: AppliedFiltersForApi & { size?: string; color?: string } = {
        page: page,
        limit: 9, 
        // If multiple categories selected, send as JSON array string so backend can treat as $in
        categoryId: (filtersToApply.categoryIds && filtersToApply.categoryIds.length > 1)
          ? JSON.stringify(filtersToApply.categoryIds)
          : filtersToApply.categoryIds?.[0],
        minPrice: filtersToApply.priceRange?.[0],
        maxPrice: filtersToApply.priceRange?.[1],
        sortBy: filtersToApply.sortBy,
        sortOrder: filtersToApply.sortOrder,
        product_ids: filtersToApply.productsIds,
        // If multiple brands selected, send as JSON array string
        brandId: (filtersToApply.brandIds && filtersToApply.brandIds.length > 1)
          ? JSON.stringify(filtersToApply.brandIds)
          : filtersToApply.brandIds?.[0],
        random: useRandom,
      };

      // Pass sizes and colors as comma-separated lists if present
      if (filtersToApply.sizes && filtersToApply.sizes.length > 0) {
        (serviceParams as any).size = filtersToApply.sizes.join(',');
      }
      if (filtersToApply.colors && filtersToApply.colors.length > 0) {
        (serviceParams as any).color = filtersToApply.colors.join(',');
      }
      
      console.log('Loading products with params:', serviceParams);
      console.log('Product IDs being sent:', serviceParams.product_ids);
      
      // If using random on first page, fetch random items for display
      // and also fetch the normal page-1 to get real pagination/meta.
      let response: PaginatedResponse<Product>;
      if (useRandom) {
        const [randomRes, metaRes] = await Promise.all([
          fetchProducts({ ...serviceParams, random: true }),
          fetchProducts({ ...serviceParams, random: false, page: 1 }),
        ]);
        response = {
          type: metaRes.type,
          message: metaRes.message,
          data: { items: randomRes.data.items },
          pagination: metaRes.pagination,
          filters: metaRes.filters,
          sort: metaRes.sort,
        };
      } else {
        response = await fetchProducts(serviceParams);
      }
      console.log('API response:', response);

      setProductsResponse(response);
      if(response.filters?.available?.minPrice !== undefined && response.filters?.available?.maxPrice !== undefined){
        setApiPriceRange({min: response.filters.available.minPrice, max: response.filters.available.maxPrice});
      }
    } catch (error: any) {
      console.error("Failed to fetch products:", error);
      toast({ title: "Error Loading Products", description: error.message || "Could not fetch products.", variant: "destructive"});
      setProductsResponse(null); 
    } finally {
      setLoadingProducts(false);
    }
  }, [toast]);

  useEffect(() => {
    const filtersFromUrl = parseFiltersFromUrl();
    const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
    setCurrentFiltersForPanel(filtersFromUrl); 
    
    // Load products only when categories are also loaded or if category loading fails
    // This avoids trying to filter by category before categories are available.
    if (!loadingCategories) { 
        loadProducts(filtersFromUrl, pageFromUrl);
    }
  }, [searchParams, loadProducts, loadingCategories, parseFiltersFromUrl]);


  const handleFilterChange = (newFiltersFromPanel: Partial<AppliedFiltersStateFromPanel & { sizes?: Size[], colors?: Color[], brandIds?: string[] }>) => {
    const queryParams = new URLSearchParams();

    if (newFiltersFromPanel.priceRange) {
      queryParams.set('minPrice', newFiltersFromPanel.priceRange[0].toString());
      queryParams.set('maxPrice', newFiltersFromPanel.priceRange[1].toString());
    }
    // If categoryIds is an empty array, it means "all categories" (no specific category filter)
    // So we don't append 'category' if newFiltersFromPanel.categoryIds is empty or undefined.
    if (newFiltersFromPanel.categoryIds && newFiltersFromPanel.categoryIds.length > 0) {
        newFiltersFromPanel.categoryIds.forEach(catId => queryParams.append('category', catId));
    }

    if (newFiltersFromPanel.sortBy) queryParams.set('sortBy', newFiltersFromPanel.sortBy);
    if (newFiltersFromPanel.sortOrder) queryParams.set('sortOrder', newFiltersFromPanel.sortOrder);
    
    if (newFiltersFromPanel.sizes && newFiltersFromPanel.sizes.length > 0) {
      queryParams.set('sizes', JSON.stringify(newFiltersFromPanel.sizes));
    }
    if (newFiltersFromPanel.colors && newFiltersFromPanel.colors.length > 0) {
      queryParams.set('colors', JSON.stringify(newFiltersFromPanel.colors));
    }
    if (newFiltersFromPanel.brandIds && newFiltersFromPanel.brandIds.length > 0) {
      queryParams.set('brandIds', JSON.stringify(newFiltersFromPanel.brandIds));
    }
    
    queryParams.set('page', '1'); 

    router.push(`${pathname}?${queryParams.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const queryParams = new URLSearchParams(searchParams.toString());
    queryParams.set('page', newPage.toString());
    router.push(`${pathname}?${queryParams.toString()}`);
  };
  
  const constructedAvailableFilters: AvailableFilters | null = (loadingCategories || loadingBrands)
    ? null 
    : {
        categories: categories,
        priceRange: apiPriceRange || { min: 0, max: 5000 },
        sizes: Object.values(Size),
        colors: Object.values(Color),
        brands: brands,
      };

  const isLoading = loadingProducts || loadingCategories;
  const currentCategoryName = currentFiltersForPanel.categoryIds?.[0] && categories.find(c => c.id === currentFiltersForPanel.categoryIds![0])?.name;
  const isViewingSpecificProducts = currentFiltersForPanel.productsIds && currentFiltersForPanel.productsIds.length > 0;


  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Mobile filter button and sidebar */}
      <div className="block md:hidden mb-4">
        <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full flex items-center gap-2" onClick={() => setFilterSheetOpen(true)}>
              <Filter size={18} />
              <span>Filter</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 max-w-xs w-full">
            <div className="p-6">
              <FilterPanel
                availableFilters={constructedAvailableFilters}
                loadingFilters={loadingCategories}
                onFilterChange={(filters) => {
                  handleFilterChange(filters);
                  setFilterSheetOpen(false);
                }}
                initialFilters={currentFiltersForPanel}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      {/* Desktop sidebar */}
      {!isViewingSpecificProducts && (
        <aside className="hidden md:block w-full md:w-1/4 lg:w-1/5">
          <FilterPanel 
            availableFilters={constructedAvailableFilters} 
            loadingFilters={loadingCategories} 
            onFilterChange={handleFilterChange}
            initialFilters={currentFiltersForPanel} 
          />
        </aside>
      )}
      <main className={`w-full ${!isViewingSpecificProducts ? 'md:w-3/4 lg:w-4/5' : ''}`}>
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold font-headline">
            {isViewingSpecificProducts ? 'Selected Products' : (currentCategoryName || 'All Products')}
          </h1>
          <div className="flex items-center gap-2">
             <span className="text-sm text-muted-foreground">
                {isViewingSpecificProducts ? 
                  `${productsResponse?.data.items.length || 0} selected products` :
                  (productsResponse?.pagination && productsResponse.pagination.total > 0 ? 
                    `Showing ${((productsResponse.pagination.page - 1) * productsResponse.pagination.limit) + 1}-${Math.min(productsResponse.pagination.page * productsResponse.pagination.limit, productsResponse.pagination.total)} of ${productsResponse.pagination.total} products` 
                    : productsResponse?.pagination?.total === 0 ? '0 products found' : '')
                }
             </span>
            <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')} aria-label="Grid view">
              <LayoutGrid size={20} />
            </Button>
            <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')} aria-label="List view">
              <List size={20} />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <LoadingSpinner size={48} />
          </div>
        ) : productsResponse && productsResponse.data.items.length > 0 ? (
          <>
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-5' : 'grid-cols-1'}`}>
              {productsResponse.data.items.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {!isViewingSpecificProducts && productsResponse.pagination && productsResponse.pagination.totalPages > 1 && (
              <Pagination className="mt-12">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); if(productsResponse.pagination!.hasPrevPage) handlePageChange(productsResponse.pagination!.page - 1)}}
                      aria-disabled={!productsResponse.pagination.hasPrevPage}
                      className={!productsResponse.pagination.hasPrevPage ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {[...Array(productsResponse.pagination.totalPages)].map((_, i) => {
                     const pageNum = i + 1;
                     if (productsResponse.pagination!.totalPages <= 5 || 
                         pageNum === 1 || pageNum === productsResponse.pagination!.totalPages ||
                         (pageNum >= productsResponse.pagination!.page -1 && pageNum <= productsResponse.pagination!.page + 1)
                        ) {
                          return (
                            <PaginationItem key={i}>
                              <PaginationLink 
                                href="#" 
                                onClick={(e) => { e.preventDefault(); handlePageChange(pageNum)}}
                                isActive={productsResponse.pagination!.page === pageNum}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                     } else if (pageNum === productsResponse.pagination!.page - 2 || pageNum === productsResponse.pagination!.page + 2) {
                        return <PaginationEllipsis key={`ellipsis-${i}`} />;
                     }
                     return null;
                  })}
                  <PaginationItem>
                    <PaginationNext 
                       href="#" 
                       onClick={(e) => { e.preventDefault(); if(productsResponse.pagination!.hasNextPage) handlePageChange(productsResponse.pagination!.page + 1)}}
                       aria-disabled={!productsResponse.pagination.hasNextPage}
                       className={!productsResponse.pagination.hasNextPage ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-2">No Products Found</h2>
            <p className="text-muted-foreground">Try adjusting your filters or check back later.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-1/4 lg:w-1/5">
          <div className="p-6 bg-card shadow-lg rounded-none space-y-6 h-full flex flex-col items-center justify-center min-h-[300px]">
            <LoadingSpinner />
            <p className="text-muted-foreground">Loading filters...</p>
          </div>
        </aside>
        <main className="w-full md:w-3/4 lg:w-4/5">
          <div className="flex justify-center items-center min-h-[60vh]">
            <LoadingSpinner size={64} />
          </div>
        </main>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
