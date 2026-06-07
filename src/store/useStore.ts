import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import dayjs from 'dayjs';
import {
  CategoryType,
  CategoryNames,
  Product,
  InventoryBatch,
  SalesRecord,
  SalesItem,
  LossRecord,
  InventoryAlert,
  ProductAnalysis,
  HourlySales,
  KpiData,
  SalesData,
} from '@/types';
import { generateProducts } from '@/data/mockData';

interface StoreState {
  products: Product[];
  batches: InventoryBatch[];
  salesRecords: SalesRecord[];
  lossRecords: LossRecord[];
  nextBatchId: number;
  nextSaleId: number;
  nextLossId: number;
}

interface StoreActions {
  inboundStock: (params: {
    productId: string;
    quantity: number;
    unitCost: number;
    produceDate: string;
    expireDate: string;
  }) => void;

  sellStock: (params: {
    items: { productId: string; quantity: number; unitPrice: number }[];
  }) => { success: boolean; message: string; record?: SalesRecord };

  lossStock: (params: {
    productId: string;
    batchId?: string;
    quantity: number;
    reason: 'expired' | 'damaged' | 'other';
  }) => { success: boolean; message: string; record?: LossRecord };

  resetData: () => void;
}

export type Store = StoreState & StoreActions;

function generateInitialBatches(products: Product[]): InventoryBatch[] {
  const batches: InventoryBatch[] = [];
  let id = 1;

  products.forEach((product) => {
    const batchCount = Math.floor(Math.random() * 2) + 1;
    let remainingStock = product.stock;

    for (let i = 0; i < batchCount && remainingStock > 0; i++) {
      const qty = i === batchCount - 1
        ? remainingStock
        : Math.floor(remainingStock * (0.4 + Math.random() * 0.3));

      const costVariation = 0.9 + Math.random() * 0.2;
      const unitCost = parseFloat((product.cost * costVariation).toFixed(2));

      const daysOffset = Math.floor(Math.random() * 60) - 30;
      const expireDate = dayjs(product.expireDate).add(daysOffset, 'day').format('YYYY-MM-DD');
      const produceDate = dayjs(expireDate).subtract(product.shelfLife, 'day').format('YYYY-MM-DD');
      const inboundDate = dayjs().subtract(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD');

      batches.push({
        id: `B${String(id).padStart(5, '0')}`,
        productId: product.id,
        productName: product.name,
        category: product.category,
        categoryName: product.categoryName,
        quantity: qty,
        remaining: qty,
        unitCost,
        produceDate,
        expireDate,
        inboundDate,
      });

      remainingStock -= qty;
      id++;
    }
  });

  return batches;
}

function generateInitialSalesRecords(products: Product[], batches: InventoryBatch[]): SalesRecord[] {
  const records: SalesRecord[] = [];
  let saleId = 1;
  const productMap = new Map(products.map((p) => [p.id, p]));
  const batchMap = new Map<string, InventoryBatch[]>();

  batches.forEach((b) => {
    if (!batchMap.has(b.productId)) batchMap.set(b.productId, []);
    batchMap.get(b.productId)!.push(b);
  });

  for (let day = 29; day >= 0; day--) {
    const date = dayjs().subtract(day, 'day');
    const dateStr = date.format('YYYY-MM-DD');
    const isWeekend = date.day() === 0 || date.day() === 6;
    const orderCount = isWeekend
      ? Math.floor(Math.random() * 100) + 150
      : Math.floor(Math.random() * 80) + 100;

    for (let o = 0; o < orderCount; o++) {
      const hour = 7 + Math.floor(Math.random() * 16);
      const itemCount = Math.floor(Math.random() * 3) + 1;
      const items: SalesItem[] = [];
      let totalAmount = 0;
      let totalCost = 0;
      let totalProfit = 0;

      const usedProducts = new Set<string>();
      for (let i = 0; i < itemCount; i++) {
        const product = products[Math.floor(Math.random() * products.length)];
        if (usedProducts.has(product.id)) continue;
        usedProducts.add(product.id);

        const productBatches = (batchMap.get(product.id) || [])
          .filter((b) => b.remaining > 0)
          .sort((a, b) => a.expireDate.localeCompare(b.expireDate));

        if (productBatches.length === 0) continue;

        const qty = Math.min(
          Math.floor(Math.random() * 3) + 1,
          productBatches.reduce((sum, b) => sum + b.remaining, 0)
        );

        if (qty <= 0) continue;

        let remainingQty = qty;
        let costTotal = 0;
        let usedQtyFromBatch = 0;

        for (const batch of productBatches) {
          if (remainingQty <= 0) break;
          const take = Math.min(remainingQty, batch.remaining);
          batch.remaining -= take;
          remainingQty -= take;
          costTotal += take * batch.unitCost;
          usedQtyFromBatch += take;
          if (usedQtyFromBatch >= qty) break;
        }

        const actualQty = qty - remainingQty;
        if (actualQty <= 0) continue;

        const avgCost = costTotal / actualQty;
        const unitPrice = product.price;
        const subtotal = actualQty * unitPrice;
        const profit = subtotal - costTotal;

        items.push({
          batchId: productBatches[0].id,
          productId: product.id,
          productName: product.name,
          category: product.category,
          categoryName: product.categoryName,
          quantity: actualQty,
          unitPrice,
          unitCost: avgCost,
          subtotal,
          costTotal,
          profit,
        });

        totalAmount += subtotal;
        totalCost += costTotal;
        totalProfit += profit;
      }

      if (items.length > 0) {
        records.push({
          id: `S${String(saleId).padStart(6, '0')}`,
          date: dateStr,
          hour,
          items,
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          totalCost: parseFloat(totalCost.toFixed(2)),
          totalProfit: parseFloat(totalProfit.toFixed(2)),
          itemCount: items.reduce((sum, it) => sum + it.quantity, 0),
        });
        saleId++;
      }
    }
  }

  return records;
}

function generateInitialLossRecords(products: Product[], batches: InventoryBatch[]): LossRecord[] {
  const records: LossRecord[] = [];
  let id = 1;

  const expiringBatches = batches.filter(
    (b) => b.remaining > 0 && dayjs(b.expireDate).diff(dayjs(), 'day') <= 45
  );

  const sampleBatches = expiringBatches
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(20, expiringBatches.length));

  sampleBatches.forEach((batch) => {
    const daysAgo = Math.floor(Math.random() * 180);
    const qty = Math.min(batch.remaining, Math.floor(Math.random() * 10) + 1);
    batch.remaining -= qty;

    records.push({
      id: `L${String(id).padStart(4, '0')}`,
      date: dayjs().subtract(daysAgo, 'day').format('YYYY-MM-DD'),
      productId: batch.productId,
      productName: batch.productName,
      category: batch.category,
      categoryName: batch.categoryName,
      batchId: batch.id,
      quantity: qty,
      unitCost: batch.unitCost,
      totalCost: parseFloat((qty * batch.unitCost).toFixed(2)),
      reason: Math.random() > 0.5 ? 'expired' : Math.random() > 0.5 ? 'damaged' : 'other',
    });
    id++;
  });

  return records.sort((a, b) => b.date.localeCompare(a.date));
}

