import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { Button, Chip, CheckRow, Empty, Fab, Field, Icon, PickerField, SectionTitle, Sheet, T } from '../components';
import { DIAS_CURTOS, inicioSemana, isoDate, parseISODate, uid } from '../date';
import { descreverAlarme, pedirPermissoes, sincronizarAlarmes } from '../alarms';
import { escolherHora } from '../pickers';
import { useHoje, useStored } from '../storage';
import { C, F } from '../theme';

/*
Rotina {
  id, titulo,
  periodo: 'abertura' | 'cliente' | 'meio' | 'fechamento' | 'semanal' | 'manutencao',
  alarme: { hora: 'HH:MM', dias: number[] (0 = domingo) } | null,
  feitaEm: ISO | null
}
'semanal' e 'manutencao' zeram toda segunda; as demais zeram à meia-noite.
*/

export const PERIODOS = [
  { id: 'abertura', label: 'Abertura', icon: 'store-clock-outline' },
  { id: 'cliente', label: 'A cada cliente', icon: 'account-sync-outline' },
  { id: 'meio', label: 'Meio do dia', icon: 'white-balance-sunny' },
  { id: 'fechamento', label: 'Fechamento', icon: 'store-off-outline' },
  { id: 'semanal', label: 'Limpeza semanal', icon: 'broom' },
  { id: 'manutencao', label: 'Manutenção semanal', icon: 'wrench-outline' },
];

const SEMANAIS = ['semanal', 'manutencao'];

const ROTINAS_INICIAIS = [
  ['abertura', 'Limpar cadeiras e bancada'],
  ['abertura', 'Desinfetar ferramentas (álcool 70%)'],
  ['abertura', 'Conferir álcool 70%, lâminas e papel toalha'],
  ['cliente', 'Trocar lâmina da navalha (abrir na frente do cliente)'],
  ['cliente', 'Limpar máquina e pente (tirar pelos + álcool 70%)'],
  ['cliente', 'Usar toalha ou gola limpa'],
  ['cliente', 'Limpar cadeira (pico: a cada 3)'],
  ['meio', 'Varrer o cabelo e guardar em saco separado'],
  ['meio', 'Repor álcool 70% e papel toalha'],
  ['fechamento', 'Separar cabelo do lixo comum'],
  ['fechamento', 'Separar embalagens p/ reciclagem'],
  ['fechamento', 'Conferir caixa de perfurocortantes'],
  ['fechamento', 'Limpar e desinfetar bancada, cadeiras e pia'],
  ['semanal', 'Limpeza geral: chão, pias e espelhos'],
  ['semanal', 'Lavar toalhas e capas'],
  ['semanal', 'Limpar ralos e sifão da pia'],
  ['manutencao', 'Lubrificar lâminas das máquinas (óleo)'],
  ['manutencao', 'Conferir fios, carregadores e baterias das máquinas'],
  ['manutencao', 'Ver se as lâminas da máquina precisam afiar ou trocar'],
  ['manutencao', 'Trocar caixa de perfurocortantes se estiver 2/3 cheia'],
  ['manutencao', 'Conferir itens acabando (aba Compras)'],
].map(([periodo, titulo]) => ({ id: uid(), titulo, periodo, alarme: null, feitaEm: null }));

export function estaFeita(r, hoje) {
  if (!r.feitaEm) return false;
  const feita = new Date(r.feitaEm);
  if (SEMANAIS.includes(r.periodo)) return feita >= inicioSemana(parseISODate(hoje));
  return isoDate(feita) === hoje;
}

const TODOS_DIAS = [0, 1, 2, 3, 4, 5, 6];

