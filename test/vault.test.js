const test = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');

function setup(initial = {}) {
  const local = { ...initial };
  const session = {};
  global.crypto = webcrypto;
  global.chrome = {
    runtime: {},
    storage: {
      local: {
        get: (keys, cb) => {
          const list = keys == null ? Object.keys(local) : Array.isArray(keys) ? keys : [keys];
          const out = {};
          list.forEach((k) => { if (k in local) out[k] = JSON.parse(JSON.stringify(local[k])); });
          cb(out);
        },
        set: (o, cb) => { Object.assign(local, JSON.parse(JSON.stringify(o))); cb(); },
        remove: (ks, cb) => { [].concat(ks).forEach((k) => delete local[k]); cb(); }
      },
      session: {
        get: async (k) => (k in session ? { [k]: session[k] } : {}),
        set: async (o) => Object.assign(session, o),
        remove: async (k) => { delete session[k]; }
      }
    }
  };
  delete require.cache[require.resolve('../scripts/vault.js')];
  return { Vault: require('../scripts/vault.js'), local, session };
}

const data = {
  bookmarks: [{ id: '1', title: 'Secret', url: 'https://secret.example/private' }],
  folders: [{ name: 'General' }],
  tags: [],
  isLoggedIn: true
};

test('vault is off by default: reads and writes stay plain', async () => {
  const { Vault, local } = setup(data);
  assert.equal(await Vault.isEnabled(), false);
  assert.deepEqual((await Vault.localGet('bookmarks')).bookmarks, data.bookmarks);
  await Vault.localSet({ tags: [{ name: 'x' }] });
  assert.deepEqual(local.tags, [{ name: 'x' }]);
});

test('enable encrypts at rest, keeps data readable, lock/unlock works, disable restores', async () => {
  const { Vault, local } = setup(data);
  await Vault.enable('correct horse');

  const raw = JSON.stringify(local);
  assert.equal(raw.includes('secret.example'), false);
  assert.equal('bookmarks' in local, false);
  assert.equal(local.isLoggedIn, true);

  assert.deepEqual((await Vault.localGet(['bookmarks', 'isLoggedIn'])).bookmarks, data.bookmarks);
  const backups = (await Vault.localGet('backups')).backups;
  assert.equal(backups.length, 1);
  assert.equal(backups[0].data.bookmarks[0].url, data.bookmarks[0].url);

  await Vault.localSet({ bookmarks: [...data.bookmarks, { id: '2', title: 'B', url: 'https://b.example' }] });
  assert.equal(JSON.stringify(local).includes('b.example'), false);

  await Vault.lock();
  await assert.rejects(() => Vault.localGet('bookmarks'), { name: 'VaultLockedError' });
  await assert.rejects(() => Vault.localSet({ bookmarks: [] }), { name: 'VaultLockedError' });
  assert.equal(await Vault.isLocked(), true);

  assert.equal(await Vault.unlock('wrong'), false);
  assert.equal(await Vault.unlock('correct horse'), true);
  assert.equal((await Vault.localGet('bookmarks')).bookmarks.length, 2);

  await Vault.disable();
  assert.equal(await Vault.isEnabled(), false);
  assert.equal(local.bookmarks.length, 2);
  assert.equal('vaultBlob' in local, false);
});
