// Shop logic: loads data/*.json, renders catalogue, cart, WhatsApp order.
"use strict";

// Config: WhatsApp number (international format, no +), Facebook URL, unit price,
// contact email (change it here, the form follows automatically).
const WA = "237694639475",
  FB = "https://www.facebook.com/share/19JuxXMs5z/?mibextid=wwXIfr",
  PRICE = 5000,
  CONTACT_EMAIL = "saoudayazieya@gmail.com";

let P = [];
let T = [];
let TE = [];

const $ = (s) => document.querySelector(s);
const fmt = (n) => n.toLocaleString("fr-FR").replace(/\u202f/g, " ") + " FCFA";
// Display form of WA (e.g. "+237 6 94 63 94 75"), derived so WA stays single source.
const waFmt = () =>
  "+" + WA.replace(/(\d{3})(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/, "$1 $2 $3 $4 $5 $6");

let lang = "fr",
  filter = 0,
  cart = {};

try {
  lang = localStorage.getItem("lang") === "en" ? "en" : "fr";
  const t = localStorage.getItem("theme");
  if (t) document.documentElement.dataset.theme = t;
  const raw = JSON.parse(localStorage.getItem("cart") || "{}");
  for (const [id, q] of Object.entries(raw)) {
    const n = Math.floor(Number(q));
    if (id && Number.isFinite(n) && n > 0) cart[id] = Math.min(n, 99);
  }
} catch (e) {}

function saveCart() {
  try {
    localStorage.setItem("cart", JSON.stringify(cart));
  } catch (e) {}
}

const t = (k) => T[lang][k];
const wa = (txt) => "https://wa.me/" + WA + "?text=" + encodeURIComponent(txt);

function can(p, big) {
  const age = T[lang] ? t("f").replace("{a}", p.age) : "";
  return (
    `<div class="can${big ? " big" : ""}" style="background:${p.c}">` +
    `<img src="${p.img}" alt="${p.n}" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#fff">` +
    `<i style="z-index:1">${age}</i></div>`
  );
}

let sIdx = 0,
  sTimer = 0,
  sVisible = true;
function showProduct(i, user, instant) {
  if (!P.length) return;
  sIdx = (i + P.length) % P.length;
  const p = P[sIdx],
    box = $("#sbox");
  const paint = () => {
    const img = $("#sImg");
    img.src = p.stage || p.img;
    img.alt = p.n;
    box.setAttribute("aria-label", `${p.n} – ${t("view")}`);
    $("#sName").textContent = p.n;
    $("#sDesc").textContent = p[lang];
    $("#sCount").textContent = `${sIdx + 1} / ${P.length}`;
    document
      .querySelectorAll("#sThumbs button")
      .forEach((b, d) => b.setAttribute("aria-current", d === sIdx));
    box.classList.remove("swap");
  };
  if (instant) {
    paint();
  } else {
    box.classList.add("swap");
    clearTimeout(box._t);
    box._t = setTimeout(paint, 200);
  }
  if (user) restartShow();
}
function restartShow() {
  clearInterval(sTimer);
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    sTimer = setInterval(() => {
      if (!document.hidden && sVisible && $("#modal").hidden)
        showProduct(sIdx + 1);
    }, 3000);
  }
}

