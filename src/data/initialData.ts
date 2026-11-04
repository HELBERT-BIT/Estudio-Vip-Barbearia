import { 
  BarberService, 
  BarbershopSettings, 
  Appointment, 
  Announcement, 
  AdminNotification,
  BarberReview 
} from '../types';

// Original service images generated for Estúdio VIP
import imgCorteSocial from '../assets/images/service_corte_social_1792966412779.jpg';
import imgDegrade from '../assets/images/service_degrade_fade_1792966413077.jpg';
import imgCorteMilitar from '../assets/images/service_corte_militar_1792966412944.jpg';
import imgDesignBarba from '../assets/images/service_design_barba_1792966414138.jpg';
import imgSobrancelha from '../assets/images/service_sobrancelha_1792966414916.jpg';
import imgCorteTesoura from '../assets/images/service_corte_tesoura_1792966415129.jpg';

// Helper to format date strings YYYY-MM-DD
export const getTodayString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getOffsetDateString = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Exact services and prices from the official poster image:
export const initialServices: BarberService[] = [
  {
    id: 'srv-corte-social',
    name: 'Corte Social',
    description: 'Corte masculino clássico e alinhado na máquina e acabamento profissional.',
    price: 35.00,
    durationMinutes: 30,
    category: 'cabelo',
    active: true,
    popular: false,
    imageUrl: imgCorteSocial
  },
  {
    id: 'srv-degrade',
    name: 'Degradê',
    description: 'Fade contemporâneo milimetricamente esfumado com alinhamento das linhas do pezinho.',
    price: 40.00,
    durationMinutes: 40,
    category: 'cabelo',
    active: true,
    popular: true,
    imageUrl: imgDegrade
  },
  {
    id: 'srv-corte-militar',
    name: 'Corte Militar',
    description: 'Corte prático, padrão militar rente com acabamento lateral e nuca impecáveis.',
    price: 35.00,
    durationMinutes: 30,
    category: 'cabelo',
    active: true,
    popular: false,
    imageUrl: imgCorteMilitar
  },
  {
    id: 'srv-design-barba',
    name: 'Design de Barba',
    description: 'Alinhamento preciso do contorno facial, raspagem das sobras na navalha e hidratação dos fios.',
    price: 40.00,
    durationMinutes: 30,
    category: 'barba',
    active: true,
    popular: true,
    imageUrl: imgDesignBarba
  },
  {
    id: 'srv-sobrancelha',
    name: 'Sobrancelha',
    description: 'Limpeza e desenho anatômico na navalha respeitando a harmonia do olhar.',
    price: 15.00,
    durationMinutes: 15,
    category: 'sobrancelha',
    active: true,
    popular: false,
    imageUrl: imgSobrancelha
  },
  {
    id: 'srv-corte-tesoura',
    name: 'Corte Social na Tesoura',
    description: 'Trabalho minucioso inteiramente estruturado na tesoura para caimento suave e sofisticado.',
    price: 50.00,
    durationMinutes: 45,
    category: 'cabelo',
    active: true,
    popular: true,
    imageUrl: imgCorteTesoura
  }
];

// Exact address and working hours from the door sign photo:
export const initialSettings: BarbershopSettings = {
  name: 'Estúdio VIP Barbearia',
  tagline: 'Estilo não é moda, é atitude!',
  address: 'R. Joaquim Cardeal de Souza, 136',
  neighborhood: 'São Judas Tadeu',
  city: 'Coxim - MS, 79400-000',
  referencePoint: 'Próximo à Escola Pedro Mendes Fontoura',
  phone: '+55 67 9944-0532',
  whatsapp: '+55 67 9944-0532',
  barberName: 'Mariano',
  scheduleNotice: 'Fechada aos domingos e em algumas segundas do mês (avisado previamente com antecedência no app).',
  slotDurationMinutes: 30,
  toleranceMinutes: 10,
  arrivalGuideline: 'Chegue entre 5 e 10 minutos antes do atendimento.',
  pixKey: '37629874000112',
  pixKeyType: 'CNPJ',
  pixKeyFormatted: '37.629.874/0001-12',
  pixReceiverName: 'Mariano Almeida da Silva Junior',
  pixBank: 'Nubank',
  guaranteePercentage: 50,
  manualOverrideStatus: 'auto', // 'auto' | 'open' | 'closed'
  workingDays: [
    {
      dayOfWeek: 0,
      dayName: 'Domingo',
      active: false,
      openTime: '08:30',
      closeTime: '19:00',
      hasLunchBreak: true,
      lunchStart: '12:00',
      lunchEnd: '14:00'
    },
    {
      dayOfWeek: 1,
      dayName: 'Segunda-feira',
      active: true,
      openTime: '08:30',
      closeTime: '19:00',
      hasLunchBreak: true,
      lunchStart: '12:00',
      lunchEnd: '14:00'
    },
    {
      dayOfWeek: 2,
      dayName: 'Terça-feira',
      active: true,
      openTime: '08:30',
      closeTime: '19:00',
      hasLunchBreak: true,
      lunchStart: '12:00',
      lunchEnd: '14:00'
    },
    {
      dayOfWeek: 3,
      dayName: 'Quarta-feira',
      active: true,
      openTime: '08:30',
      closeTime: '19:00',
      hasLunchBreak: true,
      lunchStart: '12:00',
      lunchEnd: '14:00'
    },
    {
      dayOfWeek: 4,
      dayName: 'Quinta-feira',
      active: true,
      openTime: '08:30',
      closeTime: '19:00',
      hasLunchBreak: true,
      lunchStart: '12:00',
      lunchEnd: '14:00'
    },
    {
      dayOfWeek: 5,
      dayName: 'Sexta-feira',
      active: true,
      openTime: '08:30',
      closeTime: '19:00',
      hasLunchBreak: true,
      lunchStart: '12:00',
      lunchEnd: '14:00'
    },
    {
      dayOfWeek: 6,
      dayName: 'Sábado',
      active: true,
      openTime: '08:30',
      closeTime: '19:00',
      hasLunchBreak: true,
      lunchStart: '12:00',
      lunchEnd: '14:00'
    }
  ]
};

