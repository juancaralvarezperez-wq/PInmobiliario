async function consultarSesionLuxury360() {
    const respuesta = await fetch("sesion.php", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store"
    });

    if (!respuesta.ok) {
        throw new Error("No se pudo verificar la sesión.");
    }

    return await respuesta.json();
}

async function actualizarAccesoLuxury360() {
    const opcionesInvitado = document.getElementById("opcionesInvitado");
    const opcionesConectado = document.getElementById("opcionesConectado");

    const sidebarInvitado = document.getElementById("sidebarInvitado");
    const sidebarConectado = document.getElementById("sidebarConectado");

    const nombreUsuario = document.getElementById("nombreUsuario");
    const nombreUsuarioMenu = document.getElementById("nombreUsuarioMenu");

    let sesion = {
        autenticado: false
    };

    try {
        sesion = await consultarSesionLuxury360();
    } catch (error) {
        console.error("Error al consultar sesión:", error);
    }

    const autenticado = sesion.autenticado === true;

    const usuario = autenticado
        ? sesion.usuario
        : null;

    const esVendedor =
        autenticado &&
        usuario?.rol === "vendedor";

    // Encabezado
    if (opcionesInvitado) {
        opcionesInvitado.hidden = autenticado;
    }

    if (opcionesConectado) {
        opcionesConectado.hidden = !autenticado;
    }

    // Menú lateral
    if (sidebarInvitado) {
        sidebarInvitado.hidden = autenticado;
    }

    if (sidebarConectado) {
        sidebarConectado.hidden = !autenticado;
    }

    // Nombre del usuario
    if (nombreUsuario) {
        nombreUsuario.textContent = usuario?.nombre || "";
    }

    if (nombreUsuarioMenu) {
        nombreUsuarioMenu.textContent = usuario?.nombre || "";
    }

    // Opciones de publicación
    document.querySelectorAll("[data-solo-vendedor]").forEach(
        elemento => {
            elemento.hidden = !esVendedor;
        }
    );

    // Opciones exclusivas para visitantes
    document.querySelectorAll("[data-solo-invitado]").forEach(
        elemento => {
            elemento.hidden = autenticado;
        }
    );
}

async function cerrarSesionLuxury360() {
    const botones = [
        document.getElementById("btnCerrarSesion"),
        document.getElementById("btnCerrarSesionMenu")
    ].filter(Boolean);

    botones.forEach(boton => {
        boton.disabled = true;
    });

    try {
        const respuesta = await fetch("cerrar_sesion.php", {
            method: "POST",
            credentials: "same-origin"
        });

        const datos = await respuesta.json();

        if (!respuesta.ok || !datos.success) {
            throw new Error("No se pudo cerrar la sesión.");
        }

        sessionStorage.removeItem("luxury360Sesion");

        window.location.href = "index.html";

    } catch (error) {
        console.error(error);

        alert("No se pudo cerrar la sesión.");

        botones.forEach(boton => {
            boton.disabled = false;
        });
    }
}

function inicializarAccesoLuxury360() {
    const botonSuperior = document.getElementById("btnCerrarSesion");
    const botonMenu = document.getElementById("btnCerrarSesionMenu");

    if (botonSuperior) {
        botonSuperior.addEventListener(
            "click",
            cerrarSesionLuxury360
        );
    }

    if (botonMenu) {
        botonMenu.addEventListener(
            "click",
            cerrarSesionLuxury360
        );
    }

    actualizarAccesoLuxury360();
}

document.addEventListener(
    "DOMContentLoaded",
    inicializarAccesoLuxury360
);
