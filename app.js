// 1. Filtrar solo las actualizaciones del núcleo de Asturias (1001X)
function filtrarAsturias(datosTiempoReal) {
    return datosTiempoReal.filter(item => item.includes("1001X"));
}

// 2. Extraer qué línea es para poner la foto correcta
function obtenerLogoLinea(idTren) {
    if (idTren.includes("C1")) return "img/C-1.png";
    if (idTren.includes("C2")) return "img/C-2.png";
    if (idTren.includes("C3")) return "img/C-3.png";
    if (idTren.includes("C4")) return "img/C-4.png";
    if (idTren.includes("C5")) return "img/C-5.png";
    if (idTren.includes("C6")) return "img/C-6.png";
    if (idTren.includes("C7")) return "img/C-7.png";
    if (idTren.includes("C8")) return "img/C-8.png";
    return "img/default.png";
}

// 3. Pintar la tarjeta del tren en pantalla
function renderizarTren(tren) {
    const contenedor = document.getElementById("lista-trenes");
    const logo = obtenerLogoLinea(tren.id);
    
    contenedor.innerHTML += `
        <div class="train-card">
            <div class="train-header">
                <img src="${logo}" alt="Línea" class="line-icon">
                <span class="destination">${tren.destino}</span>
            </div>
            <div class="train-time">
                <span class="minutes">${tren.minutosFaltantes} min</span>
            </div>
        </div>
    `;
}
