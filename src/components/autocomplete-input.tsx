'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';

export interface AutocompleteSuggestion {
  label: string;
  sublabel?: string;
  data?: Record<string, string>;
}

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: AutocompleteSuggestion) => void;
  suggestions: AutocompleteSuggestion[];
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

export default function AutocompleteInput({
  value,
  onChange,
  onSelect,
  suggestions,
  placeholder,
  className,
  readOnly,
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = suggestions.filter((s) => {
    if (!value || value.length < 3) return false;
    const search = value.toLowerCase();
    return (
      s.label.toLowerCase().includes(search) ||
      (s.sublabel && s.sublabel.toLowerCase().includes(search))
    );
  });

  // Remove duplicates by label
  const uniqueSuggestions = filteredSuggestions.filter(
    (s, i, arr) => arr.findIndex((x) => x.label === s.label && x.sublabel === s.sublabel) === i
  );

  // Limit to 6 results
  const displaySuggestions = uniqueSuggestions.slice(0, 6);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setHighlightedIndex(-1);
    setIsOpen(true);
  };

  const handleSelect = (suggestion: AutocompleteSuggestion) => {
    onChange(suggestion.label);
    setIsOpen(false);
    if (onSelect) onSelect(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || displaySuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < displaySuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : displaySuggestions.length - 1
      );
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(displaySuggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleFocus = () => {
    if (value && value.length >= 3 && displaySuggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const highlightMatch = (text: string) => {
    if (!value) return text;
    const search = value.toLowerCase();
    const index = text.toLowerCase().indexOf(search);
    if (index === -1) return text;

    return (
      <>
        {text.slice(0, index)}
        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
          {text.slice(index, index + value.length)}
        </span>
        {text.slice(index + value.length)}
      </>
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        readOnly={readOnly}
        autoComplete="off"
      />
      {isOpen && displaySuggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
          {displaySuggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.label}-${suggestion.sublabel}-${index}`}
              type="button"
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex flex-col gap-0.5 ${
                index === highlightedIndex
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-foreground'
                  : 'hover:bg-muted text-foreground'
              }`}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <span className="truncate">{highlightMatch(suggestion.label)}</span>
              {suggestion.sublabel && (
                <span className="text-xs text-muted-foreground truncate">
                  {suggestion.sublabel}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
