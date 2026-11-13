import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Button, Chip, CheckRow, Empty, Icon, SectionTitle, T } from '../components';
import { uid } from '../date';
import { useStored } from '../storage';
import { C, F } from '../theme';

/* ItemCompra { id, nome, quantidade: string | null, comprado: boolean, criadoEm: ISO } */

const ATALHOS = ['Álcool 70%', 'Lâminas descartáveis', 'Papel toalha', 'Sacos de lixo', 'Caixa de perfurocortantes', 'Golas descartáveis', 'Óleo para máquina'];

export default function ComprasScreen() {
  const [itens, setItens, ok] = useStored('cs8:compras', []);
  const [nome, setNome] = useState('');
  const [qtd, setQtd] = useState('');

  if (!ok) return null;

  const pendentes = itens.filter((i) => !i.comprado);
  const comprados = itens.filter((i) => i.comprado);
  const naLista = (n) => pendentes.some((i) => i.nome.toLowerCase() === n.toLowerCase());

  const adicionar = (n, q) => {
    const limpo = (n || '').trim();
    if (!limpo) return Alert.alert('Falta o item', 'Digite o nome do produto.');
    if (naLista(limpo)) return Alert.alert('Já está na lista', `"${limpo}" já está nos pendentes.`);
    setItens((l) => [...l, { id: uid(), nome: limpo, quantidade: (q || '').trim() || null, comprado: false, criadoEm: new Date().toISOString() }]);
    setNome('');
    setQtd('');
  };

  const alternar = (id) => setItens((l) => l.map((i) => (i.id === id ? { ...i, comprado: !i.comprado } : i)));

  const excluir = (item) =>
    Alert.alert('Excluir item?', item.nome, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => setItens((l) => l.filter((i) => i.id !== item.id)) },
    ]);

  const limparComprados = () =>
    Alert.alert('Limpar comprados?', `${comprados.length} item(ns) sairão da lista.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: () => setItens((l) => l.filter((i) => !i.comprado)) },
    ]);

  const BotaoX = ({ item }) => (
    <Pressable onPress={() => excluir(item)} hitSlop={10}>
      <Icon name="close" size={20} color={C.faint} />
    </Pressable>
  );

  const rotulo = (i) => (i.quantidade ? `${i.nome} · ${i.quantidade}` : i.nome);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <View style={s.addBox}>
        <View style={s.inputs}>
          <Icon name="cart-plus" size={22} color={C.lime} />
          <TextInput value={nome} onChangeText={setNome} placeholder="Novo item (ex.: álcool 70%)" placeholderTextColor={C.faint} selectionColor={C.lime} style={[s.input, { flex: 2 }]} onSubmitEditing={() => adicionar(nome, qtd)} />
          <View style={s.sep} />
          <TextInput value={qtd} onChangeText={setQtd} placeholder="Qtd." placeholderTextColor={C.faint} selectionColor={C.lime} style={[s.input, { flex: 0.8 }]} onSubmitEditing={() => adicionar(nome, qtd)} />
        </View>
        <Button title="Adicionar" icon="plus" onPress={() => adicionar(nome, qtd)} style={{ marginTop: 10 }} />
      </View>

      <T v="label" style={{ marginTop: 16, marginBottom: 8 }}>Atalhos</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {ATALHOS.filter((a) => !naLista(a)).map((a) => (
          <Chip key={a} icon="plus" label={a} onPress={() => adicionar(a, qtd)} />
        ))}
      </View>

      <SectionTitle icon="cart-outline" right={<T v="small">{pendentes.length}</T>}>
        A comprar
      </SectionTitle>
      {pendentes.length === 0 && <Empty icon="cart-check">Nada para comprar. Tudo em dia!</Empty>}
      {pendentes.map((i) => (
        <CheckRow key={i.id} checked={false} label={rotulo(i)} onPress={() => alternar(i.id)} onLongPress={() => excluir(i)} right={<BotaoX item={i} />} />
      ))}

      {comprados.length > 0 && (
        <>
          <SectionTitle icon="cart-check" right={<Button title="Limpar" icon="broom" variant="danger" small onPress={limparComprados} />}>
            Comprados
          </SectionTitle>
          {comprados.map((i) => (
            <CheckRow key={i.id} checked label={rotulo(i)} onPress={() => alternar(i.id)} onLongPress={() => excluir(i)} right={<BotaoX item={i} />} />
          ))}
        </>
      )}
    </ScrollView>
  );
}

const s = {
  addBox: { backgroundColor: C.surface, borderRadius: 18, padding: 12, borderWidth: 1, borderColor: C.border },
  inputs: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.bg, borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: C.border },
  input: { paddingVertical: 12, fontSize: 15.5, color: C.text, fontFamily: F.medium },
  sep: { width: 1, height: 24, backgroundColor: C.border },
};
