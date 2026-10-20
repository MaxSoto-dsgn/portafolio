// ---------- Filtro de proyectos por categoría ----------
const botones = document.querySelectorAll(".filter");
const tarjetas = document.querySelectorAll(".card");

botones.forEach((boton) => {
  boton.addEventListener("click", () => {
    const filtro = boton.dataset.filter;

    botones.forEach((b) => b.classList.remove("active"));
    boton.classList.add("active");

    tarjetas.forEach((tarjeta) => {
      const categorias = tarjeta.dataset.cat.split(" ");
      const visible = filtro === "todos" || categorias.includes(filtro);
      tarjeta.classList.toggle("hidden", !visible);
    });
  });
});

// ---------- Ventana de proyecto (galería con imágenes y videos) ----------
const modal = document.getElementById("modal");
const zonaMedia = modal.querySelector(".modal-media");
const zonaSlides = modal.querySelector(".slides");
const zonaInfo = modal.querySelector(".modal-info");
const contador = modal.querySelector(".counter");
const btnAnterior = modal.querySelector(".prev");
const btnSiguiente = modal.querySelector(".next");
const btnCerrar = modal.querySelector(".close");

let slides = [];
let actual = 0;
let quienAbrio = null;

// Muestra u oculta una diapositiva y detiene videos que dejan de verse
function activarSlide(slide, activa) {
  slide.classList.toggle("active", activa);
  if (!activa) {
    slide.classList.remove("zoomed");
    slide.scrollTo(0, 0);
  }

  const video = slide.querySelector("video");
  if (video && !activa) video.pause();

  // Los videos incrustados (YouTube, Canva) se cargan solo cuando se muestran
  const iframe = slide.querySelector("iframe");
  if (iframe) {
    if (activa && !iframe.getAttribute("src")) {
      iframe.setAttribute("src", iframe.dataset.src);
    }
    if (!activa) iframe.removeAttribute("src");
  }
}

function mostrar(indice) {
  if (!slides.length) return;
  actual = (indice + slides.length) % slides.length;
  slides.forEach((s, n) => activarSlide(s, n === actual));
  contador.textContent = `${actual + 1} / ${slides.length}`;
}

// Crea una diapositiva a partir de una imagen, un video o un iframe de la tarjeta
function crearSlide(original) {
  const slide = document.createElement("div");
  slide.className = "slide";

  const copia = original.cloneNode(true);
  copia.removeAttribute("onerror");

  if (copia.tagName === "IMG") {
    slide.classList.add("has-img");

    // Pie de foto opcional (atributo data-caption)
    const texto = copia.dataset.caption;
    if (texto) {
      const pie = document.createElement("p");
      pie.className = "caption";
      pie.textContent = texto;
      slide.appendChild(pie);
    }

    copia.addEventListener("error", () => {
      copia.remove();
      const pie = slide.querySelector(".caption");
      if (pie) pie.remove();
      slide.classList.remove("has-img");
      slide.classList.add("missing");
    });
  }
  if (copia.tagName === "VIDEO") {
    copia.controls = true;
    copia.playsInline = true;
    copia.preload = "metadata";
  }
  if (copia.tagName === "IFRAME") {
    copia.dataset.src = copia.getAttribute("src");
    copia.removeAttribute("src");
  }

  slide.appendChild(copia);
  return slide;
}

