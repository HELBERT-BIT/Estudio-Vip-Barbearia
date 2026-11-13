import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { Appointment, NotificationDurationType } from '../types';

export const SUPABASE_URL = 
  import.meta.env.VITE_SUPABASE_URL || 'https://jdiovwdlnngpikeromao.supabase.co';

export const SUPABASE_ANON_KEY = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ATuY167Zt0pt_cNkw5jPOg_IxD9ysye';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Transforms an Appointment domain object to a Supabase table row.
 * Handles both snake_case and camelCase to fit any table schema in PostgreSQL.
 */
export function toSupabaseRow(apt: Appointment): Record<string, unknown> {
  return {
    id: apt.id,
    client_name: apt.clientName,
    client_phone: apt.clientPhone,
    client_email: apt.clientEmail || null,
    service_id: apt.serviceId,
    service_name: apt.serviceName,
    service_price: apt.servicePrice,
    service_duration: apt.serviceDuration,
    services: apt.services || null,
    service_ids: apt.serviceIds || null,
    date: apt.date,
    time: apt.time,
    tolerance_expiry_time: apt.toleranceExpiryTime,
    payment_type: apt.paymentType,
    payment_method: apt.paymentMethod,
    payment_status: apt.paymentStatus,
    deposit_amount: apt.depositAmount ?? 0,
    remaining_amount: apt.remainingAmount ?? 0,
    remaining_payment_method: apt.remainingPaymentMethod || null,
    status: apt.status,
    cancellation_reason: apt.cancellationReason || null,
    cancelled_at: apt.cancelledAt || null,
    created_at: apt.createdAt || new Date().toISOString(),
    checked_in_at: apt.checkedInAt || null,
    completed_at: apt.completedAt || null,
    notes: apt.notes || null,
  };
}

/**
 * Transforms a Supabase row (supports both snake_case and camelCase) to an Appointment object.
 */
export function fromSupabaseRow(row: Record<string, any>): Appointment {
  return {
    id: String(row.id),
    clientName: row.client_name ?? row.clientName ?? row.name ?? 'Cliente',
    clientPhone: row.client_phone ?? row.clientPhone ?? row.phone ?? '',
    clientEmail: row.client_email ?? row.clientEmail ?? row.email ?? undefined,
    serviceId: row.service_id ?? row.serviceId ?? 'srv-degrade-fade',
    serviceName: row.service_name ?? row.serviceName ?? 'Corte Degradê Fade',
    servicePrice: Number(row.service_price ?? row.servicePrice ?? 35),
    serviceDuration: Number(row.service_duration ?? row.serviceDuration ?? 30),
    services: Array.isArray(row.services) ? row.services : undefined,
    serviceIds: Array.isArray(row.service_ids)
      ? row.service_ids
      : Array.isArray(row.serviceIds)
      ? row.serviceIds
      : undefined,
    date: row.date || new Date().toISOString().slice(0, 10),
    time: row.time || '09:00',
    toleranceExpiryTime: row.tolerance_expiry_time ?? row.toleranceExpiryTime ?? '09:10',
    paymentType: row.payment_type ?? row.paymentType ?? 'presencial',
    paymentMethod: row.payment_method ?? row.paymentMethod ?? 'pix',
    paymentStatus: row.payment_status ?? row.paymentStatus ?? 'pendente',
    depositAmount:
      row.deposit_amount !== undefined && row.deposit_amount !== null
        ? Number(row.deposit_amount)
        : row.depositAmount !== undefined
        ? Number(row.depositAmount)
        : undefined,
    remainingAmount:
      row.remaining_amount !== undefined && row.remaining_amount !== null
        ? Number(row.remaining_amount)
        : row.remainingAmount !== undefined
        ? Number(row.remainingAmount)
        : undefined,
    remainingPaymentMethod: row.remaining_payment_method ?? row.remainingPaymentMethod ?? undefined,
    status: row.status || 'agendado',
    cancellationReason: row.cancellation_reason ?? row.cancellationReason ?? undefined,
    cancelledAt: row.cancelled_at ?? row.cancelledAt ?? undefined,
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    checkedInAt: row.checked_in_at ?? row.checkedInAt ?? undefined,
    completedAt: row.completed_at ?? row.completedAt ?? undefined,
    notes: row.notes ?? undefined,
  };
}

export const BARBERSHOP_STATUS_DOC_ID = 'system_barbershop_status';

export interface NotificationDurationMeta {
  durationType: NotificationDurationType;
  durationLabel?: string;
  expiresAt: string | null;
  type?: string;
  createdAt?: string;
}

export interface BarbershopGlobalStatus {
  manualOverrideStatus: 'open' | 'closed' | 'auto';
  blockedSlotsByDate?: Record<string, string[]>;
  customUnlockedSlotsByDate?: Record<string, string[]>;
  notificationMetaById?: Record<string, NotificationDurationMeta>;
  updatedAt?: string;
}

const LOCAL_NOTIF_META_KEY = 'estudiovip_notif_meta_v1';

export function getLocalNotificationMetaMap(): Record<string, NotificationDurationMeta> {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(LOCAL_NOTIF_META_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function setLocalNotificationMetaMap(map: Record<string, NotificationDurationMeta>): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(LOCAL_NOTIF_META_KEY, JSON.stringify(map));
  } catch {
    // ignore storage quota errors
  }
}

