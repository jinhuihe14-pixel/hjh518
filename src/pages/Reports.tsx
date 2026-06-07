import { useState, useMemo } from 'react';
import {
  Download,
  FileSpreadsheet,
  BarChart3,
  Calendar,
  Package,
  TrendingDown,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { Button, DatePicker, Select, Card, Progress, message, Modal, Table, Tabs, Empty } from 'antd';
import * as XLSX from 'xlsx';
import {
  useStore,
  generateSalesDataFromStore,
  generateProductAnalysisFromStore,
  generateInventoryAlertsFromStore,
  getProductStock,
  getProductCost,
  getTotalStockValue,
} from '@/store/useStore';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { CategoryType, LossRecord } from '@/types';

const { Option } = Select;
const { RangePicker } = DatePicker;

type ReportType = 'sales' | 'inventory' | 'loss' | 'analysis';
type GranularityType = 'daily' | 'weekly' | 'monthly';

interface ReportSheet {
  name: string;
  columns: ColumnsType<Record<string, any>>;
  data: Record<string, any>[];
}

const getWeekKey = (dateStr: string): string => {
  const d = dayjs(dateStr);
  const startOfWeek = d.startOf('week');
  const endOfWeek = d.endOf('week');
  return `${startOfWeek.format('YYYY-MM-DD')} ~ ${endOfWeek.format('YYYY-MM-DD')}`;
};

const getMonthKey = (dateStr: string): string => {
  return dayjs(dateStr).format('YYYY年MM月');
};

const aggregateSalesByGranularity = (
  data: ReturnType<typeof generateSalesDataFromStore>,
  granularity: GranularityType
): Record<string, any>[] => {
  if (granularity === 'daily') {
    return data.map((d) => ({
      date: d.date,
      totalAmount: d.totalAmount,
      orderCount: d.orderCount,
      snackAmount: d.categoryBreakdown.find((c) => c.category === 'snack')?.amount || 0,
      dailyAmount: d.categoryBreakdown.find((c) => c.category === 'daily')?.amount || 0,
      frozenAmount: d.categoryBreakdown.find((c) => c.category === 'frozen')?.amount || 0,
      drinkAmount: d.categoryBreakdown.find((c) => c.category === 'drink')?.amount || 0,
    }));
  }

  const getKey = granularity === 'weekly' ? getWeekKey : getMonthKey;
  const groups = new Map<string, {
    totalAmount: number;
    orderCount: number;
    snackAmount: number;
    dailyAmount: number;
    frozenAmount: number;
    drinkAmount: number;
  }>();

  data.forEach((d) => {
    const key = getKey(d.date);
    const existing = groups.get(key) || {
      totalAmount: 0,
      orderCount: 0,
      snackAmount: 0,
      dailyAmount: 0,
      frozenAmount: 0,
      drinkAmount: 0,
    };
    existing.totalAmount += d.totalAmount;
    existing.orderCount += d.orderCount;
    existing.snackAmount += d.categoryBreakdown.find((c) => c.category === 'snack')?.amount || 0;
    existing.dailyAmount += d.categoryBreakdown.find((c) => c.category === 'daily')?.amount || 0;
    existing.frozenAmount += d.categoryBreakdown.find((c) => c.category === 'frozen')?.amount || 0;
    existing.drinkAmount += d.categoryBreakdown.find((c) => c.category === 'drink')?.amount || 0;
    groups.set(key, existing);
  });

  return Array.from(groups.entries()).map(([date, val]) => ({
    date,
    totalAmount: val.totalAmount,
    orderCount: val.orderCount,
    snackAmount: val.snackAmount,
    dailyAmount: val.dailyAmount,
    frozenAmount: val.frozenAmount,
    drinkAmount: val.drinkAmount,
  }));
};

const aggregateLossByGranularity = (
  data: LossRecord[],
  granularity: GranularityType
): Record<string, any>[] => {
  if (granularity === 'daily') {
    return data.map((r) => ({
      date: r.date,
      productName: r.productName,
      categoryName: r.categoryName,
      reason: r.reason,
      quantity: r.quantity,
      totalCost: r.totalCost,
    }));
  }

  const getKey = granularity === 'weekly' ? getWeekKey : getMonthKey;
  const groups = new Map<string, {
    totalQuantity: number;
    totalCost: number;
    expiredCount: number;
    damagedCount: number;
    otherCount: number;
  }>();

  data.forEach((r) => {
    const key = getKey(r.date);
    const existing = groups.get(key) || {
      totalQuantity: 0,
      totalCost: 0,
      expiredCount: 0,
      damagedCount: 0,
      otherCount: 0,
    };
    existing.totalQuantity += r.quantity;
    existing.totalCost += r.totalCost;
    if (r.reason === 'expired') existing.expiredCount++;
    else if (r.reason === 'damaged') existing.damagedCount++;
    else existing.otherCount++;
    groups.set(key, existing);
  });

  return Array.from(groups.entries()).map(([date, val]) => ({
    date,
    totalQuantity: val.totalQuantity,
    totalCost: val.totalCost,
    expiredCount: val.expiredCount,
    damagedCount: val.damagedCount,
    otherCount: val.otherCount,
  }));
};

const filterSalesByDateRange = (
  data: ReturnType<typeof generateSalesDataFromStore>,
  dateRange: [dayjs.Dayjs, dayjs.Dayjs]
): ReturnType<typeof generateSalesDataFromStore> => {
  return data.filter((d) => {
    const date = dayjs(d.date);
    return date.isAfter(dateRange[0].subtract(1, 'day')) && date.isBefore(dateRange[1].add(1, 'day'));
  });
};

const filterLossByDateRange = (
  data: LossRecord[],
  dateRange: [dayjs.Dayjs, dayjs.Dayjs]
): LossRecord[] => {
  return data.filter((r) => {
    const date = dayjs(r.date);
    return date.isAfter(dateRange[0].subtract(1, 'day')) && date.isBefore(dateRange[1].add(1, 'day'));
  });
};

const getSalesColumns = (granularity: GranularityType): ColumnsType<Record<string, any>> => {
  if (granularity === 'daily') {
    return [
      { title: '日期', dataIndex: 'date', key: 'date', width: 120, fixed: 'left' },
      { title: '销售额', dataIndex: 'totalAmount', key: 'totalAmount', width: 100, render: (v: number) => v.toFixed(2) },
      { title: '订单数', dataIndex: 'orderCount', key: 'orderCount', width: 90 },
      { title: '零食销售额', dataIndex: 'snackAmount', key: 'snackAmount', width: 110, render: (v: number) => v.toFixed(2) },
      { title: '日化销售额', dataIndex: 'dailyAmount', key: 'dailyAmount', width: 110, render: (v: number) => v.toFixed(2) },
      { title: '速冻销售额', dataIndex: 'frozenAmount', key: 'frozenAmount', width: 110, render: (v: number) => v.toFixed(2) },
      { title: '酒水销售额', dataIndex: 'drinkAmount', key: 'drinkAmount', width: 110, render: (v: number) => v.toFixed(2) },
    ];
  }
  return [
    { title: granularity === 'weekly' ? '周次' : '月份', dataIndex: 'date', key: 'date', width: 200, fixed: 'left' },
    { title: '销售额', dataIndex: 'totalAmount', key: 'totalAmount', width: 100, render: (v: number) => v.toFixed(2) },
    { title: '订单数', dataIndex: 'orderCount', key: 'orderCount', width: 90 },
    { title: '零食销售额', dataIndex: 'snackAmount', key: 'snackAmount', width: 110, render: (v: number) => v.toFixed(2) },
    { title: '日化销售额', dataIndex: 'dailyAmount', key: 'dailyAmount', width: 110, render: (v: number) => v.toFixed(2) },
    { title: '速冻销售额', dataIndex: 'frozenAmount', key: 'frozenAmount', width: 110, render: (v: number) => v.toFixed(2) },
    { title: '酒水销售额', dataIndex: 'drinkAmount', key: 'drinkAmount', width: 110, render: (v: number) => v.toFixed(2) },
  ];
};

const getLossColumns = (granularity: GranularityType): ColumnsType<Record<string, any>> => {
  if (granularity === 'daily') {
    return [
      { title: '日期', dataIndex: 'date', key: 'date', width: 120, fixed: 'left' },
      { title: '商品名称', dataIndex: 'productName', key: 'productName', width: 150 },
      { title: '品类', dataIndex: 'categoryName', key: 'categoryName', width: 80 },
      {
        title: '损耗原因',
        dataIndex: 'reason',
        key: 'reason',
        width: 100,
        render: (v: string) => (v === 'expired' ? '临期过期' : v === 'damaged' ? '破损' : '其他'),
      },
      { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
      { title: '损耗金额', dataIndex: 'totalCost', key: 'totalCost', width: 100, render: (v: number) => v.toFixed(2) },
    ];
  }
  return [
    { title: granularity === 'weekly' ? '周次' : '月份', dataIndex: 'date', key: 'date', width: 200, fixed: 'left' },
    { title: '损耗总数量', dataIndex: 'totalQuantity', key: 'totalQuantity', width: 110 },
    { title: '损耗总金额', dataIndex: 'totalCost', key: 'totalCost', width: 110, render: (v: number) => v.toFixed(2) },
    { title: '临期过期次数', dataIndex: 'expiredCount', key: 'expiredCount', width: 110 },
    { title: '破损次数', dataIndex: 'damagedCount', key: 'damagedCount', width: 90 },
    { title: '其他原因次数', dataIndex: 'otherCount', key: 'otherCount', width: 110 },
  ];
};

const hasAnyData = (sheets: ReportSheet[]): boolean => {
  return sheets.some((s) => s.data.length > 0);
};

export default function Reports() {
  const [reportType, setReportType] = useState<ReportType>('sales');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [granularity, setGranularity] = useState<GranularityType>('daily');
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(false);

  const products = useStore((s) => s.products);
  const batches = useStore((s) => s.batches);
  const salesRecords = useStore((s) => s.salesRecords);
  const lossRecords = useStore((s) => s.lossRecords);

  const salesData = useMemo(
    () => generateSalesDataFromStore(salesRecords, 90),
    [salesRecords]
  );

  const inventoryAlerts = useMemo(
    () => generateInventoryAlertsFromStore(products, batches, salesRecords),
    [products, batches, salesRecords]
  );

  const productAnalysis = useMemo(
    () => generateProductAnalysisFromStore(products, batches, salesRecords),
    [products, batches, salesRecords]
  );

  const inventoryColumns: ColumnsType<Record<string, any>> = [
    { title: '商品编号', dataIndex: 'id', key: 'id', width: 100, fixed: 'left' },
    { title: '商品名称', dataIndex: 'name', key: 'name', width: 180 },
    { title: '品类', dataIndex: 'categoryName', key: 'categoryName', width: 80 },
    { title: '售价', dataIndex: 'price', key: 'price', width: 80, render: (v: number) => v.toFixed(2) },
    { title: '成本', dataIndex: 'cost', key: 'cost', width: 80, render: (v: number) => v.toFixed(2) },
    { title: '当前库存', dataIndex: 'stock', key: 'stock', width: 90 },
    { title: '库存价值', dataIndex: 'stockValue', key: 'stockValue', width: 100, render: (v: number) => v.toFixed(2) },
  ];

  const alertColumns: ColumnsType<Record<string, any>> = [
    { title: '商品编号', dataIndex: 'productId', key: 'productId', width: 100, fixed: 'left' },
    { title: '商品名称', dataIndex: 'productName', key: 'productName', width: 180 },
    { title: '预警类型', dataIndex: 'type', key: 'type', width: 100, render: (v: string) => (v === 'expiring' ? '临期' : v === 'slow_moving' ? '滞销' : '缺货') },
    { title: '预警级别', dataIndex: 'level', key: 'level', width: 90 },
    { title: '当前库存', dataIndex: 'stock', key: 'stock', width: 90 },
    { title: '库存价值', dataIndex: 'stockValue', key: 'stockValue', width: 100, render: (v: number) => v.toFixed(2) },
  ];

  const analysisColumns: ColumnsType<Record<string, any>> = [
    { title: '商品名称', dataIndex: 'productName', key: 'productName', width: 180, fixed: 'left' },
    { title: '品类', dataIndex: 'categoryName', key: 'categoryName', width: 80 },
    { title: '销售额', dataIndex: 'revenue', key: 'revenue', width: 100, render: (v: number) => v.toFixed(2) },
    { title: '成本', dataIndex: 'cost', key: 'cost', width: 100, render: (v: number) => v.toFixed(2) },
    { title: '利润', dataIndex: 'profit', key: 'profit', width: 100, render: (v: number) => v.toFixed(2) },
    { title: '毛利率', dataIndex: 'marginRate', key: 'marginRate', width: 90, render: (v: number) => v.toFixed(1) + '%' },
    { title: '工作日销量', dataIndex: 'weekdaySales', key: 'weekdaySales', width: 100 },
    { title: '周末销量', dataIndex: 'weekendSales', key: 'weekendSales', width: 90 },
  ];

  const inventoryData = useMemo(() => {
    return products.map((p) => {
      const stock = getProductStock(p.id, batches);
      const cost = getProductCost(p.id, batches);
      return {
        ...p,
        cost: cost || 0,
        stock,
        stockValue: stock * (cost || 0),
      };
    });
  }, [products, batches]);

  const generateReportSheets = (): ReportSheet[] => {
    const sheets: ReportSheet[] = [];

    if (reportType === 'sales' || reportType === 'analysis') {
      const filteredSales = filterSalesByDateRange(salesData, dateRange);
      const aggregatedSales = aggregateSalesByGranularity(filteredSales, granularity);
      sheets.push({
        name: '销售明细',
        columns: getSalesColumns(granularity),
        data: aggregatedSales.map((item, i) => ({ ...item, _key: `sales-${i}` })),
      });
    }

    if (reportType === 'inventory' || reportType === 'analysis') {
      sheets.push({
        name: '库存明细',
        columns: inventoryColumns,
        data: inventoryData.map((p, i) => ({ ...p, _key: `inv-${i}` })),
      });

      sheets.push({
        name: '库存预警',
        columns: alertColumns,
        data: inventoryAlerts.map((a, i) => ({ ...a, _key: `alert-${i}` })),
      });
    }

    if (reportType === 'loss' || reportType === 'analysis') {
      const filteredLoss = filterLossByDateRange(lossRecords, dateRange);
      const aggregatedLoss = aggregateLossByGranularity(filteredLoss, granularity);
      sheets.push({
        name: '损耗明细',
        columns: getLossColumns(granularity),
        data: aggregatedLoss.map((item, i) => ({ ...item, _key: `loss-${i}` })),
      });
    }

    if (reportType === 'analysis') {
      sheets.push({
        name: '单品分析',
        columns: analysisColumns,
        data: productAnalysis.map((p, i) => ({ ...p, _key: `analysis-${i}` })),
      });
    }

    return sheets;
  };

  const sheets = useMemo(() => generateReportSheets(), [
    reportType, dateRange, granularity,
    salesData, lossRecords, inventoryData,
    inventoryAlerts, productAnalysis,
  ]);

  const hasData = useMemo(() => hasAnyData(sheets), [sheets]);

  const reportTemplates = [
    {
      type: 'sales' as ReportType,
      icon: BarChart3,
      title: '销售报表',
      description: '包含每日销售额、订单数、品类明细等',
      color: 'orange',
    },
    {
      type: 'inventory' as ReportType,
      icon: Package,
      title: '库存报表',
      description: '包含库存盘点、临期预警、滞销分析等',
      color: 'blue',
    },
    {
      type: 'loss' as ReportType,
      icon: TrendingDown,
      title: '损耗报表',
      description: '包含临期损耗、破损记录、成本统计等',
      color: 'red',
    },
    {
      type: 'analysis' as ReportType,
      icon: FileSpreadsheet,
      title: '综合分析报表',
      description: '包含销售、库存、损耗全维度分析',
      color: 'purple',
    },
  ];

  const colorClasses: Record<string, string> = {
    orange: 'from-orange-500 to-orange-600',
    blue: 'from-blue-500 to-blue-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
  };

  const handlePreview = () => {
    setPreviewVisible(true);
  };

  const handleExport = async () => {
    if (!hasData) {
      message.warning('当前配置下无数据可导出，请调整时间范围后重试');
      return;
    }

    setIsGenerating(true);
    setExportProgress(0);

    const wb = XLSX.utils.book_new();

    for (let i = 0; i <= 80; i += 20) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      setExportProgress(i);
    }

    sheets.forEach((sheet) => {
      const exportData = sheet.data.map((row) => {
        const exportRow: Record<string, any> = {};
        sheet.columns.forEach((col: any) => {
          const key = col.dataIndex;
          const title = col.title;
          let value = row[key];
          if (col.render && typeof value === 'number') {
            if (key === 'marginRate') {
              value = value.toFixed(1) + '%';
            } else if (['totalAmount', 'snackAmount', 'dailyAmount', 'frozenAmount', 'drinkAmount', 'totalCost', 'price', 'cost', 'stockValue', 'revenue', 'profit'].includes(key)) {
              value = value.toFixed(2);
            }
          }
          if (key === 'type') {
            value = value === 'expiring' ? '临期' : value === 'slow_moving' ? '滞销' : '缺货';
          }
          if (key === 'reason') {
            value = value === 'expired' ? '临期过期' : value === 'damaged' ? '破损' : '其他';
          }
          exportRow[title] = value;
        });
        return exportRow;
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    });

    setExportProgress(100);
    XLSX.writeFile(
      wb,
      `超市${reportType === 'sales' ? '销售' : reportType === 'inventory' ? '库存' : reportType === 'loss' ? '损耗' : '综合分析'}报表_${dayjs().format('YYYYMMDD')}.xlsx`
    );

    setTimeout(() => {
      setIsGenerating(false);
      setExportProgress(0);
      message.success('报表导出成功！');
    }, 500);
  };

  const totalStockValue = useMemo(() => getTotalStockValue(batches), [batches]);
  const totalLoss = useMemo(() => lossRecords.reduce((s, r) => s + r.totalCost, 0), [lossRecords]);

  const renderPreviewContent = () => {
    if (!hasData) {
      return (
        <div className="py-16">
          <Empty description="该时间范围无数据" />
        </div>
      );
    }

    if (sheets.length === 1) {
      const sheet = sheets[0];
      return (
        <Table
          columns={sheet.columns}
          dataSource={sheet.data}
          rowKey="_key"
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      );
    }

    const tabItems = sheets.map((sheet, index) => ({
      key: String(index),
      label: sheet.name,
      children: (
        <Table
          columns={sheet.columns}
          dataSource={sheet.data}
          rowKey="_key"
          scroll={{ x: 1000 }}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      ),
    }));

    return <Tabs items={tabItems} />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">报表中心</h1>
        <p className="text-gray-500 mt-1">全量报表导出与历史数据对比分析</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {reportTemplates.map((template) => (
          <Card
            key={template.type}
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
              reportType === template.type ? 'ring-2 ring-primary-500' : ''
            }`}
            onClick={() => setReportType(template.type)}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 bg-gradient-to-br ${colorClasses[template.color]} rounded-xl flex items-center justify-center shadow-md`}
              >
                <template.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{template.title}</h3>
                <p className="text-xs text-gray-500">{template.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="stat-card">
        <h3 className="font-semibold text-gray-800 mb-6">导出配置</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              时间范围
            </label>
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
              style={{ width: '100%' }}
              size="large"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">报表格式</label>
            <Select defaultValue="xlsx" style={{ width: '100%' }} size="large">
              <Option value="xlsx">Excel (.xlsx)</Option>
              <Option value="csv">CSV (.csv)</Option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">数据粒度</label>
            <Select
              value={granularity}
              onChange={(val) => setGranularity(val)}
              style={{ width: '100%' }}
              size="large"
            >
              <Option value="daily">每日明细</Option>
              <Option value="weekly">每周汇总</Option>
              <Option value="monthly">每月汇总</Option>
            </Select>
          </div>
        </div>

        {isGenerating && (
          <div className="mb-6 p-4 bg-primary-50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">正在生成报表...</span>
              <span className="text-sm font-medium text-primary-600">{exportProgress}%</span>
            </div>
            <Progress percent={exportProgress} showInfo={false} strokeColor="#FF7A45" />
          </div>
        )}

        <div className="flex items-center gap-4">
          <Button
            type="primary"
            size="large"
            icon={<Download size={18} />}
            onClick={handleExport}
            loading={isGenerating}
            className="bg-primary-500 hover:bg-primary-600 h-11 px-8"
          >
            导出报表
          </Button>
          <Button
            size="large"
            icon={<Eye size={18} />}
            onClick={handlePreview}
            className="h-11 px-6"
          >
            预览报表
          </Button>
        </div>
      </div>

      <Modal
        title="报表预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>,
          <Button
            key="export"
            type="primary"
            icon={<Download size={16} />}
            onClick={() => {
              setPreviewVisible(false);
              handleExport();
            }}
          >
            导出Excel
          </Button>,
        ]}
        width={1000}
        styles={{ body: { maxHeight: '70vh', overflow: 'auto' } }}
      >
        {renderPreviewContent()}
      </Modal>

      <div className="stat-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-800">核心数据一览</h3>
          <span className="text-sm text-gray-500">数据实时同步</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">总库存价值</span>
            </div>
            <p className="text-2xl font-bold text-green-700">¥{totalStockValue.toFixed(2)}</p>
            <p className="text-sm text-green-600">基于批次成本计算</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">累计订单数</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{salesRecords.length}单</p>
            <p className="text-sm text-blue-600">真实销售流水</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-800">累计损耗额</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">¥{totalLoss.toFixed(2)}</p>
            <p className="text-sm text-purple-600">报损台账合计</p>
          </div>
        </div>
      </div>
    </div>
  );
}
