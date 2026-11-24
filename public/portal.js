const root = document.querySelector('#root');
if (location.pathname === '/regional' || location.pathname === '/regional/') {
  import('./regional.js?v=6.64.0');
} else if (location.pathname !== '/' || location.hash) {
  import('./app.js?v=6.64.0');
} else {
  document.title = 'Escolha seu sistema • Controle de Estoque';
  root.innerHTML = `<main class="regional portal"><a class="regional-brand" href="/"><img src="/estoque-symbol.svg" alt="">Controle de Estoque</a><section class="portal-intro"><span class="eyebrow">SEU PONTO DE PARTIDA</span><h1>Qual sistema<br>vamos acessar?</h1><p>Escolha o espaço para continuar seu trabalho.</p></section><div class="portal-grid"><a class="portal-card" href="/sistema"><span class="portal-icon" aria-hidden="true">▦</span><small>GESTÃO DA LOJA</small><h2>Sistema da loja</h2><p>Estoque, ofertas, etiquetas e as ferramentas que você já utiliza.</p><footer><span>Acesso com login</span><b aria-hidden="true">↗</b></footer></a><a class="portal-card portal-card--accent" href="/regional"><span class="portal-icon" aria-hidden="true">⌘</span><small>CINCO LOJAS, UMA VISÃO</small><h2>Estoque da Regional</h2><p>Consulte e movimente os aparelhos da regional, com o estoque de cada loja.</p><footer><span>Acesso por link · sem login</span><b aria-hidden="true">↗</b></footer></a></div><p class="portal-foot">210h SJDR av · 209h SJDR centro · 120h Bq Lima · 89MN Bq centro · 283h pátio</p></main>`;
}
