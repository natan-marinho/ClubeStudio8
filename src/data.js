import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useStored } from './storage';
import { uid } from './date';

/*
Cliente     { id, nome, telefone (só dígitos), autorizou: boolean, criadoEm }
Agendamento { id, clienteId, nome, telefone (cópia p/ histórico), data 'AAAA-MM-DD', hora 'HH:MM',
              status: 'agendado'|'compareceu'|'faltou'|'cancelou', lembreteEm, vagaOferecidaEm, recuperado }
*/

const Ctx = createContext(null);

export function DataProvider({ children }) {
  const [clientes, setClientes, okC] = useStored('cs8:clientes', []);
  const [agendamentos, setAgendamentos, okA] = useStored('cs8:agendamentos', []);
  const migrado = useRef(false);

  // Versão 1 guardava nome/telefone direto no agendamento: cria os clientes a partir deles.
  useEffect(() => {
    if (!okC || !okA || migrado.current) return;
    migrado.current = true;
    const antigos = agendamentos.filter((a) => !a.clienteId);
    if (!antigos.length) return;
    const novos = [...clientes];
    const porTel = new Map(novos.map((c) => [c.telefone, c]));
    const ids = {};
    for (const a of antigos) {
      let c = porTel.get(a.telefone);
      if (!c) {
        c = { id: uid(), nome: a.nome, telefone: a.telefone, autorizou: !!a.autorizou, criadoEm: new Date().toISOString() };
        novos.push(c);
        porTel.set(c.telefone, c);
      }
      ids[a.id] = c.id;
    }
    setClientes(novos);
    setAgendamentos((l) => l.map((a) => (ids[a.id] ? { ...a, clienteId: ids[a.id] } : a)));
  }, [okC, okA]);

  const valor = {
    pronto: okC && okA,
    clientes: clientes || [],
    setClientes,
    agendamentos: agendamentos || [],
    setAgendamentos,
  };
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export const useData = () => useContext(Ctx);

export const soDigitos = (t) => (t || '').replace(/\D/g, '');

export function fmtTelefone(tel) {
  const d = soDigitos(tel);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return tel;
}

export function numeroWhats(tel) {
  const d = soDigitos(tel);
  return d.length === 10 || d.length === 11 ? '55' + d : d;
}

export const iniciais = (nome) =>
  (nome || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
