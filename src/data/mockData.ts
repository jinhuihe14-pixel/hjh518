import dayjs from 'dayjs';
import {
  CategoryType,
  CategoryNames,
  Product,
  SalesData,
  InventoryAlert,
  ProductAnalysis,
  LossRecord,
  HourlySales,
  DisplaySuggestion,
  KpiData,
} from '@/types';

const productNames = {
  snack: [
    '乐事薯片原味', '乐事薯片黄瓜味', '奥利奥夹心饼干', '康师傅红烧牛肉面',
    '统一老坛酸菜面', '旺旺雪饼', '旺旺仙贝', '好丽友派', '德芙巧克力',
    '士力架花生巧克力', '绿箭口香糖', '益达木糖醇', '不二家牛奶糖',
    '大白兔奶糖', '徐福记沙琪玛', '盼盼小面包', '达利园蛋黄派',
    '三只松鼠坚果大礼包', '良品铺子猪肉脯', '百草味芒果干', '卫龙辣条',
    '双汇火腿肠', '金锣王中王', '洽洽香瓜子', '恰恰焦糖瓜子',
  ],
  daily: [
    '飘柔洗发水', '海飞丝去屑洗发露', '潘婷乳液修复', '舒肤佳香皂',
    '力士沐浴露', '六神花露水', '蓝月亮洗衣液', '立白洗洁精',
    '雕牌洗衣粉', '黑人牙膏', '高露洁牙膏', '佳洁士盐白牙膏',
    '维达抽纸', '心相印卷纸', '清风原木纯品', '七度空间卫生巾',
    '护舒宝棉柔', '苏菲弹力贴身', '帮宝适纸尿裤', '好奇金装',
    '大宝SOD蜜', '百雀羚面霜', '凡士林护手霜', '美加净护手霜',
  ],
  frozen: [
    '思念猪肉水饺', '三全灌汤包', '湾仔码头玉米蔬菜饺', '安井手抓饼',
    '正大鸡肉洋葱圈', '圣农脆皮炸鸡', '千味央厨红糖发糕',
    '广州酒家利口福虾饺', '避风塘菠萝包', '五丰冷食宁波汤圆',
    '海霸王甲天下汤圆', '龙凤红豆沙汤圆', '必品阁王饺子',
    '小肥羊羊肉卷', '肥牛卷', '安井丸子拼盘', '海欣鱼豆腐',
  ],
  drink: [
    '农夫山泉550ml', '怡宝纯净水', '百岁山矿泉水', '可口可乐330ml',
    '百事可乐330ml', '雪碧柠檬味', '芬达橙味', '康师傅冰红茶',
    '统一绿茶', '王老吉凉茶', '加多宝凉茶', '红牛维生素功能饮料',
    '旺仔牛奶', '伊利纯牛奶', '蒙牛特仑苏', '安慕希酸奶',
    '纯甄酸牛奶', '江小白100ml', '牛栏山二锅头', '红星二锅头',
    '青岛啤酒500ml', '百威啤酒', '雪花勇闯天涯', '燕京啤酒',
  ],
};

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

export function generateProducts(count: number = 200): Product[] {
  const products: Product[] = [];
  const categories: CategoryType[] = ['snack', 'daily', 'frozen', 'drink'];
  const categoryWeights = [0.4, 0.25, 0.2, 0.15];
  const priceRanges = {
    snack: { min: 5, max: 50 },
    daily: { min: 10, max: 100 },
    frozen: { min: 15, max: 80 },
    drink: { min: 2, max: 300 },
  };
  const marginRates = {
    snack: { min: 0.25, max: 0.35 },
    daily: { min: 0.30, max: 0.45 },
    frozen: { min: 0.20, max: 0.30 },
    drink: { min: 0.35, max: 0.50 },
  };

  let id = 1;
  categories.forEach((category, catIndex) => {
    const categoryCount = Math.floor(count * categoryWeights[catIndex]);
    const names = productNames[category];
    
    for (let i = 0; i < categoryCount; i++) {
      const price = randomFloat(priceRanges[category].min, priceRanges[category].max);
      const marginRate = randomFloat(marginRates[category].min, marginRates[category].max);
      const cost = parseFloat((price * (1 - marginRate)).toFixed(2));
      
      const expireDays = category === 'frozen' ? randomBetween(30, 180) : 
                        category === 'drink' ? randomBetween(90, 365) :
                        category === 'daily' ? randomBetween(180, 730) :
                        randomBetween(60, 180);
      
      products.push({
        id: `P${String(id).padStart(4, '0')}`,
        name: names[i % names.length] + (i >= names.length ? ` ${Math.floor(i / names.length) + 1}` : ''),
        category,
        categoryName: CategoryNames[category],
        price,
        cost,
        stock: randomBetween(10, 200),
        expireDate: dayjs().add(randomBetween(-30, expireDays), 'day').format('YYYY-MM-DD'),
        shelfLife: expireDays,
        salesLast30Days: randomBetween(5, 150),
        turnoverDays: randomBetween(3, 90),
      });
      id++;
    }
  });

  return products;
}

