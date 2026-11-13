import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { DIAS_CURTOS } from './date';

const CANAL = 'rotinas';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function prepararCanal() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CANAL, {
    name: 'Alarmes das rotinas',
    description: 'Lembretes das rotinas de limpeza da barbearia',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 600, 300, 600],
  });
}

const avisar = (titulo, texto) =>
  new Promise((resolve) => Alert.alert(titulo, texto, [{ text: 'OK', onPress: resolve }], { cancelable: false }));

/** Pede permissão de notificação e de alarme exato. Retorna true se puder agendar. */
export async function pedirPermissoes() {
  await prepararCanal();
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  if (status !== 'granted') return false;

  if (Platform.OS === 'android') {
    try {
      const exato = await Notifications.getExactAlarmPermissionsAsync();
      if (!exato.granted) {
        await avisar(
          'Alarme na hora certa',
          'Na próxima tela, ative "Permitir alarmes e lembretes" para o Clube Studio 8 e depois volte para o app.'
        );
        await Notifications.requestExactAlarmPermissionsAsync();
      }
    } catch {
      // Sem alarme exato o aviso ainda chega, só pode atrasar alguns minutos.
    }
  }
  return true;
}

export function descreverAlarme(alarme) {
  if (!alarme) return '';
  const dias = alarme.dias || [];
  let quando;
  if (dias.length === 7 || dias.length === 0) quando = 'todos os dias';
  else if (dias.length === 6 && !dias.includes(0)) quando = 'seg a sáb';
  else if (dias.length === 5 && !dias.includes(0) && !dias.includes(6)) quando = 'seg a sex';
  else quando = [...dias].sort().map((d) => DIAS_CURTOS[d].toLowerCase()).join(', ');
  return `⏰ ${alarme.hora} · ${quando}`;
}

let fila = Promise.resolve();

/** Cancela tudo e agenda de novo os alarmes de todas as rotinas. */
export function sincronizarAlarmes(rotinas) {
  fila = fila.then(() => sincronizar(rotinas)).catch(() => {});
  return fila;
}

async function sincronizar(rotinas) {
  await prepararCanal();
  await Notifications.cancelAllScheduledNotificationsAsync();
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  let exato = false;
  try {
    exato = (await Notifications.getExactAlarmPermissionsAsync()).granted;
  } catch {}
  const delivery = exato ? 'alarmClock' : 'bestEffort';

  for (const r of rotinas) {
    if (!r.alarme) continue;
    const [hour, minute] = r.alarme.hora.split(':').map(Number);
    const dias = r.alarme.dias && r.alarme.dias.length ? r.alarme.dias : [0, 1, 2, 3, 4, 5, 6];
    const content = {
      title: 'Clube Studio 8 – Rotina',
      body: r.titulo,
      sound: true,
      data: { rotinaId: r.id },
    };
    if (dias.length === 7) {
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: CANAL, delivery },
      });
    } else {
      for (const d of dias) {
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: d + 1, // expo: 1 = domingo; JS: 0 = domingo
            hour,
            minute,
            channelId: CANAL,
            delivery,
          },
        });
      }
    }
  }
}