// Cache em memória do último status global para preservar notificationMetaById ao salvar status/horários e vice-versa
let cachedBarbershopStatus: BarbershopGlobalStatus = {
  manualOverrideStatus: 'auto',
  blockedSlotsByDate: {},
  customUnlockedSlotsByDate: {},
  notificationMetaById: getLocalNotificationMetaMap(),
};

/**
 * Checks if a row in the appointments table is the special system status record
 */
export function isBarbershopStatusRow(row: Record<string, any>): boolean {
  if (!row) return false;
  return (
    String(row.id) === BARBERSHOP_STATUS_DOC_ID ||
    row.client_name === 'CONFIGURACAO_SISTEMA' ||
    row.service_name === 'STATUS_BARBEARIA'
  );
}

/**
 * Parses the barbershop status record from the Supabase row
 */
export function parseBarbershopStatusFromRow(row: Record<string, any>): BarbershopGlobalStatus {
  let notesData: any = {};
  if (row.notes) {
    try {
      notesData = typeof row.notes === 'string' ? JSON.parse(row.notes) : row.notes;
    } catch {
      notesData = {};
    }
  }

  const rawStatus = (row.status || notesData.manualOverrideStatus || 'auto') as string;
  const manualOverrideStatus: 'open' | 'closed' | 'auto' =
    rawStatus === 'open' || rawStatus === 'closed' ? rawStatus : 'auto';

  const remoteMeta =
    notesData.notificationMetaById && typeof notesData.notificationMetaById === 'object'
      ? (notesData.notificationMetaById as Record<string, NotificationDurationMeta>)
      : {};

  const parsed: BarbershopGlobalStatus = {
    manualOverrideStatus,
    blockedSlotsByDate: notesData.blockedSlotsByDate || {},
    customUnlockedSlotsByDate: notesData.customUnlockedSlotsByDate || {},
    notificationMetaById: remoteMeta,
    updatedAt: notesData.updatedAt || row.created_at || new Date().toISOString(),
  };

  cachedBarbershopStatus = {
    ...parsed,
    notificationMetaById: {
      ...getLocalNotificationMetaMap(),
      ...remoteMeta,
    },
  };
  setLocalNotificationMetaMap(cachedBarbershopStatus.notificationMetaById || {});

  return parsed;
}

/**
 * Saves the barbershop open/closed status, schedule slot blocks, and notification expiration metadata directly in Supabase
 */
export async function saveBarbershopStatusToSupabase(
  statusData: BarbershopGlobalStatus
): Promise<boolean> {
  try {
    const mergedMeta: Record<string, NotificationDurationMeta> = {
      ...(cachedBarbershopStatus.notificationMetaById || {}),
      ...(statusData.notificationMetaById || {}),
    };

    // Limpa metadados expirados há mais de 30 dias para manter o JSON compacto
    const cutoffMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const prunedMeta: Record<string, NotificationDurationMeta> = {};
    for (const [key, val] of Object.entries(mergedMeta)) {
      if (!val) continue;
      if (val.expiresAt) {
        const expMs = new Date(val.expiresAt).getTime();
        if (!isNaN(expMs) && expMs < cutoffMs) continue;
      }
      prunedMeta[key] = val;
    }

    cachedBarbershopStatus = {
      manualOverrideStatus: statusData.manualOverrideStatus,
      blockedSlotsByDate: statusData.blockedSlotsByDate ?? cachedBarbershopStatus.blockedSlotsByDate ?? {},
      customUnlockedSlotsByDate:
        statusData.customUnlockedSlotsByDate ?? cachedBarbershopStatus.customUnlockedSlotsByDate ?? {},
      notificationMetaById: prunedMeta,
      updatedAt: new Date().toISOString(),
    };
    setLocalNotificationMetaMap(prunedMeta);

    const payload = {
      id: BARBERSHOP_STATUS_DOC_ID,
      client_name: 'CONFIGURACAO_SISTEMA',
      client_phone: '00000000000',
      client_email: null,
      service_id: 'sys-status',
      service_name: 'STATUS_BARBEARIA',
      service_price: 0,
      service_duration: 0,
      date: '2099-12-31',
      time: '00:00',
      tolerance_expiry_time: '00:00',
      payment_type: 'presencial',
      payment_method: 'pix',
      payment_status: 'pago',
      status: cachedBarbershopStatus.manualOverrideStatus,
      notes: JSON.stringify({
        manualOverrideStatus: cachedBarbershopStatus.manualOverrideStatus,
        blockedSlotsByDate: cachedBarbershopStatus.blockedSlotsByDate || {},
        customUnlockedSlotsByDate: cachedBarbershopStatus.customUnlockedSlotsByDate || {},
        notificationMetaById: prunedMeta,
        updatedAt: cachedBarbershopStatus.updatedAt,
      }),
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('appointments').upsert([payload]);
    if (error) {
      console.warn('Erro ao salvar status da barbearia no Supabase:', error.message || error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Exceção ao salvar status da barbearia no Supabase:', err);
    return false;
  }
}

export async function saveNotificationMetaToSupabase(
  id: string | number,
  meta: NotificationDurationMeta
): Promise<void> {
  const key = String(id);
  const currentMap = {
    ...getLocalNotificationMetaMap(),
    ...(cachedBarbershopStatus.notificationMetaById || {}),
    [key]: meta,
  };
  setLocalNotificationMetaMap(currentMap);
  cachedBarbershopStatus.notificationMetaById = currentMap;

  await saveBarbershopStatusToSupabase({
    manualOverrideStatus: cachedBarbershopStatus.manualOverrideStatus,
    blockedSlotsByDate: cachedBarbershopStatus.blockedSlotsByDate,
    customUnlockedSlotsByDate: cachedBarbershopStatus.customUnlockedSlotsByDate,
    notificationMetaById: currentMap,
  });
}

export async function removeNotificationMetaFromSupabase(id: string | number): Promise<void> {
  const key = String(id);
  const currentMap = {
    ...getLocalNotificationMetaMap(),
    ...(cachedBarbershopStatus.notificationMetaById || {}),
  };
  if (!(key in currentMap)) return;
  delete currentMap[key];
  setLocalNotificationMetaMap(currentMap);
  cachedBarbershopStatus.notificationMetaById = currentMap;

  await saveBarbershopStatusToSupabase({
    manualOverrideStatus: cachedBarbershopStatus.manualOverrideStatus,
    blockedSlotsByDate: cachedBarbershopStatus.blockedSlotsByDate,
    customUnlockedSlotsByDate: cachedBarbershopStatus.customUnlockedSlotsByDate,
    notificationMetaById: currentMap,
  });
}

/**
 * Fetch all appointments AND barbershop status together from Supabase
 */
export async function fetchAppointmentsAndStatusFromSupabase(): Promise<{
  appointments: Appointment[];
  statusConfig: BarbershopGlobalStatus | null;
} | null> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      console.warn('Supabase fetchAppointments error:', error.message || error);
      return null;
    }

    if (!data) return { appointments: [], statusConfig: null };

    let statusConfig: BarbershopGlobalStatus | null = null;
    const clientAppointments: Appointment[] = [];

    for (const row of data) {
      if (isBarbershopStatusRow(row)) {
        statusConfig = parseBarbershopStatusFromRow(row);
      } else {
        clientAppointments.push(fromSupabaseRow(row));
      }
    }

    return { appointments: clientAppointments, statusConfig };
  } catch (err) {
    console.warn('Network error reaching Supabase:', err);
    return null;
  }
}

