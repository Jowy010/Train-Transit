const mapaEstaciones = {};
let listaEstacionesArray = [];

// 1. Cargar datos de los dos archivos CSV de Asturias
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

        // Convertir el objeto a Array y ordenar alfabéticamente
        listaEstacionesArray = Object.entries(mapaEstaciones).sort((a, b) => a[1].localeCompare(b[1]));

        renderizarEstaciones(listaEstacionesArray);
    } catch (error) {
        console.error("Error cargando estaciones:", error);
        document.getElementById("lista-estaciones").innerHTML = "<p style='color: #94a3b8; padding: 10px;'>Error al cargar las estaciones.</p>";
    }
}

// 2. Procesar CSV filtrando solo el núcleo de Asturias
function procesarCSV(contenidoCSV) {
    const lineas = contenidoCSV.split('\n');
    lineas.forEach(linea => {
        const columnas = linea.split(/,|;/);
        if (columnas.length >= 2) {
            const id = columnas[0].trim().replace(/"/g, '');
            const nombre = columnas[1].trim().replace(/"/g, '');

            if (id && nombre) {
                // Filtro para mantener solo paradas de Asturias
                const esAsturias = id.startsWith("10") || 
                                   id.startsWith("15") || 
                                   id.startsWith("16") || 
                                   id.startsWith("17") || 
                                   id.startsWith("18") || 
                                   id.startsWith("7");

                if (esAsturias) {
                    mapaEstaciones[id] = nombre;
                }
            }
        }
    });
}

// 3. Pintar estaciones en la lista
function renderizarEstaciones(estaciones) {
    const contenedor = document.getElementById("lista-estaciones");
    if (!contenedor) return;
    
    contenedor.innerHTML = "";

    if (estaciones.length === 0) {
        contenedor.innerHTML = "<p style='color: #94a3b8; padding: 10px;'>No se encontraron estaciones.</p>";
        return;
    }

    estaciones.forEach(([id, nombre]) => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "station-card";
        tarjeta.onclick = () => abrirHorarios(id, nombre);
        tarjeta.innerHTML = `
            <span>📍 ${nombre}</span>
            <span class="flecha">❯</span>
        `;
        contenedor.appendChild(tarjeta);
    });
}

// 4. Filtrado por el buscador
function filtrarEstaciones() {
    const texto = document.getElementById("buscador").value.toLowerCase();
    const filtradas = listaEstacionesArray.filter(([id, nombre]) => 
        nombre.toLowerCase().includes(texto)
    );
    renderizarEstaciones(filtradas);
}

// 5. Asignar imagen del logo según línea
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

// 6. Consultar y mostrar horarios en vivo
async function abrirHorarios(idEstacion, nombreEstacion) {
    const modal = document.getElementById("modal-horarios");
    const modalBody = document.getElementById("modal-body");
    
    if (modalBody) {
        modalBody.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3 style="margin:0; font-size: 1.1rem; color: white;">Horarios: ${nombreEstacion}</h3>
                <button onclick="cerrarModal()" style="background:none; border:none; color:#94a3b8; font-size:1.2rem; cursor:pointer;">✕</button>
            </div>
            <p style='color:#94a3b8;'>Consultando trenes en vivo...</p>
        `;
    }
    
    if (modal) modal.style.display = "flex";

    try {
        const respuesta = await fetch('trip_updates.pb');
        const textoDatos = await respuesta.text();

        const registros = textoDatos.split(/\s+/);
        const trenesAsturias = registros.filter(item => item.includes("1001X") && item.includes(idEstacion));

        if (trenesAsturias.length === 0) {
            modalBody.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h3 style="margin:0; font-size: 1.1rem; color: white;">Horarios: ${nombreEstacion}</h3>
                    <button onclick="cerrarModal()" style="background:none; border:none; color:#94a3b8; font-size:1.2rem; cursor:pointer;">✕</button>
                </div>
                <p style='color:#94a3b8;'>No hay próximas salidas registradas en este momento.</p>
            `;
            return;
        }

        let htmlTrenes = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3 style="margin:0; font-size: 1.1rem; color: white;">Horarios: ${nombreEstacion}</h3>
                <button onclick="cerrarModal()" style="background:none; border:none; color:#94a3b8; font-size:1.2rem; cursor:pointer;">✕</button>
            </div>
        `;

        trenesAsturias.forEach(tren => {
            const logo = obtenerLogoLinea(tren);
            htmlTrenes += `
                <div style="display:flex; align-items:center; justify-content:space-between; background:#0f172a; padding:10px; border-radius:8px; margin-bottom:8px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${logo}" alt="Línea" style="height:24px;">
                        <span style="color:white; font-weight:bold;">Cercanías Asturias</span>
                    </div>
                    <span style="color:#22c55e; font-weight:bold;">En horario</span>
                </div>
            `;
        });

        modalBody.innerHTML = htmlTrenes;

    } catch (error) {
        console.error("Error al consultar datos:", error);
        if (modalBody) {
            modalBody.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <h3 style="margin:0; font-size: 1.1rem; color: white;">Horarios: ${nombreEstacion}</h3>
                    <button onclick="cerrarModal()" style="background:none; border:none; color:#94a3b8; font-size:1.2rem; cursor:pointer;">✕</button>
                </div>
                <p style='color:#ef4444;'>No se pudieron cargar los datos en vivo.</p>
            `;
        }
    }
}

function cerrarModal() {
    const modal = document.getElementById("modal-horarios");
    if (modal) modal.style.display = "none";
}

// Inicialización
document.addEventListener("DOMContentLoaded", cargarEstaciones);
