/**
 * video-cta.js
 * Drives timed overlay elements over a video hero.
 * Loaded after components.js — fires on components:ready.
 * Config: /components/video-cta-config.json
 * Usage:  <div id="cmp-video-cta" data-variant="chestnut"></div>
 */

(function () {

  function show(el) {
    if (el) el.classList.add('vcta-visible');
  }

  function buildChips(wrap, chips) {
    wrap.innerHTML = chips.map(function (c) {
      return '<span class="vcta-chip"><i class="fa ' + c.icon + ' text-primary me-1"></i>' + c.label + '</span>';
    }).join('');
  }

  function applyConfig(slot, cfg) {
    slot.querySelector('.vcta-badge-text').textContent  = cfg.badge;
    slot.querySelector('.vcta-headline-text').textContent = cfg.headline;
    slot.querySelector('.vcta-sub').textContent         = cfg.sub;
    slot.querySelector('.vcta-btn-label').textContent   = cfg.cta;
    slot.querySelector('.vcta-btn-primary').href        = cfg.ctaLink;
    buildChips(slot.querySelector('.vcta-chips-wrap'), cfg.chips || []);
  }

  function bindVideo(slot, cfg) {
    // Walk UP from the slot to find the .video-hero wrapper, then find the video
    var hero  = slot.closest('.video-hero');
    var video = hero ? hero.querySelector('video') : null;

    var badge    = slot.querySelector('#vcta-badge');
    var headline = slot.querySelector('#vcta-headline');
    var chips    = slot.querySelector('#vcta-chips');
    var cta      = slot.querySelector('#vcta-cta');
    var bar      = slot.querySelector('#vcta-progress');
    var t        = cfg.timings || {};

    if (!video) {
      // No video found — show everything immediately
      [badge, headline, chips, cta].forEach(show);
      return;
    }

    video.addEventListener('timeupdate', function () {
      var ct  = video.currentTime;
      var dur = video.duration || 1;
      if (bar) bar.style.width = ((ct / dur) * 100) + '%';
      if (t.badge    && ct >= t.badge)    show(badge);
      if (t.headline && ct >= t.headline) show(headline);
      if (t.chips    && ct >= t.chips)    show(chips);
      if (t.cta      && ct >= t.cta)      show(cta);
    });

    video.addEventListener('error', function () {
      [badge, headline, chips, cta].forEach(show);
    });
  }

  async function init() {
    var slots = document.querySelectorAll('[id^="cmp-video-cta"]');
    if (!slots.length) return;

    var configs = {};
    try {
      var res = await fetch('/components/video-cta-config.json');
      if (res.ok) configs = await res.json();
    } catch (e) {
      console.warn('[video-cta] Config load failed:', e.message);
    }

    slots.forEach(function (slot) {
      var variant = slot.dataset.variant || 'chestnut';
      var cfg     = configs[variant];
      if (!cfg) { console.warn('[video-cta] No config for variant:', variant); return; }
      applyConfig(slot, cfg);
      bindVideo(slot, cfg);
    });
  }

  document.addEventListener('components:ready', init);

})();