/**
 * Fetch all client appointments from Supabase (filtering out internal system rows)
 */
export async function fetchAppointmentsFromSupabase(): Promise<Appointment[] | null> {
  const res = await fetchAppointmentsAndStatusFromSupabase();
  return res ? res.appointments : null;
}

/**
 * Checks if a client already exists in the 'client' table in Supabase (by phone or email),
 * and if not, automatically inserts them using supabase.from('client').insert(...)
 * 
 * Target table: 'client' (singular)
 * Expected columns: name, phone, email
 */
export async function insertClientIfNotExistsToSupabase(clientData: {
  name: string;
  phone: string;
  email?: string;
}): Promise<boolean> {
  const clientName = (clientData.name || '').trim();
  const cleanPhone = (clientData.phone || '').trim();
  const rawDigits = cleanPhone.replace(/\D/g, '');
  const cleanEmail = (clientData.email || '').trim().toLowerCase();

  console.log('🔍 [insertClientIfNotExistsToSupabase] Verificando dados para inserção na tabela client:', {
    name: clientName,
    phone: cleanPhone,
    rawDigits,
    email: cleanEmail || '(não informado)',
  });

  if (!clientName && !cleanPhone && !cleanEmail) {
    console.error('❌ [insertClientIfNotExistsToSupabase] Abortado: nome, telefone e email estão vazios.');
    return false;
  }

  try {
    let clientExists = false;
    let existingRecord: any = null;

    // 1. Verificação segura se o cliente já existe na tabela 'client'
    // Consultas separadas e limpas para evitar erros de sintaxe no parser PostgREST com parênteses ou traços
    try {
      if (cleanPhone) {
        const { data: byPhone, error: phoneErr } = await supabase
          .from('client')
          .select('id, name, phone, email')
          .eq('phone', cleanPhone)
          .limit(1);

        if (phoneErr) {
          if (isTransientNetworkError(phoneErr)) {
            console.warn('⚠️ [insertClientIfNotExistsToSupabase] Falha temporária de rede ao buscar por phone formatado:', phoneErr.message);
          } else {
            console.error('⚠️ [insertClientIfNotExistsToSupabase] Erro ao buscar por phone formatado:', {
              message: phoneErr.message,
              code: phoneErr.code,
              details: phoneErr.details,
              hint: phoneErr.hint,
            });
          }
        } else if (byPhone && byPhone.length > 0) {
          clientExists = true;
          existingRecord = byPhone[0];
        }

        // Se não encontrou pelo formato com máscara, tenta pelos dígitos puros
        if (!clientExists && rawDigits && rawDigits !== cleanPhone) {
          const { data: byDigits, error: digitsErr } = await supabase
            .from('client')
            .select('id, name, phone, email')
            .eq('phone', rawDigits)
            .limit(1);

          if (digitsErr) {
            if (isTransientNetworkError(digitsErr)) {
              console.warn('⚠️ [insertClientIfNotExistsToSupabase] Falha temporária de rede ao buscar por phone dígitos:', digitsErr.message);
            } else {
              console.error('⚠️ [insertClientIfNotExistsToSupabase] Erro ao buscar por phone dígitos:', {
                message: digitsErr.message,
                code: digitsErr.code,
              });
            }
          } else if (byDigits && byDigits.length > 0) {
            clientExists = true;
            existingRecord = byDigits[0];
          }
        }
      }

      // Se não encontrou por telefone e tem e-mail, busca por e-mail
      if (!clientExists && cleanEmail) {
        const { data: byEmail, error: emailErr } = await supabase
          .from('client')
          .select('id, name, phone, email')
          .ilike('email', cleanEmail)
          .limit(1);

        if (emailErr) {
          if (isTransientNetworkError(emailErr)) {
            console.warn('⚠️ [insertClientIfNotExistsToSupabase] Falha temporária de rede ao buscar por e-mail:', emailErr.message);
          } else {
            console.error('⚠️ [insertClientIfNotExistsToSupabase] Erro ao buscar por e-mail:', {
              message: emailErr.message,
              code: emailErr.code,
            });
          }
        } else if (byEmail && byEmail.length > 0) {
          clientExists = true;
          existingRecord = byEmail[0];
        }
      }
    } catch (checkEx) {
      if (isTransientNetworkError(checkEx)) {
        console.warn('⚠️ [insertClientIfNotExistsToSupabase] Falha temporária de rede durante a checagem prévia na tabela client:', checkEx);
      } else {
        console.error('❌ [insertClientIfNotExistsToSupabase] Exceção durante a checagem prévia na tabela client:', checkEx);
      }
    }

    if (clientExists) {
      console.log(`ℹ️ [insertClientIfNotExistsToSupabase] Cliente já existe na tabela 'client' do Supabase:`, existingRecord);
      return true;
    }

    // 2. Cliente NÃO existe: Montar objeto estritamente com as colunas da tabela: (name, phone, email)
    // Sem campos extras para evitar erro de coluna inexistente no PostgreSQL
    const clientPayload: {
      name: string;
      phone: string;
      email: string | null;
    } = {
      name: clientName,
      phone: cleanPhone,
      email: cleanEmail ? cleanEmail : null,
    };

    console.log('🚀 [insertClientIfNotExistsToSupabase] Executando supabase.from(\'client\').insert(...) com payload exato:', clientPayload);

    const { data: insertResult, error: insertError } = await supabase
      .from('client')
      .insert([clientPayload])
      .select();

    if (insertError) {
      console.error('❌ [insertClientIfNotExistsToSupabase] FALHA AO INSERIR CLIENTE NA TABELA client:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
        payloadEnviado: clientPayload,
      });

      // Tentativa de contingência 1: Se a tabela tiver colunas em português (nome, telefone, email)
      if (insertError.message && (insertError.message.includes('column') || insertError.code === '42703')) {
        console.warn('⚠️ [insertClientIfNotExistsToSupabase] Tentando fallback para colunas em português (nome, telefone, email)...');
        const ptPayload = {
          nome: clientName,
          telefone: cleanPhone,
          email: cleanEmail ? cleanEmail : null,
        };
        const { data: ptResult, error: ptError } = await supabase
          .from('client')
          .insert([ptPayload])
          .select();

        if (ptError) {
          console.error('❌ [insertClientIfNotExistsToSupabase] Fallback em português também falhou:', {
            message: ptError.message,
            details: ptError.details,
            hint: ptError.hint,
            code: ptError.code,
            payloadEnviado: ptPayload,
          });
          return false;
        }

        console.log('✅ [insertClientIfNotExistsToSupabase] Sucesso via fallback na tabela client:', ptResult);
        return true;
      }

      return false;
    }

    console.log('✅ [insertClientIfNotExistsToSupabase] Cliente inserido com SUCESSO na tabela client:', insertResult);
    return true;
  } catch (err) {
    console.error('❌ [insertClientIfNotExistsToSupabase] Exceção inesperada na rotina de cadastro de cliente:', err);
    return false;
  }
}

