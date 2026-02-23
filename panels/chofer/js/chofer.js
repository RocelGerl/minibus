// ===== VARIABLES GLOBALES =====
let socket;
let mapa;
let marcadorChofer;
let rastreadorGPS;
let jornadaActiva = false;
let inicioJornadaTime;
let rutaActual = '288';
let totalPasajeros = 0;
let totalEfectivo = 0;
let totalGastos = 0;
let vueltasCompletadas = 0;
let movimientos = [];
let pagosQR = [];
let kmRecorridos = 0;
let ultimaPosicion = null;

// Configuración
const API_URL = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:3000';
const CAPACIDAD_MAXIMA = 14;
const TARIFA_PASAJE = 2;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    // Ocultar preloader
    setTimeout(() => {
        document.querySelector('.chofer-preloader').classList.add('hidden');
    }, 1000);
    
    // Inicializar componentes
    actualizarReloj();
    setInterval(actualizarReloj, 1000);
    
    // Verificar sesión
    verificarSesion();
    
    // Inicializar tooltips
    iniciarTooltips();
    
    // Cargar datos del chofer
    cargarDatosChofer();
});

// ===== FUNCIONES DE INICIO =====
function verificarSesion() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    
    if(!token || !userData) {
        // Redirigir al login
        window.location.href = '../auth/login.html?rol=chofer';
    } else {
        const user = JSON.parse(userData);
        document.getElementById('nombreChofer').textContent = user.nombre || 'Chofer';
    }
}

function cargarDatosChofer() {
    // Cargar datos del localStorage o API
    const jornadaGuardada = localStorage.getItem('jornadaActiva');
    
    if(jornadaGuardada) {
        const datos = JSON.parse(jornadaGuardada);
        // Restaurar jornada si estaba activa
        if(datos.activa) {
            restaurarJornada(datos);
        }
    }
}

function iniciarTooltips() {
    // Inicializar popovers de Bootstrap si es necesario
}

// ===== RELOJ =====
function actualizarReloj() {
    const ahora = new Date();
    const horas = ahora.getHours().toString().padStart(2, '0');
    const minutos = ahora.getMinutes().toString().padStart(2, '0');
    const segundos = ahora.getSeconds().toString().padStart(2, '0');
    
    document.getElementById('reloj').textContent = `${horas}:${minutos}:${segundos}`;
    
    if(inicioJornadaTime) {
        const diff = Math.floor((ahora - inicioJornadaTime) / 1000);
        const h = Math.floor(diff / 3600).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        const s = (diff % 60).toString().padStart(2, '0');
        
        document.getElementById('tiempoViaje').textContent = `${h}:${m}:${s}`;
    }
}

// ===== CIERRE DE SESIÓN =====
function cerrarSesion() {
    if(confirm('¿Estás seguro de cerrar sesión?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        localStorage.removeItem('jornadaActiva');
        window.location.href = '../auth/login.html';
    }
}

// Exportar funciones globales
window.cerrarSesion = cerrarSesion;