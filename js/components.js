// components.js - Dynamically load HTML components into elements with id="cmp-<name>"

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyBaHXP4caZPnjONHy2yrDjnsUgLqK4IXr_34xQj1DcZAjLj4_W0BLYRxnLbS8nkKE/exec";

// ─── Form Handler ─────────────────────────────────────────────────────────────

function attachFormHandler() {
  const form = document.getElementById("estimate-form");
  if (!form || form.dataset.handlerAttached) return;
  form.dataset.handlerAttached = "true";

  form.addEventListener("submit", async function(e) {
    e.preventDefault();

    const btn = document.getElementById("submit-btn");
    const msg = document.getElementById("form-msg");
    const fd  = new FormData(this);

    btn.disabled = true;
    btn.textContent = "Sending…";
    msg.style.display = "none";

    let photoBase64 = "";
    let photoName   = "";
    const photoFile = fd.get("photo");
    if (photoFile && photoFile.size > 0) {
      photoBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(photoFile);
      });
      photoName = photoFile.name;
    }

    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          name:          fd.get("name"),
          email:         fd.get("email"),
          phone:         fd.get("phone"),
          customer_type: fd.get("customer_type"),
          company:       fd.get("company"),
          service:       fd.get("service"),
          building_type: fd.get("building_type"),
          address:       fd.get("address"),
          message:       fd.get("message"),
          photo:         photoBase64,
          photo_name:    photoName,
        }),
      });

      const json = await res.json();
      if (json.result === "ok") {
        form.reset();
        msg.className   = "alert alert-success";
        msg.textContent = "Thank you! We'll be in touch shortly.";
      } else {
        throw new Error(json.error || "Unknown error");
      }
    } catch (err) {
      msg.className   = "alert alert-danger";
      msg.textContent = "Something went wrong. Please try again or call us directly.";
      console.error(err);
    } finally {
      msg.style.display = "block";
      btn.disabled      = false;
      btn.textContent   = "Request a Consultation";
    }
  });
}

// ─── Editor ───────────────────────────────────────────────────────────────────

function initEditor() {
  const btn = document.getElementById('edit-mode-btn');
  if (!btn) return;

  const widget = document.createElement('div');
  widget.id = 'ct-widget';
  widget.innerHTML = `
    <div class="ct-ignition__button" id="ct-edit"    title="Edit">  <i class="ti ti-pencil"></i></div>
    <div class="ct-ignition__button" id="ct-confirm" title="Save">  <i class="ti ti-check"></i></div>
    <div class="ct-ignition__button" id="ct-cancel"  title="Cancel"><i class="ti ti-x"></i></div>
    <div class="ct-ignition__button" id="ct-busy"    title="Saving"><i class="ti ti-loader-2 ti-spin"></i></div>`;
  document.body.appendChild(widget);

const style = document.createElement('style');
  style.textContent = `
    #ct-widget {
      position: fixed;
      top: 1rem;
      left: 1rem;
      bottom: auto;
      right: auto;
      z-index: 99999;
      display: none;
      flex-direction: row;
      gap: 8px;
    }
    #ct-widget.active { display: flex; }
    .ct-ignition__button {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      cursor: pointer;
      color: #fff;
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,.3);
      transition: background .2s;
    }
    #ct-edit    { background: #e03131; }
    #ct-edit:hover { background: #c92a2a; }
    #ct-confirm { background: #2f9e44; }
    #ct-confirm:hover { background: #276e34; }
    #ct-cancel  { background: #868e96; }
    #ct-cancel:hover { background: #495057; }
    #ct-busy    { background: #868e96; }
    #ct-confirm, #ct-cancel, #ct-busy { display: none; }
    [contenteditable=true] { outline: 2px dashed #e03131 !important; border-radius: 2px; }
  `;
  document.head.appendChild(style);
  
  let originalHTML = '';

  function getMain() {
    return document.querySelector('#main') || document.querySelector('main');
  }

  function setEditing(on) {
    const main = getMain();
    if (!main) return;
    main.querySelectorAll('p, h1, h2, h3, h4, h5, li, span, a').forEach(el => {
      el.contentEditable = on ? 'true' : 'false';
    });
    document.getElementById('ct-edit').style.display    = on ? 'none'  : 'flex';
    document.getElementById('ct-confirm').style.display = on ? 'flex'  : 'none';
    document.getElementById('ct-cancel').style.display  = on ? 'flex'  : 'none';
    document.getElementById('ct-busy').style.display    = 'none';
  }

  btn.addEventListener('click', e => {
    e.preventDefault();
    widget.classList.add('active');
  });

  document.getElementById('ct-edit').addEventListener('click', () => {
    originalHTML = getMain().innerHTML;
    setEditing(true);
  });

  document.getElementById('ct-cancel').addEventListener('click', () => {
    getMain().innerHTML = originalHTML;
    setEditing(false);
    widget.classList.remove('active');
  });

  document.getElementById('ct-confirm').addEventListener('click', async () => {
    setEditing(false);
    document.getElementById('ct-confirm').style.display = 'none';
    document.getElementById('ct-cancel').style.display  = 'none';
    document.getElementById('ct-busy').style.display    = 'flex';

    const filename = location.pathname.replace(/^\//, '') || 'index.html';
    const html     = `<!doctype html>\n<html lang="en">\n<head><meta charset="utf-8"><title>${document.title}</title></head>\n<body>\n${getMain().outerHTML}\n</body>\n</html>`;

    try {
      const res  = await fetch(SCRIPT_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'text/plain' },
        body:    JSON.stringify({ action: 'save_html', filename, html })
      });
      const json = await res.json();
      if (json.result === 'ok') {
        alert(`Saved to Google Drive — ${filename}`);
      } else {
        alert('Error: ' + (json.error || 'unknown'));
      }
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      document.getElementById('ct-busy').style.display = 'none';
      document.getElementById('ct-edit').style.display = 'flex';
      widget.classList.remove('active');
    }
  });
}

// ─── Component Loader ─────────────────────────────────────────────────────────

function execScripts(el) {
  el.querySelectorAll('script').forEach(old => {
    const s = document.createElement('script');
    [...old.attributes].forEach(a => s.setAttribute(a.name, a.value));
    s.textContent = old.textContent;
    old.replaceWith(s);
  });
}

async function loadComponent(el) {
  const name = el.id.replace('cmp-', '');
  try {
    const res = await fetch(`/components/${name}.html`);
    if (!res.ok) throw new Error(`Failed to load ${name}.html`);
    el.innerHTML = await res.text();
    execScripts(el);
    attachFormHandler();
  } catch (e) {
    console.warn('[components]', e.message);
  }
}

async function loadComponents() {
  const slots = [...document.querySelectorAll('[id^="cmp-"]')];
  await Promise.all(slots.map(loadComponent));

  // Mark active nav link
  const path = location.pathname;
  document.querySelectorAll('.site-nav .nav-link').forEach(link => {
    const href    = link.getAttribute('href');
    const isHome  = (path === '/' || path === '/index.html') && href === '/';
    const isMatch = href !== '/' && path.startsWith(href.split('#')[0]) && href.split('#')[0] !== '/';
    if (isHome || isMatch) link.classList.add('active');
  });

  // Re-init Bootstrap collapse for dynamically injected navbar
  if (window.bootstrap) {
    document.querySelectorAll('.navbar-toggler').forEach(toggler => {
      const target = document.querySelector(toggler.dataset.bsTarget);
      if (target) new bootstrap.Collapse(target, { toggle: false });
    });
  }

  document.dispatchEvent(new Event('components:ready'));
  initEditor();
}

loadComponents();