/* Renders the portfolio from content (defaults → cache → Firestore/localStorage) and wires up all interactions. */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const app = $('#app');
  const isPreview = /[?&]preview=1/.test(location.search);
  if (isPreview) document.body.classList.add('preview');

  /* ---------- helpers ---------- */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const link = (u) => {
    u = String(u || '').trim();
    if (!u) return '#';
    if (/^(https?:|mailto:|tel:|#|\/|\.\/|\.\.\/|assets\/)/i.test(u)) return u;
    if (/^[\w-]+(\.[\w-]+)+/.test(u)) return 'https://' + u;
    return '#';
  };
  const hasLink = (u) => link(u) !== '#';
  const imgSrc = (u) => { u = String(u || '').trim(); return /^(https?:|data:image\/|\/|\.\/|\.\.\/|assets\/)/i.test(u) ? u : ''; };
  const external = (u) => /^https?:/i.test(u);
  const attrs = (u) => (external(u) ? ' target="_blank" rel="noopener noreferrer"' : '');
  const lines = (s) => String(s || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  const csv = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);
  const SOCIAL_NAMES = { linkedin: 'LinkedIn', github: 'GitHub', instagram: 'Instagram', twitter: 'X / Twitter', youtube: 'YouTube', dribbble: 'Dribbble', behance: 'Behance', mail: 'Email', globe: 'Website', link: 'Link' };
  const initials = (n) => String(n || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const listHTML = (txt) => { const l = lines(txt); return l.length > 1 ? '<ul>' + l.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : l.length ? '<p>' + esc(l[0]) + '</p>' : ''; };

  // Google Drive share links → direct download / embeddable preview
  function pdfLinks(u) {
    u = String(u || '').trim();
    if (!hasLink(u)) return null;
    const m = u.match(/drive\.google\.com\/file\/d\/([^/?#]+)/) || u.match(/drive\.google\.com\/open\?id=([^&#]+)/);
    if (m) return { dl: 'https://drive.google.com/uc?export=download&id=' + m[1], view: 'https://drive.google.com/file/d/' + m[1] + '/preview' };
    return { dl: link(u), view: link(u) };
  }

  // attributes for a "download my resume" link: files on this site download directly with a clean filename
  function dlAttrs(c, cv) {
    const slug = String(c.meta.name || 'resume').trim().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'resume';
    return external(cv.dl)
      ? ' href="' + esc(cv.dl) + '" target="_blank" rel="noopener noreferrer" download'
      : ' href="' + esc(cv.dl) + '" download="' + esc(slug) + '-Resume.pdf"';
  }

  function logoHTML(text) {
    const chars = Array.from(String(text || ''));
    const n = Math.max(1, chars.length - 1);
    let out = '', word = '';
    chars.forEach((c, i) => {
      if (c === ' ') { out += '<span class="word">' + word + '</span> '; word = ''; return; }
      const sym = c === '_' || (c === '.' && /[_.]/.test((chars[i - 1] || '') + (chars[i + 1] || '')));
      const col = sym ? 'var(--red)' : 'color-mix(in srgb, var(--red) ' + Math.round(100 * Math.pow(i / n, 1.15)) + '%, var(--logo-from))';
      word += '<span class="ch' + (sym ? ' sym' : '') + '" style="--i:' + i + ';color:' + col + '">' + esc(c) + '</span>';
    });
    return out + '<span class="word">' + word + '</span>';
  }

  /* ---------- section visibility ---------- */
  const ID_KEY = { about: 'about', skills: 'skills', projects: 'projects', education: 'education', experience: 'experience', certifications: 'certifications', achievements: 'achievements', resume: 'resume', technologies: 'technologies', testimonials: 'testimonials', blog: 'blog', contact: 'contact' };
  const on = (c, k) => { const s = c[k]; if (!s || s.visible === false) return false; if (Array.isArray(s.items) && !s.items.length) return false; if (Array.isArray(s.groups) && !s.groups.length) return false; return true; };

  /* ---------- templates ---------- */
  const head = (title, sub, cls) => '<h2 class="sec-title reveal ' + (cls || '') + '">' + esc(title) + '</h2>' + (sub ? '<p class="sec-sub reveal">' + esc(sub) + '</p>' : '');
  const sec = (id, inner, cls) => '<section class="section ' + (cls || '') + '" id="' + id + '" aria-label="' + esc(id) + '"><div class="wrap">' + inner + '</div></section>';

  function navItems(c) {
    return c.nav.items.filter((n) => { const m = /^#(.+)$/.exec(String(n.href || '').trim()); return !m || !ID_KEY[m[1]] || on(c, ID_KEY[m[1]]); });
  }

  function navHTML(c) {
    const items = navItems(c);
    return '<header class="nav" id="nav"><div class="nav-inner">' +
      '<nav aria-label="Main"><ul class="nav-links" id="navLinks">' + items.map((n) => '<li><a href="' + esc(link(n.href)) + '">' + esc(n.label) + '</a></li>').join('') + '</ul></nav>' +
      '<span class="nav-name"><b>' + esc(c.meta.name) + '</b></span>' +
      '<button class="burger" id="burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="navLinks"><span></span><span></span><span></span></button>' +
      '</div></header>';
  }

  function heroHTML(c) {
    const h = c.hero;
    const photo = imgSrc(h.photo) || 'assets/avatar-placeholder.svg';
    const cv = pdfLinks(c.resume.pdfUrl);
    const showCv = h.btn3Text && (cv || on(c, 'resume'));
    const cvAttrs = cv ? dlAttrs(c, cv) : ' href="#resume"';
    return '<section class="hero" id="home" aria-label="Home">' +
      '<div class="hero-bg"></div>' +
      '<div class="hero-inner"><div class="hero-copy">' +
      '<h1 class="logo-text" aria-label="' + esc(String(h.logoText).replace(/[_.]+$/, '')) + '">' + logoHTML(h.logoText) + '</h1>' +
      '<p class="hero-tag" data-enter style="--e:4">' + esc(h.tagline) + '</p>' +
      '<h2 class="hero-title"><span class="line"><span>' + esc(h.title1) + '</span></span><span class="line"><span>' + esc(h.title2) + '</span></span></h2>' +
      '<p class="hero-desc" data-enter style="--e:7">' + esc(h.description) + '</p>' +
      '<div class="hero-actions" data-enter style="--e:9">' +
      (h.btn1Text ? '<a class="btn pulse" data-magnetic href="' + esc(link(h.btn1Link)) + '"' + attrs(link(h.btn1Link)) + '>' + esc(h.btn1Text) + icon('arrow') + '</a>' : '') +
      (h.btn2Text ? '<a class="btn btn-ghost" data-magnetic href="' + esc(link(h.btn2Link)) + '"' + attrs(link(h.btn2Link)) + '>' + esc(h.btn2Text) + icon('arrow') + '</a>' : '') +
      (showCv ? '<a class="link-btn dl"' + cvAttrs + '>' + esc(h.btn3Text) + icon('download') + '</a>' : '') +
      '</div></div></div>' +
      '<div class="hero-photo"><div class="hero-photo-inner"><img src="' + esc(photo) + '" alt="Portrait of ' + esc(c.meta.name) + '" fetchpriority="high" decoding="async"></div></div>' +
      '<div class="stats">' + c.stats.items.map((s) =>
        '<div class="stat"><span class="num"><span class="count" data-to="' + esc(Number(s.value) || 0) + '">0</span>' + esc(s.suffix) + '</span><span class="lbl">' + esc(s.label) + '</span></div>').join('') + '</div>' +
      '</section>';
  }

  function aboutHTML(c) {
    const a = c.about;
    if (a.visible === false) return '';
    return '<section class="section about" id="about" aria-label="About"><div class="wrap">' +
      '<h2 class="sec-title reveal">' + esc(a.heading) + '</h2>' +
      a.paragraphs.filter(Boolean).map((p) => '<p class="about-p reveal">' + esc(p) + '</p>').join('') + '</div></section>';
  }

  function skillsHTML(c) {
    if (!on(c, 'skills')) return '';
    return sec('skills', head(c.skills.heading, c.skills.subtitle) + '<div class="skills-grid stagger">' + c.skills.groups.map((g) => {
      const its = (g.items || []).filter((i) => i && i.name);
      const bars = its.filter((i) => Number(i.level) > 0).map((i) => {
        const lv = Math.max(1, Math.min(100, Number(i.level)));
        return '<div class="bar-row"><div class="bar-top"><span>' + esc(i.name) + '</span><span>' + lv + '%</span></div><div class="bar" role="progressbar" aria-label="' + esc(i.name) + '" aria-valuenow="' + lv + '" aria-valuemin="0" aria-valuemax="100"><i style="--lv:' + lv + '%"></i></div></div>';
      }).join('');
      const chips = its.filter((i) => !(Number(i.level) > 0)).map((i) => '<span class="chip">' + esc(i.name) + '</span>').join('');
      return '<div class="card reveal" data-tilt><div class="skill-head"><span class="card-ico">' + icon(g.icon) + '</span><h3>' + esc(g.title) + '</h3></div><div class="skill-body">' + bars + (chips ? '<div class="chips">' + chips + '</div>' : '') + '</div></div>';
    }).join('') + '</div>', 'alt');
  }

  function projectsHTML(c) {
    if (!on(c, 'projects')) return '';
    return sec('projects', head(c.projects.heading, c.projects.subtitle) + '<div class="work-grid stagger">' + c.projects.items.map((p, i) => {
      const im = imgSrc(p.image), tech = csv(p.tech);
      return '<article class="project reveal" data-i="' + i + '">' +
        '<div class="project-img' + (im ? '' : ' ph') + '">' + (im ? '<img loading="lazy" decoding="async" src="' + esc(im) + '" alt="' + esc(p.title) + ' preview">' : icon('layers')) + '</div>' +
        '<div class="project-body">' + (p.tag ? '<span class="pill">' + esc(p.tag) + '</span>' : '') +
        '<h3>' + esc(p.title) + '</h3><p>' + esc(p.text) + '</p>' +
        (tech.length ? '<div class="chips">' + tech.slice(0, 5).map((t) => '<span class="chip">' + esc(t) + '</span>').join('') + '</div>' : '') +
        '<div class="p-actions"><button class="p-btn" type="button" data-open="' + i + '" aria-haspopup="dialog">View details ' + icon('arrow') + '</button>' +
        (hasLink(p.github) ? '<a class="p-ico" href="' + esc(link(p.github)) + '"' + attrs(link(p.github)) + ' aria-label="' + esc(p.title) + ' on GitHub">' + icon('github') + '</a>' : '') +
        (hasLink(p.demo) ? '<a class="p-ico" href="' + esc(link(p.demo)) + '"' + attrs(link(p.demo)) + ' aria-label="' + esc(p.title) + ' live demo">' + icon('external') + '</a>' : '') +
        '</div></div></article>';
    }).join('') + '</div>');
  }

  const educationHTML = (c) => !on(c, 'education') ? '' : sec('education', head(c.education.heading, c.education.subtitle) + '<div class="edu-grid stagger">' + c.education.items.map((e) =>
    '<div class="card reveal" data-tilt><div class="edu-top"><span class="card-ico">' + icon('grad') + '</span><div><h3>' + esc(e.degree) + '</h3><div class="sub">' + esc(e.school) + (e.period ? ' · ' + esc(e.period) : '') + '</div></div></div>' +
    (e.score ? '<span class="edu-score">' + esc(e.score) + '</span>' : '') +
    (e.text ? '<p class="edu-note">' + esc(e.text) + '</p>' : '') +
    (csv(e.coursework).length ? '<div class="edu-lbl">Relevant coursework</div><div class="chips">' + csv(e.coursework).map((t) => '<span class="chip">' + esc(t) + '</span>').join('') + '</div>' : '') +
    '</div>').join('') + '</div>', 'alt');

  const experienceHTML = (c) => !on(c, 'experience') ? '' : sec('experience', head(c.experience.heading, c.experience.subtitle) + '<div class="timeline">' + c.experience.items.map((x) =>
    '<div class="tl-item reveal" data-reveal="left"><div class="tl-card"><div class="tl-top"><h3>' + esc(x.role) + '</h3>' + (x.type ? '<span class="pill">' + esc(x.type) + '</span>' : '') + '</div>' +
    '<div class="tl-meta">' + (x.company ? '<span>' + icon('briefcase') + esc(x.company) + '</span>' : '') + (x.period ? '<span>' + icon('calendar') + esc(x.period) + '</span>' : '') + '</div>' + listHTML(x.text) + '</div></div>').join('') + '</div>');

  const certsHTML = (c) => !on(c, 'certifications') ? '' : sec('certifications', head(c.certifications.heading, c.certifications.subtitle) + '<div class="cert-grid stagger">' + c.certifications.items.map((x, i) => {
    const im = imgSrc(x.image);
    const media = im ? '<button class="cert-img zoom" type="button" data-zoom="' + i + '" aria-label="View certificate: ' + esc(x.name) + '"><img loading="lazy" decoding="async" src="' + esc(im) + '" alt="' + esc(x.name) + ' certificate"></button>' : '<div class="cert-img" aria-hidden="true">' + icon('award') + '</div>';
    return '<div class="card cert reveal" data-tilt>' + media + '<div class="cert-body"><h3>' + esc(x.name) + '</h3><span class="org">' + esc(x.org) + '</span>' + (x.note ? '<span class="note">' + esc(x.note) + '</span>' : '') + (x.date ? '<span class="date">' + icon('calendar') + esc(x.date) + '</span>' : '') +
      (hasLink(x.link) ? '<a class="link-btn" href="' + esc(link(x.link)) + '"' + attrs(link(x.link)) + '>View / verify credential ' + icon('external') + '</a>' : '') + '</div></div>';
  }).join('') + '</div>', 'alt');

  const achievementsHTML = (c) => !on(c, 'achievements') ? '' : sec('achievements', head(c.achievements.heading, c.achievements.subtitle) + '<div class="ach-grid stagger">' + c.achievements.items.map((a) =>
    '<div class="card ach reveal" data-tilt><div class="top"><span class="card-ico">' + icon('trophy') + '</span>' + (a.category ? '<span class="pill">' + esc(a.category) + '</span>' : '') + '</div><h3>' + esc(a.title) + '</h3>' + (a.date ? '<span class="date">' + esc(a.date) + '</span>' : '') + (a.text ? '<p>' + esc(a.text) + '</p>' : '') + '</div>').join('') + '</div>');

  function resumeHTML(c) {
    if (!on(c, 'resume')) return '';
    const r = c.resume, cv = pdfLinks(r.pdfUrl);
    const btn = cv
      ? '<a class="btn dl pulse" data-magnetic' + dlAttrs(c, cv) + '>' + icon('download') + esc(r.downloadText) + '</a>'
      : '<a class="btn" data-magnetic href="#contact">Request my resume' + icon('arrow') + '</a>';
    return sec('resume', head(r.heading, r.subtitle) +
      '<div class="resume-simple reveal">' +
      (r.summary ? '<p>' + esc(r.summary) + '</p>' : '') +
      (r.updated ? '<div class="upd">' + icon('calendar') + 'Last updated: ' + esc(r.updated) + '</div>' : '') +
      '<div class="r-actions">' + btn + '</div></div>', 'alt');
  }

  /* ---------- known technologies: two crossing red tapes with logos (matched by name; devicon via jsDelivr) ---------- */
  const DEVICON = 'https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/';
  const TECH_ICONS = {   // normalised name -> devicon folder ("folder|variant" when the default "original" variant isn't the right one)
    javascript: 'javascript', js: 'javascript', typescript: 'typescript', ts: 'typescript', python: 'python', java: 'java',
    'c++': 'cplusplus', cpp: 'cplusplus', c: 'c', 'c#': 'csharp', csharp: 'csharp', php: 'php', go: 'go', golang: 'go', rust: 'rust',
    kotlin: 'kotlin', swift: 'swift', bash: 'bash',
    html5: 'html5', html: 'html5', css3: 'css3', css: 'css3', react: 'react', reactjs: 'react', nextjs: 'nextjs',
    tailwindcss: 'tailwindcss', tailwind: 'tailwindcss', bootstrap: 'bootstrap', sass: 'sass', vue: 'vuejs', vuejs: 'vuejs',
    angular: 'angularjs', angularjs: 'angularjs', flutter: 'flutter', wordpress: 'wordpress',
    nodejs: 'nodejs', node: 'nodejs', expressjs: 'express', express: 'express', django: 'django|plain', fastapi: 'fastapi',
    mongodb: 'mongodb', mysql: 'mysql', postgresql: 'postgresql', postgres: 'postgresql', firebase: 'firebase', supabase: 'supabase', redis: 'redis',
    git: 'git', github: 'github', vscode: 'vscode', visualstudiocode: 'vscode', postman: 'postman', docker: 'docker',
    aws: 'amazonwebservices|original-wordmark', amazonwebservices: 'amazonwebservices|original-wordmark',
    vercel: 'vercel', linux: 'linux', nginx: 'nginx', kubernetes: 'kubernetes', jira: 'jira', notion: 'notion', slack: 'slack',
    figma: 'figma', canva: 'canva', photoshop: 'photoshop', adobephotoshop: 'photoshop', framer: 'framermotion', framermotion: 'framermotion',
    xd: 'xd', adobexd: 'xd', illustrator: 'illustrator|plain', premierepro: 'premierepro', aftereffects: 'aftereffects',
    tensorflow: 'tensorflow', pytorch: 'pytorch', scikitlearn: 'scikitlearn', sklearn: 'scikitlearn', numpy: 'numpy', pandas: 'pandas',
    jupyter: 'jupyter', arduino: 'arduino', raspberrypi: 'raspberrypi', androidstudio: 'androidstudio'
  };
  const TECH_INLINE = { restapi: 'globe', rest: 'globe', api: 'globe', openaiapi: 'cpu', openai: 'cpu', chatgpt: 'cpu', ai: 'cpu', machinelearning: 'cpu' };

  function techLogo(name) {
    const key = String(name).toLowerCase().replace(/[^a-z0-9+#]/g, '');
    if (TECH_INLINE[key]) return '<span class="tech-logo">' + icon(TECH_INLINE[key]) + '</span>';
    const spec = TECH_ICONS[key];
    if (spec) {
      const parts = spec.split('|'), slug = parts[0], variant = parts[1] || 'original';
      return '<span class="tech-logo"><img src="' + DEVICON + slug + '/' + slug + '-' + variant + '.svg" alt="" loading="lazy" decoding="async"></span>';
    }
    return '<span class="tech-logo"><span class="badge">' + esc(initials(name)) + '</span></span>';   // no logo known: letter badge
  }

  function technologiesHTML(c) {
    if (!on(c, 'technologies')) return '';
    const t = c.technologies, seen = new Set();
    const all = t.groups.flatMap((g) => g.items || []).filter((n) => n && !seen.has(String(n).toLowerCase()) && seen.add(String(n).toLowerCase()));
    if (!all.length) return '';
    const half = Math.ceil(all.length / 2);
    const lines = [all.slice(0, half), all.slice(half)].filter((l) => l.length);
    const mult = { slow: 0.6, normal: 1, fast: 1.7 }[t.speed] || 1;
    const tape = (list, i) => {
      const rep = Math.max(1, Math.ceil(16 / list.length));                    // enough items that one set is wider than the screen
      const items = [].concat(...Array(rep).fill(list));
      const set = (hidden) => '<div class="tech-set"' + (hidden ? ' aria-hidden="true"' : '') + '>' + items.map((n) =>
        '<span class="tech-item" data-name="' + esc(n) + '">' + techLogo(n) + '<span>' + esc(n) + '</span><i></i></span>').join('') + '</div>';
      return '<div class="tape ' + (i === 0 ? 'tape-a' : 'tape-b') + '"><div class="tech-track" data-dir="' + (i === 0 ? 'right' : 'left') + '" data-speed="' + Math.round((i === 0 ? 70 : 62) * mult) + '">' + set(false) + set(true) + '</div></div>';
    };
    return '<section class="section tech" id="technologies" aria-label="' + esc(t.heading || 'Known Technologies') + '">' +
      '<h2 class="sr-only">' + esc(t.heading || 'Known Technologies') + '</h2>' +
      '<div class="tech-tapes reveal" aria-hidden="true">' + lines.map(tape).join('') + '</div>' +
      '<ul class="sr-only">' + all.map((n) => '<li>' + esc(n) + '</li>').join('') + '</ul></section>';
  }

  /* the tapes drift on their own; scrolling the page pushes them further (and back when you scroll up) and leans them */
  let tapeEngine = null;
  function setupTapes() {
    if (tapeEngine) { tapeEngine.stop(); tapeEngine = null; }
    const host = $('.tech-tapes');
    if (!host || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    const rows = $$('.tech-track', host).map((track) => ({ track, set: track.firstElementChild, dir: track.dataset.dir === 'right' ? 1 : -1, base: Number(track.dataset.speed) || 60, pos: 0, w: 0, slow: 1 }));
    if (!rows.length) return;
    const SCRUB = 0.55;
    let raf = 0, last = 0, lastY = window.scrollY, vel = 0, skew = 0, hover = false, visible = false, dead = false;
    const clampN = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const measure = () => rows.forEach((r, i) => { const w = r.set.offsetWidth; if (w && w !== r.w) { if (!r.w) r.pos = -w * (i ? 0.2 : 0.55); r.w = w; } });
    const ro = new ResizeObserver(measure); rows.forEach((r) => ro.observe(r.set)); measure();
    const frame = (t) => {
      raf = 0;
      if (dead || !visible) { last = 0; return; }
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 1 / 60; last = t;
      const y = window.scrollY, dy = clampN(y - lastY, -120, 120); lastY = y;
      vel += (dy / dt - vel) * Math.min(1, dt * 8);
      skew += (clampN(-vel * 0.006, -9, 9) - skew) * Math.min(1, dt * 8);
      rows.forEach((r) => {
        r.slow += ((hover ? 0 : 1) - r.slow) * Math.min(1, dt * 7);               // ease to a stop while hovered
        if (r.w) {
          r.pos += r.dir * (r.base * r.slow * dt + dy * SCRUB);
          r.pos = ((r.pos % r.w) + r.w) % r.w - r.w;                               // keep inside [-w, 0): two identical sets = seamless loop
        }
        r.track.style.transform = 'translate3d(' + r.pos.toFixed(1) + 'px,0,0) skewX(' + skew.toFixed(2) + 'deg)';
      });
      raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible) { lastY = window.scrollY; last = 0; if (!raf) raf = requestAnimationFrame(frame); }
    }, { rootMargin: '120px 0px' });
    io.observe(host);
    const on_ = () => { hover = true; }, off_ = () => { hover = false; };
    host.addEventListener('pointerenter', on_); host.addEventListener('pointerleave', off_);
    tapeEngine = { stop() { dead = true; cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); host.removeEventListener('pointerenter', on_); host.removeEventListener('pointerleave', off_); } };
  }

  const testimonialsHTML = (c) => !on(c, 'testimonials') ? '' : sec('testimonials', head(c.testimonials.heading, c.testimonials.subtitle) + '<div class="quote-grid stagger">' + c.testimonials.items.map((t) => {
    const im = imgSrc(t.photo);
    return '<figure class="card quote reveal" data-tilt><span class="q">' + icon('quote') + '</span><blockquote>' + esc(t.text) + '</blockquote><figcaption>' +
      (im ? '<img class="av" loading="lazy" src="' + esc(im) + '" alt="' + esc(t.name) + '">' : '<span class="av" aria-hidden="true">' + esc(initials(t.name)) + '</span>') + '<div><b>' + esc(t.name) + '</b><span>' + esc(t.role) + '</span></div></figcaption></figure>';
  }).join('') + '</div>', 'alt');

  const blogHTML = (c) => !on(c, 'blog') ? '' : sec('blog', head(c.blog.heading, c.blog.subtitle) + '<div class="blog-grid stagger">' + c.blog.items.map((p) => {
    const l = hasLink(p.link) ? link(p.link) : '', im = imgSrc(p.image);
    return '<article class="card post reveal" data-tilt><div class="post-img">' + (im ? '<img loading="lazy" decoding="async" src="' + esc(im) + '" alt="">' : icon('pen')) + '</div><div class="post-body">' +
      '<div class="post-meta">' + (p.tag ? '<span class="pill">' + esc(p.tag) + '</span>' : '<span></span>') + '<span>' + esc(p.date) + '</span></div><h3>' + esc(p.title) + '</h3><p>' + esc(p.text) + '</p>' +
      (l ? '<a class="link-btn more" href="' + esc(l) + '"' + attrs(l) + '>Read article ' + icon('arrow') + '<span class="sr" style="position:absolute;left:-9999px"> : ' + esc(p.title) + '</span></a>' : '') + '</div></article>';
  }).join('') + '</div>');

  function contactHTML(c) {
    if (!on(c, 'contact')) return '';
    const k = c.contact;
    // email / phone / social links live in the footer as small icons; this section is just the form
    return '<section class="section contact" id="contact" aria-label="Contact"><div class="wrap">' +
      '<h2 class="sec-title reveal">' + esc(k.heading) + '</h2><p class="contact-lead reveal">' + esc(k.text) + '</p>' +
      '<div class="contact-grid solo">' +
      '<form class="contact-form reveal" id="ctaForm" novalidate data-ok="' + esc(k.success) + '">' +
      '<div class="two"><input type="text" name="name" autocomplete="name" placeholder="' + esc(k.namePlaceholder) + '" aria-label="Your name">' +
      '<input type="email" name="email" required autocomplete="email" placeholder="' + esc(k.emailPlaceholder) + '" aria-label="Your email"></div>' +
      '<textarea name="message" required placeholder="' + esc(k.messagePlaceholder) + '" aria-label="Your message"></textarea>' +
      '<button class="btn btn-orange" data-magnetic type="submit">' + esc(k.button) + icon('arrow') + '</button><div class="cta-msg" id="ctaMsg" role="status" aria-live="polite"></div></form>' +
      '</div></div></section>';
  }

  function footerHTML(c) {
    const k = c.contact || {};
    const items = [];
    if (k.email) items.push({ ic: 'mail', href: 'mailto:' + k.email, label: 'Email' });
    if (k.phone) items.push({ ic: 'phone', href: 'tel:' + String(k.phone).replace(/[^\d+]/g, ''), label: 'Call' });
    c.footer.socials.filter((s) => hasLink(s.url)).forEach((s) => items.push({ ic: s.icon, href: link(s.url), label: SOCIAL_NAMES[s.icon] || 'Link' }));
    const icons = items.length
      ? '<div class="socials">' + items.map((i) => '<a href="' + esc(i.href) + '"' + attrs(i.href) + ' aria-label="' + esc(i.label) + '" title="' + esc(i.label) + '">' + icon(i.ic) + '</a>').join('') + '</div>'
      : '';
    const where = k.location ? '<p class="foot-loc">' + icon('pin') + esc(k.location) + '</p>' : '';
    return '<footer class="footer"><div class="wrap">' +
      '<div class="logo-text" aria-label="' + esc(c.meta.name) + '">' + logoHTML(c.footer.logoText) + '</div>' +
      '<nav aria-label="Footer"><ul class="foot-links">' + navItems(c).map((n) => '<li><a href="' + esc(link(n.href)) + '">' + esc(n.label) + '</a></li>').join('') + '</ul></nav>' +
      icons + where +
      '</div><div class="copy">' + esc(String(c.footer.copyright).replace('{year}', new Date().getFullYear())) +
      '<div class="credit">Website is made by _.syam_krishna_reddy._</div></div></footer>' +
      '<button class="to-top" id="toTop" type="button" aria-label="Back to top">' + icon('arrowup') + '</button>';
  }

  /* ---------- SEO / meta ---------- */
  function setMeta(sel, create, val) {
    let el = $(sel);
    if (!el) { el = document.createElement('meta'); Object.entries(create).forEach(([k, v]) => el.setAttribute(k, v)); document.head.append(el); }
    el.setAttribute('content', val);
  }
  function seo(c) {
    document.title = c.meta.siteTitle;
    setMeta('meta[name="description"]', { name: 'description' }, c.meta.description);
    setMeta('meta[property="og:title"]', { property: 'og:title' }, c.meta.siteTitle);
    setMeta('meta[property="og:description"]', { property: 'og:description' }, c.meta.description);
    setMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, c.meta.name);
    const og = imgSrc(c.meta.ogImage) || imgSrc(c.hero.photo);
    if (og && external(og)) setMeta('meta[property="og:image"]', { property: 'og:image' }, og);
    setMeta('meta[name="theme-color"]', { name: 'theme-color' }, '#000000');
    const fav = imgSrc(c.meta.favicon); const fl = $('#favicon'); if (fav && fl) fl.setAttribute('href', fav);
    // structured data for search engines
    let ld = $('#ld-json');
    if (!ld) { ld = document.createElement('script'); ld.id = 'ld-json'; ld.type = 'application/ld+json'; document.head.append(ld); }
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'Person', name: c.meta.name,
      jobTitle: (c.hero.title1 + ' ' + c.hero.title2).replace(/\s+/g, ' ').trim(), description: c.meta.description,
      url: location.origin && location.origin !== 'null' ? location.origin + location.pathname.replace(/[^/]*$/, '') : undefined,
      image: og && external(og) ? og : undefined,
      sameAs: c.footer.socials.filter((s) => external(link(s.url))).map((s) => link(s.url))
    });
  }

  /* ---------- theme: the site is dark only ---------- */
  function applyDefaultMode() {
    document.documentElement.dataset.theme = 'dark';
    try { localStorage.removeItem('kc_theme'); } catch (e) {}   // forget a light choice saved by the old theme toggle
  }

  /* ---------- hero background: GradientASCII (WebGL) ---------- */
  let asciiHost = null, ascii = null, asciiFailed = false;
  const shade = (hex, k) => { const n = parseInt(String(hex).replace('#', '').padEnd(6, '0').slice(0, 6), 16); const f = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join(''); };
  function asciiOptions(c) {
    const small = matchMedia('(max-width: 820px)').matches;
    const light = document.documentElement.dataset.theme === 'light';
    return {
      colors: light ? [shade(c.theme.accent, 0.62), c.theme.accent, c.theme.accent2, '#ffb066'] : [shade(c.theme.accent, 0.38), c.theme.accent, c.theme.accent2, '#ffe6cf'],
      lightMode: light,
      shape: c.hero.bgShape || 'rise',
      characters: ' =+xX0S8#@',
      cellSize: small ? 13 : 17,
      density: small ? 0.6 : 0.78,
      glyphOpacity: light ? 0.95 : 0.8,
      gradientOpacity: light ? 0.58 : 0.5,
      glow: 0.28,
      flicker: 0.25,
      softness: 0.6,
      scale: 1.1,
      flow: 0.6,
      speed: 0.8,
      grain: 0.06,
      mouseInteraction: true,
      clickEffect: 'wave',
      intro: true,
      dpr: Math.min(window.devicePixelRatio || 1, 1.5)
    };
  }
  function mountAscii(c) {
    const bg = $('.hero-bg');
    if (!bg || asciiFailed || !window.GradientASCII) return;
    if (!asciiHost) { asciiHost = document.createElement('div'); asciiHost.className = 'hero-ascii'; }
    bg.insertBefore(asciiHost, bg.firstChild);          // survives re-renders: same WebGL canvas, just re-parented
    const opts = asciiOptions(c);
    if (!ascii) { ascii = GradientASCII.create(asciiHost, opts); if (!ascii) asciiFailed = true; }
    else ascii.update(opts);
  }

  /* ---------- render ---------- */
  let io = null, lastJSON = '', C = null, heroEl = null, ticking = false;
  function render(c) {
    const json = JSON.stringify(c);
    if (json === lastJSON) return;
    if (lastJSON) document.body.classList.add('preview');   // re-renders skip entrance animations
    lastJSON = json; C = c;
    const root = document.documentElement.style;
    root.setProperty('--red', c.theme.accent);
    root.setProperty('--orange', c.theme.accent2);
    applyDefaultMode();
    seo(c);

    app.innerHTML = navHTML(c) + '<main id="main" tabindex="-1">' + heroHTML(c) + aboutHTML(c) + skillsHTML(c) + projectsHTML(c) +
      educationHTML(c) + experienceHTML(c) + certsHTML(c) + achievementsHTML(c) + resumeHTML(c) + technologiesHTML(c) + testimonialsHTML(c) + blogHTML(c) + contactHTML(c) + '</main>' + footerHTML(c);
    setupReveal();
    $('#burger').addEventListener('click', () => { const nav = $('#nav'), o = nav.classList.toggle('open'); $('#burger').setAttribute('aria-expanded', o); });
    $$('#navLinks a').forEach((a) => a.addEventListener('click', () => { $('#nav').classList.remove('open'); $('#burger').setAttribute('aria-expanded', false); }));
    heroEl = $('.hero');
    mountAscii(c);
    setupTapes();
    onScroll();
    $$('img').forEach((im) => { if (im.complete) im.classList.add('loaded'); });
    const hp = $('.hero-photo img'), L = window.KCLoader || { mark() {} };
    if (!hp || hp.complete) L.mark('hero');
    else { hp.addEventListener('load', () => L.mark('hero'), { once: true }); hp.addEventListener('error', () => L.mark('hero'), { once: true }); }
  }

  /* ---------- reveal + count-up ---------- */
  function countUp(el) {
    const to = Number(el.dataset.to) || 0, dur = 1700, t0 = performance.now();
    const step = (t) => { const p = Math.min(1, (t - t0) / dur), e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p); el.textContent = Math.round(to * e); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  function setupReveal() {
    if (io) io.disconnect();
    $$('.stagger').forEach((g) => $$(':scope > .reveal', g).forEach((el, i) => el.style.setProperty('--d', (i % 4) * 0.1 + 's')));
    $$('.about .wrap > .reveal').forEach((el, i) => el.style.setProperty('--d', Math.min(i, 3) * 0.08 + 's'));
    const counts = $$('.count');
    if (document.body.classList.contains('preview') || !('IntersectionObserver' in window)) { counts.forEach((el) => (el.textContent = el.dataset.to)); $$('.reveal').forEach((el) => el.classList.add('in')); return; }
    io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target; el.classList.add('in'); io.unobserve(el);
        setTimeout(() => el.style.setProperty('--d', '0s'), 1300);   // stagger delay must not slow later hovers
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('.reveal').forEach((el) => io.observe(el));
    const startCounts = () => setTimeout(() => counts.forEach(countUp), 1300);
    if ($('.stats')) { if (document.body.classList.contains('is-loading')) document.addEventListener('kc-loaded', startCounts, { once: true }); else startCounts(); }
  }

  /* ---------- modal ---------- */
  let lastFocus = null;
  function openModal(html, label) {
    const m = $('#modal');
    $('#modalBody').innerHTML = html; m.setAttribute('aria-label', label || 'Details'); m.hidden = false;
    document.body.classList.add('lock'); lastFocus = document.activeElement; $('.modal-x', m).focus();
  }
  function closeModal() {
    const m = $('#modal'); if (m.hidden) return;
    m.hidden = true; $('#modalBody').innerHTML = ''; document.body.classList.remove('lock');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function openProject(i) {
    const p = C && C.projects.items[i]; if (!p) return;
    const im = imgSrc(p.image), tech = csv(p.tech);
    openModal('<div class="m-media' + (im ? '' : ' ph') + '">' + (im ? '<img src="' + esc(im) + '" alt="' + esc(p.title) + ' preview">' : icon('layers')) + '</div><div class="m-body">' +
      (p.tag ? '<span class="pill">' + esc(p.tag) + '</span>' : '') + '<h3>' + esc(p.title) + '</h3><p>' + esc(p.text) + '</p>' +
      (p.role ? '<h4>My role</h4><p>' + esc(p.role) + '</p>' : '') +
      (lines(p.details).length ? '<h4>Contributions</h4>' + listHTML(p.details) : '') +
      (tech.length ? '<h4>Technologies used</h4><div class="chips">' + tech.map((t) => '<span class="chip">' + esc(t) + '</span>').join('') + '</div>' : '') +
      ((hasLink(p.github) || hasLink(p.demo)) ? '<div class="m-actions">' +
        (hasLink(p.demo) ? '<a class="btn" href="' + esc(link(p.demo)) + '"' + attrs(link(p.demo)) + '>Live demo ' + icon('external') + '</a>' : '') +
        (hasLink(p.github) ? '<a class="btn btn-ghost" href="' + esc(link(p.github)) + '"' + attrs(link(p.github)) + '>' + icon('github') + 'GitHub repository</a>' : '') + '</div>' : '') +
      '</div>', p.title);
  }

  /* ---------- global listeners (bound once) ---------- */
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('[data-close]')) { closeModal(); return; }
    if (t.closest('#toTop')) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const op = t.closest('[data-open]'); if (op) { openProject(+op.dataset.open); return; }
    const z = t.closest('[data-zoom]');
    if (z && C) { const x = C.certifications.items[+z.dataset.zoom]; if (x) openModal('<div class="m-img-only"><img src="' + esc(imgSrc(x.image)) + '" alt="' + esc(x.name) + ' certificate"></div>', x.name); return; }
    const art = t.closest('.project');
    if (art && !t.closest('a')) openProject(+art.dataset.i);
  });
  document.addEventListener('keydown', (e) => {
    const m = $('#modal'); if (m.hidden) return;
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key === 'Tab') {   // keep focus inside the dialog
      const f = $$('a[href], button:not([disabled])', m).filter((x) => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  function onScroll() {
    const nav = $('#nav'); if (!nav) return;
    const y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle('scrolled', y > 40);
    $('#progress').style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    const tt = $('#toTop'); if (tt) tt.classList.toggle('show', y > 700);
    const links = $$('#navLinks a'); let cur = '';
    links.forEach((a) => {
      const id = a.getAttribute('href');
      const t = id && id.charAt(0) === '#' && id.length > 1 ? $(id) : null;
      if (t && t.getBoundingClientRect().top <= innerHeight * 0.35) cur = id;
      a.classList.remove('active'); a.removeAttribute('aria-current');
    });
    const act = links.find((a) => a.getAttribute('href') === cur) || (y < 200 ? links.find((a) => a.getAttribute('href') === '#home') : null);
    if (act) { act.classList.add('active'); act.setAttribute('aria-current', 'true'); }
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; onScroll(); }); } }, { passive: true });

  // hero hex glow follows the cursor, orbits when idle; photo parallax
  const mouse = { x: 0, y: 0, active: false, cx: 0.7, cy: 0.4 };
  let lastMove = 0;
  document.addEventListener('pointermove', (e) => {
    if (!heroEl) return;
    const r = heroEl.getBoundingClientRect();
    if (e.clientY < r.top || e.clientY > r.bottom) return;
    mouse.x = (e.clientX - r.left) / r.width; mouse.y = (e.clientY - r.top) / r.height; mouse.active = true; lastMove = performance.now();
  }, { passive: true });
  function heroLoop(t) {
    if (heroEl && !document.hidden && heroEl.getBoundingClientRect().bottom > 0 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (performance.now() - lastMove > 2500) mouse.active = false;
      const tx = mouse.active ? mouse.x : 0.55 + Math.cos(t / 2600) * 0.3;
      const ty = mouse.active ? mouse.y : 0.4 + Math.sin(t / 2100) * 0.25;
      mouse.cx += (tx - mouse.cx) * 0.08; mouse.cy += (ty - mouse.cy) * 0.08;
      heroEl.style.setProperty('--mx', (mouse.cx * 100).toFixed(2) + '%');
      heroEl.style.setProperty('--my', (mouse.cy * 100).toFixed(2) + '%');
      heroEl.style.setProperty('--px', ((mouse.cx - 0.5) * 2).toFixed(3));
      heroEl.style.setProperty('--py', ((mouse.cy - 0.5) * 2).toFixed(3));
    }
    requestAnimationFrame(heroLoop);
  }
  requestAnimationFrame(heroLoop);

  // card tilt + glow
  document.addEventListener('pointermove', (e) => {
    const c = e.target.closest && e.target.closest('[data-tilt]');
    if (!c || e.pointerType === 'touch') return;
    const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    c.style.setProperty('--gx', x * 100 + '%'); c.style.setProperty('--gy', y * 100 + '%');
    c.style.setProperty('--ry', ((x - 0.5) * 7).toFixed(2) + 'deg'); c.style.setProperty('--rx', ((0.5 - y) * 7).toFixed(2) + 'deg');
  });
  document.addEventListener('pointerout', (e) => {
    const c = e.target.closest && e.target.closest('[data-tilt]');
    if (c && !c.contains(e.relatedTarget)) { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); }
  });

  // magnetic buttons
  document.addEventListener('pointermove', (e) => {
    const b = e.target.closest && e.target.closest('[data-magnetic]');
    if (!b || e.pointerType === 'touch') return;
    const r = b.getBoundingClientRect();
    b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.35 - 4).toFixed(1) + 'px)';
  });
  document.addEventListener('pointerout', (e) => {
    const b = e.target.closest && e.target.closest('[data-magnetic]');
    if (b && !b.contains(e.relatedTarget)) b.style.transform = '';
  });

  // click ripple
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest && e.target.closest('.btn');
    if (!b) return;
    const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height), s = document.createElement('span');
    s.className = 'ripple'; s.style.cssText = 'width:' + d + 'px;height:' + d + 'px;left:' + (e.clientX - r.left - d / 2) + 'px;top:' + (e.clientY - r.top - d / 2) + 'px';
    b.appendChild(s); setTimeout(() => s.remove(), 700);
  });

  // contact form
  document.addEventListener('submit', async (e) => {
    const f = e.target.closest && e.target.closest('#ctaForm');
    if (!f) return;
    e.preventDefault();
    const msg = $('#ctaMsg'), btn = $('button[type=submit]', f);
    const data = { name: f.elements.name.value.trim(), email: f.elements.email.value.trim(), message: f.elements.message.value.trim() };
    msg.classList.remove('show', 'err');
    const fail = (t) => { f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); msg.textContent = t; msg.classList.add('show', 'err'); };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return fail('Please enter a valid email address.');
    if (data.message.length < 2) return fail('Please write a short message.');
    if (isPreview) { msg.textContent = 'Preview mode: message not sent.'; msg.classList.add('show'); return; }
    btn.disabled = true;
    // give the database 15 seconds to confirm, so a stalled connection never leaves the button stuck
    const TIMEOUT = 15000;
    let timer;
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), TIMEOUT); });
    try { await Promise.race([Store.addMessage(data), timeout]); f.reset(); msg.textContent = f.dataset.ok; msg.classList.add('show'); }
    catch (err) {
      if (err && err.message === 'timeout') fail('This is taking too long and the message may not have been sent. Please try again.');
      else fail('Sorry, something went wrong. Please try again.');
    }
    clearTimeout(timer);
    btn.disabled = false;
  });

  // a technology logo that cannot load (offline, unknown file) falls back to a letter badge
  // images fade in over their skeleton once loaded (or failed, so a shimmer never runs forever)
  document.addEventListener('load', (e) => { if (e.target && e.target.tagName === 'IMG') e.target.classList.add('loaded'); }, true);
  window.addEventListener('error', (e) => {
    const img = e.target;
    if (!img || img.tagName !== 'IMG' || !img.closest) return;
    img.classList.add('loaded');
    const item = img.closest('.tech-item');
    if (!item) return;
    const b = document.createElement('span');
    b.className = 'badge'; b.textContent = initials(item.dataset.name);
    img.replaceWith(b);
  }, true);

  /* ---------- LetterGlitch background: from "About" to the end of the page ---------- */
  let glitch = null, glitchHost = null;
  const glitchProps = (light) => ({
    // letters follow the background: white on the dark theme, black on the light theme
    glitchColors: light ? ['#000000', '#52525b'] : ['#ffffff', '#a1a1aa'],
    baseColor: light ? '#000000' : '#ffffff',
    baseOpacity: light ? 0.13 : 0.16,
    lightMode: light,
    glitchAmount: 0.5, speed: 1, flow: 0.5, clickEffect: 'tear', fontSize: 14, spacing: 0.6, density: 0.9,
    smooth: true, edgeFade: 0, centerFade: 0, interactive: true, cursorRadius: 140, intro: true
  });
  const heroBottom = () => { const h = $('.hero'); return h ? h.getBoundingClientRect().bottom : 0; };
  const isLight = () => document.documentElement.dataset.theme === 'light';
  function setupGlitch() {
    if (isPreview || !window.LetterGlitch) return;
    glitchHost = document.createElement('div');
    glitchHost.className = 'glitch-bg';
    glitchHost.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(glitchHost, document.body.firstChild);
    const check = () => {
      if (document.body.classList.contains('is-loading')) return;   // wait for the loading page
      const show = heroBottom() < innerHeight - 40;           // the About section has come into view
      if (show && !glitch) {                                    // created lazily so its intro plays when first seen
        glitch = LetterGlitch.create(glitchHost, Object.assign(glitchProps(isLight()), {
          shouldRender: () => heroBottom() < innerHeight,
          gate: (x, y) => y > heroBottom()                      // pointer effects only below the hero
        }));
      }
      glitchHost.classList.toggle('on', show && !!glitch);
    };
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    new MutationObserver(() => { if (glitch) glitch.update(glitchProps(isLight())); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    check();
    document.addEventListener('kc-loaded', check);
  }

  /* ---------- boot ---------- */
  const DEF = window.DEFAULT_CONTENT;
  render(Store.merge(DEF, Store.cached() || {}));

  setupGlitch();

  if (isPreview) {
    window.addEventListener('message', (e) => { if (e.data && e.data.type === 'kc-preview') render(Store.merge(DEF, e.data.content)); });
    if (window.parent !== window) window.parent.postMessage({ type: 'kc-preview-ready' }, '*');
  } else {
    Store.load().then((raw) => { if (raw) render(Store.merge(DEF, raw)); }).catch((err) => console.warn('Using cached/default content:', err.message))
      .then(() => { if (window.KCLoader) window.KCLoader.mark('content'); });
    window.addEventListener('storage', (e) => { if (e.key === 'kc_content_v1' && e.newValue) { try { render(Store.merge(DEF, JSON.parse(e.newValue))); } catch (x) {} } });
  }
})();
