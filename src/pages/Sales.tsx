import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { TrendingUp, DollarSign, Percent, Calendar } from 'lucide-react';
import { mockSalesData, mockProductAnalysis } from '@/data/mockData';
import { CategoryColors } from '@/types';
import { Table, Select, DatePicker } from 'antd';
import type { TableProps } from 'antd';
import type { ProductAnalysis } from '@/types';
import dayjs from 'dayjs';

const { Option } = Select;

export default function Sales() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categoryStats = useMemo(() => {
    const last30Days = mockSalesData.slice(-30);
    const categoryTotals: Record<string, number> = {};
    const categoryOrders: Record<string, number> = {};

    last30Days.forEach((day) => {
      day.categoryBreakdown.forEach((cat) => {
        categoryTotals[cat.category] = (categoryTotals[cat.category] || 0) + cat.amount;
      });
      Object.keys(categoryTotals).forEach((cat) => {
        categoryOrders[cat] = (categoryOrders[cat] || 0) + Math.floor(day.orderCount * 0.25);
      });
    });

    return categoryTotals;
  }, []);

  const categoryBarOption = useMemo(() => {
    const categories = Object.keys(categoryStats);
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        textStyle: { color: '#374151' },
        formatter: '{b}: ¥{c}',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: categories.map((c) => c),
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280' },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280' },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
      },
      series: [
        {
          type: 'bar',
          data: categories.map((c) => ({
            value: categoryStats[c],
            itemStyle: {
              color: CategoryColors[c as keyof typeof CategoryColors],
              borderRadius: [8, 8, 0, 0],
            },
          })),
          barWidth: '50%',
        },
      ],
      animationDuration: 1000,
    };
  }, [categoryStats]);

  const marginAnalysisOption = useMemo(() => {
    const topProducts = [...mockProductAnalysis]
      .sort((a, b) => b.marginRate - a.marginRate)
      .slice(0, 10);

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        textStyle: { color: '#374151' },
        formatter: '{b}: {c}%',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        max: 50,
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280', formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
      },
      yAxis: {
        type: 'category',
        data: topProducts.map((p) => p.productName).reverse(),
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280', fontSize: 11 },
      },
      series: [
        {
          type: 'bar',
          data: topProducts
            .map((p) => ({
              value: p.marginRate,
              itemStyle: {
                color: p.marginRate > 40 ? '#10B981' : p.marginRate > 30 ? '#FF7A45' : '#6B7280',
                borderRadius: [0, 4, 4, 0],
              },
            }))
            .reverse(),
          barWidth: '60%',
        },
      ],
      animationDuration: 1000,
    };
  }, []);

  const weekdayWeekendOption = useMemo(() => {
    const weekdaySales = mockSalesData.filter((d) => {
      const day = dayjs(d.date).day();
      return day >= 1 && day <= 5;
    });
    const weekendSales = mockSalesData.filter((d) => {
      const day = dayjs(d.date).day();
      return day === 0 || day === 6;
    });

    const weekdayAvg = weekdaySales.reduce((sum, d) => sum + d.totalAmount, 0) / weekdaySales.length;
    const weekendAvg = weekendSales.reduce((sum, d) => sum + d.totalAmount, 0) / weekendSales.length;

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        textStyle: { color: '#374151' },
      },
      legend: {
        data: ['日均销售额'],
        top: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: ['工作日', '周末'],
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280', fontSize: 14 },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280' },
        splitLine: { lineStyle: { color: '#f3f4f6' } },
      },
      series: [
        {
          name: '日均销售额',
          type: 'bar',
          data: [
            {
              value: weekdayAvg,
              itemStyle: { color: '#1A5D6B', borderRadius: [8, 8, 0, 0] },
            },
            {
              value: weekendAvg,
              itemStyle: { color: '#FF7A45', borderRadius: [8, 8, 0, 0] },
            },
          ],
          barWidth: '40%',
          label: {
            show: true,
            position: 'top',
            formatter: '¥{c}',
            color: '#374151',
            fontSize: 12,
          },
        },
      ],
      animationDuration: 1000,
    };
  }, []);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return mockProductAnalysis;
    return mockProductAnalysis.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  const columns: TableProps<ProductAnalysis>['columns'] = [
    {
      title: '排名',
      key: 'rank',
      width: 70,
      render: (_, __, index) => (
        <span className={`font-bold ${index < 3 ? 'text-primary-600' : 'text-gray-500'}`}>
          {index + 1}
        </span>
      ),
    },
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: '品类',
      dataIndex: 'categoryName',
      key: 'categoryName',
      width: 80,
    },
    {
      title: '销售额',
      dataIndex: 'revenue',
      key: 'revenue',
      width: 100,
      render: (v) => <span className="font-medium">¥{v.toFixed(2)}</span>,
      sorter: (a, b) => a.revenue - b.revenue,
    },
    {
      title: '毛利',
      dataIndex: 'profit',
      key: 'profit',
      width: 100,
      render: (v) => <span className="text-green-600">¥{v.toFixed(2)}</span>,
    },
    {
      title: '毛利率',
      dataIndex: 'marginRate',
      key: 'marginRate',
      width: 90,
      render: (v) => (
        <span className={`font-medium ${v > 40 ? 'text-green-600' : v > 30 ? 'text-primary-600' : 'text-gray-600'}`}>
          {v.toFixed(1)}%
        </span>
      ),
      sorter: (a, b) => a.marginRate - b.marginRate,
    },
    {
      title: '工作日销量',
      dataIndex: 'weekdaySales',
      key: 'weekdaySales',
      width: 100,
      render: (v) => `${v}件`,
    },
    {
      title: '周末销量',
      dataIndex: 'weekendSales',
      key: 'weekendSales',
      width: 100,
      render: (v) => `${v}件`,
    },
  ];

  const totalRevenue = mockSalesData.slice(-30).reduce((sum, d) => sum + d.totalAmount, 0);
  const totalOrders = mockSalesData.slice(-30).reduce((sum, d) => sum + d.orderCount, 0);
  const avgMargin = mockProductAnalysis.reduce((sum, p) => sum + p.marginRate, 0) / mockProductAnalysis.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">销售分析</h1>
          <p className="text-gray-500 mt-1">品类营收、毛利率与周度差异分析</p>
        </div>
        <div className="flex items-center gap-3">
          <DatePicker.RangePicker
            defaultValue={[dayjs().subtract(30, 'day'), dayjs()]}
            size="middle"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">30天总营收</p>
              <p className="text-2xl font-bold text-gray-800">¥{totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">30天订单数</p>
              <p className="text-2xl font-bold text-gray-800">{totalOrders.toLocaleString()}单</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Percent className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">平均毛利率</p>
              <p className="text-2xl font-bold text-gray-800">{avgMargin.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="stat-card">
          <h3 className="font-semibold text-gray-800 mb-4">品类营收统计</h3>
          <ReactECharts option={categoryBarOption} style={{ height: '280px' }} />
        </div>

        <div className="stat-card">
          <h3 className="font-semibold text-gray-800 mb-4">工作日vs周末销售对比</h3>
          <ReactECharts option={weekdayWeekendOption} style={{ height: '280px' }} />
        </div>
      </div>

      <div className="stat-card">
        <h3 className="font-semibold text-gray-800 mb-4">毛利率TOP10商品</h3>
        <ReactECharts option={marginAnalysisOption} style={{ height: '320px' }} />
      </div>

      <div className="stat-card">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h3 className="font-semibold text-gray-800">单品销售分析</h3>
          <Select
            value={selectedCategory}
            onChange={(v) => setSelectedCategory(v)}
            style={{ width: 150 }}
          >
            <Option value="all">全部品类</Option>
            <Option value="snack">零食</Option>
            <Option value="daily">日化</Option>
            <Option value="frozen">速冻</Option>
            <Option value="drink">酒水</Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={filteredProducts}
          rowKey="productId"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 800 }}
        />
      </div>
    </div>
  );
}
