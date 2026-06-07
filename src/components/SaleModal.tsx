import { useState, useMemo } from 'react';
import { Modal, Form, Select, InputNumber, Button, Table, message, Tag } from 'antd';
import { ShoppingCart, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useStore, getProductStock, calculateFifoDeduction } from '@/store/useStore';
import type { ColumnsType } from 'antd/es/table';
import type { BatchDeductionItem } from '@/types';
import dayjs from 'dayjs';

const { Option } = Select;

interface SaleItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  stock: number;
  deductions: BatchDeductionItem[];
  costTotal: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SaleModal({ open, onClose }: Props) {
  const [form] = Form.useForm();
  const [items, setItems] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const products = useStore((s) => s.products);
  const batches = useStore((s) => s.batches);
  const sellStock = useStore((s) => s.sellStock);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const totalCost = useMemo(() => {
    return items.reduce((sum, item) => sum + item.costTotal, 0);
  }, [items]);

  const totalProfit = useMemo(() => {
    return totalAmount - totalCost;
  }, [totalAmount, totalCost]);

  const marginRate = useMemo(() => {
    if (totalAmount === 0) return 0;
    return (totalProfit / totalAmount) * 100;
  }, [totalAmount, totalProfit]);

  const handleAddItem = () => {
    const productId = form.getFieldValue('productId');
    const quantity = form.getFieldValue('quantity') || 1;

    if (!productId) {
      message.warning('请选择商品');
      return;
    }

    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const stock = getProductStock(productId, batches);
    if (stock < quantity) {
      message.warning(`库存不足，当前库存 ${stock} 件`);
      return;
    }

    const fifoResult = calculateFifoDeduction(productId, quantity, batches);
    if (!fifoResult.success) {
      message.warning(fifoResult.message || '库存不足');
      return;
    }

    const existingIndex = items.findIndex((i) => i.productId === productId);
    if (existingIndex >= 0) {
      const newItems = [...items];
      const newQty = newItems[existingIndex].quantity + quantity;
      if (newQty > stock) {
        message.warning(`库存不足，当前库存 ${stock} 件`);
        return;
      }
      const newFifoResult = calculateFifoDeduction(productId, newQty, batches);
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        quantity: newQty,
        deductions: newFifoResult.deductions,
        costTotal: newFifoResult.totalCost,
      };
      setItems(newItems);
    } else {
      setItems([
        ...items,
        {
          productId,
          productName: product.name,
          price: product.price,
          quantity,
          stock,
          deductions: fifoResult.deductions,
          costTotal: fifoResult.totalCost,
        },
      ]);
    }

    form.setFieldsValue({ productId: undefined, quantity: 1 });
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index: number, value: number) => {
    const newItems = [...items];
    const item = newItems[index];
    const newQty = value || 1;

    if (newQty > item.stock) {
      message.warning(`库存不足，当前库存 ${item.stock} 件`);
      return;
    }

    const fifoResult = calculateFifoDeduction(item.productId, newQty, batches);
    newItems[index] = {
      ...item,
      quantity: newQty,
      deductions: fifoResult.deductions,
      costTotal: fifoResult.totalCost,
    };
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      message.warning('请至少添加一个商品');
      return;
    }

    for (const item of items) {
      if (item.quantity > item.stock) {
        message.warning(`商品「${item.productName}」库存不足`);
        return;
      }
    }

    setLoading(true);

    const result = sellStock({
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.price,
      })),
    });

    setLoading(false);

    if (result.success) {
      const profit = result.record?.totalProfit || 0;
      const margin = result.record && result.record.totalAmount > 0
        ? ((result.record.totalProfit / result.record.totalAmount) * 100).toFixed(1)
        : '0';
      message.success(
        `销售成功！金额 ¥${totalAmount.toFixed(2)}，毛利 ¥${profit.toFixed(2)}（${margin}%）`
      );
      setItems([]);
      form.resetFields();
      onClose();
    } else {
      message.error(result.message);
    }
  };

  const expandedRowRender = (record: SaleItem) => {
    const columns: ColumnsType<BatchDeductionItem & { key: string }> = [
      {
        title: '批次号',
        dataIndex: 'batchId',
        key: 'batchId',
        width: 100,
        render: (v) => <span className="text-xs font-mono text-gray-600">{v}</span>,
      },
      {
        title: '到期日',
        dataIndex: 'expireDate',
        key: 'expireDate',
        width: 130,
        render: (date: string) => {
          const daysLeft = dayjs(date).diff(dayjs(), 'day');
          return (
            <div>
              <span className="text-sm">{date}</span>
              <span
                className={`ml-2 text-xs ${
                  daysLeft <= 7
                    ? 'text-red-500'
                    : daysLeft <= 30
                    ? 'text-yellow-600'
                    : 'text-gray-400'
                }`}
              >
                {daysLeft > 0 ? `${daysLeft}天后到期` : '已过期'}
              </span>
            </div>
          );
        },
      },
      {
        title: '批次进价',
        dataIndex: 'unitCost',
        key: 'unitCost',
        width: 100,
        render: (v) => <span className="text-sm">¥{v.toFixed(2)}</span>,
      },
      {
        title: '本批扣减',
        dataIndex: 'quantity',
        key: 'quantity',
        width: 100,
        render: (v) => <span className="text-sm font-medium">{v} 件</span>,
      },
      {
        title: '本批成本',
        dataIndex: 'costTotal',
        key: 'costTotal',
        width: 100,
        render: (v) => <span className="text-sm text-gray-600">¥{v.toFixed(2)}</span>,
      },
    ];

    const data = record.deductions.map((d, i) => ({
      ...d,
      key: `${d.batchId}-${i}`,
    }));

    return (
      <div className="bg-gray-50 -mx-4 -my-2 px-4 py-3 rounded">
        <p className="text-xs text-gray-500 mb-2">
          按最早到期优先（FIFO）扣减，共 {record.deductions.length} 个批次
        </p>
        <Table
          columns={columns}
          dataSource={data}
          pagination={false}
          size="small"
          showHeader={true}
        />
      </div>
    );
  };

  const columns: ColumnsType<SaleItem> = [
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
      render: (text, record) => (
        <div>
          <p className="font-medium text-gray-800">{text}</p>
          <p className="text-xs text-gray-400">库存 {record.stock} 件</p>
        </div>
      ),
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      width: 90,
      render: (v) => <span>¥{v.toFixed(2)}</span>,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (_, record, index) => (
        <InputNumber
          min={1}
          max={record.stock}
          value={record.quantity}
          onChange={(v) => handleQuantityChange(index, v || 1)}
          size="small"
          style={{ width: 80 }}
        />
      ),
    },
    {
      title: '小计',
      key: 'subtotal',
      width: 90,
      render: (_, record) => (
        <span className="font-medium">¥{(record.price * record.quantity).toFixed(2)}</span>
      ),
    },
    {
      title: '成本',
      key: 'cost',
      width: 90,
      render: (_, record) => (
        <span className="text-gray-600">¥{record.costTotal.toFixed(2)}</span>
      ),
    },
    {
      title: '毛利',
      key: 'profit',
      width: 90,
      render: (_, record) => {
        const subtotal = record.price * record.quantity;
        const profit = subtotal - record.costTotal;
        return <span className="text-green-600">¥{profit.toFixed(2)}</span>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      render: (_, __, index) => (
        <Button
          type="text"
          danger
          icon={<Trash2 size={14} />}
          onClick={() => handleRemoveItem(index)}
        />
      ),
    },
  ];

  const tableData = items.map((item, index) => ({
    ...item,
    key: `${item.productId}-${index}`,
  }));

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary-500" />
          <span>销售开单</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText={`确认销售（¥${totalAmount.toFixed(2)}）`}
      cancelText="取消"
      width={760}
    >
      <div className="mt-4 space-y-4">
        <div className="flex gap-3 items-end">
          <Form form={form} layout="inline" className="flex-1">
            <Form.Item name="productId" className="flex-1" style={{ minWidth: 200 }}>
              <Select
                showSearch
                placeholder="搜索商品"
                optionFilterProp="children"
                size="large"
                style={{ width: '100%' }}
              >
                {sortedProducts
                  .filter((p) => getProductStock(p.id, batches) > 0)
                  .map((p) => (
                    <Option key={p.id} value={p.id}>
                      {p.name} - ¥{p.price.toFixed(2)}
                    </Option>
                  ))}
              </Select>
            </Form.Item>
            <Form.Item name="quantity" initialValue={1}>
              <InputNumber min={1} size="large" style={{ width: 90 }} />
            </Form.Item>
          </Form>
          <Button type="primary" icon={<Plus size={16} />} onClick={handleAddItem} size="large">
            添加
          </Button>
        </div>

        {items.length > 0 ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <Table
              columns={columns}
              dataSource={tableData}
              pagination={false}
              size="small"
              scroll={{ y: 280 }}
              expandable={{
                expandedRowRender,
                expandIcon: ({ expanded, onExpand, record }) =>
                  record.deductions.length > 0 ? (
                    <Button
                      type="text"
                      size="small"
                      className="p-0 h-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        onExpand(record, e);
                      }}
                    >
                      {expanded ? (
                        <ChevronDown size={14} className="text-gray-400" />
                      ) : (
                        <ChevronRight size={14} className="text-gray-400" />
                      )}
                    </Button>
                  ) : null,
                defaultExpandAllRows: false,
              }}
            />
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400">
            <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>暂无商品，请添加销售商品</p>
          </div>
        )}

        {items.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Tag color="blue">{items.length} 种商品</Tag>
                <Tag color="green">
                  共 {items.reduce((sum, i) => sum + i.quantity, 0)} 件
                </Tag>
              </div>
              <div className="text-right space-y-1">
                <div className="flex items-center gap-6">
                  <div className="text-sm">
                    <span className="text-gray-500">成本合计：</span>
                    <span className="text-gray-700 font-medium">
                      ¥{totalCost.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">毛利：</span>
                    <span className="text-green-600 font-medium">
                      ¥{totalProfit.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">毛利率：</span>
                    <span
                      className={`font-medium ${
                        marginRate > 40
                          ? 'text-green-600'
                          : marginRate > 20
                          ? 'text-primary-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {marginRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <span className="text-sm text-gray-500">合计金额</span>
                  <span className="text-2xl font-bold text-primary-600">
                    ¥{totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <ChevronRight size={12} />
              点击行首箭头可查看批次扣减明细（按最早到期优先）
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