function buildInitialState(): StoreState {
  const products = generateProducts(80);
  const batches = generateInitialBatches(products);
  const salesRecords = generateInitialSalesRecords(products, [...batches.map((b) => ({ ...b }))]);
  const lossRecords = generateInitialLossRecords(
    products,
    batches.map((b) => ({ ...b }))
  );

  const maxBatchId = Math.max(0, ...batches.map((b) => parseInt(b.id.slice(1), 10)));
  const maxSaleId = Math.max(0, ...salesRecords.map((s) => parseInt(s.id.slice(1), 10)));
  const maxLossId = Math.max(0, ...lossRecords.map((l) => parseInt(l.id.slice(1), 10)));

  return {
    products,
    batches,
    salesRecords,
    lossRecords,
    nextBatchId: maxBatchId + 1,
    nextSaleId: maxSaleId + 1,
    nextLossId: maxLossId + 1,
  };
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...buildInitialState(),

      inboundStock: ({ productId, quantity, unitCost, produceDate, expireDate }) => {
        const state = get();
        const product = state.products.find((p) => p.id === productId);
        if (!product) return;

        const newBatch: InventoryBatch = {
          id: `B${String(state.nextBatchId).padStart(5, '0')}`,
          productId,
          productName: product.name,
          category: product.category,
          categoryName: product.categoryName,
          quantity,
          remaining: quantity,
          unitCost,
          produceDate,
          expireDate,
          inboundDate: dayjs().format('YYYY-MM-DD'),
        };

        set({
          batches: [...state.batches, newBatch],
          nextBatchId: state.nextBatchId + 1,
        });
      },

      sellStock: ({ items }) => {
        const state = get();
        const batchMap = new Map<string, InventoryBatch[]>();

        state.batches.forEach((b) => {
          if (!batchMap.has(b.productId)) batchMap.set(b.productId, []);
          batchMap.get(b.productId)!.push(b);
        });

        const salesItems: SalesItem[] = [];
        let totalAmount = 0;
        let totalCost = 0;
        let totalProfit = 0;

        for (const item of items) {
          const product = state.products.find((p) => p.id === item.productId);
          if (!product) return { success: false, message: `商品不存在` };

          const productBatches = (batchMap.get(item.productId) || [])
            .filter((b) => b.remaining > 0)
            .sort((a, b) => a.expireDate.localeCompare(b.expireDate));

          const totalStock = productBatches.reduce((sum, b) => sum + b.remaining, 0);
          if (totalStock < item.quantity) {
            return {
              success: false,
              message: `商品「${product.name}」库存不足，当前库存 ${totalStock} 件`,
            };
          }

          let remainingQty = item.quantity;
          let costTotal = 0;
          const usedBatchIds: string[] = [];

          for (const batch of productBatches) {
            if (remainingQty <= 0) break;
            const take = Math.min(remainingQty, batch.remaining);
            batch.remaining -= take;
            remainingQty -= take;
            costTotal += take * batch.unitCost;
            usedBatchIds.push(batch.id);
          }

          const actualQty = item.quantity;
          const avgCost = costTotal / actualQty;
          const subtotal = actualQty * item.unitPrice;
          const profit = subtotal - costTotal;

          salesItems.push({
            batchId: usedBatchIds[0],
            productId: item.productId,
            productName: product.name,
            category: product.category,
            categoryName: product.categoryName,
            quantity: actualQty,
            unitPrice: item.unitPrice,
            unitCost: parseFloat(avgCost.toFixed(2)),
            subtotal: parseFloat(subtotal.toFixed(2)),
            costTotal: parseFloat(costTotal.toFixed(2)),
            profit: parseFloat(profit.toFixed(2)),
          });

          totalAmount += subtotal;
          totalCost += costTotal;
          totalProfit += profit;
        }

        const now = dayjs();
        const newRecord: SalesRecord = {
          id: `S${String(state.nextSaleId).padStart(6, '0')}`,
          date: now.format('YYYY-MM-DD'),
          hour: now.hour(),
          items: salesItems,
          totalAmount: parseFloat(totalAmount.toFixed(2)),
          totalCost: parseFloat(totalCost.toFixed(2)),
          totalProfit: parseFloat(totalProfit.toFixed(2)),
          itemCount: salesItems.reduce((sum, it) => sum + it.quantity, 0),
        };

        set({
          batches: [...state.batches],
          salesRecords: [...state.salesRecords, newRecord],
          nextSaleId: state.nextSaleId + 1,
        });

        return { success: true, message: '销售成功', record: newRecord };
      },

      lossStock: ({ productId, batchId, quantity, reason }) => {
        const state = get();
        const product = state.products.find((p) => p.id === productId);
        if (!product) return { success: false, message: '商品不存在' };

        let targetBatch: InventoryBatch | undefined;
        let lossQty = quantity;
        let totalCost = 0;

        if (batchId) {
          targetBatch = state.batches.find((b) => b.id === batchId);
          if (!targetBatch) return { success: false, message: '批次不存在' };
          if (targetBatch.remaining < quantity) {
            return { success: false, message: '批次库存不足' };
          }
          targetBatch.remaining -= quantity;
          totalCost = quantity * targetBatch.unitCost;
        } else {
          const productBatches = state.batches
            .filter((b) => b.productId === productId && b.remaining > 0)
            .sort((a, b) => a.expireDate.localeCompare(b.expireDate));

          let remainingQty = quantity;
          for (const batch of productBatches) {
            if (remainingQty <= 0) break;
            const take = Math.min(remainingQty, batch.remaining);
            batch.remaining -= take;
            remainingQty -= take;
            totalCost += take * batch.unitCost;
            if (!targetBatch) targetBatch = batch;
          }

          if (remainingQty > 0) {
            return { success: false, message: '库存不足' };
          }
          lossQty = quantity - remainingQty;
        }

        const newRecord: LossRecord = {
          id: `L${String(state.nextLossId).padStart(4, '0')}`,
          date: dayjs().format('YYYY-MM-DD'),
          productId,
          productName: product.name,
          category: product.category,
          categoryName: product.categoryName,
          batchId: targetBatch?.id,
          quantity: lossQty,
          unitCost: targetBatch?.unitCost || product.cost,
          totalCost: parseFloat(totalCost.toFixed(2)),
          reason,
        };

        set({
          batches: [...state.batches],
          lossRecords: [...state.lossRecords, newRecord],
          nextLossId: state.nextLossId + 1,
        });

        return { success: true, message: '报损成功', record: newRecord };
      },

      resetData: () => {
        set(buildInitialState());
      },
    }),
    {
      name: 'supermarket-inventory-store',
    }
  )
);

