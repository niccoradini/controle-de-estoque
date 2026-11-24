const root = document.querySelector('#root');
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const state = { stores: [], items: [], summary: [], total: 0, store: '', q: '', status: 'available', page: 1 };
let sequence = 0;
let timer;
let lastActor = '';
try { lastActor = localStorage.getItem('regional-actor') || ''; } catch {}
const date = value => new Date(value).toLocaleString('pt-BR');
const storeName = code => state.stores.find(store => store.code === code)?.name || code;
async function api(path, options = {}) {
  const response = await fetch('/api/regional' + path, { ...options, headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'estoque-web' }, body: options.body ? JSON.stringify(options.body) : undefined });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a operação.');
  return data;
}
document.title = 'Estoque da Regional';
root.innerHTML = `<main class="regional"><header class="regional-top"><a class="regional-brand" href="/"><img src="/estoque-symbol.svg" alt="">Controle de Estoque</a><a href="/">← Trocar sistema</a></header><section class="regional-heading"><div><span class="eyebrow">APARELHOS · 5 LOJAS</span><h1>Estoque da Regional</h1><p>Consulte, registre entradas e acompanhe as movimentações.</p></div><button class="primary" id="regional-new" disabled>+ Cadastrar aparelho</button></section><div class="regional-stores" aria-label="Filtrar por loja"></div><div class="regional-tools"><label><span class="sr-only">Buscar aparelho</span><input id="regional-search" type="search" placeholder="Buscar por modelo, código ou IMEI" maxlength="100"></label><select id="regional-status" aria-label="Situação"><option value="available">Disponíveis</option><option value="sold">Saídas</option><option value="all">Todas as situações</option></select><button id="regional-clear">Todas as lojas</button><button id="regional-refresh">Atualizar</button></div><div class="regional-notice" role="status"></div><div class="regional-results" aria-live="polite">Carregando aparelhos...</div><footer class="regional-pagination"><span id="regional-total"></span><div><button id="regional-prev">← Anterior</button> <button id="regional-next">Próxima →</button></div></footer><dialog class="regional-dialog"><div id="regional-dialog-body"></div></dialog></main>`;
const dialog = root.querySelector('dialog');
function render() {
  root.querySelector('.regional-stores').innerHTML = state.stores.map(store => `<button data-store="${esc(store.code)}" class="${state.store === store.code ? 'selected' : ''}" aria-pressed="${state.store === store.code}"><b>${esc(store.code)}</b><span>${esc(store.name)}</span><strong>${state.summary.find(s => s.store === store.code)?.total || 0}</strong><small>aparelhos disponíveis</small></button>`).join('');
  root.querySelector('.regional-results').innerHTML = state.items.length ? state.items.map(item => `<article class="regional-device"><span class="regional-badge">${esc(item.store)} · ${esc(storeName(item.store))}</span><h2>${esc(item.model)}</h2><div class="device-meta">Código <b>${esc(item.material_code)}</b><br>IMEI <b>${esc(item.imei)}</b><br>${esc(item.condition)} · ${item.status === 'available' ? 'Disponível' : 'Saída registrada'}</div><footer><button data-edit="${item.id}">Movimentar / editar</button><button data-history="${item.id}">Histórico</button></footer></article>`).join('') : `<section class="regional-empty"><h2>${state.q || state.store || state.status !== 'available' ? 'Nenhum aparelho encontrado' : 'Vamos começar o estoque da regional'}</h2><p>${state.q ? 'Confira o modelo, código ou IMEI pesquisado.' : 'Cadastre os aparelhos para acompanhar o estoque de cada loja.'}</p></section>`;
  root.querySelector('#regional-total').textContent = `${state.total} aparelho(s) · Página ${state.page}`;
  root.querySelector('#regional-prev').disabled = state.page <= 1;
  root.querySelector('#regional-next').disabled = state.page * 100 >= state.total;
}
async function load() {
  const current = ++sequence;
  try {
    const data = await api('/devices?' + new URLSearchParams({ store: state.store, q: state.q, status: state.status, page: state.page }));
    if (current !== sequence) return;
    Object.assign(state, data); render(); root.querySelector('#regional-new').disabled = false;
  } catch (error) {
    if (current !== sequence) return;
    root.querySelector('.regional-results').innerHTML = `<div class="regional-empty"><h2>Não foi possível carregar</h2><p>${esc(error.message)}</p><button id="regional-retry">Tentar novamente</button></div>`;
  }
}
function showForm(item) {
  const field = (name, label, extra = '', value = '') => `<label>${label}<input name="${name}" value="${esc(value)}" ${extra} required></label>`;
  const options = (values, selected) => values.map(([value,label]) => `<option value="${esc(value)}" ${value === selected ? 'selected' : ''}>${esc(label)}</option>`).join('');
  root.querySelector('#regional-dialog-body').innerHTML = `<header><h2>${item ? 'Movimentar aparelho' : 'Cadastrar aparelho'}</h2><button type="button" data-close aria-label="Fechar">×</button></header><form id="regional-form"><div class="regional-form-grid"><label>Loja<select name="store" required>${options(state.stores.map(s => [s.code,s.code + ' · ' + s.name]), item?.store || state.store)}</select></label><label>Estado<select name="condition">${options(['Novo','Vitrine','Renova'].map(v => [v,v]), item?.condition)}</select></label>${field('model','Modelo','maxlength="120"',item?.model)}${field('material_code','Código do produto','maxlength="60"',item?.material_code)}${field('imei','IMEI','inputmode="numeric" pattern="[0-9]{15}" minlength="15" maxlength="15"',item?.imei)}${field('actor','Responsável','maxlength="80"',lastActor)}${item ? `<label class="wide">Situação<select name="status">${options([['available','Disponível'],['sold','Saída / vendido']],item.status)}</select></label>` : ''}<label class="wide">Observações<textarea name="notes" maxlength="1000" rows="2">${esc(item?.notes)}</textarea></label></div><p class="regional-error" role="alert"></p><footer><button type="button" data-close>Cancelar</button><button type="submit" class="primary">Salvar ${item ? 'movimentação' : 'aparelho'}</button></footer></form>`;
  dialog.showModal();
  root.querySelector('#regional-form').addEventListener('submit', async event => {
    event.preventDefault(); const form = event.currentTarget;
    const button = form.querySelector('[type="submit"]'); button.disabled = true;
    const data = Object.fromEntries(new FormData(form));
    if (item) data.version = item.version;
    try {
      await api('/devices' + (item ? '/' + item.id : ''), { method: item ? 'PATCH' : 'POST', body: data });
      lastActor = data.actor; try { localStorage.setItem('regional-actor',lastActor); } catch {}
      dialog.close(); root.querySelector('.regional-notice').textContent = 'Salvo. Estoque da regional atualizado.';
      await load();
    } catch (error) { form.querySelector('.regional-error').textContent = error.message; }
    finally { button.disabled = false; }
  });
}
async function showHistory(id) {
  root.querySelector('#regional-dialog-body').innerHTML = '<header><h2>Histórico do aparelho</h2><button data-close aria-label="Fechar">×</button></header><div class="regional-history">Carregando...</div>';
  dialog.showModal();
  try {
    const data = await api('/devices/' + id + '/history');
    root.querySelector('.regional-history').innerHTML = data.items.map(item => {
      const snapshot = JSON.parse(item.snapshot);
      return `<article><strong>${esc(item.action)}</strong><p>${item.from_store ? esc(item.from_store) + ' → ' : ''}${esc(item.to_store)} · ${esc(item.actor)}</p><p>${esc(snapshot.model)} · ${esc(snapshot.material_code)}<br>IMEI ${esc(snapshot.imei)} · ${esc(snapshot.condition)}${snapshot.notes ? '<br>' + esc(snapshot.notes) : ''}</p><small>${esc(date(item.created_at))}</small></article>`;
    }).join('') || '<p>Nenhuma movimentação registrada.</p>';
  } catch (error) { root.querySelector('.regional-history').textContent = error.message; }
}
root.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  if (button.hasAttribute('data-close')) dialog.close();
  if (button.id === 'regional-new') showForm();
  if (button.dataset.edit) showForm(state.items.find(item => item.id === Number(button.dataset.edit)));
  if (button.dataset.history) showHistory(button.dataset.history);
  if (button.dataset.store !== undefined) { state.store = button.dataset.store; state.page = 1; load(); }
  if (button.id === 'regional-clear') { state.store = ''; state.page = 1; load(); }
  if (['regional-refresh','regional-retry'].includes(button.id)) load();
  if (button.id === 'regional-prev') { state.page--; load(); }
  if (button.id === 'regional-next') { state.page++; load(); }
});
root.querySelector('#regional-search').addEventListener('input', event => { clearTimeout(timer); state.q = event.target.value; state.page = 1; timer = setTimeout(load, 250); });
root.querySelector('#regional-status').addEventListener('change', event => { state.status = event.target.value; state.page = 1; load(); });
load();
