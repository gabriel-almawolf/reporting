(function () {
  'use strict';

  const cfg = Object.assign(
    { projectName: 'web', webhookUrl: '', brandColor: '#C13B2F' },
    window.WEB_REVIEW_CONFIG || {}
  );

  // Si no hay webhookUrl en config, usar el guardado localmente por el usuario
  if (!cfg.webhookUrl) {
    cfg.webhookUrl = localStorage.getItem('wr_webhook') || '';
  }

  const TEAL  = '#5FD3B8';
  const NAVY  = '#1C1C2E';
  const LIGHT = '#EDECEB';
  const LS_KEY  = 'wr_' + cfg.projectName.replace(/[^a-z0-9]/gi, '_');
  const LS_USER = 'wr_user';

  let mode      = 'nav';
  let hoveredEl = null;
  let hudEl     = null;
  let barEl     = null;
  let settingsEl = null;
  let notes     = loadNotes();
  let currentUser = localStorage.getItem(LS_USER) || '';

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function getActiveSlide() {
    const s = document.querySelector('.slide.active');
    return s ? s.id : (document.title || 'unknown');
  }

  function getCssSelector(el) {
    if (!el || el === document.body) return 'body';
    let sel = el.tagName.toLowerCase();
    if (el.id) {
      sel += '#' + el.id;
    } else if (el.className && typeof el.className === 'string') {
      const cls = el.className.trim().split(/\s+/).filter(c => !c.startsWith('wr-')).slice(0, 2);
      if (cls.length) sel += '.' + cls.join('.');
    }
    return sel;
  }

  function getComponentType(el) {
    const tag = el.tagName.toLowerCase();
    if (['p','h1','h2','h3','h4','h5','h6','span','li','td','th','label','a','em','strong','b','i'].includes(tag)) return 'Texto';
    if (tag === 'img' || tag === 'svg' || tag === 'canvas' || tag === 'picture') return 'Imagen';
    if (['nav','ul','ol','menu'].includes(tag)) return 'Navegación / Menú';
    return 'Bloque / Contenedor';
  }

  function getAspectRatio(w, h) {
    if (!w || !h) return '';
    const known = [[16,9],[4,3],[3,2],[2,1],[21,9],[1,1],[9,16],[3,4]];
    for (const [a,b] of known) {
      if (Math.abs(w/h - a/b) < 0.04) return a + ':' + b;
    }
    const g = gcd(Math.round(w), Math.round(h));
    return Math.round(w)/g + ':' + Math.round(h)/g;
  }

  function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

  function getTextOf(el) {
    return (el.innerText || el.textContent || '').trim().slice(0, 200);
  }

  function genId() {
    return 'NOTE_' + Date.now().toString(36).toUpperCase();
  }

  function loadNotes() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
  }

  function saveNotes() {
    localStorage.setItem(LS_KEY, JSON.stringify(notes));
    updateBadge();
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function escAttr(s) {
    return String(s || '').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function isOwn(el) {
    return !!(el && el.closest('#wr-bar, #wr-hud, #wr-overlay, #wr-settings'));
  }

  // ── Styles ───────────────────────────────────────────────────────────────────

  function injectStyles() {
    if (document.getElementById('wr-styles')) return;
    const s = document.createElement('style');
    s.id = 'wr-styles';
    s.textContent = `
      #wr-bar {
        position: fixed; bottom: 16px; right: 16px;
        display: flex; align-items: center; gap: 4px;
        background: ${NAVY}; color: ${LIGHT}; border-radius: 999px;
        padding: 5px 8px; z-index: 99998; user-select: none;
        box-shadow: 0 4px 20px rgba(0,0,0,.5); font-family: Inter, system-ui, sans-serif;
        font-size: 12px; white-space: nowrap;
      }
      #wr-bar button {
        background: none; border: none; color: ${LIGHT}; cursor: pointer;
        padding: 5px 11px; border-radius: 999px; font-size: 12px; font-family: inherit;
        transition: background .15s;
      }
      #wr-bar button:hover { background: rgba(255,255,255,.1); }
      #wr-bar button.wr-active { background: ${cfg.brandColor}; color: #fff; }
      #wr-sep { width: 1px; height: 14px; background: rgba(255,255,255,.2); margin: 0 2px; }
      #wr-badge {
        background: ${TEAL}; color: ${NAVY}; border-radius: 999px;
        font-size: 10px; padding: 1px 6px; font-weight: 700;
        display: none; line-height: 1.5;
      }

      #wr-hud {
        position: fixed; z-index: 99999; pointer-events: none;
        background: ${NAVY}; color: ${LIGHT}; border-radius: 8px;
        padding: 8px 12px; font-size: 11px; font-family: Inter, system-ui, sans-serif;
        border: 1px solid rgba(255,255,255,.15); max-width: 280px; line-height: 1.6;
        box-shadow: 0 4px 16px rgba(0,0,0,.4); display: none;
      }
      #wr-hud .wr-hs { color: ${TEAL}; font-weight: 600; font-size: 11px; }
      #wr-hud .wr-hr { color: rgba(237,236,235,.65); font-size: 11px; }

      .wr-highlight {
        outline: 2px dashed ${TEAL} !important;
        outline-offset: 2px !important;
        cursor: crosshair !important;
      }

      #wr-overlay {
        position: fixed; inset: 0; background: rgba(15,17,25,.72); z-index: 99999;
        display: flex; align-items: center; justify-content: center;
        font-family: Inter, system-ui, sans-serif;
      }
      #wr-modal {
        background: ${NAVY}; color: ${LIGHT}; border-radius: 12px;
        padding: 24px 28px; width: min(520px, 90vw); max-height: 90vh;
        overflow-y: auto; border: 1px solid rgba(255,255,255,.15);
        box-shadow: 0 8px 40px rgba(0,0,0,.6);
      }
      #wr-modal h3 { margin: 0 0 14px; font-size: 14px; font-weight: 600; }
      .wr-bc {
        display: flex; flex-wrap: wrap; gap: 3px; align-items: center;
        margin-bottom: 14px; padding: 6px 10px;
        background: rgba(255,255,255,.06); border-radius: 6px; font-size: 11px;
      }
      .wr-crumb {
        color: ${TEAL}; cursor: pointer; padding: 2px 5px; border-radius: 4px;
        transition: background .12s;
      }
      .wr-crumb:hover { background: rgba(95,211,184,.15); }
      .wr-csep { color: rgba(237,236,235,.3); font-size: 10px; }
      #wr-modal label {
        display: block; font-size: 10px; font-weight: 700; margin: 12px 0 4px;
        text-transform: uppercase; letter-spacing: .07em; color: rgba(237,236,235,.6);
      }
      #wr-modal input, #wr-modal textarea, #wr-modal select {
        width: 100%; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.15);
        color: ${LIGHT}; border-radius: 6px; padding: 8px 10px; font-family: inherit;
        font-size: 13px; box-sizing: border-box; resize: vertical;
      }
      #wr-modal input:focus, #wr-modal textarea:focus, #wr-modal select:focus {
        outline: none; border-color: ${TEAL};
      }
      #wr-modal select option { background: ${NAVY}; }
      .wr-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
      .wr-btn-save {
        background: ${cfg.brandColor}; color: #fff; border: none; border-radius: 8px;
        padding: 9px 20px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
      }
      .wr-btn-save:hover { filter: brightness(1.1); }
      .wr-btn-cancel {
        background: rgba(255,255,255,.08); color: ${LIGHT}; border: none; border-radius: 8px;
        padding: 9px 16px; font-size: 13px; cursor: pointer; font-family: inherit;
      }
      .wr-btn-cancel:hover { background: rgba(255,255,255,.14); }
      .wr-notice { font-size: 11px; color: ${TEAL}; margin-top: 8px; text-align: right; min-height: 16px; }
      .wr-notice.wr-warn { color: #F59E0B; }

      @media (max-width: 768px) {
        #wr-bar { bottom: 72px; }
        #wr-settings { bottom: 128px; }
      }

      #wr-settings {
        position: fixed; bottom: 60px; right: 16px;
        background: ${NAVY}; color: ${LIGHT}; border-radius: 12px;
        padding: 18px 20px; width: min(340px, 90vw); z-index: 99998;
        border: 1px solid rgba(255,255,255,.15); font-family: Inter, system-ui, sans-serif;
        font-size: 13px; box-shadow: 0 8px 32px rgba(0,0,0,.55);
      }
      #wr-settings h4 { margin: 0 0 12px; font-size: 13px; font-weight: 700; }
      #wr-settings .wr-stat { color: ${TEAL}; font-weight: 700; }
      #wr-settings label {
        display: block; font-size: 10px; font-weight: 700; letter-spacing: .07em;
        text-transform: uppercase; color: rgba(237,236,235,.6); margin: 12px 0 4px;
      }
      #wr-settings input {
        width: 100%; background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.15);
        color: ${LIGHT}; border-radius: 6px; padding: 7px 9px; font-family: inherit;
        font-size: 12px; box-sizing: border-box;
      }
      #wr-settings input:focus { outline: none; border-color: ${TEAL}; }
      .wr-srow { display: flex; gap: 6px; margin-top: 14px; flex-wrap: wrap; }
      .wr-sbtn {
        flex: 1; background: rgba(255,255,255,.08); border: none; color: ${LIGHT};
        border-radius: 8px; padding: 8px 6px; font-size: 11px; cursor: pointer;
        font-family: inherit; white-space: nowrap;
      }
      .wr-sbtn:hover { background: rgba(255,255,255,.15); }
    `;
    document.head.appendChild(s);
  }

  // ── Bar ──────────────────────────────────────────────────────────────────────

  function createBar() {
    barEl = document.createElement('div');
    barEl.id = 'wr-bar';
    barEl.innerHTML =
      '<button id="wr-btn-nav" class="wr-active" title="Modo navegación normal">🧭 Navegar</button>' +
      '<button id="wr-btn-com" title="Inspector de elementos (Alt+C)">✍️ Comentar</button>' +
      '<span id="wr-sep"></span>' +
      '<span id="wr-badge"></span>' +
      '<button id="wr-btn-cfg" title="Opciones">⚙️</button>';
    document.body.appendChild(barEl);

    document.getElementById('wr-btn-nav').addEventListener('click', () => setMode('nav'));
    document.getElementById('wr-btn-com').addEventListener('click', () => setMode('comment'));
    document.getElementById('wr-btn-cfg').addEventListener('click', toggleSettings);

    updateBadge();
  }

  function updateBadge() {
    const b = document.getElementById('wr-badge');
    if (!b) return;
    if (notes.length > 0) {
      b.textContent = notes.length;
      b.style.display = 'inline-block';
    } else {
      b.style.display = 'none';
    }
  }

  function setMode(m) {
    mode = m;
    const btnNav = document.getElementById('wr-btn-nav');
    const btnCom = document.getElementById('wr-btn-com');
    if (btnNav) btnNav.classList.toggle('wr-active', m === 'nav');
    if (btnCom) btnCom.classList.toggle('wr-active', m === 'comment');
    document.body.style.cursor = m === 'comment' ? 'crosshair' : '';
    if (m === 'nav') {
      clearHover();
      if (hudEl) hudEl.style.display = 'none';
    }
    closeSettings();
  }

  // ── HUD ──────────────────────────────────────────────────────────────────────

  function createHud() {
    hudEl = document.createElement('div');
    hudEl.id = 'wr-hud';
    document.body.appendChild(hudEl);
  }

  function showHud(el, x, y) {
    const rect = el.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    const ar = getAspectRatio(w, h);
    const type = getComponentType(el);
    const sel  = getCssSelector(el);
    hudEl.innerHTML =
      '<div class="wr-hs">' + escHtml(sel) + '</div>' +
      '<div class="wr-hr">' + type + ' · ' + w + ' × ' + h + ' px' + (ar ? ' · ' + ar : '') + '</div>';
    hudEl.style.display = 'block';
    const HW = 290, HH = 58;
    let lx = x + 16, ly = y + 16;
    if (lx + HW > window.innerWidth  - 8) lx = x - HW - 8;
    if (ly + HH > window.innerHeight - 8) ly = y - HH - 8;
    hudEl.style.left = lx + 'px';
    hudEl.style.top  = ly + 'px';
  }

  // ── Hover ────────────────────────────────────────────────────────────────────

  function clearHover() {
    if (hoveredEl) {
      hoveredEl.classList.remove('wr-highlight');
      hoveredEl = null;
    }
  }

  function onMouseMove(e) {
    if (mode !== 'comment') return;
    if (isOwn(e.target)) { clearHover(); if (hudEl) hudEl.style.display = 'none'; return; }
    if (e.target !== hoveredEl) {
      clearHover();
      hoveredEl = e.target;
      hoveredEl.classList.add('wr-highlight');
    }
    showHud(hoveredEl, e.clientX, e.clientY);
  }

  function onDocLeave() {
    if (mode !== 'comment') return;
    clearHover();
    if (hudEl) hudEl.style.display = 'none';
  }

  // ── Modal ────────────────────────────────────────────────────────────────────

  function buildChain(el) {
    const chain = [];
    let cur = el;
    while (cur && cur !== document.body && chain.length < 7) {
      chain.unshift(cur);
      cur = cur.parentElement;
    }
    return chain;
  }

  function openModal(target) {
    if (isOwn(target)) return;
    if (document.getElementById('wr-overlay')) return;
    clearHover();
    if (hudEl) hudEl.style.display = 'none';

    let chain    = buildChain(target);
    let focusEl  = target;
    const snapSlide = getActiveSlide();

    const overlay = document.createElement('div');
    overlay.id = 'wr-overlay';
    const modal = document.createElement('div');
    modal.id = 'wr-modal';
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    function render() {
      const type    = getComponentType(focusEl);
      const isText  = type === 'Texto';
      const rect    = focusEl.getBoundingClientRect();
      const fw = Math.round(rect.width), fh = Math.round(rect.height);
      const far     = getAspectRatio(fw, fh);
      const origVal = isText
        ? getTextOf(focusEl)
        : type + ' · ' + fw + ' × ' + fh + ' px' + (far ? ' · ' + far : '');
      const title   = isText ? '✍️ Proponer Cambio de Texto' : '🎨 Sugerir Cambio de Diseño, Bloque o Navegación';

      const crumbHtml = chain.map((c, i) =>
        '<span class="wr-crumb" data-i="' + i + '">' + escHtml(getCssSelector(c)) + '</span>' +
        (i < chain.length - 1 ? '<span class="wr-csep">›</span>' : '')
      ).join('');

      modal.innerHTML =
        '<h3>' + title + '</h3>' +
        '<div class="wr-bc">' + crumbHtml + '</div>' +
        '<label>👤 Usuario / Email</label>' +
        '<input id="wr-u" type="text" value="' + escAttr(currentUser) + '" placeholder="Tu nombre o correo">' +
        '<label>' + (isText ? 'Texto original detectado' : 'Elemento / Ficha técnica') + '</label>' +
        '<textarea id="wr-o" rows="2">' + escHtml(origVal) + '</textarea>' +
        '<label>Propuesta ' + (isText ? 'de texto alternativo' : 'de ajuste') + '</label>' +
        '<textarea id="wr-p" rows="3" placeholder="' + (isText ? 'Redacción alternativa…' : 'Ajuste de diseño, margen, proporción…') + '"></textarea>' +
        '<label>Categoría</label>' +
        '<select id="wr-c">' +
          '<option value="Diseño / UI / Layout"' + (!isText ? ' selected' : '') + '>Diseño / UI / Layout</option>' +
          '<option value="Contenido / Texto"' + (isText ? ' selected' : '') + '>Contenido / Texto</option>' +
          '<option value="Corrección Técnica / Producto">Corrección Técnica / Producto</option>' +
          '<option value="Otro">Otro</option>' +
        '</select>' +
        '<label>Comentario / Justificación</label>' +
        '<textarea id="wr-j" rows="2" placeholder="Motivo del cambio…"></textarea>' +
        '<div class="wr-actions">' +
          '<button class="wr-btn-cancel" id="wr-cancel">Cancelar</button>' +
          '<button class="wr-btn-save" id="wr-save">Guardar Nota</button>' +
        '</div>' +
        '<div class="wr-notice" id="wr-notice"></div>';

      modal.querySelectorAll('.wr-crumb').forEach(crumb => {
        crumb.addEventListener('click', function (e) {
          e.stopPropagation();
          const idx = parseInt(this.dataset.i, 10);
          focusEl = chain[idx];
          chain   = buildChain(focusEl);
          render();
        });
      });

      document.getElementById('wr-cancel').addEventListener('click', closeModal);
      document.getElementById('wr-save').addEventListener('click', doSave);
      setTimeout(() => { const u = document.getElementById('wr-u'); if (u) u.focus(); }, 40);
    }

    function doSave() {
      const user = (document.getElementById('wr-u').value || '').trim();
      const orig = (document.getElementById('wr-o').value || '').trim();
      const prop = (document.getElementById('wr-p').value || '').trim();
      const cat  = document.getElementById('wr-c').value;
      const com  = (document.getElementById('wr-j').value || '').trim();
      const notice = document.getElementById('wr-notice');

      if (!user) {
        notice.textContent = '⚠️ Añade tu nombre o email.';
        notice.className = 'wr-notice wr-warn';
        return;
      }

      currentUser = user;
      localStorage.setItem(LS_USER, user);

      const note = {
        id:             genId(),
        fecha:          new Date().toISOString(),
        proyecto:       cfg.projectName,
        usuario:        user,
        pagina:         snapSlide,
        seccion:        getCssSelector(focusEl.closest('.slide') || focusEl),
        tag:            getCssSelector(focusEl),
        texto_original: orig,
        texto_propuesto: prop,
        categoria:      cat,
        comentario:     com,
        situacion:      'Plan',
        resolucion:     ''
      };

      notes.push(note);
      saveNotes();
      postNote(note);

      if (cfg.webhookUrl) {
        notice.textContent  = '✅ Nota guardada y enviada a Google Sheets.';
        notice.className = 'wr-notice';
      } else {
        notice.textContent  = '💾 Guardada localmente. Configura el webhook en ⚙️ para sincronizar.';
        notice.className = 'wr-notice wr-warn';
      }

      setTimeout(closeModal, 1500);
    }

    function closeModal() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
    overlay.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') e.stopPropagation();
    });
    render();
  }

  function onClick(e) {
    if (mode !== 'comment') return;
    if (isOwn(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    openModal(e.target);
  }

  // ── Webhook ──────────────────────────────────────────────────────────────────

  function postNote(note) {
    const url = cfg.webhookUrl;
    if (!url) return;
    fetch(url, {
      method:  'POST',
      mode:    'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(note)
    }).catch(function () {});
  }

  // ── Settings ─────────────────────────────────────────────────────────────────

  function toggleSettings() {
    if (settingsEl && settingsEl.parentNode) { closeSettings(); } else { openSettings(); }
  }

  function openSettings() {
    closeSettings();
    settingsEl = document.createElement('div');
    settingsEl.id = 'wr-settings';
    const wh = cfg.webhookUrl || '';
    const n  = notes.length;
    settingsEl.innerHTML =
      '<h4>⚙️ Web Review — Opciones</h4>' +
      '<p style="margin:0 0 4px"><span class="wr-stat">' + n + '</span> nota' + (n !== 1 ? 's' : '') + ' guardada' + (n !== 1 ? 's' : '') + '.</p>' +
      '<label>Webhook Google Sheets (URL /exec)</label>' +
      '<input id="wr-wh" type="text" value="' + escAttr(wh) + '" placeholder="https://script.google.com/macros/s/.../exec">' +
      '<div class="wr-srow">' +
        '<button class="wr-sbtn" id="wr-swh">💾 Guardar URL</button>' +
        '<button class="wr-sbtn" id="wr-smd">📋 Markdown</button>' +
        '<button class="wr-sbtn" id="wr-sjson">⬇️ JSON</button>' +
      '</div>';
    document.body.appendChild(settingsEl);

    document.getElementById('wr-swh').addEventListener('click', function () {
      const v = (document.getElementById('wr-wh').value || '').trim();
      cfg.webhookUrl = v;
      localStorage.setItem('wr_webhook', v);
      this.textContent = '✅ Guardada';
      const btn = this;
      setTimeout(function () { if (btn.parentNode) btn.textContent = '💾 Guardar URL'; }, 1500);
    });

    document.getElementById('wr-smd').addEventListener('click', function () {
      navigator.clipboard.writeText(notesToMarkdown()).then(function () {
        const btn = document.getElementById('wr-smd');
        if (btn) { btn.textContent = '✅ Copiado'; setTimeout(function () { if (btn.parentNode) btn.textContent = '📋 Markdown'; }, 1500); }
      });
    });

    document.getElementById('wr-sjson').addEventListener('click', function () {
      const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = cfg.projectName + '-notas.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }

  function closeSettings() {
    if (settingsEl && settingsEl.parentNode) {
      settingsEl.parentNode.removeChild(settingsEl);
      settingsEl = null;
    }
  }

  // ── Export ───────────────────────────────────────────────────────────────────

  function notesToMarkdown() {
    if (!notes.length) return '> Sin notas registradas.';
    const cols = ['ID','Fecha','Slide','Tag','Original','Propuesta','Categoría','Comentario'];
    const rows = notes.map(function (n) {
      return [
        n.id, (n.fecha || '').slice(0,19).replace('T',' '), n.pagina, n.tag,
        (n.texto_original || '').slice(0,50), (n.texto_propuesto || '').slice(0,50),
        n.categoria, (n.comentario || '').slice(0,80)
      ];
    });
    const ws = cols.map(function (h, i) {
      return Math.max(h.length, Math.max.apply(null, rows.map(function (r) { return String(r[i] || '').length; })));
    });
    function pad(s, l) { return String(s || '').padEnd(l); }
    const hr   = ws.map(function (w) { return '-'.repeat(w); }).join(' | ');
    const head = cols.map(function (h, i) { return pad(h, ws[i]); }).join(' | ');
    const body = rows.map(function (r) { return r.map(function (c, i) { return pad(c, ws[i]); }).join(' | '); }).join('\n');
    return '# ' + cfg.projectName + ' — Notas de revisión\n\n' + head + '\n' + hr + '\n' + body;
  }

  // ── Init ─────────────────────────────────────────────────────────────────────

  function init() {
    injectStyles();
    createBar();
    createHud();

    document.addEventListener('mousemove',   onMouseMove, true);
    document.addEventListener('mouseleave',  onDocLeave,  true);
    document.addEventListener('click',       onClick,     true);

    document.addEventListener('keydown', function (e) {
      if (e.altKey && e.code === 'KeyC') {
        e.preventDefault();
        setMode(mode === 'nav' ? 'comment' : 'nav');
        return;
      }
      if (e.key === 'Escape') {
        const ov = document.getElementById('wr-overlay');
        if (ov) { ov.parentNode.removeChild(ov); return; }
        closeSettings();
        if (mode === 'comment') setMode('nav');
      }
    });

    // API pública para bookmarklet
    window.WebReview = {
      toggle:  function () { setMode(mode === 'nav' ? 'comment' : 'nav'); },
      setMode: setMode,
      getNotes: function () { return notes; }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
