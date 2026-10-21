'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import {
  useSplitCreateForm,
  LAST_STEP,
  STEP_LABELS,
} from '@/hooks/useSplitCreateForm';
import { SplitCreatedSuccess } from '@/components/splits/SplitCreatedSuccess';
import { SplitMobileStepper } from '@/components/splits/SplitMobileStepper';
import { SplitStepValue } from '@/components/splits/SplitStepValue';
import { SplitStepPix } from '@/components/splits/SplitStepPix';
import { SplitStepParticipants } from '@/components/splits/SplitStepParticipants';
import { SplitSummaryDesktop } from '@/components/splits/SplitSummaryDesktop';
import { SplitMobileActionBar } from '@/components/splits/SplitMobileActionBar';

export default function RacharPage() {
  const {
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
    loading,
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
  } = useSplitCreateForm();

  if (createdSplit) {
    return <SplitCreatedSuccess createdSplit={createdSplit} />;
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
        {/* Mobile Stepper Bar */}
        <SplitMobileStepper step={step} labels={STEP_LABELS} />

        {/* Form Content: 2 Columns on desktop (lg+), 1 step at a time on mobile */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start space-y-6 lg:space-y-0">
          {/* Left Column (approx 60%): Steps 1 (Valor) & 2 (Pix) stacked */}
          <div className="lg:col-span-6 space-y-6 lg:space-y-4">
            <SplitStepValue
              step={step}
              slideDir={slideDir}
              totalAmountStr={totalAmountStr}
              setTotalAmountStr={setTotalAmountStr}
              title={title}
              setTitle={setTitle}
              splitMode={splitMode}
              setSplitMode={setSplitMode}
            />

            <SplitStepPix
              step={step}
              slideDir={slideDir}
              pixKeyType={pixKeyType}
              setPixKeyType={setPixKeyType}
              pixKey={pixKey}
              setPixKey={setPixKey}
              receiverName={receiverName}
              setReceiverName={setReceiverName}
              selectedUf={selectedUf}
              setUfOverride={setUfOverride}
              receiverCity={receiverCity}
              setCityOverride={setCityOverride}
              cityOptions={cityOptions}
              citySource={citySource}
            />
          </div>

          {/* Right Column (approx 40%): Step 3 (Quem vai pagar) & Sticky Summary Card */}
          <div className="lg:col-span-6 space-y-6 lg:space-y-4">
            <SplitStepParticipants
              step={step}
              slideDir={slideDir}
              participants={participants}
              splitMode={splitMode}
              equalShares={equalShares}
              customSum={customSum}
              totalAmount={totalAmount}
              remainingCustom={remainingCustom}
              handleAddParticipant={handleAddParticipant}
              handleRemoveParticipant={handleRemoveParticipant}
              handleUpdateParticipant={handleUpdateParticipant}
            />

            <SplitSummaryDesktop
              totalAmount={totalAmount}
              splitMode={splitMode}
              participantsCount={participants.length}
              equalAmount={equalShares[0]?.amount ?? 0}
              loading={loading}
              termsAccepted={termsAccepted}
            />
          </div>
        </div>

        {/* Mobile / Tablet Sticky Action Bar */}
        <SplitMobileActionBar
          step={step}
          lastStep={LAST_STEP}
          totalAmount={totalAmount}
          loading={loading}
          termsAccepted={termsAccepted}
          onPrev={() => goToStep(step - 1)}
          onNext={handleNext}
        />
      </form>
    </div>
  );
}
