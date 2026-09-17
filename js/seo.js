(function () {
  'use strict';
  var ORIGIN = 'https://ramdani-law-firm.vercel.app';
  var LOGO = ORIGIN + '/assets/ramdani-logo.png';
  var NAME = (window.ramdaniSite && window.ramdaniSite.name) || 'Ramdani Law Firm';

  function ensureMeta(attr, key, content) {
    if (!content) return;
    var sel = 'meta[' + attr + '="' + key + '"]';
    var el = document.head.querySelector(sel);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  function ensureLink(rel, href, extra) {
    if (!href) return;
    var el = document.head.querySelector('link[rel="' + rel + '"]' + (extra || ''));
    if (!el) {
      el = document.createElement('link');
      el.rel = rel;
      document.head.appendChild(el);
    }
    el.href = href;
  }

  function injectJSONLD(id, data) {
    var script = document.getElementById(id);
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = id;
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }

  function pageUrl() {
    return ORIGIN + (location.pathname || '/');
  }

  function setTitle(title) {
    document.title = title;
    ensureMeta('property', 'og:title', title);
    ensureMeta('name', 'twitter:title', title);
  }

  function setDescription(desc) {
    if (!desc) return;
    ensureMeta('name', 'description', desc);
    ensureMeta('property', 'og:description', desc);
    ensureMeta('name', 'twitter:description', desc);
  }

  function setCanonical(url) {
    var link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = url;
    ensureMeta('property', 'og:url', url);
  }

  function organization() {
    return {
      '@context': 'https://schema.org',
      '@type': 'LegalService',
      '@id': ORIGIN + '/#organization',
      name: NAME,
      url: ORIGIN + '/',
      logo: LOGO,
      image: LOGO,
      description: 'Public website of Ramdani Law Firm in Dera Ghazi Khan, Pakistan. Published study outlines, optional LAT/GAT practice, and consultation inquiries. Not legal advice.',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Dera Ghazi Khan',
        addressRegion: 'Punjab',
        addressCountry: 'PK'
      },
      areaServed: { '@type': 'Country', name: 'Pakistan' }
    };
  }

  function init() {
    var admin = (location.pathname || '').indexOf('/admin') === 0;
    ensureMeta('name', 'theme-color', '#0B1F33');
    ensureMeta('name', 'robots', admin ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    ensureMeta('name', 'author', NAME);
    ensureMeta('property', 'og:type', 'website');
    ensureMeta('property', 'og:site_name', NAME);
    ensureMeta('property', 'og:locale', 'en_PK');
    ensureMeta('property', 'og:locale:alternate', 'ur_PK');
    ensureMeta('property', 'og:image', LOGO);
    ensureMeta('name', 'twitter:card', 'summary_large_image');
    ensureMeta('name', 'twitter:image', LOGO);
    ensureLink('apple-touch-icon', LOGO);
    setCanonical(pageUrl());
    if (!admin) injectJSONLD('schema-organization', organization());
  }

  window.ramdaniSeo = {
    init: init,
    setTitle: setTitle,
    setDescription: setDescription,
    setCanonical: setCanonical,
    injectJSONLD: injectJSONLD,
    origin: ORIGIN,
    setCourseSchema: function (module) {
      if (!module) return;
      var title = (module.code ? module.code + ' — ' : '') + (module.title || 'Module') + ' — ' + NAME;
      var desc = (module.summary || module.description || 'Published study outline. Not a university degree and not legal advice.').slice(0, 160);
      setTitle(title);
      setDescription(desc);
      if (module.slug) setCanonical(ORIGIN + '/pages/module.html?slug=' + encodeURIComponent(module.slug));
      injectJSONLD('schema-module', {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: module.title,
        courseCode: module.code || undefined,
        description: desc,
        provider: { '@type': 'Organization', name: NAME, url: ORIGIN + '/' }
      });
    },
    setFAQSchema: function (items) {
      if (!items || !items.length) return;
      injectJSONLD('schema-faq', {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map(function (it) {
          return {
            '@type': 'Question',
            name: it[0],
            acceptedAnswer: { '@type': 'Answer', text: it[1] }
          };
        })
      });
    },
    setBreadcrumb: function (items) {
      if (!items || !items.length) return;
      injectJSONLD('schema-breadcrumb', {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map(function (item, i) {
          return { '@type': 'ListItem', position: i + 1, name: item.name, item: item.url };
        })
      });
    }
  };
  init();
})();
