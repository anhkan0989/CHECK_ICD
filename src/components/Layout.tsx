import { ReactNode, useState } from 'react';
import { Search, Upload, History, Bot, Menu, X, Activity, Database, Shield, ShieldCheck, LogOut, Eye, EyeOff } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAdmin } from '../context/AdminContext';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: ReactNode;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export function Layout({ children, currentTab, setCurrentTab }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { isAdmin, login, logout } = useAdmin();

  const navItems = [
    { id: 'search', label: 'Tra cứu ICD TT06', icon: Search },
    { id: 'import', label: 'Cập nhật ICD', icon: Upload },
    { id: 'history', label: 'Lịch sử', icon: History },
    { id: 'ai', label: 'AI Suggest', icon: Bot },
    { id: 'backup', label: 'Sao lưu & Đồng bộ', icon: Database },
  ];

  const handleLogin = () => {
    const success = login(password);
    if (success) {
      setShowLoginModal(false);
      setPassword('');
      setLoginError('');
    } else {
      setLoginError('Mật khẩu không đúng!');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Admin Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Đăng nhập Admin</h3>
                <p className="text-slate-500 text-sm">Nhập mật khẩu để mở khóa chức năng Admin</p>
              </div>
            </div>

            <div className="relative mb-3">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setLoginError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Nhập mật khẩu admin..."
                autoFocus
                className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {loginError && (
              <p className="text-rose-600 text-sm mb-3 font-medium">{loginError}</p>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowLoginModal(false); setPassword(''); setLoginError(''); }}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleLogin}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
              >
                Đăng nhập
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 flex flex-col",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 border-b border-slate-200 flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
              <Activity className="w-6 h-6" />
              <span>ICD Engine</span>
            </div>
            <button className="md:hidden text-slate-500" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] mt-3 font-bold text-slate-400 uppercase tracking-wider text-left leading-tight">
            NGUYEN DOÀN MINH ÁNH - IT Y TẾ - COPPYRIGHT
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-indigo-600" : "text-slate-400")} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Admin Section */}
        <div className="p-4 border-t border-slate-200 space-y-3">
          {isAdmin ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-emerald-700 text-sm font-semibold">Chế độ Admin</span>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất Admin
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 rounded-lg text-sm font-medium transition-colors"
            >
              <Shield className="w-4 h-4" />
              Đăng nhập Admin
            </button>
          )}
          <div className="text-xs text-slate-400 px-1">
            <p>Phiên bản: 1.0.0</p>
            <p>Dữ liệu: Chuẩn BYT</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center gap-3">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-600">
            <Menu className="w-6 h-6" />
          </button>
          <div className="font-bold text-lg text-indigo-600">ICD Engine</div>
          {isAdmin && (
            <span className="ml-auto flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full font-semibold">
              <ShieldCheck className="w-3 h-3" /> Admin
            </span>
          )}
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
