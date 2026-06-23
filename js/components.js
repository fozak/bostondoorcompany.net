// components.js - Dynamically load HTML components into elements with id="cmp-<name>"

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx4_3t24ZxFop0H_G8pUsQt7LCqXoNFmxRSEWz2J4-okzRivXOysTm0Bf5tLvJ4NaA/exec";

function attachFormHandler() {
  const form = document.getElementById("estimate-form");
  if (!form) return;
  console.log("[form] handler attached");

  form.addEventListener("submit", async function(e) {
    e.preventDefault();

    const btn = document.getElementById("submit-btn");
    const msg = document.getElementById("form-msg");
    const fd  = new FormData(this);

    btn.disabled = true;
    btn.textContent = "Sending…";
    msg.style.display = "none";

    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          name:    fd.get("name"),
          email:   fd.get("email"),
          phone:   fd.get("phone"),
          service: fd.get("service"),
          message: fd.get("message"),
        }),
      });

      const json = await res.json();

      if (json.result === "ok") {
        form.reset();
        msg.className = "alert alert-success";
        msg.textContent = "Thank you! We'll be in touch shortly.";
      } else {
        throw new Error(json.error || "Unknown error");
      }
    } catch (err) {
      msg.className = "alert alert-danger";
      msg.textContent = "Something went wrong. Please try again or call us directly.";
      console.error(err);
    } finally {
      msg.style.display = "block";
      btn.disabled = false;
      btn.textContent = "Request a Consultation";
    }
  });
}

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
    //if (name === 'form') attachFormHandler();
     attachFormHandler();  //added

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
    const href = link.getAttribute('href');
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
}

loadComponents();