function isTransientNetworkError(errOrMsg: unknown): boolean {
  const msg =
    typeof errOrMsg === 'string'
      ? errOrMsg
      : (errOrMsg as { message?: string; details?: string } | null)?.message ||
        (errOrMsg as { details?: string } | null)?.details ||
        '';
  const lower = String(msg).toLowerCase();
  return (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network request failed') ||
    lower.includes('load failed') ||
    lower.includes('abort')
  );
}

/**
 * Fetches clients from the 'client' table in Supabase
 */
export async function fetchClientsFromSupabase(): Promise<any[] | null> {
  try {
    const { data, error } = await supabase
      .from('client')
      .select('*')
      .limit(500);

    if (error) {
      if (isTransientNetworkError(error)) {
        console.warn('⚠️ [fetchClientsFromSupabase] Falha temporária de rede ao consultar tabela client:', error.message);
      } else {
        console.error('❌ [fetchClientsFromSupabase] Erro ao consultar tabela client:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
      }
      return null;
    }

    return data || [];
  } catch (err) {
    console.warn('⚠️ [fetchClientsFromSupabase] Exceção de rede ao buscar clientes no Supabase:', err);
    return null;
  }
}

/**
 * Insert appointment into Supabase and automatically register client in 'client' table (with await)
 */
export async function insertAppointmentToSupabase(apt: Appointment): Promise<boolean> {
  try {
    // 1. Garantir que os dados do cliente sejam inseridos primeiro na tabela 'client' usando AWAIT
    if (apt.clientName && (apt.clientPhone || apt.clientEmail)) {
      try {
        console.log(`💈 [insertAppointmentToSupabase] Executando AWAIT para cadastrar cliente "${apt.clientName}" na tabela 'client'...`);
        const clientSaved = await insertClientIfNotExistsToSupabase({
          name: apt.clientName,
          phone: apt.clientPhone,
          email: apt.clientEmail,
        });
        console.log(`💈 [insertAppointmentToSupabase] Resultado da gravação do cliente: ${clientSaved ? 'SUCESSO' : 'ATENÇÃO'}`);
      } catch (clientErr) {
        console.error('❌ [insertAppointmentToSupabase] Exceção no AWAIT do insertClientIfNotExistsToSupabase:', clientErr);
      }
    }

    // 2. Inserir o agendamento na tabela 'appointments'
    const row = toSupabaseRow(apt);
    console.log(`💈 [insertAppointmentToSupabase] Gravando agendamento ${apt.id} em appointments...`);
    const { data, error } = await supabase.from('appointments').insert([row]).select();
    if (error) {
      console.error('❌ [insertAppointmentToSupabase] Erro ao gravar agendamento em appointments:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return false;
    }
    console.log(`✅ [insertAppointmentToSupabase] Agendamento ${apt.id} gravado com sucesso!`, data);
    return true;
  } catch (err) {
    console.error('❌ [insertAppointmentToSupabase] Exceção geral ao gravar agendamento:', err);
    return false;
  }
}

/**
 * Update appointment in Supabase using the exact snake_case columns
 */
export async function updateAppointmentInSupabase(
  id: string,
  updates: Partial<Appointment>
): Promise<boolean> {
  try {
    const patch: Record<string, any> = {};

    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.paymentStatus !== undefined) patch.payment_status = updates.paymentStatus;
    if (updates.paymentMethod !== undefined) patch.payment_method = updates.paymentMethod;
    if (updates.checkedInAt !== undefined) patch.checked_in_at = updates.checkedInAt;
    if (updates.completedAt !== undefined) patch.completed_at = updates.completedAt;
    if (updates.cancelledAt !== undefined) patch.cancelled_at = updates.cancelledAt;
    if (updates.cancellationReason !== undefined) patch.cancellation_reason = updates.cancellationReason;
    if (updates.date !== undefined) patch.date = updates.date;
    if (updates.time !== undefined) patch.time = updates.time;
    if (updates.toleranceExpiryTime !== undefined) patch.tolerance_expiry_time = updates.toleranceExpiryTime;
    if (updates.notes !== undefined) patch.notes = updates.notes;
    if (updates.depositAmount !== undefined) patch.deposit_amount = updates.depositAmount;
    if (updates.remainingAmount !== undefined) patch.remaining_amount = updates.remainingAmount;
    if (updates.remainingPaymentMethod !== undefined) patch.remaining_payment_method = updates.remainingPaymentMethod;

    const { error } = await supabase.from('appointments').update(patch).eq('id', id);
    if (error) {
      console.warn('Supabase updateAppointment error:', error.message || error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network error updating appointment in Supabase:', err);
    return false;
  }
}

/**
 * Delete appointment from Supabase
 */
export async function deleteAppointmentFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) {
      console.warn('Supabase deleteAppointment error:', error.message || error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network error deleting appointment from Supabase:', err);
    return false;
  }
}

/**
 * Delete all client appointments from Supabase (used when resetting test data),
 * keeping the system barbershop status row intact.
 */
export async function deleteAllAppointmentsFromSupabase(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .neq('id', BARBERSHOP_STATUS_DOC_ID);
    if (error) {
      console.warn('Supabase deleteAllAppointments error:', error.message || error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network error deleting all appointments from Supabase:', err);
    return false;
  }
}

/**
 * Subscribes to Realtime appointment AND barbershop status changes from Supabase.
 * Notifies callbacks whenever an appointment or the shop status is modified.
 */
export function subscribeToAppointmentsRealtime(
  onInsert: (appointment: Appointment) => void,
  onUpdate: (appointment: Appointment) => void,
  onDelete: (id: string) => void,
  onStatusChange?: (status: string) => void,
  onBarbershopStatusChange?: (statusConfig: BarbershopGlobalStatus) => void
): () => void {
  let channel: RealtimeChannel | null = null;

  try {
    channel = supabase
      .channel('realtime_appointments_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        (payload) => {
          // If the changed row is the system barbershop status row
          const candidateRow = (payload.new && Object.keys(payload.new).length > 0)
            ? payload.new
            : payload.old;

          if (candidateRow && isBarbershopStatusRow(candidateRow)) {
            if (payload.new && onBarbershopStatusChange) {
              const statusConfig = parseBarbershopStatusFromRow(payload.new);
              onBarbershopStatusChange(statusConfig);
            }
            return;
          }

          if (payload.eventType === 'INSERT' && payload.new) {
            const apt = fromSupabaseRow(payload.new);
            onInsert(apt);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const apt = fromSupabaseRow(payload.new);
            onUpdate(apt);
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const id = payload.old.id ? String(payload.old.id) : '';
            if (id && id !== BARBERSHOP_STATUS_DOC_ID) {
              onDelete(id);
            }
          }
        }
      )
      .subscribe((status) => {
        if (onStatusChange) {
          onStatusChange(status);
        }
        if (status === 'SUBSCRIBED') {
          console.log('⚡ Conectado ao Supabase Realtime (Agendamentos e Status ao vivo)!');
        }
      });
  } catch (err) {
    console.warn('Could not establish Supabase Realtime channel:', err);
  }

  return () => {
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
}

/**
 * Interface representing a notification row in Supabase 'notifications' table
 */
export interface SupabaseNotification {
  id: string | number;
  title: string;
  message: string;
  type?: string;
  active?: boolean;
  created_at?: string;
  expires_at?: string | null;
  duration_type?: NotificationDurationType;
  duration_label?: string;
}

// Armazena as colunas reais descobertas na tabela 'notifications' via select('*') / retorno de insert
let knownNotificationColumns: Set<string> | null = null;

function recordKnownNotificationColumns(row?: Record<string, any> | null): void {
  if (!row || typeof row !== 'object') return;
  const keys = Object.keys(row);
  if (keys.length === 0) return;
  if (!knownNotificationColumns) {
    knownNotificationColumns = new Set<string>(keys);
  } else {
    keys.forEach((k) => knownNotificationColumns!.add(k));
  }
}

export function getLocalDateKey(dateInput?: string | Date): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateNotificationExpiry(
  durationType: NotificationDurationType,
  customMinutes: number = 60,
  referenceDate: Date = new Date()
): { expiresAt: string | null; durationLabel: string } {
  const now = new Date(referenceDate.getTime());

  switch (durationType) {
    case 'minutes_hours': {
      const mins = Math.max(1, Math.round(customMinutes));
      const exp = new Date(now.getTime() + mins * 60 * 1000);
      const label =
        mins >= 60 && mins % 60 === 0
          ? `${mins / 60}h`
          : mins > 60
          ? `${Math.floor(mins / 60)}h ${mins % 60}min`
          : `${mins} min`;
      return { expiresAt: exp.toISOString(), durationLabel: `Temporário (${label})` };
    }
    case 'today': {
      const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999
      );
      return { expiresAt: endOfDay.toISOString(), durationLabel: 'Apenas Hoje (até 23:59)' };
    }
    case 'week': {
      const endOfWeek = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 7,
        23,
        59,
        59,
        999
      );
      return { expiresAt: endOfWeek.toISOString(), durationLabel: 'Durante a Semana (7 dias)' };
    }
    case 'month': {
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 30,
        23,
        59,
        59,
        999
      );
      return { expiresAt: endOfMonth.toISOString(), durationLabel: 'Durante o Mês (30 dias)' };
    }
    case 'fixed':
      return { expiresAt: null, durationLabel: 'Fixo' };
    default: {
      const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999
      );
      return { expiresAt: endOfDay.toISOString(), durationLabel: 'Apenas Hoje (até 23:59)' };
    }
  }
}

