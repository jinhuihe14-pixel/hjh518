import { useState, useMemo } from 'react';
import { Modal, Form, Select, InputNumber, Button, Table, message, Tag } from 'antd';
import { ShoppingCart, Plus, Trash2 } from 'lucide-react';
import { useStore, getProductStock } from '@/store/useStore';
import type { ColumnsType } from 'antd/es/table';

const { Option } = Select;

interface SaleItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  stock: number;
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

    const existingIndex = items.findIndex((i) => i.productId === productId);
    if (existingIndex >= 0) {
      const newItems = [...items];
      const newQty = newItems[existingIndex].quantity + quantity;
      if (newQty > stock) {
        message.warning(`库存不足，当前库存 ${stock} 件`);
        return;
      }
      newItems[existingIndex].quantity = newQty;
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
    newItems[index].quantity = value;
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
      message.success(`销售成功！金额 ¥${totalAmount.toFixed(2)}`);
      setItems([]);
      form.resetFields();
      onClose();
    } else {
      message.error(result.message);
    }
  };

  const columns: ColumnsType<SaleItem & { key: string }> = [
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
      width: 100,
      render: (v) => <span>¥{v.toFixed(2)}</span>,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 130,
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
      width: 100,
      render: (_, record) => (
        <span className="font-medium">¥{(record.price * record.quantity).toFixed(2)}</span>
      ),
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
      width={600}
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
              scroll={{ y: 250 }}
            />
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400">
            <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>暂无商品，请添加销售商品</p>
          </div>
        )}

        {items.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <Tag color="blue">{items.length} 种商品</Tag>
              <Tag color="green">
                共 {items.reduce((sum, i) => sum + i.quantity, 0)} 件
              </Tag>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">合计金额</p>
              <p className="text-2xl font-bold text-primary-600">¥{totalAmount.toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
