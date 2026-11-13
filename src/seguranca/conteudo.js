// Conteúdo fixo (somente leitura).

export const PROMPT_ASSISTENTE = `Você é um assistente de higiene, biossegurança e descarte de resíduos para a Clube Studio 8, uma barbearia de bairro em Itaquaquecetuba (SP).

Responda em português simples, em passos curtos e práticos, que eu consiga seguir durante o dia de trabalho na barbearia.
- Baseie-se nas normas brasileiras: RDC Anvisa nº 222/2018 (resíduos), Lei 12.305/2010 (Política Nacional de Resíduos Sólidos) e orientações da vigilância sanitária.
- Diga quando algo depende de regra da prefeitura e sugira confirmar com a vigilância sanitária ou a coleta do município.
- Não indique marcas e não invente informações. Se não tiver certeza, diga isso.
- No final, resuma a resposta em até 3 linhas para eu salvar no meu app.

Minha dúvida é: `;

export const GUIA_DESCARTE = [
  {
    icone: '🪒',
    residuo: 'Lâminas e navalhas',
    resumo: 'Caixa rígida de perfurocortantes. Nunca no lixo comum.',
    descarte:
      'Descarte a lâmina logo depois do uso, direto na caixa rígida de perfurocortantes (amarela, com o símbolo de risco). ' +
      'Não reencape nem quebre a lâmina com a mão. Encha a caixa só até a linha indicada (cerca de 2/3), feche e lacre. ' +
      'A caixa cheia vai para a coleta de resíduos de serviços de saúde: consulte a prefeitura ou uma empresa coletora. ' +
      'Nunca jogue lâminas no lixo comum nem na reciclagem: elas cortam os coletores e podem transmitir doenças.',
    baseLegal: 'RDC Anvisa nº 222/2018 – resíduos perfurocortantes (Grupo E). Lei 12.305/2010.',
  },
  {
    icone: '💇',
    residuo: 'Cabelo cortado',
    resumo: 'Saco separado. Pode ser reaproveitado (barreiras, adubo).',
    descarte:
      'Varra depois de cada cliente e guarde o cabelo em um saco separado e bem fechado, longe do lixo reciclável. ' +
      'O cabelo pode ser reaproveitado: há projetos que recolhem cabelo para fazer barreiras que absorvem óleo em rios e mares, ' +
      'e ele também pode ir para compostagem (adubo). Pesquise pontos de doação na região. ' +
      'Se não houver destino, descarte no lixo comum, em saco fechado. Cabelo com sangue vai com os resíduos contaminados (ver "Lixo comum").',
    baseLegal: 'Lei 12.305/2010, art. 9º – prioridade: não gerar, reduzir, reutilizar, reciclar e só depois descartar.',
  },
  {
    icone: '♻️',
    residuo: 'Embalagens vazias',
    resumo: 'Esvaziar, enxaguar e separar para a coleta seletiva.',
    descarte:
      'Use o produto até o fim, enxágue rapidamente frascos de shampoo, gel e loção e deixe secar. ' +
      'Separe plástico, papel/papelão e metal para a coleta seletiva ou para catadores e cooperativas. ' +
      'Aerossóis (spray) só vão para a reciclagem totalmente vazios: não fure nem queime. ' +
      'Embalagem com resto de químico forte vai com os restos de químicos.',
    baseLegal: 'Lei 12.305/2010 – coleta seletiva e responsabilidade compartilhada pelo ciclo de vida dos produtos.',
  },
  {
    icone: '🧪',
    residuo: 'Restos de químicos',
    resumo: 'Tintas, descolorantes e alisantes: nunca no ralo em quantidade.',
    descarte:
      'Prepare só a quantidade que vai usar. Não jogue sobras de tinta, descolorante, alisante ou solventes na pia, no ralo ou na terra. ' +
      'Guarde as sobras na embalagem original, bem fechada, e siga o rótulo do fabricante. ' +
      'Pergunte ao fornecedor ou ao fabricante se recolhem as embalagens (logística reversa) ou leve a um ecoponto que aceite produtos químicos. ' +
      'Álcool 70% vencido pode ser usado na limpeza do chão.',
    baseLegal: 'RDC Anvisa nº 222/2018 – resíduos químicos (Grupo B). Lei 12.305/2010 – logística reversa.',
  },
  {
    icone: '🗑️',
    residuo: 'Lixo comum',
    resumo: 'Papel toalha, golas e luvas sem sangue: saco de lixo fechado.',
    descarte:
      'Papel toalha usado, golas descartáveis, luvas e algodão SEM sangue e restos de varrição vão no lixo comum, em saco fechado, para a coleta da prefeitura. ' +
      'Material COM sangue (algodão, gaze ou papel de um corte) deve ir em saco branco leitoso com o símbolo de infectante ' +
      'e seguir para a coleta de resíduos de serviços de saúde. Não misture com o reciclável.',
    baseLegal: 'RDC Anvisa nº 222/2018 – resíduos comuns (Grupo D) e com risco biológico (Grupo A).',
  },
];

