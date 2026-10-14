// Shop logic: loads data/*.json, renders catalogue, cart, WhatsApp order.
"use strict";

// Config: WhatsApp number (international format, no +), Facebook URL, unit price,
// contact email (change it here, the form follows automatically).
const WA = "237694639475",
  FB = "https://www.facebook.com/",
  PRICE = 5000,
  CONTACT_EMAIL = "saoudayazieya@gmail.com";

let P = [];
let T = {};

const $ = (s) => document.querySelector(s);
const fmt = (n) => n.toLocaleString("fr-FR").replace(/\u202f/g, " ") + " FCFA";

let lang = "fr",
  filter = 0,
  cart = {};

try {
  lang = localStorage.getItem("lang") === "en" ? "en" : "fr";
  const t = localStorage.getItem("theme");
  if (t) document.documentElement.dataset.theme = t;
} catch (e) {}

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
  $("#heroCans").innerHTML = P.slice(0, 3)
    .map((p) => can(p, 1))
    .join("");
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
      return `<article class="card${out ? " out" : ""}" style="--d:${Math.min(i, 8) * 60}ms">${can(p)}<h3>${p.n}</h3><div>${p[lang]}</div>
  <div class="tags"><span>${t("f").replace("{a}", p.age)}</span><span>${p.w}</span><span>${t("bib").replace("{b}", p.b)}</span></div>
  <div class="actions"><button class="btn o view" data-v="${p.id}"><i class="hgi-stroke hgi-view" aria-hidden="true"></i> ${t("view")}</button><span class="stock ${st}">${t("stock_" + st)}</span></div>
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
}

let mImgs = [],
  mIdx = 0;

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

function openModal(id) {
  const p = P.find((x) => x.id === id);
  if (!p) return;
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
  $("#mPrice").textContent = fmt(PRICE);
  const mst = $("#mStock"),
    st = p.stock || "in";
  mst.textContent = t("stock_" + st);
  mst.className = "stock " + st;
  $("#modal").hidden = false;
  document.body.style.overflow = "hidden";
  $("#mClose").focus();
}

function closeModal() {
  $("#modal").hidden = true;
  document.body.style.overflow = "";
}

$("#grid").onclick = (e) => {
  const v = e.target.closest("[data-v]");
  if (v) {
    openModal(v.dataset.v);
    return;
  }
  const b = e.target.closest("button");
  if (!b) return;
  const id = b.dataset.p || b.dataset.m;
  if (!id) return;
  cart[id] = Math.max(0, (cart[id] || 0) + (b.dataset.p ? 1 : -1));
  const out = b.parentNode.querySelector("output");
  out.textContent = cart[id];
  out.classList.remove("pop");
  void out.offsetHeight;
  out.classList.add("pop");
  sum();
};

$("#age").onclick = (e) => {
  const b = e.target.closest("button");
  if (b) {
    filter = +b.dataset.a;
    render();
  }
};

$("#lang").onclick = () => {
  lang = lang === "fr" ? "en" : "fr";
  try {
    localStorage.setItem("lang", lang);
  } catch (e) {}
  render();
};

function syncThemeIcon() {
  const d = document.documentElement,
    dark = d.dataset.theme
      ? d.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme:dark)").matches;
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
    dark = d.dataset.theme
      ? d.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme:dark)").matches;
  d.dataset.theme = dark ? "light" : "dark";
  try {
    localStorage.setItem("theme", d.dataset.theme);
  } catch (e) {}
  syncThemeIcon();
};

$("#order").onsubmit = (e) => {
  e.preventDefault();
  const n = count();
  if (!n) {
    $("#sum").scrollIntoView({ block: "center" });
    return;
  }
  const F = T.fr,
    pay = $("#o-pay").value === "cash" ? F.cash : $("#o-pay").value;
  const m = [
    F.oh,
    ...lines().map((l) => "- " + l),
    "",
    `${F.tot} : ${fmt(n * PRICE)} (${F.nofee})`,
    `${F.ql} : ${$("#o-dist").value}`,
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
    const [pr, tr] = await Promise.all([
      fetch("data/products.json").then((r) => {
        if (!r.ok) throw new Error("products " + r.status);
        return r.json();
      }),
      fetch("data/translations.json").then((r) => {
        if (!r.ok) throw new Error("translations " + r.status);
        return r.json();
      }),
    ]);
    P = pr;
    T = tr;
    syncThemeIcon();
    render();
  } catch (err) {
    $("#grid").innerHTML =
      "<p>Impossible de charger les produits. Vérifiez la connexion puis rechargez.</p>";
    console.error(err);
  }
}

$("#mClose").onclick = closeModal;
$("#modal").addEventListener("click", (e) => {
  if (e.target === $("#modal")) closeModal();
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
  if (e.key === "Escape") closeModal();
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

boot();
