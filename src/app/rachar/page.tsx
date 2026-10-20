'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  api,
  ApiError,
  CreateSplitRequest,
  PixKeyType,
  SplitAdminDto,
  SplitMode,
} from '@/lib/api';
import {
  formatBRL,
  isValidCnpj,
  isValidCpf,
  maskPixKey,
  normalizePixKey,
  sanitizePixCity,
  sanitizePixName,
  suggestCityFromPhone,
  PIX_KEY_PLACEHOLDERS,
  PIX_KEY_TYPE_LABELS,
  UF_LIST,
  type UF,
} from '@/lib/formatters';
import { getCitiesByState } from '@/lib/ibge';
import { getLastCity, saveLastCity, saveSplit, type LastCity } from '@/lib/storage';
import { absoluteUrl, splitAdminPath, splitPath } from '@/lib/routes';
import { Money } from '@/components/ui/Money';
import { toast } from '@/components/ui/Toast';
import { CopyButton } from '@/components/ui/CopyButton';
import { Combobox, Select } from '@/components/ui/Select';
import { Plus, Trash2, ArrowLeft, Check } from 'lucide-react';
import { useTermsAccepted, TermsConsentCheckbox, TermsShortNotice } from '@/components/TermsConsent';

const DEFAULT_CITY = 'BRASIL';

function sanitizeDecimalInput(val: string): string {
  const normalized = val.replace(',', '.');
  const cleaned = normalized.replace(/[^0-9.]/g, '');
  if (!cleaned) return '';

  const parts = cleaned.split('.');
  if (parts.length === 1) {
    return parts[0];
  }
  const integerPart = parts[0];
  const decimalPart = parts.slice(1).join('').slice(0, 2);
  return `${integerPart}.${decimalPart}`;
}

const STEP_LABELS = ['Valor', 'Pix para receber', 'Quem vai pagar'];
const LAST_STEP = STEP_LABELS.length - 1;

const PIX_KEY_TYPE_OPTIONS = (Object.keys(PIX_KEY_TYPE_LABELS) as PixKeyType[]).map((type) => ({
  value: type,
  label: PIX_KEY_TYPE_LABELS[type],
}));

const UF_OPTIONS = [{ value: '', label: 'UF' }, ...UF_LIST.map((uf) => ({ value: uf, label: uf }))];

function stepClass(active: boolean, slideDir: 'left' | 'right'): string {
  if (!active) return 'hidden lg:block';
  return slideDir === 'right' ? 'animate-slide-from-right' : 'animate-slide-from-left';
}

function pixInputMode(type: PixKeyType): 'email' | 'tel' | 'numeric' | 'text' {
  if (type === 'Email') return 'email';
  if (type === 'Phone') return 'tel';
  if (type === 'Cpf' || type === 'Cnpj') return 'numeric';
  return 'text';
}

function participantInitial(p: { name: string; isOwner: boolean }, idx: number): string {
  const trimmed = p.name.trim();
  if (trimmed) return trimmed.charAt(0).toUpperCase();
  return p.isOwner ? 'E' : String(idx + 1);
}

interface ParticipantField {
  id: string;
  name: string;
  isOwner: boolean;
  amount: string; // for custom split input
}

