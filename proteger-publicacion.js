async function protegerPublicacion() {
    try {
        const respuesta = await fetch("sesion.php", {
            credentials: "same-origin",
            cache: "no-store"
        });

        if (!respuesta.ok) {
            throw new Error("No se pudo verificar la sesión.");
        }

        const datos = await respuesta.json();

        if (!datos.autenticado) {
            window.location.replace("login.html");
            return;
        }

        if (datos.usuario?.rol !== "vendedor") {
            alert("Solo los vendedores pueden publicar propiedades.");
            window.location.replace("index.html");
            return;
        }

    } catch (error) {
        console.error(error);
        window.location.replace("login.html");
    }
}

document.addEventListener(
    "DOMContentLoaded",
    protegerPublicacion
);
