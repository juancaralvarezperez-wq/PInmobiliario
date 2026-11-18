
document.addEventListener("DOMContentLoaded", inicializarSolicitudes);

async function inicializarSolicitudes() {
    const lista = document.getElementById("listaSolicitudes");
    const estadoCarga = document.getElementById("estadoCarga");

    try {
        const respuestaSesion = await fetch("sesion.php", {
            credentials: "same-origin",
            cache: "no-store"
        });

        if (!respuestaSesion.ok) {
            throw new Error("No se pudo verificar la sesión.");
        }

        const sesion = await respuestaSesion.json();

        if (!sesion.autenticado) {
            window.location.replace("login.html");
            return;
        }

        if (sesion.usuario?.rol !== "vendedor") {
            window.location.replace("index.html");
            return;
        }

        const respuesta = await fetch("obtener_solicitudes.php", {
            credentials: "same-origin",
            cache: "no-store"
        });

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.success) {
            throw new Error(
                datos.message || "No se pudieron cargar las solicitudes."
            );
        }

        lista.replaceChildren();

        if (datos.solicitudes.length === 0) {
            estadoCarga.textContent =
                "Todavía no tienes solicitudes de información.";
            return;
        }

        estadoCarga.hidden = true;

        datos.solicitudes.forEach(solicitud => {
            lista.appendChild(crearTarjetaSolicitud(solicitud));
        });

    } catch (error) {
        console.error(error);
        estadoCarga.hidden = false;
        estadoCarga.textContent = error.message;
    }
}

function crearElemento(etiqueta, clase, contenido) {
    const elemento = document.createElement(etiqueta);

    if (clase) {
        elemento.className = clase;
    }

    if (contenido !== undefined && contenido !== null) {
        elemento.textContent = String(contenido);
    }

    return elemento;
}

function crearTarjetaSolicitud(solicitud) {
    const tarjeta = crearElemento("article", "solicitud-card");

    const estado = crearElemento(
        "span",
        "solicitud-estado estado-" + solicitud.estado_solicitud,
        solicitud.estado_solicitud
    );

    const titulo = crearElemento(
        "h2",
        "",
        solicitud.propiedad
    );

    const fecha = crearElemento(
        "p",
        "solicitud-fecha",
        "Recibida: " + solicitud.fecha_solicitud
    );

    const nombre = crearElemento(
        "p",
        "",
        "Interesado: " + solicitud.nombre_contacto
    );

    const correo = crearElemento("p");

    correo.append(
        document.createTextNode("Correo: ")
    );

    const enlaceCorreo = crearElemento(
        "a",
        "",
        solicitud.correo_contacto
    );

    enlaceCorreo.href = "mailto:" + solicitud.correo_contacto;

    correo.appendChild(enlaceCorreo);

    const telefono = crearElemento(
        "p",
        "",
        "Teléfono: " + (solicitud.telefono_contacto || "No proporcionado")
    );

    const subtitulo = crearElemento(
        "strong",
        "",
        "Mensaje del interesado:"
    );

    const mensaje = crearElemento(
        "div",
        "solicitud-mensaje",
        solicitud.mensaje
    );

    tarjeta.append(
        estado,
        titulo,
        fecha,
        nombre,
        correo,
        telefono,
        subtitulo,
        mensaje
    );

    if (solicitud.respuesta) {
        const respuestaAnterior = crearElemento(
            "div",
            "solicitud-respuesta",
            "Última respuesta:\n" + solicitud.respuesta
        );

        tarjeta.appendChild(respuestaAnterior);
    }

    if (solicitud.estado_solicitud !== "cancelada") {
        const formulario = document.createElement("form");

        const etiqueta = crearElemento(
            "label",
            "",
            "Responder al interesado"
        );

        const textarea = document.createElement("textarea");
        textarea.required = true;
        textarea.minLength = 5;
        textarea.maxLength = 3000;
        textarea.placeholder = "Escribe tu respuesta...";

        const boton = crearElemento(
            "button",
            "button",
            "Enviar respuesta"
        );

        boton.type = "submit";

        const resultado = crearElemento(
            "p",
            "solicitud-resultado"
        );

        resultado.setAttribute("role", "status");

        formulario.append(
            etiqueta,
            textarea,
            boton,
            resultado
        );

        formulario.addEventListener("submit", async evento => {
            evento.preventDefault();

            boton.disabled = true;
            boton.textContent = "Guardando...";
            resultado.textContent = "";

            try {
                const respuesta = await fetch("responder_solicitud.php", {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        id_solicitud: solicitud.id_solicitud,
                        respuesta: textarea.value.trim()
                    })
                });

                const datos = await respuesta.json();

                if (!respuesta.ok || !datos.success) {
                    throw new Error(
                        datos.message || "No se pudo guardar."
                    );
                }

                resultado.style.color = "#187443";
                resultado.textContent = datos.message;

                textarea.value = "";

                // Recargar tarjetas con el nuevo estado
                await inicializarSolicitudes();

            } catch (error) {
                resultado.style.color = "#b42318";
                resultado.textContent = error.message;
            } finally {
                boton.disabled = false;
                boton.textContent = "Enviar respuesta";
            }
        });

        tarjeta.appendChild(formulario);
    }

    return tarjeta;
}