/**
 * Checks whether a notification is still valid at `now`.
 * Notices whose time has expired OR whose calendar day rolled over (when not explicitly 'fixed' or future-dated)
 * automatically return false so they are never shown as fixed by default.
 */
export function isNotificationValid(
  notif: SupabaseNotification,
  now: Date = new Date()
): boolean {
  if (!notif || notif.active === false) return false;

  // Apenas avisos explicitamente marcados como 'fixed' permanecem indefinidamente
  if (notif.duration_type === 'fixed') {
    return true;
  }

  // Se possuir data/hora de expiração explícita
  if (notif.expires_at) {
    const expTime = new Date(notif.expires_at).getTime();
    if (!isNaN(expTime)) {
      if (now.getTime() > expTime) {
        return false;
      }
      // Se for 'today', garante também que o dia local não virou
      if (notif.duration_type === 'today' && notif.created_at) {
        if (getLocalDateKey(notif.created_at) !== getLocalDateKey(now)) {
          return false;
        }
      }
      return true;
    }
  }

  // Padrão sem expires_at e sem duration_type === 'fixed':
  // NÃO fica fixo por padrão! Expira assim que o dia vira.
  if (!notif.created_at) {
    return false;
  }

  return getLocalDateKey(notif.created_at) === getLocalDateKey(now);
}