export const initialAnnouncements: Announcement[] = [
  {
    id: 'anc-1',
    title: '☕ Café Quentinho & Água Gelada de Cortesia',
    content: 'Café passado na hora e água bem gelada para melhor recebê-lo e proporcionar o máximo de conforto enquanto você aguarda seu atendimento.',
    badge: 'Novidade',
    date: 'Destaque',
    active: true,
    important: false
  },
  {
    id: 'anc-2',
    title: '📅 Funcionamento aos Domingos e Segundas',
    content: 'Informamos que a barbearia permanece fechada aos domingos e em algumas segundas-feiras do mês. Qualquer alteração ou folga será sempre avisada com antecedência aqui no mural do app!',
    badge: 'Horário',
    date: 'Importante',
    active: true,
    important: true
  },
  {
    id: 'anc-3',
    title: '⏰ Regra de Tolerância Máxima: 10 Minutos',
    content: 'Para garantir o respeito aos horários de todos os clientes em Coxim, nosso sistema aplica tolerância máxima de 10 minutos. Chegue entre 5 e 10 minutos antes do seu horário!',
    badge: 'Aviso',
    date: 'Aviso',
    active: true,
    important: false
  },
  {
    id: 'anc-4',
    title: '📍 Localização do Estúdio VIP',
    content: 'Estamos na R. Joaquim Cardeal de Souza, 136 - Bairro São Judas Tadeu, bem próximo à Escola Pedro Mendes Fontoura em Coxim - MS. Fale direto com o Mariano pelo WhatsApp: +55 67 9944-0532.',
    badge: 'Informação',
    date: 'Fixo',
    active: true,
    important: false
  }
];

export const initialAppointments: Appointment[] = [];

export const initialReviews: BarberReview[] = [
  {
    id: 'rev-1',
    appointmentId: 'apt-201',
    clientName: 'Lucas Ferreira',
    clientPhone: '(67) 99654-1234',
    serviceId: 'srv-degrade',
    serviceName: 'Degradê',
    rating: 5,
    comment: 'O melhor corte em degradê de Coxim! O Mariano tem a mão leve, acabamento milimétrico na navalha e o café quentinho na recepção faz toda a diferença.',
    tags: ['Degradê Impecável', 'Pontualidade 10', 'Café Top'],
    date: getTodayString(),
    createdAt: `${getTodayString()}T10:00:00`,
    barberName: 'Mariano'
  },
  {
    id: 'rev-2',
    appointmentId: 'apt-202',
    clientName: 'Rodrigo Medeiros',
    clientPhone: '(67) 99123-8899',
    serviceId: 'srv-corte-social',
    serviceName: 'Corte Social',
    rating: 5,
    comment: 'Atendimento nota 10! Muito pontual, ambiente climatizado e higienizado. O Mariano é um profissional de excelência, recomendo a todos em Coxim.',
    tags: ['Atendimento VIP', 'Ambiente Top', 'Profissionalismo'],
    date: getTodayString(),
    createdAt: `${getTodayString()}T11:00:00`,
    barberName: 'Mariano'
  },
  {
    id: 'rev-3',
    appointmentId: 'apt-prev-1',
    clientName: 'Gabriel Siqueira',
    clientPhone: '(67) 99876-5544',
    serviceId: 'srv-design-barba',
    serviceName: 'Design de Barba',
    rating: 5,
    comment: 'O acabamento e o alinhamento da barba ficaram perfeitos. Atendimento muito atencioso e pontual. Não troco o Estúdio VIP por nenhuma outra barbearia da região.',
    tags: ['Barba Alinhada', 'Pontualidade 10'],
    date: getOffsetDateString(-1),
    createdAt: `${getOffsetDateString(-1)}T16:30:00`,
    barberName: 'Mariano'
  },
  {
    id: 'rev-4',
    appointmentId: 'apt-prev-2',
    clientName: 'Marcos Vinícius',
    clientPhone: '(67) 99345-6677',
    serviceId: 'srv-corte-militar',
    serviceName: 'Corte Militar',
    rating: 5,
    comment: 'Corte rápido, na régua e sem enrolação. Cheguei 5 minutos antes e fui atendido exatamente no meu horário. Estúdio VIP é diferenciado.',
    tags: ['Corte na Régua', 'Pontualidade 10'],
    date: getOffsetDateString(-2),
    createdAt: `${getOffsetDateString(-2)}T14:45:00`,
    barberName: 'Mariano'
  },
  {
    id: 'rev-5',
    appointmentId: 'apt-prev-3',
    clientName: 'Thiago Alencar',
    clientPhone: '(67) 99778-9900',
    serviceId: 'srv-corte-barba',
    serviceName: 'Corte + Barba',
    rating: 4,
    comment: 'Excelente atendimento e corte impecável. Só dei 4 estrelas porque quase perdi o horário com a regra dos 10 minutos, mas o barbeiro é nota 10!',
    tags: ['Corte + Barba', 'Atendimento VIP'],
    date: getOffsetDateString(-3),
    createdAt: `${getOffsetDateString(-3)}T17:15:00`,
    barberName: 'Mariano'
  }
];

export const initialNotifications: AdminNotification[] = [];

