export const DAILY_MISSIONS = [
  {
    id: 'msg_1',
    label: 'Recibe tu primer secreto hoy',
    desc: 'Alguien quiere confesarte algo',
    type: 'messages_today' as const,
    goal: 1,
    reward: 20,
  },
  {
    id: 'msg_3',
    label: 'Recibe 3 secretos hoy',
    desc: 'Tu inbox está despertando',
    type: 'messages_today' as const,
    goal: 3,
    reward: 20,
  },
  {
    id: 'msg_5',
    label: 'Recibe 5 secretos hoy',
    desc: 'Eres el centro de atención',
    type: 'messages_today' as const,
    goal: 5,
    reward: 20,
  },
  {
    id: 'streak_2',
    label: 'Mantén racha de 2 días',
    desc: 'La constancia tiene recompensa',
    type: 'streak' as const,
    goal: 2,
    reward: 20,
  },
  {
    id: 'total_10',
    label: 'Acumula 10 secretos en total',
    desc: 'Tu inbox está llenándose',
    type: 'messages_total' as const,
    goal: 10,
    reward: 20,
  },
];

export type DailyMission = typeof DAILY_MISSIONS[number];
