export type MissionType = 'messages_today' | 'streak' | 'messages_total' | 'referral_today';

export interface DailyMission {
  id: string;
  label: string;
  desc: string;
  type: MissionType;
  goal: number;
  reward: number;
}

export const ALL_MISSIONS: DailyMission[] = [
  // Mensajes hoy
  { id: 'msg_1',  label: 'Recibe tu primer secreto hoy',  desc: 'Alguien quiere confesarte algo',   type: 'messages_today', goal: 1,   reward: 20 },
  { id: 'msg_3',  label: 'Recibe 3 secretos hoy',         desc: 'Tu inbox está despertando',        type: 'messages_today', goal: 3,   reward: 25 },
  { id: 'msg_5',  label: 'Recibe 5 secretos hoy',         desc: 'Eres el centro de atención',      type: 'messages_today', goal: 5,   reward: 30 },
  { id: 'msg_10', label: 'Recibe 10 secretos hoy',        desc: 'Tu inbox está on fire 🔥',        type: 'messages_today', goal: 10,  reward: 40 },
  { id: 'msg_20', label: 'Recibe 20 secretos hoy',        desc: 'Leyenda del día',                 type: 'messages_today', goal: 20,  reward: 60 },
  // Racha
  { id: 'streak_2',  label: 'Mantén racha de 2 días',     desc: 'La constancia tiene recompensa',  type: 'streak', goal: 2,  reward: 20 },
  { id: 'streak_5',  label: 'Mantén racha de 5 días',     desc: 'Ya es un hábito',                 type: 'streak', goal: 5,  reward: 30 },
  { id: 'streak_7',  label: 'Mantén racha de 7 días',     desc: 'Una semana sin parar',            type: 'streak', goal: 7,  reward: 50 },
  { id: 'streak_14', label: 'Mantén racha de 14 días',    desc: 'Dos semanas de fuego',            type: 'streak', goal: 14, reward: 80 },
  // Total acumulado
  { id: 'total_10',  label: 'Acumula 10 secretos en total',  desc: 'Tu inbox está llenándose',        type: 'messages_total', goal: 10,  reward: 20 },
  { id: 'total_25',  label: 'Acumula 25 secretos en total',  desc: 'Coleccionista de confesiones',    type: 'messages_total', goal: 25,  reward: 25 },
  { id: 'total_50',  label: 'Acumula 50 secretos en total',  desc: 'Medio centenar de secretos',      type: 'messages_total', goal: 50,  reward: 30 },
  { id: 'total_100', label: 'Acumula 100 secretos en total', desc: 'Centenario de confesiones',       type: 'messages_total', goal: 100, reward: 50 },
  { id: 'total_250', label: 'Acumula 250 secretos en total', desc: 'Imán de secretos',                type: 'messages_total', goal: 250, reward: 80 },
  // Referidos
  { id: 'ref_1', label: 'Invita a 1 amigo a Xposed hoy', desc: 'Comparte tu link y ambos ganan', type: 'referral_today', goal: 1, reward: 50 },
  { id: 'ref_3', label: 'Invita a 3 amigos a Xposed hoy', desc: 'El poder de la red',            type: 'referral_today', goal: 3, reward: 120 },
];

function hashStr(s: string): number {
  return s.split('').reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0x7fffffff, 0);
}

export function getDailyMissions(dateStr: string): DailyMission[] {
  const dateSeed = hashStr(dateStr);
  return [...ALL_MISSIONS]
    .sort((a, b) => ((dateSeed + hashStr(a.id)) & 0x7fffffff) - ((dateSeed + hashStr(b.id)) & 0x7fffffff))
    .slice(0, 5);
}

// Legacy alias
export const DAILY_MISSIONS = ALL_MISSIONS;
