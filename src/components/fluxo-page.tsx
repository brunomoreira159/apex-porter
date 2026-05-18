'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, LogOut, Inbox, Clock, ArrowRightLeft, User, Building2, Truck, Scale, Package, Calendar, FileText, AlertTriangle, Users, Mail, TrendingUp, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';
import { CATEGORIAS_FLUXO, type CategoriaFluxo, type RegistroFluxo } from '@/lib/data';
import RegistroModal from './registro-modal';
import { toast } from 'sonner';

type StatusFilter = 'aberto' | 'finalizado' | 'todos';

const catIcons: Record<CategoriaFluxo, React.ElementType> = {
  entregas1: Package,
  visitantes: User,
  prestadores: Building2,
  pesagem: Scale,
  entregas2: Truck,
  coleta: ArrowRightLeft,
  movimentacao: Users,
  correspondencias: Mail,
};

function getMainField(r: RegistroFluxo): string {
  switch (r.categoria) {
    case 'entregas1': return r.nome;
    case 'visitantes': return r.nomeEmpresa;
    case 'prestadores': return r.nomeEmpresa;
    case 'pesagem': return r.motorista;
    case 'entregas2': return r.motorista;
    case 'coleta': return r.motorista;
    case 'movimentacao': return r.nomeColaborador;
    case 'correspondencias': return r.destinatario;
  }
}

function getSecondaryFields(r: RegistroFluxo): { label: string; value: string }[] {
  switch (r.categoria) {
    case 'entregas1':
      return [
        { label: 'Empresa', value: r.empresa },
        { label: 'RG/CPF', value: r.rgCpf },
      ];
    case 'visitantes':
      return [
        { label: 'Departamento', value: r.departamento },
        { label: 'RG/CPF', value: r.rgCpf },
      ];
    case 'prestadores':
      return [
        { label: 'Departamento', value: r.departamento },
        { label: 'RG/CPF', value: r.rgCpf },
      ];
    case 'pesagem':
      return [
        { label: 'Empresa', value: r.empresa },
        { label: 'Placa', value: r.placa },
        { label: 'Peso Entrada', value: `${r.pesoEntrada.toLocaleString('pt-BR')} kg` },
      ];
    case 'entregas2':
      return [
        { label: 'Empresa', value: r.empresa },
        { label: 'Departamento', value: r.departamento },
        { label: 'CPF/RG', value: r.cpfRg },
      ];
    case 'coleta':
      return [
        { label: 'Empresa', value: r.empresa },
        { label: 'Placa', value: r.placa },
        { label: 'RG/CPF', value: r.rgCpf },
      ];
    case 'movimentacao':
      return [
        { label: 'RG/CPF', value: r.rgCpf },
        { label: 'Autorizado por', value: r.autorizadoPor },
        { label: 'Porteiro', value: r.porteiro },
      ];
    case 'correspondencias':
      return [
        { label: 'Tipo', value: r.tipo },
        { label: 'Remetente', value: r.remetente },
        { label: 'Departamento', value: r.departamento },
      ];
  }
}

