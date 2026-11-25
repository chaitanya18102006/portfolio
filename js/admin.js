/* Admin panel: schema-driven editor for the site content + messages inbox + live preview. */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const DEF = window.DEFAULT_CONTENT;

  /* ---------- tiny DOM helper ---------- */
  function h(tag, props, ...kids) {
    const e = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    });
    kids.flat().forEach((c) => { if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c)); });
    return e;
  }

  function toast(msg, type) {
    const t = h('div', { class: 'toast ' + (type || '') }, msg);
    $('#toasts').append(t);
    setTimeout(() => { t.style.transition = 'opacity .4s'; t.style.opacity = 0; setTimeout(() => t.remove(), 400); }, type === 'err' ? 6000 : 2800);
  }

  /* ---------- schema ---------- */
  const LINK_HINT = 'Use #projects, https://… or mailto:you@mail.com';
  const SEC_TITLE = [{ k: 'heading', t: 'text', l: 'Heading' }, { k: 'subtitle', t: 'textarea', l: 'Subtitle', rows: 2 }];
  const SHOW = { k: 'visible', t: 'toggle', l: 'Show this section on the site' };

  const SCHEMA = [
    { id: 'hero', section: 'Main', title: 'Hero / Home', icon: 'star', desc: 'The first screen: name, title, intro, photo and call-to-action buttons.', groups: [{ path: 'hero', fields: [
      { k: 'logoText', t: 'text', l: 'Big name text', hint: 'Your full name. End with symbols like _._ for the animated cursor look' },
      { k: 'tagline', t: 'textarea', l: 'Short introduction' },
      { t: 'row', fields: [{ k: 'title1', t: 'text', l: 'Professional title — line 1' }, { k: 'title2', t: 'text', l: 'Professional title — line 2' }] },
      { k: 'description', t: 'textarea', l: 'Intro paragraph', rows: 4 },
      { k: 'photo', t: 'image', l: 'Profile photo / avatar', hint: 'Transparent PNG or a dark-background portrait works best' },
      { t: 'row', fields: [{ k: 'btn1Text', t: 'text', l: 'Button 1 text (e.g. Hire Me)' }, { k: 'btn1Link', t: 'text', l: 'Button 1 link', hint: LINK_HINT }] },
      { t: 'row', fields: [{ k: 'btn2Text', t: 'text', l: 'Button 2 text (e.g. View Projects)' }, { k: 'btn2Link', t: 'text', l: 'Button 2 link', hint: LINK_HINT }] },
      { k: 'btn3Text', t: 'text', l: 'Download CV button text', hint: 'The file comes from the Resume tab. Leave empty to hide the button.' },
      { k: 'bgShape', t: 'select', l: 'Background animation (ASCII light)', options: [['rise', 'Rise: glows up from the bottom'], ['horizon', 'Horizon: glow over a dark curve'], ['pinch', 'Pinch: band of light'], ['eclipse', 'Eclipse: ring around a dark disc']] }
    ] }] },

    { id: 'stats', title: 'Stats bar', icon: 'zap', desc: 'The red bar with animated counters.', groups: [{ path: 'stats', fields: [
      { k: 'items', t: 'list', noun: 'Stat', titleKey: 'label', blank: { value: 10, suffix: '+', label: 'New stat' }, fields: [
        { t: 'row', fields: [{ k: 'value', t: 'number', l: 'Number' }, { k: 'suffix', t: 'text', l: 'Suffix (+, %, k)' }] },
        { k: 'label', t: 'text', l: 'Label' }
      ] }
    ] }] },

    { id: 'about', title: 'About me', icon: 'user', desc: 'The heading and introduction paragraphs of the About section.', groups: [{ path: 'about', fields: [
      SHOW,
      { t: 'row', fields: [{ k: 'emoji', t: 'text', l: 'Emoji' }, { k: 'heading', t: 'text', l: 'Heading' }] },
      { k: 'paragraphs', t: 'list', item: 'string', noun: 'Paragraph', l: 'Personal introduction', blank: 'New paragraph…' },
    ] }] },

    { id: 'skills', section: 'Portfolio', title: 'Skills', icon: 'cpu', desc: 'Technical skills, languages, frameworks, tools and soft skills. Level 0 = shown as a simple tag instead of a bar.', groups: [{ path: 'skills', fields: [
      SHOW, ...SEC_TITLE,
      { k: 'groups', t: 'list', noun: 'Skill category', titleKey: 'title', blank: { title: 'New category', icon: 'star', items: [{ name: 'Skill', level: 70 }] }, fields: [
        { t: 'row', fields: [{ k: 'title', t: 'text', l: 'Category title' }, { k: 'icon', t: 'icon', l: 'Icon' }] },
        { k: 'items', t: 'list', noun: 'Skill', titleKey: 'name', l: 'Skills in this category', blank: { name: 'New skill', level: 70 }, fields: [
          { t: 'row', fields: [{ k: 'name', t: 'text', l: 'Skill' }, { k: 'level', t: 'number', l: 'Proficiency % (0 = tag only)' }] }
        ] }
      ] }
    ] }] },

    { id: 'projects', title: 'Projects', icon: 'briefcase', desc: 'Project cards. Visitors click a card to open the full details.', groups: [{ path: 'projects', fields: [
      SHOW, ...SEC_TITLE,
      { k: 'items', t: 'list', noun: 'Project', titleKey: 'title', blank: { title: 'New project', tag: 'Web', text: 'Describe the project.', image: '', tech: 'HTML, CSS, JavaScript', role: '', details: '', github: '', demo: '' }, fields: [
        { t: 'row', fields: [{ k: 'title', t: 'text', l: 'Project name' }, { k: 'tag', t: 'text', l: 'Category tag' }] },
        { k: 'text', t: 'textarea', l: 'Short description (shown on the card)' },
        { k: 'image', t: 'image', l: 'Screenshot / preview' },
        { k: 'tech', t: 'text', l: 'Technologies used', hint: 'Comma separated: React, Firebase, Tailwind CSS' },
        { k: 'role', t: 'text', l: 'Your role' },
        { k: 'details', t: 'textarea', l: 'Contributions', rows: 4, hint: 'One point per line' },
        { t: 'row', fields: [{ k: 'github', t: 'text', l: 'GitHub repository link' }, { k: 'demo', t: 'text', l: 'Live demo link' }] }
      ] }
    ] }] },

    { id: 'education', title: 'Education', icon: 'grad', desc: 'Degrees, schools, graduation years, achievements and coursework.', groups: [{ path: 'education', fields: [
      SHOW, ...SEC_TITLE,
      { k: 'items', t: 'list', noun: 'Education', titleKey: 'degree', blank: { degree: 'Degree / qualification', school: 'College / university', period: '20XX – 20XX', score: '', text: '', coursework: '' }, fields: [
        { k: 'degree', t: 'text', l: 'Degree or qualification' },
        { t: 'row', fields: [{ k: 'school', t: 'text', l: 'College / university' }, { k: 'period', t: 'text', l: 'Years / graduation year' }] },
        { k: 'score', t: 'text', l: 'Score (CGPA / %)' },
        { k: 'text', t: 'textarea', l: 'Academic achievements', rows: 2 },
        { k: 'coursework', t: 'text', l: 'Relevant coursework', hint: 'Comma separated' }
      ] }
    ] }] },

    { id: 'experience', title: 'Experience', icon: 'layers', desc: 'Work experience, internships and freelance roles.', groups: [{ path: 'experience', fields: [
      SHOW, ...SEC_TITLE,
      { k: 'items', t: 'list', noun: 'Role', titleKey: 'role', blank: { role: 'Job role', company: 'Company', period: 'Month YYYY – Month YYYY', type: 'Internship', text: '' }, fields: [
        { t: 'row', fields: [{ k: 'role', t: 'text', l: 'Job role' }, { k: 'type', t: 'text', l: 'Type', hint: 'Internship, Freelance, Full-time…' }] },
        { t: 'row', fields: [{ k: 'company', t: 'text', l: 'Company name' }, { k: 'period', t: 'text', l: 'Duration' }] },
        { k: 'text', t: 'textarea', l: 'Responsibilities', rows: 4, hint: 'One point per line' }
      ] }
    ] }] },

    { id: 'certifications', title: 'Certifications', icon: 'award', desc: 'Certificates: name, issuer, date, picture and a link to the PDF / verification page. Add, edit, reorder or delete any entry.', groups: [{ path: 'certifications', fields: [
      SHOW, ...SEC_TITLE,
      { k: 'items', t: 'list', noun: 'Certificate', titleKey: 'name', blank: { name: 'Certificate name', org: 'Issuing organization', date: '', note: '', image: '', link: '' }, fields: [
        { k: 'name', t: 'text', l: 'Certificate name' },
        { t: 'row', fields: [{ k: 'org', t: 'text', l: 'Issuing organization' }, { k: 'date', t: 'text', l: 'Issue date (optional)' }] },
        { k: 'note', t: 'text', l: 'Extra details (optional)', hint: 'e.g. 7 courses · 38 learning hours' },
        { k: 'image', t: 'image', l: 'Certificate picture', hint: 'Upload a JPG/PNG of the certificate. Visitors can click it to enlarge.' },
        { k: 'link', t: 'text', l: 'PDF / verification link', hint: 'A credential URL, a Google Drive link, or a file in this folder such as assets/certificates/my-cert.pdf' }
      ] }
    ] }] },

    { id: 'achievements', title: 'Achievements', icon: 'trophy', desc: 'Awards, hackathons, competition results and milestones.', groups: [{ path: 'achievements', fields: [
      SHOW, ...SEC_TITLE,
      { k: 'items', t: 'list', noun: 'Achievement', titleKey: 'title', blank: { title: 'Achievement', category: 'Award', date: 'YYYY', text: '' }, fields: [
        { k: 'title', t: 'text', l: 'Title' },
        { t: 'row', fields: [{ k: 'category', t: 'text', l: 'Category', hint: 'Award, Hackathon, Competition…' }, { k: 'date', t: 'text', l: 'Date / year' }] },
        { k: 'text', t: 'textarea', l: 'Description' }
      ] }
    ] }] },

    { id: 'resume', title: 'Resume / CV', icon: 'file', desc: 'A simple section with one Download button for your resume PDF.', groups: [{ path: 'resume', fields: [
      SHOW, ...SEC_TITLE,
      { k: 'pdfUrl', t: 'text', l: 'Resume PDF link', hint: 'Direct .pdf URL, a Google Drive share link, or a file in this folder such as assets/resume.pdf' },
      { k: 'updated', t: 'text', l: 'Last updated', hint: 'e.g. November 2026' },
      { k: 'summary', t: 'textarea', l: 'Short summary' },
      { k: 'downloadText', t: 'text', l: 'Button text' }
    ] }] },

    { id: 'technologies', title: 'Known Technologies', icon: 'terminal', desc: 'Languages, frameworks, databases and tools. They scroll as two red tapes: the first left → right, the second right → left, and they react when visitors scroll. Logos are matched by name (JavaScript, React, Docker…); if none matches, a letter badge is shown.', groups: [{ path: 'technologies', fields: [
      SHOW,
      { k: 'speed', t: 'select', l: 'Scroll speed', options: [['slow', 'Slow'], ['normal', 'Normal'], ['fast', 'Fast']] },
      { k: 'groups', t: 'list', noun: 'Group', titleKey: 'title', blank: { title: 'New category', icon: 'code', items: ['Technology'] }, fields: [
        { k: 'title', t: 'text', l: 'Group name', hint: 'Only for organising your list: it is not shown on the site' },
        { k: 'items', t: 'list', item: 'string', single: true, noun: 'Technology', l: 'Technologies in this category', blank: 'New technology' }
      ] }
    ] }] },

    { id: 'testimonials', section: 'Optional', title: 'Testimonials', icon: 'quote', desc: 'Client feedback, team feedback and recommendations. Hidden by default: switch it on when ready.', groups: [{ path: 'testimonials', fields: [
      SHOW, ...SEC_TITLE,
      { k: 'items', t: 'list', noun: 'Testimonial', titleKey: 'name', blank: { name: 'Name', role: 'Role / company', text: '', photo: '' }, fields: [
        { t: 'row', fields: [{ k: 'name', t: 'text', l: 'Name' }, { k: 'role', t: 'text', l: 'Role / company' }] },
        { k: 'text', t: 'textarea', l: 'Feedback' },
        { k: 'photo', t: 'image', l: 'Photo (optional)' }
      ] }
    ] }] },

    { id: 'blog', title: 'Blog / Articles', icon: 'pen', desc: 'Technical articles, tutorials and insights. Hidden by default: switch it on when ready.', groups: [{ path: 'blog', fields: [
      SHOW, ...SEC_TITLE,
      { k: 'items', t: 'list', noun: 'Article', titleKey: 'title', blank: { title: 'Article title', tag: 'Tutorial', date: 'Month YYYY', text: '', image: '', link: '' }, fields: [
        { k: 'title', t: 'text', l: 'Title' },
        { t: 'row', fields: [{ k: 'tag', t: 'text', l: 'Tag' }, { k: 'date', t: 'text', l: 'Date' }] },
        { k: 'text', t: 'textarea', l: 'Summary', rows: 2 },
        { k: 'image', t: 'image', l: 'Cover image' },
        { k: 'link', t: 'text', l: 'Article link' }
      ] }
    ] }] },

    { id: 'contact', section: 'Contact & site', title: 'Contact', icon: 'mail', desc: 'The message form. Your email, phone and location below appear in the footer (email and phone as small icons). Form submissions land in Messages.', groups: [{ path: 'contact', fields: [
      SHOW,
      { k: 'heading', t: 'text', l: 'Heading' }, { k: 'text', t: 'textarea', l: 'Intro text', rows: 2 },
      { t: 'row', fields: [{ k: 'email', t: 'text', l: 'Email address', hint: 'Shown as a mail icon in the footer' }, { k: 'phone', t: 'text', l: 'Phone number (optional)', hint: 'Shown as a call icon in the footer' }] },
      { k: 'location', t: 'text', l: 'Location (optional)', hint: 'Shown under the footer icons' },
      { t: 'row', fields: [{ k: 'namePlaceholder', t: 'text', l: 'Name placeholder' }, { k: 'emailPlaceholder', t: 'text', l: 'Email placeholder' }] },
      { t: 'row', fields: [{ k: 'messagePlaceholder', t: 'text', l: 'Message placeholder' }, { k: 'button', t: 'text', l: 'Button text' }] },
      { k: 'success', t: 'text', l: 'Success message' }
    ] }] },

    { id: 'footer', title: 'Footer & social links', icon: 'link', desc: 'Footer name, copyright and social links (LinkedIn, GitHub, Instagram, X, YouTube…) shown as small icons next to the email and phone icons from the Contact tab. Links left empty are hidden.', groups: [{ path: 'footer', fields: [
      { k: 'logoText', t: 'text', l: 'Footer name' },
      { k: 'copyright', t: 'text', l: 'Copyright', hint: '{year} becomes the current year' },
      { k: 'socials', t: 'list', noun: 'Social link', titleKey: 'icon', blank: { icon: 'link', url: '' }, fields: [
        { k: 'icon', t: 'icon', l: 'Icon', set: 'social' }, { k: 'url', t: 'text', l: 'Profile URL' }
      ] }
    ] }] },

    { id: 'nav', title: 'Navigation', icon: 'globe', desc: 'Menu links (header + footer). Links to hidden sections are removed automatically.', groups: [{ path: 'nav', fields: [
      { k: 'items', t: 'list', noun: 'Link', titleKey: 'label', blank: { label: 'New link', href: '#' }, fields: [
        { t: 'row', fields: [{ k: 'label', t: 'text', l: 'Label' }, { k: 'href', t: 'text', l: 'Link', hint: '#about, #skills, #projects, https://…' }] }
      ] }
    ] }] },

    { id: 'settings', title: 'Settings & SEO', icon: 'palette', desc: 'Site name, SEO, favicon, colours, backup and connection status.', groups: [
      { path: 'meta', title: 'Site info & SEO', fields: [
        { k: 'name', t: 'text', l: 'Your name' }, { k: 'siteTitle', t: 'text', l: 'Browser tab / SEO title' }, { k: 'description', t: 'textarea', l: 'SEO description', rows: 2 },
        { k: 'favicon', t: 'image', l: 'Custom favicon', hint: 'Square PNG, at least 64×64' },
        { k: 'ogImage', t: 'image', l: 'Social sharing image', hint: 'Shown when the link is shared (1200×630 is ideal). Needs an uploaded/hosted URL.' }
      ] },
      { path: 'theme', title: 'Colours', fields: [
        { t: 'row', fields: [{ k: 'accent', t: 'color', l: 'Accent (red)' }, { k: 'accent2', t: 'color', l: 'Secondary (orange)' }] }
      ] }
    ], extra: settingsExtra },

    { id: 'messages', section: 'Inbox', title: 'Messages', icon: 'mail', desc: 'Messages submitted through the contact form.', custom: renderMessages }
  ];

  /* ---------- state ---------- */
  let content = null, dirty = false, tab = 'hero', previewReady = false, previewTimer = null;

  function setDirty(v) {
    dirty = v;
    const s = $('#status');
    s.textContent = v ? 'Unsaved changes' : 'All changes saved';
    s.classList.toggle('dirty', v);
  }
  function changed() {
    setDirty(true);
    clearTimeout(previewTimer);
    previewTimer = setTimeout(postPreview, 200);
  }
  function postPreview() {
    const f = $('#frame');
    if (previewReady && f.contentWindow) f.contentWindow.postMessage({ type: 'kc-preview', content }, '*');
  }
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'kc-preview-ready') { previewReady = true; postPreview(); }
  });
  window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- field builders ---------- */
  function buildFields(fields, obj, onChange) {
    return fields.map((f) => buildField(f, obj, onChange));
  }

  function buildField(f, obj, onChange) {
    if (f.t === 'row') return h('div', { class: 'row2' }, buildFields(f.fields, obj, onChange));
    const lbl = () => h('div', { class: 'lbl' }, f.l || f.k, f.hint ? h('small', {}, f.hint) : null);
    const wrap = (...c) => h('div', { class: 'field' }, ...c);

    switch (f.t) {
      case 'text': case 'number': {
        const i = h('input', { type: f.t === 'number' ? 'number' : 'text', value: obj[f.k] == null ? '' : obj[f.k] });
        i.addEventListener('input', () => { obj[f.k] = f.t === 'number' ? Number(i.value) : i.value; onChange(); });
        return wrap(lbl(), i);
      }
      case 'color': {
        const i = h('input', { type: 'color', value: obj[f.k] || '#ff1414' });
        i.addEventListener('input', () => { obj[f.k] = i.value; onChange(); });
        return wrap(lbl(), i);
      }
      case 'textarea': {
        const t = h('textarea', { rows: f.rows || 3 }); t.value = obj[f.k] || '';
        t.addEventListener('input', () => { obj[f.k] = t.value; onChange(); });
        return wrap(lbl(), t);
      }
      case 'icon': {
        const names = f.set === 'social' ? SOCIAL_ICON_NAMES : ICON_NAMES;
        const pv = h('span', { class: 'pv', html: icon(obj[f.k]) });
        const s = h('select', {}, names.map((n) => h('option', { value: n }, n)));
        s.value = names.includes(obj[f.k]) ? obj[f.k] : names[0];
        s.addEventListener('change', () => { obj[f.k] = s.value; pv.innerHTML = icon(s.value); onChange(); });
        return wrap(lbl(), h('div', { class: 'icon-pick' }, pv, s));
      }
      case 'select': {
        const sel = h('select', {}, f.options.map(([v, t]) => h('option', { value: v }, t)));
        sel.value = obj[f.k] || f.options[0][0];
        sel.addEventListener('change', () => { obj[f.k] = sel.value; onChange(); });
        return wrap(lbl(), sel);
      }
      case 'toggle': {
        const cb = h('input', { type: 'checkbox' }); cb.checked = obj[f.k] !== false;
        cb.addEventListener('change', () => { obj[f.k] = cb.checked; onChange(); });
        return h('label', { class: 'toggle' }, cb, h('span', { class: 'sw' }), h('span', {}, f.l));
      }
      case 'image': return buildImage(f, obj, onChange, lbl);
      case 'list': return buildList(f, obj, onChange);
      default: return h('div');
    }
  }

  function buildImage(f, obj, onChange, lbl) {
    const thumb = h('div', { class: 'thumb' }, 'No image');
    const url = h('input', { type: 'text', placeholder: 'Paste an image URL or upload →', value: /^data:/.test(obj[f.k] || '') ? '' : obj[f.k] || '' });
    const state = h('span', { class: 'up-state' }, /^data:/.test(obj[f.k] || '') ? 'Stored in browser (demo upload)' : '');
    const file = h('input', { type: 'file', accept: 'image/*', hidden: true });
    const paint = () => {
      const v = obj[f.k];
      thumb.style.backgroundImage = v ? 'url("' + String(v).replace(/"/g, '%22') + '")' : '';
      thumb.textContent = v ? '' : 'No image';
    };
    const set = (v) => { obj[f.k] = v; paint(); onChange(); };
    url.addEventListener('input', () => { state.textContent = ''; set(url.value.trim()); });
    file.addEventListener('change', async () => {
      const fl = file.files[0]; if (!fl) return;
      state.textContent = 'Uploading…';
      try {
        const u = await Store.uploadImage(fl);
        url.value = /^data:/.test(u) ? '' : u;
        state.textContent = /^data:/.test(u) ? 'Stored in browser (no imgbb key saved — add it in Settings)' : 'Uploaded ✓';
        set(u);
      } catch (e) { state.textContent = ''; toast(e.message, 'err'); }
      file.value = '';
    });
    paint();
    return h('div', { class: 'field' }, lbl(), h('div', { class: 'img-field' }, thumb,
      h('div', { class: 'img-col' }, url, h('div', { class: 'img-btns' },
        h('button', { class: 'btn sm', type: 'button', onclick: () => file.click() }, '⬆ Upload image'),
        h('button', { class: 'btn sm danger', type: 'button', onclick: () => { url.value = ''; state.textContent = ''; set(''); } }, 'Remove'),
        state, file))));
  }

  function buildList(f, obj, onChange) {
    if (!Array.isArray(obj[f.k])) obj[f.k] = [];
    const arr = obj[f.k];
    const isStr = f.item === 'string';
    const box = h('div', { class: 'list' });
    let openIdx = -1;

    const move = (i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; openIdx = j; draw(); onChange(); };
    const del = (i) => { arr.splice(i, 1); openIdx = -1; draw(); onChange(); };
    const ctl = (i) => h('div', { class: 'ctl' },
      ...[['↑', () => move(i, -1), 'Move up'], ['↓', () => move(i, 1), 'Move down'], ['✕', () => del(i), 'Delete']].map(([t, fn, label]) =>
        h('button', { class: 'icon-btn', type: 'button', title: label, 'aria-label': label, onclick: (e) => { e.preventDefault(); e.stopPropagation(); fn(); } }, t)));

    function draw() {
      box.innerHTML = '';
      arr.forEach((item, i) => {
        if (isStr) {
          const el = f.single ? h('input', { type: 'text', value: item }) : h('textarea', { rows: 4 });
          if (!f.single) el.value = item;
          el.addEventListener('input', () => { arr[i] = el.value; onChange(); });
          box.append(h('div', { class: 'item str' }, el, ctl(i)));
          return;
        }
        const title = h('span', { class: 't' }, item[f.titleKey] || f.noun + ' ' + (i + 1));
        const body = h('div', { class: 'ibody' }, buildFields(f.fields, item, () => { title.textContent = item[f.titleKey] || f.noun + ' ' + (i + 1); onChange(); }));
        const d = h('details', { class: 'item', open: i === openIdx }, h('summary', {}, h('span', { class: 'chev' }, '▸'), title, ctl(i)), body);
        box.append(d);
      });
      box.append(h('button', { class: 'btn sm add-btn', type: 'button', onclick: () => { arr.push(isStr ? f.blank : Store.clone(f.blank)); openIdx = arr.length - 1; draw(); onChange(); } }, '+ Add ' + (f.noun || 'item').toLowerCase()));
    }
    draw();
    return h('div', { class: 'field' }, f.l ? h('div', { class: 'lbl' }, f.l) : null, box);
  }

  /* ---------- tabs ---------- */
  function buildSide() {
    const side = $('#side'); side.innerHTML = '';
    SCHEMA.forEach((t) => {
      if (t.section) side.append(h('h4', {}, t.section));
      side.append(h('button', { type: 'button', 'data-tab': t.id, class: t.id === tab ? 'on' : '', html: icon(t.icon) + '<span>' + t.title + '</span>', onclick: () => { go(t.id); $('#side').classList.remove('open'); } }));
    });
  }

  function go(id) {
    tab = id;
    document.querySelectorAll('#side button').forEach((b) => b.classList.toggle('on', b.dataset.tab === id));
    const t = SCHEMA.find((x) => x.id === id);
    const main = $('#main');
    const fresh = main.cloneNode(false); main.replaceWith(fresh); // restart fade animation
    fresh.append(h('h2', {}, t.title), h('p', { class: 'desc' }, t.desc));
    if (t.custom) { t.custom(fresh); }
    else {
      t.groups.forEach((g) => {
        if (!content[g.path]) content[g.path] = Store.clone(DEF[g.path]);
        fresh.append(h('div', { class: 'group' }, g.title ? h('h3', {}, g.title) : null, buildFields(g.fields, content[g.path], changed)));
      });
      if (t.extra) t.extra(fresh);
    }
    window.scrollTo({ top: 0 });
  }

  /* ---------- settings extras ---------- */
  function settingsExtra(root) {
    const row = (ok, label, hint) => h('div', { class: 'status-row' }, h('span', { class: 'dot ' + (ok ? 'ok' : 'no') }), h('div', {}, h('b', {}, label), ' ', h('span', { class: 'muted small' }, hint)));
    root.append(h('div', { class: 'group' }, h('h3', {}, 'Connection status'),
      row(Store.configured, 'Firebase', Store.configured ? 'connected — content & login are live' : 'not configured — demo mode (browser only)'),
      h('p', { class: 'muted small' }, 'Firebase settings live in ', h('code', {}, 'js/config.js'), ' (they are public by design). See README.md for the full setup.')));

    // imgbb key: kept private in Firestore (admin-only), never in the public site code
    const keyStatus = h('span', { class: 'muted small' }, 'checking…'), keyDot = h('span', { class: 'dot no' });
    const keyIn = h('input', { type: 'password', placeholder: 'Paste your imgbb API key', autocomplete: 'off', spellcheck: 'false' });
    const showKey = (has) => { keyDot.className = 'dot ' + (has ? 'ok' : 'no'); keyStatus.textContent = has ? 'saved privately — images upload to imgbb' : 'no key saved — uploads are stored in the browser'; };
    Store.getImgbbKey().then((k) => showKey(!!k));
    root.append(h('div', { class: 'group' }, h('h3', {}, 'Image hosting (imgbb)'),
      h('div', { class: 'status-row' }, keyDot, h('div', {}, h('b', {}, 'imgbb'), ' ', keyStatus)),
      h('label', { class: 'lbl' }, 'API key', keyIn),
      h('div', { class: 'img-btns' },
        h('button', { class: 'btn primary', type: 'button', onclick: async () => {
          const v = keyIn.value.trim(); if (!v) { toast('Paste the key first', 'err'); return; }
          try { await Store.setImgbbKey(v); keyIn.value = ''; showKey(true); toast('Key saved privately ✓', 'ok'); } catch (e) { toast(e.message, 'err'); }
        } }, 'Save key'),
        h('button', { class: 'btn danger', type: 'button', onclick: async () => {
          if (!confirm('Remove the saved imgbb key?')) return;
          try { await Store.setImgbbKey(''); showKey(false); toast('Key removed', 'ok'); } catch (e) { toast(e.message, 'err'); }
        } }, 'Remove')),
      h('p', { class: 'muted small' }, 'Stored in the admin-only Firestore document ', h('code', {}, 'private/imgbb'), '. Visitors can never read it.')));

    const imp = h('input', { type: 'file', accept: 'application/json', hidden: true });
    imp.addEventListener('change', async () => {
      try {
        const data = JSON.parse(await imp.files[0].text());
        content = Store.merge(DEF, data); changed(); go('settings'); toast('Backup imported — press Save & Publish', 'ok');
      } catch (e) { toast('Invalid backup file', 'err'); }
      imp.value = '';
    });
    root.append(h('div', { class: 'group' }, h('h3', {}, 'Backup & reset'),
      h('div', { class: 'img-btns' },
        h('button', { class: 'btn', type: 'button', onclick: () => {
          const a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' })), download: 'portfolio-backup.json' });
          document.body.append(a); a.click(); a.remove();
        } }, '⬇ Export JSON'),
        h('button', { class: 'btn', type: 'button', onclick: () => imp.click() }, '⬆ Import JSON'),
        h('button', { class: 'btn danger', type: 'button', onclick: () => { if (confirm('Reset ALL content to the original defaults? (You still need to press Save & Publish.)')) { content = Store.clone(DEF); changed(); go('settings'); } } }, 'Reset to defaults'), imp)));
  }

  /* ---------- messages ---------- */
  async function renderMessages(root) {
    const list = h('div', { class: 'list' }, h('div', { class: 'empty' }, 'Loading…'));
    root.append(h('div', { class: 'group' }, h('div', { class: 'img-btns' }, h('button', { class: 'btn sm', type: 'button', onclick: () => { root.querySelector('.group').remove(); renderMessages(root); } }, '↻ Refresh')), list));
    try {
      const msgs = await Store.listMessages();
      list.innerHTML = '';
      if (!msgs.length) { list.append(h('div', { class: 'empty' }, 'No messages yet. They appear here when someone submits the contact form.')); return; }
      msgs.forEach((m) => {
        const row = h('div', { class: 'msg' },
          h('div', { class: 'grow' }, h('b', {}, (m.name ? m.name + ' · ' : '') + m.email), m.message ? h('div', { class: 'body' }, m.message) : null, h('div', { class: 'd' }, new Date(m.createdAt).toLocaleString())),
          h('a', { class: 'btn sm', href: 'mailto:' + encodeURIComponent(m.email).replace('%40', '@') + (m.message ? '?subject=' + encodeURIComponent('Re: your message') : '') }, 'Reply'),
          h('button', { class: 'btn sm danger', type: 'button', onclick: async () => { if (!confirm('Delete this message?')) return; try { await Store.deleteMessage(m.id); row.remove(); } catch (e) { toast(e.message, 'err'); } } }, 'Delete'));
        list.append(row);
      });
    } catch (e) { list.innerHTML = ''; list.append(h('div', { class: 'empty' }, 'Could not load messages: ' + e.message)); }
  }

  /* ---------- save ---------- */
  async function save() {
    const b = $('#saveBtn'); b.disabled = true; b.textContent = 'Saving…';
    try { await Store.save(content); setDirty(false); toast('Published ✓ — your site is updated', 'ok'); }
    catch (e) { toast('Save failed: ' + (e.message || e), 'err'); }
    b.disabled = false; b.textContent = 'Save & Publish';
  }

  /* ---------- boot ---------- */
  async function startApp(user) {
    $('#login').hidden = true; $('#shell').hidden = false;
    $('#who').textContent = user.email;
    $('#demoBanner').hidden = !user.demo;
    $('#logoutBtn').hidden = !!user.demo;
    try { content = Store.merge(DEF, (await Store.load()) || {}); }
    catch (e) { content = Store.clone(DEF); toast('Could not load saved content: ' + e.message, 'err'); }
    buildSide(); go(tab);
    // preview open by default on wide screens
    if (innerWidth >= 1280) $('#body').classList.add('with-preview');
  }

  function showLogin(msg) {
    $('#shell').hidden = true; $('#login').hidden = false;
    $('#loginErr').textContent = msg || '';
  }

  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button'); btn.disabled = true; $('#loginErr').textContent = '';
    try { await Store.login($('#loginEmail').value.trim(), $('#loginPass').value); }
    catch (err) { $('#loginErr').textContent = /invalid|wrong|user-not-found|credential/i.test(err.code + err.message) ? 'Wrong email or password.' : err.message; }
    btn.disabled = false;
  });
  $('#saveBtn').addEventListener('click', save);
  $('#logoutBtn').addEventListener('click', () => Store.logout());
  $('#menuBtn').addEventListener('click', () => $('#side').classList.toggle('open'));
  $('#previewBtn').addEventListener('click', () => $('#body').classList.toggle('with-preview'));
  document.querySelectorAll('.seg button').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.seg button').forEach((x) => x.classList.toggle('on', x === b));
    $('#frame').style.width = b.dataset.w;
  }));
  document.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (!$('#shell').hidden) save(); } });

  let started = false;
  Store.onAuth((user) => {
    if (!user) { started = false; showLogin(); return; }
    if (Store.adminEmail && !user.demo && user.email.toLowerCase() !== Store.adminEmail.toLowerCase()) { Store.logout(); showLogin('This account is not allowed to use the admin panel.'); return; }
    if (!started) { started = true; startApp(user); }
  }).catch((e) => showLogin('Could not reach Firebase: ' + e.message));
})();
