import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { fmtHora, isoDate, parseISODate } from './date';

/** Abre o calendário do Android. `valor` e o retorno são AAAA-MM-DD. */
export function escolherData(valor, onEscolher) {
  DateTimePickerAndroid.open({
    value: valor ? parseISODate(valor) : new Date(),
    mode: 'date',
    onChange: (event, data) => {
      if (event.type === 'set' && data) onEscolher(isoDate(data));
    },
  });
}

/** Abre o relógio do Android. `valor` e o retorno são HH:MM. */
export function escolherHora(valor, onEscolher) {
  const base = new Date();
  if (valor) {
    const [h, m] = valor.split(':').map(Number);
    base.setHours(h, m, 0, 0);
  }
  DateTimePickerAndroid.open({
    value: base,
    mode: 'time',
    is24Hour: true,
    onChange: (event, data) => {
      if (event.type === 'set' && data) onEscolher(fmtHora(data));
    },
  });
}