export function generateSalesData(days: number = 30): SalesData[] {
  const salesData: SalesData[] = [];
  const categories: CategoryType[] = ['snack', 'daily', 'frozen', 'drink'];

  for (let i = days - 1; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day');
    const isWeekend = date.day() === 0 || date.day() === 6;
    const baseAmount = isWeekend ? randomBetween(12000, 20000) : randomBetween(8000, 15000);
    
    const categoryBreakdown = categories.map(category => {
      const weights = { snack: 0.35, daily: 0.25, frozen: 0.2, drink: 0.2 };
      const amount = Math.floor(baseAmount * weights[category] * (0.8 + Math.random() * 0.4));
      return {
        category,
        categoryName: CategoryNames[category],
        amount,
        percentage: 0,
      };
    });

    const totalAmount = categoryBreakdown.reduce((sum, c) => sum + c.amount, 0);
    categoryBreakdown.forEach(c => {
      c.percentage = parseFloat(((c.amount / totalAmount) * 100).toFixed(1));
    });

    salesData.push({
      date: date.format('YYYY-MM-DD'),
      totalAmount,
      orderCount: Math.floor(totalAmount / randomFloat(25, 40)),
      categoryBreakdown,
    });
  }

  return salesData;
}

export function generateInventoryAlerts(products: Product[]): InventoryAlert[] {
  const alerts: InventoryAlert[] = [];

  products.forEach(product => {
    const daysToExpire = dayjs(product.expireDate).diff(dayjs(), 'day');
    
    if (daysToExpire <= 30 && daysToExpire >= 0) {
      alerts.push({
        productId: product.id,
        productName: product.name,
        category: product.category,
        categoryName: product.categoryName,
        type: 'expiring',
        level: daysToExpire <= 7 ? 'danger' : 'warning',
        daysLeft: daysToExpire,
        stock: product.stock,
        stockValue: parseFloat((product.stock * product.cost).toFixed(2)),
      });
    }

    if (product.turnoverDays > 60 || product.salesLast30Days < 5) {
      alerts.push({
        productId: product.id,
        productName: product.name,
        category: product.category,
        categoryName: product.categoryName,
        type: 'slow_moving',
        level: product.turnoverDays > 90 ? 'danger' : 'warning',
        stock: product.stock,
        stockValue: parseFloat((product.stock * product.cost).toFixed(2)),
      });
    }

    const avgDailySales = product.salesLast30Days / 30;
    if (product.stock < avgDailySales * 3) {
      alerts.push({
        productId: product.id,
        productName: product.name,
        category: product.category,
        categoryName: product.categoryName,
        type: 'out_of_stock',
        level: product.stock === 0 ? 'danger' : 'warning',
        stock: product.stock,
        stockValue: parseFloat((product.stock * product.cost).toFixed(2)),
      });
    }
  });

  return alerts;
}

