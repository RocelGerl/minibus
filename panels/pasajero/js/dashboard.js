// Variables globales
let mapa;
let marcadorUsuario;
let minibusesActivos = [];
let socket;
let intervaloActualizacion;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    iniciarMapa();
    obtenerUbicacion();
    conectarWebSocket();
    cargarMinibusesCercanos();
    iniciarEfectosVisuales();
    
    // Animación de bienvenida
    setTimeout(() => {
        showNotification('¡Bienvenido a Mi Chofer !', 'info');
    }, 1000);
});

// Iniciar mapa con estilo personalizado
function iniciarMapa() {
    mapa = L.map('mapaPasajero', {
        zoomControl: false,
        attributionControl: false
    }).setView([-16.5, -68.15], 14);
    
    // Capa de mapa con estilo oscuro para mejor contraste
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(mapa);
    
    // Control de zoom personalizado
    L.control.zoom({
        position: 'bottomright'
    }).addTo(mapa);
}

// Obtener ubicación con animación
function obtenerUbicacion() {
    if ("geolocation" in navigator) {
        // Mostrar indicador de búsqueda
        const buscando = L.marker([-16.5, -68.15], {
            icon: L.divIcon({
                className: 'buscando-ubicacion',
                html: '<div class="loader-llajta"></div>',
                iconSize: [40, 40]
            })
        }).addTo(mapa);
        
        navigator.geolocation.getCurrentPosition(
            function(position) {
                // Remover indicador
                mapa.removeLayer(buscando);
                
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // Animación de llegada al mapa
                mapa.flyTo([lat, lng], 16, {
                    animate: true,
                    duration: 2
                });
                
                // Marcador del usuario con animación
                marcadorUsuario = L.marker([lat, lng], {
                    icon: L.divIcon({
                        className: 'marcador-usuario',
                        html: '<i class="fas fa-circle-user fa-3x" style="color: #ff9e00; filter: drop-shadow(0 0 10px #ff9e00);"></i>',
                        iconSize: [40, 40]
                    })
                }).addTo(mapa);
                
                // Efecto de pulso alrededor del usuario
                L.circle([lat, lng], {
                    radius: 50,
                    color: '#ff9e00',
                    fillColor: '#ff9e00',
                    fillOpacity: 0.1,
                    weight: 2,
                    opacity: 0.3
                }).addTo(mapa);
                
                showNotification('Ubicación encontrada', 'success');
            },
            function(error) {
                console.error('Error:', error);
                showNotification('Activa tu GPS para mejor experiencia', 'warning');
            }
        );
    }
}

// Cargar minibuses con efecto de aparición
function cargarMinibusesCercanos() {
    // Simular carga de datos
    fetch('/api/minibuses/cercanos')
        .then(response => response.json())
        .then(minibuses => {
            minibusesActivos = minibuses;
            
            // Limpiar marcadores anteriores
            mapa.eachLayer(layer => {
                if(layer instanceof L.Marker && layer !== marcadorUsuario) {
                    mapa.removeLayer(layer);
                }
            });
            
            // Agregar nuevos marcadores con animación
            minibuses.forEach((bus, index) => {
                setTimeout(() => {
                    agregarMarcadorMinibus(bus);
                }, index * 100);
            });
            
            actualizarListaMinibuses(minibuses);
        })
        .catch(error => {
            console.error('Error:', error);
            // Datos de demostración
            const minibusesDemo = generarMinibusesDemo();
            minibusesActivos = minibusesDemo;
            
            minibusesDemo.forEach((bus, index) => {
                setTimeout(() => {
                    agregarMarcadorMinibus(bus);
                }, index * 100);
            });
            
            actualizarListaMinibuses(minibusesDemo);
        });
}