export function getProductStock(productId: string, batches: InventoryBatch[]): number {
  return batches
    .filter((b) => b.productId === productId)
    .reduce((sum, b) => sum + b.remaining, 0);
}

export function getProductCost(productId: string, batches: InventoryBatch[]): number {
  const productBatches = batches.filter((b) => b.productId === productId && b.remaining > 0);
  const totalStock = productBatches.reduce((sum, b) => sum + b.remaining, 0);
  if (totalStock === 0) return 0;
  const totalCost = productBatches.reduce((sum, b) => sum + b.remaining * b.unitCost, 0);
  return parseFloat((totalCost / totalStock).toFixed(2));
}

export function getTotalStockValue(batches: InventoryBatch[]): number {
  return batches.reduce((sum, b) => sum + b.remaining * b.unitCost, 0);
}

export function getTotalStock(batches: InventoryBatch[]): number {
  return batches.reduce((sum, b) => sum + b.remaining, 0);
}

export function getProductExpireDate(productId: string, batches: InventoryBatch[]): string {
  const productBatches = batches.filter((b) => b.productId === productId && b.remaining > 0);
  if (productBatches.length === 0) return dayjs().format('YYYY-MM-DD');
  return productBatches.sort((a, b) => a.expireDate.localeCompare(b.expireDate))[0].expireDate;
}