export function generateProductAnalysis(products: Product[]): ProductAnalysis[] {
  return products.slice(0, 50).map(product => {
    const revenue = product.salesLast30Days * product.price;
    const cost = product.salesLast30Days * product.cost;
    const profit = revenue - cost;
    const marginRate = (profit / revenue) * 100;
    const weekendRatio = 1.3 + Math.random() * 0.5;
    const weekdaySales = Math.floor(product.salesLast30Days / (22 + 8 * weekendRatio));
    const weekendSales = Math.floor(weekdaySales * weekendRatio);

    return {
      productId: product.id,
      productName: product.name,
      category: product.category,
      categoryName: product.categoryName,
      revenue: parseFloat(revenue.toFixed(2)),
      cost: parseFloat(cost.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      marginRate: parseFloat(marginRate.toFixed(1)),
      salesVolume: product.salesLast30Days,
      weekdaySales: weekdaySales * 22,
      weekendSales: weekendSales * 8,
    };
  });
}

export function generateLossRecords(months: number = 6): LossRecord[] {
  const records: LossRecord[] = [];
  const products = generateProducts(50);
  const reasons: ('expired' | 'damaged' | 'other')[] = ['expired', 'expired', 'expired', 'damaged', 'other'];
  let id = 1;

  for (let m = months - 1; m >= 0; m--) {
    const monthRecords = randomBetween(8, 20);
    for (let i = 0; i < monthRecords; i++) {
      const product = products[randomBetween(0, products.length - 1)];
      const quantity = randomBetween(1, 15);
      
      records.push({
        id: `L${String(id).padStart(4, '0')}`,
        date: dayjs().subtract(m, 'month').subtract(randomBetween(0, 25), 'day').format('YYYY-MM-DD'),
        productId: product.id,
        productName: product.name,
        category: product.category,
        categoryName: product.categoryName,
        quantity,
        unitCost: product.cost,
        totalCost: parseFloat((quantity * product.cost).toFixed(2)),
        reason: reasons[randomBetween(0, reasons.length - 1)],
      });
      id++;
    }
  }

  return records.sort((a, b) => b.date.localeCompare(a.date));
}

export function generateHourlySales(): HourlySales[] {
  const hourlyData: HourlySales[] = [];
  const peakHours = [11, 12, 13, 17, 18, 19, 20];

  for (let hour = 7; hour <= 22; hour++) {
    const isPeak = peakHours.includes(hour);
    const baseSales = isPeak ? 800 : 200;
    
    hourlyData.push({
      hour,
      sales: Math.floor(baseSales * (0.8 + Math.random() * 0.4)),
      orders: Math.floor(baseSales / 30 * (0.8 + Math.random() * 0.4)),
    });
  }

  return hourlyData;
}

export function generateDisplaySuggestions(): DisplaySuggestion[] {
  const suggestions: DisplaySuggestion[] = [
    {
      position: '收银台旁',
      products: [
        { id: 'P0001', name: '绿箭口香糖', reason: '高转化率冲动消费' },
        { id: 'P0002', name: '士力架巧克力', reason: '排队时高曝光' },
        { id: 'P0003', name: '农夫山泉', reason: '高频购买商品' },
      ],
    },
    {
      position: '入口黄金区',
      products: [
        { id: 'P0010', name: '乐事薯片促销装', reason: '引流爆款' },
        { id: 'P0011', name: '伊利纯牛奶', reason: '民生刚需品' },
        { id: 'P0012', name: '三只松鼠坚果', reason: '高毛利促销品' },
      ],
    },
    {
      position: '零食区端头',
      products: [
        { id: 'P0020', name: '旺旺大礼包', reason: '节日主题陈列' },
        { id: 'P0021', name: '奥利奥夹心饼干', reason: '品牌效应强' },
      ],
    },
    {
      position: '冻品冷柜端头',
      products: [
        { id: 'P0030', name: '思念水饺组合装', reason: '家庭采购重点' },
        { id: 'P0031', name: '安井火锅丸子', reason: '季节性热销' },
      ],
    },
  ];

  return suggestions;
}

export function generateKpiData(): KpiData {
  return {
    todaySales: randomBetween(8000, 15000),
    todayOrders: randomBetween(200, 400),
    totalStock: randomBetween(15000, 20000),
    expiringCount: randomBetween(25, 50),
    salesGrowth: randomFloat(-5, 15),
    orderGrowth: randomFloat(-3, 12),
    stockGrowth: randomFloat(-2, 8),
    expiringGrowth: randomFloat(-10, 5),
  };
}

export const mockProducts = generateProducts(200);
export const mockSalesData = generateSalesData(30);
export const mockInventoryAlerts = generateInventoryAlerts(mockProducts);
export const mockProductAnalysis = generateProductAnalysis(mockProducts);
export const mockLossRecords = generateLossRecords(6);
export const mockHourlySales = generateHourlySales();
export const mockDisplaySuggestions = generateDisplaySuggestions();
export const mockKpiData = generateKpiData();
