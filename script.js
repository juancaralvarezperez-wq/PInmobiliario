// Luxury360 — interacciones del prototipo.
// IMPORTANTE: localStorage solo sirve para pruebas locales. No usar para producción.

function mostrarAviso(mensaje, tipo = "success") {
  const anterior = document.getElementById("aviso-flotante");
  if (anterior) anterior.remove();
  const aviso = document.createElement("div");
  aviso.id = "aviso-flotante";
  aviso.className = `toast${tipo === "error" ? " error" : ""}`;
  aviso.textContent = mensaje;
  aviso.setAttribute("role", tipo === "error" ? "alert" : "status");
  document.body.appendChild(aviso);
  window.setTimeout(() => aviso.remove(), 4200);
}

function leerLista(clave) {
  try {
    const valor = JSON.parse(localStorage.getItem(clave) || "[]");
    return Array.isArray(valor) ? valor : [];
  } catch (error) {
    console.error(`No se pudo leer ${clave}:`, error);
    return [];
  }
}

function guardarLista(clave, lista) {
  localStorage.setItem(clave, JSON.stringify(lista));
}

function mostrarMensaje(elemento, mensaje, tipo) {
  if (!elemento) return;
  elemento.textContent = mensaje;
  elemento.className = `form-message ${tipo || ""}`;
}

function inicializarMenu() {
  const abrir = document.getElementById("openMenu");
  const cerrar = document.getElementById("closeMenu");
  const fondo = document.getElementById("sidebarBackdrop");
  const sidebar = document.getElementById("sidebar");

  function cambiarMenu(abierto) {
    document.body.classList.toggle("menu-open", abierto);
    if (abrir) abrir.setAttribute("aria-expanded", String(abierto));
    if (sidebar) sidebar.setAttribute("aria-hidden", String(!abierto));
    if (abierto && cerrar) cerrar.focus();
    if (!abierto && abrir) abrir.focus();
  }
  if (abrir) abrir.addEventListener("click", () => cambiarMenu(true));
  if (cerrar) cerrar.addEventListener("click", () => cambiarMenu(false));
  if (fondo) fondo.addEventListener("click", () => cambiarMenu(false));
  document.addEventListener("keydown", evento => {
    if (evento.key === "Escape" && document.body.classList.contains("menu-open")) cambiarMenu(false);
  });
  document.querySelectorAll(".side-nav a").forEach(enlace => {
    enlace.addEventListener("click", () => cambiarMenu(false));
  });
}

function inicializarFiltros() {
  const botones = document.querySelectorAll("[data-filter]");
  const tarjetas = document.querySelectorAll(".property-card");
  const vacio = document.getElementById("emptyProperties");

  function filtrar(tipo) {
    let visibles = 0;
    tarjetas.forEach(tarjeta => {
      const coincide = tipo === "todas" || tarjeta.dataset.operation === tipo;
      tarjeta.hidden = !coincide;
      if (coincide) visibles++;
    });
    if (vacio) vacio.hidden = visibles !== 0;
    botones.forEach(boton => boton.classList.toggle("is-active", boton.dataset.filter === tipo));
  }
  botones.forEach(boton => boton.addEventListener("click", () => filtrar(boton.dataset.filter)));
  document.querySelectorAll("[data-filter-link]").forEach(enlace => {
    enlace.addEventListener("click", () => {
      const tipo = enlace.dataset.filterLink;
      if (document.querySelector(`[data-filter="${tipo}"]`)) filtrar(tipo);
    });
  });
}