export function getProductSalesLast30Days(
  productId: string,
  salesRecords: SalesRecord[]
): number {
  const thirtyDaysAgo = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
  return salesRecords
    .filter((r) => r.date >= thirtyDaysAgo)
    .reduce((sum, r) => {
      const item = r.items.find((i) => i.productId === productId);
      return sum + (item?.quantity || 0);
    }, 0);
}

export function getProductTurnoverDays(
  productId: string,
  batches: InventoryBatch[],
  salesRecords: SalesRecord[]
): number {
  const stock = getProductStock(productId, batches);
  const sales30 = getProductSalesLast30Days(productId, salesRecords);
  if (sales30 === 0) return 999;
  return Math.round((stock / sales30) * 30);
}

export function getTodaySales(salesRecords: SalesRecord[]): { amount: number; orders: number } {
  const today = dayjs().format('YYYY-MM-DD');
  const todayRecords = salesRecords.filter((r) => r.date === today);
  return {
    amount: todayRecords.reduce((sum, r) => sum + r.totalAmount, 0),
    orders: todayRecords.length,
  };
}

export function getExpiringCount(batches: InventoryBatch[], days: number = 30): number {
  const products = new Set<string>();
  const today = dayjs();
  batches.forEach((b) => {
    if (b.remaining > 0) {
      const daysLeft = dayjs(b.expireDate).diff(today, 'day');
      if (daysLeft >= 0 && daysLeft <= days) {
        products.add(b.productId);
      }
    }
  });
  return products.size;
}

