/**
 * Conteúdo editorial do Guia do AURIN.
 * Texto original do AURIN — nenhuma citação, personagem ou expressão de obra de terceiros.
 * Mantido separado do JSX para facilitar revisão de copy.
 */

export type Principle = {
  id: string;
  index: number;
  name: string;
  claim: string;
  what: string;
  why: string;
  edge: string;
  result: string;
};

export const PRINCIPLES: Principle[] = [
  {
    id: "pague-se-primeiro",
    index: 1,
    name: "Pague-se primeiro",
    claim: "10% de tudo que entra é seu antes de ser de qualquer outra pessoa.",
    what: "Toda vez que um valor entra, uma fatia de 10% é separada para o seu tesouro antes de qualquer conta, boleto ou desejo.",
    why: "Guardar o que sobra depende de sorte e de força de vontade — e as duas acabam antes do fim do mês. Guardar no início transforma a poupança em uma decisão única, tomada uma vez, em vez de trinta pequenas renúncias diárias.",
    edge: "No AURIN a separação acontece no instante em que você registra a renda. Não é uma meta escrita num canto: é um passo do próprio registro.",
    result: "Uma reserva que cresce em silêncio, sem que você sinta que está se privando de algo.",
  },
  {
    id: "viva-com-o-que-resta",
    index: 2,
    name: "Viva com o que resta",
    claim: "70% para o essencial, 20% para a sua liberdade, 10% para o seu ouro.",
    what: "Em vez de controlar cada centavo, você acompanha três proporções simples ao longo do mês.",
    why: "Orçamentos detalhados falham porque exigem atenção constante. Proporções falham menos porque cabem na cabeça: você sabe de imediato se está dentro ou fora do seu ritmo.",
    edge: "O AURIN mostra o desvio da proporção, não uma lista de culpas. Um café não é um erro — um ritmo desequilibrado por três meses é o que merece atenção.",
    result: "Menos vigilância, mais consciência. Você gasta sem medo porque sabe onde está o limite.",
  },
  {
    id: "faca-o-ouro-trabalhar",
    index: 3,
    name: "Faça o ouro trabalhar",
    claim: "Cada valor guardado deve gerar outro valor, sem exigir mais do seu tempo.",
    what: "O dinheiro parado perde valor. Aplicado, ele passa a render sobre o que já rendeu — os juros compostos.",
    why: "O que multiplica um patrimônio não é o tamanho do aporte, é o tempo. Guardar R$ 50 todo mês durante dez anos costuma superar qualquer depósito grande e isolado feito tarde demais.",
    edge: "O Eco do Ouro mostra o valor futuro no exato momento em que você guarda — a recompensa deixa de ser abstrata e vira algo que você vê agora.",
    result: "A poupança deixa de parecer sacrifício e passa a parecer construção.",
  },
  {
    id: "proteja-o-que-acumulou",
    index: 4,
    name: "Proteja o que acumulou",
    claim: "Reserva de segurança antes de qualquer risco.",
    what: "Uma quantia intocada, equivalente a alguns meses de vida, guardada para imprevistos.",
    why: "Sem reserva, um único imprevisto desfaz anos de disciplina e empurra você de volta para o crédito caro. Com reserva, o imprevisto vira apenas um mês difícil.",
    edge: "O AURIN separa o tesouro de reserva dos seus cofres de sonho, para que um não devore o outro.",
    result: "Sono tranquilo — a base de qualquer decisão financeira boa.",
  },
  {
    id: "resgate-de-paz",
    index: 5,
    name: "Transforme dívida em paz",
    claim: "Quitar dívida cara é o melhor rendimento garantido que existe.",
    what: "Um plano de quitação com ordem definida: pelas taxas mais altas (avalanche) ou pelos menores saldos primeiro (bola de neve).",
    why: "Uma dívida a 12% ao mês é um rendimento negativo garantido. Nenhum investimento comum vence isso. Pagar é, matematicamente, investir.",
    edge: "Aqui a dívida não é vergonha nem punição: é a Rota de Libertação, com marcos visíveis a cada parcela vencida.",
    result: "A cada quitação, dinheiro que era do banco volta a ser seu — para sempre.",
  },
  {
    id: "capacidade-de-ganhar",
    index: 6,
    name: "Aumente sua capacidade de ganhar",
    claim: "Sua habilidade é o ativo de maior retorno que você tem.",
    what: "Renda não é um número fixo. Ela responde ao que você aprende, entrega e cobra.",
    why: "Cortar gastos tem um limite matemático: você não pode gastar menos que zero. Ganhar mais não tem teto. Quem cuida das duas pontas chega bem mais longe.",
    edge: "O AURIN acompanha a evolução da sua renda ao longo dos meses, para que o progresso apareça — e não só o esforço.",
    result: "A proporção continua a mesma, mas cada fatia vale mais.",
  },
  {
    id: "habito-do-intervalo",
    index: 7,
    name: "Decida antes de gastar",
    claim: "Entre a vontade e a compra, cabe uma pausa.",
    what: "Antes de um gasto relevante, você olha o custo real dele: quantos dias do seu tempo ele consome e o que valeria no futuro.",
    why: "Compras por impulso raramente sobrevivem a 24 horas de reflexão. A pausa não proíbe nada — apenas devolve a decisão para você.",
    edge: "O Simulador de Decisões traduz qualquer valor em dias de liberdade e em valor futuro, antes do clique.",
    result: "Você continua comprando o que quer, mas por escolha, não por reflexo.",
  },
];

