document.addEventListener("DOMContentLoaded", async () => {

    const parametros = new URLSearchParams(window.location.search);
    const idInmueble = Number(parametros.get("id"));

    const nombrePropiedad = document.getElementById("nombrePropiedad");
    const formulario = document.getElementById("formSolicitud");
    const resultado = document.getElementById("mensajeResultado");
    const boton = document.getElementById("btnEnviarSolicitud");

    function mostrarMensaje(texto, esError = false) {
        resultado.textContent = texto;
        resultado.style.color = esError ? "#b42318" : "#18794e";
    }

    if (!Number.isSafeInteger(idInmueble) || idInmueble <= 0) {
        nombrePropiedad.textContent = "Propiedad no válida";
        formulario.hidden = true;
        return;
    }

    // Comprobar que exista una sesión PHP
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
            alert("Para solicitar información necesitas iniciar sesión.");
            window.location.replace("login.html");
            return;
        }

        document.getElementById("nombreContacto").value =
            sesion.usuario?.nombre || "";

    } catch (error) {
        console.error(error);
        formulario.hidden = true;
        nombrePropiedad.textContent =
            "No se pudo verificar tu sesión. Intenta nuevamente.";
        return;
    }

    // Consultar el inmueble publicado
    try {
        const respuesta = await fetch("obtener_propiedades.php", {
            cache: "no-store"
        });

        if (!respuesta.ok) {
            throw new Error("Error al consultar propiedades.");
        }

        const datos = await respuesta.json();

        if (!datos.success || !Array.isArray(datos.propiedades)) {
            throw new Error("Respuesta inválida.");
        }

        const propiedad = datos.propiedades.find(
            item => Number(item.id) === idInmueble
        );

        if (!propiedad) {
            nombrePropiedad.textContent =
                "Esta propiedad no está disponible.";
            formulario.hidden = true;
            return;
        }

        nombrePropiedad.textContent =
            `${propiedad.titulo} — ${propiedad.ciudad}, ${propiedad.estado}`;

    } catch (error) {
        console.error(error);
        nombrePropiedad.textContent =
            "No se pudo cargar la propiedad.";
        formulario.hidden = true;
        return;
    }

    // Enviar solicitud
    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        boton.disabled = true;
        boton.textContent = "Enviando...";
        mostrarMensaje("");

        const datos = {
            id_inmueble: idInmueble,
            nombre_contacto:
                document.getElementById("nombreContacto").value.trim(),
            correo_contacto:
                document.getElementById("correoContacto").value.trim(),
            telefono_contacto:
                document.getElementById("telefonoContacto").value.trim(),
            mensaje:
                document.getElementById("mensajeContacto").value.trim()
        };

        try {
            const respuesta = await fetch("solicitar_informacion.php", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(datos)
            });

            const resultadoServidor = await respuesta.json();

            if (!respuesta.ok || !resultadoServidor.success) {
                if (respuesta.status === 401) {
                    window.location.href = "login.html";
                    return;
                }

                throw new Error(
                    resultadoServidor.message || "No se pudo enviar."
                );
            }

            mostrarMensaje(resultadoServidor.message);

            document.getElementById("mensajeContacto").value = "";
            document.getElementById("telefonoContacto").value = "";

        } catch (error) {
            mostrarMensaje(error.message, true);
        } finally {
            boton.disabled = false;
            boton.textContent = "Enviar solicitud";
        }
    });

});
