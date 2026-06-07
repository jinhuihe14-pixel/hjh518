import { useState, useMemo } from 'react';
import { AlertTriangle, Clock, PackageX, Download, Filter, Package } from 'lucide-react';
import { Table, Tag, Button, Select, Tabs } from 'antd';
import type { TableProps } from 'antd';
import type { InventoryAlert, InventoryBatch } from '@/types';
import * as XLSX from 'xlsx';
import {
  useStore,
  generateInventoryAlertsFromStore,
  getProductStock,
  getProductCost,
  getProductExpireDate,
  getTotalStockValue,
} from '@/store/useStore';

const { Option } = Select;

type AlertType = 'all' | 'expiring' | 'slow_moving' | 'out_of_stock';

export default function Inventory() {
  const [alertType, setAlertType] = useState<AlertType>('all');
  const [alertLevel, setAlertLevel] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('alerts');

  const products = useStore((s) => s.products);
  const batches = useStore((s) => s.batches);
  const salesRecords = useStore((s) => s.salesRecords);

  const inventoryAlerts = useMemo(
    () => generateInventoryAlertsFromStore(products, batches, salesRecords),
    [products, batches, salesRecords]
  );

  const filteredAlerts = useMemo(() => {
    return inventoryAlerts.filter((alert) => {
      if (alertType !== 'all' && alert.type !== alertType) return false;
      if (alertLevel !== 'all' && alert.level !== alertLevel) return false;
      return true;
    });
  }, [inventoryAlerts, alertType, alertLevel]);

  const typeLabels: Record<string, string> = {
    expiring: '临期商品',
    slow_moving: '滞销商品',
    out_of_stock: '缺货预警',
  };

  const alertColumns: TableProps<InventoryAlert>['columns'] = [
    {
      title: '商品编号',
      dataIndex: 'productId',
      key: 'productId',
      width: 100,
    },
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
      render: (text) => <span className="font-medium text-gray-800">{text}</span>,
    },
    {
      title: '品类',
      dataIndex: 'categoryName',
      key: 'categoryName',
      width: 100,
      render: (text) => (
        <Tag color="blue" className="m-0">
          {text}
        </Tag>
      ),
    },
    {
      title: '预警类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => {
        const colors: Record<string, string> = {
          expiring: 'orange',
          slow_moving: 'purple',
          out_of_stock: 'red',
        };
        return (
          <Tag color={colors[type]} className="m-0">
            {typeLabels[type]}
          </Tag>
        );
      },
    },
    {
      title: '详情',
      key: 'detail',
      width: 120,
      render: (_, record) => {
        if (record.type === 'expiring') {
          return (
            <span className={record.level === 'danger' ? 'text-red-600 font-medium' : 'text-yellow-600'}>
              {record.daysLeft}天后到期
            </span>
          );
        }
        if (record.type === 'slow_moving') {
          return <span className="text-purple-600">周转缓慢</span>;
        }
        return <span className="text-red-600">库存不足</span>;
      },
    },
    {
      title: '当前库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
      render: (stock) => <span>{stock}件</span>,
    },
    {
      title: '库存价值',
      dataIndex: 'stockValue',
      key: 'stockValue',
      width: 120,
      render: (value) => <span className="font-medium">¥{value.toFixed(2)}</span>,
    },
  ];

  const batchColumns: TableProps<InventoryBatch>['columns'] = [
    {
      title: '批次编号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
      render: (text) => <span className="font-medium text-gray-800">{text}</span>,
    },
    {
      title: '品类',
      dataIndex: 'categoryName',
      key: 'categoryName',
      width: 80,
    },
    {
      title: '入库数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (v) => `${v}件`,
    },
    {
      title: '剩余库存',
      dataIndex: 'remaining',
      key: 'remaining',
      width: 100,
      render: (v, record) => {
        const ratio = record.quantity > 0 ? (v / record.quantity) * 100 : 0;
        return (
          <div className="flex items-center gap-2">
            <span className={v === 0 ? 'text-gray-400' : 'text-gray-800 font-medium'}>{v}件</span>
            <span className="text-xs text-gray-400">({ratio.toFixed(0)}%)</span>
          </div>
        );
      },
    },
    {
      title: '进价',
      dataIndex: 'unitCost',
      key: 'unitCost',
      width: 90,
      render: (v) => `¥${v.toFixed(2)}`,
    },
    {
      title: '库存价值',
      key: 'stockValue',
      width: 110,
      render: (_, record) => (
        <span className="font-medium">¥{(record.remaining * record.unitCost).toFixed(2)}</span>
      ),
    },
    {
      title: '生产日期',
      dataIndex: 'produceDate',
      key: 'produceDate',
      width: 110,
    },
    {
      title: '到期日期',
      dataIndex: 'expireDate',
      key: 'expireDate',
      width: 110,
      render: (date) => {
        const daysLeft = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return (
          <div>
            <p>{date}</p>
            <p className={`text-xs ${daysLeft <= 7 ? 'text-red-500' : daysLeft <= 30 ? 'text-yellow-500' : 'text-gray-400'}`}>
              {daysLeft > 0 ? `${daysLeft}天后到期` : '已过期'}
            </p>
          </div>
        );
      },
    },
    {
      title: '入库日期',
      dataIndex: 'inboundDate',
      key: 'inboundDate',
      width: 110,
    },
  ];

  const sortedBatches = useMemo(() => {
    return [...batches].sort((a, b) => b.inboundDate.localeCompare(a.inboundDate));
  }, [batches]);

  const stats = useMemo(() => {
    const expiring = inventoryAlerts.filter((a) => a.type === 'expiring');
    const slowMoving = inventoryAlerts.filter((a) => a.type === 'slow_moving');
    const outOfStock = inventoryAlerts.filter((a) => a.type === 'out_of_stock');

    return {
      expiring: {
        count: new Set(expiring.map((e) => e.productId)).size,
        value: expiring.reduce((sum, a) => sum + a.stockValue, 0),
      },
      slowMoving: {
        count: new Set(slowMoving.map((e) => e.productId)).size,
        value: slowMoving.reduce((sum, a) => sum + a.stockValue, 0),
      },
      outOfStock: {
        count: new Set(outOfStock.map((e) => e.productId)).size,
        value: outOfStock.reduce((sum, a) => sum + a.stockValue, 0),
      },
    };
  }, [inventoryAlerts]);

  const totalStockValue = useMemo(() => getTotalStockValue(batches), [batches]);
  const totalStockQty = useMemo(
    () => batches.reduce((sum, b) => sum + b.remaining, 0),
    [batches]
  );

  const handleExport = () => {
    const exportData = filteredAlerts.map((alert) => ({
      商品编号: alert.productId,
      商品名称: alert.productName,
      品类: alert.categoryName,
      预警类型: typeLabels[alert.type],
      详情: alert.type === 'expiring' ? `${alert.daysLeft}天后到期` :
            alert.type === 'slow_moving' ? '周转缓慢' : '库存不足',
      当前库存: alert.stock,
      库存价值: alert.stockValue.toFixed(2),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '库存预警');
    XLSX.writeFile(wb, '库存预警列表.xlsx');
  };

  const tabItems = [
    {
      key: 'alerts',
      label: (
        <span className="flex items-center gap-2">
          <AlertTriangle size={16} />
          预警清单
        </span>
      ),
    },
    {
      key: 'batches',
      label: (
        <span className="flex items-center gap-2">
          <Package size={16} />
          批次管理
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">库存预警</h1>
          <p className="text-gray-500 mt-1">临期、滞销商品监控与管理</p>
        </div>
        <Button
          type="primary"
          icon={<Download size={16} />}
          onClick={handleExport}
          className="bg-primary-500 hover:bg-primary-600"
        >
          导出Excel
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="stat-card border-l-4 border-l-orange-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">临期商品</p>
              <p className="text-2xl font-bold text-gray-800">{stats.expiring.count}个</p>
              <p className="text-sm text-orange-600">价值 ¥{stats.expiring.value.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="stat-card border-l-4 border-l-purple-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <PackageX className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">滞销商品</p>
              <p className="text-2xl font-bold text-gray-800">{stats.slowMoving.count}个</p>
              <p className="text-sm text-purple-600">价值 ¥{stats.slowMoving.value.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="stat-card border-l-4 border-l-red-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">缺货预警</p>
              <p className="text-2xl font-bold text-gray-800">{stats.outOfStock.count}个</p>
              <p className="text-sm text-red-600">建议尽快补货</p>
            </div>
          </div>
        </div>
      </div>

      <div className="stat-card">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          className="mb-0"
        />

        {activeTab === 'alerts' && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-400" />
                  <Select
                    value={alertType}
                    onChange={(v) => setAlertType(v)}
                    style={{ width: 130 }}
                    size="middle"
                  >
                    <Option value="all">全部类型</Option>
                    <Option value="expiring">临期商品</Option>
                    <Option value="slow_moving">滞销商品</Option>
                    <Option value="out_of_stock">缺货预警</Option>
                  </Select>
                </div>
                <Select
                  value={alertLevel}
                  onChange={(v) => setAlertLevel(v)}
                  style={{ width: 120 }}
                  size="middle"
                >
                  <Option value="all">全部级别</Option>
                  <Option value="warning">警告</Option>
                  <Option value="danger">危险</Option>
                </Select>
              </div>
            </div>

            <Table
              columns={alertColumns}
              dataSource={filteredAlerts}
              rowKey={(record) => `${record.productId}-${record.type}`}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
              scroll={{ x: 800 }}
            />
          </>
        )}

        {activeTab === 'batches' && (
          <>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg flex items-center gap-6">
              <div>
                <span className="text-sm text-gray-500">总库存数量：</span>
                <span className="font-semibold text-gray-800">{totalStockQty} 件</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">总库存价值：</span>
                <span className="font-semibold text-primary-600">¥{totalStockValue.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">批次总数：</span>
                <span className="font-semibold text-gray-800">{batches.length} 个</span>
              </div>
            </div>

            <Table
              columns={batchColumns}
              dataSource={sortedBatches}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
              scroll={{ x: 1000 }}
            />
          </>
        )}
      </div>
    </div>
  );
}