// Agregar marcador con efecto
function agregarMarcadorMinibus(bus) {
    // Determinar color según ocupación
    const porcentaje = (bus.ocupacion / bus.capacidad) * 100;
    let color = '#4cc9f0'; // disponible
    
    if(porcentaje >= 90) {
        color = '#e63946'; // lleno
    } else if(porcentaje >= 70) {
        color = '#ff9e00'; // casi lleno
    }
    
    // Icono con animación
    const icono = L.divIcon({
        className: `marcador-bus ${porcentaje >= 90 ? 'lleno' : ''}`,
        html: `<i class="fas fa-bus fa-2x" style="color: ${color};"></i>
               <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" 
                     style="font-size: 10px;">${bus.ocupacion}</span>`,
        iconSize: [40, 40]
    });
    
    const marcador = L.marker([bus.lat, bus.lng], { icon: icono })
        .addTo(mapa)
        .bindPopup(crearPopupMinibus(bus));
    
    // Efecto de aparición
    marcador.getElement().style.opacity = '0';
    setTimeout(() => {
        marcador.getElement().style.transition = 'opacity 0.5s';
        marcador.getElement().style.opacity = '1';
    }, 100);
}

// Crear popup con diseño atractivo
function crearPopupMinibus(bus) {
    const porcentaje = (bus.ocupacion / bus.capacidad) * 100;
    let estadoClass = 'bg-success';
    let estadoText = 'Disponible';
    
    if(porcentaje >= 90) {
        estadoClass = 'bg-danger';
        estadoText = 'Lleno';
    } else if(porcentaje >= 70) {
        estadoClass = 'bg-warning';
        estadoText = 'Casi lleno';
    }
    
    return `
        <div class="popup-minibus">
            <h6 class="fw-bold">Ruta ${bus.ruta}</h6>
            <p class="small mb-1">${bus.nombreRuta}</p>
            <div class="d-flex align-items-center mb-2">
                <span class="badge ${estadoClass} me-2">${estadoText}</span>
                <small>${bus.ocupacion}/${bus.capacidad} pasajeros</small>
            </div>
            <div class="progress mb-2" style="height: 5px;">
                <div class="progress-bar bg-${estadoClass.replace('bg-', '')}" 
                     style="width: ${porcentaje}%;"></div>
            </div>
            <p class="small mb-2">
                <i class="fas fa-clock"></i> Llega en ${bus.tiempoLlegada} min
            </p>
            <button class="btn btn-sm btn-primary w-100" onclick="verDetalleMinibus('${bus.id}')">
                Ver detalles
            </button>
        </div>
    `;
}

// Actualizar lista con efectos
function actualizarListaMinibuses(minibuses) {
    const contenedor = document.getElementById('listaMinibuses');
    
    if(minibuses.length === 0) {
        contenedor.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-bus fa-4x text-muted mb-3"></i>
                <p class="text-muted">No hay minibuses cerca</p>
            </div>
        `;
        return;
    }
    
    // Ordenar por distancia
    minibuses.sort((a, b) => a.distancia - b.distancia);
    
    const html = minibuses.map((bus, index) => {
        const porcentaje = (bus.ocupacion / bus.capacidad) * 100;
        let estadoClass = 'success';
        let estadoText = 'Disponible';
        
        if(porcentaje >= 90) {
            estadoClass = 'danger';
            estadoText = 'LLENO';
        } else if(porcentaje >= 70) {
            estadoClass = 'warning';
            estadoText = 'CASI LLENO';
        }
        
        return `
            <div class="col-12 mb-2 animate__animated animate__fadeInUp" style="animation-delay: ${index * 0.1}s">
                <div class="card card-minibus ${porcentaje >= 90 ? 'minibus-lleno' : ''}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h5 class="card-title mb-1">
                                    <i class="fas fa-bus me-2" style="color: ${porcentaje >= 90 ? '#e63946' : (porcentaje >= 70 ? '#ff9e00' : '#4cc9f0')};"></i>
                                    Ruta ${bus.ruta}
                                </h5>
                                <p class="small text-muted mb-2">${bus.nombreRuta}</p>
                            </div>
                            <span class="badge bg-${estadoClass} badge-${estadoClass}">${estadoText}</span>
                        </div>
                        
                        <div class="capacidad-indicator mb-2">
                            <div class="capacidad-bar bg-${estadoClass}" style="width: ${porcentaje}%;"></div>
                        </div>
                        
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">
                                <i class="fas fa-users"></i> ${bus.ocupacion}/${bus.capacidad}
                            </small>
                            <small class="text-muted">
                                <i class="fas fa-clock"></i> ${bus.tiempoLlegada} min
                            </small>
                            <button class="btn btn-sm btn-outline-primary" onclick="verDetalleMinibus('${bus.id}')">
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

// Efectos visuales adicionales
function iniciarEfectosVisuales() {
    // Efecto parallax en el fondo
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        document.body.style.backgroundPositionY = (scrolled * 0.5) + 'px';
    });
    
    // Animación de entrada para elementos
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                entry.target.classList.add('animate__fadeInUp');
            }
        });
    });
    
    document.querySelectorAll('.card').forEach(card => {
        observer.observe(card);
    });
}

