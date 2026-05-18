'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

export interface SearchSuggestion {
  label: string;
  sublabel?: string;
  data: Record<string, string>;
}

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (data: Record<string, string>) => void;
  suggestions: SearchSuggestion[];
  placeholder?: string;
  className?: string;
}

export default function SearchInput({
  value,
  onChange,
  onSelect,
  suggestions,
  placeholder,
  className,
}: SearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredList, setFilteredList] = useState<SearchSuggestion[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSearch = (showToast = false) => {
    const search = value.toLowerCase().trim();

    if (search.length < 3) {
      if (showToast) {
        toast.info('Digite ao menos 3 caracteres para pesquisar');
      }
      setIsOpen(false);
      return;
    }

    const filtered = suggestions.filter((s) => {
      const nameMatch = s.label?.toLowerCase().includes(search);
      const sublabelMatch = s.sublabel?.toLowerCase().includes(search);
      const docMatch = s.data?.doc?.toLowerCase().includes(search);
      const companyMatch = s.data?.company?.toLowerCase().includes(search);
      return nameMatch || sublabelMatch || docMatch || companyMatch;
    });

    // Remove duplicates
    const unique = filtered.filter(
      (s, i, arr) => arr.findIndex((x) => x.label === s.label && x.data?.doc === s.data?.doc) === i
    );

    // Sort: registered people (cadastro) first, then alphabetical
    const sorted = unique.sort((a, b) => {
      const aReg = a.data?.origin === 'cadastro' ? 1 : 0;
      const bReg = b.data?.origin === 'cadastro' ? 1 : 0;
      if (aReg !== bReg) return bReg - aReg;
      return a.label.localeCompare(b.label);
    });

    setFilteredList(sorted.slice(0, 20));
    setIsOpen(true);
  };

  // Keep filtered suggestions in sync as value or suggestions change
  useEffect(() => {
    const search = value.toLowerCase().trim();
    if (search.length < 3) {
      setIsOpen(false);
      return;
    }

    if (isOpen) {
      const filtered = suggestions.filter((s) => {
        const nameMatch = s.label?.toLowerCase().includes(search);
        const sublabelMatch = s.sublabel?.toLowerCase().includes(search);
        const docMatch = s.data?.doc?.toLowerCase().includes(search);
        const companyMatch = s.data?.company?.toLowerCase().includes(search);
        return nameMatch || sublabelMatch || docMatch || companyMatch;
      });

      const unique = filtered.filter(
        (s, i, arr) => arr.findIndex((x) => x.label === s.label && x.data?.doc === s.data?.doc) === i
      );

      const sorted = unique.sort((a, b) => {
        const aReg = a.data?.origin === 'cadastro' ? 1 : 0;
        const bReg = b.data?.origin === 'cadastro' ? 1 : 0;
        if (aReg !== bReg) return bReg - aReg;
        return a.label.localeCompare(b.label);
      });

      setFilteredList(sorted.slice(0, 20));
    }
  }, [value, suggestions, isOpen]);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  const handleSelect = (suggestion: SearchSuggestion) => {
    if (onSelect) {
      onSelect(suggestion.data);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center text-foreground">
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          onFocus={() => {
            handleSearch(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch(true);
            }
          }}
          placeholder={placeholder}
          className={`pr-10 bg-emerald-950/10 border-emerald-800/20 text-emerald-50 placeholder:text-emerald-700/50 focus:border-emerald-500/50 focus:ring-emerald-500/20 ${className || ''}`}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSearch(true);
          }}
          className="absolute right-1 p-2 rounded-md hover:bg-emerald-950/40 text-emerald-400/70 hover:text-emerald-300 transition-colors cursor-pointer"
          title="Pesquisar"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-emerald-950/95 border border-emerald-800/40 backdrop-blur-md rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
          {filteredList.length === 0 ? (
            <div className="px-3 py-4 text-sm text-center text-emerald-300/60">
              Nenhum registro encontrado
            </div>
          ) : (
            filteredList.map((suggestion, index) => {
              const name = suggestion.data?.name || suggestion.label;
              const doc = suggestion.data?.doc || '';
              const company = suggestion.data?.company || '';
              const subText = [doc, company].filter(Boolean).join(' — ');
              const isRegistered = suggestion.data?.origin === 'cadastro';

              return (
                <button
                  key={`${name}-${doc}-${index}`}
                  type="button"
                  className="w-full text-left px-3 py-2.5 text-sm transition-colors flex flex-col gap-0.5 hover:bg-emerald-800/30 text-emerald-100 border-b border-emerald-900/40 last:border-b-0 cursor-pointer"
                  onClick={() => handleSelect(suggestion)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-emerald-50 truncate">{name}</span>
                    {isRegistered && (
                      <span className="text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded shrink-0">
                        Cadastrado
                      </span>
                    )}
                  </div>
                  {subText && (
                    <span className="text-xs text-emerald-400/60 truncate">
                      {subText}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
