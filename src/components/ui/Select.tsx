'use client';

import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, X } from 'lucide-react';
import { useIsMobile } from '@/lib/useIsMobile';

export interface SelectOption {
  value: string;
  label: string;
}

interface Position {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placeAbove: boolean;
}

const VIEWPORT_MARGIN = 8;
const MAX_LIST_HEIGHT = 256;
const OPTION_BASE = 'flex items-center justify-between gap-2 cursor-pointer select-none text-zinc-300';
const optionClass = (mobile: boolean) =>
  `${OPTION_BASE} ${mobile ? 'px-4 py-3.5 text-base' : 'px-3 py-2 text-sm'}`;

function usePopoverPosition(open: boolean, anchorRef: React.RefObject<HTMLElement | null>): Position | null {
  const [position, setPosition] = useState<Position | null>(null);

  const update = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - VIEWPORT_MARGIN;
    const placeAbove = spaceBelow < 160 && spaceAbove > spaceBelow;
    const available = placeAbove ? spaceAbove : spaceBelow;
    setPosition({
      top: placeAbove ? rect.top - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.max(120, Math.min(MAX_LIST_HEIGHT, available - 4)),
      placeAbove,
    });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!open) return;
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, update]);

  return open ? position : null;
}

function useOutsideClose(
  open: boolean,
  refs: React.RefObject<HTMLElement | null>[],
  onClose: () => void
) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (refs.some((r) => r.current?.contains(target))) return;
      onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose]);
}

function Popover({
  position,
  listRef,
  sheetRef,
  id,
  mobileSheet = false,
  title,
  onClose,
  children,
}: {
  position: Position;
  listRef: React.RefObject<HTMLUListElement | null>;
  sheetRef?: React.RefObject<HTMLDivElement | null>;
  id: string;
  mobileSheet?: boolean;
  title?: string;
  onClose?: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!mobileSheet) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileSheet]);

  if (mobileSheet) {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-end bg-black/60 animate-in fade-in duration-150">
        <div
          ref={sheetRef}
          className="w-full rounded-t-2xl border-t border-zinc-800 bg-zinc-950 pb-[env(safe-area-inset-bottom)] shadow-2xl shadow-black animate-in slide-in-from-bottom duration-200"
        >
          <div className="flex justify-center pt-2.5" aria-hidden="true">
            <span className="h-1 w-10 rounded-full bg-zinc-700" />
          </div>
          <div className="flex items-center justify-between px-4 pt-2 pb-1">
            <span className="text-sm font-semibold text-zinc-300">{title}</span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="p-2 -mr-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <ul ref={listRef} id={id} role="listbox" className="max-h-[60vh] overflow-y-auto py-1">
            {children}
          </ul>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <ul
      ref={listRef}
      id={id}
      role="listbox"
      style={{
        position: 'fixed',
        left: position.left,
        minWidth: position.width,
        width: 'max-content',
        maxWidth: 'min(20rem, calc(100vw - 16px))',
        maxHeight: position.maxHeight,
        ...(position.placeAbove
          ? { bottom: window.innerHeight - position.top }
          : { top: position.top }),
      }}
      className="z-[100] overflow-y-auto py-1 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60 animate-in fade-in duration-100"
    >
      {children}
    </ul>,
    document.body
  );
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  /** Extra classes for the trigger (padding, text size, width). */
  triggerClassName?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  disabled = false,
  className = '',
  triggerClassName = '',
}: Readonly<SelectProps>) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const isMobile = useIsMobile();
  const position = usePopoverPosition(open, triggerRef);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  const close = useCallback(() => setOpen(false), []);
  useOutsideClose(open, [triggerRef, listRef, sheetRef], close);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex, position]);

  const openList = () => {
    if (disabled) return;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const commit = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(options.length - 1, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        commit(activeIndex);
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
      default: {
        if (e.key.length === 1) {
          const key = e.key.toLowerCase();
          const next = options.findIndex(
            (o, i) => i > activeIndex && o.label.toLowerCase().startsWith(key)
          );
          const wrapped = options.findIndex((o) => o.label.toLowerCase().startsWith(key));
          const found = next >= 0 ? next : wrapped;
          if (found >= 0) setActiveIndex(found);
        }
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        aria-activedescendant={open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between gap-2 border bg-zinc-900 text-left text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer max-sm:min-h-11 ${
          open ? 'border-zinc-600' : 'border-zinc-800 hover:border-zinc-700'
        } ${triggerClassName || 'px-3.5 py-2.5 text-sm rounded-xl'}`}
      >
        <span className={`truncate ${selected ? '' : 'text-zinc-500'}`}>
          {selected ? selected.label : (placeholder ?? 'Selecione')}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && position && (
        <Popover
          position={position}
          listRef={listRef}
          sheetRef={sheetRef}
          id={listId}
          mobileSheet={isMobile}
          title={ariaLabel ?? placeholder ?? 'Selecione'}
          onClose={close}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;
            return (
              <li
                key={option.value}
                id={`${listId}-${index}`}
                data-index={index}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(index)}
                className={`${optionClass(isMobile)} ${isActive ? 'bg-zinc-900 text-white' : ''} ${
                  isSelected ? 'font-medium text-white' : ''
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check className="w-4 h-4 shrink-0 text-zinc-300" aria-hidden="true" />}
              </li>
            );
          })}
        </Popover>
      )}
    </div>
  );
}

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  maxLength?: number;
  ariaLabel?: string;
  className?: string;
  inputClassName?: string;
}

const MAX_SUGGESTIONS = 50;

export function Combobox({
  value,
  onChange,
  suggestions,
  placeholder,
  maxLength,
  ariaLabel,
  className = '',
  inputClassName = '',
}: Readonly<ComboboxProps>) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const isMobile = useIsMobile();
  const position = usePopoverPosition(open, wrapperRef);

  const filtered = useMemo(() => {
    const term = value.trim().toLowerCase();
    const list = term
      ? suggestions.filter((s) => s.toLowerCase().includes(term) && s.toLowerCase() !== term)
      : suggestions;
    return list.slice(0, MAX_SUGGESTIONS);
  }, [suggestions, value]);

  const close = useCallback(() => setOpen(false), []);
  useOutsideClose(open, [wrapperRef, listRef], close);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex, position]);

  const showList = open && filtered.length > 0 && position;

  const commit = (index: number) => {
    const item = filtered[index];
    if (item !== undefined) onChange(item);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showList) {
      if (e.key === 'ArrowDown' && filtered.length > 0) {
        e.preventDefault();
        setActiveIndex(0);
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case 'Enter':
        if (activeIndex >= 0) {
          e.preventDefault();
          commit(activeIndex);
        }
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={!!showList}
        aria-controls={showList ? listId : undefined}
        aria-activedescendant={showList && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        aria-label={ariaLabel}
        autoComplete="off"
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setActiveIndex(-1);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className={`w-full min-w-0 border border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-600 transition-colors hover:border-zinc-700 focus:border-zinc-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 max-sm:min-h-11 max-sm:text-base ${
          inputClassName || 'px-3.5 py-2.5 text-sm rounded-xl'
        }`}
      />

      {showList && (
        <Popover position={position} listRef={listRef} id={listId}>
          {filtered.map((item, index) => (
            <li
              key={item}
              id={`${listId}-${index}`}
              data-index={index}
              role="option"
              aria-selected={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => commit(index)}
              className={`${optionClass(isMobile)} ${index === activeIndex ? 'bg-zinc-900 text-white' : ''}`}
            >
              <span className="truncate">{item}</span>
            </li>
          ))}
        </Popover>
      )}
    </div>
  );
}
