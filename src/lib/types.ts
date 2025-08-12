export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'User';
  avatarUrl?: string;
  phone?: string; 
  shippingAddress?: ShippingAddress;
  billingAddress?: ShippingAddress;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  images: string[];
  inStock: boolean;
  createdAt?: string;
  updatedAt?: string;
  categoryName?: string; // For display purposes
  colors?: { name: string; code: string; id?: string; _id?: string }[];
  availableSizes?: string[];
  imageUrl?: string;
  media?: { url: string }[];
  compareAtPrice?: number;
  costPrice?: number;
  discountPercentage?: number;
  ratings?: { average: number; count: number };
  lowStockThreshold?: number;
  stock?: number;
  status?: string;
  isFeatured?: boolean;
  brandId?: string;
  tags?: string[];
  weight?: { value: number; unit: string };
  dimensions?: { length: number; width: number; height: number; unit: string };
  seo?: { title: string; description: string; keywords: string[] };
  slug?: string;
  sku?: string;
  sizeChart?: string | { _id: string; title: string; image: string };
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string | null;
  image?: {
    url: string;
    originalName: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  brandId?: string;
  selectedSize?: string;
  selectedColor?: string;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  shippingAddress: string; // Stringified version for the API
  billingAddress?: string; // Optional
}

export interface Order {
  id: string;
  customerId: string;
  customerInfo?: CustomerInfo; // Optional if API doesn't always return it on GET
  items: OrderItem[];
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  totalAmount: number;
  shippingAddress: ShippingAddress; // Detailed object for app use
  createdAt: string; // Will be a string from mock, can be Date object
  updatedAt?: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface Brand {
  id: string;
  name: string;
}

// This represents the available filter options to be passed to FilterPanel
export interface AvailableFilters {
  categories: Category[];
  priceRange: { min: number; max: number }; // This will be a sensible default or from product API meta
  sizes?: Size[];
  colors?: Color[];
  brands?: Brand[];
}

// This represents the filters applied by the user, used for constructing API queries or client-side filtering
export interface AppliedFilters {
  categoryId?: string; // Single category ID for API
  priceRange?: [number, number];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  size?: Size[];
  color?: Color[];
  brandId?: string;
  // Add other filterable attributes if needed for client-side or specific API calls
}

export enum Size {
  XS = 'XS',
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
  XXL = '2XL',
  XXXL = '3XL',
  XXXXL = '4XL',
  XXXXXL = '5XL',
}
export enum Color {
  RED = 'Red',
  BLUE = 'Blue',
  GREEN = 'Green',
  BLACK = 'Black',
  WHITE = 'White',
  YELLOW = 'Yellow',
  ORANGE = 'Orange',
  PURPLE = 'Purple',
  GREY = 'Grey',
  BROWN = 'Brown',

  PINK = 'Pink',
  NAVY = 'Navy',
  BEIGE = 'Beige',
  MAROON = 'Maroon',
  TEAL = 'Teal',
  OLIVE = 'Olive',
  LAVENDER = 'Lavender',
  CORAL = 'Coral',
  TURQUOISE = 'Turquoise',
  INDIGO = 'Indigo',
  GOLD = 'Gold',
  SILVER = 'Silver',
  KHAKI = 'Khaki',
  MINT = 'Mint',
  CHARCOAL = 'Charcoal',
  MUSTARD = 'Mustard'
}



export interface AppSettings {
  storeName: string;
  defaultStoreEmail: string;
  maintenanceMode: boolean;
  darkMode: boolean;
  themeAccentColor: string;
  storeLogoUrl: string;
  storeLogo?: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
  };
  heroImage?: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
  };
  heroImageMobile?: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
  };
  footerImage?: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
  };
  footerImageMobile?: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
  };
  footerText?: {
    title: string;
    description: string;
    buttonText: string;
    buttonLink: string;
  };
  announcementBar?: {
    enabled: boolean;
    text: string;
    backgroundColor: string;
    textColor: string;
  };
  notifications: {
    newOrderEmails: boolean;
    lowStockAlerts: boolean;
    productUpdatesNewsletter: boolean;
  };
  apiSettings: {
    apiKey?: string;
    apiKeyLastGenerated?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  type: "OK" | "ERROR";
  message?: string;
  data: {
    items: T[];
    [key: string]: any; // For products, categories etc.
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters?: { // This structure can hold what the API returns under 'meta.filters'
    applied: Record<string, any>;
    available: { // To hold potential min/max price from products API
        minPrice?: number;
        maxPrice?: number;
        [key: string]: any;
    };
  };
  sort?: {
    by: string;
    order: 'asc' | 'desc';
  };
}
