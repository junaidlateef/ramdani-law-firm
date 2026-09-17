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

  function formatDate(value) {
    if (!value) return '';
    var d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function modeLabel(mode) {
    return ({ onsite: 'On-site', remote: 'Remote', hybrid: 'Hybrid' }[mode] || mode || '');
  }

  async function renderInternships() {
    var el = document.getElementById('list');
    var rows = await listPublished('internships');
    if (!el) return;
    if (!rows.length) return empty(el, 'internships_empty');
    el.innerHTML = rows.map(function (r) {
      var chips = [modeLabel(r.mode), r.location, r.duration].filter(Boolean).map(function (c) {
        return '<span>' + escape(c) + '</span>';
      }).join('');
      var deadline = r.deadline ? ('Deadline: ' + formatDate(r.deadline)) : 'Deadline: rolling, if published';
      var stipend = r.stipend_note || 'Stipend: not stated';
      var body = r.body ? '<p>' + escape(r.body).slice(0, 420) + '</p>' : '';
      return '<article class="internship-card">' +
        '<div class="internship-head"><div><h3>' + escape(r.title) + '</h3>' +
        '<div class="internship-meta">' + chips + '</div></div></div>' +
        '<p>' + escape(r.summary || '') + '</p>' + body +
        '<div class="internship-foot"><p class="note">' + escape(stipend) + ' · ' + escape(deadline) +
        '</p><a class="btn btn-primary" href="/pages/internship-apply.html?slug=' +
        encodeURIComponent(r.slug) + '">Apply</a></div></article>';
    }).join('');
  }

  async function bindInternshipApply() {
    var form = document.getElementById('internApplyForm');
    if (!form) return;
    var slug = qs('slug');
    var slugInput = form.querySelector('[name="internship_slug"]');
    if (slugInput && slug) slugInput.value = slug;
    var listing = document.getElementById('internListing');
    if (slug && window.sb) {
      var found = await sb.from('internships').select('title, summary, location, mode, duration, stipend_note, deadline, status').eq('slug', slug).eq('status', 'published').maybeSingle();
      if (found.data && listing) {
        listing.hidden = false;
        listing.innerHTML = '<h2>' + escape(found.data.title) + '</h2><p>' + escape(found.data.summary || '') +
          '</p><p class="note">' + escape([found.data.location, modeLabel(found.data.mode), found.data.duration, found.data.stipend_note, found.data.deadline ? ('Deadline ' + formatDate(found.data.deadline)) : ''].filter(Boolean).join(' · ')) + '</p>';
      } else if (listing && slug) {
        listing.hidden = false;
        listing.innerHTML = '<p class="empty">This listing is not published. You can still send a general training inquiry below.</p>';
      }
    }
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
      var educationBits = [
        (form.querySelector('[name="university"]') || {}).value,
        (form.querySelector('[name="degree"]') || {}).value,
        (form.querySelector('[name="semester"]') || {}).value,
        (form.querySelector('[name="education"]') || {}).value
      ].filter(function (v) { return v && String(v).trim(); }).map(function (v) { return String(v).trim(); });
      var cv = ((form.querySelector('[name="cv_url"]') || {}).value || '').trim();
      if (cv) {
        try {
          var u = new URL(cv);
          if (u.protocol !== 'https:') cv = '';
        } catch (_) { cv = ''; }
      }
      var payload = {
        internship_id: internId,
        full_name: form.querySelector('[name="full_name"]').value.trim(),
        email: form.querySelector('[name="email"]').value.trim(),
        phone: (form.querySelector('[name="phone"]') || {}).value || null,
        education: educationBits.length ? educationBits.join(' · ') : null,
        cover_letter: form.querySelector('[name="cover_letter"]').value.trim(),
        cv_url: cv || null
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
    if (window.ramdaniSeo) {
      var qTitle = quiz.title + ' — Ramdani Law Firm';
      window.ramdaniSeo.setTitle(qTitle);
      window.ramdaniSeo.setDescription((quiz.summary || 'Optional staff-published practice quiz. Not an official LAT/GAT paper.').slice(0, 160));
      window.ramdaniSeo.setCanonical(window.ramdaniSeo.origin + '/pages/quiz.html?slug=' + encodeURIComponent(quiz.slug));
      window.ramdaniSeo.setBreadcrumb([
        { name: 'Home', url: window.ramdaniSeo.origin + '/' },
        { name: 'LAT / GAT', url: window.ramdaniSeo.origin + '/pages/quizzes.html' },
        { name: quiz.title, url: window.ramdaniSeo.origin + '/pages/quiz.html?slug=' + encodeURIComponent(quiz.slug) }
      ]);
    }
    var qRes = await sb.from('quiz_questions_public').select('id, prompt, choices, sort_order').eq('quiz_id', quiz.id).order('sort_order');
    var questions = qRes.data || [];
    if (!questions.length) {
      form.innerHTML = '<p class="empty">No questions published yet.</p>';
      return;
    }
    var letters = ['A', 'B', 'C', 'D'];
    form.classList.add('quiz-compact');
    form.innerHTML = questions.map(function (q, i) {
      var choices = Array.isArray(q.choices) ? q.choices : [];
      var opts = choices.map(function (c, idx) {
        return '<button type="button" class="mcq-opt" data-q="' + q.id + '" data-idx="' + idx + '">' +
          '<span class="opt-label">' + letters[idx] + '</span>' +
          '<span class="opt-text">' + escape(c) + '</span>' +
          '<span class="opt-tick" aria-hidden="true">✓</span></button>';
      }).join('');
      return '<fieldset class="card mcq" data-id="' + q.id + '"><legend class="mcq-head"><span class="mcq-num">' + (i + 1) + '</span><span class="mcq-q">' + escape(q.prompt) + '</span></legend><div class="mcq-options">' + opts + '</div><div class="mcq-explanation"></div></fieldset>';
    }).join('') + '<label>Email (optional, for staff follow-up)<input type="email" name="email" /></label><div class="quiz-footer"><p class="form-status" id="quizScore">' + escape(window.ramdaniT ? ramdaniT('quiz_not_submitted') : 'Not submitted') + '</p><button class="btn btn-primary" type="submit">' + escape(window.ramdaniT ? ramdaniT('quiz_submit') : 'Submit') + '</button></div>';
    form.querySelectorAll('.mcq-opt').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (form.dataset.submitted === '1') return;
        var qid = btn.getAttribute('data-q');
        form.querySelectorAll('.mcq-opt[data-q="' + qid + '"]').forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
      });
    });
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (form.dataset.submitted === '1') return;
      var answers = {};
      var missing = false;
      questions.forEach(function (q) {
        var sel = form.querySelector('.mcq-opt.selected[data-q="' + q.id + '"]');
        if (!sel) missing = true;
        else answers[q.id] = Number(sel.getAttribute('data-idx'));
      });
      var status = form.querySelector('#quizScore');
      if (missing) {
        status.className = 'form-status err';
        status.textContent = 'Answer every question before submitting.';
        return;
      }
      var email = (form.querySelector('[name="email"]') || {}).value || null;
      var res = await sb.rpc('submit_ramdani_quiz', { p_quiz_id: quiz.id, p_answers: answers, p_email: email });
      var box = document.getElementById('quizResult');
      if (res.error) {
        if (box) { box.hidden = false; box.textContent = res.error.message; }
        status.className = 'form-status err';
        status.textContent = res.error.message;
        return;
      }
      var data = res.data || {};
      form.dataset.submitted = '1';
      var byId = {};
      (data.explanations || []).forEach(function (ex) { byId[ex.id] = ex; });
      questions.forEach(function (q) {
        var ex = byId[q.id] || {};
        var field = form.querySelector('.mcq[data-id="' + q.id + '"]');
        if (!field) return;
        field.classList.add('revealed');
        field.querySelectorAll('.mcq-opt').forEach(function (btn) {
          var idx = Number(btn.getAttribute('data-idx'));
          if (ex.correct != null && idx === Number(ex.correct)) btn.classList.add('correct-answer');
          else if (idx === answers[q.id]) btn.classList.add('wrong-answer');
        });
        var expl = field.querySelector('.mcq-explanation');
        if (expl && ex.explanation) expl.textContent = ex.explanation;
      });
      status.className = 'form-status ok';
      status.innerHTML = 'Score: <strong>' + escape(data.score) + '</strong> / ' + escape(data.total);
      if (box) {
        box.hidden = false;
        box.innerHTML = '<h2>Score: ' + escape(data.score) + ' / ' + escape(data.total) + '</h2>';
      }
      var submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Submitted'; }
    });
  }

  async function renderHome() {
    var grid = document.getElementById('semesterGrid');
    var stats = document.getElementById('heroStats');
    var modules = await listPublished('modules');
    var quizzes = await listPublished('quizzes');
    if (stats) {
      var sems = {};
      modules.forEach(function (m) { if (m.semester) sems[m.semester] = true; });
      stats.innerHTML =
        '<div><strong>' + modules.length + '</strong><span>Published modules</span></div>' +
        '<div><strong>' + Object.keys(sems).length + '</strong><span>Semesters with outlines</span></div>' +
        '<div><strong>' + quizzes.length + '</strong><span>Practice quizzes</span></div>';
    }
    if (!grid) return;
    var bySem = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] };
    modules.forEach(function (m) {
      if (bySem[m.semester]) bySem[m.semester].push(m);
    });
    grid.innerHTML = [1,2,3,4,5,6,7,8].map(function (n) {
      var rows = bySem[n];
      var codes = rows.slice(0, 3).map(function (r) { return '<span>' + escape(r.code || '') + '</span>'; }).join('');
      var extra = rows.length > 3 ? '<span>+' + (rows.length - 3) + '</span>' : '';
      return '<article class="sem-card"><a href="/pages/modules.html"><div class="sem-card-num">0' + n + '</div><h3>Semester ' + n + '</h3><p>' + rows.length + ' published outlines</p><div class="sem-modules">' + codes + extra + '</div></a></article>';
    }).join('');
  }

  function safeHttpUrl(value) {
    if (!value) return '';
    try {
      var u = new URL(value, location.origin);
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return '';
      return u.href;
    } catch (_) { return ''; }
  }

  async function renderLibrary() {
    var el = document.getElementById('list');
    var filters = document.getElementById('libraryFilters');
    var pager = document.getElementById('libraryPager');
    if (!el) return;
    var rows = await listPublished('books');
    var pageSize = 12;
    var page = 1;
    var dialog = document.getElementById('bookInquiry');
    var form = document.getElementById('bookInquiryForm');
    var activeBook = null;

    function closeInquiry() {
      if (dialog && dialog.close) dialog.close();
      else if (dialog) dialog.hidden = true;
      activeBook = null;
    }

    function openInquiry(book) {
      activeBook = book;
      var title = document.getElementById('bookInquiryTitle');
      if (title) title.textContent = book.access === 'paid' ? 'Inquiry for a paid title' : 'Request this listing';
      var hint = document.getElementById('bookInquiryHint');
      if (hint) hint.textContent = (book.title || '') + ' — staff will reply. This is not checkout and not a download of a copyrighted PDF.';
      var kind = form && form.querySelector('[name="kind"]');
      if (kind) kind.value = book.access === 'paid' ? 'purchase_inquiry' : 'download';
      if (form) {
        form.reset();
        if (kind) kind.value = book.access === 'paid' ? 'purchase_inquiry' : 'download';
        var status = form.querySelector('.form-status');
        if (status) { status.className = 'form-status'; status.textContent = ''; }
      }
      if (dialog && dialog.showModal) dialog.showModal();
      else if (dialog) dialog.hidden = false;
    }

    if (form && !form.dataset.bound) {
      form.dataset.bound = '1';
      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        var status = form.querySelector('.form-status');
        var hp = form.querySelector('[name="company_website"]');
        if (hp && hp.value) return;
        var payload = {
          book_id: activeBook && activeBook.id ? activeBook.id : null,
          kind: (form.querySelector('[name="kind"]') || {}).value || 'purchase_inquiry',
          full_name: form.querySelector('[name="full_name"]').value.trim(),
          email: form.querySelector('[name="email"]').value.trim(),
          message: (form.querySelector('[name="message"]') || {}).value || null
        };
        if (!payload.full_name || !payload.email) {
          status.className = 'form-status err';
          status.textContent = ramdaniT('form_err');
          return;
        }
        var res = await sb.from('book_requests').insert(payload);
        status.className = res.error ? 'form-status err' : 'form-status ok';
        status.textContent = res.error ? ramdaniT('form_err') : ramdaniT('form_ok');
        if (!res.error) {
          form.reset();
          setTimeout(closeInquiry, 900);
        }
      });
      var cancel = document.getElementById('bookInquiryCancel');
      if (cancel) cancel.addEventListener('click', closeInquiry);
    }

    function filtered() {
      var q = ((document.getElementById('librarySearch') || {}).value || '').trim().toLowerCase();
      var access = ((document.getElementById('libraryAccess') || {}).value || '');
      return rows.filter(function (r) {
        if (access && r.access !== access) return false;
        if (!q) return true;
        var hay = [r.title, r.author, r.summary, r.language, r.price_note].join(' ').toLowerCase();
        return hay.indexOf(q) !== -1;
      });
    }

    function paint() {
      var shown = filtered();
      var pages = Math.max(1, Math.ceil(shown.length / pageSize));
      if (page > pages) page = pages;
      var slice = shown.slice((page - 1) * pageSize, page * pageSize);
      if (!shown.length) {
        empty(el, 'library_empty');
        if (pager) pager.innerHTML = '';
        return;
      }
      el.innerHTML = slice.map(function (r) {
        var paid = r.access === 'paid';
        var badge = paid ? 'Paid — inquiry only' : 'Free listing';
        var cover = safeHttpUrl(r.cover_url);
        var file = safeHttpUrl(r.file_url);
        var media = cover
          ? '<img class="book-cover-img" src="' + escape(cover) + '" alt="" />'
          : '<div class="book-cover-fallback" aria-hidden="true">' + escape((r.title || '?').charAt(0)) + '</div>';
        var action;
        if (!paid && file) {
          action = '<a class="btn btn-primary" href="' + escape(file) + '" rel="noopener noreferrer">Open listing</a>';
        } else {
          action = '<button type="button" class="btn' + (paid ? '' : ' btn-primary') + '" data-inquire="' + escape(r.id) + '">' + (paid ? 'Inquire' : 'Request listing') + '</button>';
        }
        var meta = [r.author, r.language, r.price_note].filter(Boolean).join(' · ');
        return '<article class="book-card" data-id="' + escape(r.id) + '">' +
          '<div class="book-cover"><span class="book-badge ' + (paid ? 'paid' : 'free') + '">' + escape(badge) + '</span>' + media + '</div>' +
          '<div class="book-info"><h3>' + escape(r.title) + '</h3>' +
          (r.summary ? '<p>' + escape(r.summary) + '</p>' : '') +
          (meta ? '<p class="book-author">' + escape(meta) + '</p>' : '') +
          action + '</div></article>';
      }).join('');
      el.querySelectorAll('[data-inquire]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-inquire');
          var book = rows.filter(function (r) { return r.id === id; })[0];
          if (book) openInquiry(book);
        });
      });
      if (pager) {
        if (pages <= 1) { pager.innerHTML = ''; return; }
        pager.innerHTML = Array.from({ length: pages }, function (_, i) {
          var n = i + 1;
          return '<button type="button" class="' + (n === page ? 'active' : '') + '" data-page="' + n + '">' + n + '</button>';
        }).join('');
        pager.querySelectorAll('[data-page]').forEach(function (btn) {
          btn.addEventListener('click', function () { page = Number(btn.getAttribute('data-page')); paint(); });
        });
      }
    }

    if (filters && !filters.dataset.bound) {
      filters.dataset.bound = '1';
      ['librarySearch', 'libraryAccess'].forEach(function (id) {
        var node = document.getElementById(id);
        if (!node) return;
        node.addEventListener('input', function () { page = 1; paint(); });
        node.addEventListener('change', function () { page = 1; paint(); });
      });
    }
    paint();
  }

  function renderFaq() {
    var el = document.getElementById('faqList');
    if (!el) return;
    var items = [
      ['Does this website create a lawyer–client relationship?', 'No. Public pages and forms are informational. A professional relationship starts only if the firm confirms an engagement in writing.'],
      ['Can I send confidential case documents here?', 'No. Do not upload privileged files or sensitive case facts to public forms. Use a channel the firm confirms after first contact.'],
      ['Where is the firm based?', 'Dera Ghazi Khan, Punjab, Pakistan. A street address, phone, and email will appear when the firm publishes them. Until then, use the contact form.'],
      ['Do you guarantee case results?', 'No. This site does not publish win rates, fake reviews, or guaranteed outcomes.'],
      ['How do I request a consultation?', 'Use the consultation or contact form with your name, email, a short subject, and a non-privileged summary. Staff will reply using the details you give.'],
      ['What is civil law work on this site?', 'A published outline of civil disputes and procedure (CPC and related statutes). It is not a filing and not advice on your facts.'],
      ['Will you take every criminal matter?', 'No. Criminal instructions are accepted only after conflict checks and a confirmed engagement. Public forms are not a retainer.'],
      ['Do you handle family cases?', 'Family-law outlines refer to MFLO and family-court procedure. Whether the firm can act in a particular matter is confirmed only in writing.'],
      ['Can I upload property documents on the website?', 'No. Title deeds and mutation papers should wait until the firm asks for them on a confirmed channel.'],
      ['Are LAT/GAT quizzes official papers?', 'No. They are optional practice materials published by staff. They are not affiliated with any testing authority.'],
      ['Are case citations on the study pages verified?', 'Only notes marked verified by staff are public. Unverified or generated citations stay hidden.'],
      ['Do you sell law books or take card payments here?', 'No. Paid titles are inquiry-only. This website does not process checkout or card payments.'],
      ['How do internships work?', 'Published listings appear on the Internships page. Applications go to staff for review. There is no automatic selection and no fake placements.'],
      ['Is the study-module catalogue a university degree?', 'No. It is a public study map. Staff add topics, quizzes, and verified case notes over time.'],
      ['In which languages is the site available?', 'Public pages support English and Urdu. Advocate language skills are listed only on published profiles.']
    ]
    items.push(['Are study modules a complete LLB course?', 'No. They are a public study map. Staff add topics, quizzes, and verified case notes over time.']);
    items.push(['Are case citations guaranteed accurate?', 'Only notes marked verified by staff are public. Unverified citations are hidden.']);
    items.push(['Do you host copyrighted law books as PDFs?', 'No. Library and statute pages list titles and official links. Paid or copyrighted books are inquiry-only.']);
    el.innerHTML = items.map(function (it) {
      return '<details class="card"><summary><strong>' + escape(it[0]) + '</strong></summary><p>' + escape(it[1]) + '</p></details>';
    }).join('');
    if (window.ramdaniSeo) window.ramdaniSeo.setFAQSchema(items);
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
    var certs = [];
    var certRes = await sb.from('certificates').select('title,slug,summary,category').eq('status', 'published').eq('module_id', m.id);
    certs = certRes.data || [];
    html += '<h2>Linked certificates</h2>';
    if (certs.length) {
      html += certs.map(function (c) {
        return '<article class="card"><p class="kicker">' + escape(catLabel(c.category)) + '</p><h3>' + escape(c.title) +
          '</h3><p>' + escape(c.summary || '') + '</p><p class="note">Study outline only. Completing a quiz does not issue a certificate.</p>' +
          '<a class="btn" href="/pages/certificates.html">All certificates</a></article>';
      }).join('');
    } else {
      html += '<p class="empty">No certificate listing is linked to this module yet.</p>';
    }
    document.getElementById('modBody').innerHTML = html;
    if (window.ramdaniSeo) {
      window.ramdaniSeo.setCourseSchema(m);
      window.ramdaniSeo.setBreadcrumb([
        { name: 'Home', url: window.ramdaniSeo.origin + '/' },
        { name: 'Study modules', url: window.ramdaniSeo.origin + '/pages/modules.html' },
        { name: m.title, url: window.ramdaniSeo.origin + '/pages/module.html?slug=' + encodeURIComponent(m.slug) }
      ]);
    }
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
    if (window.ramdaniSeo) {
      window.ramdaniSeo.setTitle(c.title + ' — Ramdani Law Firm');
      window.ramdaniSeo.setDescription((c.citation || c.facts || 'Verified case note.').toString().slice(0, 160));
      window.ramdaniSeo.setCanonical(window.ramdaniSeo.origin + '/pages/case.html?slug=' + encodeURIComponent(c.slug));
      window.ramdaniSeo.setBreadcrumb([
        { name: 'Home', url: window.ramdaniSeo.origin + '/' },
        { name: 'Case notes', url: window.ramdaniSeo.origin + '/pages/cases.html' },
        { name: c.title, url: window.ramdaniSeo.origin + '/pages/case.html?slug=' + encodeURIComponent(c.slug) }
      ]);
    }
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


  function youtubeIdFrom(url) {
    if (!url) return '';
    try {
      var u = new URL(url);
      if (u.protocol !== 'https:') return '';
      var host = u.hostname.replace(/^www\./, '');
      if (host === 'youtu.be') return (u.pathname.split('/')[1] || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 11);
      if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
        if (u.searchParams.get('v')) return u.searchParams.get('v').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 11);
        var parts = u.pathname.split('/').filter(Boolean);
        if ((parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live') && parts[1]) {
          return parts[1].replace(/[^A-Za-z0-9_-]/g, '').slice(0, 11);
        }
      }
    } catch (_) {}
    return '';
  }

  function bindJoinForm(kind) {
    var form = document.getElementById('joinForm');
    var dialog = document.getElementById('joinDialog');
    if (!form || form.dataset.bound) return;
    form.dataset.bound = '1';
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var status = form.querySelector('.form-status');
      var hp = form.querySelector('[name="company_website"]');
      if (hp && hp.value) return;
      var seatRaw = (form.querySelector('[name="seat_no"]') || {}).value;
      var cabId = (form.querySelector('[name="cabinet_id"]') || {}).value || null;
      var payload = {
        kind: (form.querySelector('[name="kind"]') || {}).value || kind,
        listing_slug: (form.querySelector('[name="listing_slug"]') || {}).value || null,
        cabinet_id: cabId ? cabId : null,
        seat_no: seatRaw ? Number(seatRaw) : null,
        full_name: form.querySelector('[name="full_name"]').value.trim(),
        email: form.querySelector('[name="email"]').value.trim(),
        message: (form.querySelector('[name="message"]') || {}).value || null
      };
      if (payload.kind === 'cabinet' && (!payload.cabinet_id || !payload.seat_no || payload.seat_no < 1 || payload.seat_no > 10)) {
        status.className = 'form-status err';
        status.textContent = 'Choose an open seat (1–10) before sending an inquiry.';
        return;
      }
      if (!payload.full_name || !payload.email) {
        status.className = 'form-status err';
        status.textContent = ramdaniT('form_err');
        return;
      }
      var res = await sb.from('join_requests').insert(payload);
      status.className = res.error ? 'form-status err' : 'form-status ok';
      status.textContent = res.error ? ramdaniT('form_err') : ramdaniT('form_ok');
      if (!res.error) {
        form.reset();
        setTimeout(function () { if (dialog && dialog.close) dialog.close(); }, 900);
      }
    });
    var cancel = document.getElementById('joinCancel');
    if (cancel) cancel.addEventListener('click', function () { if (dialog && dialog.close) dialog.close(); });
  }

  function openJoin(kind, slug, title, extra) {
    extra = extra || {};
    var dialog = document.getElementById('joinDialog');
    var form = document.getElementById('joinForm');
    if (!dialog || !form) return;
    form.querySelector('[name="kind"]').value = kind;
    form.querySelector('[name="listing_slug"]').value = slug || '';
    var cab = form.querySelector('[name="cabinet_id"]');
    var seat = form.querySelector('[name="seat_no"]');
    if (cab) cab.value = extra.cabinet_id || '';
    if (seat) seat.value = extra.seat_no || '';
    var h = document.getElementById('joinTitle');
    if (h) h.textContent = extra.seat_no ? ('Seat ' + extra.seat_no + ' — ' + (title || kind)) : ('Inquiry — ' + (title || kind));
    var hint = document.getElementById('joinHint');
    if (hint) hint.textContent = extra.seat_no
      ? 'Inquiry for one published seat (1–10). Staff review it. This does not enrol you or issue a student card.'
      : 'Staff will reply. This does not create membership, a chapter, or a lawyer–client relationship.';
    if (dialog.showModal) dialog.showModal();
  }

  async function cabinetsFor(kind, parentIds) {
    if (!parentIds.length || !window.sb) return { byParent: {}, seatsByCab: {} };
    var q = sb.from('cabinets').select('*').eq('status', 'published');
    q = kind === 'society' ? q.in('society_id', parentIds) : q.in('chapter_id', parentIds);
    var cabRes = await q.order('title');
    var cabs = cabRes.data || [];
    var ids = cabs.map(function (c) { return c.id; });
    var seats = [];
    if (ids.length) {
      var sRes = await sb.from('cabinet_seats').select('id, cabinet_id, seat_no, label, status, note').in('cabinet_id', ids).order('seat_no');
      seats = sRes.data || [];
    }
    var seatsByCab = {};
    seats.forEach(function (s) {
      (seatsByCab[s.cabinet_id] = seatsByCab[s.cabinet_id] || []).push(s);
    });
    var byParent = {};
    cabs.forEach(function (c) {
      var pid = kind === 'society' ? c.society_id : c.chapter_id;
      (byParent[pid] = byParent[pid] || []).push(c);
    });
    return { byParent: byParent, seatsByCab: seatsByCab };
  }

  function paintCabinet(c, seatsByCab, parentSlug) {
    var seats = (seatsByCab[c.id] || []).slice().sort(function (a, b) { return a.seat_no - b.seat_no; });
    var limit = Math.min(10, Math.max(1, Number(c.seat_limit) || 10));
    var map = {};
    seats.forEach(function (s) { if (s.seat_no >= 1 && s.seat_no <= limit) map[s.seat_no] = s; });
    var open = 0;
    var chips = '';
    for (var n = 1; n <= limit; n++) {
      var s = map[n] || { seat_no: n, status: 'open' };
      var st = s.status || 'open';
      if (st === 'open') open += 1;
      var cls = 'seat-chip ' + st;
      var label = s.label ? (n + ' · ' + s.label) : String(n);
      if (st === 'open') {
        chips += '<button type="button" class="' + cls + '" data-cab="' + escape(c.id) + '" data-seat="' + n + '" data-title="' + escape(c.title) + '" data-parent="' + escape(parentSlug || '') + '">Seat ' + escape(label) + '</button>';
      } else {
        chips += '<span class="' + cls + '">Seat ' + escape(label) + ' · ' + escape(st) + '</span>';
      }
    }
    return '<div class="cabinet-card"><h4>' + escape(c.title) + '</h4>' +
      (c.summary ? '<p>' + escape(c.summary) + '</p>' : '') +
      '<p class="note">' + open + ' of ' + limit + ' seats listed open for inquiry. Maximum 10 students per cabinet. Inquiry is not enrolment.</p>' +
      '<div class="seat-row">' + chips + '</div></div>';
  }

  function bindSeatButtons(root, kind) {
    if (!root) return;
    root.querySelectorAll('[data-cab][data-seat]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openJoin('cabinet', btn.getAttribute('data-parent') || '', btn.getAttribute('data-title'), {
          cabinet_id: btn.getAttribute('data-cab'),
          seat_no: Number(btn.getAttribute('data-seat'))
        });
      });
    });
  }

  async function renderSocieties() {
    var el = document.getElementById('list');
    if (!el) return;
    bindJoinForm('society');
    var rows = await listPublished('societies');
    if (!rows.length) return empty(el, 'societies_empty');
    var pack = await cabinetsFor('society', rows.map(function (r) { return r.id; }));
    el.innerHTML = rows.map(function (r) {
      var meta = [r.category, r.city].filter(Boolean).join(' · ');
      var cabs = pack.byParent[r.id] || [];
      var cabHtml = cabs.length
        ? '<div class="cabinet-list"><p class="kicker">Cabinets</p>' + cabs.map(function (c) { return paintCabinet(c, pack.seatsByCab, r.slug); }).join('') + '</div>'
        : '<p class="empty">No cabinet is published under this society yet.</p>';
      return '<article class="card"><p class="kicker">' + escape(meta) + '</p><h3>' + escape(r.title) +
        '</h3><p>' + escape(r.summary || '') + '</p>' +
        (r.body ? '<p class="note">' + escape(r.body).slice(0, 360) + '</p>' : '') +
        cabHtml +
        '<button type="button" class="btn" data-join="' + escape(r.slug) + '" data-title="' + escape(r.title) + '">General inquiry</button></article>';
    }).join('');
    el.querySelectorAll('[data-join]').forEach(function (btn) {
      btn.addEventListener('click', function () { openJoin('society', btn.getAttribute('data-join'), btn.getAttribute('data-title')); });
    });
    bindSeatButtons(el, 'society');
  }

  async function renderChapters() {
    var el = document.getElementById('list');
    if (!el) return;
    bindJoinForm('chapter');
    var rows = await listPublished('chapters');
    if (!rows.length) return empty(el, 'chapters_empty');
    var pack = await cabinetsFor('chapter', rows.map(function (r) { return r.id; }));
    el.innerHTML = rows.map(function (r) {
      var meta = [r.city, r.province].filter(Boolean).join(' · ');
      var cabs = pack.byParent[r.id] || [];
      var cabHtml = cabs.length
        ? '<div class="cabinet-list"><p class="kicker">Cabinets</p>' + cabs.map(function (c) { return paintCabinet(c, pack.seatsByCab, r.slug); }).join('') + '</div>'
        : '<p class="empty">No cabinet is published under this chapter yet.</p>';
      return '<article class="card"><p class="kicker">' + escape(meta) + '</p><h3>' + escape(r.title) +
        '</h3><p>' + escape(r.summary || '') + '</p>' +
        (r.body ? '<p class="note">' + escape(r.body).slice(0, 360) + '</p>' : '') +
        cabHtml +
        '<button type="button" class="btn" data-join="' + escape(r.slug) + '" data-title="' + escape(r.title) + '">General inquiry</button></article>';
    }).join('');
    el.querySelectorAll('[data-join]').forEach(function (btn) {
      btn.addEventListener('click', function () { openJoin('chapter', btn.getAttribute('data-join'), btn.getAttribute('data-title')); });
    });
    bindSeatButtons(el, 'chapter');
  }

  async function renderLectures() {
    var el = document.getElementById('list');
    var player = document.getElementById('lecturePlayer');
    if (!el) return;
    var rows = await listPublished('lectures');
    if (!rows.length) return empty(el, 'learning_empty');
    function play(row) {
      var id = row.youtube_id || youtubeIdFrom(row.youtube_url);
      if (!player) return;
      if (!id) {
        player.hidden = false;
        player.innerHTML = '<p class="empty">No public YouTube ID is published for this lecture yet.</p>';
        return;
      }
      player.hidden = false;
      player.innerHTML = '<p class="kicker">' + escape(row.title) + '</p><div class="video-frame"><iframe title="' + escape(row.title) +
        '" src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) +
        '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>';
      player.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    el.innerHTML = rows.map(function (r) {
      var id = r.youtube_id || youtubeIdFrom(r.youtube_url);
      return '<article class="card"><h3>' + escape(r.title) + '</h3><p>' + escape(r.summary || '') +
        '</p><button type="button" class="btn btn-primary" data-play="' + escape(r.slug) + '"' + (id ? '' : ' disabled') + '>' +
        (id ? 'Watch' : 'No video yet') + '</button></article>';
    }).join('');
    el.querySelectorAll('[data-play]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var slug = btn.getAttribute('data-play');
        var row = rows.filter(function (r) { return r.slug === slug; })[0];
        if (row) play(row);
      });
    });
  }

  async function renderCertificates() {
    var el = document.getElementById('list');
    var filters = document.getElementById('filters');
    if (!el) return;
    var rows = await listPublished('certificates');
    function paint(shown) {
      if (!shown.length) return empty(el, 'certificates_empty');
      el.innerHTML = shown.map(function (r) {
        var href = r.module_id ? '' : '';
        return '<article class="card"><p class="kicker">' + escape(catLabel(r.category)) + '</p><h3>' + escape(r.title) +
          '</h3><p>' + escape(r.summary || '') + '</p>' +
          (r.body ? '<p class="note">' + escape(r.body).slice(0, 280) + '</p>' : '') +
          '<p class="note">Linked to a published study outline when staff set a module. Not a university degree and not automatically issued.</p></article>';
      }).join('');
    }
    if (filters) {
      var cats = ['all', 'llb', 'lat', 'gat', 'pakistan_law', 'skills'];
      filters.innerHTML = cats.map(function (c) {
        return '<button type="button" class="btn" data-cat="' + c + '">' + (c === 'all' ? 'All' : catLabel(c)) + '</button>';
      }).join('');
      filters.querySelectorAll('[data-cat]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var cat = btn.getAttribute('data-cat');
          paint(cat === 'all' ? rows : rows.filter(function (r) { return r.category === cat; }));
        });
      });
    }
    paint(rows);
  }

  async function renderPracticeAreas() {
    var el = document.getElementById('list');
    if (!el) return;
    var rows = await listPublished('practice_areas');
    rows.sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0); });
    if (!rows.length) return empty(el, 'practice_empty');
    el.innerHTML = rows.map(function (r) {
      return '<article class="card"><p class="kicker">Practice outline</p><h3>' + escape(r.title) +
        '</h3><p>' + escape(r.summary || '') + '</p>' +
        '<a class="btn btn-primary" href="/pages/practice-area.html?slug=' + encodeURIComponent(r.slug) + '">Read outline</a></article>';
    }).join('');
  }

  function listBlock(title, items, pick) {
    if (!items || !items.length) return '';
    return '<h2>' + escape(title) + '</h2><ul>' + items.map(function (it) {
      return '<li>' + pick(it) + '</li>';
    }).join('') + '</ul>';
  }

  async function renderPracticeArea() {
    var slug = qs('slug');
    var el = document.getElementById('areaBody');
    if (!el) return;
    if (!slug || !window.sb) {
      el.innerHTML = '<p class="empty">Choose a published practice outline from the list.</p>';
      return;
    }
    var res = await sb.from('practice_areas').select('*').eq('slug', slug).eq('status', 'published').maybeSingle();
    var a = res.data;
    if (!a) {
      el.innerHTML = '<p class="empty">This practice outline is not published.</p>';
      return;
    }
    var titleEl = document.getElementById('areaTitle');
    var sumEl = document.getElementById('areaSummary');
    if (titleEl) titleEl.textContent = a.title;
    if (sumEl) sumEl.textContent = a.summary || '';
    var html = '';
    html += '<p class="note">Public study outline only. This page is not legal advice, not a retainer, and not a guarantee of result. A professional relationship starts only if the firm confirms an engagement in writing.</p>';
    if (a.overview) html += '<h2>Overview</h2><p>' + escape(a.overview) + '</p>';
    if (a.body) html += '<h2>Description</h2><p>' + escape(a.body) + '</p>';
    if (a.approach) html += '<h2>Approach</h2><p>' + escape(a.approach) + '</p>';
    html += listBlock('Services described', a.services, function (s) {
      return '<strong>' + escape(s.title || '') + '</strong>' + (s.description ? ' — ' + escape(s.description) : '');
    });
    html += listBlock('Related topics', a.sub_areas, function (s) {
      return '<strong>' + escape(s.title || '') + '</strong>' + (s.description ? ' — ' + escape(s.description) : '');
    });
    html += listBlock('Statutes often cited in this outline', a.relevant_laws, function (s) {
      return escape([s.name, s.year].filter(Boolean).join(' · '));
    });
    if (a.process && a.process.length) {
      html += '<h2>Typical process (outline)</h2><ol>' + a.process.map(function (s) {
        return '<li><strong>' + escape(s.title || '') + '</strong>' + (s.description ? ' — ' + escape(s.description) : '') + '</li>';
      }).join('') + '</ol>';
    }
    if (a.faqs && a.faqs.length) {
      html += '<h2>Questions about this outline</h2>' + a.faqs.map(function (f) {
        return '<details class="card"><summary><strong>' + escape(f.question || '') + '</strong></summary><p>' + escape(f.answer || '') + '</p></details>';
      }).join('');
    }
    html += '<p><a class="btn btn-primary" href="/pages/consultation.html">Request a consultation</a> <a class="btn" href="/pages/practice-areas.html">All practice outlines</a></p>';
    el.innerHTML = html;
    if (window.ramdaniSeo) {
      var desc = (a.summary || a.overview || 'Published practice outline. Not legal advice.').slice(0, 160);
      window.ramdaniSeo.setTitle(a.title + ' — Ramdani Law Firm');
      window.ramdaniSeo.setDescription(desc);
      window.ramdaniSeo.setCanonical(window.ramdaniSeo.origin + '/pages/practice-area.html?slug=' + encodeURIComponent(a.slug));
      window.ramdaniSeo.setBreadcrumb([
        { name: 'Home', url: window.ramdaniSeo.origin + '/' },
        { name: 'Practice areas', url: window.ramdaniSeo.origin + '/pages/practice-areas.html' },
        { name: a.title, url: window.ramdaniSeo.origin + '/pages/practice-area.html?slug=' + encodeURIComponent(a.slug) }
      ]);
      if (a.faqs && a.faqs.length) {
        window.ramdaniSeo.setFAQSchema(a.faqs.map(function (f) { return [f.question, f.answer]; }));
      }
      window.ramdaniSeo.injectJSONLD('schema-practice', {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: a.title,
        description: desc,
        provider: { '@type': 'LegalService', name: 'Ramdani Law Firm', url: window.ramdaniSeo.origin + '/' },
        areaServed: { '@type': 'Country', name: 'Pakistan' }
      });
    }
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
    renderStatutes: renderStatutes,
    renderHome: renderHome,
    renderSocieties: renderSocieties,
    renderChapters: renderChapters,
    renderLectures: renderLectures,
    renderCertificates: renderCertificates,
    renderPracticeAreas: renderPracticeAreas,
    renderPracticeArea: renderPracticeArea
  };
})();