async function renderizarPropiedadesGuardadas() {
    const contenedor = document.getElementById("propertyGrid");

    if (!contenedor) return;

    try {
        const respuesta = await fetch("obtener_propiedades.php", {
            cache: "no-store"
        });

        if (!respuesta.ok) {
            throw new Error("No se pudieron obtener las propiedades.");
        }

        const datos = await respuesta.json();

        if (!datos.success || !Array.isArray(datos.propiedades)) {
            throw new Error("La respuesta del servidor no es válida.");
        }

        // Quitar únicamente las propiedades dinámicas anteriores
        contenedor.querySelectorAll(".property-card-aiven").forEach(
            tarjeta => tarjeta.remove()
        );

        datos.propiedades.forEach(propiedad => {
            const tarjeta = document.createElement("article");

            tarjeta.className = "property-card property-card-aiven";
            tarjeta.dataset.operation = propiedad.operacion;

            const imagenContenedor = document.createElement("div");
            imagenContenedor.className = "property-image-wrap";

            const imagen = document.createElement("img");
            imagen.className = "property-image";
            imagen.src = propiedad.imagen || "";
            imagen.alt = propiedad.titulo || "Imagen de propiedad";

            const etiqueta = document.createElement("span");
            etiqueta.className = "property-tag";

            if (propiedad.operacion === "renta") {
                etiqueta.textContent = "En renta";
                etiqueta.classList.add("property-tag-rent");
            } else {
                etiqueta.textContent = "En venta";
            }

            imagenContenedor.append(imagen, etiqueta);

            const informacion = document.createElement("div");
            informacion.className = "property-info";

            const ubicacion = document.createElement("p");
            ubicacion.className = "property-location";
            ubicacion.textContent =
                `${propiedad.ciudad}, ${propiedad.estado}`;

            const titulo = document.createElement("h3");
            titulo.textContent = propiedad.titulo;

            const descripcion = document.createElement("p");
            descripcion.className = "property-description";
            descripcion.textContent = propiedad.descripcion;

            const parteInferior = document.createElement("div");
            parteInferior.className = "property-bottom";

            const precio = document.createElement("strong");
            precio.className = "property-price";

            const cantidad = Number(propiedad.precio);

            precio.textContent = cantidad.toLocaleString("es-MX", {
                style: "currency",
                currency: "MXN"
            });

            const moneda = document.createElement("small");
            moneda.textContent = propiedad.operacion === "renta"
                ? " / mes"
                : " MXN";

            precio.appendChild(moneda);

            const boton = document.createElement("a");
            boton.className = "text-button";
            boton.href = "recorrido.html?id=" +
                encodeURIComponent(propiedad.id);
            boton.textContent = "Recorrer casa en 3D ↗";

            
            const botonInformacion = document.createElement("a");
             botonInformacion.className = "text-button";
              botonInformacion.href =  "solicitar-informacion.html?id=" +
              encodeURIComponent(propiedad.id);
               botonInformacion.textContent = "Solicitar información ↗";

               parteInferior.append(precio, boton, botonInformacion);


            informacion.append(
                ubicacion,
                titulo,
                descripcion,
                parteInferior
            );

            tarjeta.append(imagenContenedor, informacion);
            contenedor.appendChild(tarjeta);
        });

        // Respetar el filtro que esté seleccionado
        const filtroActivo = document.querySelector(
            ".filter-tab.is-active"
        );

        const filtro = filtroActivo?.dataset.filter || "todas";

        contenedor.querySelectorAll(".property-card").forEach(
            tarjeta => {
                tarjeta.hidden =
                    filtro !== "todas" &&
                    tarjeta.dataset.operation !== filtro;
            }
        );

        const vacio = document.getElementById("emptyProperties");

        if (vacio) {
            const visibles = Array.from(
                contenedor.querySelectorAll(".property-card")
            ).some(tarjeta => !tarjeta.hidden);

            vacio.hidden = visibles;
        }

        console.log(
            "Propiedades cargadas desde Aiven:",
            datos.propiedades.length
        );

    } catch (error) {
        console.error("Error al cargar propiedades:", error);
    }
}


function inicializarRegistro() {
  const form = document.getElementById("formRegistro");

  if (!form) return;

  const sat = document.getElementById("regSat");
  const satFields = document.getElementById("satFields");
  const mensaje = document.getElementById("registroMessage");

  if (sat && satFields) {
    sat.addEventListener("change", () => {
      satFields.hidden = sat.value !== "si";
    });
  }

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const nombre = document.getElementById("regNombre").value.trim();
    const apellidos = document.getElementById("regApellidos").value.trim();
    const correo = document.getElementById("regEmail").value.trim();

    const telefono = document.getElementById("regTelefono").value.trim();

    const password = document.getElementById("regPassword").value;
    const passwordConfirm =
      document.getElementById("regPasswordConfirm").value;

    const rol = document.getElementById("regRol").value;

    if (password !== passwordConfirm) {
      mostrarMensaje(
        mensaje,
        "Las contraseñas no coinciden.",
        "error"
      );
      return;
    }

    const usuario = {
      nombre: `${nombre} ${apellidos}`.trim(),
      correo: correo,
      telefono: telefono,
      password: password,
      passwordConfirm: passwordConfirm,
      rol: rol
    };

    const boton = form.querySelector('button[type="submit"]');
    boton.disabled = true;

    try {
      const respuesta = await fetch("registro.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify(usuario)
      });

      const datos = await respuesta.json();

      if (!respuesta.ok || !datos.success) {
        mostrarMensaje(
          mensaje,
          datos.message || "No se pudo crear la cuenta.",
          "error"
        );
        return;
      }

      mostrarMensaje(
        mensaje,
        "¡Cuenta creada correctamente! Redirigiendo...",
        "success"
      );

      form.reset();

      if (satFields) {
        satFields.hidden = true;
      }

      window.setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);

    } catch (error) {
      console.error("Error de registro:", error);

      mostrarMensaje(
        mensaje,
        "Error al comunicarse con el servidor.",
        "error"
      );

    } finally {
      boton.disabled = false;
    }
  });
}