export const EXPECTATIONS = [
  {
    period: "Nos primeiros 7 dias",
    text: "Você vai enxergar para onde seu dinheiro vai. Sem julgamento, só clareza. É normal a primeira semana ser desconfortável.",
  },
  {
    period: "Em 30 dias",
    text: "Sua primeira proporção fecha. Você descobre seu ritmo real e faz o primeiro ajuste consciente.",
  },
  {
    period: "Em 90 dias",
    text: "O hábito já se sustenta sozinho. O tesouro tem tamanho visível e as primeiras dívidas começam a cair.",
  },
];

export const FIRST_STEPS = [
  "Complete o Ritual de Entrada: seu nome, seu sonho e o quanto já existe hoje.",
  "Registre sua primeira renda — o AURIN separa os 10% para você.",
  "Faça o primeiro depósito no cofre do seu sonho.",
  "Veja o Eco do Ouro: quanto aquele valor vale daqui a alguns anos.",
  "Volte amanhã de manhã. Um minuto por dia é o suficiente.",
];

export const SCREENS = [
  { name: "Templo", purpose: "Sua tela inicial e o ritual matinal.", how: "Abra pela manhã e leia o resumo do seu dia." },
  { name: "Moedas", purpose: "Todas as entradas e escolhas registradas.", how: "Registre assim que gastar — leva cinco segundos." },
  { name: "Meu ritmo", purpose: "A proporção 70/20/10 do mês.", how: "Confira uma vez por semana e ajuste o rumo." },
  { name: "Cartões", purpose: "Faturas, limites e parcelas futuras.", how: "Cadastre cada cartão e veja o que já está comprometido." },
  { name: "Resgate de Paz", purpose: "Suas dívidas e a rota de libertação.", how: "Escolha a estratégia e siga a ordem sugerida." },
  { name: "Simulador", purpose: "O custo real de uma decisão antes dela.", how: "Digite o valor da compra antes de fazê-la." },
  { name: "Multiplicador", purpose: "Projeções do que seu ouro vira com o tempo.", how: "Ajuste aporte e prazo para enxergar o futuro." },
  { name: "Jornada", purpose: "Conquistas, níveis e marcos alcançados.", how: "Visite quando precisar lembrar do quanto já andou." },
  { name: "Minha conta", purpose: "Login, sincronização e plano.", how: "Entre para guardar seus dados em mais de um aparelho." },
  { name: "Meus dados", purpose: "Segurança, lembretes, backup e reinício.", how: "Configure PIN, horário do lembrete e exporte um backup." },
];

export const ROUTINE = [
  { when: "Todo dia — 1 minuto", text: "Registre o que entrou e o que saiu. Leia a mensagem da manhã." },
  { when: "Toda semana — 5 minutos", text: "Olhe sua proporção e a fatura dos cartões. Corrija cedo, não tarde." },
  { when: "Todo mês — 15 minutos", text: "Feche o mês, revise cofres e sonhos, e escolha a próxima dívida a cair." },
];

export const FREE_BENEFITS = [
  "Registro ilimitado de entradas, escolhas e lançamentos fixos",
  "Regra dos 10% aplicada automaticamente em cada renda",
  "Proporção 70/20/10 completa, mês a mês",
  "Cartões de crédito, faturas e compras parceladas",
  "Resgate de Paz: cadastro de dívidas e rota de quitação",
  "Cofres, sonhos e tesouro com progresso visual",
  "Jornada, conquistas e níveis",
  "PIN, auto-bloqueio e frase de recuperação",
  "Backup e restauração manual dos seus dados",
  "Funciona offline e instala como aplicativo no celular",
];

export const PREMIUM_BENEFITS = [
  "Simulador de Decisões completo, com custo em dias de liberdade",
  "Projeções longas de multiplicação do seu ouro",
  "Sincronização na nuvem entre celular e computador",
  "Lembretes personalizados por horário e dia da semana",
  "Símbolos, ícones e temas para personalizar sua jornada",
  "Apoio direto ao desenvolvimento contínuo do AURIN",
];

export const FAQ = [
  {
    q: "Preciso pagar para usar o AURIN?",
    a: "Não. A versão gratuita é completa: registro, regra dos 10%, proporção 70/20/10, cartões, dívidas, cofres e conquistas. O Premium acrescenta ferramentas de projeção e comodidade, mas não desbloqueia o essencial.",
  },
  {
    q: "Meus dados ficam guardados onde?",
    a: "No seu próprio aparelho, por padrão. Nada sai dele a menos que você ative a sincronização em Minha conta ou exporte um backup.",
  },
  {
    q: "Esqueci meu PIN. E agora?",
    a: "Use a frase de recuperação gerada quando você criou o PIN. Guarde-a fora do celular — é a única forma de recuperar o acesso.",
  },
  {
    q: "Troquei de celular. Como levo meus dados?",
    a: "Exporte um backup em Meus dados e importe no aparelho novo. Com Premium, a sincronização faz isso sozinha.",
  },
  {
    q: "Como instalo o AURIN como aplicativo?",
    a: "Abra o site no celular e escolha Adicionar à tela inicial. Ele passa a abrir como app e funciona mesmo sem internet.",
  },
  {
    q: "Quero recomeçar do zero. É possível?",
    a: "Sim. Em Meus dados existe a opção de apagar tudo e reiniciar sua jornada. Faça um backup antes, por segurança.",
  },
];