function render() {
  document.documentElement.lang = lang;
  $("#langLabel").textContent = lang === "fr" ? "EN" : "FR";
  $("#lang").setAttribute(
    "aria-label",
    lang === "fr" ? "Switch to English" : "Passer en français",
  );
  document
    .querySelectorAll("[data-t]")
    .forEach((e) => (e.textContent = t(e.dataset.t)));
  document.title = t("brand") + " – " + fmt(PRICE);
  $("#sThumbs").innerHTML = P.map(
    (p, d) =>
      `<button data-s="${d}" aria-label="${p.n}" aria-current="${d === sIdx}"><img src="${p.stage || p.img}" alt="" loading="lazy"></button>`,
  ).join("");
  $("#sThumbs").setAttribute("aria-label", t("catH"));
  if (sIdx >= P.length) sIdx = 0;
  showProduct(sIdx, false, true);
  restartShow();
  P.forEach((p) => {
    const im = new Image();
    im.src = p.stage || p.img;
  });
  const ages = [0, 6, 10, 12];
  $("#age").innerHTML = ages
    .map(
      (a) =>
        `<button aria-pressed="${filter === a}" data-a="${a}">${a ? t("m").replace("{a}", a) + (a === 12 ? " +" : "") : t("all")}</button>`,
    )
    .join("");
  $("#grid").innerHTML = P.filter((p) => !filter || p.age === filter)
    .map((p, i) => {
      const out = (p.stock || "in") === "out";
      const st = p.stock || "in";
      const pctTxt = p.pct ? (lang === "fr" ? String(p.pct).replace(".", ",") : String(p.pct)) : "";
      return `<article class="card${out ? " out" : ""}" style="--d:${Math.min(i, 8) * 60}ms">${can(p)}<h3>${p.n}</h3><div>${p[lang]}</div>
  <div class="tags">${p.pct ? `<span>${t("pcer").replace("{p}", pctTxt)}</span>` : ""}<span>${t("f").replace("{a}", p.age)}</span><span>${p.w}</span><span>${t("bib").replace("{b}", p.b)}</span></div>
  ${p.prep ? `<p class="prep">${p.prep[lang]}</p>` : ""}
  <div class="actions"><button class="btn wa buy" data-o="${p.id}"${out ? " disabled" : ""}><i class="hgi-stroke hgi-shopping-cart-01" aria-hidden="true"></i> ${t("buy")}</button><button class="btn o view" data-v="${p.id}"><i class="hgi-stroke hgi-view" aria-hidden="true"></i> ${t("view")}</button><span class="stock ${st}">${t("stock_" + st)}</span></div>
  <details><summary>${t("ing")}</summary><p>${p.ing[lang]}</p>${p.fiche ? `<img src="${p.fiche}" alt="${p.n}" loading="lazy" style="width:100%;border-radius:12px;margin-top:8px">` : ""}</details>
  <div class="qty"><span class="pr">${fmt(PRICE)}</span><div class="q"><button data-m="${p.id}" aria-label="-"${out ? " disabled" : ""}><i class="hgi-stroke hgi-minus-sign" aria-hidden="true"></i></button><output>${cart[p.id] || 0}</output><button data-p="${p.id}" aria-label="+"${out ? " disabled" : ""}><i class="hgi-stroke hgi-plus-sign" aria-hidden="true"></i></button></div></div></article>`;
    })
    .join("");
  $("#faqList").innerHTML = t("faq")
    .map((f) => `<details><summary>${f[0]}</summary><p>${f[1]}</p></details>`)
    .join("");
  sum();
  document
    .querySelectorAll("[data-wa=hello]")
    .forEach((a) => (a.href = wa(t("hello"))));
  const wn = $("#waNum");
  if (wn) wn.textContent = waFmt();
  if (aproposSeen) countFamilies();
  renderTesti();
  $("#fb").href = FB;
  $("#call").href = "tel:+" + WA;
  if ($("#fbF")) $("#fbF").href = FB;
  if ($("#callF")) $("#callF").href = "tel:+" + WA;
  if ($("#rights"))
    $("#rights").textContent = t("rights").replace(
      "{y}",
      new Date().getFullYear(),
    );
  $("#o-pay").options[0].text = t("cash");
}

function lines() {
  return P.filter((p) => cart[p.id]).map(
    (p) => `${cart[p.id]} × ${p.n} (${p.w})`,
  );
}

// shortcut: testimonial text is injected raw (our own file, we author it).
// Escape the fields only if quotes ever come from an outside source.
function renderTesti() {
  const box = $("#testi"),
    list = $("#testiList");
  if (!box || !list) return;
  list.innerHTML = TE.map((x) => {
    const q = typeof x.text === "string" ? x.text : x.text[lang] || x.text.fr;
    return `<figure><blockquote>${q}</blockquote><figcaption><span class="avatar" aria-hidden="true">${(x.name || "?").charAt(0).toUpperCase()}</span><span>${x.name}${x.city ? " · " + x.city : ""}</span><i class="hgi-stroke hgi-check-check tick" aria-hidden="true"></i></figcaption></figure>`;
  }).join("");
  box.hidden = !TE.length;
}

