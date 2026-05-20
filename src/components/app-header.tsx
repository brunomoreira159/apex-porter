'use client';

import React from 'react';

import { useTheme } from 'next-themes';
import { Settings, LogOut, Sun, Moon, User as UserIcon } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useSignalStrength, type SignalLevel } from '@/lib/hooks/use-signal-strength';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// ── Signal Bars ─────────────────────────────────────────────────────────────
const SIGNAL_COLORS: Record<SignalLevel, string> = {
  0: '#f87171', // red  – offline
  1: '#fb923c', // orange – fraco
  2: '#facc15', // yellow – regular
  3: '#4ade80', // green – bom
  4: '#34d399', // emerald – ótimo
};

function SignalBars({ level }: { level: SignalLevel }) {
  const color = SIGNAL_COLORS[level];
  const heights = ['30%', '50%', '70%', '100%'];

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '14px' }}>
      {heights.map((h, i) => {
        const active = level > 0 && i < level;
        return (
          <div
            key={i}
            style={{
              width: '3px',
              height: h,
              borderRadius: '1px',
              backgroundColor: active ? color : 'rgba(255,255,255,0.25)',
              transition: 'background-color 0.4s ease',
            }}
          />
        );
      })}
    </div>
  );
}

// ── Signal Indicator ─────────────────────────────────────────────────────────
function SignalIndicator() {
  const { level, label, latency } = useSignalStrength();

  const tooltipText = level === 0
    ? 'Sem conexão'
    : `${label}${latency !== null ? ` · ${latency}ms` : ''}`;

  return (
    <div
      title={tooltipText}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        cursor: 'default',
      }}
    >
      <SignalBars level={level} />
      <span
        style={{
          fontSize: '9px',
          lineHeight: 1,
          opacity: 0.8,
          color: SIGNAL_COLORS[level],
          fontWeight: 600,
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
        {latency !== null && level > 0 && (
          <span style={{ opacity: 0.7, fontWeight: 400 }}> {latency}ms</span>
        )}
      </span>
    </div>
  );
}

// ── App Header ───────────────────────────────────────────────────────────────
export default function AppHeader() {
  const { user, setCurrentPage, logout } = useAppStore();

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
    <header
      className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-md"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          height: '56px',
          paddingLeft: '16px',
          paddingRight: '16px',
        }}
      >
        {/* Left: Logo + título */}
        <div className="flex items-center gap-2">
          <img
            src="/icons/APEX_LOGO.png"
            alt="APEX Porter Logo"
            className="h-9 w-9 md:h-10 md:w-10 object-contain drop-shadow-sm"
          />
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-tight">APEX PORTER</h1>
            <p className="text-[11px] leading-tight opacity-85 hidden sm:block">
              Sistema de Registro
            </p>
          </div>
        </div>

        {/* Center: Indicador de sinal */}
        <SignalIndicator />

        {/* Right: Ações */}
        <div className="flex items-center gap-1 justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-white/10 h-9 w-9"
            onClick={() => {
              const root = document.documentElement;
              const isDarkApex = root.classList.contains('dark-apex');
              root.classList.remove('dark-apex');
              if (isDarkApex || theme === 'dark') {
                setTheme('light');
              } else {
                setTheme('dark');
              }
            }}
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
                <span className="hidden sm:inline text-sm max-w-24 truncate font-medium">
                  {user?.nome || 'Usuário'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setCurrentPage('perfil')}>
                <UserIcon className="mr-2 h-4 w-4" />
                Meu Perfil
              </DropdownMenuItem>
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
