import { useState, useMemo } from 'react';
import { Modal, Form, InputNumber, Select, DatePicker, message } from 'antd';
import { PackagePlus } from 'lucide-react';
import dayjs from 'dayjs';
import { useStore, getProductStock, getProductCost } from '@/store/useStore';

const { Option } = Select;

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function InboundModal({ open, onClose }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const products = useStore((s) => s.products);
  const batches = useStore((s) => s.batches);
  const inboundStock = useStore((s) => s.inboundStock);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const selectedProductId = Form.useWatch('productId', form);

  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null;
    return products.find((p) => p.id === selectedProductId);
  }, [selectedProductId, products]);

  const currentStock = useMemo(() => {
    if (!selectedProductId) return 0;
    return getProductStock(selectedProductId, batches);
  }, [selectedProductId, batches]);

  const currentCost = useMemo(() => {
    if (!selectedProductId) return 0;
    return getProductCost(selectedProductId, batches);
  }, [selectedProductId, batches]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      inboundStock({
        productId: values.productId,
        quantity: values.quantity,
        unitCost: values.unitCost,
        produceDate: values.produceDate.format('YYYY-MM-DD'),
        expireDate: values.expireDate.format('YYYY-MM-DD'),
      });

      message.success('入库成功');
      form.resetFields();
      onClose();
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
          <PackagePlus className="w-5 h-5 text-primary-500" />
          <span>进货入库</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={loading}
      okText="确认入库"
      cancelText="取消"
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
        initialValues={{
          quantity: 10,
        }}
      >
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
            {sortedProducts.map((p) => (
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
              <span className="text-gray-400">售价：</span>
              ¥{selectedProduct.price.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              <span className="text-gray-400">当前库存：</span>
              <span className="font-medium text-gray-800">{currentStock} 件</span>
            </p>
            <p className="text-sm text-gray-600">
              <span className="text-gray-400">加权成本：</span>
              <span className="font-medium text-gray-800">¥{currentCost.toFixed(2)}</span>
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="quantity"
            label="入库数量"
            rules={[
              { required: true, message: '请输入数量' },
              { type: 'number', min: 1, message: '数量必须大于0' },
            ]}
          >
            <InputNumber min={1} style={{ width: '100%' }} size="large" />
          </Form.Item>

          <Form.Item
            name="unitCost"
            label="进价（元）"
            rules={[
              { required: true, message: '请输入进价' },
              { type: 'number', min: 0.01, message: '进价必须大于0' },
            ]}
          >
            <InputNumber min={0.01} step={0.1} precision={2} style={{ width: '100%' }} size="large" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="produceDate"
            label="生产日期"
            rules={[{ required: true, message: '请选择生产日期' }]}
          >
            <DatePicker style={{ width: '100%' }} size="large" />
          </Form.Item>

          <Form.Item
            name="expireDate"
            label="保质期至"
            rules={[
              { required: true, message: '请选择保质期至' },
              {
                validator: (_, value) => {
                  const produceDate = form.getFieldValue('produceDate');
                  if (value && produceDate && dayjs(value).isBefore(produceDate)) {
                    return Promise.reject('保质期不能早于生产日期');
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <DatePicker style={{ width: '100%' }} size="large" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