function count() {
  return Object.values(cart).reduce((a, b) => a + b, 0);
}

function sum() {
  const n = count();
  $("#sum").textContent = n
    ? lines().join("\n") + `\n\n${t("tot")} : ${fmt(n * PRICE)} (${t("nofee")})`
    : t("empty");
  const badge = $("#cartN");
  if (badge && badge.textContent !== String(n)) {
    badge.textContent = n;
    badge.classList.remove("pop");
    void badge.offsetHeight;
    badge.classList.add("pop");
  }
  const send = document.querySelector("#order button[type=submit]");
  if (send) send.classList.toggle("ready", n > 0);
}

let mImgs = [],
  mIdx = 0,
  mItem = null,
  mFrom = null;

// Overdrive helpers: browser-native motion, all with reduced-motion + old
// browser fallbacks back to the pre-existing CSS animations.
const vtOn = () =>
  document.startViewTransition &&
  !matchMedia("(prefers-reduced-motion: reduce)").matches;

// First add-to-cart: the product can jumps into the header cart badge.
function flyToCart(src, from) {
  const to = $("#cartBtn").getBoundingClientRect(),
    dx = to.left + to.width / 2 - (from.left + from.width / 2),
    dy = to.top + to.height / 2 - (from.top + from.height / 2),
    el = document.createElement("img");
  el.src = src;
  el.alt = "";
  el.className = "flycan";
  el.style.left = from.left + from.width / 2 - 23 + "px";
  el.style.top = from.top + from.height / 2 - 23 + "px";
  document.body.append(el);
  el.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      {
        transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 60}px) scale(.8)`,
        offset: 0.55,
      },
      { transform: `translate(${dx}px, ${dy}px) scale(.25)`, opacity: 0.35 },
    ],
    { duration: 720, easing: "cubic-bezier(0.32, 0.9, 0.28, 1)" },
  ).onfinish = () => el.remove();
}

function hideToast() {
  const t = $("#toast");
  clearTimeout(t._h);
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const a = t.animate(
      [{ opacity: 1 }, { opacity: 0, transform: "translateY(10px)" }],
      { duration: 180, easing: "ease" },
    );
    a.onfinish = () => (t.hidden = true);
    a.oncancel = () => (t.hidden = true);
    return;
  }
  t.hidden = true;
}

function showSlide(i) {
  if (!mImgs.length) return;
  mIdx = (i + mImgs.length) % mImgs.length;
  $("#mTrack").style.transform = `translateX(-${mIdx * 100}%)`;
  $("#mDots").innerHTML = mImgs
    .map(
      (_, d) =>
        `<button data-d="${d}" aria-label="${d + 1}" aria-current="${d === mIdx}"></button>`,
    )
    .join("");
  $("#mCount").textContent = `${mIdx + 1} / ${mImgs.length}`;
  const solo = mImgs.length < 2;
  $("#mPrev").style.display = solo ? "none" : "";
  $("#mNext").style.display = solo ? "none" : "";
  $("#mDots").style.display = solo ? "none" : "";
}

function openModal(id, srcEl) {
  const p = P.find((x) => x.id === id);
  if (!p) return;
  mItem = id;
  mFrom = srcEl || null;
  const fill = () => {
    $("#mTitle").textContent = `${p.n} – ${p.w}`;
    $("#mSub").textContent =
      `${p[lang]} · ${t("f").replace("{a}", p.age)} · ${fmt(PRICE)}`;
    mImgs = [{ src: p.img, alt: p.n }];
    if (p.fiche) mImgs.push({ src: p.fiche, alt: p.n });
    $("#mTrack").innerHTML = mImgs
      .map((g) => `<div class="slide"><img src="${g.src}" alt="${g.alt}"></div>`)
      .join("");
    showSlide(0);
    $("#mIng").textContent = p.ing[lang];
    $("#mPrep").textContent = t("prepK") + p.prep[lang];
    $("#mPrice").textContent = fmt(PRICE);
    const mst = $("#mStock"),
      st = p.stock || "in";
    mst.textContent = t("stock_" + st);
    mst.className = "stock " + st;
    $("#modal").hidden = false;
    document.body.style.overflow = "hidden";
    $("#mClose").focus();
  };
  // Overdrive: the card morphs into the sheet — same view-transition-name pair
  // (card in the old snapshot, sheet in the new). No VT: plain cssin animations.
  if (vtOn() && srcEl) {
    srcEl.style.viewTransitionName = "product";
    document.startViewTransition(() => {
      srcEl.style.viewTransitionName = ""; // new state: the sheet carries the name
      fill();
    });
  } else {
    $("#modal").classList.add("cssin");
    fill();
  }
}

function closeModal() {
  $("#modal").hidden = true;
  document.body.style.overflow = "";
}

function closeSheet() {
  // Morph the sheet back onto the element that opened it (hero box or card).
  let card = null,
    src = mFrom;
  if (!src && mItem) {
    const btn = document.querySelector(`.card button[data-o="${mItem}"]`);
    card = btn ? btn.closest(".card") : null;
    src = card;
  }
  if (!vtOn() || !src) {
    closeModal();
    mFrom = null;
    return;
  }
  const vt = document.startViewTransition(() => {
    if (src) src.style.viewTransitionName = "product";
    closeModal();
  });
  vt.finished.finally(() => {
    if (card) card.style.viewTransitionName = "";
    if (mFrom) mFrom.style.viewTransitionName = "";
    mFrom = null;
  });
}

$("#grid").onclick = (e) => {
  const v = e.target.closest("[data-v]");
  if (v) {
    openModal(v.dataset.v, v.closest(".card").querySelector(".can"));
    return;
  }
  const o = e.target.closest("[data-o]");
  if (o && !o.disabled) {
    const id = o.dataset.o;
    if (!cart[id]) {
      cart[id] = 1;
      saveCart();
      const out = o.closest(".card").querySelector("output");
      out.textContent = cart[id];
      out.classList.add("pop");
      sum();
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const im = o.closest(".card").querySelector(".can img");
        if (im) flyToCart(im.currentSrc || im.src, im.getBoundingClientRect());
      }
    }
    $("#commande").scrollIntoView({ block: "start" });
    return;
  }
  const b = e.target.closest("button");
  if (!b) return;
  const id = b.dataset.p || b.dataset.m;
  if (!id) return;
  cart[id] = Math.max(0, (cart[id] || 0) + (b.dataset.p ? 1 : -1));
  saveCart();
  const out = b.parentNode.querySelector("output");
  out.textContent = cart[id];
  out.classList.remove("pop");
  void out.offsetHeight;
  out.classList.add("pop");
  sum();
  if (b.dataset.p) {
    const toast = $("#toast");
    toast.hidden = false;
    clearTimeout(toast._h);
    toast._h = setTimeout(hideToast, 3200);
  }
};

$("#age").onclick = (e) => {
  const b = e.target.closest("button");
  if (b) {
    filter = +b.dataset.a;
    render();
  }
};

$("#sThumbs").onclick = (e) => {
  const b = e.target.closest("[data-s]");
  if (b) showProduct(+b.dataset.s, true);
};
$("#sbox").onclick = () => {
  if (sSwiped) {
    sSwiped = false;
    return;
  }
  if (P[sIdx]) openModal(P[sIdx].id, $("#sbox"));
};
for (const ev of ["pointerenter", "focusin"]) {
  $("#showcase").addEventListener(ev, () => clearInterval(sTimer));
}
for (const ev of ["pointerleave", "focusout"]) {
  $("#showcase").addEventListener(ev, restartShow);
}
let sTouchX = null,
  sSwiped = false;
$("#stage").addEventListener(
  "touchstart",
  (e) => {
    sTouchX = e.touches[0].clientX;
    sSwiped = false;
  },
  { passive: true }
);
$("#stage").addEventListener("touchend", (e) => {
  if (sTouchX === null) return;
  const dx = e.changedTouches[0].clientX - sTouchX;
  if (Math.abs(dx) > 40) {
    sSwiped = true;
    showProduct(sIdx + (dx < 0 ? 1 : -1), true);
  }
  sTouchX = null;
});
new IntersectionObserver((es) => {
  sVisible = es[0].isIntersecting;
}).observe($("#showcase"));

$("#lang").onclick = () => {
  lang = lang === "fr" ? "en" : "fr";
  try {
    localStorage.setItem("lang", lang);
  } catch (e) {}
  // Overdrive: the whole page dissolves into the other language.
  if (vtOn()) document.startViewTransition(render);
  else render();
};

function syncThemeIcon() {
  const d = document.documentElement,
    dark = d.dataset.theme === "dark";
  $("#theme").dataset.mode = dark ? "dark" : "light";
  $("#theme").setAttribute(
    "aria-label",
    dark
      ? "Passer en mode clair / Light mode"
      : "Passer en mode sombre / Dark mode",
  );
}

$("#theme").onclick = () => {
  const d = document.documentElement,
    apply = () => {
      const dark = d.dataset.theme === "dark";
      d.dataset.theme = dark ? "light" : "dark";
      try {
        localStorage.setItem("theme", d.dataset.theme);
      } catch (e) {}
      syncThemeIcon();
    };
  // Overdrive: the new theme sweeps in from the toggle button.
  if (vtOn()) {
    const r = $("#theme").getBoundingClientRect();
    d.style.setProperty("--tt-x", r.left + r.width / 2 + "px");
    d.style.setProperty("--tt-y", r.top + r.height / 2 + "px");
    try {
      document.startViewTransition({ update: apply, types: ["theme"] });
    } catch (e) {
      document.startViewTransition(apply);
    }
  } else apply();
};

$("#waCopy").onclick = async () => {
  let ok = true;
  try {
    await navigator.clipboard.writeText("+" + WA);
  } catch (e) {
    // clipboard API blocked (file://, http): textarea fallback
    const ta = document.createElement("textarea");
    ta.value = "+" + WA;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.append(ta);
    ta.select();
    ok = document.execCommand("copy");
    ta.remove();
  }
  const b = $("#waCopy");
  if (ok && !matchMedia("(prefers-reduced-motion: reduce)").matches)
    dropBurst(b);
  b.classList.add("copied");
  b.setAttribute("aria-label", t("copied"));
  clearTimeout(b._t);
  b._t = setTimeout(() => b.classList.remove("copied"), 1600);
};

// "Proof comes alive" overdrive: staggered tile entry (CSS), the 100+ count-up
// when the cluster scrolls into view, and a milk-drop burst on copy success.
function dropBurst(btn) {
  for (let i = 0; i < 9; i++) {
    const a = Math.random() * 2 * Math.PI,
      r = 30 + Math.random() * 34,
      s = 6 + Math.random() * 4,
      drop = document.createElement("span");
    drop.className = "wdrop";
    drop.style.width = s + "px";
    drop.style.height = s * 1.35 + "px";
    // Milk / orange / green, same palette family as the hero droplets.
    drop.style.background = i % 3 ? "rgba(224,123,22,.9)" : "rgba(22,163,74,.9)";
    btn.append(drop);
    drop
      .animate(
        [
          { transform: "translate(-50%,-40%)", opacity: 0.95 },
          {
            transform: `translate(calc(-50% + ${Math.cos(a) * r}px), calc(-40% + ${Math.sin(a) * r - 14}px)) scale(.72, 1.25)`,
            opacity: 0,
          },
        ],
        { duration: 520 + Math.random() * 260, easing: "cubic-bezier(0.22,1,0.36,1)" },
      )
      .onfinish = () => drop.remove();
  }
}

let aproposSeen = false,
  counted = false;

function countFamilies() {
  if (counted) return;
  aproposSeen = true;
  const el = $("#abN1");
  if (!el) return;
  const s = T[lang] ? t("abN1") : "",
    m = s && s.match(/^(\d+)/);
  if (!m) return;
  counted = true;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const target = +m[1],
    suffix = s.slice(m[1].length), // e.g. "+" in "100+"
    d = 1000,
    t0 = performance.now();
  requestAnimationFrame(function step(now) {
    const k = Math.min(1, (now - t0) / d),
      e = k === 1 ? 1 : 1 - Math.pow(2, -9 * k); // ease-out-expo
    if (k < 1) {
      el.textContent = Math.max(1, Math.round(target * e)) + suffix;
      requestAnimationFrame(step);
    } else {
      el.textContent = s;
      el.classList.add("pop");
    }
  });
}

new IntersectionObserver(
  (es) => {
    if (es[0].isIntersecting) countFamilies();
  },
  { threshold: 0.3 },
).observe($("#apropos"));

$("#order").onsubmit = (e) => {
  e.preventDefault();
  const n = count();
  if (!n) {
    $("#sum").scrollIntoView({ block: "center" });
    return;
  }
  const F = T[lang],
    pay = $("#o-pay").value === "cash" ? F.cash : $("#o-pay").value,
    city = $("#o-city").value.trim();
  const m = [
    F.oh,
    ...lines().map((l) => "- " + l),
    "",
    `${F.tot} : ${fmt(n * PRICE)} (${F.nofee})`,
    `${F.ql} : ${$("#o-dist").value}`,
    ...(city ? [`${F.cityL} : ${city}`] : []),
    `${F.pl} : ${pay}`,
    `${F.nl} : ${$("#o-name").value}`,
  ].join("\n");
  location.href = wa(m);
};

$("#contactF").onsubmit = async (e) => {
  e.preventDefault();
  const status = $("#c-status"),
    btn = $("#contactF button[type=submit]");
  status.textContent = t("sending");
  btn.disabled = true;
  try {
    const r = await fetch(
      "https://formsubmit.co/ajax/" + encodeURIComponent(CONTACT_EMAIL),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          _subject: `${t("brand")} – ${t("conH")}`,
          name: $("#c-name").value,
          phone: $("#c-tel").value,
          message: $("#c-msg").value,
        }),
      },
    );
    if (!r.ok) throw new Error("send " + r.status);
    status.textContent = t("conOk");
    $("#contactF").reset();
  } catch (err) {
    console.error(err);
    status.textContent = t("conErr");
  }
  btn.disabled = false;
};

async function boot() {
  try {
    const [pr, tr, te] = await Promise.all([
      fetch("data/products.json").then((r) => {
        if (!r.ok) throw new Error("products " + r.status);
        return r.json();
      }),
      fetch("data/translations.json").then((r) => {
        if (!r.ok) throw new Error("translations " + r.status);
        return r.json();
      }),
      // Optional: missing or invalid file just hides the testimonials block.
      fetch("data/testimonials.json")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]);
    P = pr;
    T = tr;
    TE = Array.isArray(te) ? te : [];
    for (const id of Object.keys(cart)) {
      const p = P.find((x) => x.id === id);
      if (!p || p.stock === "out") delete cart[id];
    }
    syncThemeIcon();
    render();
  } catch (err) {
    $("#grid").innerHTML =
      "<p>Impossible de charger les produits. Vérifiez la connexion puis rechargez.</p>";
    console.error(err);
  }
}

$("#mClose").onclick = () => closeSheet();
$("#toast").onclick = hideToast;
$("#modal").addEventListener("click", (e) => {
  if (e.target === $("#modal")) closeSheet();
});
$("#mPrev").onclick = (e) => {
  e.stopPropagation();
  showSlide(mIdx - 1);
};
$("#mNext").onclick = (e) => {
  e.stopPropagation();
  showSlide(mIdx + 1);
};
$("#mDots").onclick = (e) => {
  const d = e.target.closest("[data-d]");
  if (d) showSlide(+d.dataset.d);
};
let mTouchX = null;
$("#mSlider").addEventListener(
  "touchstart",
  (e) => (mTouchX = e.touches[0].clientX),
  { passive: true },
);
$("#mSlider").addEventListener("touchend", (e) => {
  if (mTouchX === null) return;
  const dx = e.changedTouches[0].clientX - mTouchX;
  if (Math.abs(dx) > 40) showSlide(mIdx + (dx < 0 ? 1 : -1));
  mTouchX = null;
});
addEventListener("keydown", (e) => {
  if ($("#modal").hidden) return;
  if (e.key === "Escape") closeSheet();
  if (e.key === "ArrowLeft") showSlide(mIdx - 1);
  if (e.key === "ArrowRight") showSlide(mIdx + 1);
});

const io = new IntersectionObserver(
  (es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
  { threshold: 0.12 },
);
document.querySelectorAll(".rv").forEach((el) => io.observe(el));

addEventListener(
  "scroll",
  () =>
    document.querySelector("header").classList.toggle("scrolled", scrollY > 8),
  { passive: true },
);

// Living hero: pointer-reactive bubble canvas + magnetic CTAs + faint can parallax.
// The static hero underneath stays the full fallback (reduced motion, touch, no canvas).
(function livingHero() {
  const hero = document.querySelector(".hero"),
    canvas = document.querySelector("#heroFx");
  if (!hero || !canvas) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    canvas.remove();
    return;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }
  const fine = matchMedia("(pointer: fine)").matches;
  const COLORS = ["255,248,238", "246,164,60", "224,123,22", "255,255,255"];
  const cs = getComputedStyle(hero),
    tok = (k, fb) => {
      const v = cs.getPropertyValue(k).trim();
      return /^\d+\s*,\s*\d+\s*,\s*\d+$/.test(v) ? v : fb;
    };
  const DCOLORS = [
    tok("--milk", "255,255,255"),
    tok("--milk2", "255,240,214"),
    tok("--milk3", "224,123,22"),
  ];
  function spawnDrop(anyY) {
    const pick = Math.random(),
      r = 3 + Math.random() * 6;
    return {
      x: W * (0.06 + Math.random() * 0.88),
      y: anyY ? -Math.random() * H : -14,
      r: r,
      vy: 0.35 + (r / 9) * 1.3,
      sway: Math.random() * Math.PI * 2,
      swaySp: 0.004 + Math.random() * 0.012,
      swayAmp: 6 + Math.random() * 14,
      c: pick < 0.45 ? 0 : pick < 0.75 ? 1 : 2,
      a: 0.45 + Math.random() * 0.3,
    };
  }
  const pointer = { x: -9999, y: -9999 };
  let W = 0,
    H = 0,
    parts = [],
    dops = [],
    splashes = [],
    stageTop = 0,
    stageL = 0,
    stageR = 0,
    visible = true,
    raf = 0;
  function spawn(anyY) {
    return {
      x: Math.random() * W,
      y: anyY ? Math.random() * H : H + 12,
      r: 1.5 + Math.random() * 5,
      vy: 0.12 + Math.random() * 0.35,
      sway: Math.random() * Math.PI * 2,
      swaySp: 0.004 + Math.random() * 0.012,
      swayAmp: 6 + Math.random() * 14,
      c: COLORS[(Math.random() * COLORS.length) | 0],
      a: 0.08 + Math.random() * 0.18,
    };
  }
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2),
      r = hero.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    parts = Array.from({ length: W < 560 ? 16 : 42 }, () => spawn(true));
    dops = Array.from({ length: W < 560 ? 2 : 5 }, () => spawnDrop(true));
    const can = cans ? cans.getBoundingClientRect() : null;
    if (can) {
      stageTop = Math.round(can.top - r.top);
      stageL = Math.round(can.left - r.left);
      stageR = Math.round(can.right - r.left);
    } else stageTop = stageL = stageR = 0;
  }
  const btns = [...hero.querySelectorAll(".row .btn")].map((b) => ({
    b,
    tx: 0,
    ty: 0,
    x: 0,
    y: 0,
  }));
  if (fine) {
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      for (const o of btns) {
        const br = o.b.getBoundingClientRect(),
          cx = br.left - r.left + br.width / 2,
          cy = br.top - r.top + br.height / 2;
        o.tx = Math.max(-8, Math.min(8, (pointer.x - cx) * 0.08));
        o.ty = Math.max(-8, Math.min(8, (pointer.y - cy) * 0.12));
      }
    });
    hero.addEventListener("pointerleave", () => {
      pointer.x = -9999;
      pointer.y = -9999;
      for (const o of btns) {
        o.tx = 0;
        o.ty = 0;
      }
    });
  }
  function tick() {
    raf = 0;
    if (!visible || document.hidden) return;
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.y -= p.vy;
      p.sway += p.swaySp;
      const dx = p.x - pointer.x,
        dy = p.y - pointer.y,
        d2 = dx * dx + dy * dy;
      if (d2 < 14400 && d2 > 1) {
        const d = Math.sqrt(d2),
          f = ((120 - d) / 120) * 1.6;
        p.x += (dx / d) * f;
        p.y += (dy / d) * f;
      }
      if (p.y < -14) Object.assign(p, spawn(false));
      ctx.beginPath();
      ctx.arc(p.x + Math.sin(p.sway) * p.swayAmp * 0.3, p.y, p.r, 0, 6.2832);
      ctx.fillStyle = `rgba(${p.c},${p.a.toFixed(3)})`;
      ctx.fill();
    }
    for (const p of dops) {
      p.y += p.vy;
      p.sway += p.swaySp;
      const px = p.x + Math.sin(p.sway) * p.swayAmp;
      if (p.y > H + 20) Object.assign(p, spawnDrop(false));
      if (stageTop > 0 && p.y >= stageTop && px > stageL && px < stageR) {
        const n = 6 + ((Math.random() * 4) | 0);
        for (let i = 0; i < n; i++)
          splashes.push({
            x: px,
            y: stageTop - 2,
            vx: (Math.random() - 0.5) * 3,
            vy: -(0.8 + Math.random() * 2.2),
            r: 0.8 + Math.random() * 1.5,
            c: p.c,
            life: 1,
          });
        if (splashes.length > 120) splashes.splice(0, splashes.length - 120);
        Object.assign(p, spawnDrop(false));
        continue;
      }
      ctx.save();
      ctx.translate(px, p.y);
      ctx.rotate(Math.sin(p.sway) * 0.16);
      ctx.beginPath();
      ctx.moveTo(0, -p.r * 2.15);
      ctx.quadraticCurveTo(p.r * 0.9, -p.r * 0.75, p.r, p.r * 0.4);
      ctx.arc(0, p.r * 0.4, p.r, 0, 3.14159, false);
      ctx.quadraticCurveTo(-p.r * 0.9, -p.r * 0.75, 0, -p.r * 2.15);
      ctx.globalAlpha = p.a;
      ctx.fillStyle = `rgb(${DCOLORS[p.c]})`;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(
        -p.r * 0.32,
        p.r * 0.25,
        p.r * 0.24,
        p.r * 0.4,
        -0.45,
        0,
        6.2832,
      );
      ctx.fillStyle = "rgba(255,255,255,.45)";
      ctx.fill();
      ctx.restore();
    }
    for (let i = splashes.length - 1; i >= 0; i--) {
      const s = splashes[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.085;
      s.life -= 0.02 + Math.random() * 0.012;
      if (s.life <= 0) {
        splashes.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = s.life * 0.55;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * s.life, 0, 6.2832);
      ctx.fillStyle = `rgb(${DCOLORS[s.c]})`;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const o of btns) {
      o.x += (o.tx - o.x) * 0.15;
      o.y += (o.ty - o.y) * 0.15;
      o.b.style.translate =
        Math.abs(o.x) + Math.abs(o.y) > 0.1
          ? `${o.x.toFixed(2)}px ${o.y.toFixed(2)}px`
          : "";
    }
    raf = requestAnimationFrame(tick);
  }
  function play() {
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick);
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }
  const cans = document.querySelector("#stage");
  addEventListener(
    "scroll",
    () => {
      if (cans)
        cans.style.translate = `0 ${Math.min(scrollY * 0.05, 36).toFixed(1)}px`;
    },
    { passive: true },
  );
  new IntersectionObserver((es) => {
    visible = es[0].isIntersecting;
    visible ? play() : stop();
  }).observe(hero);
  document.addEventListener("visibilitychange", () =>
    document.hidden ? stop() : play(),
  );
  addEventListener("resize", resize);
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(hero);
  resize();
  play();
})();

boot();
