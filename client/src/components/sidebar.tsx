import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Shield, BarChart3, Users, Server, History, Download, Settings } from "lucide-react";

const navigation = [
  { name: "Панель управления", href: "/", icon: BarChart3 },
  { name: "Кураторы", href: "/curators", icon: Users },
  { name: "Серверы Discord", href: "/servers", icon: Server },
  { name: "История активности", href: "/activity", icon: History },
  { name: "Экспорт отчетов", href: "/reports", icon: Download },
  { name: "Настройки бота", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 surface flex-shrink-0 border-r border-gray-700 min-h-screen sticky top-0">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Majestic RP SF</h1>
            <p className="text-sm text-gray-400">Мониторинг кураторов</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.name} href={item.href}>
              <div className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer",
                isActive 
                  ? "bg-blue-600 text-white" 
                  : "text-gray-300 hover:bg-gray-700"
              )}>
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
        
        {/* Bot Status in Menu */}
        <div className="mt-4 px-4 py-3 rounded-lg surface-light">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs font-medium text-white">Бот онлайн</span>
            <span className="text-xs text-gray-400">(8 серверов)</span>
          </div>
        </div>
      </nav>
    </div>
  );
}