function getAllFields(r: RegistroFluxo): { label: string; value: string }[] {
  const base: { label: string; value: string }[] = [];
  base.push({ label: 'Categoria', value: CATEGORIAS_FLUXO.find(c => c.value === r.categoria)?.label || r.categoria });
  base.push({ label: 'Data', value: r.data });
  base.push({ label: 'Horário de Entrada', value: r.horarioEntrada });

  switch (r.categoria) {
    case 'entregas1':
      base.push({ label: 'Nome', value: r.nome });
      base.push({ label: 'Empresa', value: r.empresa });
      base.push({ label: 'RG/CPF', value: r.rgCpf });
      break;
    case 'visitantes':
      base.push({ label: 'Nome / Empresa', value: r.nomeEmpresa });
      base.push({ label: 'Departamento', value: r.departamento });
      base.push({ label: 'RG/CPF', value: r.rgCpf });
      break;
    case 'prestadores':
      base.push({ label: 'Nome / Empresa', value: r.nomeEmpresa });
      base.push({ label: 'Departamento', value: r.departamento });
      base.push({ label: 'RG/CPF', value: r.rgCpf });
      break;
    case 'pesagem':
      base.push({ label: 'Empresa', value: r.empresa });
      base.push({ label: 'Placa', value: r.placa });
      base.push({ label: 'Motorista', value: r.motorista });
      base.push({ label: 'Peso Entrada', value: `${r.pesoEntrada.toLocaleString('pt-BR')} kg` });
      if (r.pesoSaida) base.push({ label: 'Peso Saída', value: `${r.pesoSaida.toLocaleString('pt-BR')} kg` });
      break;
    case 'entregas2':
      base.push({ label: 'Motorista', value: r.motorista });
      base.push({ label: 'CPF/RG', value: r.cpfRg });
      base.push({ label: 'Empresa', value: r.empresa });
      base.push({ label: 'Departamento', value: r.departamento });
      break;
    case 'coleta':
      base.push({ label: 'Empresa', value: r.empresa });
      base.push({ label: 'Motorista', value: r.motorista });
      base.push({ label: 'Placa', value: r.placa });
      base.push({ label: 'RG/CPF', value: r.rgCpf });
      break;
    case 'movimentacao':
      base.push({ label: 'Nome do Colaborador', value: r.nomeColaborador });
      base.push({ label: 'RG/CPF', value: r.rgCpf });
      base.push({ label: 'Autorizado Por', value: r.autorizadoPor });
      base.push({ label: 'Assinatura Colaborador', value: r.assinaturaColaborador });
      base.push({ label: 'Porteiro', value: r.porteiro });
      break;
    case 'correspondencias':
      base.push({ label: 'Destinatário', value: r.destinatario });
      base.push({ label: 'Remetente', value: r.remetente });
      base.push({ label: 'Tipo', value: r.tipo });
      base.push({ label: 'Departamento', value: r.departamento });
      base.push({ label: 'Quem Retirou', value: r.quemRetirou });
      base.push({ label: 'Porteiro', value: r.porteiro });
      break;
  }

  if (r.horarioSaida) {
    base.push({ label: 'Horário de Saída', value: r.horarioSaida });
  }
  if (r.observacao) {
    base.push({ label: 'Observação', value: r.observacao });
  }
  if (r.detalhes) {
    base.push({ label: 'Detalhes', value: r.detalhes });
  }
  if (r.ocorrencia) {
    base.push({ label: 'Ocorrência', value: r.ocorrencia });
  }

  return base;
}

