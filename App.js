import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
} from '@expo-google-fonts/montserrat';
import { Icon } from './src/components';
import { DataProvider } from './src/data';
import AgendaScreen from './src/agenda/AgendaScreen';
import ClientesScreen from './src/clientes/ClientesScreen';
import LimpezaScreen from './src/rotinas/LimpezaScreen';
import ComprasScreen from './src/rotinas/ComprasScreen';
import SegurancaScreen from './src/seguranca/SegurancaScreen';
import { C, F } from './src/theme';

const TELAS = [
  { id: 'agenda', label: 'Agenda', titulo: 'Agenda', icon: 'calendar-clock', Tela: AgendaScreen },
  { id: 'clientes', label: 'Clientes', titulo: 'Clientes', icon: 'account-group', Tela: ClientesScreen },
  { id: 'limpeza', label: 'Limpeza', titulo: 'Limpeza e manutenção', icon: 'spray-bottle', Tela: LimpezaScreen },
  { id: 'compras', label: 'Compras', titulo: 'Lista de compras', icon: 'cart-outline', Tela: ComprasScreen },
  { id: 'seguranca', label: 'Segurança', titulo: 'Segurança', icon: 'shield-check', Tela: SegurancaScreen },
];

export default function App() {
  const [fontes] = useFonts({
    BebasNeue_400Regular,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
  });
  const [tela, setTela] = useState('agenda');
  const atual = TELAS.find((t) => t.id === tela);

  if (!fontes) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.lime} size="large" />
      </View>
    );
  }

  const Tela = atual.Tela;
  return (
    <SafeAreaProvider>
      <DataProvider>
        <StatusBar style="light" />
        <View style={{ flex: 1, backgroundColor: C.bg }}>
          <SafeAreaView edges={['top']} style={st.header}>
            <View style={st.headerRow}>
              <View style={st.logo}>
                <Icon name="content-cut" size={20} color={C.onLime} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.marca}>
                  CLUBE STUDIO <Text style={{ color: C.lime }}>8</Text>
                </Text>
                <Text style={st.titulo}>{atual.titulo}</Text>
              </View>
            </View>
          </SafeAreaView>
          <View style={st.faixa} />

          <View style={{ flex: 1 }}>
            <Tela key={tela} />
          </View>

          <SafeAreaView edges={['bottom']} style={st.menu}>
            {TELAS.map((t) => {
              const on = t.id === tela;
              return (
                <Pressable key={t.id} onPress={() => setTela(t.id)} style={st.menuItem}>
                  <View style={[st.menuIcon, on && st.menuIconOn]}>
                    <Icon name={t.icon} size={22} color={on ? C.onLime : C.muted} />
                  </View>
                  <Text style={[st.menuTxt, on && st.menuTxtOn]} numberOfLines={1}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </SafeAreaView>
        </View>
      </DataProvider>
    </SafeAreaProvider>
  );
}

const st = StyleSheet.create({
  header: { backgroundColor: '#111111' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
  logo: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-8deg' }] },
  marca: { fontFamily: F.display, color: C.text, fontSize: 15, letterSpacing: 3 },
  titulo: { fontFamily: F.display, color: C.text, fontSize: 30, letterSpacing: 1, marginTop: -4 },
  faixa: { height: 4, backgroundColor: C.lime },
  menu: { flexDirection: 'row', backgroundColor: '#111111', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 6, paddingHorizontal: 4 },
  menuItem: { flex: 1, alignItems: 'center', paddingBottom: 6 },
  menuIcon: { width: 48, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  menuIconOn: { backgroundColor: C.lime },
  menuTxt: { fontFamily: F.semi, fontSize: 11, color: C.muted, marginTop: 3 },
  menuTxtOn: { color: C.lime, fontFamily: F.bold },
});
