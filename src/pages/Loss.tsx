import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { TrendingDown, AlertTriangle, DollarSign, Package } from 'lucide-react';
import { mockLossRecords } from '@/data/mockData';
import { Table, Tag, Select, DatePicker } from 'antd';
import type { TableProps } from 'antd';
import type { LossRecord } from '@/types';
import dayjs from 'dayjs';

const { Option } = Select;

export default function Loss() {
  const [selectedReason, setSelectedReason] = useState<string>('all');

  const lossTrendOption = useMemo(() => {
    const monthlyLoss: Record<string, number> = {};
    const reasonCounts: Record<string, number> = { expired: 0, damaged: 0, other: 0 };

    mockLossRecords.forEach((record) => {
      const month = dayjs(record.date).format('YYYY-MM');
      monthlyLoss[month] = (monthlyLoss[month] || 0) + record.totalCost;
      reasonCounts[record.reason] = (reasonCounts[record.reason] || 0) + 1;
    });

    const months = Object.keys(monthlyLoss).sort();
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
        data: months.map((m) => m.slice(5)),
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
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { color: '#EF4444', width: 3 },
          itemStyle: { color: '#EF4444', borderColor: '#fff', borderWidth: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
                { offset: 1, color: 'rgba(239, 68, 68, 0.05)' },
              ],
            },
          },
          data: months.map((m) => monthlyLoss[m]),
        },
      ],
      animationDuration: 1000,
    };
  }, []);

  const lossReasonPieOption = useMemo(() => {
    const reasonStats: Record<string, number> = {};
    mockLossRecords.forEach((r) => {
      reasonStats[r.reason] = (reasonStats[r.reason] || 0) + r.totalCost;
    });

    const reasonNames: Record<string, string> = {
      expired: '临期过期',
      damaged: '破损损耗',
      other: '其他原因',
    };

    const colors = {
      expired: '#FF7A45',
      damaged: '#6B7280',
      other: '#9CA3AF',
    };

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        textStyle: { color: '#374151' },
        formatter: '{b}: ¥{c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['35%', '50%'],
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
          },
          data: Object.keys(reasonStats).map((key) => ({
            value: reasonStats[key],
            name: reasonNames[key],
            itemStyle: { color: colors[key as keyof typeof colors] },
          })),
        },
      ],
      animationDuration: 1000,
    };
  }, []);

  const categoryLossOption = useMemo(() => {
    const categoryLoss: Record<string, number> = {};
    mockLossRecords.forEach((r) => {
      categoryLoss[r.category] = (categoryLoss[r.category] || 0) + r.totalCost;
    });

    const categories = Object.keys(categoryLoss);
    const categoryNames: Record<string, string> = {
      snack: '零食',
      daily: '日化',
      frozen: '速冻',
      drink: '酒水',
    };

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
        data: categories.map((c) => categoryNames[c]),
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
            value: categoryLoss[c],
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: '#EF4444' },
                  { offset: 1, color: '#FCA5A5' },
                ],
              },
              borderRadius: [8, 8, 0, 0],
            },
          })),
          barWidth: '50%',
        },
      ],
      animationDuration: 1000,
    };
  }, []);

  const filteredRecords = useMemo(() => {
    if (selectedReason === 'all') return mockLossRecords;
    return mockLossRecords.filter((r) => r.reason === selectedReason);
  }, [selectedReason]);

  const columns: TableProps<LossRecord>['columns'] = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 110,
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
      title: '损耗原因',
      dataIndex: 'reason',
      key: 'reason',
      width: 100,
      render: (reason) => {
        const reasonLabels: Record<string, { label: string; color: string }> = {
          expired: { label: '临期过期', color: 'orange' },
          damaged: { label: '破损损耗', color: 'red' },
          other: { label: '其他原因', color: 'default' },
        };
        return (
          <Tag color={reasonLabels[reason].color} className="m-0">
            {reasonLabels[reason].label}
          </Tag>
        );
      },
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      render: (v) => `${v}件`,
    },
    {
      title: '单价成本',
      dataIndex: 'unitCost',
      key: 'unitCost',
      width: 100,
      render: (v) => `¥${v.toFixed(2)}`,
    },
    {
      title: '损耗金额',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 110,
      render: (v) => <span className="font-medium text-red-600">¥{v.toFixed(2)}</span>,
      sorter: (a, b) => a.totalCost - b.totalCost,
    },
  ];

  const totalLoss = mockLossRecords.reduce((sum, r) => sum + r.totalCost, 0);
  const totalQuantity = mockLossRecords.reduce((sum, r) => sum + r.quantity, 0);
  const expiredCount = mockLossRecords.filter((r) => r.reason === 'expired').length;

  const suggestions = [
    '零食区临期商品较多，建议缩短订货周期',
    '酒水破损率较高，建议优化仓储堆放方式',
    '速冻商品周转较慢，建议减少安全库存',
    '日化类保质期较长，可适当增加库存',
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">损耗管理</h1>
          <p className="text-gray-500 mt-1">临期商品损耗统计与成本分析</p>
        </div>
        <div className="flex items-center gap-3">
          <DatePicker.RangePicker
            defaultValue={[dayjs().subtract(6, 'month'), dayjs()]}
            size="middle"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="stat-card border-l-4 border-l-red-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">累计损耗金额</p>
              <p className="text-2xl font-bold text-red-600">¥{totalLoss.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="stat-card border-l-4 border-l-orange-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">损耗商品数量</p>
              <p className="text-2xl font-bold text-gray-800">{totalQuantity}件</p>
            </div>
          </div>
        </div>

        <div className="stat-card border-l-4 border-l-yellow-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">临期过期占比</p>
              <p className="text-2xl font-bold text-gray-800">
                {((expiredCount / mockLossRecords.length) * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card border-l-4 border-l-purple-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">月均损耗</p>
              <p className="text-2xl font-bold text-gray-800">¥{(totalLoss / 6).toFixed(0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="stat-card">
          <h3 className="font-semibold text-gray-800 mb-4">月度损耗趋势</h3>
          <ReactECharts option={lossTrendOption} style={{ height: '280px' }} />
        </div>

        <div className="stat-card">
          <h3 className="font-semibold text-gray-800 mb-4">损耗原因分布</h3>
          <ReactECharts option={lossReasonPieOption} style={{ height: '280px' }} />
        </div>
      </div>

      <div className="stat-card">
        <h3 className="font-semibold text-gray-800 mb-4">各品类损耗对比</h3>
        <ReactECharts option={categoryLossOption} style={{ height: '280px' }} />
      </div>

      <div className="stat-card bg-gradient-to-br from-red-50 to-orange-50 border-red-100">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h3 className="font-semibold text-gray-800">优化建议</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="flex items-start gap-2 p-3 bg-white rounded-lg">
              <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                {index + 1}
              </span>
              <p className="text-sm text-gray-700">{suggestion}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="stat-card">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h3 className="font-semibold text-gray-800">损耗明细</h3>
          <Select
            value={selectedReason}
            onChange={(v) => setSelectedReason(v)}
            style={{ width: 130 }}
          >
            <Option value="all">全部原因</Option>
            <Option value="expired">临期过期</Option>
            <Option value="damaged">破损损耗</Option>
            <Option value="other">其他原因</Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={filteredRecords}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 700 }}
        />
      </div>
    </div>
  );
}
