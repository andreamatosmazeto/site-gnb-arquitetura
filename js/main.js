/* GNB Arquitetura — interações do site (JavaScript sem dependências) */
(function () {
  "use strict";

  var doc = document;
  var body = doc.body;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Menu mobile ---------- */
  var toggle = doc.querySelector(".nav-toggle");
  var nav = doc.getElementById("menu");
  function setMenu(open) {
    body.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setMenu(!body.classList.contains("nav-open"));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && body.classList.contains("nav-open")) {
        setMenu(false);
        toggle.focus();
      }
    });
    window.matchMedia("(min-width: 961px)").addEventListener("change", function (mq) {
      if (mq.matches) setMenu(false);
    });
  }

  /* ---------- Hero: sequência de projetos ---------- */
  var hero = doc.querySelector("[data-hero]");
  if (hero) {
    var slides = hero.querySelectorAll(".hero__slide");
    var dots = hero.querySelectorAll(".hero__dot");
    var caption = hero.querySelector(".hero__caption-text");
    var pauseBtn = hero.querySelector(".hero__pause");
    var current = 0;
    var timer = null;
    var playing = !reduceMotion;

    function show(i) {
      slides[current].classList.remove("is-active");
      dots[current].removeAttribute("aria-current");
      current = (i + slides.length) % slides.length;
      var slide = slides[current];
      slide.classList.add("is-active");
      dots[current].setAttribute("aria-current", "true");
      caption.innerHTML =
        "<strong>" + slide.dataset.title + "</strong>" + slide.dataset.sub +
        " · " + String(current + 1).padStart(2, "0") + " / " + String(slides.length).padStart(2, "0");
    }
    function start() {
      stop();
      timer = window.setInterval(function () { show(current + 1); }, 6500);
    }
    function stop() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }
    function updatePause() {
      pauseBtn.setAttribute("aria-label", playing ? "Pausar apresentação" : "Retomar apresentação");
      pauseBtn.innerHTML = playing
        ? '<svg viewBox="0 0 14 14" aria-hidden="true"><path fill="currentColor" d="M3 1h3v12H3zM8 1h3v12H8z"/></svg>'
        : '<svg viewBox="0 0 14 14" aria-hidden="true"><path fill="currentColor" d="M3 1l10 6-10 6z"/></svg>';
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        if (playing) start();
      });
    });
    pauseBtn.addEventListener("click", function () {
      playing = !playing;
      playing ? start() : stop();
      updatePause();
    });
    doc.addEventListener("visibilitychange", function () {
      if (doc.hidden) stop();
      else if (playing) start();
    });

    show(0);
    updatePause();
    if (playing) start();
  }

  /* ---------- Lightbox dos projetos de stands ---------- */
  var lb = doc.getElementById("lightbox");
  var lbItems = [];
  var lbIndex = 0;
  var lbReturn = null;

  function lbRender() {
    var item = lbItems[lbIndex];
    var img = lb.querySelector(".lightbox__stage img");
    img.src = item.src;
    img.alt = item.alt;
    lb.querySelector(".lightbox__counter").textContent =
      String(lbIndex + 1).padStart(2, "0") + " / " + String(lbItems.length).padStart(2, "0");
    lb.querySelector(".lightbox__caption").textContent = item.caption || "";
    var multiple = lbItems.length > 1;
    lb.querySelectorAll("[data-lb-prev],[data-lb-next]").forEach(function (b) { b.hidden = !multiple; });
    // pré-carrega a próxima imagem
    if (multiple) new Image().src = lbItems[(lbIndex + 1) % lbItems.length].src;
  }
  function lbOpen(items, index, title, sub, trigger) {
    if (!lb || typeof lb.showModal !== "function") {
      window.open(items[index].src, "_blank", "noopener");
      return;
    }
    lbItems = items;
    lbIndex = index;
    lbReturn = trigger;
    lb.querySelector(".lightbox__title").innerHTML = (sub ? "<small>" + sub + "</small>" : "") + title;
    lbRender();
    lb.showModal();
    body.style.overflow = "hidden";
  }
  function lbStep(d) {
    lbIndex = (lbIndex + d + lbItems.length) % lbItems.length;
    lbRender();
  }

  if (lb) {
    lb.querySelector("[data-lb-close]").addEventListener("click", function () { lb.close(); });
    lb.querySelector("[data-lb-prev]").addEventListener("click", function () { lbStep(-1); });
    lb.querySelector("[data-lb-next]").addEventListener("click", function () { lbStep(1); });
    lb.addEventListener("close", function () {
      body.style.overflow = "";
      if (lbReturn) lbReturn.focus();
    });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") lbStep(1);
      if (e.key === "ArrowLeft") lbStep(-1);
    });
    lb.querySelector(".lightbox__stage").addEventListener("click", function (e) {
      if (e.target === e.currentTarget) lb.close();
    });
    // gesto de arrastar no celular
    var touchX = null;
    lb.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) lbStep(dx < 0 ? 1 : -1);
      touchX = null;
    });

    // Projetos de stands: imagens nomeadas como assets/images/stands/<slug>-<n>.webp
    doc.querySelectorAll("[data-case]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var slug = btn.dataset.case;
        var total = parseInt(btn.dataset.count, 10) || 1;
        var name = btn.dataset.title;
        var items = [];
        for (var i = 1; i <= total; i++) {
          items.push({
            src: "assets/images/stands/" + slug + "-" + i + ".webp",
            alt: "Render 3D do stand " + name + ", imagem " + i + " de " + total,
            caption: "Render 3D · Projeto GNB Arquitetura"
          });
        }
        lbOpen(items, 0, name, btn.dataset.sub, btn);
      });
    });
  }

  /* ---------- Filtro por ano (stands) ---------- */
  var filters = doc.querySelectorAll("[data-filter]");
  filters.forEach(function (f) {
    f.addEventListener("click", function () {
      var value = f.dataset.filter;
      filters.forEach(function (o) { o.setAttribute("aria-pressed", String(o === f)); });
      doc.querySelectorAll(".cases [data-year]").forEach(function (c) {
        c.hidden = value !== "todos" && c.dataset.year !== value;
      });
    });
  });

  /* ---------- Entrada suave ao rolar ---------- */
  var reveals = doc.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- WhatsApp flutuante: aparece depois da primeira dobra
     (o topo já tem CTAs) e some quando o bloco de contato está na tela ---------- */
  var waFloat = doc.querySelector(".wa-float");
  var contact = doc.getElementById("contato");
  if (waFloat) {
    var contactVisible = false;
    var updateWa = function () {
      waFloat.classList.toggle("is-hidden", contactVisible || window.scrollY < window.innerHeight * 0.5);
    };
    if (contact && "IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        contactVisible = entries[0].isIntersecting;
        updateWa();
      }, { threshold: 0.15 }).observe(contact);
    }
    window.addEventListener("scroll", updateWa, { passive: true });
    updateWa();
  }

  /* ---------- Ano no rodapé ---------- */
  var year = doc.querySelector("[data-year-now]");
  if (year) year.textContent = new Date().getFullYear();
})();
