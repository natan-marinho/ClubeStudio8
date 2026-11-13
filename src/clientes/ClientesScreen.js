import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Linking, Pressable, Text, View } from 'react-native';
import { Button, Card, CheckRow, Empty, Fab, Field, Icon, Sheet, T } from '../components';
import { fmtTelefone, iniciais, soDigitos, useData } from '../data';
import { uid } from '../date';
import { C, F } from '../theme';

const normalizar = (t) =>
  (t || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export function Avatar({ nome, size = 44 }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.limeSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(196,220,30,0.4)' }}>
      <Text style={{ color: C.lime, fontFamily: F.display, fontSize: size * 0.45, letterSpacing: 0.5 }}>{iniciais(nome)}</Text>
    </View>
  );
}

/** Formulário de cliente reutilizado na Agenda (cadastro rápido). */
export function ClienteForm({ form, setForm }) {
  return (
    <>
      <Field label="Nome" icon="account-outline" value={form.nome} onChangeText={(nome) => setForm({ ...form, nome })} placeholder="Ex.: João Silva" autoCapitalize="words" />
      <Field label="Telefone / WhatsApp com DDD" icon="phone-outline" value={form.telefone} onChangeText={(telefone) => setForm({ ...form, telefone })} placeholder="Ex.: 11 91234-5678" keyboardType="phone-pad" />
      <CheckRow checked={form.autorizou} onPress={() => setForm({ ...form, autorizou: !form.autorizou })} label="Autorizou receber lembretes pelo WhatsApp" sub="LGPD – só envie lembretes se ele autorizou" />
    </>
  );
}

/** Valida e devolve o cliente salvo (ou null). */
export function salvarCliente(form, clientes, setClientes) {
  const nome = form.nome.trim();
  const tel = soDigitos(form.telefone);
  if (!nome) {
    Alert.alert('Falta o nome', 'Digite o nome do cliente.');
    return null;
  }
  if (tel.length < 10) {
    Alert.alert('Telefone inválido', 'Digite o número com DDD. Ex.: 11 91234-5678');
    return null;
  }
  const outro = clientes.find((c) => c.telefone === tel && c.id !== form.id);
  if (outro) {
    Alert.alert('Telefone já cadastrado', `Esse número já é do cliente ${outro.nome}.`);
    return null;
  }
  if (form.id) {
    const atualizado = { ...clientes.find((c) => c.id === form.id), nome, telefone: tel, autorizou: form.autorizou };
    setClientes((l) => l.map((c) => (c.id === form.id ? atualizado : c)));
    return atualizado;
  }
  const novo = { id: uid(), nome, telefone: tel, autorizou: form.autorizou, criadoEm: new Date().toISOString() };
  setClientes((l) => [...l, novo]);
  return novo;
}

export const CLIENTE_VAZIO = { id: null, nome: '', telefone: '', autorizou: true };

export default function ClientesScreen() {
  const { clientes, setClientes, agendamentos } = useData();
  const [busca, setBusca] = useState('');
  const [form, setForm] = useState(null);

  const lista = useMemo(() => {
    const q = normalizar(busca.trim());
    const dig = soDigitos(busca);
    return [...clientes]
      .filter((c) => !q || normalizar(c.nome).includes(q) || (dig && c.telefone.includes(dig)))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [clientes, busca]);

  const stats = (id) => {
    const ag = agendamentos.filter((a) => a.clienteId === id);
    return { visitas: ag.filter((a) => a.status === 'compareceu').length, faltas: ag.filter((a) => a.status === 'faltou').length };
  };

  const salvar = () => {
    if (salvarCliente(form, clientes, setClientes)) setForm(null);
  };

  const excluir = () =>
    Alert.alert('Excluir cliente?', `${form.nome}\nOs agendamentos antigos continuam no histórico.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          setClientes((l) => l.filter((c) => c.id !== form.id));
          setForm(null);
        },
      },
    ]);

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={lista}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            <Field icon="magnify" value={busca} onChangeText={setBusca} placeholder="Buscar por nome ou telefone" />
            <T v="label" style={{ marginBottom: 10 }}>
              {clientes.length} {clientes.length === 1 ? 'cliente' : 'clientes'}
            </T>
          </>
        }
        ListEmptyComponent={
          <Empty icon="account-group-outline">
            {clientes.length ? 'Nenhum cliente encontrado.' : 'Nenhum cliente ainda. Toque em + para cadastrar.'}
          </Empty>
        }
        renderItem={({ item: c }) => {
          const s = stats(c.id);
          return (
            <Card onPress={() => setForm({ ...c })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar nome={c.nome} />
              <View style={{ flex: 1 }}>
                <T v="title">{c.nome}</T>
                <T v="small">{fmtTelefone(c.telefone)}</T>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                  <T v="small" style={{ color: C.ok }}>{s.visitas} visitas</T>
                  {s.faltas > 0 && <T v="small" style={{ color: C.danger }}>{s.faltas} faltas</T>}
                  {!c.autorizou && <T v="small" style={{ color: C.warn }}>sem lembrete</T>}
                </View>
              </View>
              <Pressable hitSlop={8} onPress={() => Linking.openURL(`tel:${c.telefone}`)} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="phone" size={20} color={C.lime} />
              </Pressable>
            </Card>
          );
        }}
      />

      <Fab icon="account-plus" onPress={() => setForm({ ...CLIENTE_VAZIO })} />

      <Sheet
        visible={!!form}
        title={form?.id ? 'Editar cliente' : 'Novo cliente'}
        onClose={() => setForm(null)}
        footer={
          <>
            {form?.id ? <Button title="Excluir" icon="delete-outline" variant="danger" onPress={excluir} style={{ flex: 1 }} /> : null}
            <Button title="Salvar" icon="check" onPress={salvar} style={{ flex: 1.4 }} />
          </>
        }
      >
        {form && <ClienteForm form={form} setForm={setForm} />}
      </Sheet>
    </View>
  );
}
