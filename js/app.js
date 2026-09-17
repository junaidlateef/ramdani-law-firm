(function () {
  window.ramdaniNav = function (current) {
    var items = window.ramdaniSite.navigation.concat([['/pages/consultation.html', 'nav_consult']]);
    return items.map(function (it) {
      var cur = it[0] === current ? ' aria-current="page"' : '';
      return '<a href="' + it[0] + '"' + cur + ' data-i18n="' + it[1] + '"></a>';
    }).join('');
  };

  document.addEventListener('DOMContentLoaded', function () {
    var themeBtn = document.getElementById('themeBtn');
    var saved = null;
    try { saved = localStorage.getItem('ramdani_theme'); } catch (e) {}
    if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        var dark = document.documentElement.getAttribute('data-theme') === 'dark';
        document.documentElement.setAttribute('data-theme', dark ? 'light' : 'dark');
        try { localStorage.setItem('ramdani_theme', dark ? 'light' : 'dark'); } catch (e) {}
      });
    }
    document.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
      btn.addEventListener('click', function () { ramdaniSetLang(btn.getAttribute('data-lang-btn')); });
    });
  });

  window.ramdaniBindInquiry = function (formId, kind) {
    var form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var status = form.querySelector('.form-status');
      var hp = form.querySelector('[name="company_website"]');
      if (hp && hp.value) return;
      var payload = {
        kind: kind,
        full_name: form.querySelector('[name="full_name"]').value.trim(),
        email: form.querySelector('[name="email"]').value.trim(),
        phone: (form.querySelector('[name="phone"]') || {}).value || null,
        subject: (form.querySelector('[name="subject"]') || {}).value || null,
        message: form.querySelector('[name="message"]').value.trim(),
        preferred_contact: (form.querySelector('[name="preferred_contact"]') || {}).value || null
      };
      if (!payload.full_name || !payload.email || !payload.message) {
        status.className = 'form-status err';
        status.textContent = ramdaniT('form_err');
        return;
      }
      try {
        await ramdaniApi.submitInquiry(payload);
        form.reset();
        status.className = 'form-status ok';
        status.textContent = ramdaniT('form_ok');
      } catch (err) {
        status.className = 'form-status err';
        status.textContent = ramdaniT('form_err');
      }
    });
  };
})();
