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
}: Readonly<SplitStepPixProps>) {
  const active = step === 1;
  let animClass = 'hidden lg:block';
  if (active) animClass = slideDir === 'right' ? 'animate-slide-from-right' : 'animate-slide-from-left';

  const inputCls =
    'w-full h-10 sm:h-9 px-3 rounded-md border border-zinc-800 bg-zinc-950 text-zinc-50 text-sm placeholder:text-zinc-400 focus:border-accent focus:outline-none transition-colors';
  const labelCls = 'block text-xs font-medium text-zinc-400 mb-1';
  const stepBadgeCls =
    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 border border-accent/30 text-xs font-semibold text-accent';

  return (
    <section
      className={`p-4 sm:p-5 lg:p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-4 ${animClass} lg:animate-none`}
    >
      <h2 className="flex items-center gap-2.5 text-base font-semibold text-zinc-50">
        <span className={stepBadgeCls}>2</span>{' '}
        Pix para receber
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 lg:gap-3">
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

        <div className="sm:col-span-3 lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-3">
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
                triggerClassName="px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm rounded-md"
                value={selectedUf}
                onChange={(value) => setUfOverride(value as UF | '')}
                options={UF_OPTIONS}
              />
              <Combobox
                ariaLabel="Cidade"
                className="flex-1 min-w-0"
                placeholder="Ex: Sao Paulo"
                value={receiverCity}
                onChange={setCityOverride}
                suggestions={cityOptions}
              />
            </div>
            {citySource && <span className="block mt-1 text-xs text-zinc-400">{citySource}</span>}
          </div>
        </div>
      </div>
    </section>
  );
}
