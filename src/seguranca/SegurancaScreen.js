import React, { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Button, Card, Empty, Fab, Field, Icon, Sheet, T } from '../components';
import { fmtBR, isoDate, uid } from '../date';
import { useStored } from '../storage';
import { C, F } from '../theme';
import { GUIA_DESCARTE, PROCESSOS_LAMINAS, PROMPT_ASSISTENTE } from './conteudo';

/* Instrucao (nota da IA) { id, titulo, texto, origem: 'ChatGPT', salvaEm: ISO } */

const ABAS = [
  { id: 'laminas', label: 'Lâminas', icon: 'razor-double-edge' },
  { id: 'descarte', label: 'Descarte', icon: 'recycle' },
  { id: 'notas', label: 'Notas IA', icon: 'robot-outline' },
];

const normalizar = (t) =>
  (t || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export default function SegurancaScreen() {
  const [aba, setAba] = useState('laminas');
  const [notas, setNotas, ok] = useStored('cs8:instrucoes', []);
  const [form, setForm] = useState(null);
  const [aberta, setAberta] = useState(null);

  const novaNota = () => setForm({ id: null, titulo: '', texto: '' });

  const salvar = () => {
    if (!form.titulo.trim()) return Alert.alert('Falta o título', 'Dê um título curto. Ex.: Limpar a máquina entre clientes');
    if (!form.texto.trim()) return Alert.alert('Falta o texto', 'Cole a resposta da IA.');
    const dados = { titulo: form.titulo.trim(), texto: form.texto.trim() };
    if (form.id) {
      setNotas((l) => l.map((i) => (i.id === form.id ? { ...i, ...dados } : i)));
      setAberta((a) => (a && a.id === form.id ? { ...a, ...dados } : a));
    } else {
      setNotas((l) => [...l, { id: uid(), ...dados, origem: 'ChatGPT', salvaEm: new Date().toISOString() }]);
      setAba('notas');
    }
    setForm(null);
  };

  const excluir = (n) =>
    Alert.alert('Excluir nota?', n.titulo, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          setNotas((l) => l.filter((i) => i.id !== n.id));
          setAberta(null);
        },
      },
    ]);

  const colar = async () => {
    const txt = await Clipboard.getStringAsync();
    if (!txt) return Alert.alert('Nada copiado', 'No ChatGPT, segure a resposta e toque em Copiar. Depois volte aqui.');
    setForm((f) => ({ ...f, texto: f.texto ? f.texto + '\n' + txt : txt }));
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={s.segment}>
        {ABAS.map((a) => (
          <Pressable key={a.id} onPress={() => setAba(a.id)} style={[s.segBtn, aba === a.id && s.segOn]}>
            <Icon name={a.icon} size={17} color={aba === a.id ? C.onLime : C.muted} />
            <Text style={[s.segTxt, aba === a.id && { color: C.onLime }]}>{a.label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 110 }} keyboardShouldPersistTaps="handled">
        {aba === 'laminas' && <Processos />}
        {aba === 'descarte' && <Descarte />}
        {aba === 'notas' && ok && <Notas notas={notas} abrir={setAberta} />}
      </ScrollView>

      <Fab icon="robot-outline" onPress={novaNota} />

      {/* Ver nota */}
      <Sheet
        visible={!!aberta && !form}
        title={aberta?.titulo || ''}
        subtitle={aberta ? `${aberta.origem} · salva em ${fmtBR(isoDate(new Date(aberta.salvaEm)))}` : ''}
        onClose={() => setAberta(null)}
        footer={
          aberta && (
            <>
              <Button icon="delete-outline" variant="danger" small onPress={() => excluir(aberta)} style={{ width: 52 }} />
              <Button
                title="Copiar"
                icon="content-copy"
                variant="dark"
                small
                onPress={async () => {
                  await Clipboard.setStringAsync(`${aberta.titulo}\n\n${aberta.texto}`);
                  Alert.alert('Copiado');
                }}
                style={{ flex: 1 }}
              />
              <Button title="Editar" icon="pencil-outline" small onPress={() => setForm({ ...aberta })} style={{ flex: 1 }} />
            </>
          )
        }
      >
        {aberta && (
          <Text selectable style={s.textoNota}>
            {aberta.texto}
          </Text>
        )}
      </Sheet>

      {/* Nova / editar nota */}
      <Sheet
        visible={!!form}
        title={form?.id ? 'Editar nota' : 'Nota da IA'}
        subtitle={form?.id ? '' : 'Salve aqui a resposta útil do ChatGPT'}
        onClose={() => setForm(null)}
        footer={
          <>
            <Button title="Cancelar" variant="dark" onPress={() => setForm(null)} style={{ flex: 1 }} />
            <Button title="Salvar" icon="check" onPress={salvar} style={{ flex: 1.4 }} />
          </>
        }
      >
        {form && (
          <>
            {!form.id && <PromptBox compacto />}
            <Field label="Título" icon="format-title" value={form.titulo} onChangeText={(titulo) => setForm({ ...form, titulo })} placeholder="Ex.: Desinfetar x esterilizar" />
            <Button title="Colar resposta copiada" icon="clipboard-text-outline" variant="outline" small onPress={colar} style={{ marginBottom: 12 }} />
            <Field
              label="Resposta da IA"
              value={form.texto}
              onChangeText={(texto) => setForm({ ...form, texto })}
              placeholder="Cole aqui a resposta do ChatGPT"
              multiline
              textAlignVertical="top"
              style={{ minHeight: 180 }}
            />
          </>
        )}
      </Sheet>
    </View>
  );
}

function PromptBox({ compacto }) {
  const copiar = async () => {
    await Clipboard.setStringAsync(PROMPT_ASSISTENTE);
    Alert.alert('Prompt copiado', 'Abra o ChatGPT, cole, escreva sua dúvida no final e envie.', [
      { text: 'OK' },
      { text: 'Abrir ChatGPT', onPress: () => Linking.openURL('https://chatgpt.com/').catch(() => {}) },
    ]);
  };
  return (
    <View style={[s.prompt, compacto && { marginBottom: 14 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={s.robo}>
          <Icon name="robot-happy-outline" size={24} color={C.onLime} />
        </View>
        <View style={{ flex: 1 }}>
          <T v="title">Assistente de higiene</T>
          <T v="small">Prompt pronto sobre biossegurança e descarte.</T>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <Button title="Copiar prompt" icon="content-copy" small onPress={copiar} style={{ flex: 1 }} />
        <Button title="ChatGPT" icon="open-in-new" variant="outline" small onPress={() => Linking.openURL('https://chatgpt.com/').catch(() => {})} style={{ flex: 0.8 }} />
      </View>
    </View>
  );
}

function Expansivel({ icone, titulo, resumo, children }) {
  const [on, setOn] = useState(false);
  return (
    <Pressable onPress={() => setOn(!on)} style={[s.exp, on && s.expOn]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={[s.expIcon, on && { backgroundColor: C.lime }]}>
          <Icon name={icone} size={24} color={on ? C.onLime : C.lime} />
        </View>
        <View style={{ flex: 1 }}>
          <T v="title">{titulo}</T>
          <T v="small" style={{ marginTop: 2 }}>
            {resumo}
          </T>
        </View>
        <Icon name={on ? 'chevron-up' : 'chevron-down'} size={22} color={C.muted} />
      </View>
      {on && <View style={s.expBody}>{children}</View>}
    </Pressable>
  );
}

function BaseLegal({ texto }) {
  return (
    <View style={s.base}>
      <Icon name="scale-balance" size={15} color={C.lime} />
      <Text style={s.baseTxt}>{texto}</Text>
    </View>
  );
}

function Processos() {
  return (
    <>
      <View style={s.hero}>
        <Icon name="shield-check" size={34} color={C.onLime} />
        <View style={{ flex: 1 }}>
          <Text style={s.heroTit}>Segurança com lâminas</Text>
          <Text style={s.heroSub}>Lâmina nova por cliente · descarte na caixa rígida · álcool 70%</Text>
        </View>
      </View>
      {PROCESSOS_LAMINAS.map((p) => (
        <Expansivel key={p.titulo} icone={p.icone} titulo={p.titulo} resumo={p.resumo}>
          {p.passos.map((passo, i) => (
            <View key={i} style={s.passo}>
              <View style={s.passoNum}>
                <Text style={s.passoNumTxt}>{i + 1}</Text>
              </View>
              <T v="body" style={{ flex: 1, fontSize: 14 }}>
                {passo}
              </T>
            </View>
          ))}
          <BaseLegal texto={p.baseLegal} />
        </Expansivel>
      ))}
    </>
  );
}

const ICONES_DESCARTE = ['razor-double-edge', 'content-cut', 'recycle', 'flask-outline', 'trash-can-outline'];

function Descarte() {
  return (
    <>
      <T v="small" style={{ marginBottom: 10, marginTop: 6 }}>
        Toque em um cartão para ver como descartar e a base legal.
      </T>
      {GUIA_DESCARTE.map((g, i) => (
        <Expansivel key={g.residuo} icone={ICONES_DESCARTE[i] || 'trash-can-outline'} titulo={g.residuo} resumo={g.resumo}>
          <T v="body" style={{ fontSize: 14 }}>
            {g.descarte}
          </T>
          <BaseLegal texto={g.baseLegal} />
        </Expansivel>
      ))}
      <Text style={s.lei}>LEI 12.305/2010 · RDC ANVISA 222/2018</Text>
      <T v="small" style={{ textAlign: 'center', marginTop: 6 }}>
        Regras de coleta mudam de cidade para cidade. Na dúvida, confirme com a prefeitura de Itaquaquecetuba.
      </T>
    </>
  );
}

function Notas({ notas, abrir }) {
  const [busca, setBusca] = useState('');
  const filtradas = useMemo(() => {
    const q = normalizar(busca.trim());
    return [...notas].filter((n) => !q || normalizar(n.titulo + ' ' + n.texto).includes(q)).sort((a, b) => b.salvaEm.localeCompare(a.salvaEm));
  }, [notas, busca]);

  return (
    <>
      <PromptBox />
      {notas.length > 0 && <Field icon="magnify" value={busca} onChangeText={setBusca} placeholder="Buscar nas notas..." />}
      {notas.length === 0 ? (
        <Card style={{ marginTop: 4 }}>
          <T v="title" style={{ color: C.lime, marginBottom: 8 }}>
            Como funciona
          </T>
          {['Toque em "Copiar prompt".', 'Cole no ChatGPT e escreva sua dúvida no final.', 'Copie a resposta e toque no robô verde para salvar.', 'Consulte aqui quando precisar.'].map((p, i) => (
            <View key={i} style={s.passo}>
              <View style={s.passoNum}>
                <Text style={s.passoNumTxt}>{i + 1}</Text>
              </View>
              <T v="body" style={{ flex: 1, fontSize: 14 }}>
                {p}
              </T>
            </View>
          ))}
        </Card>
      ) : filtradas.length === 0 ? (
        <Empty icon="text-search">Nenhuma nota encontrada.</Empty>
      ) : (
        filtradas.map((n) => (
          <Card key={n.id} onPress={() => abrir(n)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="note-text-outline" size={18} color={C.lime} />
              <T v="title" style={{ flex: 1 }} numberOfLines={1}>
                {n.titulo}
              </T>
            </View>
            <T v="small" numberOfLines={2} style={{ marginTop: 6, color: C.muted }}>
              {n.texto}
            </T>
            <T v="small" style={{ marginTop: 6, color: C.faint, fontSize: 11 }}>
              {n.origem} · {fmtBR(isoDate(new Date(n.salvaEm)))}
            </T>
          </Card>
        ))
      )}
    </>
  );
}

const s = {
  segment: { flexDirection: 'row', margin: 16, marginBottom: 10, backgroundColor: C.surface, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: C.border },
  segBtn: { flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 10, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: C.lime },
  segTxt: { fontFamily: F.bold, color: C.muted, fontSize: 13 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.lime, borderRadius: 18, padding: 16, marginTop: 6, marginBottom: 12 },
  heroTit: { fontFamily: F.display, fontSize: 26, color: C.onLime, letterSpacing: 0.8 },
  heroSub: { fontFamily: F.semi, fontSize: 12.5, color: '#2A3300' },
  exp: { backgroundColor: C.surface, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  expOn: { borderColor: C.lime },
  expIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: C.limeSoft, alignItems: 'center', justifyContent: 'center' },
  expBody: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  passo: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  passoNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  passoNumTxt: { fontFamily: F.bold, fontSize: 12, color: C.onLime },
  base: { flexDirection: 'row', gap: 8, marginTop: 6, padding: 10, borderRadius: 10, backgroundColor: C.bg },
  baseTxt: { flex: 1, fontFamily: F.medium, fontSize: 12.5, color: C.muted, lineHeight: 18 },
  lei: { textAlign: 'center', fontFamily: F.display, fontSize: 18, color: C.lime, letterSpacing: 1, marginTop: 10 },
  prompt: { backgroundColor: C.surface, borderRadius: 18, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(196,220,30,0.35)' },
  robo: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' },
  textoNota: { fontFamily: F.regular, fontSize: 15, color: C.text, lineHeight: 23 },
};
