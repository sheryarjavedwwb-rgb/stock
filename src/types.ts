export enum ProductStatus {
  IN_STOCK = 'In Stock',
  LOW_STOCK = 'Low Stock',
  OUT_OF_STOCK = 'Out of Stock',
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minQuantity: number; // For low stock alerts
  price: number;
  supplier: string;
  lastUpdated: string; // ISO string
  notes?: string;
}

export interface InventoryStats {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
}

export interface Category {
  id: string;
  name: string;
  count: number;
}
