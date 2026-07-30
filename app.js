let estacionesEspana = [];

// 1. Cargar el CSV de estaciones de toda España
async function cargarEstaciones() {
    try {
        const respuesta = await fetch('estaciones (1).csv');
        if (!respuesta.ok) {
            throw new Error("No se pudo encontrar el archivo CSV");
        }
        
        // Usar ISO-8859-1 (Latin1) para procesar tildes y la Ñ correctamente
        const buffer = await respuesta.arrayBuffer();
        const decoder = new TextDecoder('iso-8859-1');
        const textoCSV = decoder.decode(buffer);

        procesarCSV(textoCSV);
    } catch (error) {
        console.error("Error cargando estaciones:", error);
        const contenedor = document.getElementById("stations-list");
        if (contenedor) {
            contenedor.innerHTML = "<p style='color: #ef4444; text-align: center; padding: 20px;'>Error al cargar el archivo de estaciones.</p>";
        }
    }
}

// 2. Procesar TODAS las filas respetando tildes y Ñs
function procesarCSV(texto) {
    const lineas = texto.split('\n');
    estacionesEspana = [];

    for (let i = 1; i < lineas.length; i++) {
        const linea = lineas[i].trim();
        if (!linea) continue;

        const columnas = linea.split(';').map(c => c.replace(/"/g, '').trim());

        if (columnas.length >= 2) {
            let codigo = columnas[0];
            const nombre = columnas[1];
            const provincia = columnas[7] || "España";

            if (codigo && codigo.length < 5) {
                codigo = codigo.padStart(5, '0');
            }

            if (codigo && nombre && nombre !== "DESCRIPCION") {
                estacionesEspana.push({
                    codigo: codigo,
                    nombre: nombre,
                    provincia: provincia
                });
            }
        }
    }

    // Ordenar de la A a la Z
    estacionesEspana.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
    
    renderizarEstaciones(estacionesEspana);
}

// 3. Renderizar estaciones en la lista
function renderizarEstaciones(estaciones) {
    const contenedor = document.getElementById("stations-list");
    if (!contenedor) return;

    if (estaciones.length === 0) {
        contenedor.innerHTML = "<p style='color: #94a3b8; text-align: center; padding: 20px;'>No se encontraron estaciones.</p>";
        return;
    }

    contenedor.innerHTML = "";

    estaciones.forEach(est => {
        const tarjeta = document.createElement("div");
        tarjeta.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 14px; background: #1e293b; color: white; margin-bottom: 8px; border-radius: 10px; cursor: pointer; border: 1px solid #334155;";
        tarjeta.onclick = () => verDetalleEstacion(est);
        tarjeta.innerHTML = `
            <div>
                <span style="font-weight: 500; display: block;">📍 ${est.nombre}</span>
                <span style="font-size: 0.75rem; color: #94a3b8;">${est.provincia}</span>
            </div>
            <span style="color: #38bdf8; font-size: 1.2rem; font-weight: bold;">›</span>
        `;
        contenedor.appendChild(tarjeta);
    });
}

// 4. Buscador en tiempo real
function filterStations() {
    const input = document.getElementById("station-search");
    if (!input) return;
    const texto = input.value.toLowerCase().trim();

    if (!texto) {
        renderizarEstaciones(estacionesEspana);
        return;
    }

    const filtradas = estacionesEspana.filter(est => 
        est.nombre.toLowerCase().includes(texto) || 
        est.provincia.toLowerCase().includes(texto)
    );
    renderizarEstaciones(filtradas);
}

// 5. Control de pantallas
function showView(viewName) {
    const homeView = document.getElementById("home-view");
    const estacionesView = document.getElementById("estaciones-view");
    const detalleView = document.getElementById("detalle-estacion-view");

    if (homeView) homeView.style.display = (viewName === 'home') ? "block" : "none";
    if (estacionesView) estacionesView.style.display = (viewName === 'estaciones') ? "block" : "none";
    if (detalleView) detalleView.style.display = (viewName === 'detalle') ? "block" : "none";

    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
    if (viewName === 'home') document.getElementById("nav-home")?.classList.add("active");
    if (viewName === 'estaciones') {
        document.getElementById("nav-estaciones")?.classList.add("active");
        renderizarEstaciones(estacionesEspana);
    }
}

// 6. Vista con PANEL EN DIRECTO INCRUSTADO (Sin salir de tu web)
function verDetalleEstacion(estacion) {
    const titulo = document.getElementById("estacion-titulo");
    if (titulo) titulo.innerText = estacion.nombre;

    const panelSalidas = document.getElementById("panel-salidas");
    if (!panelSalidas) return;

    // Generar el slug respetando tildes y Ñs exactas de Adif
    const slug = estacion.nombre
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-');

    const urlAdif = `https://www.adif.es/w/${estacion.codigo}-${encodeURIComponent(slug)}?tipoBusqueda=proximasSalidas&trafficType=cercanias&pageFromPlid=335`;

    panelSalidas.innerHTML = `
        <div style="background: #0f172a; border-radius: 12px; border: 1px solid #334155; overflow: hidden; font-family: system-ui, sans-serif;">
            
            <!-- Barra superior del visor integrado -->
            <div style="background: #1e293b; padding: 12px 16px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="height: 10px; width: 10px; background-color: #22c55e; border-radius: 50%; display: inline-block;"></span>
                    <span style="font-size: 0.85rem; font-weight: bold; color: #e2e8f0;">TIEMPOS EN DIRECTO</span>
                </div>
                <span style="font-size: 0.75rem; background: #334155; color: #94a3b8; padding: 2px 8px; border-radius: 4px;">${estacion.provincia}</span>
            </div>

            <!-- Pantalla Frame Incrustada Directamente -->
            <div style="position: relative; width: 100%; height: 600px; background: #ffffff;">
                <iframe 
                    src="${urlAdif}" 
                    style="width: 100%; height: 100%; border: none;"
                    title="Panel Adif ${estacion.nombre}">
                </iframe>
            </div>

            <!-- Opción alternativa por si la conexión de Adif va lenta -->
            <div style="padding: 10px; background: #1e293b; text-align: center; border-top: 1px solid #334155;">
                <a href="${urlAdif}" target="_blank" style="color: #38bdf8; text-decoration: none; font-size: 0.8rem;">
                    ¿No se visualiza el panel? Abrir en ventana completa ↗
                </a>
            </div>
        </div>
    `;

    showView('detalle');
}

// Iniciar al cargar el DOM
document.addEventListener("DOMContentLoaded", cargarEstaciones);
