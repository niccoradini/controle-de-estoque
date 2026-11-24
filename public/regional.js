const root = document.querySelector('#root');
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const state = { stores: [], groups: [], items: [], summary: [], total: 0, store: '', q: '', status: 'available', page: 1 };
const statusLabels = { available: 'Disponível', incoming: 'A caminho', repair: 'Em reparo', sold: 'Saída registrada' };
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
root.innerHTML = `<main class="regional"><header class="regional-top"><a class="regional-brand" href="/"><img src="/estoque-symbol.svg" alt="">Controle de Estoque</a><a href="/">← Trocar sistema</a></header><section class="regional-heading"><div><span class="eyebrow">APARELHOS · 5 LOJAS</span><h1>Estoque da Regional</h1><p>Consulte, registre entradas e acompanhe as movimentações.</p></div><button class="primary" id="regional-new" disabled>+ Cadastrar aparelho</button></section><div class="regional-stores" aria-label="Filtrar por loja"></div><div class="regional-tools"><label><span class="sr-only">Buscar aparelho</span><input id="regional-search" type="search" placeholder="Buscar por modelo, código ou IMEI" maxlength="100"></label><select id="regional-status" aria-label="Situação"><option value="available">Disponíveis</option><option value="incoming">A caminho</option><option value="repair">Em reparo</option><option value="sold">Saídas</option><option value="all">Todas as situações</option></select><select id="regional-brand" aria-label="Marca"><option value="">Todas as marcas</option><option>Apple</option><option>Samsung</option><option>Motorola</option><option>OPPO</option></select><button id="regional-clear">Todas as lojas</button><button id="regional-refresh">Atualizar</button></div><div class="regional-notice" role="status"></div><div class="regional-results" aria-live="polite">Carregando aparelhos...</div><footer class="regional-pagination"><span id="regional-total"></span></footer><dialog class="regional-dialog"><div id="regional-dialog-body"></div></dialog></main>`;
const dialog = root.querySelector('dialog');
function render() {
  root.querySelector('.regional-stores').innerHTML = state.stores.map(store => `<button data-store="${esc(store.code)}" class="${state.store === store.code ? 'selected' : ''}" aria-pressed="${state.store === store.code}"><b>${esc(store.code)}</b><span>${esc(store.name)}</span><strong>${state.summary.find(s => s.store === store.code)?.total || 0}</strong><small>aparelhos disponíveis</small></button>`).join('');
  root.querySelector('.regional-results').innerHTML = state.groups.length ? state.groups.map(group => `<article class="regional-model-card"><button class="regional-model-open" data-group="${esc(group.key)}" aria-label="Ver unidades de ${esc(group.name)}"><div class="regional-model-photo">${group.imageUrl ? `<img src="${esc(group.imageUrl)}" alt="${esc(group.name)}" loading="lazy" decoding="async" width="160" height="180">` : `<span>${esc(group.brand)}</span>`}</div><div class="regional-model-info"><small>${esc(group.brand)}</small><h2>${esc(group.name)}</h2><strong class="regional-model-total">${group.total}<span> ${group.total === 1 ? 'aparelho' : 'aparelhos'}</span></strong><p>${Object.keys(group.colors).length} ${Object.keys(group.colors).length === 1 ? 'cor' : 'cores'} · ${Object.keys(group.stores).length} ${Object.keys(group.stores).length === 1 ? 'loja' : 'lojas'}</p></div></button><div class="regional-model-stores">${Object.entries(group.stores).map(([store,total]) => `<span><b>${esc(store)}</b> ${total}</span>`).join('')}</div><footer><span>${esc(Object.keys(group.colors).slice(0,3).join(' · '))}${Object.keys(group.colors).length > 3 ? '…' : ''}</span><button data-group="${esc(group.key)}">Ver unidades →</button></footer></article>`).join('') : `<section class="regional-empty"><h2>Nenhum aparelho encontrado</h2><p>${state.q ? 'Tente o nome do aparelho, código ou IMEI.' : 'Não há aparelhos com os filtros selecionados.'}</p></section>`;
  root.querySelector('#regional-total').textContent = `${state.groups.length} modelo(s) · ${state.total} aparelho(s) · Ordem alfabética`;

}
async function load() {
  const current = ++sequence;
  try {
    const data = await api('/groups?' + new URLSearchParams({ store: state.store, q: state.q, status: state.status, brand: state.brand || '' }));
    if (current !== sequence) return;
    Object.assign(state, data); render(); root.querySelector('#regional-new').disabled = false;
  } catch (error) {
    if (current !== sequence) return;
    root.querySelector('.regional-results').innerHTML = `<div class="regional-empty"><h2>Não foi possível carregar</h2><p>${esc(error.message)}</p><button id="regional-retry">Tentar novamente</button></div>`;
  }
}
function showForm(item) {
  dialog.classList.remove('regional-dialog--detail');
  const field = (name, label, extra = '', value = '') => `<label>${label}<input name="${name}" value="${esc(value)}" ${extra} required></label>`;
  const options = (values, selected) => values.map(([value,label]) => `<option value="${esc(value)}" ${value === selected ? 'selected' : ''}>${esc(label)}</option>`).join('');
  root.querySelector('#regional-dialog-body').innerHTML = `<header><h2>${item ? 'Movimentar aparelho' : 'Cadastrar aparelho'}</h2><button type="button" data-close aria-label="Fechar">×</button></header><form id="regional-form"><div class="regional-form-grid"><label>Loja<select name="store" required>${options(state.stores.map(s => [s.code,s.code + ' · ' + s.name]), item?.store || state.store)}</select></label><label>Estado<select name="condition">${options(['Novo','Vitrine','Renova'].map(v => [v,v]), item?.condition)}</select></label>${field('model','Modelo','maxlength="120"',item?.model)}${field('material_code','Código do produto','maxlength="60"',item?.material_code)}${field('imei','IMEI','inputmode="numeric" pattern="[0-9]{15}" minlength="15" maxlength="15"',item?.imei)}${field('actor','Responsável','maxlength="80"',lastActor)}${item ? `<label class="wide">Situação<select name="status">${options([['available','Disponível'],['incoming','A caminho'],['repair','Em reparo'],['sold','Saída / vendido']],item.status)}</select></label>` : ''}<label class="wide">Observações<textarea name="notes" maxlength="1000" rows="2">${esc(item?.notes)}</textarea></label></div><p class="regional-error" role="alert"></p><footer><button type="button" data-close>Cancelar</button><button type="submit" class="primary">Salvar ${item ? 'movimentação' : 'aparelho'}</button></footer></form>`;
  if (!dialog.open) dialog.showModal();
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
  dialog.classList.remove('regional-dialog--detail');
  root.querySelector('#regional-dialog-body').innerHTML = '<header><h2>Histórico do aparelho</h2><button data-close aria-label="Fechar">×</button></header><div class="regional-history">Carregando...</div>';
  if (!dialog.open) dialog.showModal();
  try {
    const data = await api('/devices/' + id + '/history');
    root.querySelector('.regional-history').innerHTML = data.items.map(item => {
      const snapshot = JSON.parse(item.snapshot);
      return `<article><strong>${esc(item.action)}</strong><p>${item.from_store ? esc(item.from_store) + ' → ' : ''}${esc(item.to_store)} · ${esc(item.actor)}</p><p>${esc(snapshot.model)} · ${esc(snapshot.material_code)}<br>IMEI ${esc(snapshot.imei)} · ${esc(snapshot.condition)} · ${esc(statusLabels[snapshot.status] || snapshot.status)}${snapshot.notes ? '<br>' + esc(snapshot.notes) : ''}</p><small>${esc(date(item.created_at))}</small></article>`;
    }).join('') || '<p>Nenhuma movimentação registrada.</p>';
  } catch (error) { root.querySelector('.regional-history').textContent = error.message; }
}
let activeGroup = null;
let detailSequence = 0;
async function showGroup(key, page = 1) {
  const detailRequest = ++detailSequence;
  activeGroup = { key, page };
  const group = state.groups.find(group => group.key === key);
  if (!group) return;
  dialog.classList.add('regional-dialog--detail');
  root.querySelector('#regional-dialog-body').innerHTML = `<header><div><span class="eyebrow">UNIDADES POR LOJA</span><h2>${esc(group.name)}</h2></div><button data-close aria-label="Fechar">×</button></header><div class="regional-units"><p>Carregando unidades...</p></div>`;
  if (!dialog.open) dialog.showModal();
  try {
    const result = await api('/devices?' + new URLSearchParams({ group:key,store:state.store,status:state.status,q:state.q,page }));
    if (detailRequest !== detailSequence || !dialog.open) return;
    state.items = result.items;
    const units = root.querySelector('.regional-units'); if (!units) return;
    units.innerHTML = `<p class="regional-detail-summary">${result.total} aparelho(s). Escolha uma unidade para movimentar ou consultar o histórico.</p><div class="regional-unit-list">${result.items.map(item => `<article><div><span class="regional-badge">${esc(item.store)} · ${esc(storeName(item.store))}</span><h3>${esc(item.color)} <small>· ${esc(item.condition)}</small></h3><p>IMEI <b>${esc(item.imei)}</b><br>Código <b>${esc(item.material_code)}</b></p><small>${esc(statusLabels[item.status])}</small></div><footer><button data-edit="${item.id}">Movimentar / editar</button><button data-history="${item.id}">Histórico</button></footer></article>`).join('')}</div>${result.total > 100 ? `<footer class="regional-unit-pages"><button data-unit-page="${page-1}" ${page <= 1 ? 'disabled' : ''}>← Anterior</button><span>Página ${page}</span><button data-unit-page="${page+1}" ${page*100 >= result.total ? 'disabled' : ''}>Próxima →</button></footer>` : ''}`;
  } catch(error) { const units=root.querySelector('.regional-units'); if(units) units.textContent=error.message; }
}
root.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  if (button.hasAttribute('data-close')) dialog.close();
  if (button.dataset.group) showGroup(button.dataset.group);
  if (button.dataset.unitPage && activeGroup) showGroup(activeGroup.key, Number(button.dataset.unitPage));
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
root.querySelector('#regional-brand').addEventListener('change', event => { state.brand = event.target.value; load(); });
root.querySelector('#regional-status').addEventListener('change', event => { state.status = event.target.value; state.page = 1; load(); });
load();
