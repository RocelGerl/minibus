// ===== VARIABLES GLOBALES =====
let tablaHistorial;
let datosHistorial = [];

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    cargarHistorial();
    inicializarTabla();
    cargarResumen();
    
    // Establecer fechas por defecto (último mes)
    const hoy = new Date();
    const mesPasado = new Date();
    mesPasado.setMonth(mesPasado.getMonth() - 1);
    
    document.getElementById('fechaDesde').valueAsDate = mesPasado;
    document.getElementById('fechaHasta').valueAsDate = hoy;
});

// ===== CARGAR HISTORIAL =====
function cargarHistorial() {
    // Cargar del localStorage
    const historialGuardado = localStorage.getItem('historialJornadas');
    
    if(historialGuardado) {
        datosHistorial = JSON.parse(historialGuardado);
    } else {
        // Datos de ejemplo
        datosHistorial = generarDatosEjemplo();
    }
}

// ===== GENERAR DATOS DE EJEMPLO =====
function generarDatosEjemplo() {
    const datos = [];
    const rutas = ['288', '42', '15'];
    
    for(let i = 0; i < 30; i++) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        
        const pasajeros = Math.floor(Math.random() * 100) + 50;
        const efectivo = pasajeros * 2;
        const gastos = Math.floor(Math.random() * 50) + 20;
        const km = (Math.random() * 100 + 50).toFixed(1);
        
        datos.push({
            fecha: fecha.toISOString().split('T')[0],
            inicio: '06:00 AM',
            fin: '02:00 PM',
            ruta: rutas[Math.floor(Math.random() * rutas.length)],
            pasajeros: pasajeros,
            efectivo: efectivo,
            gastos: gastos,
            neto: efectivo - gastos,
            km: parseFloat(km),
            movimientos: []
        });
    }
    
    return datos;
}

// ===== INICIALIZAR TABLA =====
function inicializarTabla() {
    tablaHistorial = $('#tablaHistorial').DataTable({
        data: datosHistorial,
        columns: [
            { 
                data: 'fecha',
                render: function(data) {
                    return new Date(data).toLocaleDateString('es-BO');
                }
            },
            { data: 'ruta' },
            { data: 'inicio' },
            { data: 'fin' },
            { 
                data: null,
                render: function(data) {
                    const inicio = new Date(`2000-01-01 ${data.inicio}`);
                    const fin = new Date(`2000-01-01 ${data.fin}`);
                    const diff = (fin - inicio) / (1000 * 60 * 60);
                    return diff.toFixed(1) + ' h';
                }
            },
            { data: 'pasajeros' },
            { 
                data: 'efectivo',
                render: function(data) {
                    return 'Bs ' + data;
                }
            },
            { 
                data: 'gastos',
                render: function(data) {
                    return 'Bs ' + data;
                }
            },
            { 
                data: 'neto',
                render: function(data) {
                    return 'Bs ' + data;
                }
            },
            { 
                data: 'km',
                render: function(data) {
                    return data + ' km';
                }
            },
            {
                data: null,
                render: function(data) {
                    return `
                        <button class="btn btn-sm btn-info" onclick="verDetalle('${data.fecha}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="generarPDF('${data.fecha}')">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                    `;
                }
            }
        ],
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
        },
        order: [[0, 'desc']],
        pageLength: 10,
        responsive: true
    });
}

// ===== CARGAR RESUMEN =====
function cargarResumen() {
    let totalEfectivo = 0;
    let totalPasajeros = 0;
    let totalKm = 0;
    
    datosHistorial.forEach(j => {
        totalEfectivo += j.neto || 0;
        totalPasajeros += j.pasajeros || 0;
        totalKm += j.km || 0;
    });
    
    document.getElementById('totalGanado').textContent = `Bs ${totalEfectivo}`;
    document.getElementById('totalPasajerosHist').textContent = totalPasajeros;
    document.getElementById('totalKm').textContent = `${totalKm.toFixed(1)} km`;
    document.getElementById('totalJornadas').textContent = datosHistorial.length;
}