export function generateKpiDataFromStore(
  batches: InventoryBatch[],
  salesRecords: SalesRecord[]
): KpiData {
  const today = getTodaySales(salesRecords);
  const totalStock = getTotalStock(batches);
  const expiringCount = getExpiringCount(batches);

  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const yesterdaySales = salesRecords
    .filter((r) => r.date === yesterday)
    .reduce((sum, r) => sum + r.totalAmount, 0);
  const yesterdayOrders = salesRecords.filter((r) => r.date === yesterday).length;

  const salesGrowth = yesterdaySales > 0
    ? parseFloat(((today.amount - yesterdaySales) / yesterdaySales * 100).toFixed(1))
    : 0;
  const orderGrowth = yesterdayOrders > 0
    ? parseFloat(((today.orders - yesterdayOrders) / yesterdayOrders * 100).toFixed(1))
    : 0;

  return {
    todaySales: Math.round(today.amount),
    todayOrders: today.orders,
    totalStock,
    expiringCount,
    salesGrowth,
    orderGrowth,
    stockGrowth: 2.5,
    expiringGrowth: -3.2,
  };
}

export function generateSalesDataFromStore(
  salesRecords: SalesRecord[],
  days: number = 30
): SalesData[] {
  const result: SalesData[] = [];
  const categories: CategoryType[] = ['snack', 'daily', 'frozen', 'drink'];

  for (let i = days - 1; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
    const dayRecords = salesRecords.filter((r) => r.date === date);

    const categoryBreakdown = categories.map((cat) => {
      const amount = dayRecords.reduce((sum, r) => {
        const catItems = r.items.filter((it) => it.category === cat);
        return sum + catItems.reduce((s, it) => s + it.subtotal, 0);
      }, 0);
      return {
        category: cat,
        categoryName: CategoryNames[cat],
        amount: Math.round(amount),
        percentage: 0,
      };
    });

    const totalAmount = categoryBreakdown.reduce((sum, c) => sum + c.amount, 0);
    categoryBreakdown.forEach((c) => {
      c.percentage = totalAmount > 0 ? parseFloat(((c.amount / totalAmount) * 100).toFixed(1)) : 0;
    });

    result.push({
      date,
      totalAmount,
      orderCount: dayRecords.length,
      categoryBreakdown,
    });
  }

  return result;
}

