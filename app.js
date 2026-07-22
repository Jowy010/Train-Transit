// Mapa donde guardaremos las estaciones { "18002": "Gijón", ... }
const mapaEstaciones = {};

// 1. Cargar y procesar los CSV de estaciones
async function cargarEstaciones() {
    try {
        const resIberico = await fetch('Estaciones Cercanías Asturias.csv');
        const resFeve = await fetch('listado-de-estaciones-feve-2.csv');
        
        const textoIberico = await resIberico.text();
        const textoFeve = await resFeve.text();

        procesarCSV(textoIberico);
        procesarCSV(textoFeve);

        console.log("Estaciones cargadas:", Object.keys(mapaEstaciones).length);
        
        // Pintar la lista de estaciones en la interfaz
        renderizarListaEstaciones();
    } catch (error) {
        console.error("Error al cargar las estaciones:", error);
    }
}

// Convierte las líneas del CSV en el objeto de estaciones
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

// 2. Renderizar la lista de estaciones en la pantalla principales
function renderizarListaEstaciones() {
    // Buscamos el contenedor de la lista de estaciones
    const listaContenedor = document.getElementById("lista-estaciones") || document.querySelector(".stations-list");
    if (!listaContenedor) return;

    listaContenedor.innerHTML = "";

    // Ordenamos las estaciones alfabéticamente
    const estacionesOrdenadas = Object.entries(mapaEstaciones).sort((a, b) => a[1].localeCompare(b[1]));

    estacionesOrdenadas.forEach(([id, nombre]) => {
        const div = document.createElement("div");
        div.className = "estacion-item";
        div.style.cssText = "padding: 12px; margin: 6px 0; background: #1e293b; border-radius: 8px; color: white; display: flex; justify-content: space-between; align-items: center; cursor: pointer;";
        div.innerHTML = `<span>📍 ${nombre}</span> <span>❯</span>`;
        
        // Al hacer clic, abrimos los trenes en vivo de esa estación
        div.onclick = () => abrirDetalleEstacion(id, nombre);
        
        listaContenedor.appendChild(div);
    });
}

// 3. Identificar la imagen PNG de la línea
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
    return "img/C-1.png"; // Imagen por defecto
}

// 4. Mostrar los trenes al hacer clic en una estación
async function abrirDetalleEstacion(idEstacion, nombreEstacion) {
    // Buscamos el modal o cuadro de diálogo existente en la app
    let modal = document.getElementById("modal-horarios");
    
    // Si el modal no existe en el HTML, lo creamos dinámicamente
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "modal-horarios";
        modal.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 9999;";
        document.body.appendChild(modal);
    }

    modal.style.display = "flex";
    modal.innerHTML = `
        <div style="background: #0f172a; color: white; padding: 20px; border-radius: 12px; width: 85%; max-width: 400px; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0;">Próximos trenes: ${nombreEstacion}</h3>
                <button onclick="document.getElementById('modal-horarios').style.display='none'" style="background: transparent; border: none; color: #94a3b8; font-size: 20px; cursor: pointer;">✕</button>
            </div>
            <div id="contenido-trenes">
                <p style="color: #94a3b8;">Buscando trenes en vivo...</p>
            </div>
        </div>
    `;

    // Consultamos los datos en tiempo real
    obtenerTiempoReal(idEstacion);
}

// 5. Cargar y filtrar los datos de tiempo real (Asturias: 1001X)
async function obtenerTiempoReal(idEstacionSeleccionada) {
    const contenedor = document.getElementById("contenido-trenes");
    
    try {
        // Leemos el archivo local trip_updates.pb que subiste
        const respuesta = await fetch('trip_updates.pb');
        const textoDatos = await respuesta.text();

        const registros = textoDatos.split(/\s+/);

        // Filtrar estrictamente datos de Asturias (1001X)
        const trenesAsturias = registros.filter(item => item.includes("1001X"));

        let coincidencias = [];

        trenesAsturias.forEach(tren => {
            if (tren.includes(idEstacionSeleccionada)) {
                const logo = obtenerLogoLinea(tren);
                coincidencias.push({
                    id: tren,
                    logo: logo
                });
            }
        });

        if (coincidencias.length === 0) {
            contenedor.innerHTML = `<p style="color: #94a3b8;">No hay trenes próximos registrados para esta estación ahora mismo.</p>`;
            return;
        }

        contenedor.innerHTML = "";
        coincidencias.forEach(tren => {
            contenedor.innerHTML += `
                <div style="display: flex; align-items: center; justify-content: space-between; background: #1e293b; padding: 12px; border-radius: 8px; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${tren.logo}" alt="Línea" style="height: 28px; width: auto;">
                        <span style="font-weight: bold;">Cercanías Asturias</span>
                    </div>
                    <span style="color: #22c55e; font-weight: bold;">En horario</span>
                </div>
            `;
        });

    } catch (error) {
        console.error("Error cargando tiempo real:", error);
        if (contenedor) {
            contenedor.innerHTML = `<p style="color: #ef4444;">No se pudieron cargar los horarios en vivo.</p>`;
        }
    }
}

// Inicializar la aplicación
document.addEventListener("DOMContentLoaded", () => {
    cargarEstaciones();
});
