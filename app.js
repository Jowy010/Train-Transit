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

// 2. Procesar absolutamente TODAS las filas del CSV (CODIGO;DESCRIPCION;...;PROVINCIA)
function procesarCSV(texto) {
    const lineas = texto.split('\n');
    estacionesEspana = [];

    for (let i = 1; i < lineas.length; i++) {
        const linea = lineas[i].trim();
        if (!linea) continue;

        // Separar por punto y coma (;) eliminando comillas extra
        const columnas = linea.split(';').map(c => c.replace(/"/g, '').trim());

        if (columnas.length >= 2) {
            const codigo = columnas[0];
            const nombre = columnas[1];
            const provincia = columnas[7] || "España";

            if (codigo && nombre && nombre !== "DESCRIPCION") {
                estacionesEspana.push({
                    codigo: codigo,
                    nombre: nombre,
                    provincia: provincia
                });
            }
        }
    }

    // Ordenar alfabéticamente por nombre de estación
    estacionesEspana.sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    // Renderizar todas las estaciones
    renderizarEstaciones(estacionesEspana);
}

// 3. Renderizar en pantalla (todas las estaciones disponibles)
function renderizarEstaciones(estaciones) {
    const contenedor = document.getElementById("stations-list");
    if (!contenedor) return;

    if (estaciones.length === 0) {
        contenedor.innerHTML = "<p style='color: #94a3b8; text-align: center; padding: 20px;'>No se encontraron estaciones.</p>";
        return;
    }

    contenedor.innerHTML = "";

    // Si el usuario no ha buscado nada, mostramos un bloque inicial amplio (300).
    // Si el usuario ha usado el buscador, mostramos TODAS las coincidencia encontradas sin límite.
    const inputBuscador = document.getElementById("station-search");
    const estaBuscando = inputBuscador && inputBuscador.value.trim().length > 0;
    const listaAMostrar = estaBuscando ? estaciones : estaciones.slice(0, 300);

    listaAMostrar.forEach(est => {
        const tarjeta = document.createElement("div");
        tarjeta.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 14px; background: #1e293b; color: white; margin-bottom: 8px; border-radius: 10px; cursor: pointer; border: 1px solid #334155;";
        tarjeta.onclick = () => verDetalleEstacion(est);
        tarjeta.innerHTML = `
            <div>
                <span style="font-weight: 500; display: block;">📍 ${est.nombre}</span>
                <span style="font-size: 0.75rem; color: #94a3b8;">${est.provincia} (${est.codigo})</span>
            </div>
            <span style="color: #38bdf8; font-size: 1.2rem; font-weight: bold;">›</span>
        `;
        contenedor.appendChild(tarjeta);
    });

    // Indicador visual de total cargado
    if (!estaBuscando && estaciones.length > 300) {
        const aviso = document.createElement("p");
        aviso.style.cssText = "color: #94a3b8; text-align: center; padding: 15px; font-size: 0.85rem;";
        aviso.innerText = `Mostrando 300 de ${estaciones.length} estaciones totales. Usa el buscador para encontrar cualquier estación específica.`;
        contenedor.appendChild(aviso);
    }
}

// 4. Buscador en tiempo real sobre el 100% de la base de datos
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
        est.provincia.toLowerCase().includes(texto) ||
        est.codigo.includes(texto)
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

// 6. Generar enlace exacto de Adif con Código + Slug
function verDetalleEstacion(estacion) {
    const titulo = document.getElementById("estacion-titulo");
    if (titulo) titulo.innerText = estacion.nombre;

    const panelSalidas = document.getElementById("panel-salidas");
    if (!panelSalidas) return;

    // Formatear el nombre para el slug de Adif (ej: "MADRID - ATOCHA" -> "madrid-atocha")
    const slug = estacion.nombre
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar tildes
        .replace(/[^a-z0-9\s-]/g, '') // Quitar caracteres especiales
        .trim()
        .replace(/\s+/g, '-'); // Cambiar espacios por guiones

    const urlAdif = `https://www.adif.es/w/${estacion.codigo}-${slug}?tipoBusqueda=proximasSalidas&trafficType=cercanias&pageFromPlid=335`;

    panelSalidas.innerHTML = `
        <div style="background: #1e293b; padding: 20px; border-radius: 12px; border: 1px solid #334155; text-align: center;">
            <p style="color: #94a3b8; margin-bottom: 15px; font-size: 0.95rem;">
                Consulta las salidas y tiempos en directo en Adif para <strong>${estacion.nombre}</strong> (${estacion.provincia}):
            </p>
            
            <a href="${urlAdif}" target="_blank" style="display: flex; align-items: center; justify-content: center; gap: 10px; background: #0284c7; color: white; text-decoration: none; font-weight: bold; padding: 14px; border-radius: 8px; margin-bottom: 12px; font-size: 1rem;">
                📱 Abrir Próximas Salidas (Adif)
            </a>

            <a href="https://www.renfe.com/es/es/cercanias" target="_blank" style="display: block; background: #334155; color: white; text-decoration: none; font-weight: bold; padding: 12px; border-radius: 8px; font-size: 0.9rem;">
                🚆 Consultar en Renfe Cercanías
            </a>
        </div>
    `;

    showView('detalle');
}

// Iniciar al cargar el DOM
document.addEventListener("DOMContentLoaded", cargarEstaciones);
