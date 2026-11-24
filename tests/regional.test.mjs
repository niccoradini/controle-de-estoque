import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { Miniflare } from 'miniflare';
import { regionalDeviceInfo } from '../src/regional-catalog.js';

test('Regional: anonymous shared inventory, unique IMEIs, atomic history and conflict protection', async () => {
  const modulesRoot = fileURLToPath(new URL('../src/', import.meta.url));
  const mf = new Miniflare({ compatibilityDate: '2026-07-15', modulesRoot,
    modules: await Promise.all(['worker.js','security.js','regional-catalog.js'].map(async name => ({ type: 'ESModule', path: modulesRoot + name, contents: await readFile(modulesRoot + name, 'utf8') }))),
    d1Databases: { DB: 'regional-test' } });
  try {
    const db = await mf.getD1Database('DB');
    async function migrate(name) {
      const sql = await readFile(new URL('../migrations/' + name, import.meta.url), 'utf8');
      let statement = ''; let trigger = false;
      for (const line of sql.split('\n')) {
        if (!line.trim() || line.trim().startsWith('--')) continue;
        if (line.startsWith('CREATE TRIGGER')) trigger = true;
        statement += line + '\n';
        if (trigger ? line.trim() === 'END;' : line.trim().endsWith(';')) {
          await db.prepare(statement).run(); statement = ''; trigger = false;
        }
      }
    }
    await migrate('0119_regional_inventory.sql');
    await migrate('0120_regional_stock_states.sql');
    const req = async (path, method='GET', body, headers={}) => {
      const response = await mf.dispatchFetch('https://controleestoque.app.br' + path, { method, headers: {'Content-Type':'application/json','X-Requested-With':'estoque-web',...headers}, body: body ? JSON.stringify(body) : undefined });
      return {status:response.status, data:await response.json()};
    };
    const base = {store:'210h',model:'iPhone 16 256 GB',material_code:'22024927',imei:'350000000000001',condition:'Novo',actor:'Equipe Avenida',notes:''};
    let result = await req('/api/regional/devices'); assert.equal(result.status,200); assert.equal(result.data.stores.length,5); assert.equal(result.data.total,0);
    assert.equal((await req('/api/catalog')).status,401);
    assert.equal((await req('/api/regional/devices','POST',base,{'Origin':'https://evil.example'})).status,403);
    assert.equal((await req('/api/regional/devices','POST',{...base,imei:'abc'})).status,400);
    assert.equal((await req('/api/regional/devices','POST',{...base,store:'unknown'})).status,400);
    result = await req('/api/regional/devices','POST',base); assert.equal(result.status,201); const id=result.data.id;
    assert.equal((await req('/api/regional/devices','POST',{...base,store:'209h'})).status,409);
    result=await req('/api/regional/devices?q=22024927'); assert.equal(result.data.total,1); assert.equal(result.data.items[0].imei,base.imei);
    assert.equal((await req('/api/regional/devices?q=%25')).data.total,0);
    assert.equal((await req('/api/regional/devices/'+id,'PATCH',{...base,store:'283h',version:1})).status,200);
    assert.equal((await req('/api/regional/devices/'+id,'PATCH',{...base,store:'120h',version:1})).status,409);
    assert.equal((await req('/api/regional/devices?store=210h')).data.total,0);
    assert.equal((await req('/api/regional/devices?store=283h')).data.total,1);
    assert.equal((await req('/api/regional/devices/'+id,'PATCH',{...base,store:'283h',status:'sold',version:2})).status,200);
    assert.equal((await req('/api/regional/devices')).data.total,0);
    assert.equal((await req('/api/regional/devices?status=sold')).data.total,1);
    result=await req('/api/regional/devices/'+id+'/history'); assert.deepEqual(result.data.items.map(i=>i.action),['Saída','Transferência','Entrada']);
    assert.equal(result.data.items[1].from_store,'210h'); assert.equal(result.data.items[1].to_store,'283h');
    assert.equal((await req('/api/regional/devices/'+id,'PATCH',{...base,status:'available',version:3})).status,200);
    assert.equal((await req('/api/regional/devices')).data.total,1);
    assert.equal((await req('/api/regional/devices/'+id,'DELETE')).status,404);
    assert.equal((await req('/api/regional/devices/'+id,'PATCH',{...base,status:'incoming',version:4})).status,200);
    assert.equal((await req('/api/regional/devices')).data.total,0);
    assert.equal((await req('/api/regional/devices?status=incoming')).data.items[0].status,'incoming');
    assert.equal((await req('/api/regional/devices/'+id,'PATCH',{...base,status:'repair',version:5})).status,200);
    assert.equal((await req('/api/regional/devices?status=repair')).data.total,1);
    assert.equal((await req('/api/regional/devices/'+id,'PATCH',{...base,status:'available',version:6})).status,200);
    assert.equal((await req('/api/regional/devices/'+id+'/history')).data.items[0].action,'Recebimento');
    await db.prepare('DELETE FROM regional_movements WHERE device_id=?').bind(id).run();
    await db.prepare('DELETE FROM regional_devices WHERE id=?').bind(id).run();
    await migrate('0121_regional_phones_2026_11_24.sql');
    const catalog = await req('/api/regional/groups?status=all');
    assert.equal(catalog.status,200);
    assert.equal(catalog.data.total,705);
    assert.equal(catalog.data.groups.length,70);
    assert.equal(catalog.data.groups.reduce((n,g)=>n+g.total,0),705);
    const probe = (await req('/api/regional/devices?status=all')).data.items[0];
    const byImei = await req('/api/regional/groups?status=all&q=' + probe.imei);
    assert.equal(byImei.data.total,1);
    const selectedUnit = await req('/api/regional/devices?status=all&group='+byImei.data.groups[0].key+'&q='+probe.imei);
    assert.equal(selectedUnit.data.total,1);
    assert.equal(selectedUnit.data.items[0].imei,probe.imei);
    assert.equal(new Set(catalog.data.groups.map(g=>g.key)).size,70);
    for (const group of catalog.data.groups) {
      assert.equal(Object.values(group.stores).reduce((n,total)=>n+total,0),group.total);
      assert.equal(Object.values(group.colors).reduce((n,total)=>n+total,0),group.total);
      assert.ok(!/SMARTPHONE|PPB|XT\d|S948B|DGAP|TGMO/.test(group.name));
      assert.match(group.imageUrl,/^\/regional-images\//);
      const photo = await readFile(new URL('../public' + group.imageUrl,import.meta.url));
      assert.ok(photo.length > 1000);
      assert.ok(photo[0] === 137 || photo[0] === 255 || (photo.subarray(0,4).toString() === 'RIFF' && photo.subarray(8,12).toString() === 'WEBP'), 'PNG, JPEG or WebP original product photo');
      const detail = await req('/api/regional/devices?status=all&group='+encodeURIComponent(group.key));
      assert.equal(detail.status,200); assert.equal(detail.data.total,group.total);
      assert.ok(detail.data.items.every(item=>item.key===group.key));
      assert.ok(detail.data.items.every(item=>item.material_code && item.imei && item.model));
    }
    const g47 = await req('/api/regional/groups?status=all&q=moto%20g47');
    const g37 = await req('/api/regional/groups?status=all&q=moto%20g37');
    assert.equal(g47.data.groups.length,1); assert.equal(g37.data.groups.length,1);
    assert.notEqual(g47.data.groups[0].key,g37.data.groups[0].key);
    assert.equal(regionalDeviceInfo({model:'Samsung Galaxy S25 Ultra 256 GB'}).family,'Samsung Galaxy S25 Ultra');
    assert.equal(regionalDeviceInfo({model:'Samsung Galaxy S26+ 256 GB'}).family,'Samsung Galaxy S26+');
    assert.ok(catalog.data.groups.some(g=>g.name==='Samsung Galaxy S26+ 256 GB'));
    assert.ok(catalog.data.groups.some(g=>g.name==='Samsung Galaxy S26 256 GB'));
    assert.ok(catalog.data.groups.some(g=>g.name==='Samsung Galaxy A06 5G 128 GB'));
    const proMax = await req('/api/regional/groups?status=all&q=iphone%2017%20pro%20max');
    assert.ok(proMax.data.groups.length > 1);
    assert.ok(proMax.data.groups.every(g=>g.name.startsWith('iPhone 17 Pro Max ')));
    const samsung = await req('/api/regional/groups?brand=Samsung');
    assert.ok(samsung.data.groups.every(g=>g.brand==='Samsung'));
    const oneStore = await req('/api/regional/groups?store=120h');
    assert.equal(oneStore.data.total,77);
    assert.ok(oneStore.data.groups.every(g=>Object.keys(g.stores).every(s=>s==='120h')));
    assert.equal((await req('/api/regional/groups?store=bad')).status,400);
    assert.equal((await req('/api/regional/groups?status=invalid')).status,400);
    const expected = { '210h':[105,26,0], '209h':[156,27,2], '120h':[77,8,0], '89MN':[168,22,0], '283h':[94,19,1] };
    for (const [store,counts] of Object.entries(expected)) {
      for (const [offset,status] of ['available','incoming','repair'].entries()) {
        const listed = await req('/api/regional/devices?store='+store+'&status='+status);
        assert.equal(listed.status,200);
        assert.equal(listed.data.total,counts[offset],store+' '+status);
        assert.ok(listed.data.items.every(item=>item.store===store && item.status===status));
      }
    }
    assert.equal((await req('/api/regional/devices?status=all')).data.total,705);
    assert.equal((await req('/api/regional/devices')).data.total,600);
    const all = (await db.prepare('SELECT * FROM regional_devices').all()).results;
    assert.equal(new Set(all.map(i=>i.imei)).size,705);
    assert.ok(all.every(i=>/^\d{15}$/.test(i.imei)));
    assert.ok(all.every(i=>/^(APPLE IPHONE |MOTOROLA XT\S+ SMARTPHONE |OPPO SMART(?:PHONE)? |SSG GALAXY [ASF]\d)/.test(i.model)));
    assert.ok(all.every(i=>!/CAPA|\bCP\b|CHIP|SIM CARD|CARREG|CABO|WATCH|\bTAB\b|IPAD|SMARTTAG|FONE/.test(i.model)));
    assert.ok(all.filter(i=>i.stock_state==='repair').every(i=>i.notes.includes('RPAR')));
    assert.ok(all.filter(i=>i.stock_state==='incoming').every(i=>i.notes.includes('NREM')));
    const imported = all.find(i=>i.stock_state==='incoming');
    assert.equal((await req('/api/regional/devices/'+imported.id+'/history')).data.items[0].action,'A caminho');
    await migrate('0121_regional_phones_2026_11_24.sql');
    assert.equal((await req('/api/regional/devices?status=all')).data.total,705);
    assert.equal((await req('/api/regional/devices')).data.summary.reduce((n,s)=>n+s.total,0),600);
  } finally { await mf.dispose(); }
});
