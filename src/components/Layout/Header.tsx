import { useState } from 'react';
import { Bell, User, Calendar, PackagePlus, ShoppingCart, AlertTriangle, RotateCcw } from 'lucide-react';
import { Button, Dropdown, Modal, message } from 'antd';
import dayjs from 'dayjs';
import InboundModal from '@/components/InboundModal';
import SaleModal from '@/components/SaleModal';
import LossModal from '@/components/LossModal';
import { useStore } from '@/store/useStore';

export default function Header() {
  const [inboundOpen, setInboundOpen] = useState(false);
  const [saleOpen, setSaleOpen] = useState(false);
  const [lossOpen, setLossOpen] = useState(false);
  const resetData = useStore((s) => s.resetData);

  const handleReset = () => {
    Modal.confirm({
      title: '确认恢复初始数据？',
      content: '所有业务数据将被重置为初始演示状态，此操作不可撤销。',
      okText: '确认重置',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        resetData();
        message.success('已恢复初始演示数据');
      },
    });
  };

  const toolsMenu = {
    items: [
      {
        key: 'reset',
        icon: <RotateCcw size={14} />,
        label: '恢复初始演示数据',
        onClick: handleReset,
      },
    ],
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">
              {dayjs().format('YYYY年MM月DD日')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="primary"
            icon={<PackagePlus size={16} />}
            onClick={() => setInboundOpen(true)}
            className="bg-green-500 hover:bg-green-600"
          >
            进货入库
          </Button>
          <Button
            type="primary"
            icon={<ShoppingCart size={16} />}
            onClick={() => setSaleOpen(true)}
          >
            销售开单
          </Button>
          <Button
            danger
            icon={<AlertTriangle size={16} />}
            onClick={() => setLossOpen(true)}
          >
            商品报损
          </Button>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <Dropdown menu={toolsMenu} placement="bottomRight">
            <button className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </Dropdown>
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-700">管理员</p>
              <p className="text-xs text-gray-500">超市老板</p>
            </div>
          </div>
        </div>
      </header>

      <InboundModal open={inboundOpen} onClose={() => setInboundOpen(false)} />
      <SaleModal open={saleOpen} onClose={() => setSaleOpen(false)} />
      <LossModal open={lossOpen} onClose={() => setLossOpen(false)} />
    </>
  );
}
