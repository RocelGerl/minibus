// Variables globales
let mapa;
let marcadorUbicacion;
let minibusesCercanos = [];
let socket;
let modalMinibus;
let modalQR;
let scannerActivo = false;
let ubicacionActual = null;

// Capacidad máxima de minibuses
const CAPACIDAD_MAXIMA = 14; // Minibuses típicos en : 14 pasajeros sentados

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar modales de Bootstrap
    modalMinibus = new bootstrap.Modal(document.getElementById('modalMinibus'));
    modalQR = new bootstrap.Modal(document.getElementById('modalQR'));
    
    // Verificar sesión
    verificarSesion();
    
    // Inicializar mapa
    iniciarMapa();
    
    // Obtener ubicación del usuario
    obtenerUbicacion();
    
    // Conectar WebSocket para tiempo real
    conectarSocket();
    
    // Cargar minibuses cercanos cada 10 segundos
    setInterval(cargarMinibusesCercanos, 10000);
    
    // Configurar buscador con autocompletado
    configurarBuscador();
});

// Verificar si el usuario ha iniciado sesión
function verificarSesion() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    
    if(token && userData) {
        const user = JSON.parse(userData);
        document.getElementById('userName').innerText = user.nombre || 'Pasajero';
    } else {
        // Si no hay sesión, redirigir al login después de 3 segundos
        setTimeout(() => {
            if(!confirm('¿Quieres iniciar sesión para más funciones?')) {
                // Modo invitado limitado
                document.getElementById('userName').innerText = 'Invitado';
            } else {
                window.location.href = 'login.html';
            }
        }, 3000);
    }
}

// Inicializar mapa de 
function iniciarMapa() {
    mapa = L.map('mapaPasajero').setView([-16.5, -68.15], 14);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© Mi Chofer '
    }).addTo(mapa);
    
    // Iconos personalizados para diferentes estados
    const iconoDisponible = L.divIcon({
        className: 'marcador-bus disponible',
        html: '<i class="fas fa-bus fa-2x" style="color: #198754;"></i>',
        iconSize: [30, 30]
    });
    
    const iconoCasiLleno = L.divIcon({
        className: 'marcador-bus casi-lleno',
        html: '<i class="fas fa-bus fa-2x" style="color: #ffc107;"></i>',
        iconSize: [30, 30]
    });
    
    const iconoLleno = L.divIcon({
        className: 'marcador-bus lleno',
        html: '<i class="fas fa-bus fa-2x" style="color: #dc3545;"></i>',
        iconSize: [30, 30]
    });
    
    // Guardar iconos para uso posterior
    mapa.iconos = {
        disponible: iconoDisponible,
        casiLleno: iconoCasiLleno,
        lleno: iconoLleno
    };
}

// Obtener ubicación del pasajero
function obtenerUbicacion() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                ubicacionActual = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Centrar mapa en la ubicación
                mapa.setView([ubicacionActual.lat, ubicacionActual.lng], 15);
                
                // Agregar marcador del usuario
                if(marcadorUbicacion) {
                    marcadorUbicacion.setLatLng([ubicacionActual.lat, ubicacionActual.lng]);
                } else {
                    marcadorUbicacion = L.marker([ubicacionActual.lat, ubicacionActual.lng], {
                        icon: L.divIcon({
                            className: 'marcador-usuario',
                            html: '<i class="fas fa-circle-user fa-2x" style="color: #0d6efd;"></i>',
                            iconSize: [30, 30]
                        })
                    }).addTo(mapa).bindPopup('Tu ubicación');
                }
                
                // Cargar minibuses cercanos
                cargarMinibusesCercanos();
            },
            function(error) {
                console.error('Error obteniendo ubicación:', error);
                // Usar ubicación por defecto (centro de )
                ubicacionActual = { lat: -16.5, lng: -68.15 };
                mapa.setView([ubicacionActual.lat, ubicacionActual.lng], 14);
                cargarMinibusesCercanos();
            },
            {
                enableHighAccuracy: true,
                timeout: 10000
            }
        );
    }
}

