window.ramdaniUi = {
  escape: function (s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  },
  card: function (item, href) {
    var title = this.escape(item.title || item.full_name || 'Untitled');
    var summary = this.escape(item.summary || item.short_bio || item.description || '');
    var link = href ? '<a class="card-link" href="' + this.escape(href) + '">' + title + '</a>' : title;
    return '<article class="card"><h3>' + link + '</h3><p>' + summary + '</p></article>';
  },
  empty: function (key) {
    return '<p class="empty" data-i18n="' + this.escape(key) + '">' + this.escape(window.ramdaniT ? ramdaniT(key) : 'Nothing published yet.') + '</p>';
  },
  renderList: function (el, rows, emptyKey, hrefFn) {
    if (!el) return;
    if (!rows || !rows.length) {
      el.innerHTML = this.empty(emptyKey);
      return;
    }
    el.innerHTML = rows.map(function (row) {
      return window.ramdaniUi.card(row, hrefFn ? hrefFn(row) : null);
    }).join('');
  }
};
