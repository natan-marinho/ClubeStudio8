import React, { useMemo, useRef, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ActionTile, Badge, Button, Card, Chip, Empty, Fab, Field, Icon, PickerField, SectionTitle, Sheet, T } from '../components';
import { Avatar, CLIENTE_VAZIO, ClienteForm, salvarCliente } from '../clientes/ClientesScreen';
import { fmtTelefone, numeroWhats, soDigitos, useData } from '../data';
import { addDays, DIAS_CURTOS, fmtBR, fmtCurto, fmtDataHora, nomeDia, parseISODate, uid } from '../date';
import { escolherData, escolherHora } from '../pickers';
import { useHoje } from '../storage';
import { C, F } from '../theme';

const STATUS = {
  agendado: { label: 'Agendado', fg: C.info, bg: C.infoSoft },
  compareceu: { label: 'Compareceu', fg: C.ok, bg: C.okSoft },
  faltou: { label: 'Faltou', fg: C.danger, bg: C.dangerSoft },
  cancelou: { label: 'Desmarcou', fg: C.warn, bg: C.warnSoft },
};

function quando(data, hoje) {
  if (data === hoje) return 'hoje';
  if (data === addDays(hoje, 1)) return 'amanhã';
  return `no dia ${fmtCurto(data)}`;
}

const primeiroNome = (n) => (n || '').trim().split(/\s+/)[0];

const msgLembrete = (a, hoje) =>
  `Fala, ${primeiroNome(a.nome)}! Passando pra lembrar do seu horário ${quando(a.data, hoje)} às ${a.hora} aqui na Clube Studio 8. ` +
  'Pode confirmar pra mim? Se precisar remarcar, me avisa que eu ajusto.';

const msgVaga = (a, hoje) =>
  `Fala! Abriu um horário ${quando(a.data, hoje)} às ${a.hora} aqui na Clube Studio 8. ` +
  'Quer aproveitar? É só me responder que eu reservo pra você.';

async function abrir(url, erro) {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    Alert.alert('Não foi possível abrir', erro);
    return false;
  }
}

