import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Users, ShoppingBag, Lightbulb, TrendingUp } from 'lucide-react';
import { mockSalesData, mockHourlySales, mockDisplaySuggestions } from '@/data/mockData';
import { CategoryColors } from '@/types';
import dayjs from 'dayjs';

export default function Preference() {
  const timeDistributionOption = useMemo(() => {
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        textStyle: { color: '#374151' },
      },
      legend: {
        data: ['销售额', '订单数'],
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
        data: mockHourlySales.map((d) => `${d.hour}:00`),
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280', fontSize: 11 },
      },
      yAxis: [
        {
          type: 'value',
          name: '销售额',
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#6b7280' },
          splitLine: { lineStyle: { color: '#f3f4f6' } },
        },
        {
          type: 'value',
          name: '订单数',
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#6b7280' },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '销售额',
          type: 'bar',
          data: mockHourlySales.map((d) => d.sales),
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#FF7A45' },
                { offset: 1, color: '#FFB380' },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
          barWidth: '50%',
        },
        {
          name: '订单数',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#1A5D6B', width: 2 },
          itemStyle: { color: '#1A5D6B' },
          data: mockHourlySales.map((d) => d.orders),
        },
      ],
      animationDuration: 1000,
    };
  }, []);

  const categoryPreferenceOption = useMemo(() => {
    const last30Days = mockSalesData.slice(-30);
    const categorySales: Record<string, number> = {};
    const categoryWeekendPreference: Record<string, number> = {};

    last30Days.forEach((day) => {
      const isWeekend = dayjs(day.date).day() === 0 || dayjs(day.date).day() === 6;
      day.categoryBreakdown.forEach((cat) => {
        categorySales[cat.category] = (categorySales[cat.category] || 0) + cat.amount;
        if (isWeekend) {
          categoryWeekendPreference[cat.category] = (categoryWeekendPreference[cat.category] || 0) + cat.amount;
        }
      });
    });

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        textStyle: { color: '#374151' },
      },
      radar: {
        indicator: [
          { name: '零食', max: 150000 },
          { name: '日化', max: 150000 },
          { name: '速冻', max: 150000 },
          { name: '酒水', max: 150000 },
        ],
        shape: 'polygon',
        splitNumber: 4,
        axisName: { color: '#6b7280' },
        splitLine: { lineStyle: { color: '#e5e7eb' } },
        splitArea: { areaStyle: { color: ['#fff', '#f9fafb'] } },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: Object.values(categorySales),
              name: '月度销售额',
              areaStyle: { color: 'rgba(255, 122, 69, 0.3)' },
              lineStyle: { color: '#FF7A45', width: 2 },
              itemStyle: { color: '#FF7A45' },
            },
          ],
        },
      ],
      animationDuration: 1000,
    };
  }, []);

  const weekendWeekdayOption = useMemo(() => {
    const last30Days = mockSalesData.slice(-30);
    const weekdayData: Record<string, number> = { snack: 0, daily: 0, frozen: 0, drink: 0 };
    const weekendData: Record<string, number> = { snack: 0, daily: 0, frozen: 0, drink: 0 };

    last30Days.forEach((day) => {
      const isWeekend = dayjs(day.date).day() === 0 || dayjs(day.date).day() === 6;
      day.categoryBreakdown.forEach((cat) => {
        if (isWeekend) {
          weekendData[cat.category] += cat.amount;
        } else {
          weekdayData[cat.category] += cat.amount;
        }
      });
    });

    const categories = ['snack', 'daily', 'frozen', 'drink'];
    const categoryNames = ['零食', '日化', '速冻', '酒水'];

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        textStyle: { color: '#374151' },
      },
      legend: {
        data: ['工作日', '周末'],
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
        data: categoryNames,
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
          name: '工作日',
          type: 'bar',
          data: categories.map((c) => weekdayData[c]),
          itemStyle: { color: '#1A5D6B', borderRadius: [4, 4, 0, 0] },
          barWidth: '30%',
        },
        {
          name: '周末',
          type: 'bar',
          data: categories.map((c) => weekendData[c]),
          itemStyle: { color: '#FF7A45', borderRadius: [4, 4, 0, 0] },
          barWidth: '30%',
        },
      ],
      animationDuration: 1000,
    };
  }, []);

  const customerInsights = [
    {
      icon: Users,
      title: '周边居民消费画像',
      items: [
        '主要客群：25-45岁家庭主妇（65%）',
        '午高峰：11:00-13:00（午餐采购）',
        '晚高峰：17:00-20:00（下班顺路）',
        '周末消费：家庭集中采购，客单价高',
      ],
    },
    {
      icon: ShoppingBag,
      title: '热门品类时段偏好',
      items: [
        '零食：下午时段（14:00-16:00）热销',
        '日化：周末销量占比40%',
        '速冻：工作日晚餐前采购较多',
        '酒水：周五、周六晚高峰',
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">消费偏好分析</h1>
        <p className="text-gray-500 mt-1">周边居民消费习惯与陈列优化建议</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {customerInsights.map((insight, index) => (
          <div key={index} className="stat-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <insight.icon className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-800">{insight.title}</h3>
            </div>
            <ul className="space-y-2">
              {insight.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-1.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="stat-card">
        <h3 className="font-semibold text-gray-800 mb-4">24小时消费时段分布</h3>
        <ReactECharts option={timeDistributionOption} style={{ height: '300px' }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="stat-card">
          <h3 className="font-semibold text-gray-800 mb-4">品类消费偏好雷达</h3>
          <ReactECharts option={categoryPreferenceOption} style={{ height: '320px' }} />
        </div>

        <div className="stat-card">
          <h3 className="font-semibold text-gray-800 mb-4">工作日vs周末品类对比</h3>
          <ReactECharts option={weekendWeekdayOption} style={{ height: '320px' }} />
        </div>
      </div>

      <div className="stat-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-secondary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">货架陈列优化建议</h3>
            <p className="text-sm text-gray-500">基于销售数据的智能陈列推荐</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockDisplaySuggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-4 bg-gradient-to-br from-primary-50 to-orange-50 rounded-xl border border-primary-100"
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-primary-600" />
                <span className="font-medium text-primary-700">{suggestion.position}</span>
              </div>
              <ul className="space-y-2">
                {suggestion.products.map((product, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium text-gray-700">{product.name}</span>
                    <span className="text-gray-500 ml-2">— {product.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
