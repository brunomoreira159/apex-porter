'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Search,
  Users,
  UserPlus,
  Briefcase,
  Truck,
  HeadphonesIcon,
  Package,
  Edit2,
  X,
  Check,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import { TIPOS_PESSOA, type TipoPessoa, type Pessoa } from '@/lib/data';
import { toast } from 'sonner';
import AutocompleteInput from './autocomplete-input';
import { PESSOAS_INICIAIS, REGISTROS_FLUXO_INICIAIS } from '@/lib/seed-data';

const TIPO_ICONS: Record<TipoPessoa, React.ReactNode> = {
  Colaborador: <Briefcase className="h-3.5 w-3.5" />,
  Visitante: <Users className="h-3.5 w-3.5" />,
  Prestador: <HeadphonesIcon className="h-3.5 w-3.5" />,
  Entregador: <Package className="h-3.5 w-3.5" />,
  Motorista: <Truck className="h-3.5 w-3.5" />,
  Outro: <UserPlus className="h-3.5 w-3.5" />,
};

const TIPO_COLORS: Record<TipoPessoa, string> = {
  Colaborador: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Visitante: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Prestador: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Entregador: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Motorista: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Outro: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

interface FormState {
  nome: string;
  tipo: TipoPessoa;
  empresa: string;
  departamento: string;
  cargo: string;
  rgCpf: string;
  placa: string;
  telefone: string;
  email: string;
}

const EMPTY_FORM: FormState = {
  nome: '',
  tipo: 'Colaborador',
  empresa: '',
  departamento: '',
  cargo: '',
  rgCpf: '',
  placa: '',
  telefone: '',
  email: '',
};

export default function CadastrosPage() {
  const { pessoas, addPessoa, removePessoa, updatePessoa, departamentos, registrosFluxo } = useAppStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState<TipoPessoa | 'todos'>('todos');
  const [showFilters, setShowFilters] = useState(false);

  // ── Unified suggestions ──
  const { nameSuggestions, empresaSuggestions, rgCpfSuggestions } = useMemo(() => {
    const namesMap = new Map<string, { label: string; sublabel?: string; data: any }>();
    const empresasMap = new Map<string, { label: string; sublabel?: string; data: any }>();
    const rgCpfMap = new Map<string, { label: string; sublabel?: string; data: any }>();

    // 0. Fallback from seed data (PESSOAS_INICIAIS)
    (PESSOAS_INICIAIS || []).forEach((p) => {
      const u = {
        name: p.nome || '',
        tipo: p.tipo || 'Colaborador',
        company: p.empresa || '',
        department: p.departamento || '',
        doc: p.rgCpf || '',
        plate: p.placa || '',
        phone: p.telefone || '',
        email: p.email || '',
      };

      if (u.name && !namesMap.has(u.name)) {
        namesMap.set(u.name, {
          label: u.name,
          sublabel: [u.tipo, u.company, u.department].filter(Boolean).join(' — '),
          data: u,
        });
      }

      if (u.company && !empresasMap.has(u.company)) {
        empresasMap.set(u.company, {
          label: u.company,
          sublabel: 'Empresa',
          data: u,
        });
      }

      if (u.doc && !rgCpfMap.has(u.doc)) {
        rgCpfMap.set(u.doc, {
          label: u.doc,
          sublabel: u.name,
          data: u,
        });
      }
    });

    // 1. From active pessoas database
    (pessoas || []).forEach((p) => {
      const u = {
        name: p.nome || '',
        tipo: p.tipo || 'Colaborador',
        company: p.empresa || '',
        department: p.departamento || '',
        doc: p.rgCpf || '',
        plate: p.placa || '',
        phone: p.telefone || '',
        email: p.email || '',
      };

      if (u.name) {
        namesMap.set(u.name, {
          label: u.name,
          sublabel: [u.tipo, u.company, u.department].filter(Boolean).join(' — '),
          data: u,
        });
      }

      if (u.company) {
        empresasMap.set(u.company, {
          label: u.company,
          sublabel: 'Empresa cadastrada',
          data: u,
        });
      }

      if (u.doc) {
        rgCpfMap.set(u.doc, {
          label: u.doc,
          sublabel: u.name,
          data: u,
        });
      }
    });

    // 2. From historical flow records (registrosFluxo)
    (registrosFluxo || []).forEach((r) => {
      let name = '';
      let doc = '';
      let company = '';
      let department = '';
      let plate = '';

      switch (r.categoria) {
        case 'entregas1':
          name = r.nome;
          company = r.empresa;
          doc = r.rgCpf;
          break;
        case 'visitantes':
        case 'prestadores':
          name = (r as any).nome || '';
          company = (r as any).empresa || '';
          department = r.departamento;
          doc = r.rgCpf;
          break;
        case 'pesagem':
          company = r.empresa;
          plate = r.placa;
          name = r.motorista;
          doc = r.rgCpf;
          break;
        case 'entregas2':
          name = r.motorista;
          doc = r.cpfRg;
          company = r.empresa;
          department = r.departamento;
          break;
        case 'coleta':
          doc = r.rgCpf;
          plate = r.placa;
          company = r.empresa;
          name = r.motorista;
          break;
        case 'movimentacao':
          name = r.nomeColaborador;
          doc = r.rgCpf;
          break;
        case 'correspondencias':
          name = r.destinatario;
          company = r.remetente;
          department = r.departamento;
          break;
      }

      if (!name) return;

      const u = {
        name,
        tipo: r.categoria === 'visitantes' ? 'Visitante' : r.categoria === 'prestadores' ? 'Prestador' : 'Outro',
        company,
        department,
        doc,
        plate,
        phone: '',
        email: '',
      };

      if (!namesMap.has(name)) {
        namesMap.set(name, {
          label: name,
          sublabel: [u.tipo, u.company, department].filter(Boolean).join(' — '),
          data: u,
        });
      } else {
        const existing = namesMap.get(name)!;
        existing.data = {
          ...u,
          ...existing.data,
          company: existing.data.company || company,
          department: existing.data.department || department,
          doc: existing.data.doc || doc,
          plate: existing.data.plate || plate,
        };
      }

      if (company) {
        empresasMap.set(company, {
          label: company,
          sublabel: name,
          data: u,
        });
      }

      if (doc) {
        rgCpfMap.set(doc, {
          label: doc,
          sublabel: name,
          data: u,
        });
      }
    });

    return {
      nameSuggestions: Array.from(namesMap.values()),
      empresaSuggestions: Array.from(empresasMap.values()),
      rgCpfSuggestions: Array.from(rgCpfMap.values()),
    };
  }, [pessoas, registrosFluxo]);

  const handleAutoSelect = (suggestionData: any) => {
    if (!suggestionData) return;
    setForm((prev) => ({
      ...prev,
      nome: suggestionData.name || prev.nome,
      tipo: (suggestionData.tipo as TipoPessoa) || prev.tipo,
      empresa: suggestionData.company || prev.empresa,
      departamento: suggestionData.department || prev.departamento,
      rgCpf: suggestionData.doc || prev.rgCpf,
      placa: suggestionData.plate || prev.placa,
      telefone: suggestionData.phone || prev.telefone,
      email: suggestionData.email || prev.email,
    }));
  };

  // Filtered list
  const filteredPessoas = useMemo(() => {
    let list = pessoas;
    if (filterTipo !== 'todos') {
      list = list.filter((p) => p.tipo === filterTipo);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          p.empresa.toLowerCase().includes(q) ||
          p.rgCpf.toLowerCase().includes(q) ||
          p.departamento.toLowerCase().includes(q) ||
          p.cargo.toLowerCase().includes(q) ||
          p.placa.toLowerCase().includes(q)
      );
    }
    return list;
  }, [pessoas, search, filterTipo]);

  const openNewDialog = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEditDialog = (pessoa: Pessoa) => {
    setEditingId(pessoa.id);
    setForm({
      nome: pessoa.nome,
      tipo: pessoa.tipo || 'Colaborador',
      empresa: pessoa.empresa || '',
      departamento: pessoa.departamento || '',
      cargo: pessoa.cargo || '',
      rgCpf: pessoa.rgCpf || '',
      placa: pessoa.placa || '',
      telefone: pessoa.telefone || '',
      email: pessoa.email || '',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (!form.empresa.trim()) {
      toast.error('Empresa é obrigatória');
      return;
    }
    if (!form.departamento.trim()) {
      toast.error('Departamento é obrigatório');
      return;
    }
    if (!form.rgCpf.trim()) {
      toast.error('RG / CPF é obrigatório');
      return;
    }

    if (editingId) {
      updatePessoa({
        id: editingId,
        nome: form.nome.trim(),
        tipo: form.tipo,
        empresa: form.empresa.trim(),
        departamento: form.departamento.trim(),
        cargo: form.cargo.trim(),
        rgCpf: form.rgCpf.trim(),
        placa: form.placa.trim().toUpperCase(),
        telefone: form.telefone.trim(),
        email: form.email.trim(),
      });
      toast.success('Pessoa atualizada!');
    } else {
      addPessoa({
        id: `pes_${Date.now()}`,
        nome: form.nome.trim(),
        tipo: form.tipo,
        empresa: form.empresa.trim(),
        departamento: form.departamento.trim(),
        cargo: form.cargo.trim(),
        rgCpf: form.rgCpf.trim(),
        placa: form.placa.trim().toUpperCase(),
        telefone: form.telefone.trim(),
        email: form.email.trim(),
      });
      toast.success('Pessoa cadastrada!');
    }

    setDialogOpen(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  };

  const updateForm = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Summary counts
  const countByTipo = useMemo(() => {
    const counts: Record<string, number> = { total: pessoas.length };
    pessoas.forEach((p) => {
      counts[p.tipo] = (counts[p.tipo] || 0) + 1;
    });
    return counts;
  }, [pessoas]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-6 pb-24 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            Cadastro de Pessoas
          </h2>
          <p className="text-sm text-muted-foreground">
            {countByTipo.total} pessoa{countByTipo.total !== 1 ? 's' : ''} cadastrada{countByTipo.total !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={openNewDialog}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <UserPlus className="h-4 w-4 mr-1" />
          Nova Pessoa
        </Button>
      </div>

      {/* Type chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterTipo('todos')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            filterTipo === 'todos'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Todos ({countByTipo.total})
        </button>
        {TIPOS_PESSOA.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilterTipo(t.value)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filterTipo === t.value
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {TIPO_ICONS[t.value]}
            {t.label} ({countByTipo[t.value] || 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, empresa, RG/CPF, placa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* People list */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredPessoas.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12 text-muted-foreground"
            >
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {search || filterTipo !== 'todos'
                  ? 'Nenhuma pessoa encontrada com os filtros aplicados'
                  : 'Nenhuma pessoa cadastrada ainda'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={openNewDialog}
                className="mt-3"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Cadastrar Pessoa
              </Button>
            </motion.div>
          )}

          {filteredPessoas.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    {/* Type indicator stripe */}
                    <div className={`w-1.5 shrink-0 ${TIPO_STRIPE_COLORS[p.tipo] || 'bg-gray-400'}`} />
                    <div className="flex-1 p-3 flex items-center justify-between gap-3 min-w-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-medium truncate">{p.nome}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${TIPO_COLORS[p.tipo]}`}>
                            {TIPO_ICONS[p.tipo]}
                            {p.tipo}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          {/* Main info line */}
                          <p className="truncate">
                            {[p.empresa, p.departamento, p.cargo].filter(Boolean).join(' • ')}
                          </p>
                          {/* Secondary info line */}
                          <p className="truncate">
                            {[p.rgCpf && `Doc: ${p.rgCpf}`, p.placa && `Placa: ${p.placa}`, p.telefone && `Tel: ${p.telefone}`].filter(Boolean).join(' • ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-emerald-600 hover:bg-emerald/10"
                          onClick={() => openEditDialog(p)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            removePessoa(p.id);
                            toast.success('Pessoa removida');
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingId ? (
                <>
                  <Edit2 className="h-5 w-5 text-emerald-600" />
                  Editar Pessoa
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 text-emerald-600" />
                  Nova Pessoa
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* Nome */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nome completo *</Label>
              <AutocompleteInput
                value={form.nome}
                onChange={(v) => updateForm('nome', v)}
                onSelect={(s) => handleAutoSelect(s.data)}
                suggestions={nameSuggestions}
                placeholder="Nome da pessoa"
              />
            </div>

            {/* Tipo */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tipo *</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) => updateForm('tipo', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_PESSOA.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2">
                        {TIPO_ICONS[t.value]}
                        {t.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Empresa */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Empresa *</Label>
              <AutocompleteInput
                value={form.empresa}
                onChange={(v) => updateForm('empresa', v)}
                onSelect={(s) => handleAutoSelect(s.data)}
                suggestions={empresaSuggestions}
                placeholder="Nome da empresa"
              />
            </div>

            {/* Departamento */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Departamento *</Label>
              <Select
                value={form.departamento}
                onValueChange={(v) => updateForm('departamento', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departamentos.map((dep) => (
                    <SelectItem key={dep.id} value={dep.nome}>
                      {dep.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Selecione acima o departamento correspondente
              </p>
            </div>

            {/* RG/CPF */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">RG / CPF *</Label>
              <AutocompleteInput
                value={form.rgCpf}
                onChange={(v) => updateForm('rgCpf', v)}
                onSelect={(s) => handleAutoSelect(s.data)}
                suggestions={rgCpfSuggestions}
                placeholder="00.000.000-0"
              />
            </div>

            {/* Placa */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Placa do Veículo</Label>
              <Input
                placeholder="ABC-1D23"
                value={form.placa}
                onChange={(e) => updateForm('placa', e.target.value.toUpperCase())}
              />
            </div>

            {/* Telefone */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Telefone</Label>
              <Input
                placeholder="(00) 00000-0000"
                value={form.telefone}
                onChange={(e) => updateForm('telefone', e.target.value)}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Email</Label>
              <Input
                type="email"
                placeholder="email@empresa.com"
                value={form.email}
                onChange={(e) => updateForm('email', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
              {editingId ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Atualizar
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Cadastrar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

const TIPO_STRIPE_COLORS: Record<TipoPessoa, string> = {
  Colaborador: 'bg-blue-500',
  Visitante: 'bg-purple-500',
  Prestador: 'bg-amber-500',
  Entregador: 'bg-emerald-500',
  Motorista: 'bg-orange-500',
  Outro: 'bg-gray-500',
};
