/* Thistle - shared JavaScript */

// ---- Settings ----
// Leave empty for DEMO mode (nothing is sent anywhere; fires demo_form_submit).
// If you set up a real form service (e.g. Formspree), paste its URL here.
// Then generate_lead / sign_up fire ONLY after the service confirms success.
const FORM_ENDPOINT = "";        // e.g. "https://formspree.io/f/yourFormId"
const NEWSLETTER_ENDPOINT = "";  // e.g. a second Formspree form URL

// ---- Safe GA4 helper (won't break the site if GA is blocked) ----
function track(eventName, params) {
  if (typeof gtag === "function") gtag("event", eventName, params || {});
}

// ---- Mobile menu ----
const menuBtn = document.getElementById("menu-btn");
const navList = document.getElementById("nav-list");
if (menuBtn && navList) {
  menuBtn.addEventListener("click", () => {
    const open = navList.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
  });
}

// ---- Footer year ----
document.querySelectorAll(".year").forEach(el => el.textContent = new Date().getFullYear());

// ---- Image fallback (if a public image link ever breaks) ----
document.querySelectorAll("img").forEach(img => {
  img.addEventListener("error", () => { img.style.visibility = "hidden"; }, { once: true });
});

// ---- Products page: filters + details dialog + select_item ----
const filterBtns = document.querySelectorAll(".filter-btn");
const cards = document.querySelectorAll("[data-category]");
filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => { b.classList.remove("active"); b.setAttribute("aria-pressed", "false"); });
    btn.classList.add("active"); btn.setAttribute("aria-pressed", "true");
    const f = btn.dataset.filter;
    cards.forEach(c => { c.hidden = !(f === "all" || c.dataset.category === f); });
  });
});

const dialog = document.getElementById("detail-dialog");
document.querySelectorAll(".details-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const card = btn.closest("[data-category]");
    const d = card.dataset;
    // GA4 recommended e-commerce event
    track("select_item", {
      item_list_name: "Thistle Menu",
      items: [{ item_id: d.id, item_name: d.name, item_category: d.category,
                price: Number(d.price), currency: "INR" }]
    });
    if (dialog) {
      document.getElementById("dlg-title").textContent = d.name;
      document.getElementById("dlg-desc").textContent = d.desc;
      document.getElementById("dlg-price").textContent = "₹" + d.price;
      dialog.showModal();
    }
  });
});
if (dialog) {
  dialog.querySelector(".close-dlg").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });
}

// ---- Form helpers ----
const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
function setError(input, text) {
  const err = document.getElementById(input.id + "-error");
  if (err) err.textContent = text;
  input.classList.toggle("invalid", !!text);
  input.setAttribute("aria-invalid", text ? "true" : "false");
}
function showMsg(el, text) { el.textContent = text; el.classList.add("show"); }

async function submitTo(url, formData) {
  const res = await fetch(url, { method: "POST", body: formData, headers: { Accept: "application/json" } });
  return res.ok;
}

// ---- Contact form ----
const form = document.getElementById("contact-form");
if (form) {
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const name = form.elements.name, email = form.elements.email,
          subject = form.elements.subject, message = form.elements.message;
    const msg = document.getElementById("form-msg");
    let ok = true;
    setError(name, name.value.trim().length < 2 ? "Please enter your name." : ""); if (name.value.trim().length < 2) ok = false;
    setError(email, !emailOk(email.value.trim()) ? "Please enter a valid email." : ""); if (!emailOk(email.value.trim())) ok = false;
    setError(subject, subject.value.trim().length < 3 ? "Please enter a subject." : ""); if (subject.value.trim().length < 3) ok = false;
    setError(message, message.value.trim().length < 10 ? "Message must be at least 10 characters." : ""); if (message.value.trim().length < 10) ok = false;
    if (!ok) { showMsg(msg, "Please fix the highlighted fields."); return; }

    if (!FORM_ENDPOINT) {
      // DEMO mode: nothing is delivered
      track("demo_form_submit", { form_name: "contact_form" });
      showMsg(msg, "Demo mode: your form passed validation, but no message was sent.");
      form.reset();
      return;
    }
    try {
      const success = await submitTo(FORM_ENDPOINT, new FormData(form));
      if (success) {
        track("generate_lead", { form_name: "contact_form" });
        showMsg(msg, "Thank you! Your message has been sent.");
        form.reset();
      } else { showMsg(msg, "Sorry, something went wrong. Please try again."); }
    } catch { showMsg(msg, "Network error. Please try again."); }
  });
}

// ---- Newsletter ----
const news = document.getElementById("newsletter-form");
if (news) {
  news.addEventListener("submit", async e => {
    e.preventDefault();
    const email = news.elements.news_email;
    const msg = document.getElementById("news-msg");
    if (!emailOk(email.value.trim())) { setError(email, "Please enter a valid email."); return; }
    setError(email, "");
    if (!NEWSLETTER_ENDPOINT) {
      track("demo_form_submit", { form_name: "newsletter" });
      showMsg(msg, "Demo mode: email format is valid, but no subscription was created.");
      news.reset(); return;
    }
    try {
      const success = await submitTo(NEWSLETTER_ENDPOINT, new FormData(news));
      if (success) {
        track("sign_up", { method: "newsletter" });
        showMsg(msg, "You're subscribed. Welcome to Thistle!");
        news.reset();
      } else { showMsg(msg, "Subscription failed. Please try again."); }
    } catch { showMsg(msg, "Network error. Please try again."); }
  });
}
