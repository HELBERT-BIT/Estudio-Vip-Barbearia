import React, { useState, useMemo, useEffect } from 'react';
import { useBarbershop } from '../../context/BarbershopContext';
import { BarberService, PaymentMethod } from '../../types';
import { getTodayString, getOffsetDateString } from '../../data/initialData';
import { generatePixPayload, generateQrCodeDataUrl, formatCNPJ } from '../../utils/pix';
import { 
  Scissors, 
  Calendar, 
  Clock, 
  User, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  ChevronRight, 
  QrCode, 
  Copy, 
  ShieldAlert, 
  Check, 
  Sparkles,
  Phone,
  Mail,
  FileText,
  BadgeAlert,
  Banknote,
  Wallet,
  ShieldCheck,
  Building2,
  Loader2
} from 'lucide-react';

interface BookingWizardProps {
  onBookingSuccess: () => void;
  preSelectedServiceId?: string;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({ 
  onBookingSuccess, 
  preSelectedServiceId 
}) => {
  const { 
    services, 
    settings, 
    getAvailableSlots, 
    createAppointment, 
    currentUser, 
    showToast 
  } = useBarbershop();

  const [currentStep, setCurrentStep] = useState<number>(preSelectedServiceId ? 2 : 1);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(() => {
    if (preSelectedServiceId) return [preSelectedServiceId];
    return services[0]?.id ? [services[0].id] : [];
  });

  // Calculate combo services, total price, total duration, and combined name in real time
  const selectedServices = useMemo(() => {
    return services.filter((s) => selectedServiceIds.includes(s.id));
  }, [services, selectedServiceIds]);

  const totalPrice = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.price, 0);
  }, [selectedServices]);

  const totalDurationMinutes = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [selectedServices]);

  const combinedServiceNames = useMemo(() => {
    return selectedServices.map((s) => s.name).join(' + ') || 'Nenhum serviço';
  }, [selectedServices]);

  // Selection mode: individual service (default, avoids forcing combo) vs combo
  const [isComboMode, setIsComboMode] = useState<boolean>(() => {
    return selectedServiceIds.length > 1;
  });

  const handleSelectService = (serviceId: string) => {
    if (isComboMode) {
      if (selectedServiceIds.includes(serviceId)) {
        if (selectedServiceIds.length === 1) {
          showToast('Mantenha pelo menos um serviço selecionado.', 'info');
          return;
        }
        setSelectedServiceIds(selectedServiceIds.filter((id) => id !== serviceId));
      } else {
        setSelectedServiceIds([...selectedServiceIds, serviceId]);
      }
    } else {
      // Modo individual: escolhe apenas este serviço, sem forçar combo nem inflar o tempo
      setSelectedServiceIds([serviceId]);
    }
  };

  const handleAddServiceToCombo = (e: React.MouseEvent, serviceId: string) => {
    e.stopPropagation();
    setIsComboMode(true);
    if (!selectedServiceIds.includes(serviceId)) {
      setSelectedServiceIds([...selectedServiceIds, serviceId]);
      showToast('Serviço adicionado ao seu combo!', 'success');
    }
  };
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const todayStr = getTodayString();
    const now = new Date();
    const todayOfWeek = now.getDay();
    const todayConfig = settings.workingDays.find((d) => d.dayOfWeek === todayOfWeek);
    const isTodayOpen = settings.manualOverrideStatus === 'open' || 
      (settings.manualOverrideStatus !== 'closed' && !!(todayConfig && todayConfig.active));

    if (isTodayOpen) return todayStr;

    for (let i = 1; i < 14; i++) {
      const nextDateStr = getOffsetDateString(i);
      const [y, m, d] = nextDateStr.split('-').map(Number);
      const dow = new Date(y, m - 1, d).getDay();
      const cfg = settings.workingDays.find((wd) => wd.dayOfWeek === dow);
      if (cfg && cfg.active) {
        return nextDateStr;
      }
    }
    return todayStr;
  });
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  // Client details
  const [clientName, setClientName] = useState<string>(currentUser?.name || '');
  const [clientPhone, setClientPhone] = useState<string>(currentUser?.phone || '');
  const [clientEmail, setClientEmail] = useState<string>(currentUser?.email || '');
  const [clientNotes, setClientNotes] = useState<string>('');

  // Payment choice: 50% reservation deposit (sinal) or 100% full upfront
  const [paymentChoice, setPaymentChoice] = useState<'sinal_50' | 'integral'>('sinal_50');
  const [remainingPaymentMethod, setRemainingPaymentMethod] = useState<PaymentMethod>('dinheiro');
  const [copiedPixCode, setCopiedPixCode] = useState(false);
  const [copiedCnpj, setCopiedCnpj] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [cashChangeOption, setCashChangeOption] = useState<'exact' | '50' | '100' | 'custom'>('exact');
  const [customCashChange, setCustomCashChange] = useState<string>('');

  // Result of created appointment
  const [createdAptId, setCreatedAptId] = useState<string | null>(null);

  // Pix payment verification enforcement states
  const [hasDeclaredPixPaid, setHasDeclaredPixPaid] = useState<boolean>(false);
  const [pixAuthCode, setPixAuthCode] = useState<string>('');
  const [isVerifyingPix, setIsVerifyingPix] = useState<boolean>(false);
  const [pixConfirmed, setPixConfirmed] = useState<boolean>(false);

  // Exact deposit and remaining amounts
  const depositAmount = useMemo(() => {
    if (paymentChoice === 'sinal_50') {
      return Math.round((totalPrice * 0.5) * 100) / 100;
    }
    return totalPrice;
  }, [totalPrice, paymentChoice]);

  const remainingBalance = useMemo(() => {
    if (paymentChoice === 'sinal_50') {
      return Math.round((totalPrice - depositAmount) * 100) / 100;
    }
    return 0;
  }, [totalPrice, depositAmount, paymentChoice]);

  // Generate official Pix payload and QR Code
  const pixPayload = useMemo(() => {
    return generatePixPayload({
      pixKey: settings.pixKey,
      merchantName: settings.pixReceiverName || 'MARIANO A SILVA',
      merchantCity: 'COXIM',
      amount: depositAmount,
      txId: 'VIP' + Math.floor(100000 + Math.random() * 900000).toString(),
    });
  }, [settings.pixKey, settings.pixReceiverName, depositAmount]);

  useEffect(() => {
    let isCurrent = true;
    if (depositAmount > 0) {
      generateQrCodeDataUrl(pixPayload).then((dataUrl) => {
        if (isCurrent) setQrCodeDataUrl(dataUrl);
      });
    }
    return () => {
      isCurrent = false;
    };
  }, [pixPayload, depositAmount]);

  // Keep client details synced with currentUser if logged in
  React.useEffect(() => {
    if (currentUser) {
      if (!clientName) setClientName(currentUser.name);
      if (!clientPhone) setClientPhone(currentUser.phone);
      if (!clientEmail) setClientEmail(currentUser.email);
    }
  }, [currentUser]);

  // Generate next 14 calendar days for quick selection
  const upcomingDays = useMemo(() => {
    const days = [];
    const weekdaysShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const todayStr = getTodayString();

    for (let i = 0; i < 14; i++) {
      const dateStr = getOffsetDateString(i);
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dayOfWeek = dateObj.getDay();
      const dayConfig = settings.workingDays.find((wd) => wd.dayOfWeek === dayOfWeek);

      const isToday = i === 0 || dateStr === todayStr;
      
      // Automatic house rule: Sunday (dayOfWeek === 0) is closed by default unless activated by owner
      let isOpen = !!(dayConfig && dayConfig.active);
      let isManualOpenToday = false;

      if (isToday) {
        if (settings.manualOverrideStatus === 'open') {
          isOpen = true;
          isManualOpenToday = true;
        } else if (settings.manualOverrideStatus === 'closed') {
          isOpen = false;
        }
      }

      days.push({
        dateStr,
        dayNumber: d,
        monthName: dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        weekdayName: weekdaysShort[dayOfWeek],
        isOpen,
        isToday,
        isManualOpenToday,
      });
    }
    return days;
  }, [settings.workingDays, settings.manualOverrideStatus]);

  // If owner manually opens today, automatically switch selectedDate to today so slots are visible right away
  React.useEffect(() => {
    const todayStr = getTodayString();
    if (settings.manualOverrideStatus === 'open') {
      setSelectedDate(todayStr);
    }
  }, [settings.manualOverrideStatus]);

  // If currently selected date is closed, automatically fallback to the first open day
  React.useEffect(() => {
    const currentDay = upcomingDays.find((d) => d.dateStr === selectedDate);
    if (currentDay && !currentDay.isOpen) {
      const firstOpen = upcomingDays.find((d) => d.isOpen);
      if (firstOpen) {
        setSelectedDate(firstOpen.dateStr);
        setSelectedTime('');
      }
    }
  }, [upcomingDays, selectedDate]);

  // Slots for the currently selected date with continuous dynamic duration
  const availableSlots = useMemo(() => {
    return getAvailableSlots(selectedDate, totalDurationMinutes);
  }, [selectedDate, getAvailableSlots, totalDurationMinutes, settings.manualOverrideStatus, settings.blockedSlotsByDate, settings.customUnlockedSlotsByDate]);

  const primaryService = selectedServices[0] || services[0];

  // Formatting phone number on input
  const handlePhoneChange = (val: string) => {
    // Only numbers
    const digits = val.replace(/\D/g, '').substring(0, 11);
    let formatted = digits;
    if (digits.length > 2) {
      formatted = `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
    }
    if (digits.length > 7) {
      formatted = `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
    }
    setClientPhone(formatted);
  };

  const handleCopyCnpj = () => {
    navigator.clipboard.writeText(settings.pixKey);
    setCopiedCnpj(true);
    showToast('Chave CNPJ copiada! Cole no aplicativo do seu banco.', 'success');
    setTimeout(() => setCopiedCnpj(false), 3000);
  };

  const handleCopyPixCode = () => {
    if (!pixPayload) return;
    navigator.clipboard.writeText(pixPayload);
    setCopiedPixCode(true);
    showToast('Código Pix Copia e Cola copiado com sucesso!', 'success');
    setTimeout(() => setCopiedPixCode(false), 3000);
  };

  const handleVerifyAndConfirmPix = () => {
    if (selectedServices.length === 0 || !primaryService) {
      showToast('Por favor, selecione pelo menos um serviço para continuar.', 'error');
      setCurrentStep(1);
      return;
    }
    if (!clientName.trim() || clientPhone.replace(/\D/g, '').length < 10) {
      showToast('Por favor, informe seu nome completo e WhatsApp válido.', 'error');
      setCurrentStep(2);
      return;
    }
    if (!selectedDate || !selectedTime) {
      showToast('Por favor, selecione um dia e horário livre.', 'error');
      setCurrentStep(3);
      return;
    }

    if (!hasDeclaredPixPaid) {
      showToast('Por favor, realize a transferência Pix e marque a caixa de confirmação para validar sua vaga na agenda.', 'warning', 'Pix Pendente');
      return;
    }

    setIsVerifyingPix(true);

    // Simulate authenticating and verifying Pix receipt on Mariano's Nubank account
    setTimeout(() => {
      setIsVerifyingPix(false);
      setPixConfirmed(true);

      const finalPaymentType = paymentChoice === 'sinal_50' ? 'sinal_50' : 'antecipado';
      const finalDeposit = depositAmount;
      const finalRemaining = remainingBalance;

      let finalNotes = clientNotes.trim();
      const pixReceiptText = pixAuthCode.trim() ? ` • Autenticação Pix: ${pixAuthCode.trim()}` : '';

      if (paymentChoice === 'sinal_50') {
        const methodLabels: Record<PaymentMethod, string> = {
          pix: 'Pix no Balcão (QR Code)',
          cartao_credito: 'Cartão de Crédito',
          cartao_debito: 'Cartão de Débito',
          dinheiro: 'Dinheiro em Espécie',
        };
        let changeText = '';
        if (remainingPaymentMethod === 'dinheiro') {
          if (cashChangeOption === '50') changeText = ' • Precisa de troco p/ R$ 50,00';
          else if (cashChangeOption === '100') changeText = ' • Precisa de troco p/ R$ 100,00';
          else if (cashChangeOption === 'custom' && customCashChange) changeText = ` • Precisa de troco p/ ${customCashChange}`;
          else changeText = ' • Levará valor exato (sem troco)';
        }
        const paymentTag = `[Sinal de Reserva 50% R$ ${finalDeposit.toFixed(2).replace('.', ',')} CONFIRMADO via Pix (Nubank - Mariano)${pixReceiptText} • Restante R$ ${finalRemaining.toFixed(2).replace('.', ',')} a pagar no balcão via ${methodLabels[remainingPaymentMethod]}${changeText}]`;
        finalNotes = finalNotes ? `${paymentTag} • ${finalNotes}` : paymentTag;
      } else {
        const paymentTag = `[100% Quitado via Pix R$ ${finalDeposit.toFixed(2).replace('.', ',')} CONFIRMADO (Nubank - Mariano)${pixReceiptText}]`;
        finalNotes = finalNotes ? `${paymentTag} • ${finalNotes}` : paymentTag;
      }

      const created = createAppointment({
        serviceId: primaryService.id,
        serviceIds: selectedServiceIds,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim() || undefined,
        date: selectedDate,
        time: selectedTime,
        paymentType: finalPaymentType,
        paymentMethod: 'pix',
        depositAmount: finalDeposit,
        remainingAmount: finalRemaining,
        remainingPaymentMethod: paymentChoice === 'sinal_50' ? remainingPaymentMethod : undefined,
        notes: finalNotes || undefined,
      });

      if (created) {
        setCreatedAptId(created.id);
        setCurrentStep(5);
        showToast(
          `✓ Pagamento Pix de R$ ${finalDeposit.toFixed(2).replace('.', ',')} confirmado no Nubank! Vaga reservada.`, 
          'success', 
          'Agendamento Confirmado'
        );
      }
    }, 1300);
  };

  const selectedDateObject = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDate]);

  const formattedSelectedDate = selectedDateObject.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="w-full max-w-4xl mx-auto bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/90 rounded-3xl shadow-2xl overflow-hidden">
      {/* Wizard Header Progress */}
      <div className="bg-zinc-950/80 backdrop-blur-md p-6 border-b border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Agendamento Online
              </span>
              <span className="text-xs text-zinc-500">•</span>
              <span className="text-xs text-zinc-400">Confirmação Imediata</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-brand text-zinc-100 mt-1">
              {currentStep === 1 && '1. Escolha os Serviços (Combo)'}
              {currentStep === 2 && '2. Seus Dados de Contato'}
              {currentStep === 3 && '3. Escolha Data & Horário Livre'}
              {currentStep === 4 && '4. Pagamento & Garantia de Reserva'}
              {currentStep === 5 && 'Agendamento Confirmado!'}
            </h2>
          </div>

          {/* Stepper pills */}
          {currentStep < 5 && (
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  onClick={() => {
                    // Allow navigating backwards or forwards if valid
                    if (step < currentStep) setCurrentStep(step);
                    else if (step === 2 && selectedServiceIds.length > 0) setCurrentStep(2);
                    else if (step === 3 && clientName.trim() && clientPhone) setCurrentStep(3);
                    else if (step === 4 && selectedTime) setCurrentStep(4);
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all ${
                    currentStep === step
                      ? 'bg-amber-500 text-zinc-950 ring-4 ring-amber-500/20'
                      : step < currentStep
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {step < currentStep ? <Check className="w-3.5 h-3.5" /> : step}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Wizard Step Indicator Breadcrumb */}
        {currentStep < 5 && (
          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] sm:text-xs font-bold text-zinc-400">
            <span className={currentStep === 1 ? 'text-amber-400 font-black' : ''}>
              {selectedServices.length > 1 ? '1. Serviços (Combo)' : '1. Serviço'}
            </span>
            <span>/</span>
            <span className={currentStep === 2 ? 'text-amber-400 font-black' : ''}>2. Seus Dados</span>
            <span>/</span>
            <span className={currentStep === 3 ? 'text-amber-400 font-black' : ''}>3. Data &amp; Horário</span>
            <span>/</span>
            <span className={currentStep === 4 ? 'text-amber-400 font-black' : ''}>4. Pagamento Pix</span>
          </div>
        )}

        {/* Essential Rule Banner about Tolerance */}
        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-start gap-2.5 text-xs text-amber-300/90 leading-relaxed">
          <BadgeAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300">Regra de Pontualidade &amp; Tolerância:</span>{' '}
            Chegue entre <strong className="text-white">5 e 10 minutos antes</strong> do horário marcado. 
            Nosso sistema tem <strong className="text-white">tolerância máxima de 10 minutos</strong>. Caso ultrapasse esse tempo sem check-in no balcão, o horário é automaticamente cancelado e liberado para outros clientes.
          </div>
        </div>
      </div>

      {/* Wizard Content Body */}
      <div className="p-4 sm:p-6">
        {/* STEP 1: Select Service (Single or Combo) */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1">
              <div>
                <h3 className="text-base sm:text-lg font-bold font-brand text-zinc-100 flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-amber-400" />
                  <span>Escolha seu Atendimento</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Selecione um serviço individual ou combine múltiplos serviços no combo se desejar.
                </p>
              </div>
              <div className="self-start sm:self-auto flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                  {selectedServices.length === 1 ? '1 serviço individual' : `${selectedServices.length} serviços no combo`}
                </span>
              </div>
            </div>

            {/* Mode Switcher: Single Service vs Custom Combo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsComboMode(false);
                    if (selectedServiceIds.length > 1) {
                      setSelectedServiceIds([selectedServiceIds[0]]);
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    !isComboMode
                      ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>1 Serviço Individual</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsComboMode(true)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isComboMode
                      ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+ Montar Combo (Mais de 1 serviço)</span>
                </button>
              </div>

              <span className="text-[11px] text-zinc-400 font-medium">
                {!isComboMode ? 'Toque no serviço para escolhê-lo' : 'Marque todos os serviços desejados'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services
                .filter((s) => s.active)
                .map((service) => {
                  const isSelected = selectedServiceIds.includes(service.id);
                  return (
                    <div
                      key={service.id}
                      onClick={() => handleSelectService(service.id)}
                      className={`relative rounded-2xl border transition-all cursor-pointer flex flex-col justify-between overflow-hidden group select-none ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 shadow-xl shadow-amber-500/10 ring-2 ring-amber-500/50'
                          : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700 hover:bg-zinc-900/60'
                      }`}
                    >
                      {/* Service Image Banner with fallback */}
                      <div className="relative w-full h-36 sm:h-44 bg-zinc-950 overflow-hidden">
                        {service.imageUrl ? (
                          <img
                            src={service.imageUrl}
                            alt={service.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-full h-full items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950 text-amber-400 ${service.imageUrl ? 'hidden' : 'flex'}`}
                        >
                          <Scissors className="w-10 h-10 opacity-40" />
                        </div>
                        {/* Gradient Scrim for contrast */}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent pointer-events-none" />

                        {/* Badges Overlay */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-zinc-950/80 backdrop-blur-md text-zinc-300 border border-zinc-800">
                            {service.category}
                          </span>
                          {service.popular && (
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500 text-zinc-950 shadow-md">
                              Mais Pedido
                            </span>
                          )}
                        </div>

                        {/* Selected Indicator Badge */}
                        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
                          {isSelected ? (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-zinc-950 text-xs font-bold flex items-center gap-1 shadow-lg animate-in zoom-in-75 duration-200">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>{isComboMode ? 'No Combo' : 'Selecionado'}</span>
                            </span>
                          ) : (
                            <>
                              {!isComboMode && (
                                <button
                                  type="button"
                                  onClick={(e) => handleAddServiceToCombo(e, service.id)}
                                  className="px-2 py-1 rounded-lg bg-zinc-950/90 hover:bg-amber-500 hover:text-zinc-950 border border-amber-500/40 text-amber-400 text-[11px] font-semibold flex items-center gap-1 backdrop-blur-md transition-colors"
                                  title="Adicionar junto ao combo"
                                >
                                  + Combo
                                </button>
                              )}
                              <span className="px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1 backdrop-blur-md">
                                <span>{isComboMode ? '+ Incluir' : 'Escolher'}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <h4 className="font-bold text-zinc-100 text-base group-hover:text-amber-400 transition-colors flex items-center gap-2">
                              <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-amber-500 border-amber-400 text-zinc-950' : 'border-zinc-700 bg-zinc-900'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </span>
                              <span>{service.name}</span>
                            </h4>
                            <span className="font-brand text-lg font-bold text-amber-400 tabular-nums whitespace-nowrap">
                              R$ {service.price.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3 pl-6">
                            {service.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs pl-6">
                          <span className="text-zinc-400 flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            {service.durationMinutes} min
                          </span>
                          <span className={`text-xs font-semibold ${isSelected ? 'text-amber-400' : 'text-zinc-500'}`}>
                            {isSelected ? '✓ Selecionado' : 'Clique para selecionar'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* REAL-TIME STICKY SUMMARY BAR */}
            <div className="sticky bottom-0 z-20 mt-6 p-4 sm:p-5 rounded-2xl bg-zinc-950/95 border border-amber-500/40 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-zinc-950">
                    {selectedServices.length > 1
                      ? `Combo Personalizado (${selectedServices.length} serviços)`
                      : 'Serviço Selecionado'}
                  </span>
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <strong>{totalDurationMinutes} min</strong> estimados
                  </span>
                </div>
                <p className="text-xs font-semibold text-zinc-200 truncate max-w-md">
                  {combinedServiceNames}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                    {selectedServices.length > 1 ? 'Total do Combo:' : 'Valor do Atendimento:'}
                  </span>
                  <span className="text-xl sm:text-2xl font-bold font-brand text-amber-400 tabular-nums">
                    R$ {totalPrice.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={selectedServices.length === 0}
                  onClick={() => setCurrentStep(2)}
                  className="py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 disabled:opacity-40 text-zinc-950 font-bold text-sm flex items-center gap-2 transition-all shadow-xl shadow-amber-500/20 active:scale-95 cursor-pointer shrink-0"
                >
                  <span>Continuar para Seus Dados</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Client Details */}
        {currentStep === 2 && (
          <div className="space-y-5 max-w-xl mx-auto">
            <div className="text-center pb-2">
              <h4 className="text-lg font-bold text-zinc-100 font-brand">Seus Dados de Contato</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Informe seu nome e WhatsApp para receber a confirmação e garantir seu atendimento.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Seu nome completo"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Telefone com WhatsApp *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="(67) 99944-0532"
                    value={clientPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  Ex: DDD + 9 dígitos (necessário para identificação no balcão).
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  E-mail (Opcional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Preferências ou Observações (Opcional)
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                  <textarea
                    rows={2}
                    placeholder="Ex: Prefiro navalha tradicional, barba bem alinhada, etc."
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors cursor-pointer"
              >
                Voltar aos Serviços
              </button>
              <button
                type="button"
                disabled={!clientName.trim() || clientPhone.replace(/\D/g, '').length < 10}
                onClick={() => setCurrentStep(3)}
                className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <span>Avançar para Data &amp; Horário</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Select Date & Time */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Combo Services Summary Card */}
            {selectedServices.length > 0 && (
              <div className="p-4 rounded-2xl bg-zinc-950 border border-amber-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Serviços Escolhidos no Combo ({selectedServices.length}):
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="self-start sm:self-auto text-xs text-amber-400 hover:text-amber-300 font-semibold underline cursor-pointer"
                  >
                    + Adicionar ou Alterar Serviços
                  </button>
                </div>

                {/* List of each chosen service with itemized pricing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {selectedServices.map((svc) => (
                    <div
                      key={svc.id}
                      className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {svc.imageUrl ? (
                          <img
                            src={svc.imageUrl}
                            alt=""
                            className="w-7 h-7 rounded-lg object-cover border border-zinc-800 shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-zinc-800 text-amber-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                            VIP
                          </div>
                        )}
                        <div className="min-w-0">
                          <strong className="text-zinc-200 block truncate">{svc.name}</strong>
                          <span className="text-[10px] text-zinc-500">{svc.durationMinutes} min</span>
                        </div>
                      </div>
                      <span className="text-amber-400 font-brand font-bold text-xs shrink-0 ml-2">
                        R$ {svc.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Combo Total Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Duração Total Estimada: <strong className="text-zinc-200">{totalDurationMinutes} minutos</strong>
                  </span>
                  <div>
                    <span className="text-zinc-400 mr-2">Valor Total do Combo:</span>
                    <strong className="text-base font-bold font-brand text-amber-400">
                      R$ {totalPrice.toFixed(2).replace('.', ',')}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Date Selection: horizontal carousel of upcoming 14 days */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  1. Escolha a Data
                </label>
                <span className="text-xs text-amber-400 font-medium capitalize">
                  {formattedSelectedDate}
                </span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none touch-pan-x scroll-smooth overscroll-x-contain">
                {upcomingDays.map((day) => {
                  const isSelected = selectedDate === day.dateStr;
                  return (
                    <button
                      key={day.dateStr}
                      type="button"
                      disabled={!day.isOpen}
                      onClick={() => {
                        setSelectedDate(day.dateStr);
                        setSelectedTime(''); // Reset time when date changes
                      }}
                      className={`relative flex flex-col items-center justify-center min-w-[76px] p-2.5 rounded-2xl border transition-all ${
                        !day.isOpen
                          ? 'border-zinc-800/40 bg-zinc-950/40 opacity-45 cursor-not-allowed text-zinc-600'
                          : isSelected
                          ? 'border-amber-500 bg-amber-500 text-zinc-950 font-bold shadow-lg shadow-amber-500/20 scale-105'
                          : day.isManualOpenToday
                          ? 'border-emerald-500/60 bg-emerald-950/30 text-zinc-200 hover:border-emerald-500 shadow-md shadow-emerald-500/10'
                          : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 text-zinc-300'
                      }`}
                      title={!day.isOpen ? 'Fechado (Norma da casa)' : day.isManualOpenToday ? 'Aberto hoje pelo barbeiro!' : 'Dia com expediente normal'}
                    >
                      {day.isManualOpenToday && !isSelected && (
                        <span className="absolute -top-1.5 right-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-emerald-500 text-zinc-950 shadow animate-pulse">
                          Aberto Hoje
                        </span>
                      )}
                      {!day.isOpen && (
                        <span className="absolute -top-1.5 px-1 py-0.2 rounded text-[7px] font-bold bg-zinc-900 border border-zinc-800 text-zinc-500">
                          Fechado
                        </span>
                      )}
                      <span className={`text-[10px] uppercase font-semibold ${isSelected ? 'text-zinc-900' : day.isManualOpenToday ? 'text-emerald-400 font-bold' : 'text-zinc-400'}`}>
                        {day.weekdayName}
                      </span>
                      <span className="text-lg font-bold font-brand my-0.5">
                        {day.dayNumber}
                      </span>
                      <span className={`text-[10px] ${isSelected ? 'text-zinc-900 font-medium' : day.isManualOpenToday ? 'text-emerald-300 font-bold' : 'text-zinc-500'}`}>
                        {day.isToday ? 'Hoje' : day.monthName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slot Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  2. Horários Disponíveis para {selectedDate === getTodayString() ? 'Hoje' : 'esta Data'}
                </label>

                {/* Legend */}
                <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Livre
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-700"></span> Ocupado / Indisponível
                  </span>
                </div>
              </div>

              {/* Special notice if opened manually today */}
              {selectedDate === getTodayString() && settings.manualOverrideStatus === 'open' && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <strong className="text-white">Expediente Aberto Hoje pelo Barbeiro!</strong>{' '}
                    O barbeiro Mariano ativou o atendimento para hoje. Escolha seu horário disponível abaixo:
                  </div>
                </div>
              )}

              {availableSlots.length === 0 ? (
                <div className="p-8 text-center bg-zinc-950 rounded-2xl border border-zinc-800 text-zinc-400">
                  <p className="font-semibold text-zinc-200">
                    {selectedDate === getTodayString() && settings.manualOverrideStatus === 'closed'
                      ? 'Barbearia desativada hoje pelo proprietário.'
                      : selectedDate === getTodayString()
                      ? 'Barbearia fechada hoje (Norma da casa: Fechada aos domingos).'
                      : 'Barbearia fechada nesta data (Norma da casa).'}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {selectedDate === getTodayString()
                      ? 'A barbearia só abre aos domingos se o proprietário ativar o expediente. Selecione outro dia com expediente ativo acima.'
                      : 'Por favor, selecione outro dia com expediente ativo no calendário acima.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedTime === slot.time;

                    if (slot.isLunchBreak) {
                      return (
                        <div
                          key={slot.time}
                          className="p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-800/40 text-center opacity-40 cursor-not-allowed"
                          title="Intervalo de Almoço da barbearia"
                        >
                          <span className="text-xs font-medium text-zinc-500 line-through">
                            {slot.time}
                          </span>
                          <span className="block text-[9px] text-zinc-600">Almoço</span>
                        </div>
                      );
                    }

                    if (slot.isBlockedByOwner) {
                      return (
                        <div
                          key={slot.time}
                          className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/60 text-center opacity-40 cursor-not-allowed group"
                          title="Horário indisponível por decisão do barbeiro"
                        >
                          <span className="text-xs font-medium text-zinc-500 line-through">
                            {slot.time}
                          </span>
                          <span className="block text-[9px] text-rose-400/80">
                            Indisponível
                          </span>
                        </div>
                      );
                    }

                    if (!slot.isAvailable) {
                      const reasonTitle = slot.occupiedUntil 
                        ? `Atendimento em andamento até às ${slot.occupiedUntil}` 
                        : (slot.unavailableReason || 'Horário já reservado');
                      return (
                        <div
                          key={slot.time}
                          className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-center opacity-60 cursor-not-allowed group transition-all"
                          title={reasonTitle}
                        >
                          <span className="text-xs font-medium text-zinc-500 line-through">
                            {slot.time}
                          </span>
                          <span className="block text-[8px] sm:text-[9px] font-semibold text-zinc-400 group-hover:text-amber-400/90 truncate mt-0.5">
                            {slot.occupiedUntil ? `Até ${slot.occupiedUntil}` : (slot.isPast ? 'Transcorrido' : 'Reservado')}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => setSelectedTime(slot.time)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-lg shadow-amber-500/25 scale-105'
                            : 'bg-zinc-950 border-emerald-500/30 hover:border-amber-500/60 text-zinc-200 hover:bg-zinc-900'
                        }`}
                      >
                        <span className="text-sm font-bold block">{slot.time}</span>
                        <span
                          className={`text-[10px] block mt-0.5 font-medium ${
                            isSelected ? 'text-zinc-950' : 'text-emerald-400'
                          }`}
                        >
                          {isSelected ? 'Escolhido' : 'Disponível'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors cursor-pointer"
              >
                Voltar para Seus Dados
              </button>
              <button
                type="button"
                disabled={!selectedTime}
                onClick={() => setCurrentStep(4)}
                className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <span>Confirmar Horário: {selectedTime || 'Selecione'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Payment & Final Confirmation */}
        {currentStep === 4 && selectedServices.length > 0 && (
          <div className="space-y-6">
            {/* Elegant Explanation Banner about the 50% Guarantee Fee */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-zinc-900 to-zinc-900 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                <h4 className="text-sm font-bold text-amber-300 font-brand">
                  Taxa de Garantia &amp; Reserva Exclusiva do Horário
                </h4>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Para valorizar a dedicação e a pontualidade do barbeiro <strong>Mariano</strong> e garantir que seu horário permaneça reservado com total exclusividade na agenda (evitando horários ociosos e cancelamentos de última hora), solicitamos um adiantamento de <strong>50% do valor do serviço</strong> via Pix. O restante (50%) você acerta presencialmente no balcão da barbearia após o atendimento, no método que preferir. Caso prefira total praticidade, você também pode optar por quitar <strong>100% antecipadamente</strong> via Pix!
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Payment Mode Selection (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>Escolha a Modalidade de Pagamento:</span>
                </h4>

                {/* Option 1: 50% Reservation Guarantee (Recommended) */}
                <div
                  onClick={() => setPaymentChoice('sinal_50')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                    paymentChoice === 'sinal_50'
                      ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                      : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        paymentChoice === 'sinal_50' ? 'border-amber-400 bg-amber-500 text-zinc-950' : 'border-zinc-700 bg-zinc-900'
                      }`}>
                        {paymentChoice === 'sinal_50' && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                      <span>Pagar Sinal de 50% (Garantia de Reserva)</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed pl-6">
                    Pague <strong className="text-amber-400 font-brand">R$ {(totalPrice * 0.5).toFixed(2).replace('.', ',')}</strong> agora no Pix do Mariano para travar sua cadeira. O restante de <strong className="text-zinc-200">R$ {(totalPrice * 0.5).toFixed(2).replace('.', ',')}</strong> você paga presencialmente na barbearia.
                  </p>
                </div>

                {/* Sub-selector for Remaining Balance Payment Method */}
                {paymentChoice === 'sinal_50' && (
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3.5 animate-in fade-in duration-200">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Wallet className="w-4 h-4 text-amber-400" />
                          Como você pretende pagar os 50% restantes no balcão?
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Informe abaixo para que o barbeiro Mariano já deixe a maquininha ou seu troco preparado:
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Pix no Balcão */}
                      <button
                        type="button"
                        onClick={() => setRemainingPaymentMethod('pix')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          remainingPaymentMethod === 'pix'
                            ? 'border-amber-500 bg-amber-500/15 ring-1 ring-amber-500/50'
                            : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                            Pix no Balcão
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 block mt-1">Celular na hora</span>
                      </button>

                      {/* Cartão de Crédito */}
                      <button
                        type="button"
                        onClick={() => setRemainingPaymentMethod('cartao_credito')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          remainingPaymentMethod === 'cartao_credito'
                            ? 'border-amber-500 bg-amber-500/15 ring-1 ring-amber-500/50'
                            : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                            Cartão Crédito
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 block mt-1">Maquininha física</span>
                      </button>

                      {/* Cartão de Débito */}
                      <button
                        type="button"
                        onClick={() => setRemainingPaymentMethod('cartao_debito')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          remainingPaymentMethod === 'cartao_debito'
                            ? 'border-amber-500 bg-amber-500/15 ring-1 ring-amber-500/50'
                            : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                            Cartão Débito
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 block mt-1">À vista no cartão</span>
                      </button>

                      {/* Dinheiro em Espécie */}
                      <button
                        type="button"
                        onClick={() => setRemainingPaymentMethod('dinheiro')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          remainingPaymentMethod === 'dinheiro'
                            ? 'border-amber-500 bg-amber-500/15 ring-1 ring-amber-500/50'
                            : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                            <Banknote className="w-3.5 h-3.5 text-amber-400" />
                            Dinheiro
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 block mt-1">Em cédulas</span>
                      </button>
                    </div>

                    {/* Troco se dinheiro */}
                    {remainingPaymentMethod === 'dinheiro' && (
                      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2 mt-2">
                        <span className="text-[11px] font-bold text-amber-400 block">
                          Precisa de troco para os R$ {remainingBalance.toFixed(2).replace('.', ',')} restantes?
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <button
                            type="button"
                            onClick={() => setCashChangeOption('exact')}
                            className={`p-1.5 rounded-lg text-xs font-semibold text-center transition-all ${
                              cashChangeOption === 'exact'
                                ? 'bg-amber-500 text-zinc-950 font-bold'
                                : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800'
                            }`}
                          >
                            Sem Troco
                          </button>
                          <button
                            type="button"
                            onClick={() => setCashChangeOption('50')}
                            className={`p-1.5 rounded-lg text-xs font-semibold text-center transition-all ${
                              cashChangeOption === '50'
                                ? 'bg-amber-500 text-zinc-950 font-bold'
                                : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800'
                            }`}
                          >
                            Troco p/ R$ 50
                          </button>
                          <button
                            type="button"
                            onClick={() => setCashChangeOption('100')}
                            className={`p-1.5 rounded-lg text-xs font-semibold text-center transition-all ${
                              cashChangeOption === '100'
                                ? 'bg-amber-500 text-zinc-950 font-bold'
                                : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800'
                            }`}
                          >
                            Troco p/ R$ 100
                          </button>
                          <button
                            type="button"
                            onClick={() => setCashChangeOption('custom')}
                            className={`p-1.5 rounded-lg text-xs font-semibold text-center transition-all ${
                              cashChangeOption === 'custom'
                                ? 'bg-amber-500 text-zinc-950 font-bold'
                                : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800'
                            }`}
                          >
                            Outro Valor
                          </button>
                        </div>
                        {cashChangeOption === 'custom' && (
                          <input
                            type="text"
                            placeholder="Ex: Troco para R$ 60,00"
                            value={customCashChange}
                            onChange={(e) => setCustomCashChange(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 mt-1"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Option 2: 100% Full Payment via Pix */}
                <div
                  onClick={() => setPaymentChoice('integral')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                    paymentChoice === 'integral'
                      ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                      : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        paymentChoice === 'integral' ? 'border-amber-400 bg-amber-500 text-zinc-950' : 'border-zinc-700 bg-zinc-900'
                      }`}>
                        {paymentChoice === 'integral' && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                      <span>Quitar 100% Antecipado via Pix</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Total Comodidade
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed pl-6">
                    Pague o valor integral de <strong className="text-emerald-400 font-brand">R$ {totalPrice.toFixed(2).replace('.', ',')}</strong> agora. Você chega na barbearia e vai direto para a cadeira sem precisar passar pelo caixa!
                  </p>
                </div>

                {/* Official Mariano Pix Box (Nubank) with Real Dynamic QR Code */}
                <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-amber-500/40 space-y-4 shadow-xl">
                  {/* Bank & Receiver Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-zinc-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-600/30 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-purple-400" />
                          Nubank
                        </span>
                        <span className="text-xs font-bold text-zinc-200">
                          {settings.pixReceiverName || 'Mariano Almeida da Silva Junior'}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400 block mt-0.5">
                        Chave CNPJ: <strong className="text-zinc-200 font-mono">{settings.pixKeyFormatted || formatCNPJ(settings.pixKey)}</strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyCnpj}
                      className="self-start sm:self-auto py-1.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedCnpj ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCnpj ? 'CNPJ Copiado!' : 'Copiar CNPJ'}</span>
                    </button>
                  </div>

                  {/* QR Code & Amount Display */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
                    {/* Real Dynamic QR Code Image */}
                    <div className="w-44 h-44 sm:w-36 sm:h-36 bg-white p-2 rounded-xl flex items-center justify-center shrink-0 shadow-lg border-2 border-amber-500/30">
                      {qrCodeDataUrl ? (
                        <img
                          src={qrCodeDataUrl}
                          alt="QR Code Pix"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-zinc-900 text-xs">
                          <QrCode className="w-8 h-8 animate-pulse text-amber-500" />
                          <span className="mt-1 text-[10px]">Gerando QR...</span>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                          Valor a Transferir Agora no Pix:
                        </span>
                        <span className="text-2xl font-bold font-brand text-amber-400">
                          R$ {depositAmount.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-[11px] text-zinc-400 block mt-0.5">
                          {paymentChoice === 'sinal_50' ? 'Sinal de 50% para reserva' : '100% Quitação Total'}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-zinc-800 flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={handleCopyPixCode}
                          className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow cursor-pointer"
                        >
                          {copiedPixCode ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                          <span>{copiedPixCode ? 'Código Copiado!' : 'Copiar Código Pix (Copia e Cola)'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick instructions */}
                  <div className="text-[11px] text-zinc-400 space-y-1 bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-800/60">
                    <p className="text-zinc-300 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      Como pagar pelo app do seu banco:
                    </p>
                    <p>1. Abra o app do seu banco (qualquer banco) e entre na área Pix.</p>
                    <p>2. Escolha <strong>"Ler QR Code"</strong> ou <strong>"Pix Copia e Cola"</strong>.</p>
                    <p>3. Confira o favorecido: <strong>Mariano Almeida da Silva Junior</strong> (Nubank) e confirme o valor.</p>
                  </div>

                  {/* Mercado Pago Notice */}
                  <div className="p-3 sm:p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] leading-relaxed space-y-1.5 text-zinc-300">
                    <div className="flex items-center gap-2 font-bold text-amber-300 text-xs">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Aviso para quem utiliza Mercado Pago:</span>
                    </div>
                    <p>
                      Caso você use o app do <strong>Mercado Pago</strong> e escaneie o QR Code pela câmera, ele poderá direcionar automaticamente para pagamento via <em>"Pix no Cartão de Crédito"</em>.
                    </p>
                    <p className="text-amber-200/90 font-medium bg-amber-500/15 p-2 rounded-lg border border-amber-500/25">
                      💡 <strong>Prefere pagar com Pix normal (saldo da conta sem juros)?</strong> Não use o leitor de QR Code do Mercado Pago: clique nos botões acima <strong className="text-white">"Copiar CNPJ"</strong> ou <strong className="text-white">"Copiar Código Pix (Copia e Cola)"</strong> e cole diretamente na área Pix do seu app.
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      ℹ️ <strong>Demais bancos e instituições</strong> (Nubank, Banco do Brasil, Bradesco, Itaú, Santander, Caixa, Inter, etc.) funcionam perfeitamente e você pode escanear o QR Code direto no Pix normal.
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Summary & Final Actions (5 Cols) */}
              <div className="lg:col-span-5 bg-zinc-950 p-5 rounded-2xl border border-zinc-800 space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Resumo da Reserva</span>
                  </h4>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-zinc-900">
                      <span className="text-zinc-400">Cliente:</span>
                      <span className="font-semibold text-zinc-200">{clientName}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-zinc-900">
                      <span className="text-zinc-400">WhatsApp:</span>
                      <span className="font-semibold text-zinc-200 font-mono">{clientPhone}</span>
                    </div>
                    <div className="py-2 border-b border-zinc-900 space-y-1.5">
                      <div className="flex justify-between items-center text-zinc-400">
                        <span className="font-medium">Serviços ({selectedServices.length}):</span>
                        <span className="text-[11px] text-amber-400 font-mono">⏱️ {totalDurationMinutes} min</span>
                      </div>
                      <div className="space-y-1 pt-1">
                        {selectedServices.map((svc) => (
                          <div key={svc.id} className="flex items-center justify-between text-xs">
                            <span className="text-zinc-200 font-semibold flex items-center gap-1.5 truncate pr-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                              <span className="truncate">{svc.name}</span>
                            </span>
                            <span className="text-zinc-300 font-mono shrink-0">
                              R$ {svc.price.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-zinc-900">
                      <span className="text-zinc-400">Data marcada:</span>
                      <span className="font-semibold text-amber-400 capitalize">{formattedSelectedDate}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-zinc-900">
                      <span className="text-zinc-400">Horário Marcado:</span>
                      <span className="font-bold text-amber-400 text-sm">{selectedTime}</span>
                    </div>

                    {/* Financial Breakdown */}
                    <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2 mt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-400">Valor Total do Combo:</span>
                        <span className="font-bold text-zinc-200 font-mono">
                          R$ {totalPrice.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-amber-400">
                        <span className="font-semibold">Sinal Pix a Pagar Agora:</span>
                        <strong className="font-brand text-base">
                          R$ {depositAmount.toFixed(2).replace('.', ',')}
                        </strong>
                      </div>
                      {paymentChoice === 'sinal_50' && (
                        <div className="flex justify-between items-center text-xs pt-1.5 border-t border-zinc-800/80">
                          <span className="text-zinc-400">Saldo Restante no Balcão:</span>
                          <strong className="text-zinc-300 font-mono">
                            R$ {remainingBalance.toFixed(2).replace('.', ',')}
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tolerance callout */}
                  <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Tolerância de 10 minutos
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      Seu horário está garantido até as{' '}
                      <strong className="text-amber-400">
                        {(() => {
                          const [h, m] = selectedTime.split(':').map(Number);
                          const d = new Date();
                          d.setHours(h, m + 10, 0, 0);
                          return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                        })()}
                      </strong>
                      . Por favor chegue entre 5 a 10 min antes na barbearia.
                    </p>
                  </div>
                </div>

                {/* OBRIGATÓRIO: Verificação e Confirmação do Pix */}
                <div className="pt-3 border-t border-zinc-800 space-y-3">
                  <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-amber-500/30 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                      <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Confirmação Obrigatória do Pix</span>
                    </div>

                    <p className="text-[11px] text-zinc-300 leading-snug">
                      O seu horário só é confirmado e garantido na agenda após a verificação do Pix de{' '}
                      <strong className="text-amber-400">
                        R$ {depositAmount.toFixed(2).replace('.', ',')}
                      </strong>{' '}
                      enviado para <strong className="text-zinc-100">Mariano Almeida da Silva Junior</strong> (Nubank).
                    </p>

                    {/* Checkbox de confirmação do cliente */}
                    <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                      hasDeclaredPixPaid 
                        ? 'bg-amber-500/15 border-amber-500/50 text-zinc-100' 
                        : 'bg-zinc-950/80 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}>
                      <input
                        type="checkbox"
                        checked={hasDeclaredPixPaid}
                        onChange={(e) => setHasDeclaredPixPaid(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-zinc-700 text-amber-500 focus:ring-amber-500 bg-zinc-900 accent-amber-500 cursor-pointer"
                      />
                      <span className="text-xs font-medium leading-tight">
                        Confirmo que já realizei a transferência Pix de{' '}
                        <strong className="text-amber-400">
                          R$ {depositAmount.toFixed(2).replace('.', ',')}
                        </strong>{' '}
                        pelo aplicativo do meu banco.
                      </span>
                    </label>

                    {/* ID / Código de autenticação (opcional) */}
                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1">
                        Código / ID do Comprovante Pix (opcional):
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: E37629874..."
                        value={pixAuthCode}
                        onChange={(e) => setPixAuthCode(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>

                    {isVerifyingPix && (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-300 animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                        <span>Verificando recebimento no Nubank (Mariano)...</span>
                      </div>
                    )}

                    {pixConfirmed && (
                      <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>✓ Pagamento Pix Confirmado com Sucesso!</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={!hasDeclaredPixPaid || isVerifyingPix}
                      onClick={handleVerifyAndConfirmPix}
                      className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                        hasDeclaredPixPaid && !isVerifyingPix
                          ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-zinc-950 shadow-xl shadow-amber-500/25 cursor-pointer active:scale-[0.99]'
                          : 'bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed opacity-75'
                      }`}
                    >
                      {isVerifyingPix ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-zinc-950" />
                          <span>Validando Pagamento no Nubank...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className={`w-5 h-5 ${hasDeclaredPixPaid ? 'text-zinc-950' : 'text-zinc-500'}`} />
                          <span>
                            {hasDeclaredPixPaid 
                              ? 'Confirmar Pagamento & Reservar Horário' 
                              : 'Realize o Pix e Marque a Confirmação Acima'}
                          </span>
                        </>
                      )}
                    </button>

                    {!hasDeclaredPixPaid && (
                      <p className="text-[10px] text-center text-zinc-500 leading-tight">
                        🔒 Horário bloqueado somente após a verificação do Pix de garantia.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="w-full py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                      Voltar e alterar data ou horário
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Success Confirmation Screen */}
        {currentStep === 5 && selectedServices.length > 0 && (
          <div className="p-6 sm:p-8 text-center max-w-lg mx-auto space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/20">
              <Check className="w-10 h-10" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-block mb-2">
                Reserva Confirmada com Sucesso
              </span>
              <h3 className="text-2xl font-bold font-brand text-zinc-100">
                Nos vemos na barbearia!
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Seu agendamento foi registrado e o horário foi reservado exclusivamente para você.
              </p>
            </div>

            {/* Ticket Card */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 text-left space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Protocolo</span>
                  <p className="text-xs font-mono font-bold text-amber-400">{createdAptId}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Status da Reserva</span>
                  <p className="text-xs font-bold text-emerald-400">Garantido</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                {/* Services list in ticket */}
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-zinc-400 pb-1 border-b border-zinc-800">
                    <span className="font-bold uppercase text-[10px] tracking-wider text-amber-400">
                      Serviços Inclusos ({selectedServices.length}):
                    </span>
                    <span className="text-[10px] text-zinc-400">⏱️ {totalDurationMinutes} min</span>
                  </div>
                  {selectedServices.map((svc) => (
                    <div key={svc.id} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-200 font-semibold">{svc.name}</span>
                      <span className="text-amber-400/90 font-mono">
                        R$ {svc.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">Cliente:</span>
                    <strong className="text-zinc-200">{clientName}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">WhatsApp:</span>
                    <strong className="text-zinc-200 font-mono">{clientPhone}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">Data:</span>
                    <strong className="text-amber-400 capitalize">{formattedSelectedDate}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">Horário Marcado:</span>
                    <strong className="text-amber-400 font-brand text-base">{selectedTime}</strong>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Sinal Pix {paymentChoice === 'sinal_50' ? '(50% Reserva)' : '(100% Quitado)'}:</span>
                    <strong className="text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>R$ {depositAmount.toFixed(2).replace('.', ',')} (Pix Confirmado)</span>
                    </strong>
                  </div>
                  {pixAuthCode.trim() && (
                    <div className="flex justify-between items-center text-[11px] text-zinc-400">
                      <span>Autenticação:</span>
                      <span className="font-mono text-zinc-300">{pixAuthCode.trim()}</span>
                    </div>
                  )}
                  {paymentChoice === 'sinal_50' && (
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-zinc-800/80">
                      <span className="text-zinc-400">Restante no Balcão:</span>
                      <strong className="text-amber-400 font-mono">
                        R$ {remainingBalance.toFixed(2).replace('.', ',')} ({
                          remainingPaymentMethod === 'pix' ? 'Pix' :
                          remainingPaymentMethod === 'cartao_credito' ? 'Cartão Crédito' :
                          remainingPaymentMethod === 'cartao_debito' ? 'Cartão Débito' : 'Dinheiro'
                        })
                      </strong>
                    </div>
                  )}
                  <div className="text-[10px] text-zinc-400 pt-1 border-t border-zinc-800/60 flex items-center justify-between">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      Confirmado no Nubank
                    </span>
                    <span className="font-mono text-zinc-400">Mariano Almeida da Silva Junior</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Lembrete de Tolerância (10 minutos):</span>
                </p>
                <p className="text-[11px] text-zinc-300">
                  Chegue entre <strong>5 e 10 minutos antes</strong>. A tolerância máxima é de <strong>10 minutos</strong> após o horário marcado.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onBookingSuccess();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Ver Meus Agendamentos
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(1);
                  setSelectedTime('');
                }}
                className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition-colors cursor-pointer"
              >
                Fazer Novo Agendamento
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
