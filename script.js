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

        // Intentar cargar las estaciones si aún no se han cargado
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
    // Si tu archivo en GitHub tiene un nombre distinto, cámbialo en la siguiente línea:
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
                    ⚠️ No se pudo cargar el archivo CSV.<br>
                    Verifica que el archivo esté subido como <b>${csvFileName}</b>.
                </p>`;
            }
        });
}

function parseCSV(text) {
    const lines = text.split("\n");
    let stationsSet = new Set();

    lines.forEach((line, index) => {
        if (line.trim() !== "") {
            const cleanedLine = line.replace(/["\r]/g, "").trim();
            const columns = cleanedLine.split(",");
            const stationName = columns[0];
            if (stationName && index > 0) {
                stationsSet.add(stationName);
            }
        }
    });

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
