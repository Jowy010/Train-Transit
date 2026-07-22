let allStations = [];

// Cambiar entre pantallas/vistas
function showView(viewName) {
    const homeView = document.getElementById("home-view");
    const estacionesView = document.getElementById("estaciones-view");

    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));

    if (viewName === "estaciones") {
        if (homeView) homeView.classList.add("view-hidden");
        if (estacionesView) estacionesView.classList.remove("view-hidden");
        
        const navEstaciones = document.getElementById("nav-estaciones");
        if (navEstaciones) navEstaciones.classList.add("active");

        // Cargar estaciones si aún no se han cargado
        if (allStations.length === 0) {
            loadAllAsturiasStations();
        }
    } else {
        if (estacionesView) estacionesView.classList.add("view-hidden");
        if (homeView) homeView.classList.remove("view-hidden");
        
        const navHome = document.getElementById("nav-home");
        if (navHome) navHome.classList.add("active");
    }
}

// Cargar tanto el archivo de Cercanías como el de FEVE
async function loadAllAsturiasStations() {
    const container = document.getElementById("stations-list");
    if (container) {
        container.innerHTML = "<p class='loading-text'>Cargando estaciones de Asturias (Renfe y FEVE)...</p>";
    }

    let stationsSet = new Set();

    // 1. Cargar archivo Renfe Cercanías Asturias
    try {
        const res1 = await fetch("Estaciones Cercanías Asturias.csv");
        if (res1.ok) {
            const text1 = await res1.text();
            parseCSV(text1, stationsSet, true); // true = asumir que todas son de Asturias
        }
    } catch (e) {
        console.warn("No se pudo cargar el archivo de Cercanías:", e);
    }

    // 2. Cargar archivo FEVE (listado-de-estaciones-feve-2.csv)
    try {
        const res2 = await fetch("listado-de-estaciones-feve-2.csv");
        if (res2.ok) {
            const text2 = await res2.text();
            parseCSV(text2, stationsSet, false); // false = filtrar estrictamente por PROVINCIA = Asturias
        }
    } catch (e) {
        console.warn("No se pudo cargar el archivo de FEVE:", e);
    }

    // Convertir a Array y ordenar de la A a la Z
    allStations = Array.from(stationsSet).sort((a, b) => 
        a.localeCompare(b, 'es', { sensitivity: 'base' })
    );

    renderStations(allStations);
}

// Procesar el texto del CSV
function parseCSV(text, stationsSet, isAsturiasOnlyFile) {
    const lines = text.split("\n");
    if (lines.length === 0) return;

    // Detectar encabezado para buscar la columna 'PROVINCIA' y 'DESCRIPCION'
    const headerCols = lines[0].replace(/["\r]/g, "").split(";").map(c => c.trim().toUpperCase());
    
    let descIndex = headerCols.findIndex(c => c.includes("DESCRIPCION"));
    let provIndex = headerCols.findIndex(c => c.includes("PROVINCIA"));

    // Ajustes por defecto si no encuentra cabecera
    if (descIndex === -1) descIndex = 1;
    if (provIndex === -1) provIndex = 7;

    lines.forEach((line, index) => {
        if (index === 0) return; // Saltar cabecera
        
        const cleanedLine = line.replace(/["\r]/g, "").trim();
        if (cleanedLine !== "") {
            const columns = cleanedLine.split(";");
            
            const stationName = columns[descIndex] ? columns[descIndex].trim() : "";
            const provincia = columns[provIndex] ? columns[provIndex].trim() : "";

            // Si el archivo es solo de Asturias O si la columna provincia dice 'Asturias'
            if (stationName) {
                if (isAsturiasOnlyFile || provincia.toLowerCase().includes("asturias")) {
                    stationsSet.add(stationName);
                }
            }
        }
    });
}

function renderStations(list) {
    const container = document.getElementById("stations-list");
    if (!container) return;
    
    container.innerHTML = "";

    if (list.length === 0) {
        container.innerHTML = "<p class='loading-text'>No se encontraron estaciones para Asturias.</p>";
        return;
    }

    list.forEach(station => {
        const item = document.createElement("div");
        item.className = "station-item";
        item.innerHTML = `<span>📍 ${station}</span><span class="arrow">›</span>`;
        item.onclick = () => alert(`Horarios para: ${station}`);
        container.appendChild(item);
    });
}

function filterStations() {
    const searchInput = document.getElementById("station-search");
    if (!searchInput) return;
    
    const query = searchInput.value.toLowerCase();
    const filtered = allStations.filter(station => 
        station.toLowerCase().includes(query)
    );
    renderStations(filtered);
}
