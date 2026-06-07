import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
} from 'lucide-react';
import KpiCard from '@/components/KpiCard';
import {
  useStore,
  generateKpiDataFromStore,
  generateSalesDataFromStore,
  generateInventoryAlertsFromStore,
  generateHourlySalesFromStore,
} from '@/store/useStore';
import { CategoryColors, CategoryNames } from '@/types';
import dayjs from 'dayjs';

export default function Dashboard() {
  const batches = useStore((s) => s.batches);
  const salesRecords = useStore((s) => s.salesRecords);
  const products = useStore((s) => s.products);

  const kpiData = useMemo(
    () => generateKpiDataFromStore(batches, salesRecords),
    [batches, salesRecords]
  );

  const salesData = useMemo(
    () => generateSalesDataFromStore(salesRecords, 30),
    [salesRecords]
  );

  const inventoryAlerts = useMemo(
    () => generateInventoryAlertsFromStore(products, batches, salesRecords),
    [products, batches, salesRecords]
  );

  const hourlySales = useMemo(
    () => generateHourlySalesFromStore(salesRecords),
    [salesRecords]
  );

  const salesTrendOption = useMemo(() => {
    const last7Days = salesData.slice(-7);
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
        boundaryGap: false,
        data: last7Days.map((d) => dayjs(d.date).format('MM-DD')),
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280' },
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
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            color: '#FF7A45',
            width: 3,
          },
          itemStyle: {
            color: '#FF7A45',
            borderColor: '#fff',
            borderWidth: 2,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(255, 122, 69, 0.3)' },
                { offset: 1, color: 'rgba(255, 122, 69, 0.05)' },
              ],
            },
          },
          data: last7Days.map((d) => d.totalAmount),
        },
        {
          name: '订单数',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            color: '#1A5D6B',
            width: 3,
          },
          itemStyle: {
            color: '#1A5D6B',
            borderColor: '#fff',
            borderWidth: 2,
          },
          data: last7Days.map((d) => d.orderCount),
        },
      ],
      animationDuration: 1000,
    };
  }, [salesData]);

  const categoryPieOption = useMemo(() => {
    const latestData = salesData[salesData.length - 1];
    if (!latestData) return { tooltip: {} };
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
          name: '品类占比',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.2)',
            },
          },
          data: latestData.categoryBreakdown.map((c) => ({
            value: c.amount,
            name: c.categoryName,
            itemStyle: { color: CategoryColors[c.category] },
          })),
        },
      ],
      animationDuration: 1000,
    };
  }, [salesData]);

  const hourlySalesOption = useMemo(() => {
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        textStyle: { color: '#374151' },
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
        data: hourlySales.map((d) => `${d.hour}:00`),
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280', fontSize: 11 },
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
          data: hourlySales.map((d) => d.sales),
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#FF7A45' },
                { offset: 1, color: '#FFB380' },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
          barWidth: '60%',
        },
      ],
      animationDuration: 800,
    };
  }, [hourlySales]);

  const expiringAlerts = inventoryAlerts
    .filter((a) => a.type === 'expiring')
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">数据概览</h1>
        <p className="text-gray-500 mt-1">欢迎回来，查看今日运营数据</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          title="今日销售额"
          value={kpiData.todaySales}
          icon={DollarSign}
          growth={kpiData.salesGrowth}
          prefix="¥"
          color="orange"
        />
        <KpiCard
          title="今日订单数"
          value={kpiData.todayOrders}
          icon={ShoppingCart}
          growth={kpiData.orderGrowth}
          suffix="单"
          color="teal"
        />
        <KpiCard
          title="库存总量"
          value={kpiData.totalStock}
          icon={Package}
          growth={kpiData.stockGrowth}
          suffix="件"
          color="blue"
        />
        <KpiCard
          title="临期预警"
          value={kpiData.expiringCount}
          icon={AlertTriangle}
          growth={kpiData.expiringGrowth}
          suffix="个"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">近7天销售趋势</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm bg-primary-100 text-primary-600 rounded-lg">
                周
              </button>
              <button className="px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">
                月
              </button>
            </div>
          </div>
          <ReactECharts
            option={salesTrendOption}
            style={{ height: '300px' }}
          />
        </div>

        <div className="stat-card">
          <h3 className="font-semibold text-gray-800 mb-4">今日品类占比</h3>
          <ReactECharts
            option={categoryPieOption}
            style={{ height: '280px' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="stat-card">
          <h3 className="font-semibold text-gray-800 mb-4">分时销售趋势</h3>
          <ReactECharts
            option={hourlySalesOption}
            style={{ height: '250px' }}
          />
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">临期商品预警</h3>
            <button className="text-sm text-primary-600 hover:text-primary-700">
              查看全部
            </button>
          </div>
          <div className="space-y-3">
            {expiringAlerts.length > 0 ? (
              expiringAlerts.map((alert) => (
                <div
                  key={alert.productId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-10 rounded-full ${
                        alert.level === 'danger'
                          ? 'bg-red-500'
                          : 'bg-yellow-500'
                      }`}
                    />
                    <div>
                      <p className="font-medium text-gray-800 text-sm">
                        {alert.productName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {alert.categoryName} · 库存 {alert.stock}件
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-medium ${
                        alert.level === 'danger' ? 'text-red-600' : 'text-yellow-600'
                      }`}
                    >
                      {alert.daysLeft}天后到期
                    </p>
                    <p className="text-xs text-gray-500">
                      ¥{alert.stockValue.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-gray-400">
                <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">暂无临期预警</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
