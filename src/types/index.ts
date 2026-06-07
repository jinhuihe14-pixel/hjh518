export type CategoryType = 'snack' | 'daily' | 'frozen' | 'drink';

export const CategoryNames: Record<CategoryType, string> = {
  snack: '零食',
  daily: '日化',
  frozen: '速冻',
  drink: '酒水',
};

export const CategoryColors: Record<CategoryType, string> = {
  snack: '#FF7A45',
  daily: '#1A5D6B',
  frozen: '#0EA5E9',
  drink: '#8B5CF6',
};

export interface Product {
  id: string;
  name: string;
  category: CategoryType;
  categoryName: string;
  price: number;
  cost: number;
  stock: number;
  expireDate: string;
  shelfLife: number;
  salesLast30Days: number;
  turnoverDays: number;
}

export interface InventoryBatch {
  id: string;
  productId: string;
  productName: string;
  category: CategoryType;
  categoryName: string;
  quantity: number;
  remaining: number;
  unitCost: number;
  produceDate: string;
  expireDate: string;
  inboundDate: string;
}

export interface BatchDeductionItem {
  batchId: string;
  expireDate: string;
  unitCost: number;
  quantity: number;
  costTotal: number;
}

export interface SalesItem {
  batchId: string;
  productId: string;
  productName: string;
  category: CategoryType;
  categoryName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  subtotal: number;
  costTotal: number;
  profit: number;
}

export interface SalesRecord {
  id: string;
  date: string;
  hour: number;
  items: SalesItem[];
  totalAmount: number;
  totalCost: number;
  totalProfit: number;
  itemCount: number;
}

export interface SalesData {
  date: string;
  totalAmount: number;
  orderCount: number;
  categoryBreakdown: {
    category: CategoryType;
    categoryName: string;
    amount: number;
    percentage: number;
  }[];
}

export interface InventoryAlert {
  productId: string;
  productName: string;
  category: CategoryType;
  categoryName: string;
  type: 'expiring' | 'slow_moving' | 'out_of_stock';
  level: 'warning' | 'danger';
  daysLeft?: number;
  stock: number;
  stockValue: number;
}

export interface ProductAnalysis {
  productId: string;
  productName: string;
  category: CategoryType;
  categoryName: string;
  revenue: number;
  cost: number;
  profit: number;
  marginRate: number;
  salesVolume: number;
  weekdaySales: number;
  weekendSales: number;
}

export interface LossRecord {
  id: string;
  date: string;
  productId: string;
  productName: string;
  category: CategoryType;
  categoryName: string;
  batchId?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  reason: 'expired' | 'damaged' | 'other';
}

export interface HourlySales {
  hour: number;
  sales: number;
  orders: number;
}

export interface DisplaySuggestion {
  position: string;
  products: {
    id: string;
    name: string;
    reason: string;
  }[];
}

export interface KpiData {
  todaySales: number;
  todayOrders: number;
  totalStock: number;
  expiringCount: number;
  salesGrowth: number;
  orderGrowth: number;
  stockGrowth: number;
  expiringGrowth: number;
}