// Conectar WebSocket con reconexión automática
function conectarWebSocket() {
    socket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
    });
    
    socket.on('connect', () => {
        showNotification('Conectado en tiempo real', 'success');
    });
    
    socket.on('minibus-actualizado', (data) => {
        actualizarMinibusEnMapa(data);
    });
    
    socket.on('disconnect', () => {
        showNotification('Reconectando...', 'warning');
    });
}

// Generar datos de demostración
function generarMinibusDemo(id, ruta, lat, lng, ocupacion) {
    const rutas = {
        '288': 'Villa Salomé - Centro',
        '42': 'Sopocachi - Caja Ferroviaria',
        '15': 'San Pedro - Obrajes',
        '7': 'Miraflores - El Alto',
        '21': 'Calacoto - Centro',
        '35': 'Achumani - San Jorge'
    };
    
    return {
        id: id || `MIN-${ruta}-${Math.floor(Math.random() * 100)}`,
        ruta: ruta,
        nombreRuta: rutas[ruta] || 'Ruta en ',
        lat: lat || -16.5 + (Math.random() - 0.5) * 0.1,
        lng: lng || -68.15 + (Math.random() - 0.5) * 0.1,
        ocupacion: ocupacion || Math.floor(Math.random() * 14) + 1,
        capacidad: 14,
        tiempoLlegada: Math.floor(Math.random() * 10) + 1,
        distancia: Math.random() * 2
    };
}

// Inicializar con datos de demostración
function generarMinibusesDemo() {
    const rutas = ['288', '42', '15', '7', '21', '35'];
    const minibuses = [];
    
    // Coordenadas aproximadas de zonas de 
    const zonas = [
        { lat: -16.4958, lng: -68.1356, nombre: 'San Francisco' },
        { lat: -16.5045, lng: -68.1456, nombre: 'San Pedro' },
        { lat: -16.5145, lng: -68.1256, nombre: 'Sopocachi' },
        { lat: -16.5342, lng: -68.1245, nombre: 'Obrajes' },
        { lat: -16.5234, lng: -68.1423, nombre: 'Villa Salomé' }
    ];
    
    for(let i = 0; i < 8; i++) {
        const zona = zonas[Math.floor(Math.random() * zonas.length)];
        const ruta = rutas[Math.floor(Math.random() * rutas.length)];
        
        // Ocupación variada para mostrar diferentes estados
        let ocupacion;
        if(i < 2) {
            ocupacion = 13; // Lleno
        } else if(i < 4) {
            ocupacion = 11; // Casi lleno
        } else {
            ocupacion = Math.floor(Math.random() * 8) + 1; // Disponible
        }
        
        minibuses.push(generarMinibusDemo(
            `MIN-${ruta}-${i+1}`,
            ruta,
            zona.lat + (Math.random() - 0.5) * 0.02,
            zona.lng + (Math.random() - 0.5) * 0.02,
            ocupacion
        ));
    }
    
    return minibuses;
}