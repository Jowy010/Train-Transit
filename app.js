// Mapa donde se guardan las estaciones de los CSV
const mapaEstaciones = {};

// 1. Cargar las estaciones de los CSV al iniciar
async function cargarEstaciones() {
    try {
        const [resIberico, resFeve] = await Promise.all([
            fetch('Estaciones Cercanías Asturias.csv'),
            fetch('listado-de-estaciones-feve-2.csv')
        ]);
        
        const textoIberico = await resIberico.text();
        const textoFeve = await resFeve.text();

        procesarCSV(textoIberico);
        procesarCSV(textoFeve);

        console.log("Estaciones cargadas con éxito.");
    } catch (error) {
        console.error("Error al cargar estaciones:", error);
    }
}

function procesarCSV(contenidoCSV) {
    const lineas = contenidoCSV.split('\n');
    lineas.forEach(linea => {
        const columnas = linea.split(/,|;/);
        if (columnas.length >= 2) {
            const id = columnas[0].trim().replace(/"/g, '');
            const nombre = columnas[1].trim().replace(/"/g, '');
            if (id && nombre) {
                mapaEstaciones[id] = nombre;
            }
        }
    });
}

// 2. Obtener la imagen PNG según la línea
function obtenerLogoLinea(idTren) {
    if (idTren.includes("C10")) return "img/C-10.png";
    if (idTren.includes("C1")) return "img/C-1.png";
    if (idTren.includes("C2")) return "img/C-2.png";
    if (idTren.includes("C3")) return "img/C-3.png";
    if (idTren.includes("C4")) return "img/C-4.png";
    if (idTren.includes("C5")) return "img/C-5.png";
    if (idTren.includes("C6")) return "img/C-6.png";
    if (idTren.includes("C7")) return "img/C-7.png";
    if (idTren.includes("C8")) return "img/C-8.png";
    return "img/C-1.png";
}

// 3. Capturar el clic en CUALQUIER estación de tu lista
document.addEventListener("click", async (e) => {
    // Detectamos si el usuario pulsa en un elemento de la lista de estaciones
    const elementoEstacion = e.target.closest(".station-item, li, [onclick*='Horarios'], div");
    
    if (elementoEstacion && elementoEstacion.innerText) {
        const nombreEstacion = elementoEstacion.innerText.split('\n')[0].replace('📍', '').trim();
        
        // Buscamos si existe un modal en tu web para rellenarlo
        const modal = document.querySelector(".modal, .popup, #modal, div[role='dialog']");
        
        if (modal) {
            // Buscamos el ID de la estación en nuestro mapa por su nombre
            const idEstacion = Object.keys(mapaEstaciones).find(key => mapaEstaciones[key].toLowerCase() === nombreEstacion.toLowerCase()) || "";

            // Cargamos los trenes en vivo
            mostrarTrenesEnModal(modal, nombreEstacion, idEstacion);
        }
    }
});

// 4. Inyectar las tarjetas de los trenes dentro del cartel/modal
async function mostrarTrenesEnModal(modal, nombreEstacion, idEstacion) {
    try {
        const respuesta = await fetch('trip_updates.pb');
        const textoDatos = await respuesta.text();

        const registros = textoDatos.split(/\s+/);
        // Filtrar datos de Asturias (1001X) y que pertenezcan a la estación
        const trenes = registros.filter(item => item.includes("1001X") && (idEstacion ? item.includes(idEstacion) : true));

        let htmlHeader = `<h3 style="margin-top:0;">Próximos trenes: ${nombreEstacion}</h3>`;
        let htmlContenido = "";

        if (trenes.length === 0) {
            htmlContenido = `<p style="color: #94a3b8; font-size: 14px;">No hay trenes próximos en esta estación.</p>`;
        } else {
            trenes.forEach(tren => {
                const logo = obtenerLogoLinea(tren);
                htmlContenido += `
                    <div style="display: flex; align-items: center; justify-content: space-between; background: #1e293b; padding: 10px; border-radius: 8px; margin-bottom: 8px; color: white;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <img src="${logo}" style="height: 22px;">
                            <span style="font-size: 14px; font-weight: bold;">Cercanías</span>
                        </div>
                        <span style="color: #22c55e; font-size: 13px; font-weight: bold;">En horario</span>
                    </div>
                `;
            });
        }

        // Buscamos el contenedor interno del modal para reemplazar el mensaje viejo
        const cuerpoModal = modal.querySelector(".modal-body, .popup-content, div") || modal;
        cuerpoModal.innerHTML = htmlHeader + htmlContenido + `<button onclick="this.closest('.modal, .popup, #modal').style.display='none'" style="margin-top:10px; padding:6px 12px; background:#334155; color:white; border:none; border-radius:6px; cursor:pointer;">Cerrar</button>`;

    } catch (err) {
        console.error("Error al cargar datos en vivo:", err);
    }
}

// Inicializar al cargar
document.addEventListener("DOMContentLoaded", cargarEstaciones);
