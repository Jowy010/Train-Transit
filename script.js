let allStations = [];

// Función para cambiar de vista (Inicio / Estaciones / etc.)
function showView(viewName) {
    const homeView = document.getElementById("home-view");
    const estacionesView = document.getElementById("estaciones-view");

    // Desmarcar todos los iconos del menú inferior
    document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));

    if (viewName === "estaciones") {
        if (homeView) homeView.classList.add("view-hidden");
        if (estacionesView) estacionesView.classList.remove("view-hidden");
        
        const navEstaciones = document.getElementById("nav-estaciones");
        if (navEstaciones) navEstaciones.classList.add("active");

        // Cargar estaciones si no están cargadas
        if (allStations.length === 0) {
            loadStationsCSV();
        }
    } else {
        if (estacionesView) estacionesView.classList.add("view-hidden");
        if (homeView) homeView.classList.remove("view-hidden");
        
        const navHome = document.getElementById("nav-home");
        if (navHome) navHome.classList.add("active");
    }
}

// Cargar el archivo CSV
function loadStationsCSV() {
    const csvFileName = "Estaciones Cercanías Asturias.csv";

    fetch(csvFileName)
        .then(response => {
            if (!response.ok) {
                throw new Error("No se encontró el archivo CSV");
            }
            return response.text();
        })
        .then(data => parseCSV(data))
        .catch(error => {
            console.error("Error al cargar estaciones:", error);
            const container = document.getElementById("stations-list");
            if (container) {
                container.innerHTML = `<p class='loading-text' style='color: #ef4444;'>
                    ⚠️ No se pudo cargar el archivo CSV.
                </p>`;
            }
        });
}

function parseCSV(text) {
    const lines = text.split("\n");
    let stationsSet = new Set();

    lines.forEach((line, index) => {
        const cleanedLine = line.replace(/["\r]/g, "").trim();
        if (cleanedLine !== "") {
            // El CSV utiliza punto y coma (;) como separador
            const columns = cleanedLine.split(";");
            
            // La columna de descripción suele ser la segunda (índice 1)
            let stationName = columns[1] ? columns[1].trim() : columns[0].trim();
            
            // Ignorar la cabecera del CSV si contiene palabras como 'DESCRIPCION' o 'CODIGO'
            if (stationName && !stationName.toUpperCase().includes("DESCRIPCION") && !stationName.toUpperCase().includes("CODIGO")) {
                stationsSet.add(stationName);
            }
        }
    });

    // Ordenar todas las estaciones de la A a la Z
    allStations = Array.from(stationsSet).sort((a, b) => 
        a.localeCompare(b, 'es', { sensitivity: 'base' })
    );
    
    renderStations(allStations);
}

function renderStations(list) {
    const container = document.getElementById("stations-list");
    if (!container) return;
    
    container.innerHTML = "";

    if (list.length === 0) {
        container.innerHTML = "<p class='loading-text'>No se encontraron estaciones.</p>";
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
