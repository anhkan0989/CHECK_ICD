import { ReactNode, useState, useEffect } from 'react';
import { Search, Upload, History, Bot, Menu, X, Activity, Database, Stethoscope, Building2, Syringe, Settings, Pill, FileText } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: ReactNode;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export function Layout({ children, currentTab, setCurrentTab }: LayoutProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const adminStatus = localStorage.getItem('isAdmin');
    if (adminStatus === 'true') {
      setIsAdmin(true);
    }
  }, []);

  const handleLoginToggle = () => {
    if (isAdmin) {
      if (window.confirm('Bạn có chắc muốn đăng xuất khỏi chế độ Quản trị?')) {
        localStorage.removeItem('isAdmin');
        setIsAdmin(false);
      }
    } else {
      const user = window.prompt('Tên đăng nhập (dành cho Quản trị viên):');
      if (user === 'anhkanIT') {
        const pass = window.prompt('Mật khẩu:');
        if (pass === '020609') {
          localStorage.setItem('isAdmin', 'true');
          setIsAdmin(true);
          alert('Khởi động chế độ Quản trị thành công! Đã mở khóa Menu Hệ thống.');
        } else {
          alert('Sai mật khẩu!');
        }
      } else if (user) {
        alert('Tài khoản không tồn tại!');
      }
    }
  };

  const navItems = [
    { id: 'tt01', label: 'Tra cứu ICD TT01 (Chuyển tuyến)', icon: FileText },
    { id: 'tt06', label: 'Tra cứu ICD TT06', icon: FileText },
    { id: 'tt25', label: 'Tra cứu ICD TT25', icon: FileText },
    { id: 'yhct', label: 'Tra cứu YHCT', icon: Stethoscope },
    { id: 'facility', label: 'Tra cứu CSKCB', icon: Building2 },
    { id: 'dvkt', label: 'Tra cứu DVKT Tổng hợp', icon: Activity },
    { id: 'thuoc', label: 'Tra cứu Thuốc', icon: Pill },
    { id: 'import', label: 'Cập nhật QĐ/Data', icon: Upload },
    { id: 'history', label: 'Lịch sử', icon: History },
    { id: 'cls_engine', label: 'Gợi ý CLS (AI)', icon: Syringe },
    { id: 'rule_management', label: 'Cài đặt Chống chỉ định', icon: Settings },
    { id: 'backup', label: 'Sao lưu & Đồng bộ', icon: Database },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
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
              <span>CHECK-ICD-ANHIT</span>
            </div>
            <button className="md:hidden text-slate-500" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] mt-3 font-bold text-slate-400 tracking-wider text-left leading-tight">
            NGUYỄN ĐOÀN MINH ANH - IT Y TẾ - CoppyRight
          </p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.filter(item => isAdmin || !['import', 'history', 'rule_management', 'backup'].includes(item.id)).map((item) => {
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
        
        <div className="p-4 border-t border-slate-200 text-xs text-slate-500">
          <p>Phiên bản: 1.0.0</p>
          <div className="flex justify-between items-center mt-1">
             <p>Dữ liệu: Chuẩn BYT</p>
             <button onClick={handleLoginToggle} className={`font-medium ${isAdmin ? 'text-rose-600' : 'text-slate-400 hover:text-indigo-600'}`}>
                {isAdmin ? 'Đăng xuất' : '🔒 Đăng nhập'}
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-gradient-to-br from-slate-50 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-emerald-50/30 z-0 pointer-events-none" />
        
        {/* Subtle Watermark Background Loop */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Hexagon Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-rule='evenodd' stroke='%234f46e5' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
            backgroundSize: '40px 40px'
          }} />

          {/* Medical Crosses Pattern */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 0h4v10h10v4H14v10h-4V14H0v-4h10V0z' fill='%2310b981'/%3E%3C/svg%3E")`,
            backgroundSize: '120px 120px',
            backgroundPosition: '60px 60px'
          }} />

          {/* 2D Medical Watermarks */}
          <Activity className="absolute text-blue-600 opacity-[0.04] w-[800px] h-[800px] -bottom-48 -right-48 rotate-12" />
          <Stethoscope className="absolute text-emerald-600 opacity-[0.03] w-[500px] h-[500px] -top-32 -left-32 -rotate-12" />
          <Syringe className="absolute text-rose-500 opacity-[0.02] w-[400px] h-[400px] top-[40%] right-[20%] rotate-45" />
          
          {/* Logo Watermark */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center opacity-[0.02] pointer-events-none">
             <div className="flex items-center justify-center gap-6">
               <div className="relative flex items-center justify-center w-24 h-24">
                 <div className="absolute inset-0 bg-blue-900 rounded-2xl rotate-45" />
                 <div className="absolute w-12 h-4 bg-white rounded-full z-10" />
                 <div className="absolute w-4 h-12 bg-white rounded-full z-10" />
               </div>
             </div>
             <p className="mt-12 text-6xl font-black text-blue-900 tracking-[0.5em] ml-[0.5em]">MED DATA</p>
          </div>
        </div>

        {/* Mobile Header */}
        <header className="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex items-center gap-3 relative z-10">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-600">
            <Menu className="w-6 h-6" />
          </button>
          <div className="font-bold text-lg text-indigo-600">CHECK-ICD-ANHIT</div>
        </header>
        
        <div className="flex-1 overflow-auto p-4 md:p-8 relative z-10">
          <div className="max-w-6xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