export function generateInventoryAlertsFromStore(
  products: Product[],
  batches: InventoryBatch[],
  salesRecords: SalesRecord[]
): InventoryAlert[] {
  const alerts: InventoryAlert[] = [];
  const today = dayjs();

  products.forEach((product) => {
    const stock = getProductStock(product.id, batches);
    const cost = getProductCost(product.id, batches);
    const stockValue = parseFloat((stock * cost).toFixed(2));
    const expireDate = getProductExpireDate(product.id, batches);
    const daysToExpire = dayjs(expireDate).diff(today, 'day');
    const sales30 = getProductSalesLast30Days(product.id, salesRecords);
    const turnoverDays = sales30 > 0 ? Math.round((stock / sales30) * 30) : 999;

    if (daysToExpire <= 30 && daysToExpire >= 0 && stock > 0) {
      alerts.push({
        productId: product.id,
        productName: product.name,
        category: product.category,
        categoryName: product.categoryName,
        type: 'expiring',
        level: daysToExpire <= 7 ? 'danger' : 'warning',
        daysLeft: daysToExpire,
        stock,
        stockValue,
      });
    }

    if ((turnoverDays > 60 || sales30 < 5) && stock > 0) {
      alerts.push({
        productId: product.id,
        productName: product.name,
        category: product.category,
        categoryName: product.categoryName,
        type: 'slow_moving',
        level: turnoverDays > 90 ? 'danger' : 'warning',
        stock,
        stockValue,
      });
    }

    const avgDailySales = sales30 / 30;
    if (avgDailySales > 0 && stock < avgDailySales * 3) {
      alerts.push({
        productId: product.id,
        productName: product.name,
        category: product.category,
        categoryName: product.categoryName,
        type: 'out_of_stock',
        level: stock === 0 ? 'danger' : 'warning',
        stock,
        stockValue,
      });
    }
  });

  return alerts;
}

export function generateProductAnalysisFromStore(
  products: Product[],
  batches: InventoryBatch[],
  salesRecords: SalesRecord[]
): ProductAnalysis[] {
  const thirtyDaysAgo = dayjs().subtract(30, 'day').format('YYYY-MM-DD');

  return products.map((product) => {
    let revenue = 0;
    let cost = 0;
    let salesVolume = 0;
    let weekdaySales = 0;
    let weekendSales = 0;

    salesRecords
      .filter((r) => r.date >= thirtyDaysAgo)
      .forEach((r) => {
        const item = r.items.find((i) => i.productId === product.id);
        if (item) {
          revenue += item.subtotal;
          cost += item.costTotal;
          salesVolume += item.quantity;

          const day = dayjs(r.date).day();
          if (day === 0 || day === 6) {
            weekendSales += item.quantity;
          } else {
            weekdaySales += item.quantity;
          }
        }
      });

    const profit = revenue - cost;
    const marginRate = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      productId: product.id,
      productName: product.name,
      category: product.category,
      categoryName: product.categoryName,
      revenue: parseFloat(revenue.toFixed(2)),
      cost: parseFloat(cost.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      marginRate: parseFloat(marginRate.toFixed(1)),
      salesVolume,
      weekdaySales,
      weekendSales,
    };
  }).filter((p) => p.salesVolume > 0);
}

export function generateHourlySalesFromStore(salesRecords: SalesRecord[]): HourlySales[] {
  const hourlyData: HourlySales[] = [];
  const today = dayjs().format('YYYY-MM-DD');
  const todayRecords = salesRecords.filter((r) => r.date === today);

  for (let hour = 7; hour <= 22; hour++) {
    const hourRecords = todayRecords.filter((r) => r.hour === hour);
    hourlyData.push({
      hour,
      sales: Math.round(hourRecords.reduce((sum, r) => sum + r.totalAmount, 0)),
      orders: hourRecords.length,
    });
  }

  return hourlyData;
}

export function getProductsWithStock(
  products: Product[],
  batches: InventoryBatch[],
  salesRecords: SalesRecord[]
): (Product & { stock: number; cost: number; expireDate: string; salesLast30Days: number; turnoverDays: number })[] {
  return products.map((p) => ({
    ...p,
    stock: getProductStock(p.id, batches),
    cost: getProductCost(p.id, batches),
    expireDate: getProductExpireDate(p.id, batches),
    salesLast30Days: getProductSalesLast30Days(p.id, salesRecords),
    turnoverDays: getProductTurnoverDays(p.id, batches, salesRecords),
  }));
}