export default function LimpezaScreen() {
  const hoje = useHoje();
  const [rotinas, setRotinas, ok] = useStored('cs8:rotinas:v2', () => ROTINAS_INICIAIS);
  const [form, setForm] = useState(null);
  const [filtro, setFiltro] = useState('dia'); // dia | semana

  const chaveAlarmes = useMemo(
    () => JSON.stringify((rotinas || []).filter((r) => r.alarme).map((r) => [r.id, r.titulo, r.alarme])),
    [rotinas]
  );
  useEffect(() => {
    if (ok) sincronizarAlarmes(rotinas);
  }, [chaveAlarmes, ok]);

  if (!ok) return null;

  const diarias = rotinas.filter((r) => !SEMANAIS.includes(r.periodo));
  const semanais = rotinas.filter((r) => SEMANAIS.includes(r.periodo));
  const feitasHoje = diarias.filter((r) => estaFeita(r, hoje)).length;
  const feitasSemana = semanais.filter((r) => estaFeita(r, hoje)).length;
  const lista = filtro === 'dia' ? diarias : semanais;
  const [feitas, total] = filtro === 'dia' ? [feitasHoje, diarias.length] : [feitasSemana, semanais.length];
  const pct = total ? feitas / total : 0;

  const alternar = (r) =>
    setRotinas((l) => l.map((x) => (x.id === r.id ? { ...x, feitaEm: estaFeita(x, hoje) ? null : new Date().toISOString() } : x)));

  const salvar = async () => {
    const f = form;
    if (!f.titulo.trim()) return Alert.alert('Falta o nome', 'Escreva o que precisa ser feito.');
    let alarme = null;
    if (f.temAlarme) {
      if (!f.hora) return Alert.alert('Falta o horário', 'Escolha o horário do alarme.');
      if (!f.dias.length) return Alert.alert('Faltam os dias', 'Escolha pelo menos um dia da semana.');
      alarme = { hora: f.hora, dias: [...f.dias].sort() };
      if (!(await pedirPermissoes()))
        Alert.alert('Notificações bloqueadas', 'O alarme foi salvo, mas só vai tocar depois de permitir as notificações do app nas configurações do celular.');
    }
    const dados = { titulo: f.titulo.trim(), periodo: f.periodo, alarme };
    if (f.id) setRotinas((l) => l.map((x) => (x.id === f.id ? { ...x, ...dados } : x)));
    else setRotinas((l) => [...l, { id: uid(), ...dados, feitaEm: null }]);
    setForm(null);
  };

  const excluir = () =>
    Alert.alert('Excluir rotina?', form.titulo, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          setRotinas((l) => l.filter((x) => x.id !== form.id));
          setForm(null);
        },
      },
    ]);

  const abrirForm = (r) =>
    setForm(
      r
        ? { id: r.id, titulo: r.titulo, periodo: r.periodo, temAlarme: !!r.alarme, hora: r.alarme?.hora || '', dias: r.alarme?.dias || TODOS_DIAS }
        : { id: null, titulo: '', periodo: filtro === 'dia' ? 'abertura' : 'manutencao', temAlarme: false, hora: '', dias: [1, 2, 3, 4, 5, 6] }
    );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
        {/* Seletor Hoje / Semana */}
        <View style={s.toggle}>
          {[
            ['dia', 'Hoje', `${feitasHoje}/${diarias.length}`],
            ['semana', 'Semana', `${feitasSemana}/${semanais.length}`],
          ].map(([id, lbl, n]) => (
            <Pressable key={id} onPress={() => setFiltro(id)} style={[s.toggleBtn, filtro === id && s.toggleOn]}>
              <Text style={[s.toggleTxt, filtro === id && { color: C.onLime }]}>
                {lbl} <Text style={{ fontFamily: F.medium }}>{n}</Text>
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Progresso */}
        <View style={s.prog}>
          <View style={{ flex: 1 }}>
            <T v="label">{filtro === 'dia' ? 'Progresso de hoje' : 'Progresso da semana'}</T>
            <Text style={s.progNum}>
              {feitas} <Text style={{ color: C.muted, fontSize: 26 }}>de {total}</Text>
            </Text>
            <View style={s.barra}>
              <View style={[s.barraCheia, { width: `${Math.round(pct * 100)}%` }]} />
            </View>
            <T v="small" style={{ marginTop: 8 }}>
              {filtro === 'dia' ? 'Zera sozinho à meia-noite.' : 'Zera sozinho toda segunda-feira.'}
            </T>
          </View>
          <View style={s.pctCircle}>
            <Text style={s.pctTxt}>{Math.round(pct * 100)}%</Text>
          </View>
        </View>

        {PERIODOS.filter((p) => (filtro === 'dia') !== SEMANAIS.includes(p.id)).map((p) => {
          const itens = lista.filter((r) => r.periodo === p.id);
          if (!itens.length) return null;
          const f = itens.filter((r) => estaFeita(r, hoje)).length;
          return (
            <View key={p.id}>
              <SectionTitle icon={p.icon} right={<T v="small">{f}/{itens.length}</T>}>
                {p.label}
              </SectionTitle>
              {itens.map((r) => (
                <CheckRow
                  key={r.id}
                  checked={estaFeita(r, hoje)}
                  label={r.titulo}
                  sub={descreverAlarme(r.alarme)}
                  onPress={() => alternar(r)}
                  onLongPress={() => abrirForm(r)}
                />
              ))}
            </View>
          );
        })}
        {lista.length === 0 && <Empty icon="broom">Nenhuma rotina. Toque em + para criar.</Empty>}
        <T v="small" style={{ textAlign: 'center', marginTop: 12 }}>
          Toque para marcar · segure para editar, pôr alarme ou excluir
        </T>
      </ScrollView>

      <Fab onPress={() => abrirForm(null)} />

      <Sheet
        visible={!!form}
        title={form?.id ? 'Editar rotina' : 'Nova rotina'}
        onClose={() => setForm(null)}
        footer={
          <>
            {form?.id ? <Button title="Excluir" icon="delete-outline" variant="danger" onPress={excluir} style={{ flex: 1 }} /> : null}
            <Button title="Salvar" icon="check" onPress={salvar} style={{ flex: 1.4 }} />
          </>
        }
      >
        {form && (
          <>
            <Field label="O que fazer" value={form.titulo} onChangeText={(titulo) => setForm({ ...form, titulo })} placeholder="Ex.: Desinfetar ferramentas" />
            <T v="label" style={{ marginBottom: 8 }}>Quando</T>
            <View style={s.chips}>
              {PERIODOS.map((p) => (
                <Chip key={p.id} icon={p.icon} label={p.label} selected={form.periodo === p.id} onPress={() => setForm({ ...form, periodo: p.id })} />
              ))}
            </View>

            <View style={s.alarmeLinha}>
              <Icon name="alarm" size={24} color={C.lime} />
              <View style={{ flex: 1 }}>
                <T v="title">Alarme</T>
                <T v="small">Toca no celular mesmo com o app fechado.</T>
              </View>
              <Switch value={form.temAlarme} onValueChange={(temAlarme) => setForm({ ...form, temAlarme })} trackColor={{ true: C.limeDark, false: C.graphite }} thumbColor={form.temAlarme ? C.lime : C.muted} />
            </View>

            {form.temAlarme && (
              <>
                <PickerField label="Horário" icon="clock-outline" value={form.hora} placeholder="Escolher horário" onPress={() => escolherHora(form.hora || '08:00', (hora) => setForm((f) => ({ ...f, hora })))} />
                <T v="label" style={{ marginBottom: 8 }}>Dias</T>
                <View style={s.chips}>
                  {DIAS_CURTOS.map((d, i) => (
                    <Chip
                      key={d}
                      label={d}
                      selected={form.dias.includes(i)}
                      onPress={() => setForm({ ...form, dias: form.dias.includes(i) ? form.dias.filter((x) => x !== i) : [...form.dias, i] })}
                    />
                  ))}
                </View>
                <View style={s.chips}>
                  <Chip icon="lightning-bolt" label="Seg a sáb" onPress={() => setForm({ ...form, dias: [1, 2, 3, 4, 5, 6] })} />
                  <Chip icon="lightning-bolt" label="Todos" onPress={() => setForm({ ...form, dias: TODOS_DIAS })} />
                  <Chip icon="lightning-bolt" label="Só segunda" onPress={() => setForm({ ...form, dias: [1] })} />
                </View>
              </>
            )}
          </>
        )}
      </Sheet>
    </View>
  );
}

const s = {
  toggle: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: C.border },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  toggleOn: { backgroundColor: C.lime },
  toggleTxt: { fontFamily: F.bold, color: C.text, fontSize: 14 },
  prog: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: C.surface, borderRadius: 18, padding: 16, marginTop: 12, borderWidth: 1, borderColor: C.border },
  progNum: { fontFamily: F.display, fontSize: 40, color: C.text, marginTop: 2 },
  barra: { height: 8, backgroundColor: C.surface2, borderRadius: 4, marginTop: 6, overflow: 'hidden' },
  barraCheia: { height: 8, backgroundColor: C.lime, borderRadius: 4 },
  pctCircle: { width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: C.lime, alignItems: 'center', justifyContent: 'center', backgroundColor: C.limeSoft },
  pctTxt: { fontFamily: F.display, fontSize: 28, color: C.lime },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  alarmeLinha: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 14 },
};