function abrir(tarjeta) {
  quienAbrio = tarjeta.querySelector("[data-open]");

  // La portada va primero, luego lo que haya dentro de .gallery
  const origenes = [];
  const portada = tarjeta.querySelector(".thumb img");
  if (portada) origenes.push(portada);
  tarjeta.querySelectorAll(".gallery > *").forEach((el) => origenes.push(el));

  zonaSlides.replaceChildren();
  slides = origenes.map(crearSlide);
  slides.forEach((s) => zonaSlides.appendChild(s));

  // Texto del proyecto: se copia desde la tarjeta
  const info = tarjeta.querySelector(".card-body").cloneNode(true);
  info.querySelectorAll("[data-open]").forEach((b) => b.remove());
  // El texto extra (.detalle) solo se muestra en esta ventana
  info.querySelectorAll(".detalle").forEach((d) => (d.hidden = false));
  const acciones = info.querySelector(".actions");
  if (acciones && !acciones.children.length) acciones.remove();
  const titulo = info.querySelector("h3");
  if (titulo) titulo.id = "modal-titulo";
  zonaInfo.replaceChildren(...info.childNodes);
  zonaInfo.scrollTop = 0;

  const variasSlides = slides.length > 1;
  zonaMedia.hidden = slides.length === 0;
  btnAnterior.hidden = !variasSlides;
  btnSiguiente.hidden = !variasSlides;
  contador.hidden = !variasSlides;

  mostrar(0);
  modal.hidden = false;
  document.body.classList.add("modal-open");
  btnCerrar.focus();
}

function cerrar() {
  slides.forEach((s) => activarSlide(s, false));
  zonaSlides.replaceChildren();
  slides = [];
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  if (quienAbrio) quienAbrio.focus();
}

// Abrir con el botón "Ver proyecto" o haciendo clic en la imagen de la tarjeta
document.addEventListener("click", (e) => {
  const disparador = e.target.closest("[data-open], .card .thumb");
  if (!disparador) return;
  e.preventDefault();
  abrir(disparador.closest(".card"));
});

btnCerrar.addEventListener("click", cerrar);
btnAnterior.addEventListener("click", () => mostrar(actual - 1));
btnSiguiente.addEventListener("click", () => mostrar(actual + 1));

// Zoom: clic en una imagen para verla a tamaño real, otro clic para reducirla
zonaSlides.addEventListener("click", (e) => {
  const img = e.target.closest("img");
  if (!img) return;
  const slide = img.closest(".slide");

  if (slide.classList.contains("zoomed")) {
    slide.classList.remove("zoomed");
    slide.scrollTo(0, 0);
    return;
  }

  // Posición del clic dentro de la imagen, para ampliar justo esa zona
  const caja = img.getBoundingClientRect();
  const fx = (e.clientX - caja.left) / caja.width;
  const fy = (e.clientY - caja.top) / caja.height;

  slide.classList.add("zoomed");
  slide.scrollLeft = fx * img.offsetWidth - slide.clientWidth / 2;
  slide.scrollTop = fy * img.offsetHeight - slide.clientHeight / 2;
});

// Clic en el fondo oscuro cierra la ventana
modal.addEventListener("click", (e) => {
  if (e.target === modal) cerrar();
});

// Teclado: Esc cierra, flechas cambian de imagen, Tab se queda dentro de la ventana
document.addEventListener("keydown", (e) => {
  if (modal.hidden) return;

  if (e.key === "Escape") {
    cerrar();
  } else if (e.key === "ArrowLeft" && e.target.tagName !== "VIDEO") {
    mostrar(actual - 1);
  } else if (e.key === "ArrowRight" && e.target.tagName !== "VIDEO") {
    mostrar(actual + 1);
  } else if (e.key === "Tab") {
    const focos = [...modal.querySelectorAll("button, a[href], video")].filter(
      (el) => !el.closest("[hidden]") && !el.closest(".slide:not(.active)")
    );
    if (!focos.length) return;
    const primero = focos[0];
    const ultimo = focos[focos.length - 1];
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  }
});

// Deslizar con el dedo en el celular (se desactiva si la imagen está ampliada)
let inicioX = null;
zonaMedia.addEventListener(
  "touchstart",
  (e) => {
    const ampliada = e.target.closest(".zoomed");
    inicioX = e.target.closest("video, iframe") || ampliada ? null : e.touches[0].clientX;
  },
  { passive: true }
);
zonaMedia.addEventListener("touchend", (e) => {
  if (inicioX === null) return;
  const dx = e.changedTouches[0].clientX - inicioX;
  inicioX = null;
  if (Math.abs(dx) > 50) mostrar(actual + (dx < 0 ? 1 : -1));
});
