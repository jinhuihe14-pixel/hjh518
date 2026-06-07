import { useState, useMemo } from 'react';
import { Modal, Form, Select, InputNumber, Radio, message, Tag } from 'antd';
import { AlertTriangle } from 'lucide-react';
import { useStore, getProductStock } from '@/store/useStore';
import type { InventoryBatch } from '@/types';

const { Option } = Select;

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function LossModal({ open, onClose }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const products = useStore((s) => s.products);
  const batches = useStore((s) => s.batches);
  const lossStock = useStore((s) => s.lossStock);

  const selectedProductId = Form.useWatch('productId', form);
  const lossMode = Form.useWatch('lossMode', form) || 'product';

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null;
    return products.find((p) => p.id === selectedProductId);
  }, [selectedProductId, products]);

  const productBatches = useMemo(() => {
    if (!selectedProductId) return [];
    return batches
      .filter((b) => b.productId === selectedProductId && b.remaining > 0)
      .sort((a, b) => a.expireDate.localeCompare(b.expireDate));
  }, [selectedProductId, batches]);

  const currentStock = useMemo(() => {
    if (!selectedProductId) return 0;
    return getProductStock(selectedProductId, batches);
  }, [selectedProductId, batches]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const result = lossStock({
        productId: values.productId,
        batchId: lossMode === 'batch' ? values.batchId : undefined,
        quantity: values.quantity,
        reason: values.reason,
      });

      if (result.success) {
        message.success('报损成功');
        form.resetFields();
        onClose();
      } else {
        message.error(result.message);
      }
    } catch {
      // 验证失败
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span>商品报损</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={loading}
      okText="确认报损"
      cancelText="取消"
      width={500}
      okButtonProps={{ danger: true }}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Form.Item
          name="productId"
          label="选择商品"
          rules={[{ required: true, message: '请选择商品' }]}
        >
          <Select
            showSearch
            placeholder="搜索商品名称或编号"
            optionFilterProp="children"
            size="large"
          >
            {sortedProducts
              .filter((p) => getProductStock(p.id, batches) > 0)
              .map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </Option>
              ))}
          </Select>
        </Form.Item>

        {selectedProduct && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg space-y-1">
            <p className="text-sm text-gray-600">
              <span className="text-gray-400">品类：</span>
              {selectedProduct.categoryName}
            </p>
            <p className="text-sm text-gray-600">
              <span className="text-gray-400">当前库存：</span>
              <span className="font-medium text-gray-800">{currentStock} 件</span>
            </p>
            <p className="text-sm text-gray-600">
              <span className="text-gray-400">批次数量：</span>
              <span className="font-medium text-gray-800">{productBatches.length} 个批次</span>
            </p>
          </div>
        )}

        <Form.Item name="lossMode" label="报损方式" initialValue="product">
          <Radio.Group>
            <Radio value="product">按商品报损（FIFO扣减）</Radio>
            <Radio value="batch">指定批次报损</Radio>
          </Radio.Group>
        </Form.Item>

        {lossMode === 'batch' && productBatches.length > 0 && (
          <Form.Item
            name="batchId"
            label="选择批次"
            rules={[{ required: true, message: '请选择批次' }]}
          >
            <Select size="large">
              {productBatches.map((b: InventoryBatch) => (
                <Option key={b.id} value={b.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{b.id}</span>
                    <div className="flex items-center gap-2">
                      <Tag color="blue">{b.remaining}件</Tag>
                      <span className="text-gray-400 text-xs">到期 {b.expireDate}</span>
                      <span className="text-gray-400 text-xs">¥{b.unitCost}</span>
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        <Form.Item
          name="quantity"
          label="报损数量"
          rules={[
            { required: true, message: '请输入数量' },
            { type: 'number', min: 1, message: '数量必须大于0' },
          ]}
          initialValue={1}
        >
          <InputNumber min={1} style={{ width: '100%' }} size="large" />
        </Form.Item>

        <Form.Item
          name="reason"
          label="损耗原因"
          rules={[{ required: true, message: '请选择原因' }]}
          initialValue="expired"
        >
          <Select size="large">
            <Option value="expired">临期过期</Option>
            <Option value="damaged">破损损耗</Option>
            <Option value="other">其他原因</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}
