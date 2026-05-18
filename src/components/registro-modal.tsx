'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import {
  CATEGORIAS_FLUXO,
  type CategoriaFluxo,
  type RegistroFluxo,
} from '@/lib/data';
import AutocompleteInput, { type AutocompleteSuggestion } from './autocomplete-input';
import SearchInput from './search-input';
import { toast } from 'sonner';

// Unified data structure for autocomplete — stores ALL available info
// regardless of which category it came from
interface UnifiedSuggestionData {
  name: string;       // person's name
  company: string;    // company name
  doc: string;        // RG/CPF
  plate: string;      // vehicle plate
  department: string; // department
  origin?: string;    // source origin ('cadastro')
}

// Maps unified data → form fields for each category
function mapToFormFields(categoria: CategoriaFluxo, data: UnifiedSuggestionData): Record<string, string> {
  const mapped: Record<string, string> = {};

  switch (categoria) {
    case 'entregas1':
      if (data.name) mapped.nome = data.name;
      if (data.company) mapped.empresa = data.company;
      if (data.doc) mapped.rgCpf = data.doc;
      break;
    case 'visitantes':
      if (data.name) mapped.nome = data.name;
      if (data.company) mapped.empresa = data.company;
      if (data.department) mapped.departamento = data.department;
      if (data.doc) mapped.rgCpf = data.doc;
      break;
    case 'prestadores':
      if (data.name) mapped.nome = data.name;
      if (data.company) mapped.empresa = data.company;
      if (data.department) mapped.departamento = data.department;
      if (data.doc) mapped.rgCpf = data.doc;
      break;
    case 'pesagem':
      if (data.name) mapped.motorista = data.name;
      if (data.company) mapped.empresa = data.company;
      if (data.plate) mapped.placa = data.plate;
      break;
    case 'entregas2':
      if (data.name) mapped.motorista = data.name;
      if (data.doc) mapped.cpfRg = data.doc;
      if (data.company) mapped.empresa = data.company;
      if (data.department) mapped.departamento = data.department;
      break;
    case 'coleta':
      if (data.name) mapped.motorista = data.name;
      if (data.doc) mapped.rgCpf = data.doc;
      if (data.plate) mapped.placa = data.plate;
      if (data.company) mapped.empresa = data.company;
      break;
    case 'movimentacao':
      if (data.name) mapped.nomeColaborador = data.name;
      if (data.doc) mapped.rgCpf = data.doc;
      if (data.department) mapped.autorizadoPor = data.department;
      break;
    case 'correspondencias':
      if (data.name) mapped.destinatario = data.name;
      if (data.company) mapped.remetente = data.company;
      if (data.department) mapped.departamento = data.department;
      break;
  }

  return mapped;
}

// Extract unified data from any RegistroFluxo
function extractUnifiedFromRecord(r: RegistroFluxo): UnifiedSuggestionData {
  const data: UnifiedSuggestionData = { name: '', company: '', doc: '', plate: '', department: '' };

  switch (r.categoria) {
    case 'entregas1':
      data.name = r.nome;
      data.company = r.empresa;
      data.doc = r.rgCpf;
      break;
    case 'visitantes':
    case 'prestadores':
      data.name = (r as any).nome || r.nomeEmpresa;
      data.company = (r as any).empresa || '';
      data.department = r.departamento;
      data.doc = r.rgCpf;
      break;
    case 'pesagem':
      data.company = r.empresa;
      data.plate = r.placa;
      data.name = r.motorista;
      break;
    case 'entregas2':
      data.name = r.motorista;
      data.doc = r.cpfRg;
      data.company = r.empresa;
      data.department = r.departamento;
      break;
    case 'coleta':
      data.doc = r.rgCpf;
      data.plate = r.placa;
      data.company = r.empresa;
      data.name = r.motorista;
      break;
    case 'movimentacao':
      data.name = r.nomeColaborador;
      data.doc = r.rgCpf;
      break;
    case 'correspondencias':
      data.name = r.destinatario;
      data.company = r.remetente;
      data.department = r.departamento;
      break;
  }

  return data;
}

// Merge data from multiple records with the same key (prefer more complete records)
function mergeUnified(existing: UnifiedSuggestionData, incoming: UnifiedSuggestionData): UnifiedSuggestionData {
  return {
    name: existing.name || incoming.name,
    company: existing.company || incoming.company,
    doc: existing.doc || incoming.doc,
    plate: existing.plate || incoming.plate,
    department: existing.department || incoming.department,
    origin: existing.origin || incoming.origin,
  };
}