// Conectar WebSocket para tiempo real
function conectarSocket() {
    socket = io(SOCKET_URL, {
        query: {
            token: localStorage.getItem('token') || 'guest',
            rol: 'pasajero'
        }
    });
    
    socket.on('connect', function() {
        console.log('Conectado para recibir actualizaciones');
    });
    
    // Escuchar actualizaciones de minibuses
    socket.on('minibus-actualizado', function(data) {
        actualizarMinibusEnMapa(data);
    });
    
    // Escuchar nuevas ubicaciones
    socket.on('ubicaciones-minibuses', function(data) {
        actualizarTodosMinibuses(data);
    });
}

// Cargar minibuses cercanos (simulado - después será API)
function cargarMinibusesCercanos() {
    // Simulación - Esto vendría del backend
    const minibusesSimulados = generarMinibusesCercanos();
    
    minibusesCercanos = minibusesSimulados;
    actualizarMapaConMinibuses(minibusesSimulados);
    actualizarListaMinibuses(minibusesSimulados);
}

// Generar minibuses de prueba
function generarMinibusesCercanos() {
    const rutas = ['288', '42', '15', '7', '21', '35'];
    const nombresRuta = [
        'Villa Salomé - Centro',
        'Sopocachi - Caja Ferroviaria',
        'San Pedro - Obrajes',
        'Miraflores - El Alto',
        'Calacoto - Centro',
        'Achumani - San Jorge'
    ];
    
    return rutas.map((ruta, index) => {
        // Generar ocupación aleatoria pero realista
        const ocupacion = Math.floor(Math.random() * CAPACIDAD_MAXIMA) + 1;
        const porcentaje = (ocupacion / CAPACIDAD_MAXIMA) * 100;
        
        let estado = 'disponible';
        if(porcentaje >= 90) {
            estado = 'lleno';
        } else if(porcentaje >= 70) {
            estado = 'casi_lleno';
        }
        
        // Generar ubicación cercana al usuario
        const lat = ubicacionActual ? 
            ubicacionActual.lat + (Math.random() - 0.5) * 0.02 : 
            -16.5 + (Math.random() - 0.5) * 0.05;
        const lng = ubicacionActual ? 
            ubicacionActual.lng + (Math.random() - 0.5) * 0.02 : 
            -68.15 + (Math.random() - 0.5) * 0.05;
        
        return {
            id: `MIN-${ruta}-${Math.floor(Math.random() * 100)}`,
            ruta: ruta,
            nombreRuta: nombresRuta[index % nombresRuta.length],
            lat: lat,
            lng: lng,
            ocupacion: ocupacion,
            capacidad: CAPACIDAD_MAXIMA,
            estado: estado,
            chofer: `Chofer ${Math.floor(Math.random() * 100)}`,
            tiempoLlegada: Math.floor(Math.random() * 10) + 1, // minutos
            paradas: [
                'Plaza San Francisco',
                'San Pedro',
                'Obrajes',
                'Mallasa'
            ]
        };
    });
}

// Actualizar mapa con los minibuses
function actualizarMapaConMinibuses(minibuses) {
    // Limpiar marcadores anteriores (excepto el del usuario)
    mapa.eachLayer(function(layer) {
        if(layer instanceof L.Marker && layer !== marcadorUbicacion) {
            mapa.removeLayer(layer);
        }
    });
    
    // Agregar nuevos marcadores
    minibuses.forEach(bus => {
        let icono;
        
        switch(bus.estado) {
            case 'lleno':
                icono = mapa.iconos.lleno;
                break;
            case 'casi_lleno':
                icono = mapa.iconos.casiLleno;
                break;
            default:
                icono = mapa.iconos.disponible;
        }
        
        const marcador = L.marker([bus.lat, bus.lng], { icon: icono })
            .addTo(mapa)
            .bindPopup(`
                <b>Ruta ${bus.ruta}</b><br>
                <span class="badge ${bus.estado === 'lleno' ? 'bg-danger' : (bus.estado === 'casi_lleno' ? 'bg-warning' : 'bg-success')}">
                    ${bus.ocupacion}/${bus.capacidad} pasajeros
                </span><br>
                <small>${bus.nombreRuta}</small><br>
                <button class="btn btn-sm btn-primary mt-1" onclick="verDetalleMinibus('${bus.id}')">Ver detalles</button>
            `);
        
        // Guardar referencia
        bus.marcador = marcador;
    });
}

