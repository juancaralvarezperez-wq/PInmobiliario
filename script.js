// Muestra avisos accesibles sin depender de elementos adicionales en el HTML.
function mostrarAviso(mensaje, tipo = "success") {
    const avisoAnterior = document.getElementById("aviso-flotante");
    if (avisoAnterior) {
        avisoAnterior.remove();
    }

    const aviso = document.createElement("div");
    aviso.id = "aviso-flotante";
    aviso.textContent = mensaje;
    aviso.setAttribute("role", tipo === "error" ? "alert" : "status");
    Object.assign(aviso.style, {
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: "1000",
        maxWidth: "min(420px, calc(100vw - 40px))",
        padding: "14px 20px",
        borderRadius: "8px",
        color: "#fff",
        backgroundColor: tipo === "error" ? "#b42318" : "#247a45",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
        fontFamily: "Arial, sans-serif"
    });
    document.body.appendChild(aviso);

    window.setTimeout(() => aviso.remove(), 4000);
}

function inicializarFormularios() {
    // Valida el formulario de acceso y guarda solo el estado de la sesión.
    const formLogin = document.getElementById("formLogin");
    if (formLogin) {
        formLogin.addEventListener("submit", (evento) => {
            evento.preventDefault();

            const correo = document.getElementById("loginEmail").value.trim();
            const contrasena = document.getElementById("loginPassword").value.trim();

            if (!correo || !contrasena) {
                mostrarAviso("Completa el correo y la contraseña.", "error");
                return;
            }

            try {
                localStorage.setItem("sesionIniciada", "true");
                mostrarAviso("Inicio de sesión simulado correctamente.");
            } catch (error) {
                console.error("No se pudo guardar el estado de la sesión.", error);
                mostrarAviso("No se pudo guardar el estado de la sesión.", "error");
            }
        });
    }

    // Guarda cada propiedad junto con las que ya estaban almacenadas.
    const formPropiedad = document.getElementById("formPropiedad");
    if (formPropiedad) {
        formPropiedad.addEventListener("submit", (evento) => {
            evento.preventDefault();

            const titulo = document.getElementById("propTitulo").value.trim();
            const ubicacion = document.getElementById("propUbicacion").value.trim();
            const precio = document.getElementById("propPrecio").value.trim();

            if (!titulo || !ubicacion || !precio) {
                mostrarAviso("Completa el título, la ubicación y el precio.", "error");
                return;
            }

            let propiedades;
            try {
                const propiedadesGuardadas = localStorage.getItem("propiedades");
                propiedades = propiedadesGuardadas
                    ? JSON.parse(propiedadesGuardadas)
                    : [];

                if (!Array.isArray(propiedades)) {
                    mostrarAviso("Los datos guardados de propiedades no tienen un formato válido.", "error");
                    return;
                }
            } catch (error) {
                console.error("No se pudieron leer las propiedades guardadas.", error);
                mostrarAviso("No se pudieron leer las propiedades guardadas.", "error");
                return;
            }

            propiedades.push({ titulo, ubicacion, precio });

            try {
                localStorage.setItem("propiedades", JSON.stringify(propiedades));
                formPropiedad.reset();
                mostrarAviso("Propiedad registrada correctamente.");
            } catch (error) {
                console.error("No se pudo guardar la propiedad.", error);
                mostrarAviso("No se pudo guardar la propiedad.", "error");
            }
        });
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializarFormularios);
} else {
    inicializarFormularios();
}