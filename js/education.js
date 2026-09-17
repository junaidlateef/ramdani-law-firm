(function () {
  'use strict';

  function qs(name) {
    return new URLSearchParams(location.search).get(name);
  }
  function escape(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }
  function empty(el, key) {
    if (el) el.innerHTML = '<p class="empty">' + escape(window.ramdaniT ? ramdaniT(key) : 'Nothing published yet.') + '</p>';
  }

  async function listPublished(table, extra) {
    if (!window.sb) return [];
    var q = sb.from(table).select('*').eq('status', 'published');
    if (extra) q = extra(q);
    var res = await q.order('published_at', { ascending: false });
    if (res.error) { console.warn(res.error.message); return []; }
    return res.data || [];
  }

  async function renderInternships() {
    var el = document.getElementById('list');
    var rows = await listPublished('internships');
    if (!el) return;
    if (!rows.length) return empty(el, 'internships_empty');
    el.innerHTML = rows.map(function (r) {
      var meta = [r.location, r.mode, r.duration].filter(Boolean).join(' · ');
      return '<article class="card"><h3>' + escape(r.title) + '</h3><p>' + escape(r.summary || '') +
        '</p><p class="note">' + escape(meta) + '</p><a class="btn btn-primary" href="/pages/internship-apply.html?slug=' +
        encodeURIComponent(r.slug) + '">Apply</a></article>';
    }).join('');
  }

  async function bindInternshipApply() {
    var form = document.getElementById('internApplyForm');
    if (!form) return;
    var slug = qs('slug');
    var slugInput = form.querySelector('[name="internship_slug"]');
    if (slugInput && slug) slugInput.value = slug;
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var status = form.querySelector('.form-status');
      var hp = form.querySelector('[name="company_website"]');
      if (hp && hp.value) return;
      var internId = null;
      if (slug) {
        var found = await sb.from('internships').select('id').eq('slug', slug).eq('status', 'published').maybeSingle();
        internId = found.data && found.data.id;
      }
      var payload = {
        internship_id: internId,
        full_name: form.querySelector('[name="full_name"]').value.trim(),
        email: form.querySelector('[name="email"]').value.trim(),
        phone: (form.querySelector('[name="phone"]') || {}).value || null,
        education: (form.querySelector('[name="education"]') || {}).value || null,
        cover_letter: form.querySelector('[name="cover_letter"]').value.trim(),
        cv_url: (form.querySelector('[name="cv_url"]') || {}).value || null
      };
      if (!payload.full_name || !payload.email || !payload.cover_letter) {
        status.className = 'form-status err';
        status.textContent = ramdaniT('form_err');
        return;
      }
      var res = await sb.from('internship_applications').insert(payload);
      status.className = res.error ? 'form-status err' : 'form-status ok';
      status.textContent = res.error ? ramdaniT('form_err') : ramdaniT('form_ok');
      if (!res.error) form.reset();
    });
  }

  async function renderQuizzes() {
    var el = document.getElementById('list');
    var rows = await listPublished('quizzes');
    if (!el) return;
    if (!rows.length) return empty(el, 'quizzes_empty');
    el.innerHTML = rows.map(function (r) {
      return '<article class="card"><p class="kicker">' + escape((r.category || 'practice').toUpperCase()) +
        '</p><h3>' + escape(r.title) + '</h3><p>' + escape(r.summary || '') +
        '</p><a class="btn btn-primary" href="/pages/quiz.html?slug=' + encodeURIComponent(r.slug) + '">Start</a></article>';
    }).join('');
  }

  async function renderQuiz() {
    var slug = qs('slug');
    var form = document.getElementById('quizForm');
    if (!form || !slug || !window.sb) return;
    var quizRes = await sb.from('quizzes').select('*').eq('slug', slug).eq('status', 'published').maybeSingle();
    var quiz = quizRes.data;
    if (!quiz) {
      document.getElementById('quizTitle').textContent = 'Quiz not available';
      return;
    }
    document.getElementById('quizTitle').textContent = quiz.title;
    document.getElementById('quizSummary').textContent = quiz.summary || '';
    var qRes = await sb.from('quiz_questions_public').select('id, prompt, choices, sort_order').eq('quiz_id', quiz.id).order('sort_order');
    var questions = qRes.data || [];
    if (!questions.length) {
      form.innerHTML = '<p class="empty">No questions published yet.</p>';
      return;
    }
    form.innerHTML = questions.map(function (q, i) {
      var choices = Array.isArray(q.choices) ? q.choices : [];
      var opts = choices.map(function (c, idx) {
        return '<label><input type="radio" name="' + q.id + '" value="' + idx + '" required /> ' + escape(c) + '</label>';
      }).join('');
      return '<fieldset class="card"><legend>' + (i + 1) + '. ' + escape(q.prompt) + '</legend>' + opts + '</fieldset>';
    }).join('') + '<label>Email (optional, for staff follow-up)<input type="email" name="email" /></label><button class="btn btn-primary" type="submit">Submit</button><p class="form-status"></p>';
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var answers = {};
      questions.forEach(function (q) {
        var sel = form.querySelector('input[name="' + q.id + '"]:checked');
        if (sel) answers[q.id] = Number(sel.value);
      });
      var email = (form.querySelector('[name="email"]') || {}).value || null;
      var res = await sb.rpc('submit_ramdani_quiz', { p_quiz_id: quiz.id, p_answers: answers, p_email: email });
      var box = document.getElementById('quizResult');
      if (res.error) {
        box.hidden = false;
        box.textContent = res.error.message;
        return;
      }
      var data = res.data || {};
      box.hidden = false;
      box.innerHTML = '<h2>Score: ' + escape(data.score) + ' / ' + escape(data.total) + '</h2>';
    });
  }

  async function renderLibrary() {
    var el = document.getElementById('list');
    var rows = await listPublished('books');
    if (!el) return;
    if (!rows.length) return empty(el, 'library_empty');
    el.innerHTML = rows.map(function (r) {
      var access = r.access === 'paid' ? 'Paid — inquiry only' : 'Free listing';
      var action = r.access === 'free' && r.file_url
        ? '<a class="btn btn-primary" href="' + escape(r.file_url) + '" rel="noopener noreferrer">Open listing</a>'
        : '<a class="btn" href="/pages/contact.html">Inquire</a>';
      return '<article class="card"><p class="kicker">' + escape(access) + '</p><h3>' + escape(r.title) +
        '</h3><p>' + escape(r.summary || '') + '</p><p class="note">' + escape(r.author || '') + '</p>' + action + '</article>';
    }).join('');
  }

  function renderFaq() {
    var el = document.getElementById('faqList');
    if (!el) return;
    var items = [
      ['Does this website create a lawyer–client relationship?', 'No. Public pages and forms are informational. A professional relationship starts only if the firm confirms an engagement.'],
      ['Can I send confidential case documents here?', 'No. Do not upload privileged files to public forms. Use a channel the firm confirms after contact.'],
      ['Are LAT/GAT quizzes official papers?', 'No. They are optional practice materials published by staff. They are not affiliated with any testing authority.'],
      ['How do internships work?', 'Published listings appear on the Internships page. Applications go to staff for review. There is no automatic selection.'],
      ['Are books sold on this site?', 'Free titles may be listed with a link. Paid titles are inquiry-only. Card checkout is not enabled.']
    ];
    items.push(['Are study modules a complete LLB course?', 'No. They are a public study map. Staff add topics, quizzes, and verified case notes over time.']);
    items.push(['Are case citations guaranteed accurate?', 'Only notes marked verified by staff are public. Unverified citations are hidden.']);
    items.push(['Do you host copyrighted law books as PDFs?', 'No. Library and statute pages list titles and official links. Paid or copyrighted books are inquiry-only.']);
    el.innerHTML = items.map(function (it) {
      return '<details class="card"><summary><strong>' + escape(it[0]) + '</strong></summary><p>' + escape(it[1]) + '</p></details>';
    }).join('');
  }

  function catLabel(c) {
    return ({ llb: 'LLB', lat: 'LAT', gat: 'GAT', pakistan_law: 'Pakistan law', skills: 'Skills' }[c] || c || '');
  }

  async function renderModules() {
    var el = document.getElementById('list');
    var filters = document.getElementById('filters');
    var rows = await listPublished('modules');
    if (filters) {
      var cats = ['all', 'llb', 'lat', 'gat', 'pakistan_law', 'skills'];
      filters.innerHTML = cats.map(function (c) {
        return '<button type="button" class="btn" data-cat="' + c + '">' + (c === 'all' ? 'All' : catLabel(c)) + '</button>';
      }).join('');
      filters.querySelectorAll('[data-cat]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var cat = btn.getAttribute('data-cat');
          var shown = cat === 'all' ? rows : rows.filter(function (r) { return r.category === cat; });
          paintModules(el, shown);
        });
      });
    }
    paintModules(el, rows);
  }

  function paintModules(el, rows) {
    if (!el) return;
    if (!rows.length) return empty(el, 'modules_empty');
    el.innerHTML = rows.map(function (r) {
      var meta = [r.code, catLabel(r.category), r.semester ? ('Semester ' + r.semester) : ''].filter(Boolean).join(' · ');
      return '<article class="card"><p class="kicker">' + escape(meta) + '</p><h3>' + escape(r.title) +
        '</h3><p>' + escape(r.summary || '') + '</p><a class="btn btn-primary" href="/pages/module.html?slug=' +
        encodeURIComponent(r.slug) + '">Open outline</a></article>';
    }).join('');
  }

  function listItems(val) {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string' && val.trim()) {
      try { var p = JSON.parse(val); if (Array.isArray(p)) return p; } catch (e) {}
    }
    return [];
  }

  async function renderModule() {
    var slug = qs('slug');
    if (!slug || !window.sb) return;
    var res = await sb.from('modules').select('*').eq('slug', slug).eq('status', 'published').maybeSingle();
    var m = res.data;
    if (!m) {
      document.getElementById('modTitle').textContent = 'Module not available';
      return;
    }
    document.getElementById('modTitle').textContent = m.title;
    document.getElementById('modSummary').textContent = m.summary || '';
    var outcomes = listItems(m.learning_outcomes);
    var topics = listItems(m.topics);
    var readings = listItems(m.readings);
    var quizzes = [];
    var cases = [];
    var qRes = await sb.from('quizzes').select('title,slug,summary,category').eq('status', 'published').eq('module_id', m.id);
    quizzes = qRes.data || [];
    var cRes = await sb.from('cases').select('title,slug,citation,court,year').eq('status', 'published').eq('citation_status', 'verified').eq('module_id', m.id);
    cases = cRes.data || [];
    var html = '';
    html += '<p class="note">' + escape([m.code, catLabel(m.category), m.semester ? ('Semester ' + m.semester) : '', m.credit_hours ? (m.credit_hours + ' credit hours') : ''].filter(Boolean).join(' · ')) + '</p>';
    if (m.description) html += '<p>' + escape(m.description) + '</p>';
    if (outcomes.length) {
      html += '<h2>Learning outcomes</h2><ul>' + outcomes.map(function (o) { return '<li>' + escape(typeof o === 'string' ? o : (o.text || JSON.stringify(o))) + '</li>'; }).join('') + '</ul>';
    }
    if (topics.length) {
      html += '<h2>Topics</h2><ol>' + topics.map(function (o) { return '<li>' + escape(typeof o === 'string' ? o : (o.title || JSON.stringify(o))) + '</li>'; }).join('') + '</ol>';
    } else {
      html += '<p class="empty">Topic list will appear when staff publish it.</p>';
    }
    if (readings.length) {
      html += '<h2>Recommended readings</h2><ul>' + readings.map(function (o) {
        var label = typeof o === 'string' ? o : (o.title || o.name || '');
        var extra = typeof o === 'object' && o && o.author ? (' — ' + o.author) : '';
        return '<li>' + escape(label + extra) + '</li>';
      }).join('') + '</ul>';
    }
    html += '<h2>Practice quizzes</h2>';
    if (quizzes.length) {
      html += quizzes.map(function (q) {
        return '<article class="card"><h3>' + escape(q.title) + '</h3><p>' + escape(q.summary || '') +
          '</p><a class="btn" href="/pages/quiz.html?slug=' + encodeURIComponent(q.slug) + '">Start</a></article>';
      }).join('');
    } else {
      html += '<p class="empty">No practice quiz is linked to this module yet.</p>';
    }
    html += '<h2>Verified case notes</h2>';
    if (cases.length) {
      html += cases.map(function (c) {
        return '<article class="card"><h3>' + escape(c.title) + '</h3><p class="note">' + escape([c.citation, c.court, c.year].filter(Boolean).join(' · ')) +
          '</p><a class="btn" href="/pages/case.html?slug=' + encodeURIComponent(c.slug) + '">Read note</a></article>';
      }).join('');
    } else {
      html += '<p class="empty">No verified case note is linked yet. Unverified citations are not shown.</p>';
    }
    document.getElementById('modBody').innerHTML = html;
  }

  async function renderCases() {
    var el = document.getElementById('list');
    if (!window.sb) return empty(el, 'cases_empty');
    var res = await sb.from('cases').select('title,slug,citation,court,year').eq('status', 'published').eq('citation_status', 'verified').order('year', { ascending: false });
    var rows = res.data || [];
    if (!rows.length) return empty(el, 'cases_empty');
    el.innerHTML = rows.map(function (r) {
      return '<article class="card"><p class="kicker">' + escape([r.citation, r.court, r.year].filter(Boolean).join(' · ')) +
        '</p><h3>' + escape(r.title) + '</h3><a class="btn btn-primary" href="/pages/case.html?slug=' +
        encodeURIComponent(r.slug) + '">Read note</a></article>';
    }).join('');
  }

  async function renderCase() {
    var slug = qs('slug');
    var el = document.getElementById('caseBody');
    if (!el || !slug || !window.sb) return;
    var res = await sb.from('cases').select('*').eq('slug', slug).eq('status', 'published').eq('citation_status', 'verified').maybeSingle();
    var c = res.data;
    if (!c) { el.innerHTML = '<p class="empty">This case note is not available.</p>'; return; }
    var bits = [
      ['Citation', c.citation],
      ['Court', c.court],
      ['Year', c.year],
      ['Bench', c.bench],
      ['Facts', c.facts],
      ['Issues', c.issues],
      ['Decision', c.decision],
      ['Ratio decidendi', c.ratio],
      ['Relevance', c.relevance]
    ];
    el.innerHTML = '<h1>' + escape(c.title) + '</h1>' + bits.map(function (b) {
      if (!b[1]) return '';
      return '<h2>' + escape(b[0]) + '</h2><p>' + escape(b[1]) + '</p>';
    }).join('') + (c.source_url ? '<p><a href="' + escape(c.source_url) + '" rel="noopener noreferrer">Source</a></p>' : '');
  }

  async function renderStatutes() {
    var el = document.getElementById('list');
    var rows = await listPublished('statutes');
    if (!el) return;
    if (!rows.length) return empty(el, 'statutes_empty');
    el.innerHTML = rows.map(function (r) {
      var action = r.official_url
        ? '<a class="btn btn-primary" href="' + escape(r.official_url) + '" rel="noopener noreferrer">Official source</a>'
        : '<p class="note">Ask staff to add an official source link. Full unofficial PDFs are not hosted here.</p>';
      return '<article class="card"><p class="kicker">' + escape([r.jurisdiction, r.year].filter(Boolean).join(' · ')) +
        '</p><h3>' + escape(r.title) + '</h3><p>' + escape(r.summary || '') + '</p>' + action + '</article>';
    }).join('');
  }

  window.ramdaniEducation = {
    renderInternships: renderInternships,
    bindInternshipApply: bindInternshipApply,
    renderQuizzes: renderQuizzes,
    renderQuiz: renderQuiz,
    renderLibrary: renderLibrary,
    renderFaq: renderFaq,
    renderModules: renderModules,
    renderModule: renderModule,
    renderCases: renderCases,
    renderCase: renderCase,
    renderStatutes: renderStatutes
  };
})();