interface RegistroModalProps {
  open: boolean;
  onClose: () => void;
  categoriaInicial?: CategoriaFluxo;
}

export default function RegistroModal({
  open,
  onClose,
  categoriaInicial,
}: RegistroModalProps) {
  const { addRegistroFluxo, pessoas, empresas, departamentos, ramais, registrosFluxo, user } = useAppStore();
  const [categoria, setCategoria] = useState<CategoriaFluxo>(
    categoriaInicial || 'entregas2'
  );
  const [formData, setFormData] = useState<Record<string, string>>(() => ({
    data: format(new Date(), 'dd/MM/yyyy'),
    horarioEntrada: format(new Date(), 'HH:mm'),
    porteiro: user?.nome || '',
  }));

  // ── Unified suggestion builders ──
  // All suggestions store data using UnifiedSuggestionData keys
  // so that selecting any suggestion works for any category

  const nameSuggestions = useMemo(() => {
    const map = new Map<string, { data: UnifiedSuggestionData; sublabel: string }>();

    // From pessoas (cadastros) — PRIMARY source with FULL data
    pessoas.forEach((f) => {
      if (!map.has(f.nome)) {
        map.set(f.nome, {
          data: {
            name: f.nome,
            company: f.empresa || '',
            doc: f.rgCpf || '',
            plate: f.placa || '',
            department: f.departamento || '',
            origin: 'cadastro',
          },
          sublabel: [
            f.tipo,
            f.empresa,
            f.cargo,
            f.departamento,
          ].filter(Boolean).join(' — ')
            || f.rgCpf
            || '',
        });
      }
    });

    // From ramais (cadastros) — adds person/sector names with ramal info
    ramais.forEach((r) => {
      if (!map.has(r.nome)) {
        map.set(r.nome, {
          data: { name: r.nome, company: '', doc: '', plate: '', department: r.departamento },
          sublabel: `${r.departamento} — Ramal ${r.ramal}`,
        });
      }
    });

    // From previous fluxo records — merge data for same names
    registrosFluxo.forEach((r) => {
      const unified = extractUnifiedFromRecord(r);
      const key = unified.name;
      if (!key) return;

      if (map.has(key)) {
        const existing = map.get(key)!;
        map.set(key, {
          data: mergeUnified(existing.data, unified),
          sublabel: existing.sublabel || unified.company,
        });
      } else {
        const sublabel = unified.company || unified.department || '';
        map.set(key, { data: unified, sublabel });
      }
    });

    return Array.from(map.entries()).map(([label, { data, sublabel }]) => ({
      label,
      sublabel: sublabel || undefined,
      data: data as unknown as Record<string, string>,
    }));
  }, [pessoas, ramais, registrosFluxo]);

  const empresaSuggestions = useMemo(() => {
    const map = new Map<string, { data: UnifiedSuggestionData; sublabel: string }>();

    // From empresas (seed data — still useful for suggestions)
    empresas.forEach((e) => {
      if (!map.has(e.nome)) {
        map.set(e.nome, {
          data: { name: '', company: e.nome, doc: '', plate: '', department: '', origin: 'cadastro' },
          sublabel: e.cnpj || '',
        });
      }
    });

    // From pessoas (cadastros) — empresa field is PRIMARY source
    pessoas.forEach((p) => {
      if (p.empresa && !map.has(p.empresa)) {
        map.set(p.empresa, {
          data: { name: p.nome, company: p.empresa, doc: p.rgCpf || '', plate: p.placa || '', department: p.departamento || '', origin: 'cadastro' },
          sublabel: p.nome || '',
        });
      } else if (p.empresa && map.has(p.empresa)) {
        const existing = map.get(p.empresa)!;
        map.set(p.empresa, {
          data: mergeUnified(existing.data, { name: p.nome, company: p.empresa, doc: p.rgCpf || '', plate: p.placa || '', department: p.departamento || '', origin: 'cadastro' }),
          sublabel: existing.sublabel,
        });
      }
    });

    // From previous records — associate empresa with motorista/nome
    registrosFluxo.forEach((r) => {
      const unified = extractUnifiedFromRecord(r);
      const key = unified.company;
      if (!key) return;

      if (map.has(key)) {
        const existing = map.get(key)!;
        map.set(key, {
          data: mergeUnified(existing.data, unified),
          sublabel: existing.sublabel,
        });
      } else {
        const sublabel = unified.name || '';
        map.set(key, { data: unified, sublabel });
      }
    });

    return Array.from(map.entries()).map(([label, { data, sublabel }]) => ({
      label,
      sublabel: sublabel || undefined,
      data: data as unknown as Record<string, string>,
    }));
  }, [empresas, pessoas, registrosFluxo]);

  const rgCpfSuggestions = useMemo(() => {
    const map = new Map<string, { data: UnifiedSuggestionData; sublabel: string }>();

    // From pessoas (cadastros) — RG/CPF field is a PRIMARY source
    pessoas.forEach((p) => {
      if (p.rgCpf) {
        if (!map.has(p.rgCpf)) {
          map.set(p.rgCpf, {
            data: { name: p.nome, company: p.empresa || '', doc: p.rgCpf, plate: p.placa || '', department: p.departamento || '', origin: 'cadastro' },
            sublabel: p.nome,
          });
        } else {
          const existing = map.get(p.rgCpf)!;
          map.set(p.rgCpf, {
            data: mergeUnified(existing.data, { name: p.nome, company: p.empresa || '', doc: p.rgCpf, plate: p.placa || '', department: p.departamento || '', origin: 'cadastro' }),
            sublabel: existing.sublabel,
          });
        }
      }
    });

    registrosFluxo.forEach((r) => {
      const unified = extractUnifiedFromRecord(r);
      const doc = unified.doc;
      if (!doc) return;

      if (map.has(doc)) {
        const existing = map.get(doc)!;
        map.set(doc, {
          data: mergeUnified(existing.data, unified),
          sublabel: existing.sublabel,
        });
      } else {
        const sublabel = unified.name || '';
        map.set(doc, { data: unified, sublabel });
      }
    });

    return Array.from(map.entries()).map(([label, { data, sublabel }]) => ({
      label,
      sublabel: sublabel || undefined,
      data: data as unknown as Record<string, string>,
    }));
  }, [pessoas, registrosFluxo]);

  const placaSuggestions = useMemo(() => {
    const map = new Map<string, { data: UnifiedSuggestionData; sublabel: string }>();

    // From pessoas (cadastros) — placa field is a PRIMARY source
    pessoas.forEach((p) => {
      if (p.placa) {
        if (!map.has(p.placa)) {
          map.set(p.placa, {
            data: { name: p.nome, company: p.empresa || '', doc: p.rgCpf || '', plate: p.placa, department: p.departamento || '' },
            sublabel: [p.nome, p.empresa].filter(Boolean).join(' — '),
          });
        } else {
          const existing = map.get(p.placa)!;
          map.set(p.placa, {
            data: mergeUnified(existing.data, { name: p.nome, company: p.empresa || '', doc: p.rgCpf || '', plate: p.placa, department: p.departamento || '' }),
            sublabel: existing.sublabel,
          });
        }
      }
    });

    registrosFluxo.forEach((r) => {
      const unified = extractUnifiedFromRecord(r);
      const plate = unified.plate;
      if (!plate) return;

      if (map.has(plate)) {
        const existing = map.get(plate)!;
        map.set(plate, {
          data: mergeUnified(existing.data, unified),
          sublabel: existing.sublabel,
        });
      } else {
        const sublabel = [unified.name, unified.company].filter(Boolean).join(' — ');
        map.set(plate, { data: unified, sublabel });
      }
    });

    return Array.from(map.entries()).map(([label, { data, sublabel }]) => ({
      label,
      sublabel: sublabel || undefined,
      data: data as unknown as Record<string, string>,
    }));
  }, [pessoas, registrosFluxo]);

  // ── Departamento suggestions from cadastros + pessoas (dynamic) ──
  const departamentoSuggestions = useMemo(() => {
    const names = new Set<string>();
    departamentos.forEach((d) => names.add(d.nome));
    // Also collect department names from pessoas cadastros
    pessoas.forEach((p) => {
      if (p.departamento) names.add(p.departamento);
    });
    // Also collect department names from previous fluxo records
    registrosFluxo.forEach((r) => {
      const unified = extractUnifiedFromRecord(r);
      if (unified.department) names.add(unified.department);
    });
    return Array.from(names).sort().map((name) => ({
      label: name,
      sublabel: departamentos.find((d) => d.nome === name)?.responsavel
        ? `Resp: ${departamentos.find((d) => d.nome === name)?.responsavel}`
        : undefined,
      data: { name: '', company: '', doc: '', plate: '', department: name } as unknown as Record<string, string>,
    }));
  }, [departamentos, pessoas, registrosFluxo]);

  // ── Ramal suggestions from cadastros ──
  const ramalSuggestions = useMemo(() => {
    return ramais.map((r) => ({
      label: r.nome,
      sublabel: `${r.departamento} — Ramal ${r.ramal}`,
      data: { name: r.nome, company: '', doc: '', plate: '', department: r.departamento } as unknown as Record<string, string>,
    }));
  }, [ramais]);

  // ── Handlers ──

  const handleCategoriaChange = (v: string) => {
    setCategoria(v as CategoriaFluxo);
    setFormData({
      data: format(new Date(), 'dd/MM/yyyy'),
      horarioEntrada: format(new Date(), 'HH:mm'),
      porteiro: user?.nome || '',
    });
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // When user selects an autocomplete suggestion, map unified data → current category fields
  // Always overwrite because the user explicitly chose a suggestion
  const handleAutoSelect = (suggestionData: Record<string, string>) => {
    const unified = suggestionData as unknown as UnifiedSuggestionData;
    const mapped = mapToFormFields(categoria, unified);

    setFormData((prev) => ({
      ...prev,
      ...mapped,
      // Preserve auto date/time
      data: prev.data || format(new Date(), 'dd/MM/yyyy'),
      horarioEntrada: prev.horarioEntrada || format(new Date(), 'HH:mm'),
    }));
  };

  const handleSubmit = () => {
    const id = `fl_${Date.now()}`;
    let registro: RegistroFluxo;

    switch (categoria) {
      case 'entregas1':
        if (!formData.nome || !formData.empresa) {
          toast.error('Preencha os campos obrigatórios');
          return;
        }
        registro = {
          id,
          categoria: 'entregas1',
          data: formData.data || format(new Date(), 'dd/MM/yyyy'),
          horarioEntrada: formData.horarioEntrada || format(new Date(), 'HH:mm'),
          nome: formData.nome,
          empresa: formData.empresa,
          rgCpf: formData.rgCpf || '',
          horarioSaida: '',
        };
        break;
      case 'visitantes':
        if (!formData.nome || !formData.empresa || !formData.departamento) {
          toast.error('Preencha os campos obrigatórios');
          return;
        }
        registro = {
          id,
          categoria: 'visitantes',
          nome: formData.nome,
          empresa: formData.empresa,
          nomeEmpresa: `${formData.nome} / ${formData.empresa}`,
          departamento: formData.departamento,
          rgCpf: formData.rgCpf || '',
          data: formData.data || format(new Date(), 'dd/MM/yyyy'),
          horarioEntrada: formData.horarioEntrada || format(new Date(), 'HH:mm'),
          horarioSaida: '',
        };
        break;
      case 'prestadores':
        if (!formData.nome || !formData.empresa || !formData.departamento) {
          toast.error('Preencha os campos obrigatórios');
          return;
        }
        registro = {
          id,
          categoria: 'prestadores',
          nome: formData.nome,
          empresa: formData.empresa,
          nomeEmpresa: `${formData.nome} / ${formData.empresa}`,
          departamento: formData.departamento,
          rgCpf: formData.rgCpf || '',
          data: formData.data || format(new Date(), 'dd/MM/yyyy'),
          horarioEntrada: formData.horarioEntrada || format(new Date(), 'HH:mm'),
          horarioSaida: '',
        };
        break;
      case 'pesagem':
        if (!formData.empresa || !formData.motorista) {
          toast.error('Preencha os campos obrigatórios');
          return;
        }
        registro = {
          id,
          categoria: 'pesagem',
          data: formData.data || format(new Date(), 'dd/MM/yyyy'),
          empresa: formData.empresa,
          placa: formData.placa || '',
          motorista: formData.motorista,
          horarioEntrada: formData.horarioEntrada || format(new Date(), 'HH:mm'),
          pesoEntrada: Number(formData.pesoEntrada) || 0,
          horarioSaida: '',
          pesoSaida: 0,
          porteiroEntrada: user?.nome || '',
        };
        break;
      case 'entregas2':
        if (!formData.motorista || !formData.empresa) {
          toast.error('Preencha os campos obrigatórios');
          return;
        }
        registro = {
          id,
          categoria: 'entregas2',
          data: formData.data || format(new Date(), 'dd/MM/yyyy'),
          horarioEntrada: formData.horarioEntrada || format(new Date(), 'HH:mm'),
          motorista: formData.motorista,
          cpfRg: formData.cpfRg || '',
          empresa: formData.empresa,
          departamento: formData.departamento || '',
          horarioSaida: '',
        };
        break;
      case 'coleta':
        if (!formData.empresa || !formData.motorista) {
          toast.error('Preencha os campos obrigatórios');
          return;
        }
        registro = {
          id,
          categoria: 'coleta',
          rgCpf: formData.rgCpf || '',
          horarioEntrada: formData.horarioEntrada || format(new Date(), 'HH:mm'),
          placa: formData.placa || '',
          empresa: formData.empresa,
          motorista: formData.motorista,
          data: formData.data || format(new Date(), 'dd/MM/yyyy'),
          horarioSaida: '',
        };
        break;
      case 'movimentacao':
        if (!formData.nomeColaborador) {
          toast.error('Preencha o nome do colaborador');
          return;
        }
        registro = {
          id,
          categoria: 'movimentacao',
          nomeColaborador: formData.nomeColaborador,
          rgCpf: formData.rgCpf || '',
          horarioEntrada: formData.horarioEntrada || format(new Date(), 'HH:mm'),
          horarioSaida: '',
          autorizadoPor: formData.autorizadoPor || '',
          assinaturaColaborador: formData.assinaturaColaborador || '',
          porteiro: formData.porteiro || '',
          data: formData.data || format(new Date(), 'dd/MM/yyyy'),
        };
        break;
      case 'correspondencias':
        if (!formData.destinatario) {
          toast.error('Preencha o destinatário');
          return;
        }
        registro = {
          id,
          categoria: 'correspondencias',
          destinatario: formData.destinatario,
          remetente: formData.remetente || '',
          tipo: formData.tipo || '',
          departamento: formData.departamento || '',
          horarioEntrada: formData.horarioEntrada || format(new Date(), 'HH:mm'),
          horarioSaida: '',
          quemRetirou: '',
          porteiro: formData.porteiro || user?.nome || '',
          data: formData.data || format(new Date(), 'dd/MM/yyyy'),
        };
        break;
      default:
        return;
    }

    addRegistroFluxo(registro);
    toast.success('Registro adicionado com sucesso!');
    onClose();
  };

  const renderFields = () => {
    switch (categoria) {
      case 'entregas1':
        return (
          <>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input value={formData.data || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Horário Entrada</Label>
              <Input value={formData.horarioEntrada || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Nome *</Label>
              <AutocompleteInput
                value={formData.nome || ''}
                onChange={(v) => updateField('nome', v)}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={nameSuggestions}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa *</Label>
              <AutocompleteInput
                value={formData.empresa || ''}
                onChange={(v) => updateField('empresa', v)}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={empresaSuggestions}
                placeholder="Selecione ou digite a empresa"
              />
            </div>
            <div className="space-y-2">
              <Label>RG/CPF</Label>
              <AutocompleteInput
                value={formData.rgCpf || ''}
                onChange={(v) => updateField('rgCpf', v)}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={rgCpfSuggestions}
                placeholder="00.000.000-0"
              />
            </div>
          </>
        );
      case 'visitantes':
        return (
          <>
            <div className="space-y-2">
              <Label>Nome *</Label>
              <SearchInput
                value={formData.nome || ''}
                onChange={(v) => updateField('nome', v)}
                onSelect={handleAutoSelect}
                suggestions={nameSuggestions}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa *</Label>
              <SearchInput
                value={formData.empresa || ''}
                onChange={(v) => updateField('empresa', v)}
                onSelect={handleAutoSelect}
                suggestions={empresaSuggestions}
                placeholder="Selecione ou digite a empresa"
              />
            </div>
            <div className="space-y-2">
              <Label>Departamento *</Label>
              <Select
                value={formData.departamento || ''}
                onValueChange={(v) => updateField('departamento', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  {[...departamentos]
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map((d) => (
                      <SelectItem key={d.id || d.nome} value={d.nome}>
                        {d.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>RG/CPF</Label>
              <SearchInput
                value={formData.rgCpf || ''}
                onChange={(v) => updateField('rgCpf', v)}
                onSelect={handleAutoSelect}
                suggestions={rgCpfSuggestions}
                placeholder="00.000.000-0"
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input value={formData.data || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Horário Entrada</Label>
              <Input value={formData.horarioEntrada || ''} readOnly className="bg-muted" />
            </div>
          </>
        );
      case 'prestadores':
        return (
          <>
            <div className="space-y-2">
              <Label>Nome *</Label>
              <SearchInput
                value={formData.nome || ''}
                onChange={(v) => updateField('nome', v)}
                onSelect={handleAutoSelect}
                suggestions={nameSuggestions}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa *</Label>
              <SearchInput
                value={formData.empresa || ''}
                onChange={(v) => updateField('empresa', v)}
                onSelect={handleAutoSelect}
                suggestions={empresaSuggestions}
                placeholder="Selecione ou digite a empresa"
              />
            </div>
            <div className="space-y-2">
              <Label>Departamento *</Label>
              <Select
                value={formData.departamento || ''}
                onValueChange={(v) => updateField('departamento', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  {[...departamentos]
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map((d) => (
                      <SelectItem key={d.id || d.nome} value={d.nome}>
                        {d.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>RG/CPF</Label>
              <SearchInput
                value={formData.rgCpf || ''}
                onChange={(v) => updateField('rgCpf', v)}
                onSelect={handleAutoSelect}
                suggestions={rgCpfSuggestions}
                placeholder="00.000.000-0"
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input value={formData.data || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Horário Entrada</Label>
              <Input value={formData.horarioEntrada || ''} readOnly className="bg-muted" />
            </div>
          </>
        );
      case 'pesagem':
        return (
          <>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input value={formData.data || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Empresa *</Label>
              <SearchInput
                value={formData.empresa || ''}
                onChange={(v) => updateField('empresa', v)}
                onSelect={handleAutoSelect}
                suggestions={empresaSuggestions}
                placeholder="Selecione ou digite a empresa"
              />
            </div>
            <div className="space-y-2">
              <Label>Placa</Label>
              <AutocompleteInput
                value={formData.placa || ''}
                onChange={(v) => updateField('placa', v.toUpperCase())}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={placaSuggestions}
                placeholder="ABC-1D23"
              />
            </div>
            <div className="space-y-2">
              <Label>Motorista *</Label>
              <SearchInput
                value={formData.motorista || ''}
                onChange={(v) => updateField('motorista', v)}
                onSelect={handleAutoSelect}
                suggestions={nameSuggestions}
                placeholder="Nome do motorista"
              />
            </div>
            <div className="space-y-2">
              <Label>Horário Entrada</Label>
              <Input value={formData.horarioEntrada || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Peso de Entrada (kg)</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.pesoEntrada || ''}
                onChange={(e) => updateField('pesoEntrada', e.target.value)}
              />
            </div>
          </>
        );
      case 'entregas2':
        return (
          <>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input value={formData.data || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Horário Entrada</Label>
              <Input value={formData.horarioEntrada || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Motorista *</Label>
              <SearchInput
                value={formData.motorista || ''}
                onChange={(v) => updateField('motorista', v)}
                onSelect={handleAutoSelect}
                suggestions={nameSuggestions}
                placeholder="Nome do motorista"
              />
            </div>
            <div className="space-y-2">
              <Label>CPF/RG</Label>
              <SearchInput
                value={formData.cpfRg || ''}
                onChange={(v) => updateField('cpfRg', v)}
                onSelect={handleAutoSelect}
                suggestions={rgCpfSuggestions}
                placeholder="00.000.000-0"
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa *</Label>
              <SearchInput
                value={formData.empresa || ''}
                onChange={(v) => updateField('empresa', v)}
                onSelect={handleAutoSelect}
                suggestions={empresaSuggestions}
                placeholder="Selecione ou digite a empresa"
              />
            </div>
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select
                value={formData.departamento || ''}
                onValueChange={(v) => updateField('departamento', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  {[...departamentos]
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map((d) => (
                      <SelectItem key={d.id || d.nome} value={d.nome}>
                        {d.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case 'coleta':
        return (
          <>
            <div className="space-y-2">
              <Label>RG/CPF</Label>
              <SearchInput
                value={formData.rgCpf || ''}
                onChange={(v) => updateField('rgCpf', v)}
                onSelect={handleAutoSelect}
                suggestions={rgCpfSuggestions}
                placeholder="00.000.000-0"
              />
            </div>
            <div className="space-y-2">
              <Label>Horário Entrada</Label>
              <Input value={formData.horarioEntrada || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Placa</Label>
              <AutocompleteInput
                value={formData.placa || ''}
                onChange={(v) => updateField('placa', v.toUpperCase())}
                onSelect={(s) => handleAutoSelect(s.data || {})}
                suggestions={placaSuggestions}
                placeholder="ABC-1D23"
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa *</Label>
              <SearchInput
                value={formData.empresa || ''}
                onChange={(v) => updateField('empresa', v)}
                onSelect={handleAutoSelect}
                suggestions={empresaSuggestions}
                placeholder="Selecione ou digite a empresa"
              />
            </div>
            <div className="space-y-2">
              <Label>Motorista *</Label>
              <SearchInput
                value={formData.motorista || ''}
                onChange={(v) => updateField('motorista', v)}
                onSelect={handleAutoSelect}
                suggestions={nameSuggestions}
                placeholder="Nome do motorista"
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input value={formData.data || ''} readOnly className="bg-muted" />
            </div>
          </>
        );
      case 'movimentacao':
        return (
          <>
            <div className="space-y-2">
              <Label>Nome do Colaborador *</Label>
              <SearchInput
                value={formData.nomeColaborador || ''}
                onChange={(v) => updateField('nomeColaborador', v)}
                onSelect={handleAutoSelect}
                suggestions={nameSuggestions}
                placeholder="Nome completo do colaborador"
              />
            </div>
            <div className="space-y-2">
              <Label>RG/CPF</Label>
              <SearchInput
                value={formData.rgCpf || ''}
                onChange={(v) => updateField('rgCpf', v)}
                onSelect={handleAutoSelect}
                suggestions={rgCpfSuggestions}
                placeholder="00.000.000-0"
              />
            </div>
            <div className="space-y-2">
              <Label>Horário Entrada</Label>
              <Input value={formData.horarioEntrada || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Autorizado Por</Label>
              <SearchInput
                value={formData.autorizadoPor || ''}
                onChange={(v) => updateField('autorizadoPor', v)}
                onSelect={handleAutoSelect}
                suggestions={nameSuggestions}
                placeholder="Nome de quem autorizou"
              />
            </div>
            <div className="space-y-2">
              <Label>Assinatura Colaborador</Label>
              <Input
                value={formData.assinaturaColaborador || ''}
                onChange={(e) => updateField('assinaturaColaborador', e.target.value)}
                placeholder="Assinatura do colaborador"
              />
            </div>
            <div className="space-y-2">
              <Label>Porteiro</Label>
              <Input
                value={formData.porteiro || user?.nome || ''}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input value={formData.data || ''} readOnly className="bg-muted" />
            </div>
          </>
        );
      case 'correspondencias':
        return (
          <>
            <div className="space-y-2">
              <Label>Destinatário *</Label>
              <SearchInput
                value={formData.destinatario || ''}
                onChange={(v) => updateField('destinatario', v)}
                onSelect={handleAutoSelect}
                suggestions={nameSuggestions}
                placeholder="Nome de quem vai receber"
              />
            </div>
            <div className="space-y-2">
              <Label>Remetente</Label>
              <SearchInput
                value={formData.remetente || ''}
                onChange={(v) => updateField('remetente', v)}
                onSelect={handleAutoSelect}
                suggestions={empresaSuggestions}
                placeholder="Quem enviou a correspondência"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.tipo || ''}
                onValueChange={(v) => updateField('tipo', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Carta">Carta</SelectItem>
                  <SelectItem value="Pacote">Pacote</SelectItem>
                  <SelectItem value="Encomenda">Encomenda</SelectItem>
                  <SelectItem value="Documento">Documento</SelectItem>
                  <SelectItem value="Revista">Revista</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select
                value={formData.departamento || ''}
                onValueChange={(v) => updateField('departamento', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  {[...departamentos]
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map((d) => (
                      <SelectItem key={d.id || d.nome} value={d.nome}>
                        {d.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Horário Entrada</Label>
              <Input value={formData.horarioEntrada || ''} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Porteiro</Label>
              <Input
                value={formData.porteiro || user?.nome || ''}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input value={formData.data || ''} readOnly className="bg-muted" />
            </div>
          </>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle>Novo Registro</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={categoria}
              onValueChange={handleCategoriaChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS_FLUXO.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3">{renderFields()}</div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700">
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