export function formatNotificationRemaining(
  notif: SupabaseNotification,
  now: Date = new Date()
): string {
  if (notif.duration_type === 'fixed') return 'Aviso Fixo';
  if (!isNotificationValid(notif, now)) return 'Expirado';

  if (notif.expires_at) {
    const expMs = new Date(notif.expires_at).getTime();
    const diffMs = expMs - now.getTime();
    if (diffMs <= 0) return 'Expirado';

    const diffMins = Math.ceil(diffMs / 60000);
    if (diffMins < 60) return `Expira em ${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    const remMins = diffMins % 60;
    if (diffHours < 24 && getLocalDateKey(notif.expires_at) === getLocalDateKey(now)) {
      if (notif.duration_type === 'today') return 'Válido hoje (até 23:59)';
      return remMins > 0 ? `Expira em ${diffHours}h ${remMins}m` : `Expira em ${diffHours}h`;
    }

    const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    return diffDays === 1 ? 'Válido até amanhã' : `Válido por ${diffDays} dias`;
  }

  return 'Válido hoje (até 23:59)';
}

/**
 * Normalizes rows from the notifications table and merges any locally/remotely stored duration metadata
 */
export function normalizeNotificationRow(
  row: Record<string, any>,
  metaMap?: Record<string, NotificationDurationMeta>
): SupabaseNotification {
  recordKnownNotificationColumns(row);

  const id = row.id ?? `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const lookupMeta = (metaMap || cachedBarbershopStatus.notificationMetaById || getLocalNotificationMetaMap())[String(id)];

  return {
    id,
    title: row.title ?? row.titulo ?? 'Aviso da Barbearia',
    message: row.message ?? row.mensagem ?? row.content ?? row.texto ?? '',
    type: row.type ?? row.tipo ?? lookupMeta?.type ?? 'aviso',
    active: row.active !== undefined ? Boolean(row.active) : true,
    created_at: row.created_at ?? row.data ?? lookupMeta?.createdAt ?? new Date().toISOString(),
    expires_at: row.expires_at !== undefined ? row.expires_at : (lookupMeta?.expiresAt ?? undefined),
    duration_type: (row.duration_type ?? lookupMeta?.durationType) as NotificationDurationType | undefined,
    duration_label: lookupMeta?.durationLabel,
  };
}

/**
 * Sends/inserts a new notification/announcement into Supabase 'notifications' table.
 * Strictly sends only confirmed existing table columns ({ title, message, active: true },
 * plus expires_at / duration_type ONLY if those columns are confirmed to exist in the table),
 * NEVER sending a manual 'id' so PostgreSQL handles autoincrement (Is Identity).
 * Persists expiration metadata across devices via BarbershopGlobalStatus as well.
 */
export async function sendNotificationToSupabase(notif: {
  title: string;
  message: string;
  type?: string;
  durationType?: NotificationDurationType;
  customMinutes?: number;
}): Promise<SupabaseNotification | null> {
  const title = (notif.title || '').trim();
  const message = (notif.message || '').trim();
  const durationType: NotificationDurationType = notif.durationType || 'today';
  const { expiresAt, durationLabel } = calculateNotificationExpiry(
    durationType,
    notif.customMinutes || 60
  );

  if (!title || !message) {
    console.error('❌ [sendNotificationToSupabase] Título e mensagem são obrigatórios.');
    return null;
  }

  try {
    // Monta o payload estritamente com as colunas reais da tabela notifications.
    // NUNCA inclui 'id' para não causar erro de chave primária / identity.
    // Só inclui expires_at / duration_type se já confirmamos que essas colunas existem no banco.
    const rowPayload: Record<string, any> = {
      title,
      message,
      active: true,
    };

    if (knownNotificationColumns?.has('expires_at')) {
      rowPayload.expires_at = expiresAt;
    }
    if (knownNotificationColumns?.has('duration_type')) {
      rowPayload.duration_type = durationType;
    }

    const payload = [rowPayload];
    console.log(
      '🚀 [sendNotificationToSupabase] Executando await supabase.from("notifications").insert(...) com payload estrito:',
      {
        payload,
        knownColumns: knownNotificationColumns ? Array.from(knownNotificationColumns) : 'pendente (tabela vazia ou inicial)',
        durationType,
        expiresAt,
      }
    );

    const { data, error } = await supabase
      .from('notifications')
      .insert(payload)
      .select();

    if (error) {
      console.error('❌ [sendNotificationToSupabase] Erro retornado pelo Supabase ao gravar em notifications:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        payloadEnviado: payload,
      });

      // Fallback de contingência caso a coluna 'active' não exista no banco de dados do Supabase
      if (
        (error.message && (error.message.includes('column "active"') || error.code === '42703')) ||
        error.code === 'PGRST204'
      ) {
        console.warn('⚠️ [sendNotificationToSupabase] Coluna incompatível detectada. Tentando envio estrito mínimo { title, message }...');
        try {
          const fallbackPayload = [{ title, message }];
          const { data: fbData, error: fbError } = await supabase
            .from('notifications')
            .insert(fallbackPayload)
            .select();

          if (fbError) {
            console.error('❌ [sendNotificationToSupabase] Falha também no fallback mínimo { title, message }:', {
              message: fbError.message,
              details: fbError.details,
              hint: fbError.hint,
              code: fbError.code,
              fallbackPayload,
            });
            return null;
          }

          if (fbData && fbData.length > 0) {
            recordKnownNotificationColumns(fbData[0]);
            const inserted = normalizeNotificationRow(fbData[0]);
            inserted.type = notif.type || inserted.type || 'aviso';
            inserted.duration_type = durationType;
            inserted.expires_at = expiresAt;
            inserted.duration_label = durationLabel;

            await saveNotificationMetaToSupabase(inserted.id, {
              durationType,
              durationLabel,
              expiresAt,
              type: inserted.type,
              createdAt: inserted.created_at,
            });

            console.log('✅ [sendNotificationToSupabase] Sucesso via fallback mínimo:', inserted);
            return inserted;
          }
        } catch (fbCatchErr) {
          console.error('❌ [sendNotificationToSupabase] Exceção no fallback mínimo:', fbCatchErr);
          return null;
        }
      }

      return null;
    }

    let insertedRow: Record<string, any> | null =
      data && data.length > 0 ? data[0] : null;

    if (insertedRow) {
      recordKnownNotificationColumns(insertedRow);

      // Se agora descobrimos que a tabela possui expires_at / duration_type e não havíamos enviado no insert inicial, atualiza com segurança
      const extraPatch: Record<string, any> = {};
      if (knownNotificationColumns?.has('expires_at') && rowPayload.expires_at === undefined) {
        extraPatch.expires_at = expiresAt;
      }
      if (knownNotificationColumns?.has('duration_type') && rowPayload.duration_type === undefined) {
        extraPatch.duration_type = durationType;
      }
      if (Object.keys(extraPatch).length > 0 && insertedRow.id !== undefined) {
        try {
          const { error: patchErr } = await supabase
            .from('notifications')
            .update(extraPatch)
            .eq('id', insertedRow.id);
          if (patchErr) {
            console.warn('⚠️ [sendNotificationToSupabase] Não foi possível atualizar colunas opcionais de validade:', patchErr);
          } else {
            insertedRow = { ...insertedRow, ...extraPatch };
          }
        } catch (patchCatch) {
          console.warn('⚠️ [sendNotificationToSupabase] Exceção ao atualizar colunas opcionais:', patchCatch);
        }
      }
    }

    const inserted: SupabaseNotification = insertedRow
      ? normalizeNotificationRow(insertedRow)
      : {
          id: `notif-${Date.now()}`,
          title,
          message,
          active: true,
          type: notif.type || 'aviso',
          created_at: new Date().toISOString(),
          expires_at: expiresAt,
          duration_type: durationType,
          duration_label: durationLabel,
        };

    // Garante aplicação imediata da validade e tipo em memória + sincronização entre dispositivos
    inserted.type = notif.type || inserted.type || 'aviso';
    inserted.duration_type = durationType;
    inserted.expires_at = expiresAt;
    inserted.duration_label = durationLabel;

    try {
      await saveNotificationMetaToSupabase(inserted.id, {
        durationType,
        durationLabel,
        expiresAt,
        type: inserted.type,
        createdAt: inserted.created_at,
      });
    } catch (metaErr) {
      console.error('⚠️ [sendNotificationToSupabase] Erro ao salvar metadados de expiração sincronizados:', metaErr);
    }

    console.log('✅ [sendNotificationToSupabase] Registro gravado com SUCESSO na tabela notifications:', inserted);
    return inserted;
  } catch (err) {
    console.error('❌ [sendNotificationToSupabase] Exceção inesperada no envio de notificação:', err);
    return null;
  }
}

