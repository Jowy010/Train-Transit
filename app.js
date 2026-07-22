const mapaEstaciones = {};
let listaEstacionesArray = [];

// 1. Cargar datos de los dos archivos CSV
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
        document.getElementById("lista-estaciones").innerHTML = "<p>Error al cargar las estaciones.</p>";
    }
}

// 2. Procesar las líneas de cada CSV
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

// 3. Pintar estaciones en la pantalla
function renderizarEstaciones(estaciones) {
    const contenedor = document.getElementById("lista-estaciones");
    contenedor.innerHTML = "";

    if (estaciones.length === 0) {
        contenedor.innerHTML = "<p>No se encontraron estaciones.</p>";
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

// 4. Filtrar lista mediante la barra de búsqueda
function filtrarEstaciones() {
    const texto = document.getElementById("buscador").value.toLowerCase();
    const filtradas = listaEstacionesArray.filter(([id, nombre]) => 
        nombre.toLowerCase().includes(texto)
    );
    renderizarEstaciones(filtradas);
}

// 5. Asignar logo de la línea
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

// 6. Abrir modal y consultar horarios en vivo
async function abrirHorarios(idEstacion, nombreEstacion) {
    document.getElementById("modal-titulo").textContent = `Horarios: ${nombreEstacion}`;
    const modalBody = document.getElementById("modal-body");
    modalBody.innerHTML = "<p style='color:#94a3b8;'>Buscando información de trenes...</p>";
    document.getElementById("modal-horarios").style.display = "flex";

    try {
        const respuesta = await fetch('trip_updates.pb');
        const textoDatos = await respuesta.text();

        const registros = textoDatos.split(/\s+/);
        const trenesAsturias = registros.filter(item => item.includes("1001X") && item.includes(idEstacion));

        if (trenesAsturias.length === 0) {
            modalBody.innerHTML = "<p style='color:#94a3b8;'>No hay próximas salidas registradas en este momento.</p>";
            return;
        }

        modalBody.innerHTML = "";
        trenesAsturias.forEach(tren => {
            const logo = obtenerLogoLinea(tren);
            modalBody.innerHTML += `
                <div class="train-row">
                    <div class="train-info">
                        <img src="${logo}" alt="Línea" class="line-logo">
                        <span>Cercanías Asturias</span>
                    </div>
                    <span class="status-badge">En horario</span>
                </div>
            `;
        });

    } catch (error) {
        console.error("Error al leer tiempo real:", error);
        modalBody.innerHTML = "<p style='color:#ef4444;'>No se pudieron cargar los datos en vivo.</p>";
    }
}

function cerrarModal() {
    document.getElementById("modal-horarios").style.display = "none";
}

// Inicializar la app
document.addEventListener("DOMContentLoaded", cargarEstaciones);

// Inicializar la aplicación
document.addEventListener("DOMContentLoaded", () => {
    cargarEstaciones();
});