// Actualizar lista de minibuses en el panel lateral
function actualizarListaMinibuses(minibuses) {
    const contenedor = document.getElementById('listaMinibuses');
    
    if(minibuses.length === 0) {
        contenedor.innerHTML = `
            <div class="col-12 text-center py-4">
                <i class="fas fa-bus fa-3x text-muted"></i>
                <p class="text-muted mt-2">No hay minibuses cerca</p>
            </div>
        `;
        return;
    }
    
    // Ordenar por distancia (simulado)
    const html = minibuses.map(bus => {
        // Determinar clase de color según estado
        let claseEstado = '';
        let textoEstado = '';
        
        if(bus.estado === 'lleno') {
            claseEstado = 'danger';
            textoEstado = 'LLENO';
        } else if(bus.estado === 'casi_lleno') {
            claseEstado = 'warning';
            textoEstado = 'CASI LLENO';
        } else {
            claseEstado = 'success';
            textoEstado = 'DISPONIBLE';
        }
        
        // Calcular barra de progreso
        const porcentaje = (bus.ocupacion / bus.capacidad) * 100;
        
        return `
            <div class="col-12">
                <div class="card ${bus.estado === 'lleno' ? 'border-danger' : ''} mb-2">
                    <div class="card-body p-2">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-0">
                                    <i class="fas fa-bus"></i> Ruta ${bus.ruta}
                                    <span class="badge bg-${claseEstado}">${textoEstado}</span>
                                </h6>
                                <small class="text-muted">${bus.nombreRuta}</small>
                            </div>
                            <span class="badge bg-primary">${bus.tiempoLlegada} min</span>
                        </div>
                        
                        <!-- Barra de capacidad -->
                        <div class="progress mt-2" style="height: 5px;">
                            <div class="progress-bar bg-${claseEstado}" 
                                 style="width: ${porcentaje}%;"></div>
                        </div>
                        
                        <div class="d-flex justify-content-between mt-2">
                            <small>${bus.ocupacion}/${bus.capacidad} pasajeros</small>
                            <button class="btn btn-sm btn-outline-primary" 
                                    onclick="verDetalleMinibus('${bus.id}')">
                                Ver
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    contenedor.innerHTML = html;
}

// Ver detalle de un minibus específico
function verDetalleMinibus(busId) {
    const bus = minibusesCercanos.find(b => b.id === busId);
    
    if(!bus) return;
    
    // Llenar modal
    document.getElementById('modalRuta').innerText = `Ruta ${bus.ruta}`;
    document.getElementById('modalNombreRuta').innerText = bus.nombreRuta;
    document.getElementById('modalCapacidad').innerHTML = `${bus.ocupacion}/${bus.capacidad}`;
    document.getElementById('modalLlegada').innerText = `~${bus.tiempoLlegada} minutos`;
    
    // Configurar barra de progreso
    const porcentaje = (bus.ocupacion / bus.capacidad) * 100;
    const barra = document.getElementById('modalBarraProgreso');
    barra.style.width = `${porcentaje}%`;
    
    // Cambiar color según ocupación
    if(porcentaje >= 90) {
        barra.className = 'progress-bar bg-danger';
    } else if(porcentaje >= 70) {
        barra.className = 'progress-bar bg-warning';
    } else {
        barra.className = 'progress-bar bg-success';
    }
    
    // Lista de paradas
    const listaParadas = document.getElementById('modalParadas');
    listaParadas.innerHTML = bus.paradas.map(parada => 
        `<li class="list-group-item"><i class="fas fa-map-marker-alt text-primary"></i> ${parada}</li>`
    ).join('');
    
    // Deshabilitar botón de pago si está lleno? (opcional)
    const btnPago = document.getElementById('btnPagarQR');
    if(bus.estado === 'lleno') {
        btnPago.disabled = true;
        btnPago.innerHTML = '<i class="fas fa-ban"></i> Minibus lleno';
    } else {
        btnPago.disabled = false;
        btnPago.innerHTML = '<i class="fas fa-qrcode"></i> Pagar con QR';
    }
    
    modalMinibus.show();
}

// Buscar destino
function buscarDestino() {
    const destino = document.getElementById('buscadorDestino').value;
    
    if(destino.length < 3) {
        alert('Ingresa un destino más específico');
        return;
    }
    
    // Mostrar indicador de carga
    document.getElementById('listaMinibuses').innerHTML = `
        <div class="col-12 text-center py-4">
            <i class="fas fa-spinner fa-spin fa-2x"></i>
            <p>Buscando rutas hacia "${destino}"...</p>
        </div>
    `;
    
    // Simular búsqueda (después será API real)
    setTimeout(() => {
        // Filtrar minibuses que van hacia ese destino (simulado)
        const minibusesFiltrados = minibusesCercanos.filter(bus => 
            bus.nombreRuta.toLowerCase().includes(destino.toLowerCase()) ||
            bus.paradas.some(p => p.toLowerCase().includes(destino.toLowerCase()))
        );
        
        if(minibusesFiltrados.length > 0) {
            actualizarListaMinibuses(minibusesFiltrados);
            
            // Resaltar en el mapa
            minibusesFiltrados.forEach(bus => {
                if(bus.marcador) {
                    bus.marcador.openPopup();
                }
            });
        } else {
            document.getElementById('listaMinibuses').innerHTML = `
                <div class="col-12 text-center py-4">
                    <i class="fas fa-frown fa-3x text-muted"></i>
                    <p class="text-muted">No hay minibuses hacia "${destino}"</p>
                    <button class="btn btn-sm btn-primary" onclick="cargarMinibusesCercanos()">
                        Ver todos los minibuses
                    </button>
                </div>
            `;
        }
    }, 1500);
}

// Búsqueda rápida por etiquetas
function buscarRapido(destino) {
    document.getElementById('buscadorDestino').value = destino;
    buscarDestino();
}

// Pagar con QR
function pagarConQR() {
    modalMinibus.hide();
    modalQR.show();
    
    if(!scannerActivo) {
        iniciarScannerQR();
    }
}

// Iniciar escáner QR
function iniciarScannerQR() {
    scannerActivo = true;
    
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#qrScanner'),
            constraints: {
                width: 480,
                height: 320,
                facingMode: "environment" // cámara trasera
            },
        },
        decoder: {
            readers: ["code_128_reader", "qr_code"]
        }
    }, function(err) {
        if (err) {
            console.log(err);
            document.getElementById('qrResultado').innerHTML = `
                <div class="alert alert-danger">
                    Error al iniciar cámara. Verifica los permisos.
                </div>
            `;
            return;
        }
        Quagga.start();
    });
    
    Quagga.onDetected(function(data) {
        const code = data.codeResult.code;
        
        try {
            const qrData = JSON.parse(code);
            
            // Verificar que sea un QR válido de minibus
            if(qrData.minibusId && qrData.monto) {
                document.getElementById('qrResultado').innerHTML = `
                    <div class="alert alert-success">
                        <i class="fas fa-check-circle"></i> 
                        Pago de Bs ${qrData.monto} exitoso
                    </div>
                `;
                
                // Detener scanner después de pago exitoso
                setTimeout(() => {
                    Quagga.stop();
                    scannerActivo = false;
                    modalQR.hide();
                    
                    // Actualizar saldo del pasajero
                    actualizarSaldo(qrData.monto);
                }, 2000);
            }
        } catch(e) {
            console.log('QR no válido');
        }
    });
}

// Centrar mapa en ubicación actual
function centrarMapa() {
    if(ubicacionActual) {
        mapa.setView([ubicacionActual.lat, ubicacionActual.lng], 15);
    }
}

// Actualizar mapa manualmente
function actualizarMapa() {
    cargarMinibusesCercanos();
}

// Configurar buscador con autocompletado
function configurarBuscador() {
    // Placeholder con sugerencias de 
    const lugaresTuristicos = [
        'San Francisco', 'San Pedro', 'Obrajes', 'Sopocachi',
        'Miraflores', 'Calacoto', 'Achumani', 'Mallasa',
        'Cementerio', 'Plaza Murillo', 'UMSA', 'Mercado Lanza'
    ];
    
    // Aquí se puede implementar autocompletado con una librería como Awesomplete
}

// Funciones auxiliares
function actualizarSaldo(monto) {
    // Actualizar saldo en localStorage o backend
    console.log('Pago realizado:', monto);
}

function irMiPerfil() {
    window.location.href = 'perfil.html';
}

function irHistorial() {
    window.location.href = 'historial.html';
}

function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    window.location.href = 'login.html';
}