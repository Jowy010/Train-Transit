let estacionesEspana = [];

// 1. Cargar el CSV de estaciones de toda España
async function cargarEstaciones() {
    try {
        const respuesta = await fetch('estaciones (1).csv');
        if (!respuesta.ok) {
            throw new Error("No se pudo encontrar el archivo CSV");
        }
        
        // Usar ISO-8859-1 (Latin1) para procesar tildes y caracteres españoles adecuadamente
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

// 2. Procesar TODAS las filas del CSV de la A a la Z
function procesarCSV(texto) {
    const lineas = texto.split('\n');
    estacionesEspana = [];

    for (let i = 1; i < lineas.length; i++) {
        const linea = lineas[i].trim();
        if (!linea) continue;

        // Separar por punto y coma (;) quitando comillas
        const columnas = linea.split(';').map(c => c.replace(/"/g, '').trim());

        if (columnas.length >= 2) {
            let codigo = columnas[0];
            const nombre = columnas[1];
            const provincia = columnas[7] || "España";

            // Asegurar que el código tenga 5 dígitos (ej: "1003" -> "01003")
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

    // Ordenar de la A a la Z por el nombre de la estación
    estacionesEspana.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
    
    // Renderizar la lista completa
    renderizarEstaciones(estacionesEspana);
}

// 3. Renderizar en pantalla todas las estaciones
function renderizarEstaciones(estaciones) {
    const contenedor = document.getElementById("stations-list");
    if (!contenedor) return;

    if (estaciones.length === 0) {
        contenedor.innerHTML = "<p style='color: #94a3b8; text-align: center; padding: 20px;'>No se encontraron estaciones.</p>";
        return;
    }

    contenedor.innerHTML = "";

    // Muestra todas las estaciones sin ningún corte ni límite
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

// 5. Control de pantallas (Navegación)
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

// 6. Vista de detalle con el panel navegador integrado
function verDetalleEstacion(estacion) {
    const titulo = document.getElementById("estacion-titulo");
    if (titulo) titulo.innerText = estacion.nombre;

    const panelSalidas = document.getElementById("panel-salidas");
    if (!panelSalidas) return;

    // Formatear el slug para el enlace oficial de Adif
    const slug = estacion.nombre
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar tildes
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');

    const urlAdif = `https://www.adif.es/w/${estacion.codigo}-${slug}?tipoBusqueda=proximasSalidas&trafficType=cercanias&pageFromPlid=335`;

    panelSalidas.innerHTML = `
        <div style="background: #0f172a; border-radius: 12px; border: 1px solid #334155; overflow: hidden; font-family: system-ui, sans-serif;">
            
            <!-- Encabezado de la Pantalla Interna -->
            <div style="background: #1e293b; padding: 12px 16px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="height: 10px; width: 10px; background-color: #22c55e; border-radius: 50%; display: inline-block;"></span>
                    <span style="font-size: 0.85rem; font-weight: bold; color: #e2e8f0; letter-spacing: 0.5px;">PANEL EN DIRECTO</span>
                </div>
                <span style="font-size: 0.75rem; background: #334155; color: #94a3b8; padding: 2px 8px; border-radius: 4px;">CÓDIGO: ${estacion.codigo}</span>
            </div>

            <!-- Contenido del Panel -->
            <div style="padding: 20px; text-align: center;">
                <h3 style="color: #f8fafc; margin-top: 0; margin-bottom: 5px; font-size: 1.2rem;">${estacion.nombre}</h3>
                <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 20px;">Provincia de ${estacion.provincia}</p>
                
                <div style="background: #1e293b; border: 1px dashed #475569; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <p style="color: #94a3b8; font-size: 0.9rem; margin: 0 0 15px 0; line-height: 1.4;">
                        Consulta los horarios en vivo, vía de salida y tiempo real de Adif para esta estación:
                    </p>
                    
                    <a href="${urlAdif}" target="_blank" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: #0284c7; color: white; text-decoration: none; font-weight: 600; padding: 14px 20px; border-radius: 8px; font-size: 0.95rem; width: 100%; box-sizing: border-box; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);">
                        <span>🚆 Cargar salidas de ${estacion.nombre}</span>
                    </a>
                </div>

                <a href="https://www.renfe.com/es/es/cercanias" target="_blank" style="display: block; color: #38bdf8; text-decoration: none; font-size: 0.85rem; font-weight: 500;">
                    Ver plano de líneas y horarios en Renfe →
                </a>
            </div>
        </div>
    `;

    showView('detalle');
}

// Iniciar al cargar el DOM
document.addEventListener("DOMContentLoaded", cargarEstaciones);