/**
 * Fetches the most recent notifications from the 'notifications' table
 */
export async function fetchNotificationsFromSupabase(): Promise<SupabaseNotification[] | null> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      // Se for erro de rede (ex: Failed to fetch), não tenta query de fallback desnecessária
      if (isTransientNetworkError(error)) {
        console.warn('⚠️ [fetchNotificationsFromSupabase] Falha temporária de rede ao carregar avisos:', error.message);
        return null;
      }

      console.warn('⚠️ [fetchNotificationsFromSupabase] Erro com order(created_at), tentando fallback:', {
        message: error.message,
        details: error.details,
        code: error.code,
      });

      const { data: fbData, error: fbError } = await supabase
        .from('notifications')
        .select('*')
        .limit(30);

      if (fbError) {
        if (isTransientNetworkError(fbError)) {
          console.warn('⚠️ [fetchNotificationsFromSupabase] Falha temporária de rede no fallback:', fbError.message);
        } else {
          console.error('❌ [fetchNotificationsFromSupabase] Erro ao carregar avisos:', {
            message: fbError.message,
            details: fbError.details,
            code: fbError.code,
          });
        }
        return null;
      }
      return (fbData || []).map((row) => normalizeNotificationRow(row));
    }

    return (data || []).map((row) => normalizeNotificationRow(row));
  } catch (err) {
    console.warn('⚠️ [fetchNotificationsFromSupabase] Exceção de rede:', err);
    return null;
  }
}

