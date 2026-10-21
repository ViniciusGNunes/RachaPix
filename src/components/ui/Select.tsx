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
const MAX_LIST_HEIGHT = 260;
const OPTION_BASE = 'flex items-center justify-between gap-2 cursor-pointer select-none text-zinc-300 rounded-md mx-1 my-0.5 transition-colors';
const optionClass = (mobile: boolean) =>
  `${OPTION_BASE} ${mobile ? 'px-3.5 py-2.5 text-base' : 'px-2.5 py-1.5 text-xs sm:text-sm'}`;

function usePopoverPosition(open: boolean, anchorRef: React.RefObject<HTMLElement | null>): Position | null {
  const [position, setPosition] = useState<Position | null>(null);

  const update = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - VIEWPORT_MARGIN;
    const placeAbove =
      (spaceBelow < MAX_LIST_HEIGHT && spaceAbove > spaceBelow) ||
      (spaceBelow < 120 && spaceAbove > spaceBelow);
    const available = Math.max(0, (placeAbove ? spaceAbove : spaceBelow) - 4);
    const maxHeight = Math.min(MAX_LIST_HEIGHT, available);

    // Keep popover horizontally within viewport bounds
    const estimatedWidth = Math.max(rect.width, 200);
    const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - estimatedWidth - VIEWPORT_MARGIN);
    const left = Math.max(VIEWPORT_MARGIN, Math.min(rect.left, maxLeft));

    setPosition({
      top: placeAbove ? rect.top - 4 : rect.bottom + 4,
      left,
      width: rect.width,
      maxHeight,
      placeAbove,
    });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
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
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (refs.some((r) => r.current?.contains(target))) return;
      onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
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
  position?: Position | null;
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  if (mobileSheet) {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-end animate-fade-in">
        <button
          type="button"
          tabIndex={-1}
          aria-label="Fechar"
          onClick={onClose}
          className="absolute inset-0 bg-black/70 cursor-pointer"
        />
        <div
          ref={sheetRef}
          className="relative w-full max-h-[70dvh] flex flex-col rounded-t-lg border-t border-zinc-800 bg-zinc-950 pb-[env(safe-area-inset-bottom)] shadow-sm animate-sheet-up cursor-default"
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-2.5 shrink-0" aria-hidden="true">
            <span className="h-1.5 w-12 rounded-full bg-zinc-700/80" />
          </div>

          {/* Sheet Header */}
          <div className="flex items-center justify-between px-4 pt-2 pb-2 shrink-0 border-b border-zinc-800/60">
            <span className="text-sm font-semibold text-zinc-200">{title}</span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="p-1.5 -mr-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Options List */}
          <ul // NOSONAR: custom combobox, keyboard handled on the input
            ref={listRef}
            id={id}
            role="listbox"
            aria-label={title}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-1.5 px-1 pb-3"
          >
            {children}
          </ul>
        </div>
      </div>,
      document.body
    );
  }

  if (!position) return null;

  return createPortal(
    <ul // NOSONAR: custom combobox, keyboard handled on the input
      ref={listRef}
      id={id}
      role="listbox"
      aria-label={title}
      style={{
        position: 'fixed',
        left: position.left,
        minWidth: position.width,
        width: 'max-content',
        maxWidth: `min(20rem, calc(100vw - ${VIEWPORT_MARGIN * 2}px))`,
        maxHeight: position.maxHeight,
        ...(position.placeAbove
          ? { bottom: window.innerHeight - position.top }
          : { top: position.top }),
      }}
      className="z-[100] overflow-y-auto py-1 px-1 rounded-md border border-zinc-800 bg-zinc-900 shadow-sm animate-fade-in"
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
    setActiveIndex(Math.max(selectedIndex, 0));
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
        className={`w-full flex items-center justify-between gap-2 border bg-zinc-900 text-left text-zinc-50 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer max-sm:min-h-11 ${
          open ? 'border-accent' : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/90'
        } ${triggerClassName || 'h-9 px-3 text-sm rounded-md max-sm:h-11 max-sm:text-base'}`}
      >
        <span className={`truncate ${selected ? '' : 'text-zinc-400'}`}>
          {selected ? selected.label : (placeholder ?? 'Selecione')}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (isMobile || position) && (
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
              <li // NOSONAR: custom combobox, keyboard handled on the input
                key={option.value}
                id={`${listId}-${index}`}
                data-index={index}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(index)}
                className={`${optionClass(isMobile)} ${isActive ? 'bg-zinc-800 text-zinc-50' : ''} ${
                  isSelected ? 'font-medium text-accent bg-accent-muted/40' : ''
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check className="w-4 h-4 shrink-0 text-accent" aria-hidden="true" />}
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
        className={`w-full min-w-0 border border-zinc-800 bg-zinc-900 text-zinc-50 placeholder:text-zinc-400 transition-all hover:border-zinc-700 focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent max-sm:min-h-11 max-sm:text-base ${
          inputClassName || 'h-9 px-3 text-sm rounded-md max-sm:h-11 max-sm:text-base'
        }`}
      />

      {showList && (
        <Popover position={position} listRef={listRef} id={listId} title={ariaLabel} onClose={close}>
          {filtered.map((item, index) => (
            <li // NOSONAR: custom combobox, keyboard handled on the input
              key={item}
              id={`${listId}-${index}`}
              data-index={index}
              role="option"
              aria-selected={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => commit(index)}
              className={`${optionClass(isMobile)} ${index === activeIndex ? 'bg-zinc-800 text-zinc-50' : ''}`}
            >
              <span className="truncate">{item}</span>
            </li>
          ))}
        </Popover>
      )}
    </div>
  );
}
