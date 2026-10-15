'use client';

import React, { useEffect, useState, useMemo } from 'react';
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

const DEFAULT_CITY = 'BRASIL';

const STEP_LABELS = ['Dados da conta', 'Chave Pix', 'Participantes'];
const LAST_STEP = STEP_LABELS.length - 1;

const PIX_KEY_TYPE_OPTIONS = (Object.keys(PIX_KEY_TYPE_LABELS) as PixKeyType[]).map((type) => ({
  value: type,
  label: PIX_KEY_TYPE_LABELS[type],
}));

const UF_OPTIONS = [{ value: '', label: 'UF' }, ...UF_LIST.map((uf) => ({ value: uf, label: uf }))];
import { CopyButton } from '@/components/ui/CopyButton';
import { Combobox, Select } from '@/components/ui/Select';
import { useIsMobile } from '@/lib/useIsMobile';
import {
  Receipt,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Users,
} from 'lucide-react';

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
  const isMobile = useIsMobile();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdSplit, setCreatedSplit] = useState<SplitAdminDto | null>(null);

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
    setErrorMessage(null);
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
    setErrorMessage(null);

    if (isMobile && step < LAST_STEP) {
      handleNext();
      return;
    }

    for (let i = 0; i <= LAST_STEP; i++) {
      const error = validateStep(i);
      if (error) {
        setStep(i);
        setErrorMessage(error);
        return;
      }
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
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Não foi possível criar o racha. Verifique os dados ou tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };


  if (createdSplit) {
    const publicUrl = absoluteUrl(splitPath(createdSplit.slug));
    const adminUrl = absoluteUrl(splitAdminPath(createdSplit.slug, createdSplit.adminToken));

    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className=" bg-zinc-950 rounded-xl p-8 border border-zinc-700 space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-zinc-900 text-zinc-50 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white">
              Racha criado com sucesso!
            </h1>
            <p className=" text-zinc-400 text-sm">
              &quot;{createdSplit.title}&quot; &bull; Total: {formatBRL(createdSplit.totalAmount)}
            </p>
          </div>

          {/* Links Section */}
          <div className="space-y-4 pt-4">
            {/* Public Link */}
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-zinc-50" /> Link dos Participantes
                </span>
                <span className="text-xs text-zinc-500">Envie no WhatsApp / grupo</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={publicUrl}
                  className="flex-1 text-xs sm:text-sm bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 font-mono text-zinc-200"
                />
                <CopyButton text={publicUrl} label="Copiar" variant="primary" />
              </div>
            </div>

            {/* Admin Link */}
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-400" /> Link de Administrador (Seu link)
                </span>
                <span className="text-xs text-amber-400 font-medium">Guarde este link</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={adminUrl}
                  className="flex-1 text-xs sm:text-sm bg-zinc-950 border border-amber-800 rounded-lg p-2.5 font-mono text-zinc-200"
                />
                <CopyButton text={adminUrl} label="Copiar" variant="secondary" />
              </div>
              <p className="text-xs text-amber-400 mt-2">
                Com ele você confere quem pagou e gerencia o status das transferências.
              </p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-zinc-800">
            <Link
              href={splitPath(createdSplit.slug)}
              className="w-full py-3 px-4 rounded-xl border border-zinc-800 font-semibold text-zinc-200 hover:bg-zinc-900 text-center text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Ver Página Pública
            </Link>
            <Link
              href={splitAdminPath(createdSplit.slug, createdSplit.adminToken)}
              className="w-full py-3 px-4 rounded-xl bg-zinc-50 text-zinc-950 font-semibold hover:bg-zinc-200 text-center text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Shield className="w-4 h-4" />
              Ir para Painel do Admin
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 w-full">
      <div className="mb-8">
        <Link
          href="/"
          className="text-xs font-medium text-zinc-400 hover:text-zinc-50 mb-2 inline-block"
        >
          &larr; Voltar para o início
        </Link>
        <h1 className="text-3xl font-semibold text-white flex items-center gap-2.5">
          <Receipt className="w-8 h-8 text-zinc-50" />
          Rachar uma Conta
        </h1>
        <p className=" text-zinc-400 text-sm mt-1">
          Preencha os dados da conta e gere QR Codes Pix automáticos para cada participante.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="sm:hidden mb-6" aria-label="Progresso">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span className="text-zinc-300">{STEP_LABELS[step]}</span>
          <span className="text-zinc-500">
            Etapa {step + 1} de {STEP_LABELS.length}
          </span>
        </div>
        <div
          className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEP_LABELS.length}
          aria-valuenow={step + 1}
        >
          <div
            className="h-full bg-zinc-50 rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        {/* Step 1: Info da Conta */}
        <div className={`bg-zinc-950 rounded-xl p-6 sm:p-7 border border-zinc-800 space-y-5 ${step === 0 ? '' : 'hidden sm:block'}`}>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-zinc-900 text-zinc-50 text-xs flex items-center justify-center font-bold">
              1
            </span>
            Dados da Conta
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Título ou Motivo *
              </label>
              <input
                type="text"
                required
                maxLength={80}
                placeholder="Ex: Churrasco de Domingo, Pizza com a galera"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-sm focus:ring-2 focus:ring-zinc-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Valor Total (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="1000000"
                required
                placeholder="0.00"
                value={totalAmountStr}
                onChange={(e) => setTotalAmountStr(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-sm font-semibold focus:ring-2 focus:ring-zinc-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Modo de Divisão *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSplitMode('Equal')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                    splitMode === 'Equal'
                      ? ' bg-zinc-900 border-zinc-700 text-zinc-50'
                      : ' border-zinc-800 text-zinc-400 hover:bg-zinc-900/50'
                  }`}
                >
                  Igual (Partes iguais)
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode('Custom')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                    splitMode === 'Custom'
                      ? ' bg-zinc-900 border-zinc-700 text-zinc-50'
                      : ' border-zinc-800 text-zinc-400 hover:bg-zinc-900/50'
                  }`}
                >
                  Personalizado (Valores)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Dados do Pix para Recebimento */}
        <div className={`bg-zinc-950 rounded-xl p-6 sm:p-7 border border-zinc-800 space-y-5 ${step === 1 ? '' : 'hidden sm:block'}`}>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-zinc-900 text-zinc-50 text-xs flex items-center justify-center font-bold">
              2
            </span>
            Chave Pix para Recebimento
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Tipo da Chave *
              </label>
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

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Chave Pix *
              </label>
              <input
                type="text"
                required
                inputMode={pixKeyType === 'Email' || pixKeyType === 'Random' ? 'text' : 'numeric'}
                placeholder={PIX_KEY_PLACEHOLDERS[pixKeyType]}
                value={pixKey}
                onChange={(e) => setPixKey(maskPixKey(e.target.value, pixKeyType))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-sm focus:ring-2 focus:ring-zinc-600 focus:outline-none font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Nome do Recebedor (Titular da conta) *
              </label>
              <input
                type="text"
                maxLength={25}
                required
                placeholder="Ex: João da Silva"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-sm focus:ring-2 focus:ring-zinc-600 focus:outline-none"
              />
              <span className="text-[11px] text-zinc-500">Até 25 caracteres, sem acentos no Pix</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Cidade
              </label>
              <div className="flex gap-2">
                <Select
                  ariaLabel="Estado (UF)"
                  className="w-24 shrink-0"
                  triggerClassName="px-3 py-2.5 text-sm rounded-xl"
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
              {citySource && <span className="text-[11px] text-zinc-500">{citySource}</span>}
            </div>
          </div>
        </div>

        {/* Step 3: Participantes */}
        <div className={`bg-zinc-950 rounded-xl p-4 sm:p-7 border border-zinc-800 space-y-3 sm:space-y-5 ${step === 2 ? '' : 'hidden sm:block'}`}>
          <div className="flex flex-row items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-zinc-900 text-zinc-50 text-xs flex items-center justify-center font-bold">
                  3
                </span>
                Participantes ({participants.length})
              </h2>
              <p className="hidden sm:block text-xs text-zinc-400">
                Adicione entre 2 e 50 participantes.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddParticipant}
              disabled={participants.length >= 50}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-200 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4 text-zinc-50" />
              <span className="sm:hidden">Adicionar</span>
              <span className="hidden sm:inline">Adicionar Pessoa</span>
            </button>
          </div>

          {/* Participants list */}
          <div className="space-y-2 sm:space-y-3">
            {participants.map((p, index) => {
              const equalAmount = equalShares.find((e) => e.id === p.id)?.amount;

              return (
                <div
                  key={p.id}
                  className="p-2.5 sm:p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 flex flex-wrap sm:flex-nowrap items-center gap-x-2 gap-y-1.5 sm:gap-3"
                >
                  <div className="basis-[calc(100%-2.5rem)] sm:basis-auto flex-1 min-w-0 flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-500 w-4 sm:w-5 text-center shrink-0">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      placeholder="Nome do participante"
                      value={p.name}
                      onChange={(e) => handleUpdateParticipant(p.id, { name: e.target.value })}
                      className="flex-1 min-w-0 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-white text-sm focus:ring-2 focus:ring-zinc-600 focus:outline-none"
                    />
                  </div>

                  {/* Remove button (top-right on mobile, last on desktop) */}
                  <button
                    type="button"
                    onClick={() => handleRemoveParticipant(p.id)}
                    disabled={participants.length <= 2}
                    className="order-2 sm:order-4 p-1.5 sm:p-2 text-zinc-500 hover:text-rose-300 disabled:opacity-30 disabled:hover:text-zinc-500 transition-colors shrink-0"
                    title="Remover participante"
                    aria-label="Remover participante"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Owner checkbox */}
                  <label className="order-3 sm:order-2 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-medium text-zinc-400 select-none cursor-pointer sm:px-2 pl-6 sm:pl-0">
                    <input
                      type="checkbox"
                      checked={p.isOwner}
                      onChange={(e) =>
                        handleUpdateParticipant(p.id, { isOwner: e.target.checked })
                      }
                      className="rounded text-zinc-50 focus:ring-zinc-600"
                    />
                    <span className="sm:hidden">Organizador</span>
                    <span className="hidden sm:inline">Organizador (já pagou)</span>
                  </label>

                  {/* Mode display or input */}
                  {splitMode === 'Equal' ? (
                    <div className="order-4 sm:order-3 ml-auto sm:ml-0 sm:w-28 text-right sm:pr-2">
                      <span className="text-sm font-bold text-emerald-400">
                        {equalAmount ? formatBRL(equalAmount) : 'R$ 0,00'}
                      </span>
                    </div>
                  ) : (
                    <div className="order-4 sm:order-3 ml-auto sm:ml-0 w-28 sm:w-32">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="R$ 0,00"
                        value={p.amount}
                        onChange={(e) =>
                          handleUpdateParticipant(p.id, { amount: e.target.value })
                        }
                        className="w-full px-2.5 py-1 sm:py-1.5 text-right rounded-xl border border-zinc-700 bg-zinc-950 text-sm font-bold text-white focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary / validation bar */}
          {splitMode === 'Custom' && (
            <div className="p-4 rounded-xl bg-zinc-900 flex flex-wrap items-center justify-between text-xs font-medium gap-2">
              <div>
                Total distribuído:{' '}
                <span className="font-bold text-white">
                  {formatBRL(customSum)}
                </span>{' '}
                de{' '}
                <span className="font-bold text-white">
                  {formatBRL(totalAmount)}
                </span>
              </div>
              <div
                className={`font-bold ${
                  Math.abs(remainingCustom) < 0.01
                    ? 'text-emerald-400'
                    : ' text-amber-400'
                }`}
              >
                {Math.abs(remainingCustom) < 0.01
                  ? 'Soma exata!'
                  : `Falta distribuir: ${formatBRL(remainingCustom)}`}
              </div>
            </div>
          )}
        </div>

        {/* Mobile navigation */}
        <div className="sm:hidden flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => goToStep(step - 1)}
              className="flex-1 py-3.5 px-4 rounded-xl border border-zinc-800 text-zinc-300 font-semibold text-sm hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              Voltar
            </button>
          )}
          {step < LAST_STEP && (
            <button
              type="button"
              onClick={handleNext}
              className="flex-[2] py-3.5 px-4 rounded-xl bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-bold text-sm transition-colors cursor-pointer"
            >
              Próximo
            </button>
          )}
        </div>

        {/* Submit Button */}
        <div className={`pt-2 ${step === LAST_STEP ? '' : 'hidden sm:block'}`}>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-xl bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-bold text-base transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Criando Racha...' : 'Criar Racha e Gerar Links com Pix'}
          </button>
        </div>
      </form>
    </div>
  );
}
