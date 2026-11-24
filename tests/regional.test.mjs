import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { Miniflare } from 'miniflare';

test('Regional: anonymous shared inventory, unique IMEIs, atomic history and conflict protection', async () => {
  const modulesRoot = fileURLToPath(new URL('../src/', import.meta.url));
  const mf = new Miniflare({ compatibilityDate: '2026-07-15', modulesRoot,
    modules: await Promise.all(['worker.js','security.js'].map(async name => ({ type: 'ESModule', path: modulesRoot + name, contents: await readFile(modulesRoot + name, 'utf8') }))),
    d1Databases: { DB: 'regional-test' } });
  try {
    const db = await mf.getD1Database('DB');
    const sql = await readFile(new URL('../migrations/0119_regional_inventory.sql', import.meta.url), 'utf8');
    let statement = ''; let trigger = false;
    for (const line of sql.split('\n')) {
      if (!line.trim() || line.trim().startsWith('--')) continue;
      if (line.startsWith('CREATE TRIGGER')) trigger = true;
      statement += line + '\n';
      if (trigger ? line.trim() === 'END;' : line.trim().endsWith(';')) {
        await db.prepare(statement).run(); statement = ''; trigger = false;
      }
    }
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
  } finally { await mf.dispose(); }
});