/* Processos de segurança com lâminas: { icone, titulo, resumo, passos[], baseLegal } */
export const PROCESSOS_LAMINAS = [
  {
    icone: 'hand-wash-outline',
    titulo: 'Antes do atendimento',
    resumo: 'Mãos limpas, lâmina nova e navalha desinfetada.',
    passos: [
      'Lave as mãos com água e sabão (ou use álcool em gel) antes de cada cliente.',
      'Use uma lâmina nova para cada cliente e abra a embalagem na frente dele.',
      'Desinfete o cabo da navalha com álcool 70% (passe e deixe secar sozinho).',
      'Confira se a caixa de perfurocortantes está ao alcance da bancada.',
    ],
    baseLegal: 'Boas práticas de biossegurança da vigilância sanitária para salões e barbearias.',
  },
  {
    icone: 'razor-double-edge',
    titulo: 'Durante o atendimento',
    resumo: 'Lâmina descartável é de uso único. Atenção a feridas na pele.',
    passos: [
      'Nunca reutilize a lâmina descartável, nem no mesmo dia.',
      'Não barbeie por cima de feridas, espinhas inflamadas ou pele machucada.',
      'Não passe a navalha de mão em mão: apoie na bancada.',
      'Se o cliente tiver alguma lesão na pele, avise e evite a navalha naquela área.',
    ],
    baseLegal: 'RDC Anvisa nº 222/2018 – manejo de perfurocortantes.',
  },
  {
    icone: 'delete-variant',
    titulo: 'Depois do atendimento',
    resumo: 'Lâmina direto na caixa de perfurocortantes. Nunca reencapar.',
    passos: [
      'Retire a lâmina com cuidado e descarte na hora na caixa de perfurocortantes.',
      'Nunca reencape, dobre ou quebre a lâmina com a mão.',
      'Limpe a navalha: tire os resíduos e passe álcool 70% em todas as partes.',
      'Troque a caixa quando chegar à linha de 2/3 e lacre antes de entregar para a coleta.',
    ],
    baseLegal: 'RDC Anvisa nº 222/2018 – resíduos perfurocortantes (Grupo E).',
  },
  {
    icone: 'spray-bottle',
    titulo: 'Desinfetar x esterilizar',
    resumo: 'Álcool 70% desinfeta. Esterilizar é na autoclave.',
    passos: [
      'Desinfetar (álcool 70%): bancada, cadeira, cabos, pentes, máquina e navalha sem lâmina.',
      'Esterilizar (autoclave): tesouras, alicates e qualquer instrumento que possa ter tido contato com sangue.',
      'Sem autoclave, prefira instrumentos descartáveis para o que pode cortar a pele.',
      'Lave antes de desinfetar: sujeira e pelos atrapalham a ação do álcool.',
    ],
    baseLegal: 'Orientações da Anvisa e da vigilância sanitária municipal.',
  },
  {
    icone: 'bandage',
    titulo: 'Se acontecer um corte',
    resumo: 'Cliente: estancar com gaze e luva. Barbeiro: lavar e procurar atendimento.',
    passos: [
      'No cliente: coloque luva, pressione com gaze ou algodão limpo até parar o sangramento.',
      'Não use pedra-ume (alúmen) compartilhada. Prefira produto individual ou descartável.',
      'Gaze, algodão e luva com sangue vão em saco branco leitoso (infectante), separados do lixo comum.',
      'Se o corte for em você com lâmina já usada: lave bem com água e sabão, não esprema e procure uma UBS ou pronto atendimento logo (de preferência em até 2 horas) para avaliar a profilaxia.',
    ],
    baseLegal: 'Ministério da Saúde – atendimento a exposição a material biológico. RDC Anvisa nº 222/2018 (Grupo A).',
  },
];
