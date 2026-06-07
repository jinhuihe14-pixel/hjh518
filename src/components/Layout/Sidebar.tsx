import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  BarChart3,
  Users,
  TrendingDown,
  FileSpreadsheet,
  Store,
} from 'lucide-react';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: '数据概览' },
  { path: '/inventory', icon: AlertTriangle, label: '库存预警' },
  { path: '/sales', icon: BarChart3, label: '销售分析' },
  { path: '/preference', icon: Users, label: '消费偏好' },
  { path: '/loss', icon: TrendingDown, label: '损耗管理' },
  { path: '/reports', icon: FileSpreadsheet, label: '报表中心' },
];

export default function Sidebar() {
  return (
    <aside className="w-60 bg-white border-r border-gray-100 h-screen fixed left-0 top-0 flex flex-col shadow-sm">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-800 text-lg">便民超市</h1>
            <p className="text-xs text-gray-500">进销存分析系统</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
            }
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gradient-to-r from-primary-50 to-orange-50 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-700">今日提示</p>
          <p className="text-xs text-gray-500 mt-1">
            有 5 个商品临期预警，请及时处理
          </p>
        </div>
      </div>
    </aside>
  );
}
