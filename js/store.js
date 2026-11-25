/* Data layer shared by the site and the admin panel.
   - Firebase configured  → Firestore + Firebase Auth + imgbb uploads
   - Not configured       → DEMO MODE (localStorage, no login, images stored as data URLs)  */
(function () {
  const cfg = window.SITE_CONFIG || {};
  const fbCfg = cfg.firebase || {};
  const configured = !!(fbCfg.apiKey && fbCfg.projectId);

  const LS_CONTENT = 'kc_content_v1';
  const LS_CACHE = 'kc_cache_v1';
  const LS_MSG = 'kc_messages_v1';
  const FB_VER = '10.14.1';

  /* ---------- helpers ---------- */
  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
  function merge(base, over) {
    if (!isObj(base)) return over === undefined ? base : over;
    const out = {};
    for (const k of Object.keys(base)) out[k] = isObj(base[k]) && isObj(over && over[k]) ? merge(base[k], over[k]) : (over && over[k] !== undefined ? clone(over[k]) : clone(base[k]));
    return out;
  }
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const lsGet = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };

  /* ---------- firebase (lazy, via CDN) ---------- */
  let fbPromise = null;
  function fb() {
    if (!configured) return Promise.reject(new Error('Firebase is not configured'));
    if (!fbPromise) {
      const base = 'https://www.gstatic.com/firebasejs/' + FB_VER + '/';
      fbPromise = Promise.all([
        import(base + 'firebase-app.js'),
        import(base + 'firebase-auth.js'),
        import(base + 'firebase-firestore.js')
      ]).then(([app, auth, fs]) => {
        const a = app.initializeApp(fbCfg);
        return { auth, fs, authInst: auth.getAuth(a), db: fs.getFirestore(a) };
      });
    }
    return fbPromise;
  }

  /* ---------- content ---------- */
  function cached() { return lsGet(LS_CACHE); }

  async function load() {
    let raw = null;
    if (configured) {
      const f = await fb();
      const snap = await f.fs.getDoc(f.fs.doc(f.db, 'site', 'content'));
      if (snap.exists()) { try { raw = JSON.parse(snap.data().json); } catch (e) { raw = null; } }
      if (raw) lsSet(LS_CACHE, raw);
    } else {
      raw = lsGet(LS_CONTENT);
    }
    return raw;
  }

  async function save(content) {
    if (configured) {
      const f = await fb();
      await f.fs.setDoc(f.fs.doc(f.db, 'site', 'content'), { json: JSON.stringify(content), updatedAt: f.fs.serverTimestamp() });
      lsSet(LS_CACHE, content);
    } else {
      if (!lsSet(LS_CONTENT, content)) throw new Error('Browser storage is full. Remove large images or add your imgbb key.');
    }
  }

  /* ---------- auth ---------- */
  async function onAuth(cb) {
    if (!configured) { cb({ email: 'demo mode', demo: true }); return; }
    const f = await fb();
    f.auth.onAuthStateChanged(f.authInst, (u) => cb(u ? { email: u.email } : null));
  }
  async function login(email, pass) {
    const f = await fb();
    await f.auth.signInWithEmailAndPassword(f.authInst, email, pass);
  }
  async function logout() {
    if (!configured) return;
    const f = await fb();
    await f.auth.signOut(f.authInst);
  }

  /* ---------- contact messages ---------- */
  async function addMessage(m) {
    const msg = { name: String(m.name || '').slice(0, 120), email: String(m.email || '').slice(0, 200), message: String(m.message || '').slice(0, 3000), source: 'website' };
    if (configured) {
      const f = await fb();
      await f.fs.addDoc(f.fs.collection(f.db, 'messages'), Object.assign({}, msg, { createdAt: f.fs.serverTimestamp() }));
    } else {
      const list = lsGet(LS_MSG) || [];
      list.unshift(Object.assign({ id: 'm' + Date.now(), createdAt: Date.now() }, msg));
      lsSet(LS_MSG, list);
    }
  }
  async function listMessages() {
    if (!configured) return lsGet(LS_MSG) || [];
    const f = await fb();
    const q = f.fs.query(f.fs.collection(f.db, 'messages'), f.fs.orderBy('createdAt', 'desc'));
    const snap = await f.fs.getDocs(q);
    return snap.docs.map((d) => {
      const x = d.data();
      return { id: d.id, name: x.name, email: x.email, message: x.message, source: x.source, createdAt: x.createdAt && x.createdAt.toMillis ? x.createdAt.toMillis() : Date.now() };
    });
  }
  async function deleteMessage(id) {
    if (!configured) { lsSet(LS_MSG, (lsGet(LS_MSG) || []).filter((m) => m.id !== id)); return; }
    const f = await fb();
    await f.fs.deleteDoc(f.fs.doc(f.db, 'messages', id));
  }

  /* ---------- image upload ---------- */
  function fileToDataUrl(file, maxSide, quality) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = () => reject(new Error('Could not read file'));
      fr.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Not a valid image'));
        img.onload = () => {
          const s = Math.min(1, maxSide / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', quality));
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  /* The imgbb key is NOT shipped in the public site code. With Firebase on, it lives in the admin-only
     Firestore doc  private/imgbb  ({ key }), readable only after the admin logs in (see README rules). */
  let imgbbKey = null, imgbbLoaded = false;
  async function getImgbbKey() {
    if (imgbbLoaded) return imgbbKey;
    if (configured) {
      try {
        const f = await fb();
        if (!f.authInst.currentUser) return null;                 // not logged in: never cache a miss
        const snap = await f.fs.getDoc(f.fs.doc(f.db, 'private', 'imgbb'));
        imgbbKey = snap.exists() && snap.data().key ? String(snap.data().key) : null;
      } catch (e) { return null; }
    } else {
      imgbbKey = cfg.imgbbKey || null;                            // demo mode only
    }
    imgbbLoaded = true;
    return imgbbKey;
  }
  async function setImgbbKey(key) {
    key = String(key || '').trim();
    if (!configured) throw new Error('Connect Firebase first: the key is stored privately in Firestore.');
    const f = await fb();
    await f.fs.setDoc(f.fs.doc(f.db, 'private', 'imgbb'), { key: key });
    imgbbKey = key || null; imgbbLoaded = true;
  }

  async function uploadImage(file) {
    if (!file || !/^image\//.test(file.type)) throw new Error('Please choose an image file');
    const key = await getImgbbKey();
    if (key) {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('https://api.imgbb.com/1/upload?key=' + encodeURIComponent(key), { method: 'POST', body: fd });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json || !json.success) throw new Error((json && json.error && json.error.message) || 'imgbb upload failed');
      return json.data.url || json.data.display_url;
    }
    // demo fallback: shrink and keep inside the browser
    return fileToDataUrl(file, 1400, 0.82);
  }

  window.Store = {
    configured, adminEmail: cfg.adminEmail || '',
    merge, clone, cached, load, save, onAuth, login, logout,
    addMessage, listMessages, deleteMessage, uploadImage, getImgbbKey, setImgbbKey
  };
})();
