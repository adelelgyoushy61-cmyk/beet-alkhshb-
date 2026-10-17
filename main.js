document.addEventListener("DOMContentLoaded", () => {
  const S = window.SITE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const money = n => n.toLocaleString("ar-EG") + " " + S.currency;
  const waLink = text => `https://wa.me/${S.phoneIntl}?text=${encodeURIComponent(text)}`;

  /* 1. Fill site data from config.js */
  document.title = `${S.brand} | ${S.tagline}`;
  $$("[data-brand]").forEach(e => e.textContent = S.brand);
  $$("[data-address]").forEach(e => e.textContent = S.address);
  $$("[data-hours]").forEach(e => e.textContent = S.hours);
  $$("[data-tel]").forEach(e => { e.textContent = S.phoneDisplay; e.href = "tel:+" + S.phoneIntl; });
  $$("[data-mail]").forEach(e => { e.textContent = S.email; e.href = "mailto:" + S.email; });
  $$("[data-wa]").forEach(e => e.href = waLink(`مرحباً ${S.brand}، أريد الاستفسار عن الأثاث.`));
  $$("[data-social]").forEach(e => { const u = S.social[e.dataset.social]; u && u !== "#" ? e.href = u : e.remove(); });
  $("#year").textContent = new Date().getFullYear();
  if (S.mapEmbed) $("#mapBox").innerHTML = `<iframe src="${S.mapEmbed}" title="موقع المعرض" loading="lazy" class="w-full h-full border-0" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
  $("#ldjson").textContent = JSON.stringify({
    "@context": "https://schema.org", "@type": "FurnitureStore", name: S.brand,
    telephone: "+" + S.phoneIntl, email: S.email, address: S.address, openingHours: S.hours
  });

  /* 2. Products + category filter */
  const grid = $("#productGrid"), filters = $("#filters");
  const cats = [{ id: "all", name: "الكل" }, ...S.categories];
  filters.innerHTML = cats.map((c, i) => `<button class="chip" data-cat="${c.id}" aria-pressed="${i === 0}">${c.name}</button>`).join("");
  const renderProducts = cat => {
    const list = S.products.filter(p => cat === "all" || p.cat === cat);
    grid.innerHTML = list.map(p => `
      <article class="product">
        <div class="thumb"><img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.style.visibility='hidden'"></div>
        <div class="p-5">
          <h3 class="font-bold text-lg text-walnut mb-1">${p.name}</h3>
          <p class="text-oak-dark font-bold mb-4">${p.price ? "تبدأ من " + money(p.price) : "السعر عند الطلب"}</p>
          <a class="btn btn-line w-full !py-2" target="_blank" rel="noopener" href="${waLink(`مرحباً، أريد الاستفسار عن: ${p.name}`)}">اسأل عن السعر</a>
        </div>
      </article>`).join("");
    if (!reduced && window.gsap) gsap.from("#productGrid .product", { opacity: 0, y: 24, duration: .5, stagger: .06, ease: "power2.out", clearProps: "all" });
  };
  filters.addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    $$(".chip", filters).forEach(c => c.setAttribute("aria-pressed", c === b));
    renderProducts(b.dataset.cat);
  });
  renderProducts("all");

  /* 3. Gallery + lightbox */
  const gal = S.products.slice(0, 8);
  $("#galleryGrid").innerHTML = gal.map((p) => `<button class="aspect-[4/3] overflow-hidden rounded-lg" data-src="${p.img.replace("w=700", "w=1400")}" data-alt="${p.name}" aria-label="تكبير صورة ${p.name}"><img src="${p.img}" alt="${p.name}" loading="lazy" class="gallery-item w-full h-full object-cover min-h-[10rem]"></button>`).join("");
  const lb = $("#lightbox");
  $("#galleryGrid").addEventListener("click", e => {
    const b = e.target.closest("button[data-src]"); if (!b) return;
    $("#lbImg").src = b.dataset.src; $("#lbImg").alt = b.dataset.alt;
    lb.showModal();
  });
  $("#lbClose").addEventListener("click", () => lb.close());
  lb.addEventListener("click", e => { if (e.target === lb) lb.close(); });

  /* 4. FAQ + form category list */
  $("#faqList").innerHTML = S.faq.map(f => `<details class="faq"><summary>${f.q}</summary><p>${f.a}</p></details>`).join("");
  $("#interest").innerHTML = S.categories.map(c => `<option>${c.name}</option>`).join("") + "<option>أخرى</option>";

  /* 5. Header: scrolled state, mobile menu, active link, back to top */
  const header = $("#header"), toTop = $("#toTop");
  const onScroll = () => { header.classList.toggle("scrolled", scrollY > 40); toTop.classList.toggle("show", scrollY > 700); };
  onScroll(); addEventListener("scroll", onScroll, { passive: true });
  toTop.addEventListener("click", () => scrollTo({ top: 0 }));
  const menuBtn = $("#menuBtn"), menu = $("#mobileMenu");
  const setMenu = open => {
    menu.style.maxHeight = open ? menu.scrollHeight + "px" : "0";
    menuBtn.setAttribute("aria-expanded", open);
    header.classList.toggle("scrolled", open || scrollY > 40);
  };
  menuBtn.addEventListener("click", () => setMenu(menuBtn.getAttribute("aria-expanded") !== "true"));
  $$("a", menu).forEach(a => a.addEventListener("click", () => setMenu(false)));
  const links = $$(".nav-link");
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) links.forEach(l => l.classList.toggle("active", l.getAttribute("href") === "#" + en.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach(s => io.observe(s));

  /* 6. Testimonials slider (RTL, no loop warning) */
  if (window.Swiper) new Swiper(".mySwiper", {
    rewind: true, spaceBetween: 20, slidesPerView: 1,
    breakpoints: { 768: { slidesPerView: 2 }, 1100: { slidesPerView: 3 } },
    autoplay: reduced ? false : { delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true },
    pagination: { el: ".swiper-pagination", clickable: true }
  });

  /* 7. Hero entrance + counters (guarded so content never stays hidden) */
  const counters = $$("[data-count]");
  const runCount = el => {
    const end = +el.dataset.count;
    if (reduced || !window.gsap) { el.textContent = end.toLocaleString("ar-EG"); return; }
    const o = { v: 0 };
    gsap.to(o, { v: end, duration: 1.6, ease: "power1.out", onUpdate: () => el.textContent = Math.round(o.v).toLocaleString("ar-EG") });
  };
  if (window.gsap && !reduced) {
    gsap.from("#top h1, #top p, #top .btn", { opacity: 0, y: 28, duration: .9, stagger: .12, ease: "power3.out", clearProps: "all" });
  }
  const cio = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); } }), { threshold: .6 });
  counters.forEach(c => cio.observe(c));

  /* 8. Contact form -> WhatsApp (with validation) */
  const form = $("#contactForm"), fb = $("#formFeedback");
  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = $("#name").value.trim(), phone = $("#phone").value.trim(), msg = $("#message").value.trim();
    const bad = [["#name", !name], ["#phone", !/^[0-9+\s\-]{8,16}$/.test(phone)], ["#message", !msg]];
    bad.forEach(([s, b]) => $(s).classList.toggle("invalid", b));
    if (bad.some(([, b]) => b)) { fb.className = "text-center text-sm min-h-[1.5rem] text-red-300"; fb.textContent = "من فضلك أكمل الحقول المطلوبة وتأكد من رقم الهاتف."; return; }
    const text = `طلب جديد من الموقع\nالاسم: ${name}\nالهاتف: ${phone}\nالقسم: ${$("#interest").value}\nالتفاصيل: ${msg}`;
    window.open(waLink(text), "_blank", "noopener");
    fb.className = "text-center text-sm min-h-[1.5rem] text-emerald-300";
    fb.textContent = "تم تجهيز طلبك، أكمل إرساله من واتساب.";
    form.reset();
  });
  $$(".field", form).forEach(f => f.addEventListener("input", () => f.classList.remove("invalid")));
});
