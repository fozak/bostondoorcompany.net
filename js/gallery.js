const GITHUB_API = '/images/gallery.json';
const RAW_BASE   = window.location.origin + '/images/';

const CAT_LABELS = {
  'door-repair':          'Door Repair',
  'door-installation':    'Door Installation',
  'door-restoration':     'Door Restoration',
  'door-hardware':        'Hardware & Locks',
  'door-weatherproofing': 'Weatherproofing',
  'finish-carpentry':     'Finish Carpentry',
  'custom-doors':         'Custom Doors',
};

const CAT_ICONS = {
  'door-repair':          'fa-tools',
  'door-installation':    'fa-door-open',
  'door-restoration':     'fa-paint-brush',
  'door-hardware':        'fa-key',
  'door-weatherproofing': 'fa-wind',
  'finish-carpentry':     'fa-ruler-combined',
  'custom-doors':         'fa-star',
};

const FILE_RE = /^([\w-]+?)-(\d+)(?:-(.+))?\.(jpg|jpeg|png|gif|webp)$/i;

function categoryFromName(filename) {
  // try longest known category match first
  for (const cat of Object.keys(CAT_LABELS)) {
    if (filename.startsWith(cat + '-')) return cat;
  }
  return null;
}

function titleFromName(filename, cat) {
  if (!cat) return filename;
  const rest = filename.slice(cat.length + 1); // strip "door-repair-"
  const m = rest.match(/^(\d+)(?:-(.+))?\.\w+$/i);
  if (!m) return labelFor(cat);
  if (!m[2]) return labelFor(cat) + ' ' + m[1];
  return m[2].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function labelFor(cat) {
  if (!cat) return 'Other';
  return CAT_LABELS[cat] || cat.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function iconFor(cat) {
  if (!cat) return 'fa-image';
  return CAT_ICONS[cat] || 'fa-image';
}

const CACHE_KEY = 'bec_gallery_v1';
const CACHE_TTL = 60 * 60 * 1000;

function skeletonHTML(n) {
  return Array.from({length: n}, () =>
    '<div class="gallery-item" style="background:#e8eaed;min-height:220px;animation:pulse 1.5s ease-in-out infinite;"></div>'
  ).join('');
}

const styleEl = document.createElement('style');
styleEl.textContent = '@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }';
document.head.appendChild(styleEl);

async function loadGallery() {
  const grid  = document.getElementById('galleryGrid');
  const tabsEl = document.querySelector('.filter-tabs');
  if (!grid) return;

  grid.innerHTML = skeletonHTML(9);

  let files;

  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < CACHE_TTL) files = data;
    }
  } catch (_) {}

  if (!files) {
    try {
      const res = await fetch(GITHUB_API);
      if (!res.ok) throw new Error('gallery.json ' + res.status);
      files = await res.json();
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: files, ts: Date.now() })); } catch (_) {}
    } catch (e) {
      grid.innerHTML = '<div class="text-danger p-4">Failed to load gallery: ' + e.message + '</div>';
      return;
    }
  }

  // filter to only files with a known category
  files = files.filter(f => categoryFromName(f.name) !== null);

  // sort by category order then number
  const catOrder = Object.keys(CAT_LABELS);
  files.sort((a, b) => {
    const ca = categoryFromName(a.name);
    const cb = categoryFromName(b.name);
    const ia = catOrder.indexOf(ca);
    const ib = catOrder.indexOf(cb);
    if (ia !== ib) return ia - ib;
    const na = parseInt(a.name.replace(ca + '-', '')) || 0;
    const nb = parseInt(b.name.replace(cb + '-', '')) || 0;
    return na - nb;
  });

  // build category tabs
  const catsInFiles = [...new Set(files.map(f => categoryFromName(f.name)))];

  if (tabsEl) {
    tabsEl.innerHTML =
      `<button class="filter-btn active" data-filter="all">All Projects</button>` +
      catsInFiles.map(cat =>
        `<button class="filter-btn" data-filter="${cat}">
          <i class="fa ${iconFor(cat)} me-1"></i>${labelFor(cat)}
        </button>`
      ).join('');
  }

  // render items
  grid.innerHTML = files.map(f => {
    const cat   = categoryFromName(f.name);
    const title = titleFromName(f.name, cat);
    const label = labelFor(cat);
    const src   = RAW_BASE + encodeURIComponent(f.name);
    return `
      <div class="gallery-item" data-category="${cat}">
        <img src="${src}" alt="${title} — Boston" loading="lazy">
        <div class="gallery-overlay">
          <div class="zoom-icon"><i class="fa fa-expand"></i></div>
          <div class="cat-badge">${label}</div>
          <p class="img-title">${title}</p>
        </div>
      </div>`;
  }).join('');

  initGallery();
}

function initGallery() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const items      = document.querySelectorAll('.gallery-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      items.forEach(item => {
        item.classList.toggle('hidden', filter !== 'all' && item.dataset.category !== filter);
      });
    });
  });

  const lightbox  = document.getElementById('lightbox');
  if (!lightbox) return;
  const lbImg     = document.getElementById('lbImg');
  const lbCaption = document.getElementById('lbCaption');
  let visibleItems = [], currentIndex = 0;

  function getVisible() {
    return [...document.querySelectorAll('.gallery-item:not(.hidden)')];
  }

  items.forEach(item => {
    item.addEventListener('click', () => {
      visibleItems = getVisible();
      currentIndex = visibleItems.indexOf(item);
      openLightbox(currentIndex);
    });
  });

  function openLightbox(idx) {
    const item  = visibleItems[idx];
    const img   = item.querySelector('img');
    lbImg.src   = img.src;
    lbImg.alt   = img.alt;
    const badge = item.querySelector('.cat-badge');
    const title = item.querySelector('.img-title');
    lbCaption.textContent = (badge ? badge.textContent : '') + (title ? ' — ' + title.textContent : '');
    lightbox.classList.add('open');
  }

  document.getElementById('lbClose').addEventListener('click', () => lightbox.classList.remove('open'));
  lightbox.addEventListener('click', e => { if (e.target === lightbox) lightbox.classList.remove('open'); });

  document.getElementById('lbPrev').addEventListener('click', e => {
    e.stopPropagation();
    currentIndex = (currentIndex - 1 + visibleItems.length) % visibleItems.length;
    openLightbox(currentIndex);
  });

  document.getElementById('lbNext').addEventListener('click', e => {
    e.stopPropagation();
    currentIndex = (currentIndex + 1) % visibleItems.length;
    openLightbox(currentIndex);
  });

  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'ArrowLeft')  { currentIndex = (currentIndex - 1 + visibleItems.length) % visibleItems.length; openLightbox(currentIndex); }
    if (e.key === 'ArrowRight') { currentIndex = (currentIndex + 1) % visibleItems.length; openLightbox(currentIndex); }
    if (e.key === 'Escape')     { lightbox.classList.remove('open'); }
  });
}

document.addEventListener('components:ready', loadGallery);
