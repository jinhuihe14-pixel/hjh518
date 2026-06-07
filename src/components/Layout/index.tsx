import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  return (
    <div className="min-h-screen bg-cream-50">
      <Sidebar />
      <div className="ml-60">
        <Header />
        <main className="p-6 animate-fade-in-up">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