const abrirWhats = (numero, texto) =>
  abrir(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`, 'Confira se o WhatsApp Business está instalado neste celular.');

export default function AgendaScreen() {
  const hoje = useHoje();
  const { clientes, setClientes, agendamentos, setAgendamentos } = useData();
  const [dia, setDia] = useState(hoje);
  const [abertoId, setAbertoId] = useState(null);
  const [form, setForm] = useState(null);
  const [resumoAberto, setResumoAberto] = useState(false);

  // Junta os dados atuais do cliente (nome/telefone podem ter sido editados).
  const comCliente = (a) => {
    const c = clientes.find((x) => x.id === a.clienteId);
    return c ? { ...a, nome: c.nome, telefone: c.telefone, autorizou: c.autorizou } : a;
  };

  const doDia = useMemo(
    () => agendamentos.filter((a) => a.data === dia).sort((a, b) => a.hora.localeCompare(b.hora)).map(comCliente),
    [agendamentos, clientes, dia]
  );
  const aberto = abertoId ? comCliente(agendamentos.find((a) => a.id === abertoId) || {}) : null;

  const atualizar = (id, mudanca) => setAgendamentos((l) => l.map((a) => (a.id === id ? { ...a, ...mudanca } : a)));

  // ---------- ações do modal ----------
  const ligar = (a) => abrir(`tel:${a.telefone}`, 'Não foi possível abrir o discador.');

  const enviarLembrete = async (a) => {
    if (a.autorizou === false)
      return Alert.alert('Sem autorização (LGPD)', 'Esse cliente não autorizou lembretes. Edite o cadastro dele na aba Clientes se ele autorizar.');
    if (await abrirWhats(numeroWhats(a.telefone), msgLembrete(a, hoje))) atualizar(a.id, { lembreteEm: new Date().toISOString() });
  };

  const mudarStatus = (a, status) =>
    atualizar(a.id, {
      status: a.status === status ? 'agendado' : status,
      recuperado: status === 'compareceu' || a.status === status ? false : a.recuperado,
    });

  const oferecerVaga = async (a) => {
    if (await abrirWhats('', msgVaga(a, hoje))) atualizar(a.id, { vagaOferecidaEm: new Date().toISOString() });
  };

  const excluir = (a) =>
    Alert.alert('Excluir agendamento?', `${a.nome} – ${fmtCurto(a.data)} às ${a.hora}`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          setAbertoId(null);
          setAgendamentos((l) => l.filter((x) => x.id !== a.id));
        },
      },
    ]);

  // ---------- novo / editar ----------
  const novo = () => setForm({ id: null, clienteId: null, data: dia, hora: '', busca: '', novoCliente: null });

  const salvar = () => {
    const f = form;
    let cliente = clientes.find((c) => c.id === f.clienteId);
    if (f.novoCliente) {
      cliente = salvarCliente(f.novoCliente, clientes, setClientes);
      if (!cliente) return;
    }
    if (!cliente) return Alert.alert('Escolha o cliente', 'Selecione um cliente da lista ou cadastre um novo.');
    if (!f.hora) return Alert.alert('Falta o horário', 'Escolha o horário do atendimento.');

    const gravar = () => {
      const dados = { clienteId: cliente.id, nome: cliente.nome, telefone: cliente.telefone, data: f.data, hora: f.hora };
      if (f.id) atualizar(f.id, dados);
      else
        setAgendamentos((l) => [...l, { id: uid(), ...dados, status: 'agendado', lembreteEm: null, vagaOferecidaEm: null, recuperado: false }]);
      setDia(f.data);
      setForm(null);
    };

    const conflito = agendamentos.find(
      (a) => a.id !== f.id && a.data === f.data && a.hora === f.hora && a.status !== 'cancelou' && a.status !== 'faltou'
    );
    if (conflito)
      return Alert.alert('Horário ocupado', `Já tem ${comCliente(conflito).nome} às ${f.hora}. Agendar mesmo assim?`, [
        { text: 'Voltar', style: 'cancel' },
        { text: 'Agendar', onPress: gravar },
      ]);
    gravar();
  };

  // ---------- faixa de dias ----------
  const dias = useMemo(() => {
    const base = dia < addDays(hoje, -3) || dia > addDays(hoje, 20) ? addDays(dia, -3) : addDays(hoje, -3);
    return Array.from({ length: 24 }, (_, i) => addDays(base, i));
  }, [hoje, dia]);
  const contagem = useMemo(() => {
    const m = {};
    for (const a of agendamentos) if (a.status !== 'cancelou') m[a.data] = (m[a.data] || 0) + 1;
    return m;
  }, [agendamentos]);
  const stripRef = useRef(null);

  const pendentes = doDia.filter((a) => a.status === 'agendado').length;
  const amanhaSemLembrete = agendamentos.filter((a) => a.data === addDays(hoje, 1) && a.status === 'agendado' && !a.lembreteEm).length;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Faixa de dias */}
        <ScrollView
          ref={stripRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 14, gap: 8 }}
          onLayout={() => stripRef.current?.scrollTo({ x: Math.max(0, dias.indexOf(dia) - 1) * 64, animated: false })}
        >
          {dias.map((d) => {
            const sel = d === dia;
            const dt = parseISODate(d);
            return (
              <Pressable key={d} onPress={() => setDia(d)} style={[s.dia, sel && s.diaSel, d === hoje && !sel && s.diaHoje]}>
                <Text style={[s.diaSem, sel && { color: C.onLime }]}>{d === hoje ? 'HOJE' : DIAS_CURTOS[dt.getDay()].toUpperCase()}</Text>
                <Text style={[s.diaNum, sel && { color: C.onLime }]}>{dt.getDate()}</Text>
                <View style={[s.dot, { opacity: contagem[d] ? 1 : 0 }, sel && { backgroundColor: C.onLime }]} />
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ paddingHorizontal: 16 }}>
          <View style={s.diaHeader}>
            <View style={{ flex: 1 }}>
              <T v="h2" style={{ fontSize: 28 }}>
                {dia === hoje ? 'Hoje' : dia === addDays(hoje, 1) ? 'Amanhã' : nomeDia(dia)}
              </T>
              <T v="small">
                {fmtBR(dia)} · {doDia.length} {doDia.length === 1 ? 'horário' : 'horários'}
                {pendentes ? ` · ${pendentes} a confirmar` : ''}
              </T>
            </View>
            <Pressable onPress={() => escolherData(dia, setDia)} style={s.iconBtn}>
              <Icon name="calendar-search" size={22} color={C.lime} />
            </Pressable>
            <Pressable onPress={() => setResumoAberto(true)} style={s.iconBtn}>
              <Icon name="chart-box-outline" size={22} color={C.lime} />
            </Pressable>
          </View>

          {dia === hoje && amanhaSemLembrete > 0 && (
            <Pressable onPress={() => setDia(addDays(hoje, 1))} style={s.aviso}>
              <Icon name="bell-ring-outline" size={20} color={C.onLime} />
              <Text style={s.avisoTxt}>
                {amanhaSemLembrete} {amanhaSemLembrete === 1 ? 'cliente de amanhã ainda não recebeu' : 'clientes de amanhã ainda não receberam'} lembrete
              </Text>
              <Icon name="chevron-right" size={20} color={C.onLime} />
            </Pressable>
          )}

          {doDia.length === 0 && <Empty icon="calendar-blank-outline">Nenhum horário neste dia.{'\n'}Toque em + para agendar.</Empty>}
          {doDia.map((a) => {
            const info = STATUS[a.status];
            return (
              <Card key={a.id} onPress={() => setAbertoId(a.id)} style={[s.agCard, a.status !== 'agendado' && { opacity: 0.85 }]}>
                <View style={[s.faixa, { backgroundColor: info.fg }]} />
                <View style={s.horaBox}>
                  <Text style={s.hora}>{a.hora}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <T v="title" numberOfLines={1}>
                    {a.nome}
                  </T>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 }}>
                    <Badge label={info.label} color={info.fg} bg={info.bg} />
                    {a.lembreteEm && <Icon name="whatsapp" size={16} color={C.whats} />}
                    {a.recuperado && <Icon name="calendar-refresh" size={16} color={C.ok} />}
                  </View>
                </View>
                <Icon name="dots-vertical" size={22} color={C.faint} />
              </Card>
            );
          })}
        </View>
      </ScrollView>

      <Fab icon="calendar-plus" onPress={novo} />

      {/* ---------- Modal de ações ---------- */}
      <Sheet
        visible={!!aberto && !form}
        title={aberto?.nome || ''}
        subtitle={aberto?.data ? `${nomeDia(aberto.data)}, ${fmtCurto(aberto.data)} às ${aberto.hora} · ${fmtTelefone(aberto.telefone)}` : ''}
        onClose={() => setAbertoId(null)}
        footer={
          aberto && (
            <>
              <Button title="Excluir" icon="delete-outline" variant="danger" small onPress={() => excluir(aberto)} style={{ flex: 1 }} />
              <Button
                title="Editar / remarcar"
                icon="pencil-outline"
                variant="dark"
                small
                onPress={() => setForm({ id: aberto.id, clienteId: aberto.clienteId, data: aberto.data, hora: aberto.hora, busca: '', novoCliente: null })}
                style={{ flex: 1.6 }}
              />
            </>
          )
        }
      >
        {aberto?.id && (
          <>
            <View style={s.tiles}>
              <ActionTile icon="phone" label="Ligar" color={C.lime} onPress={() => ligar(aberto)} />
              <ActionTile icon="whatsapp" label={aberto.lembreteEm ? 'Reenviar lembrete' : 'Enviar lembrete'} color={C.whats} onPress={() => enviarLembrete(aberto)} />
              <ActionTile icon="check-circle-outline" label="Compareceu" color={C.ok} active={aberto.status === 'compareceu'} onPress={() => mudarStatus(aberto, 'compareceu')} />
              <ActionTile icon="account-cancel-outline" label="Falta" color={C.danger} active={aberto.status === 'faltou'} onPress={() => mudarStatus(aberto, 'faltou')} />
              <ActionTile icon="calendar-remove-outline" label="Desmarcar" color={C.warn} active={aberto.status === 'cancelou'} onPress={() => mudarStatus(aberto, 'cancelou')} />
              {aberto.status === 'faltou' || aberto.status === 'cancelou' ? (
                <ActionTile icon="bullhorn-outline" label="Oferecer vaga" color={C.info} onPress={() => oferecerVaga(aberto)} />
              ) : (
                <View style={{ flexBasis: '31%', flexGrow: 1 }} />
              )}
            </View>

            {(aberto.status === 'faltou' || aberto.status === 'cancelou') && (
              <Pressable onPress={() => atualizar(aberto.id, { recuperado: !aberto.recuperado })} style={[s.recup, aberto.recuperado && s.recupOn]}>
                <Icon name={aberto.recuperado ? 'check-circle' : 'calendar-refresh'} size={22} color={aberto.recuperado ? C.onLime : C.lime} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.recupTxt, aberto.recuperado && { color: C.onLime }]}>
                    {aberto.recuperado ? 'Horário recuperado' : 'Marcar horário como recuperado'}
                  </Text>
                  <Text style={[s.recupSub, aberto.recuperado && { color: C.onLime }]}>Outro cliente ocupou a vaga</Text>
                </View>
              </Pressable>
            )}

            <View style={s.historico}>
              <Linha icon="whatsapp" txt={aberto.lembreteEm ? `Lembrete enviado ${fmtDataHora(aberto.lembreteEm)}` : 'Lembrete ainda não enviado'} ok={!!aberto.lembreteEm} />
              {aberto.vagaOferecidaEm && <Linha icon="bullhorn-outline" txt={`Vaga oferecida ${fmtDataHora(aberto.vagaOferecidaEm)}`} ok />}
              {aberto.autorizou === false && <Linha icon="shield-alert-outline" txt="Cliente não autorizou lembretes (LGPD)" />}
            </View>
          </>
        )}
      </Sheet>

      {/* ---------- Novo / editar ---------- */}
      <Sheet
        visible={!!form}
        title={form?.id ? 'Remarcar' : 'Novo agendamento'}
        onClose={() => setForm(null)}
        footer={
          <>
            <Button title="Cancelar" variant="dark" onPress={() => setForm(null)} style={{ flex: 1 }} />
            <Button title="Agendar" icon="check" onPress={salvar} style={{ flex: 1.4 }} />
          </>
        }
      >
        {form && <FormAgendamento form={form} setForm={setForm} clientes={clientes} hoje={hoje} />}
      </Sheet>

      {/* ---------- Resumo ---------- */}
      <Resumo visivel={resumoAberto} fechar={() => setResumoAberto(false)} agendamentos={agendamentos} hoje={hoje} />
    </View>
  );
}

function Linha({ icon, txt, ok }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
      <Icon name={icon} size={16} color={ok ? C.ok : C.muted} />
      <T v="small" style={ok && { color: C.text }}>
        {txt}
      </T>
    </View>
  );
}

function FormAgendamento({ form, setForm, clientes, hoje }) {
  const sel = clientes.find((c) => c.id === form.clienteId);
  const q = form.busca.trim().toLowerCase();
  const dig = soDigitos(form.busca);
  const sugestoes = [...clientes]
    .filter((c) => !q || c.nome.toLowerCase().includes(q) || (dig && c.telefone.includes(dig)))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    .slice(0, 6);

  return (
    <>
      <T v="label" style={{ marginBottom: 8 }}>Cliente</T>
      {form.novoCliente ? (
        <View style={s.novoCli}>
          <ClienteForm form={form.novoCliente} setForm={(novoCliente) => setForm((f) => ({ ...f, novoCliente }))} />
          <Button title="Escolher da lista" icon="format-list-bulleted" variant="dark" small onPress={() => setForm((f) => ({ ...f, novoCliente: null }))} />
        </View>
      ) : sel ? (
        <Pressable onPress={() => setForm((f) => ({ ...f, clienteId: null }))} style={[s.cliSel]}>
          <Avatar nome={sel.nome} size={40} />
          <View style={{ flex: 1 }}>
            <T v="title">{sel.nome}</T>
            <T v="small">{fmtTelefone(sel.telefone)}</T>
          </View>
          <T v="small" style={{ color: C.lime }}>Trocar</T>
        </Pressable>
      ) : (
        <>
          <Field icon="magnify" value={form.busca} onChangeText={(busca) => setForm((f) => ({ ...f, busca }))} placeholder="Buscar cliente" />
          {sugestoes.map((c) => (
            <Pressable key={c.id} onPress={() => setForm((f) => ({ ...f, clienteId: c.id }))} style={s.sugestao}>
              <Avatar nome={c.nome} size={34} />
              <View style={{ flex: 1 }}>
                <T v="semi">{c.nome}</T>
                <T v="small">{fmtTelefone(c.telefone)}</T>
              </View>
            </Pressable>
          ))}
          {clientes.length === 0 && <T v="small" style={{ marginBottom: 8 }}>Nenhum cliente cadastrado ainda.</T>}
          <Button
            title="Cadastrar novo cliente"
            icon="account-plus-outline"
            variant="outline"
            small
            onPress={() => setForm((f) => ({ ...f, novoCliente: { ...CLIENTE_VAZIO, nome: /\d/.test(f.busca) ? '' : f.busca, telefone: /\d/.test(f.busca) ? f.busca : '' } }))}
            style={{ marginBottom: 6 }}
          />
        </>
      )}

      <T v="label" style={{ marginTop: 16, marginBottom: 8 }}>Dia</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <Chip label="Hoje" selected={form.data === hoje} onPress={() => setForm((f) => ({ ...f, data: hoje }))} />
        <Chip label="Amanhã" selected={form.data === addDays(hoje, 1)} onPress={() => setForm((f) => ({ ...f, data: addDays(hoje, 1) }))} />
        <Chip
          icon="calendar"
          label={form.data !== hoje && form.data !== addDays(hoje, 1) ? `${nomeDia(form.data)}, ${fmtCurto(form.data)}` : 'Outro dia'}
          selected={form.data !== hoje && form.data !== addDays(hoje, 1)}
          onPress={() => escolherData(form.data, (data) => setForm((f) => ({ ...f, data })))}
        />
      </View>

      <PickerField
        label="Horário"
        icon="clock-outline"
        value={form.hora}
        placeholder="Escolher horário"
        onPress={() => escolherHora(form.hora || '09:00', (hora) => setForm((f) => ({ ...f, hora })))}
      />
    </>
  );
}

function Resumo({ visivel, fechar, agendamentos, hoje }) {
  const [de, setDe] = useState(addDays(hoje, -6));
  const [ate, setAte] = useState(hoje);

  const resumo = useMemo(() => {
    if (de > ate) return null;
    const linhas = [];
    for (let d = de, i = 0; i < 92 && d <= ate; i++, d = addDays(d, 1)) {
      const x = agendamentos.filter((a) => a.data === d);
      linhas.push({
        data: d,
        agendados: x.length,
        lembretes: x.filter((a) => a.lembreteEm).length,
        faltas: x.filter((a) => a.status === 'faltou').length,
        cancelamentos: x.filter((a) => a.status === 'cancelou').length,
        recuperados: x.filter((a) => a.recuperado).length,
      });
    }
    const total = { agendados: 0, lembretes: 0, faltas: 0, cancelamentos: 0, recuperados: 0 };
    for (const l of linhas) for (const k in total) total[k] += l[k];
    return { linhas, total };
  }, [agendamentos, de, ate]);

  const copiar = async () => {
    const { linhas, total } = resumo;
    const txt = [
      'Clube Studio 8 – Resumo de faltas',
      `Período: ${fmtBR(de)} a ${fmtBR(ate)}`,
      '',
      'Data | Agendados | Lembretes enviados | Faltas | Desmarcados | Horários recuperados',
      ...linhas.map((l) => `${fmtCurto(l.data)} | ${l.agendados} | ${l.lembretes} | ${l.faltas} | ${l.cancelamentos} | ${l.recuperados}`),
      `TOTAL | ${total.agendados} | ${total.lembretes} | ${total.faltas} | ${total.cancelamentos} | ${total.recuperados}`,
    ].join('\n');
    await Clipboard.setStringAsync(txt);
    Alert.alert('Resumo copiado', 'Agora é só colar no WhatsApp ou onde quiser.');
  };

  const Num = ({ n, label, cor }) => (
    <View style={s.kpi}>
      <Text style={[s.kpiNum, { color: cor }]}>{n}</Text>
      <Text style={s.kpiLbl}>{label}</Text>
    </View>
  );

  return (
    <Sheet
      visible={visivel}
      title="Resumo do período"
      onClose={fechar}
      footer={resumo && <Button title="Copiar resumo" icon="content-copy" onPress={copiar} style={{ flex: 1 }} />}
    >
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <PickerField label="De" icon="calendar" value={fmtBR(de)} onPress={() => escolherData(de, setDe)} />
        <PickerField label="Até" icon="calendar" value={fmtBR(ate)} onPress={() => escolherData(ate, setAte)} />
      </View>
      {!resumo ? (
        <Empty>A data inicial precisa ser antes da final.</Empty>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            <Num n={resumo.total.agendados} label="Agendados" cor={C.text} />
            <Num n={resumo.total.lembretes} label="Lembretes" cor={C.whats} />
            <Num n={resumo.total.faltas} label="Faltas" cor={C.danger} />
            <Num n={resumo.total.recuperados} label="Recuperados" cor={C.lime} />
          </View>
          <View style={[s.tr, { borderBottomColor: C.graphite }]}>
            {['Data', 'Agend.', 'Lembr.', 'Faltas', 'Desm.', 'Recup.'].map((h) => (
              <Text key={h} style={[s.td, s.th]}>
                {h}
              </Text>
            ))}
          </View>
          {resumo.linhas.map((l) => (
            <View key={l.data} style={s.tr}>
              <Text style={[s.td, { color: C.muted }]}>{fmtCurto(l.data)}</Text>
              <Text style={s.td}>{l.agendados}</Text>
              <Text style={s.td}>{l.lembretes}</Text>
              <Text style={[s.td, l.faltas > 0 && { color: C.danger, fontFamily: F.bold }]}>{l.faltas}</Text>
              <Text style={[s.td, l.cancelamentos > 0 && { color: C.warn }]}>{l.cancelamentos}</Text>
              <Text style={[s.td, l.recuperados > 0 && { color: C.lime, fontFamily: F.bold }]}>{l.recuperados}</Text>
            </View>
          ))}
        </>
      )}
    </Sheet>
  );
}

const s = {
  dia: {
    width: 56,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  diaSel: { backgroundColor: C.lime, borderColor: C.lime },
  diaHoje: { borderColor: C.lime },
  diaSem: { fontFamily: F.bold, fontSize: 10.5, color: C.muted, letterSpacing: 0.8 },
  diaNum: { fontFamily: F.display, fontSize: 26, color: C.text, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.lime, marginTop: 2 },
  diaHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, marginBottom: 12 },
  iconBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  aviso: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.lime, borderRadius: 14, padding: 12, marginBottom: 12 },
  avisoTxt: { flex: 1, fontFamily: F.semi, fontSize: 13.5, color: C.onLime },
  agCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 18, overflow: 'hidden' },
  faixa: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  horaBox: { minWidth: 64 },
  hora: { fontFamily: F.display, fontSize: 30, color: C.lime, letterSpacing: 0.5 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  recup: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: C.lime },
  recupOn: { backgroundColor: C.lime },
  recupTxt: { fontFamily: F.bold, color: C.text, fontSize: 14.5 },
  recupSub: { fontFamily: F.medium, color: C.muted, fontSize: 12 },
  historico: { marginTop: 14, padding: 12, borderRadius: 14, backgroundColor: C.surface },
  novoCli: { padding: 12, borderRadius: 14, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  cliSel: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, backgroundColor: C.limeSoft, borderWidth: 1.5, borderColor: C.lime },
  sugestao: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: C.border },
  kpi: { flex: 1, backgroundColor: C.surface, borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  kpiNum: { fontFamily: F.display, fontSize: 32 },
  kpiLbl: { fontFamily: F.semi, fontSize: 10.5, color: C.muted },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 8 },
  td: { flex: 1, textAlign: 'center', fontSize: 13, color: C.text, fontFamily: F.medium },
  th: { fontFamily: F.bold, color: C.muted, fontSize: 11.5 },
};
