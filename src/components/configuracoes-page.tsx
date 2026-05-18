'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  Sun,
  Moon,
  Monitor,
  Clock,
  LogOut,
  Info,
  User,
  Save,
  Pencil,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppStore } from '@/lib/store';
import { seedFirestore } from '@/lib/seed-firestore';
import { toast } from 'sonner';

export default function ConfiguracoesPage() {
  const { user, updateUser, logout, settings, updateSettings } = useAppStore();
  const { resolvedTheme, setTheme } = useTheme();
  const [seedLoading, setSeedLoading] = useState(false);

  // Profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editNome, setEditNome] = useState(user?.nome || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editCargo, setEditCargo] = useState(user?.cargo || '');

  useEffect(() => {
    if (user) {
      setEditNome(user.nome || '');
      setEditEmail(user.email || '');
      setEditCargo(user.cargo || '');
    }
  }, [user]);

  const handleSaveProfile = () => {
    if (!editNome.trim()) {
      toast.error('O nome é obrigatório');
      return;
    }
    // Email is managed by Firebase Auth — only update nome and cargo
    updateUser({ nome: editNome.trim(), cargo: editCargo.trim() });
    setIsEditing(false);
    toast.success('Perfil atualizado com sucesso!');
  };

  const checkTime = useCallback(() => {
    if (!settings.autoTheme || settings.fixedTheme) return;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = settings.darkModeStart.split(':').map(Number);
    const [endH, endM] = settings.darkModeEnd.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    let isDarkTime: boolean;
    if (startMinutes > endMinutes) {
      isDarkTime = currentMinutes >= startMinutes || currentMinutes < endMinutes;
    } else {
      isDarkTime = currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
    setTheme(isDarkTime ? 'dark' : 'light');
  }, [settings.autoTheme, settings.fixedTheme, settings.darkModeStart, settings.darkModeEnd, setTheme]);

  // Auto theme switching logic
  useEffect(() => {
    if (!settings.autoTheme || settings.fixedTheme) return;
    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [settings.autoTheme, settings.fixedTheme, checkTime]);

  const theme = resolvedTheme || 'light';

  const initials = user?.nome
    ? user.nome
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'US';

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-6 pb-28 space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold">Configurações</h2>
        <p className="text-sm text-muted-foreground">
          Personalize o aplicativo
        </p>
      </div>

      {/* User Profile */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Perfil do Porteiro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base truncate">{user?.nome || 'Usuário'}</p>
              <p className="text-sm text-muted-foreground truncate">{user?.email || ''}</p>
              {user?.cargo && (
                <p className="text-xs text-muted-foreground">{user.cargo}</p>
              )}
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="shrink-0"
              >
                <Pencil className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )}
          </div>

          {isEditing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 pt-2"
            >
              <div className="space-y-2">
                <Label htmlFor="editNome">Nome *</Label>
                <Input
                  id="editNome"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  placeholder="Seu nome completo"
                  className="text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editEmail}
                  readOnly
                  className="text-base opacity-60 cursor-not-allowed"
                  title="Email é gerenciado pelo Firebase e não pode ser alterado aqui"
                />
                <p className="text-xs text-muted-foreground">Email gerenciado pela conta Firebase</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCargo">Cargo</Label>
                <Input
                  id="editCargo"
                  value={editCargo}
                  onChange={(e) => setEditCargo(e.target.value)}
                  placeholder="Ex: Porteiro, Vigilante..."
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={handleSaveProfile}
                  className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Salvar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditNome(user?.nome || '');
                    setEditEmail(user?.email || '');
                    setEditCargo(user?.cargo || '');
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            Tema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Theme Selection */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              className={`h-16 flex-col gap-1 ${
                theme === 'light' ? 'bg-emerald-600 hover:bg-emerald-700' : ''
              }`}
              onClick={() => handleThemeChange('light')}
            >
              <Sun className="h-5 w-5" />
              <span className="text-xs">Claro</span>
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              className={`h-16 flex-col gap-1 ${
                theme === 'dark' ? 'bg-emerald-600 hover:bg-emerald-700' : ''
              }`}
              onClick={() => handleThemeChange('dark')}
            >
              <Moon className="h-5 w-5" />
              <span className="text-xs">Escuro</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex-col gap-1"
              onClick={() => {
                updateSettings({ autoTheme: !settings.autoTheme });
                toast.success(settings.autoTheme ? 'Modo automático desativado' : 'Modo automático ativado');
              }}
            >
              <Monitor className="h-5 w-5" />
              <span className="text-xs">Auto</span>
            </Button>
          </div>

          <Separator />

          {/* Auto Theme Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Modo automático</Label>
              <Switch
                checked={settings.autoTheme}
                onCheckedChange={(checked) => {
                  updateSettings({ autoTheme: checked });
                  toast.success(checked ? 'Modo automático ativado' : 'Modo automático desativado');
                }}
              />
            </div>

            {settings.autoTheme && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 pl-0"
              >
                <div className="flex items-center justify-between">
                  <Label className="text-sm flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Horário início (modo escuro)
                  </Label>
                  <Input
                    type="time"
                    value={settings.darkModeStart}
                    onChange={(e) => updateSettings({ darkModeStart: e.target.value })}
                    className="w-28 h-8 text-sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Horário fim (modo escuro)
                  </Label>
                  <Input
                    type="time"
                    value={settings.darkModeEnd}
                    onChange={(e) => updateSettings({ darkModeEnd: e.target.value })}
                    className="w-28 h-8 text-sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Tema fixo</Label>
                  <Switch
                    checked={settings.fixedTheme}
                    onCheckedChange={(checked) => {
                      updateSettings({ fixedTheme: checked });
                      toast.success(checked ? 'Tema fixo ativado' : 'Tema fixo desativado');
                    }}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Database Admin */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4" />
            Banco de Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Popule o Firestore com os dados iniciais (empresas, departamentos, pessoas e ramais). Itens já existentes serão mantidos.
          </p>
          <Button
            variant="outline"
            className="w-full"
            disabled={seedLoading}
            onClick={async () => {
              setSeedLoading(true);
              try {
                const result = await seedFirestore();
                if (result.success) {
                  const totalAdded = Object.values(result.results).reduce((sum, r) => sum + r.added, 0);
                  const totalSkipped = Object.values(result.results).reduce((sum, r) => sum + r.skipped, 0);
                  toast.success(`Seed concluído: ${totalAdded} adicionados, ${totalSkipped} já existiam`);
                } else {
                  toast.error(result.error || 'Erro ao popular banco de dados');
                }
              } catch (err) {
                toast.error('Erro ao popular banco de dados');
              } finally {
                setSeedLoading(false);
              }
            }}
          >
            {seedLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                Populando...
              </span>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Popular Banco com Dados Iniciais
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Info className="h-4 w-4" />
            Sobre o App
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Versão</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Sistema</span>
            <span className="font-medium">APEX Porter</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Desenvolvido por</span>
            <span className="font-medium">APEX Tecnologia</span>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive h-11"
        onClick={() => {
          logout();
          toast.success('Sessão encerrada');
        }}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sair da Conta
      </Button>
    </motion.div>
  );
}
