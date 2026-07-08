// components.js - Dynamically load HTML components into elements with id="cmp-<name>"

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyBaHXP4caZPnjONHy2yrDjnsUgLqK4IXr_34xQj1DcZAjLj4_W0BLYRxnLbS8nkKE/exec";

function attachFormHandler() {
  const form = document.getElementById("estimate-form");
  if (!form) return;
  if (form.dataset.handlerAttached) return; // guard
  form.dataset.handlerAttached = "true";
  console.log("[form] handler attached");

  form.addEventListener("submit", async function(e) {
    e.preventDefault();

    const btn = document.getElementById("submit-btn");
    const msg = document.getElementById("form-msg");
    const fd  = new FormData(this);

    btn.disabled = true;
    btn.textContent = "Sending…";
    msg.style.display = "none";

    // convert photo to base64 if provided
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
          message:       fd.get("message"),
          photo:         photoBase64,
          photo_name:    photoName,
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