export default function RacharPage() {
  // Form states
  const [title, setTitle] = useState('');
  const [totalAmountStr, setTotalAmountStr] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>('Email');
  const [receiverName, setReceiverName] = useState('');
  const [cityOverride, setCityOverride] = useState<string | null>(null);
  const [ufOverride, setUfOverride] = useState<UF | ''>('');
  const [lastCity, setLastCity] = useState<LastCity | null>(null);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [splitMode, setSplitMode] = useState<SplitMode>('Equal');

  useEffect(() => {
    setLastCity(getLastCity());
  }, []);

  const phoneSuggestion = pixKeyType === 'Phone' ? suggestCityFromPhone(pixKey) : null;
  let receiverCity = '';
  let citySource: string | null = null;
  if (cityOverride !== null) {
    receiverCity = cityOverride;
  } else if (lastCity) {
    receiverCity = lastCity.city;
    citySource = 'da última vez';
  } else if (phoneSuggestion) {
    receiverCity = phoneSuggestion.city;
    citySource = `pelo DDD ${phoneSuggestion.ddd}`;
  }

  const lastUf = lastCity?.uf && UF_LIST.includes(lastCity.uf as UF) ? (lastCity.uf as UF) : '';
  const selectedUf: UF | '' = ufOverride || lastUf || phoneSuggestion?.uf || '';

  useEffect(() => {
    if (!selectedUf) {
      setCityOptions([]);
      return;
    }
    const controller = new AbortController();
    void getCitiesByState(selectedUf, controller.signal).then((cities) => {
      if (!controller.signal.aborted) setCityOptions(cities);
    });
    return () => controller.abort();
  }, [selectedUf]);

  const [participants, setParticipants] = useState<ParticipantField[]>([
    { id: '1', name: 'Eu (Organizador)', isOwner: true, amount: '' },
    { id: '2', name: 'Amigo 1', isOwner: false, amount: '' },
  ]);

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('right');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdSplit, setCreatedSplit] = useState<SplitAdminDto | null>(null);
  const lastStepTransitionRef = useRef(0);
  const { accepted: termsAccepted } = useTermsAccepted();

  const totalAmount = parseFloat(totalAmountStr) || 0;

  // Live equal calculation helper
  const equalShares = useMemo(() => {
    const count = participants.length;
    if (count === 0 || totalAmount <= 0) return [];
    const totalCents = Math.round(totalAmount * 100);
    const baseCents = Math.floor(totalCents / count);
    const remainderCents = totalCents % count;

    return participants.map((p, idx) => {
      const cents = baseCents + (idx < remainderCents ? 1 : 0);
      return { id: p.id, amount: cents / 100 };
    });
  }, [participants, totalAmount]);

  // Live custom sum helper
  const customSum = useMemo(() => {
    return participants.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  }, [participants]);

  const remainingCustom = totalAmount - customSum;

  const handleAddParticipant = () => {
    if (participants.length >= 50) return;
    setParticipants((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        name: '',
        isOwner: false,
        amount: '',
      },
    ]);
  };

  const handleRemoveParticipant = (id: string) => {
    if (participants.length <= 2) return;
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdateParticipant = (id: string, updates: Partial<ParticipantField>) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const validateStep = (index: number): string | null => {
    if (index === 0) {
      if (!title.trim() || title.length > 80) {
        return 'O título deve ter entre 1 e 80 caracteres.';
      }
      if (totalAmount <= 0 || totalAmount > 1000000) {
        return 'O valor total deve ser maior que zero e menor ou igual a R$ 1.000.000,00.';
      }
    }

    if (index === 1) {
      if (!pixKey.trim()) {
        return 'Informe a chave Pix para receber os pagamentos.';
      }
      if (pixKeyType === 'Cpf' && !isValidCpf(pixKey)) {
        return 'CPF inválido. Confira os números digitados.';
      }
      if (pixKeyType === 'Cnpj' && !isValidCnpj(pixKey)) {
        return 'CNPJ inválido. Confira os números digitados.';
      }
      if (!receiverName.trim() || receiverName.length > 25) {
        return 'O nome do recebedor deve ter até 25 caracteres.';
      }
      if (receiverCity.length > 15) {
        return 'A cidade deve ter até 15 caracteres.';
      }
    }

    if (index === 2) {
      if (participants.length < 2 || participants.length > 50) {
        return 'O racha deve ter entre 2 e 50 participantes.';
      }

      const namesSet = new Set<string>();
      for (const p of participants) {
        const trimmed = p.name.trim().toLowerCase();
        if (!trimmed) {
          return 'Todos os participantes devem ter um nome.';
        }
        if (namesSet.has(trimmed)) {
          return `Nome duplicado: "${p.name}". Cada participante deve ter um nome único.`;
        }
        namesSet.add(trimmed);
      }

      if (splitMode === 'Custom' && Math.abs(remainingCustom) > 0.01) {
        return `A soma das partes (${formatBRL(customSum)}) deve ser exatamente igual ao total (${formatBRL(totalAmount)}). Diferença: ${formatBRL(remainingCustom)}`;
      }
    }

    return null;
  };

  const goToStep = (next: number) => {
    lastStepTransitionRef.current = Date.now();
    setErrorMessage(null);
    setSlideDir(next >= step ? 'right' : 'left');
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = () => {
    const error = validateStep(step);
    if (error) {
      setErrorMessage(error);
      return;
    }
    goToStep(Math.min(LAST_STEP, step + 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Date.now() - lastStepTransitionRef.current < 500) {
      return;
    }
    setErrorMessage(null);

    const isMobileOrTablet = typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
    if (isMobileOrTablet && step < LAST_STEP) {
      handleNext();
      return;
    }

    for (let i = 0; i <= LAST_STEP; i++) {
      const error = validateStep(i);
      if (error) {
        setStep(i);
        setErrorMessage(error);
        toast.error(error);
        return;
      }
    }

    if (!termsAccepted) {
      setErrorMessage('Você precisa aceitar os Termos de Uso e a Política de Privacidade para criar o racha.');
      toast.error('Você precisa aceitar os Termos de Uso e a Política de Privacidade.');
      return;
    }

    try {
      setLoading(true);

      const normalizedKey = normalizePixKey(pixKey, pixKeyType);
      const sanitizedName = sanitizePixName(receiverName);
      const sanitizedCity = sanitizePixCity(receiverCity) || DEFAULT_CITY;

      const requestPayload: CreateSplitRequest = {
        title: title.trim(),
        totalAmount,
        pixKey: normalizedKey,
        pixKeyType,
        receiverName: sanitizedName,
        receiverCity: sanitizedCity,
        splitMode,
        participants: participants.map((p) => {
          if (splitMode === 'Equal') {
            return {
              name: p.name.trim(),
              isOwner: p.isOwner,
            };
          } else {
            return {
              name: p.name.trim(),
              isOwner: p.isOwner,
              amount: parseFloat(p.amount) || 0,
            };
          }
        }),
      };

      const result = await api.createSplit(requestPayload);

      saveLastCity({ city: sanitizedCity, uf: selectedUf || null });
      saveSplit({
        slug: result.slug,
        adminToken: result.adminToken,
        title: result.title,
        totalAmount: result.totalAmount,
        createdAt: result.createdAt,
      });

      setCreatedSplit(result);
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Não foi possível criar o racha. Verifique os dados ou tente novamente.';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full h-11 lg:h-10 px-3.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-50 text-base md:text-sm placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors';
  const labelCls = 'block text-[13px] font-medium text-zinc-400 mb-1.5 lg:mb-1';
  const segCls = (active: boolean) =>
    `h-10 lg:h-9 py-2 lg:py-1 px-3 rounded-lg text-sm font-medium transition-all ${
      active
        ? 'bg-zinc-800 text-accent shadow-sm'
        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
    }`;
  const stepBadgeCls =
    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 border border-accent/30 text-xs font-semibold text-accent';

  if (createdSplit) {
    const publicUrl = absoluteUrl(splitPath(createdSplit.slug));
    const adminUrl = absoluteUrl(splitAdminPath(createdSplit.slug, createdSplit.adminToken));

    return (
      <div className="w-full max-w-4xl lg:max-w-none lg:w-[60vw] mx-auto px-4 sm:px-6 py-12 space-y-8 animate-fade-up">
        <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center animate-pop">
              <Check className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50">Racha criado</h1>
            <p className="text-zinc-400 text-sm">
              {createdSplit.title} &middot; <Money value={createdSplit.totalAmount} />
            </p>
          </div>

          <div className="space-y-6 pt-2">
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">Link dos participantes</h2>
              <p className="text-xs text-zinc-400 mb-2">Envie no grupo.</p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={publicUrl}
                  className="flex-1 min-w-0 text-xs bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 font-mono text-zinc-300 truncate"
                />
                <CopyButton text={publicUrl} label="Copiar" variant="secondary" />
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-zinc-200">Seu link de administrador</h2>
              <p className="text-xs text-amber-400/90 mb-2">
                Guarde este link. Com ele você confere quem pagou.
              </p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={adminUrl}
                  className="flex-1 min-w-0 text-xs bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 font-mono text-zinc-300 truncate"
                />
                <CopyButton text={adminUrl} label="Copiar" variant="secondary" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Link
              href={splitPath(createdSplit.slug)}
              className="h-12 px-4 rounded-xl border border-zinc-800 font-semibold text-zinc-200 hover:bg-zinc-800/60 text-sm flex items-center justify-center transition-colors active:scale-[0.98]"
            >
              Ver página pública
            </Link>
            <Link
              href={splitAdminPath(createdSplit.slug, createdSplit.adminToken)}
              className="h-12 px-4 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg font-semibold text-sm flex items-center justify-center transition-colors active:scale-[0.98]"
            >
              Abrir painel
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 lg:pt-4 pb-28 lg:pb-8 w-full animate-fade-up overflow-x-clip">
      <div className="mb-8 lg:mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-50 transition-colors mb-3 lg:mb-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar
        </Link>
        <h1 className="text-2xl sm:text-3xl lg:text-2xl font-semibold tracking-tight text-zinc-50">
          Dividir conta
        </h1>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm"
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Mobile Stepper Bar (Progress bar with 3 animated segments) */}
        <div className="lg:hidden mb-6 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {STEP_LABELS.map((_, i) => (
              <div key={i} className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full bg-accent transition-all duration-300 ${
                    i <= step ? 'w-full' : 'w-0'
                  }`}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium">Passo {step + 1} de {STEP_LABELS.length}</span>
            <span className="text-zinc-200 font-semibold">{STEP_LABELS[step]}</span>
          </div>
        </div>

        {/* Form Content: 2 Columns on desktop (lg+), 1 step at a time on mobile */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start space-y-6 lg:space-y-0">
          {/* Left Column (approx 60%): Steps 1 (Valor) & 2 (Pix) stacked */}
          <div className="lg:col-span-6 space-y-6 lg:space-y-4">
            {/* Step 1 Card: Valor */}
            <section
              className={`p-4 sm:p-7 lg:p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-6 lg:space-y-4 ${stepClass(step === 0, slideDir)} lg:animate-none`}
            >
              <h2 className="flex items-center gap-3 lg:gap-2.5 text-lg lg:text-base font-semibold text-zinc-50">
                <span className={stepBadgeCls}>1</span>
                {STEP_LABELS[0]}
              </h2>

              {/* Big amount input is the hero of step 1 */}
              <div className="pt-1 pb-4 sm:py-4 lg:py-2 flex flex-col items-center justify-center text-center">
                <label htmlFor="total-amount-input" className="text-[13px] font-medium text-zinc-400 mb-2.5 lg:mb-1.5">
                  Valor total
                </label>
                <div className="relative inline-flex items-baseline justify-center">
                  <span className="text-4xl sm:text-4xl md:text-5xl font-semibold text-zinc-500 mr-2 select-none">
                    R$
                  </span>
                  <input
                    id="total-amount-input"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    required
                    placeholder="0,00"
                    value={totalAmountStr}
                    onChange={(e) => setTotalAmountStr(sanitizeDecimalInput(e.target.value))}
                    className="w-52 sm:w-64 md:w-72 text-center bg-transparent border-0 border-b-2 border-zinc-800 focus:border-zinc-800! focus:shadow-none! max-sm:text-5xl! sm:text-5xl md:text-6xl font-bold text-zinc-50 tabular-nums placeholder:text-zinc-700 focus:outline-none transition-colors pb-1"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="split-title" className={labelCls}>Descrição</label>
                <input
                  id="split-title"
                  type="text"
                  required
                  maxLength={80}
                  placeholder="Ex: Churrasco de domingo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div>
                <span className={labelCls}>Divisão</span>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-950/60 border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setSplitMode('Equal')}
                    className={segCls(splitMode === 'Equal')}
                  >
                    Partes iguais
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitMode('Custom')}
                    className={segCls(splitMode === 'Custom')}
                  >
                    Valores diferentes
                  </button>
                </div>
              </div>
            </section>

            {/* Step 2 Card: Pix para receber */}
            <section
              className={`p-4 sm:p-7 lg:p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-6 lg:space-y-4 ${stepClass(step === 1, slideDir)} lg:animate-none`}
            >
              <h2 className="flex items-center gap-3 lg:gap-2.5 text-lg lg:text-base font-semibold text-zinc-50">
                <span className={stepBadgeCls}>2</span>
                {STEP_LABELS[1]}
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
          </div>

          {/* Right Column (approx 40%): Step 3 (Quem vai pagar) & Sticky Summary Card */}
          <div className="lg:col-span-6 space-y-6 lg:space-y-4">
            {/* Step 3 Card: Quem vai pagar */}
            <section
              className={`p-4 sm:p-7 lg:p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-5 lg:space-y-3.5 ${stepClass(step === 2, slideDir)} lg:animate-none`}
            >
              <div className="flex flex-col gap-3 pb-1 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-2.5 lg:gap-y-2">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <span className={stepBadgeCls}>3</span>
                  <h2 className="text-base sm:text-lg lg:text-base font-semibold text-zinc-50 whitespace-nowrap">
                    {STEP_LABELS[2]}
                  </h2>
                </div>
                <div className="flex items-center justify-between gap-3 lg:contents">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 whitespace-nowrap">
                    {participants.length} {participants.length === 1 ? 'pessoa' : 'pessoas'}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddParticipant}
                    disabled={participants.length >= 50}
                    className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-200 transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0 lg:ml-auto"
                    title="Adicionar pessoa"
                  >
                    <Plus className="w-4 h-4 text-accent" />
                    <span className="lg:hidden xl:inline">Adicionar pessoa</span>
                    <span className="sr-only hidden lg:inline xl:hidden">Adicionar pessoa</span>
                  </button>
                </div>
              </div>

              {/* Participant rows with avatar initials and clean layout */}
              <div className="divide-y divide-zinc-800/80 border-y border-zinc-800/80 lg:max-h-[20.9rem] lg:overflow-y-auto lg:overscroll-contain">
                {participants.map((p, idx) => {
                  const equalAmount = equalShares.find((e) => e.id === p.id)?.amount;
                  const initial = participantInitial(p, idx);

                  return (
                    <div
                      key={p.id}
                      className="py-3 lg:py-2 px-1 sm:px-2 flex flex-col gap-2 lg:gap-1.5 rounded-xl transition-colors hover:bg-zinc-900/30 animate-fade-in"
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar-initial circle */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs shrink-0 select-none ${
                            p.isOwner
                              ? 'bg-accent/15 text-accent border border-accent/30'
                              : 'bg-zinc-800 text-zinc-300 border border-zinc-700/60'
                          }`}
                        >
                          {initial}
                        </div>

                        {/* Name input */}
                        <input
                          type="text"
                          aria-label="Nome do participante"
                          placeholder={p.isOwner ? 'Seu nome' : `Pessoa ${idx + 1}`}
                          value={p.name}
                          onChange={(e) => handleUpdateParticipant(p.id, { name: e.target.value })}
                          className="flex-1 min-w-0 h-10 bg-transparent text-zinc-50 text-sm placeholder:text-zinc-600 focus:outline-none focus:shadow-none! focus:border-transparent!"
                        />

                        {/* Amount: Equal display or Custom input */}
                        {splitMode === 'Equal' ? (
                          <div className="text-right shrink-0">
                            <Money
                              value={equalAmount ?? 0}
                              className="text-sm font-semibold text-zinc-200"
                            />
                          </div>
                        ) : (
                          <div className="relative shrink-0">
                            <input
                              type="text"
                              inputMode="decimal"
                              autoComplete="off"
                              aria-label="Valor"
                              placeholder="0,00"
                              value={p.amount}
                              onChange={(e) => handleUpdateParticipant(p.id, { amount: sanitizeDecimalInput(e.target.value) })}
                              className="w-24 sm:w-28 h-9 px-2.5 text-right tabular-nums rounded-lg border border-zinc-800 bg-zinc-950 text-sm text-zinc-50 placeholder:text-zinc-600 focus:border-accent focus:outline-none transition-colors"
                            />
                          </div>
                        )}

                        {/* Remove icon button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveParticipant(p.id)}
                          disabled={participants.length <= 2}
                          className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-zinc-500 cursor-pointer shrink-0"
                          aria-label="Remover participante"
                          title="Remover participante"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Organizador checkbox */}
                      <div className="pl-11 flex items-center">
                        <label className="inline-flex items-center gap-2 text-xs text-zinc-400 select-none cursor-pointer hover:text-zinc-300 transition-colors py-0.5">
                          <input
                            type="checkbox"
                            checked={p.isOwner}
                            onChange={(e) => handleUpdateParticipant(p.id, { isOwner: e.target.checked })}
                            className="w-3.5 h-3.5 rounded accent-[var(--accent)] cursor-pointer"
                          />{' '}
                          Organizador, já pagou
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>

              {splitMode === 'Custom' && (
                <div
                  className={`p-3 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
                    Math.abs(remainingCustom) < 0.01
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                  }`}
                >
                  <span>
                    <Money value={customSum} className="font-semibold" /> de{' '}
                    <Money value={totalAmount} />
                  </span>
                  <span className="font-medium">
                    {Math.abs(remainingCustom) < 0.01 ? (
                      'Soma conferida'
                    ) : (
                      <>
                        Faltam <Money value={remainingCustom} />
                      </>
                    )}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-zinc-800/80 space-y-2.5 lg:hidden">
                <TermsShortNotice />
                <TermsConsentCheckbox id="terms-consent-mobile" />
              </div>
            </section>

            {/* Desktop Sticky Summary Card */}
            <div className="hidden lg:block sticky top-20 rounded-2xl bg-zinc-900/50 border border-zinc-800 p-6 lg:p-4 shadow-sm space-y-5 lg:space-y-3.5">
              <h3 className="text-[13px] font-medium text-zinc-400">
                Resumo
              </h3>
              <div className="space-y-3 lg:space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-zinc-400">Total da conta</span>
                  <Money value={totalAmount} className="text-2xl font-bold text-zinc-50" />
                </div>
                <div className="flex items-baseline justify-between text-sm py-2 border-t border-zinc-800/80">
                  <span className="text-zinc-400">
                    {splitMode === 'Equal' ? `Por pessoa (${participants.length})` : 'Pessoas'}
                  </span>
                  <span className="font-semibold text-zinc-200">
                    {splitMode === 'Equal' ? (
                      <Money value={equalShares[0]?.amount ?? 0} />
                    ) : (
                      `${participants.length} participantes`
                    )}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800/80 space-y-2.5">
                <TermsShortNotice />
                <TermsConsentCheckbox id="terms-consent-desktop" />
              </div>

              <button
                type="submit"
                disabled={loading || !termsAccepted}
                className="w-full h-12 lg:h-11 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg font-semibold text-base transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Criando...' : 'Criar racha'}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile / Tablet Sticky Action Bar */}
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-md px-4 py-2.5 lg:hidden">
          <div className="max-w-xl mx-auto flex items-center gap-3">
            <div className="flex flex-col leading-tight shrink-0">
              <span className="text-xs font-medium text-zinc-400">Total</span>
              <Money value={totalAmount} className="text-lg font-bold text-zinc-50" />
            </div>
            <div className="flex flex-1 gap-2">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => goToStep(step - 1)}
                  className="flex-1 h-11 px-4 rounded-xl border border-zinc-800 text-zinc-300 font-semibold text-sm hover:bg-zinc-900 transition-colors active:scale-[0.98] cursor-pointer"
                >
                  Voltar
                </button>
              )}
              {step < LAST_STEP ? (
                <button
                  key="btn-step-next"
                  type="button"
                  onClick={handleNext}
                  className="flex-[2] h-11 px-5 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg font-semibold text-[15px] transition-colors active:scale-[0.98] cursor-pointer flex items-center justify-center"
                >
                  Próximo
                </button>
              ) : (
                <button
                  key="btn-step-submit"
                  type="submit"
                  disabled={loading || !termsAccepted}
                  className="flex-[2] h-11 px-5 rounded-xl bg-accent hover:bg-accent-hover text-accent-fg font-semibold text-[15px] transition-colors active:scale-[0.98] cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Criando...' : 'Criar racha'}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
