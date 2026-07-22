// Mapa donde guardaremos las estaciones: { "18002": "Gijón", ... }
const mapaEstaciones = {};

// 1. Función para cargar y procesar los dos CSV de estaciones
async function cargarEstaciones() {
    try {
        const resIberico = await fetch('Estaciones Cercanías Asturias.csv');
        const resFeve = await fetch('listado-de-estaciones-feve-2.csv');
        
        const textoIberico = await resIberico.text();
        const textoFeve = await resFeve.text();

        procesarCSV(textoIberico);
        procesarCSV(textoFeve);

        console.log("Estaciones cargadas correctamente:", Object.keys(mapaEstaciones).length);
    } catch (error) {
        console.error("Error al cargar las estaciones:", error);
    }
}

// Convierte las líneas del CSV en el mapa de estaciones
function procesarCSV(contenidoCSV) {
    const lineas = contenidoCSV.split('\n');
    lineas.forEach(linea => {
        const columnas = linea.split(/,|;/); // Acepta coma o punto y coma
        if (columnas.length >= 2) {
            const id = columnas[0].trim().replace(/"/g, '');
            const nombre = columnas[1].trim().replace(/"/g, '');
            if (id && nombre) {
                mapaEstaciones[id] = nombre;
            }
        }
    });
}

// 2. Asigna la imagen PNG correcta según la línea
function obtenerLogoLinea(idTren) {
    if (idTren.includes("C10")) return "img/C-10.png"; // Si existiera C10
    if (idTren.includes("C1")) return "img/C-1.png";
    if (idTren.includes("C2")) return "img/C-2.png";
    if (idTren.includes("C3")) return "img/C-3.png";
    if (idTren.includes("C4")) return "img/C-4.png";
    if (idTren.includes("C5")) return "img/C-5.png";
    if (idTren.includes("C6")) return "img/C-6.png";
    if (idTren.includes("C7")) return "img/C-7.png";
    if (idTren.includes("C8")) return "img/C-8.png";
    return "img/C-1.png"; // Imagen por defecto
}

// 3. Función para obtener los datos en tiempo real y mostrarlos
async function obtenerTiempoReal(idEstacionSeleccionada) {
    try {
        // AQUÍ pones la URL directa donde Renfe actualiza el feed en vivo
        const respuesta = await fetch('URL_DEL_FEED_EN_TIEMPO_REAL');
        const textoDatos = await respuesta.text();

        // Separar el feed por bloques
        const registros = textoDatos.split(/\s+/);

        // Filtrar SOLO los trenes del núcleo de Asturias (1001X)
        const trenesAsturias = registros.filter(item => item.includes("1001X"));

        const contenedor = document.getElementById("lista-trenes");
        contenedor.innerHTML = ""; // Limpiar lista anterior

        trenesAsturias.forEach(tren => {
            // Si el tren pasa por la estación seleccionada
            if (tren.includes(idEstacionSeleccionada)) {
                const logo = obtenerLogoLinea(tren);
                const nombreEstacion = mapaEstaciones[idEstacionSeleccionada] || "Estación";

                // Insertar tarjeta HTML
                contenedor.innerHTML += `
                    <div class="train-card">
                        <div class="train-header">
                            <img src="${logo}" alt="Línea" class="line-icon">
                            <span class="destination">${nombreEstacion}</span>
                        </div>
                        <div class="train-time">
                            <span class="minutes">En aprox. min</span>
                        </div>
                    </div>
                `;
            }
        });

    } catch (error) {
        console.error("Error cargando tiempo real:", error);
    }
}

// Inicializar al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    cargarEstaciones();
});
