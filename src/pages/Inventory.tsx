import { useState, useMemo } from 'react';
import { AlertTriangle, Clock, PackageX, Download, Filter } from 'lucide-react';
import { mockInventoryAlerts } from '@/data/mockData';
import { Table, Tag, Button, Select } from 'antd';
import type { TableProps } from 'antd';
import type { InventoryAlert } from '@/types';
import * as XLSX from 'xlsx';

const { Option } = Select;

type AlertType = 'all' | 'expiring' | 'slow_moving' | 'out_of_stock';

export default function Inventory() {
  const [alertType, setAlertType] = useState<AlertType>('all');
  const [alertLevel, setAlertLevel] = useState<string>('all');

  const filteredAlerts = useMemo(() => {
    return mockInventoryAlerts.filter((alert) => {
      if (alertType !== 'all' && alert.type !== alertType) return false;
      if (alertLevel !== 'all' && alert.level !== alertLevel) return false;
      return true;
    });
  }, [alertType, alertLevel]);

  const typeLabels: Record<string, string> = {
    expiring: '临期商品',
    slow_moving: '滞销商品',
    out_of_stock: '缺货预警',
  };

  const columns: TableProps<InventoryAlert>['columns'] = [
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
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: () => (
        <div className="flex gap-2">
          <Button type="link" size="small" className="text-primary-600">
            处理
          </Button>
          <Button type="link" size="small">
            详情
          </Button>
        </div>
      ),
    },
  ];

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

  const stats = useMemo(() => {
    const expiring = mockInventoryAlerts.filter((a) => a.type === 'expiring');
    const slowMoving = mockInventoryAlerts.filter((a) => a.type === 'slow_moving');
    const outOfStock = mockInventoryAlerts.filter((a) => a.type === 'out_of_stock');

    return {
      expiring: {
        count: expiring.length,
        value: expiring.reduce((sum, a) => sum + a.stockValue, 0),
      },
      slowMoving: {
        count: slowMoving.length,
        value: slowMoving.reduce((sum, a) => sum + a.stockValue, 0),
      },
      outOfStock: {
        count: outOfStock.length,
        value: outOfStock.reduce((sum, a) => sum + a.stockValue, 0),
      },
    };
  }, []);

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
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h3 className="font-semibold text-gray-800">预警列表</h3>
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
          columns={columns}
          dataSource={filteredAlerts}
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