function inicializarLogin() {
  const form = document.getElementById("formLogin");
  if (!form) return;

  const mensaje = document.getElementById("loginMessage");

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const boton = form.querySelector('button[type="submit"]');
    boton.disabled = true;

    try {
      const respuesta = await fetch("login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({ email, password })
      });

      const datos = await respuesta.json();

      if (!respuesta.ok || !datos.success) {
        mostrarMensaje(
          mensaje,
          datos.message || "No se pudo iniciar sesión.",
          "error"
        );
        return;
      }

      sessionStorage.setItem(
        "luxury360Sesion",
        JSON.stringify(datos.usuario)
      );

      mostrarMensaje(
        mensaje,
        "¡Bienvenido a Luxury360!",
        "success"
      );

      window.location.href = "index.html";

    } catch (error) {
      console.error("Error de inicio de sesión:", error);

      mostrarMensaje(
        mensaje,
        "Error al comunicarse con el servidor.",
        "error"
      );

    } finally {
      boton.disabled = false;
    }
  });
}



function inicializarPublicacion() {
  const form = document.getElementById("formPropiedad");

  if (!form) return;

  const mensaje = document.getElementById("propiedadMessage");

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();

      mostrarMensaje(
        mensaje,
        "Completa los campos obligatorios con datos válidos.",
        "error"
      );

      return;
    }

    const precio = Number(
      document.getElementById("propPrecio").value
    );

    if (
      !Number.isFinite(precio) ||
      precio <= 0 ||
      precio > 999999999
    ) {
      mostrarMensaje(
        mensaje,
        "El precio debe ser un número válido mayor que cero.",
        "error"
      );

      return;
    }

    const imagen = document
      .getElementById("propImagen")
      .value.trim();

    if (imagen && !/^https?:\/\//i.test(imagen)) {
      mostrarMensaje(
        mensaje,
        "La fotografía debe tener una URL http o https.",
        "error"
      );

      return;
    }

    const propiedad = {
      titulo: document.getElementById("propTitulo").value.trim(),
      operacion: document.getElementById("propOperacion").value,
      tipo: document.getElementById("propTipo").value,
      precio: precio,
      direccion: document.getElementById("propDireccion").value.trim(),
      ciudad: document.getElementById("propCiudad").value.trim(),
      estado: document.getElementById("propEstado").value.trim(),
      imagen: imagen,
      descripcion: document.getElementById("propDescripcion").value.trim()
    };

    const boton = form.querySelector('button[type="submit"]');
    boton.disabled = true;

    try {
      const respuesta = await fetch("guardar_propiedad.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify(propiedad)
      });

      const datos = await respuesta.json();

      if (!respuesta.ok || !datos.success) {
        mostrarMensaje(
          mensaje,
          datos.message || "No se pudo publicar la propiedad.",
          "error"
        );

        return;
      }

      mostrarMensaje(
        mensaje,
        "¡Propiedad guardada correctamente en Aiven! ID: " +
          datos.id_inmueble,
        "success"
      );

      form.reset();

    } catch (error) {
      console.error("Error al publicar:", error);

      mostrarMensaje(
        mensaje,
        "Error al comunicarse con el servidor.",
        "error"
      );

    } finally {
      boton.disabled = false;
    }
  });
}

function inicializarDetalles() {
  document.querySelectorAll("[data-property-detail]").forEach(boton => {
    boton.addEventListener("click", () => {
      mostrarAviso(`Más información sobre "${boton.dataset.propertyDetail}": pronto podrás consultar su ficha completa.`);
    });
  });
}

function inicializarSitio() {
  inicializarMenu();
  inicializarFiltros();
  renderizarPropiedadesGuardadas();
  inicializarRegistro();
  inicializarLogin();
  inicializarPublicacion();
  inicializarDetalles();
  const year = document.getElementById("currentYear");
  if (year) year.textContent = new Date().getFullYear();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializarSitio);
} else {
  inicializarSitio();
}