// ===== APLICAR FILTROS =====
function aplicarFiltros() {
    const desde = document.getElementById('fechaDesde').value;
    const hasta = document.getElementById('fechaHasta').value;
    const ruta = document.getElementById('filtroRuta').value;
    
    const datosFiltrados = datosHistorial.filter(j => {
        let cumple = true;
        
        if(desde && j.fecha < desde) cumple = false;
        if(hasta && j.fecha > hasta) cumple = false;
        if(ruta && j.ruta !== ruta) cumple = false;
        
        return cumple;
    });
    
    tablaHistorial.clear();
    tablaHistorial.rows.add(datosFiltrados);
    tablaHistorial.draw();
    
    // Actualizar resumen filtrado
    let totalEfectivo = 0;
    let totalPasajeros = 0;
    let totalKm = 0;
    
    datosFiltrados.forEach(j => {
        totalEfectivo += j.neto || 0;
        totalPasajeros += j.pasajeros || 0;
        totalKm += j.km || 0;
    });
    
    document.getElementById('totalGanado').textContent = `Bs ${totalEfectivo}`;
    document.getElementById('totalPasajerosHist').textContent = totalPasajeros;
    document.getElementById('totalKm').textContent = `${totalKm.toFixed(1)} km`;
    document.getElementById('totalJornadas').textContent = datosFiltrados.length;
}

// ===== VER DETALLE DE JORNADA =====
function verDetalle(fecha) {
    const jornada = datosHistorial.find(j => j.fecha === fecha);
    
    if(!jornada) return;
    
    let html = `
        <div class="text-start">
            <p><strong>Fecha:</strong> ${new Date(jornada.fecha).toLocaleDateString()}</p>
            <p><strong>Ruta:</strong> ${jornada.ruta}</p>
            <p><strong>Horario:</strong> ${jornada.inicio} - ${jornada.fin}</p>
            <p><strong>Pasajeros:</strong> ${jornada.pasajeros}</p>
            <p><strong>Efectivo:</strong> Bs ${jornada.efectivo}</p>
            <p><strong>Gastos:</strong> Bs ${jornada.gastos}</p>
            <p><strong>Neto:</strong> Bs ${jornada.neto}</p>
            <p><strong>KM recorridos:</strong> ${jornada.km} km</p>
        </div>
    `;
    
    Swal.fire({
        title: 'Detalle de jornada',
        html: html,
        icon: 'info',
        confirmButtonText: 'Cerrar'
    });
}

// ===== EXPORTAR A EXCEL =====
function exportarExcel() {
    // Crear CSV
    let csv = 'Fecha,Ruta,Inicio,Fin,Duración,Pasajeros,Efectivo,Gastos,Neto,KM\n';
    
    datosHistorial.forEach(j => {
        const inicio = new Date(`2000-01-01 ${j.inicio}`);
        const fin = new Date(`2000-01-01 ${j.fin}`);
        const duracion = ((fin - inicio) / (1000 * 60 * 60)).toFixed(1);
        
        csv += `${j.fecha},${j.ruta},${j.inicio},${j.fin},${duracion},${j.pasajeros},${j.efectivo},${j.gastos},${j.neto},${j.km}\n`;
    });
    
    // Descargar archivo
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    Swal.fire({
        icon: 'success',
        title: 'Exportado',
        text: 'Archivo CSV generado',
        timer: 1500
    });
}

// ===== GENERAR PDF =====
function generarPDF(fecha) {
    Swal.fire({
        icon: 'info',
        title: 'Generando PDF',
        text: 'Esta función estará disponible en la versión completa',
        timer: 2000
    });
}

// Exportar funciones
window.aplicarFiltros = aplicarFiltros;
window.exportarExcel = exportarExcel;
window.verDetalle = verDetalle;
window.generarPDF = generarPDF;