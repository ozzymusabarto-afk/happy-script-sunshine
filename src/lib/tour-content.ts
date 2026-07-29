/**
 * Conteúdo do tutorial guiado do AURIN — slides em sequência lógica.
 * Só ensina: nenhum slide grava dados do usuário.
 */
export interface TourSlide {
  id: string;
  kicker: string;
  title: string;
  /** Para que serve — o porquê daquele passo. */
  why: string;
  /** O que fazer agora, em passos bem curtos. */
  todo: string[];
  /** Frase de fechamento, no tom do mentor. */
  note?: string;
  /** Tela relacionada (rota do app). */
  action?: { label: string; to: string };
}

export const TOUR_SLIDES: TourSlide[] = [
  {
    id: "comece-aqui",
    kicker: "Passo 1 de 8",
    title: "Comece aqui",
    why: "O AURIN não é uma planilha: é um caminho. Ele organiza o que entra, o que sai e o quanto do seu futuro você já construiu — sem julgamento e sem termos difíceis.",
    todo: [
      "Reserve 5 minutos agora para o primeiro ajuste.",
      "Depois disso, bastam 2 minutos por dia.",
      "Nada aqui precisa estar perfeito no começo.",
    ],
    note: "Nos primeiros 7 dias o objetivo é só um: enxergar a verdade com calma.",
  },
  {
    id: "sonho",
    kicker: "Passo 2 de 8",
    title: "Dê nome ao seu sonho",
    why: "Guardar dinheiro sem destino cansa. Com um destino claro, cada valor guardado vira progresso visível — e isso muda a vontade de continuar.",
    todo: [
      "Escolha um sonho concreto: reserva, casa, viagem, liberdade.",
      "Defina quanto ele custa e em quantos anos você quer chegar.",
      "Se não souber o valor exato, chute por cima — dá para ajustar depois.",
    ],
    note: "O sonho aparece no Templo e cresce junto com você.",
    action: { label: "Ajustar meu sonho", to: "/ajustes" },
  },
  {
    id: "renda",
    kicker: "Passo 3 de 8",
    title: "Informe sua renda",
    why: "Com a renda mensal o AURIN calcula sozinho o seu ritmo 70/20/10 e o seu Tempo de Paz — quantos meses você conseguiria viver se a renda parasse hoje.",
    todo: [
      "Some tudo o que entra por mês, mesmo que varie.",
      "Se a renda oscila, use a média dos últimos três meses.",
      "Marque também o que você já tem guardado, se tiver.",
    ],
    note: "Aproximado já serve. O importante é ter um ponto de partida.",
    action: { label: "Preencher minha renda", to: "/ajustes" },
  },
  {
    id: "primeira-transacao",
    kicker: "Passo 4 de 8",
    title: "Registre sua primeira transação",
    why: "É o gesto que dá vida ao app. Cada lançamento alimenta o painel, o orçamento e a sua jornada — sem isso, tudo fica em branco.",
    todo: [
      "Toque em Nova Transação, no topo da tela.",
      "Escolha entrada ou saída, o valor e a categoria.",
      "Comece pelo que aconteceu hoje ou ontem.",
    ],
    note: "O que se repete todo mês pode virar lançamento fixo — o AURIN registra sozinho.",
    action: { label: "Ver minhas Moedas", to: "/transacoes" },
  },
  {
    id: "dez-por-cento",
    kicker: "Passo 5 de 8",
    title: "Guarde os primeiros 10%",
    why: "Pagar a si mesmo primeiro é o princípio central. Antes das contas, uma parte fica com você — é ela que vira Tesouro, e depois liberdade.",
    todo: [
      "Ao registrar uma entrada, deixe a opção de separar 10% ativa.",
      "Veja o Tesouro subir na hora, com o Eco do Ouro.",
      "Se 10% pesar agora, comece com 3% e vá subindo.",
    ],
    note: "O valor pequeno de hoje é o que constrói o valor grande de amanhã.",
  },
  {
    id: "ritmo",
    kicker: "Passo 6 de 8",
    title: "Entenda seu ritmo 70/20/10",
    why: "Três potes simples: 70% para a vida, 20% para prioridades e compromissos, 10% para o seu futuro. É um guia, não uma prova.",
    todo: [
      "Abra Meu ritmo e veja como o mês está distribuído.",
      "Não se assuste com um pote estourado — é informação, não culpa.",
      "Ajuste as porcentagens se a sua vida pede outra divisão.",
    ],
    note: "Um mês fora do ritmo não apaga a jornada. Só mostra o próximo ajuste.",
    action: { label: "Abrir Meu ritmo", to: "/orcamento" },
  },
  {
    id: "cartoes-paz",
    kicker: "Passo 7 de 8",
    title: "Cartões e Resgate de Paz",
    why: "Parcelas e dívidas assustam quando estão soltas na cabeça. Escritas e organizadas, elas viram uma sequência de passos com data para acabar.",
    todo: [
      "Cadastre seus cartões e as compras parceladas.",
      "Registre o que você deve em Resgate de Paz.",
      "Escolha a estratégia que te dá mais fôlego e siga por ela.",
    ],
    note: "Aqui não existe cobrança: existe caminho de saída.",
    action: { label: "Ver Resgate de Paz", to: "/libertacao" },
  },
  {
    id: "rotina",
    kicker: "Passo 8 de 8",
    title: "Sua rotina daqui em diante",
    why: "A constância vale mais do que a intensidade. Uma rotina curta mantém o app vivo e a sua clareza também.",
    todo: [
      "Todo dia: registre o que entrou e o que saiu (2 minutos).",
      "Toda semana: olhe Meu ritmo e ajuste o que precisa.",
      "Todo mês: guarde os 10%, revise o sonho e exporte um backup.",
    ],
    note: "Quer se aprofundar? O Guia do AURIN explica cada princípio por inteiro.",
    action: { label: "Abrir o Guia do AURIN", to: "/manual" },
  },
];
