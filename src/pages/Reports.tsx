import { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  BarChart3,
  Calendar,
  Package,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';
import { Button, DatePicker, Select, Card, Progress, message } from 'antd';
import * as XLSX from 'xlsx';
import {
  mockSalesData,
  mockProducts,
  mockInventoryAlerts,
  mockLossRecords,
  mockProductAnalysis,
} from '@/data/mockData';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

type ReportType = 'sales' | 'inventory' | 'loss' | 'analysis';

export default function Reports() {
  const [reportType, setReportType] = useState<ReportType>('sales');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

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
      icon: TrendingUp,
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

  const handleExport = async () => {
    setIsGenerating(true);
    setExportProgress(0);

    const wb = XLSX.utils.book_new();

    for (let i = 0; i <= 100; i += 20) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setExportProgress(i);
    }

    if (reportType === 'sales' || reportType === 'analysis') {
      const salesExport = mockSalesData.map((d) => ({
        日期: d.date,
        销售额: d.totalAmount.toFixed(2),
        订单数: d.orderCount,
        零食销售额: d.categoryBreakdown.find((c) => c.category === 'snack')?.amount || 0,
        日化销售额: d.categoryBreakdown.find((c) => c.category === 'daily')?.amount || 0,
        速冻销售额: d.categoryBreakdown.find((c) => c.category === 'frozen')?.amount || 0,
        酒水销售额: d.categoryBreakdown.find((c) => c.category === 'drink')?.amount || 0,
      }));
      const ws1 = XLSX.utils.json_to_sheet(salesExport);
      XLSX.utils.book_append_sheet(wb, ws1, '销售明细');
    }

    if (reportType === 'inventory' || reportType === 'analysis') {
      const inventoryExport = mockProducts.slice(0, 50).map((p) => ({
        商品编号: p.id,
        商品名称: p.name,
        品类: p.categoryName,
        售价: p.price.toFixed(2),
        成本: p.cost.toFixed(2),
        当前库存: p.stock,
        到期日期: p.expireDate,
        近30天销量: p.salesLast30Days,
        周转天数: p.turnoverDays,
      }));
      const ws2 = XLSX.utils.json_to_sheet(inventoryExport);
      XLSX.utils.book_append_sheet(wb, ws2, '库存明细');

      const alertExport = mockInventoryAlerts.map((a) => ({
        商品编号: a.productId,
        商品名称: a.productName,
        预警类型: a.type === 'expiring' ? '临期' : a.type === 'slow_moving' ? '滞销' : '缺货',
        预警级别: a.level,
        当前库存: a.stock,
        库存价值: a.stockValue.toFixed(2),
      }));
      const ws3 = XLSX.utils.json_to_sheet(alertExport);
      XLSX.utils.book_append_sheet(wb, ws3, '库存预警');
    }

    if (reportType === 'loss' || reportType === 'analysis') {
      const lossExport = mockLossRecords.map((r) => ({
        日期: r.date,
        商品名称: r.productName,
        品类: r.categoryName,
        损耗原因: r.reason === 'expired' ? '临期过期' : r.reason === 'damaged' ? '破损' : '其他',
        数量: r.quantity,
        损耗金额: r.totalCost.toFixed(2),
      }));
      const ws4 = XLSX.utils.json_to_sheet(lossExport);
      XLSX.utils.book_append_sheet(wb, ws4, '损耗明细');
    }

    if (reportType === 'analysis') {
      const analysisExport = mockProductAnalysis.map((p) => ({
        商品名称: p.productName,
        品类: p.categoryName,
        销售额: p.revenue.toFixed(2),
        成本: p.cost.toFixed(2),
        利润: p.profit.toFixed(2),
        毛利率: p.marginRate.toFixed(1) + '%',
        工作日销量: p.weekdaySales,
        周末销量: p.weekendSales,
      }));
      const ws5 = XLSX.utils.json_to_sheet(analysisExport);
      XLSX.utils.book_append_sheet(wb, ws5, '单品分析');
    }

    setExportProgress(100);
    XLSX.writeFile(wb, `超市${reportType === 'sales' ? '销售' : reportType === 'inventory' ? '库存' : reportType === 'loss' ? '损耗' : '综合分析'}报表_${dayjs().format('YYYYMMDD')}.xlsx`);

    setTimeout(() => {
      setIsGenerating(false);
      setExportProgress(0);
      message.success('报表导出成功！');
    }, 500);
  };

  const historicalReports = [
    {
      id: 1,
      name: '2024年12月销售报表',
      type: 'sales',
      date: '2024-12-31',
      size: '2.3 MB',
    },
    {
      id: 2,
      name: '2024年Q4库存盘点报表',
      type: 'inventory',
      date: '2024-12-25',
      size: '1.8 MB',
    },
    {
      id: 3,
      name: '2024年损耗统计年报',
      type: 'loss',
      date: '2024-12-20',
      size: '856 KB',
    },
    {
      id: 4,
      name: '2024年11月综合分析报表',
      type: 'analysis',
      date: '2024-11-30',
      size: '3.2 MB',
    },
  ];

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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              报表格式
            </label>
            <Select defaultValue="xlsx" style={{ width: '100%' }} size="large">
              <Option value="xlsx">Excel (.xlsx)</Option>
              <Option value="csv">CSV (.csv)</Option>
              <Option value="pdf">PDF (.pdf)</Option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              数据粒度
            </label>
            <Select defaultValue="daily" style={{ width: '100%' }} size="large">
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
          <Button size="large" className="h-11 px-6">
            预览报表
          </Button>
        </div>
      </div>

      <div className="stat-card">
        <h3 className="font-semibold text-gray-800 mb-6">往年同期对比</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">销售额对比</span>
            </div>
            <p className="text-2xl font-bold text-green-700">+12.5%</p>
            <p className="text-sm text-green-600">较去年同期增长</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">订单数对比</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">+8.3%</p>
            <p className="text-sm text-blue-600">较去年同期增长</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-800">损耗率对比</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">-15.2%</p>
            <p className="text-sm text-purple-600">较去年同期下降</p>
          </div>
        </div>
      </div>

      <div className="stat-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-800">历史报表存档</h3>
          <Select defaultValue="all" style={{ width: 150 }}>
            <Option value="all">全部类型</Option>
            <Option value="sales">销售报表</Option>
            <Option value="inventory">库存报表</Option>
            <Option value="loss">损耗报表</Option>
            <Option value="analysis">综合分析</Option>
          </Select>
        </div>

        <div className="space-y-3">
          {historicalReports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <FileSpreadsheet className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{report.name}</p>
                  <p className="text-sm text-gray-500">
                    {report.date} · {report.size}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button type="link" size="small" icon={<Download size={14} />}>
                  下载
                </Button>
                <Button type="link" size="small">
                  查看
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
