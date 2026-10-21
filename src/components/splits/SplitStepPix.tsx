import React from 'react';
import type { PixKeyType } from '@/lib/api';
import {
  maskPixKey,
  PIX_KEY_PLACEHOLDERS,
  PIX_KEY_TYPE_LABELS,
  UF_LIST,
  type UF,
} from '@/lib/formatters';
import { Combobox, Select } from '@/components/ui/Select';

const PIX_KEY_TYPE_OPTIONS = (Object.keys(PIX_KEY_TYPE_LABELS) as PixKeyType[]).map((type) => ({
  value: type,
  label: PIX_KEY_TYPE_LABELS[type],
}));

const UF_OPTIONS = [{ value: '', label: 'UF' }, ...UF_LIST.map((uf) => ({ value: uf, label: uf }))];

function pixInputMode(type: PixKeyType): 'email' | 'tel' | 'numeric' | 'text' {
  if (type === 'Email') return 'email';
  if (type === 'Phone') return 'tel';
  if (type === 'Cpf' || type === 'Cnpj') return 'numeric';
  return 'text';
}

interface SplitStepPixProps {
  step: number;
  slideDir: 'left' | 'right';
  pixKeyType: PixKeyType;
  setPixKeyType: (val: PixKeyType) => void;
  pixKey: string;
  setPixKey: React.Dispatch<React.SetStateAction<string>>;
  receiverName: string;
  setReceiverName: (val: string) => void;
  selectedUf: UF | '';
  setUfOverride: (val: UF | '') => void;
  receiverCity: string;
  setCityOverride: (val: string | null) => void;
  cityOptions: string[];
  citySource: string | null;
}

export function SplitStepPix({
  step,
  slideDir,
  pixKeyType,
  setPixKeyType,
  pixKey,
  setPixKey,
  receiverName,
  setReceiverName,
  selectedUf,
  setUfOverride,
  receiverCity,
  setCityOverride,
  cityOptions,
  citySource,
}: SplitStepPixProps) {
  const active = step === 1;
  const animClass = !active
    ? 'hidden lg:block'
    : slideDir === 'right'
    ? 'animate-slide-from-right'
    : 'animate-slide-from-left';

  const inputCls =
    'w-full h-11 lg:h-10 px-3.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-50 text-base md:text-sm placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors';
  const labelCls = 'block text-[13px] font-medium text-zinc-400 mb-1.5 lg:mb-1';
  const stepBadgeCls =
    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 border border-accent/30 text-xs font-semibold text-accent';

  return (
    <section
      className={`p-4 sm:p-7 lg:p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-6 lg:space-y-4 ${animClass} lg:animate-none`}
    >
      <h2 className="flex items-center gap-3 lg:gap-2.5 text-lg lg:text-base font-semibold text-zinc-50">
        <span className={stepBadgeCls}>2</span>
        Pix para receber
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-5 lg:gap-3">
        <div>
          <span className={labelCls}>Tipo da chave</span>
          <Select
            ariaLabel="Tipo da chave Pix"
            value={pixKeyType}
            onChange={(value) => {
              const nextType = value as PixKeyType;
              setPixKeyType(nextType);
              setPixKey((current) => maskPixKey(current, nextType));
            }}
            options={PIX_KEY_TYPE_OPTIONS}
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="pix-key" className={labelCls}>Chave Pix</label>
          <input
            id="pix-key"
            type="text"
            required
            inputMode={pixInputMode(pixKeyType)}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder={PIX_KEY_PLACEHOLDERS[pixKeyType]}
            value={pixKey}
            onChange={(e) => setPixKey(maskPixKey(e.target.value, pixKeyType))}
            className={`${inputCls} font-mono`}
          />
        </div>

        <div className="sm:col-span-3 lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5 lg:gap-3">
          <div>
            <label htmlFor="receiver-name" className={labelCls}>Nome do titular</label>
            <input
              id="receiver-name"
              type="text"
              maxLength={25}
              required
              placeholder="Ex: João da Silva"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <span className={labelCls}>Cidade</span>
            <div className="flex gap-2">
              <Select
                ariaLabel="Estado (UF)"
                className="w-20 sm:w-24 shrink-0"
                triggerClassName="px-2.5 sm:px-3 py-2.5 text-sm rounded-xl"
                value={selectedUf}
                onChange={(value) => setUfOverride(value as UF | '')}
                options={UF_OPTIONS}
              />
              <Combobox
                ariaLabel="Cidade"
                className="flex-1 min-w-0"
                maxLength={15}
                placeholder="Ex: Sao Paulo"
                value={receiverCity}
                onChange={setCityOverride}
                suggestions={cityOptions}
              />
            </div>
            {citySource && <span className="block mt-1 text-xs text-zinc-500">{citySource}</span>}
          </div>
        </div>
      </div>
    </section>
  );
}
