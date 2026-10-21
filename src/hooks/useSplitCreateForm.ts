'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import {
  ApiError,
  type CreateSplitRequest,
  type PixKeyType,
  type SplitAdminDto,
  type SplitMode,
} from '@/lib/api';
import {
  formatBRL,
  isValidCnpj,
  isValidCpf,
  normalizePixKey,
  sanitizePixCity,
  sanitizePixName,
  suggestCityFromPhone,
  UF_LIST,
  type UF,
} from '@/lib/formatters';
import { getCitiesByState } from '@/lib/ibge';
import { getLastCity, saveLastCity, saveSplit, type LastCity } from '@/lib/storage';
import { toast } from '@/components/ui/Toast';
import { useTermsAccepted } from '@/components/TermsConsent';
import { useCreateSplit } from '@/lib/query';

export const DEFAULT_CITY = 'BRASIL';
export const STEP_LABELS = ['Valor', 'Pix para receber', 'Quem vai pagar'];
export const LAST_STEP = STEP_LABELS.length - 1;

export interface ParticipantField {
  id: string;
  name: string;
  isOwner: boolean;
  amount: string;
}

export function sanitizeDecimalInput(val: string): string {
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

export function useSplitCreateForm() {
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

  const [participants, setParticipants] = useState<ParticipantField[]>([
    { id: '1', name: 'Eu (Organizador)', isOwner: true, amount: '' },
    { id: '2', name: 'Amigo 1', isOwner: false, amount: '' },
  ]);

  const [step, setStep] = useState(0);
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('right');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdSplit, setCreatedSplit] = useState<SplitAdminDto | null>(null);
  const lastStepTransitionRef = useRef(0);
  const { accepted: termsAccepted } = useTermsAccepted();

  const createSplitMutation = useCreateSplit();

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

  const totalAmount = Number.parseFloat(totalAmountStr) || 0;

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

  const customSum = useMemo(() => {
    return participants.reduce((sum, p) => sum + (Number.parseFloat(p.amount) || 0), 0);
  }, [participants]);

  const remainingCustom = totalAmount - customSum;

  const handleAddParticipant = () => {
    if (participants.length >= 50) return;
    setParticipants((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
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

  const validateValueStep = (): string | null => {
    if (!title.trim() || title.length > 80) {
      return 'O título deve ter entre 1 e 80 caracteres.';
    }
    if (totalAmount <= 0 || totalAmount > 1000000) {
      return 'O valor total deve ser maior que zero e menor ou igual a R$ 1.000.000,00.';
    }
    return null;
  };

  const validatePixStep = (): string | null => {
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
    return null;
  };

  const validateParticipantsStep = (): string | null => {
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
    return null;
  };

  const validateStep = (index: number): string | null => {
    if (index === 0) return validateValueStep();
    if (index === 1) return validatePixStep();
    if (index === 2) return validateParticipantsStep();
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
              amount: Number.parseFloat(p.amount) || 0,
            };
          }
        }),
      };

      const result = await createSplitMutation.mutateAsync(requestPayload);

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
    }
  };

  return {
    title,
    setTitle,
    totalAmountStr,
    setTotalAmountStr,
    totalAmount,
    pixKey,
    setPixKey,
    pixKeyType,
    setPixKeyType,
    receiverName,
    setReceiverName,
    receiverCity,
    citySource,
    cityOptions,
    selectedUf,
    setCityOverride,
    setUfOverride,
    splitMode,
    setSplitMode,
    participants,
    step,
    slideDir,
    errorMessage,
    createdSplit,
    loading: createSplitMutation.isPending,
    termsAccepted,
    equalShares,
    customSum,
    remainingCustom,
    handleAddParticipant,
    handleRemoveParticipant,
    handleUpdateParticipant,
    goToStep,
    handleNext,
    handleSubmit,
  };
}
