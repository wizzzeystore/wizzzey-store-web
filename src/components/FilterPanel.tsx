"use client";

import { useState, useEffect } from 'react';
import type { Category, AvailableFilters, Size, Color, Brand } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, Filter as FilterIcon } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import LoadingSpinner from './LoadingSpinner';


interface FilterPanelProps {
  availableFilters: AvailableFilters | null;
  loadingFilters: boolean;
  onFilterChange: (filters: {
    priceRange?: [number, number];
    categoryIds?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    sizes?: Size[];
    colors?: Color[];
    brandIds?: string[];
  }) => void;
  initialFilters: {
    priceRange?: [number, number];
    categoryIds?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    sizes?: Size[];
    colors?: Color[];
    brandIds?: string[];
  };
}

const FilterPanel: React.FC<FilterPanelProps> = ({ availableFilters, loadingFilters, onFilterChange, initialFilters }) => {
  // These are the default bounds for the slider track if not provided by API
  const absoluteMinPrice = 0;
  const absoluteMaxPrice = 5000; // Or a higher sensible default like 10000 or 50000

  // State for the price range inputs
  const [minPrice, setMinPrice] = useState<number>(() => {
    const initialMin = availableFilters?.priceRange?.min ?? absoluteMinPrice;
    return initialFilters.priceRange?.[0] ?? initialMin;
  });
  
  const [maxPrice, setMaxPrice] = useState<number>(() => {
    const initialMax = availableFilters?.priceRange?.max ?? absoluteMaxPrice;
    return initialFilters.priceRange?.[1] ?? initialMax;
  });
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialFilters.categoryIds || []);
  const [sortBy, setSortBy] = useState<string>(initialFilters.sortBy || 'name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialFilters.sortOrder || 'asc');
  const [selectedSizes, setSelectedSizes] = useState<Size[]>(initialFilters.sizes || []);
  const [selectedColors, setSelectedColors] = useState<Color[]>(initialFilters.colors || []);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialFilters.brandIds || []);

  useEffect(() => {
    // These are the actual min/max bounds for the price inputs, determined by API or defaults.
    const trackMinBound = availableFilters?.priceRange?.min ?? absoluteMinPrice;
    const trackMaxBound = availableFilters?.priceRange?.max ?? absoluteMaxPrice;

    let targetMin = trackMinBound;
    let targetMax = trackMaxBound;

    if (initialFilters.priceRange) {
      // If URL provides a range, use it as the target for inputs, but clamp to the track's bounds.
      targetMin = Math.max(trackMinBound, initialFilters.priceRange[0]);
      targetMax = Math.min(trackMaxBound, initialFilters.priceRange[1]);

      // If clamping resulted in min > max (e.g., URL range was completely outside track bounds),
      // then reset inputs to the full track bounds.
      if (targetMin > targetMax) {
        targetMin = trackMinBound;
        targetMax = trackMaxBound;
      }
    }
    
    setMinPrice(targetMin);
    setMaxPrice(targetMax);

    // Update other filter states based on initialFilters from URL
    setSelectedCategories(initialFilters.categoryIds || []);
    setSortBy(initialFilters.sortBy || 'name');
    setSortOrder(initialFilters.sortOrder || 'asc');
    setSelectedSizes(initialFilters.sizes || []);
    setSelectedColors(initialFilters.colors || []);
    setSelectedBrands(initialFilters.brandIds || []);

  }, [
    availableFilters?.priceRange?.min, 
    availableFilters?.priceRange?.max, 
    initialFilters.priceRange, // Direct dependency on the priceRange from URL
    initialFilters.categoryIds, // For completeness, though not directly affecting priceRange state here
    initialFilters.sortBy,
    initialFilters.sortOrder,
    initialFilters.sizes,
    initialFilters.colors,
    initialFilters.brandIds,
  ]);


  const handleMinPriceChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    setMinPrice(numValue);
    // Ensure min doesn't exceed max
    if (numValue > maxPrice) {
      setMaxPrice(numValue);
    }
  };

  const handleMaxPriceChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    setMaxPrice(numValue);
    // Ensure max doesn't go below min
    if (numValue < minPrice) {
      setMinPrice(numValue);
    }
  };
  
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    );
  };
  
  const handleSizeChange = (size: Size) => {
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  };
  
  const handleColorChange = (color: Color) => {
    setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
  };
  
  const handleBrandChange = (brandId: string) => {
    setSelectedBrands(prev => prev.includes(brandId) ? prev.filter(id => id !== brandId) : [...prev, brandId]);
  };
  
  const applyFilters = () => {
    const trackMinBound = availableFilters?.priceRange?.min ?? absoluteMinPrice;
    const trackMaxBound = availableFilters?.priceRange?.max ?? absoluteMaxPrice;
    
    // Only send priceRange to URL if it's different from the full track bounds
    const priceRangeToSend = (minPrice === trackMinBound && maxPrice === trackMaxBound) 
        ? undefined 
        : [minPrice, maxPrice] as [number, number];

    onFilterChange({
      priceRange: priceRangeToSend,
      categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
      sortBy,
      sortOrder,
      sizes: selectedSizes.length > 0 ? selectedSizes : undefined,
      colors: selectedColors.length > 0 ? selectedColors : undefined,
      brandIds: selectedBrands.length > 0 ? selectedBrands : undefined,
    });
  };

  const resetFilters = () => {
    const trackMinBound = availableFilters?.priceRange?.min ?? absoluteMinPrice;
    const trackMaxBound = availableFilters?.priceRange?.max ?? absoluteMaxPrice;
    setMinPrice(trackMinBound);
    setMaxPrice(trackMaxBound);
    setSelectedCategories([]);
    setSortBy('name');
    setSortOrder('asc');
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedBrands([]);
    onFilterChange({}); // This will trigger URL update to remove all filter params
  }

  if (loadingFilters || !availableFilters) {
    return (
      <div className="p-6 bg-card shadow-lg rounded-none space-y-6 h-full flex flex-col items-center justify-center min-h-[300px]">
        <LoadingSpinner />
        <p className="text-muted-foreground">Loading filters...</p>
      </div>
    );
  }

  // Determine the actual min/max for the Slider component track
  const sliderTrackMin = availableFilters.priceRange?.min ?? absoluteMinPrice;
  const sliderTrackMax = availableFilters.priceRange?.max ?? absoluteMaxPrice;

  return (
    <div className="p-6 bg-card shadow-lg rounded-none space-y-6 h-full">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold font-headline flex items-center"><FilterIcon size={20} className="mr-2" /> Filters</h3>
        <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs">
          <X size={14} className="mr-1"/> Reset
        </Button>
      </div>
      
      <Accordion type="multiple" defaultValue={[]} className="w-full">
        {availableFilters.categories.length > 0 && (
            <AccordionItem value="categories">
            <AccordionTrigger className="text-lg font-medium">Categories</AccordionTrigger>
            <AccordionContent className="space-y-2 pt-2">
                {availableFilters.categories.map(category => (
                <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                    id={`cat-${category.id}`}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => handleCategoryChange(category.id)}
                    />
                    <Label htmlFor={`cat-${category.id}`} className="text-sm font-normal cursor-pointer hover:text-primary">
                    {category.name}
                    </Label>
                </div>
                ))}
            </AccordionContent>
            </AccordionItem>
        )}

        <AccordionItem value="price">
          <AccordionTrigger className="text-lg font-medium">Price Range</AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min-price" className="text-sm mb-2 block">Min Price (₹)</Label>
                <Input
                  id="min-price"
                  type="number"
                  min={sliderTrackMin}
                  max={sliderTrackMax}
                  value={minPrice}
                  onChange={(e) => handleMinPriceChange(e.target.value)}
                  placeholder="Min price"
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="max-price" className="text-sm mb-2 block">Max Price (₹)</Label>
                <Input
                  id="max-price"
                  type="number"
                  min={sliderTrackMin}
                  max={sliderTrackMax}
                  value={maxPrice}
                  onChange={(e) => handleMaxPriceChange(e.target.value)}
                  placeholder="Max price"
                  className="w-full"
                />
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Range: ₹{sliderTrackMin} - ₹{sliderTrackMax}
            </div>
          </AccordionContent>
        </AccordionItem>

        {availableFilters.sizes && availableFilters.sizes.length > 0 && (
          <AccordionItem value="size">
            <AccordionTrigger className="text-lg font-medium">Size</AccordionTrigger>
            <AccordionContent className="space-y-2 pt-2 flex flex-wrap gap-2">
              {availableFilters.sizes.map(size => (
                <Button
                  key={size}
                  variant={selectedSizes.includes(size) ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-full px-4"
                  onClick={() => handleSizeChange(size)}
                >
                  {size}
                </Button>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}

        {availableFilters.colors && availableFilters.colors.length > 0 && (
          <AccordionItem value="color">
            <AccordionTrigger className="text-lg font-medium">Color</AccordionTrigger>
            <AccordionContent className="space-y-2 pt-2 flex flex-wrap gap-2">
              {availableFilters.colors.map(color => (
                <Button
                  key={color}
                  variant={selectedColors.includes(color) ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-full px-4"
                  onClick={() => handleColorChange(color)}
                >
                  {color}
                </Button>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}

        {availableFilters.brands && availableFilters.brands.length > 0 && (
          <AccordionItem value="brand">
            <AccordionTrigger className="text-lg font-medium">Brand</AccordionTrigger>
            <AccordionContent className="space-y-2 pt-2">
              {availableFilters.brands.map(brand => (
                <div key={brand.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`brand-${brand.id}`}
                    checked={selectedBrands.includes(brand.id)}
                    onCheckedChange={() => handleBrandChange(brand.id)}
                  />
                  <Label htmlFor={`brand-${brand.id}`} className="text-sm font-normal cursor-pointer hover:text-primary">
                    {brand.name}
                  </Label>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="sort">
          <AccordionTrigger className="text-lg font-medium">Sort By</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-2">
            <div>
              <Label htmlFor="sort-by" className="text-sm mb-1 block">Field</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort-by">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="createdAt">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sort-order" className="text-sm mb-1 block">Order</Label>
              <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}>
                <SelectTrigger id="sort-order">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button onClick={applyFilters} className="w-full mt-6">Apply Filters</Button>
    </div>
  );
};

export default FilterPanel;

