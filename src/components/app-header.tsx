'use client';

import { useTheme } from 'next-themes';
import { Settings, LogOut, Sun, Moon, Wifi, WifiOff } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useOnlineStatus } from '@/lib/hooks/use-firestore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function AppHeader() {
  const { user, setCurrentPage, logout } = useAppStore();
  const isOnline = useOnlineStatus();

  const handleLogout = () => {
    logout();
  };
  const { theme, setTheme } = useTheme();

  const initials = user?.nome
    ? user.nome
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'US';

  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-md" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <img src="/icons/APEX_LOGO.png" alt="APEX Porter Logo" className="h-6 w-6 object-contain" />
          <div>
            <h1 className="text-base font-bold leading-tight">APEX PORTER</h1>
            <p className="text-[10px] leading-tight opacity-80 hidden sm:block">
              Sistema de Registro
            </p>
          </div>
          {/* Connection status indicator (Phase 8) */}
          <div className="ml-2 flex items-center gap-1" title={isOnline ? 'Conectado' : 'Offline — dados locais'}>
            {isOnline ? (
              <Wifi className="h-3.5 w-3.5 text-green-300" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
            )}
            <span className="text-[9px] opacity-70 hidden sm:inline">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-white/10 h-9 w-9"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-white/10 h-9 w-9"
            onClick={() => setCurrentPage('configuracoes')}
          >
            <Settings className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-primary-foreground hover:bg-white/10 h-9 px-2 gap-2"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-white/20 text-primary-foreground text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm max-w-24 truncate">
                  {user?.nome || 'Usuário'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setCurrentPage('configuracoes')}>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