export default function FluxoPage() {
  const {
    categoriaAtiva,
    setCategoriaAtiva,
    registrosFluxo,
    registrarSaida,
    inativarRegistroFluxo,
    buscaFluxo,
    setBuscaFluxo,
    user,
  } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCategoria, setModalCategoria] = useState<CategoriaFluxo>(
    categoriaAtiva === 'todos' ? 'visitantes' : categoriaAtiva
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('aberto');

  // Detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRegistro, setSelectedRegistro] = useState<RegistroFluxo | null>(null);
  const [detalhesSaida, setDetalhesSaida] = useState('');
  const [ocorrenciaSaida, setOcorrenciaSaida] = useState('');
  const [pesoSaidaInput, setPesoSaidaInput] = useState('');

  // Refacao auditavel states
  const [registroRefacao, setRegistroRefacao] = useState<RegistroFluxo | null>(null);
  const [isRefacao, setIsRefacao] = useState(false);

  useEffect(() => {
    setCategoriaAtiva('todos');
  }, [setCategoriaAtiva]);

  const filteredRegistros = useMemo(() => {
    return registrosFluxo.filter((r) => {
      if (categoriaAtiva !== 'todos' && r.categoria !== categoriaAtiva) return false;
      const hasSaida = 'horarioSaida' in r && r.horarioSaida !== '';
      if (statusFilter === 'aberto' && hasSaida) return false;
      if (statusFilter === 'finalizado' && !hasSaida) return false;
      if (buscaFluxo) {
        const search = buscaFluxo.toLowerCase();
        const fields = Object.values(r).filter((v) => typeof v === 'string');
        return fields.some((v) => v.toLowerCase().includes(search));
      }
      return true;
    });
  }, [registrosFluxo, categoriaAtiva, buscaFluxo, statusFilter]);

  const handleAddRegistro = () => {
    setRegistroRefacao(null);
    setIsRefacao(false);
    setModalCategoria(categoriaAtiva === 'todos' ? 'visitantes' : categoriaAtiva);
    setModalOpen(true);
  };

  const handleOpenDetail = (r: RegistroFluxo) => {
    setSelectedRegistro(r);
    setDetalhesSaida(r.detalhes || '');
    setOcorrenciaSaida(r.ocorrencia || '');
    setPesoSaidaInput('');
    setDetailModalOpen(true);
  };

  const handleRegistrarSaida = () => {
    if (!selectedRegistro) return;
    const pesoSaida = selectedRegistro.categoria === 'pesagem'
      ? parseFloat(pesoSaidaInput.replace(',', '.')) || 0
      : undefined;
    const porteiroSaida = user?.nome || undefined;
    registrarSaida(selectedRegistro.id, detalhesSaida, ocorrenciaSaida, pesoSaida, porteiroSaida);
    toast.success('Saída registrada com sucesso!');
    setDetailModalOpen(false);
    setSelectedRegistro(null);
    setDetalhesSaida('');
    setOcorrenciaSaida('');
    setPesoSaidaInput('');
  };

  const handleRefazer = (r: RegistroFluxo) => {
    inativarRegistroFluxo(r.id, undefined, 'Substituído por nova versão corrigida (Refazer)');
    toast.info('Registro anterior inativado para refação.');
    setDetailModalOpen(false);
    setSelectedRegistro(null);
    setRegistroRefacao(r);
    setIsRefacao(true);
    setModalCategoria(r.categoria);
    setModalOpen(true);
  };



  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-[calc(100vh-7.5rem)]"
    >
      {/* Top section: Search + Filter */}
      <div className="p-4 md:p-6 pb-0 space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, placa, empresa..."
            value={buscaFluxo}
            onChange={(e) => setBuscaFluxo(e.target.value)}
            className="pl-10 h-11 text-base bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>

        {/* Category dropdown filter */}
        <Select
          value={categoriaAtiva}
          onValueChange={(v) => setCategoriaAtiva(v as CategoriaFluxo | 'todos')}
        >
          <SelectTrigger className="h-11 text-base bg-muted/50 border-0">
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {CATEGORIAS_FLUXO.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status tabs */}
        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <TabsList className="w-full grid grid-cols-3 h-10">
            <TabsTrigger
              value="aberto"
              className="text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Em aberto
            </TabsTrigger>
            <TabsTrigger
              value="finalizado"
              className="text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Finalizados
            </TabsTrigger>
            <TabsTrigger
              value="todos"
              className="text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Todos
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content area - card list */}
      <div className="flex-1 p-4 md:p-6 pt-3 pb-44 overflow-y-auto">
        {filteredRegistros.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Inbox className="h-10 w-10 text-muted-foreground/60" />
            </div>
            <p className="text-lg font-medium mb-1">
              {statusFilter === 'aberto'
                ? 'Nenhum registro em aberto'
                : statusFilter === 'finalizado'
                  ? 'Nenhum registro finalizado'
                  : 'Nenhum registro encontrado'}
            </p>
            <p className="text-sm text-muted-foreground/70">
              Toque em Registrar entrada para começar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredRegistros.map((r) => {
              const hasSaida = 'horarioSaida' in r && r.horarioSaida !== '';
              const mainField = getMainField(r);
              const secondaryFields = getSecondaryFields(r);
              const data = 'data' in r ? (r as any).data : '';
              const horarioEntrada = 'horarioEntrada' in r ? (r as any).horarioEntrada : '';
              const horarioSaida = 'horarioSaida' in r ? (r as any).horarioSaida : '';
              // PESAGEM DE CARGA extras
              const isPesagem = r.categoria === 'pesagem';
              const pesoEntrada = isPesagem ? (r as any).pesoEntrada ?? 0 : 0;
              const pesoSaidaVal = isPesagem ? (r as any).pesoSaida ?? 0 : 0;
              const resultadoDif = isPesagem ? (r as any).resultadoDiferenca ?? null : null;
              const porteiroEntrada = (r as any).porteiroEntrada || null;
              const porteiroSaidaVal = (r as any).porteiroSaida || null;
              const CardIcon = catIcons[r.categoria] || Package;

              const isInactive = r.inativo;
              return (
                <Card
                  key={r.id}
                  className={`cursor-pointer transition-colors active:scale-[0.98] ${
                    isInactive ? 'opacity-60 bg-red-500/5 dark:bg-red-500/10 border-dashed border-red-500/30' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleOpenDetail(r)}
                >
                  <CardContent className="p-3.5">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-muted shrink-0">
                        <CardIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-lg truncate">{mainField}</h3>
                          {isInactive ? (
                            <Badge variant="outline" className="text-red-500 border-red-300 dark:border-red-800 text-xs px-1.5 py-0">
                              Inativo (Refeito)
                            </Badge>
                          ) : hasSaida ? (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs px-1.5 py-0">
                              Concluído
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs px-1.5 py-0">
                              Pendente
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {secondaryFields.map((field) => (
                            <p key={field.label} className="text-base leading-snug text-muted-foreground">
                              <span className="font-medium">{field.label}:</span> {field.value || '-'}
                            </p>
                          ))}
                        </div>

                        {/* PESAGEM DE CARGA — resultado em destaque nos finalizados */}
                        {isPesagem && hasSaida && resultadoDif !== null && (
                          <div className={`mt-2 rounded-xl px-3 py-2 border ${resultadoDif >= 0
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-red-500/10 border-red-500/30'
                            }`}>
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                              Resultado Pesagem
                            </p>
                            <p className={`text-2xl font-black ${resultadoDif >= 0 ? 'text-emerald-400' : 'text-red-400'
                              }`}>
                              {resultadoDif >= 0 ? '+' : ''}{resultadoDif.toLocaleString('pt-BR')} kg
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Entrada: {pesoEntrada.toLocaleString('pt-BR')} kg · Saída: {pesoSaidaVal.toLocaleString('pt-BR')} kg
                            </p>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            {data}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            Entrou ás: {horarioEntrada}
                          </span>
                          {hasSaida && (
                            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                              <LogOut className="h-4 w-4" />
                              Saiu ás: {horarioSaida}
                            </span>
                          )}
                        </div>

                        {/* Porteiros */}
                        {(porteiroEntrada || porteiroSaidaVal) && (
                          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground/70">
                            {porteiroEntrada && (
                              <span>🔑 Entrada: <span className="font-medium text-muted-foreground">{porteiroEntrada}</span></span>
                            )}
                            {porteiroSaidaVal && (
                              <span>🚪 Saída: <span className="font-medium text-muted-foreground">{porteiroSaidaVal}</span></span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed bottom register button - above bottom nav */}
      <div className="fixed bottom-16 left-0 right-0 z-30 pt-3 pb-7 px-4 md:px-6 bg-background/80 backdrop-blur-md border-t border-border/50">
        <Button
          onClick={handleAddRegistro}
          className="w-full h-13 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-semibold shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Registrar entrada
        </Button>
      </div>

      {/* Registro Modal */}
      <RegistroModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        categoriaInicial={modalCategoria}
        registroInicial={registroRefacao}
        isRefacao={isRefacao}
      />

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={(v) => { if (!v) { setDetailModalOpen(false); setSelectedRegistro(null); setPesoSaidaInput(''); } }}>
        <DialogContent
          className="max-w-md max-h-[85vh] overflow-y-auto custom-scrollbar"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRegistro && (() => {
                const RIcon = catIcons[selectedRegistro.categoria];
                return <RIcon className="h-5 w-5 text-emerald-600" />;
              })()}
              Detalhes do Registro
            </DialogTitle>
          </DialogHeader>

          {selectedRegistro && (
            <div className="space-y-5">
              {selectedRegistro.inativo && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs rounded-xl p-3.5 flex items-start gap-2.5">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold uppercase tracking-wider text-[11px]">Registro Inativado / Versão Anterior</p>
                    <p>{selectedRegistro.motivoRefacao || 'Substituído por nova versão auditável'}</p>
                    {selectedRegistro.dataInativacao && (
                      <p className="text-[10px] text-muted-foreground">Inativado em {selectedRegistro.dataInativacao}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Entry Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  <span className="font-semibold text-sm">Informações de Entrada</span>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 space-y-2.5">
                  {getAllFields(selectedRegistro).map((field) => (
                    <div key={field.label} className="flex justify-between items-start gap-2">
                      <span className="text-sm font-medium text-muted-foreground shrink-0">{field.label}</span>
                      <span className="text-sm text-foreground text-right">{field.value || '-'}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Only show detalhes/ocorrencia/saida if not yet finalized */}
              {!selectedRegistro.horarioSaida && (
                <>
                  {/* Peso de Saída — PESAGEM DE CARGA only */}
                  {selectedRegistro.categoria === 'pesagem' && (() => {
                    const pesoEntrada = (selectedRegistro as any).pesoEntrada ?? 0;
                    const pesoSaidaNum = parseFloat(pesoSaidaInput.replace(',', '.')) || 0;
                    const diferenca = pesoSaidaNum - pesoEntrada;
                    const hasDiferenca = pesoSaidaInput.trim() !== '' && pesoSaidaNum > 0;
                    return (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="flex items-center gap-2">
                            <Scale className="h-4 w-4 text-emerald-500" />
                            Peso de Saída (kg)
                          </Label>
                          <Input
                            type="number"
                            placeholder="Ex: 8500"
                            value={pesoSaidaInput}
                            onChange={(e) => setPesoSaidaInput(e.target.value)}
                            className="text-base"
                          />
                        </div>
                        {hasDiferenca && (
                          <div className={`rounded-2xl p-4 text-center border-2 ${diferenca >= 0
                            ? 'bg-emerald-500/10 border-emerald-500/40'
                            : 'bg-red-500/10 border-red-500/40'
                            }`}>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                              Diferença (Saída − Entrada)
                            </p>
                            <p className={`text-4xl font-black tracking-tight ${diferenca >= 0 ? 'text-emerald-400' : 'text-red-400'
                              }`}>
                              {diferenca >= 0 ? '+' : ''}{diferenca.toLocaleString('pt-BR')} kg
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Entrada: {pesoEntrada.toLocaleString('pt-BR')} kg • Saída: {pesoSaidaNum.toLocaleString('pt-BR')} kg
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Detalhes field */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Detalhes
                    </Label>
                    <Textarea
                      placeholder="Informações adicionais sobre a visita..."
                      value={detalhesSaida}
                      onChange={(e) => setDetalhesSaida(e.target.value)}
                      rows={3}
                      className="text-base"
                    />
                  </div>

                  {/* Ocorrência field */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Ocorrência
                    </Label>
                    <Textarea
                      placeholder="Registrar ocorrência ou incidente..."
                      value={ocorrenciaSaida}
                      onChange={(e) => setOcorrenciaSaida(e.target.value)}
                      rows={3}
                      className="text-base"
                    />
                  </div>
                </>
              )}

              {/* If already has detalhes/ocorrencia and is finalized, show them read-only */}
              {selectedRegistro.horarioSaida && (selectedRegistro.detalhes || selectedRegistro.ocorrencia) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="font-semibold text-sm">Registros Adicionais</span>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4 space-y-2.5">
                    {selectedRegistro.detalhes && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Detalhes</span>
                        <p className="text-sm text-foreground mt-0.5">{selectedRegistro.detalhes}</p>
                      </div>
                    )}
                    {selectedRegistro.ocorrencia && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Ocorrência</span>
                        <p className="text-sm text-foreground mt-0.5">{selectedRegistro.ocorrencia}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Registrar Saída button - only if not yet finalized */}
              {!selectedRegistro.horarioSaida && (
                <Button
                  onClick={handleRegistrarSaida}
                  className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white text-base font-semibold"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Registrar Saída
                </Button>
              )}

              {/* Status badge if already finalized */}
              {selectedRegistro.horarioSaida && (
                <div className="flex items-center justify-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-sm px-3 py-1">
                    Saída registrada às {selectedRegistro.horarioSaida}
                  </Badge>
                </div>
              )}

              {!selectedRegistro.inativo && (
                <div className="pt-2 border-t border-border/50 space-y-2">
                  <p className="text-xs text-muted-foreground text-center">
                    Auditoria: O registro original não pode ser modificado. Para corrigir, crie uma nova versão auditável.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => handleRefazer(selectedRegistro)}
                    className="w-full h-11 border-amber-500/30 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Refazer Registro (Corrigir Versão)
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