/**
 * Deletes a notification from the 'notifications' table
 */
export async function deleteNotificationFromSupabase(id: string | number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ [deleteNotificationFromSupabase] Erro ao excluir aviso:', {
        message: error.message,
        details: error.details,
        code: error.code,
      });
      return false;
    }

    await removeNotificationMetaFromSupabase(id);
    console.log(`✅ [deleteNotificationFromSupabase] Aviso ${id} removido com sucesso.`);
    return true;
  } catch (err) {
    console.error('❌ [deleteNotificationFromSupabase] Exceção ao excluir aviso:', err);
    return false;
  }
}

/**
 * Subscribes in Realtime to the 'notifications' table in Supabase.
 * Triggers callback whenever a new notice is inserted or deleted by the barber.
 */
export function subscribeToNotificationsRealtime(
  onInsert: (notification: SupabaseNotification) => void,
  onDelete?: (id: string | number) => void
): () => void {
  let channel: RealtimeChannel | null = null;

  try {
    channel = supabase
      .channel('realtime_notifications_feed_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload) => {
          console.log('⚡ [Realtime Notifications Event]', payload.eventType, payload);

          if (payload.eventType === 'INSERT' && payload.new) {
            const notif = normalizeNotificationRow(payload.new);
            onInsert(notif);
          } else if (payload.eventType === 'DELETE' && payload.old) {
            if (onDelete && payload.old.id) {
              onDelete(payload.old.id);
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('⚡ Conectado ao Supabase Realtime (Tabela notifications ativa)!');
        }
      });
  } catch (err) {
    console.warn('⚠️ Erro ao registrar canal Realtime para notifications:', err);
  }

  return () => {
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
}
