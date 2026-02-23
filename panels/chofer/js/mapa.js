// ===== INICIAR GPS (Continuación) =====
function iniciarGPS() {
    if(!navigator.geolocation) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Tu dispositivo no soporta GPS'
        });
        return;
    }
    
    rastreadorGPS = navigator.geolocation.watchPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const velocidad = position.coords.speed || 0;
            
            // Actualizar marcador
            marcadorChofer.setLatLng([lat, lng]);
            mapa.panTo([lat, lng]);
            
            // Calcular velocidad en km/h
            const velocidadKmh = (velocidad * 3.6).toFixed(1);
            document.getElementById('velocidad').innerHTML = 
                `<i class="fas fa-tachometer-alt me-1"></i>${velocidadKmh} km/h`;
            
            // Calcular distancia recorrida
            if(ultimaPosicion) {
                const distancia = calcularDistancia(
                    ultimaPosicion.lat, ultimaPosicion.lng,
                    lat, lng
                );
                kmRecorridos += distancia;
                document.getElementById('distanciaRecorrida').innerHTML =
                    `<i class="fas fa-road me-1"></i>${kmRecorridos.toFixed(2)} km`;
                document.getElementById('kmTotales').textContent = `${kmRecorridos.toFixed(1)} km`;
            }
            
            ultimaPosicion = { lat, lng };
            
            // Enviar ubicación por socket
            if(socket) {
                socket.emit('ubicacion-actualizada', {
                    lat,
                    lng,
                    velocidad: velocidadKmh,
                    ruta: rutaActual,
                    timestamp: new Date()
                });
            }
            
            // Actualizar tiempo de viaje
            actualizarReloj();
        },
        function(error) {
            console.error('Error GPS:', error);
            let mensaje = 'Error al obtener ubicación';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    mensaje = 'Activaste el GPS en tu celular';
                    break;
                case error.POSITION_UNAVAILABLE:
                    mensaje = 'Señal GPS no disponible';
                    break;
                case error.TIMEOUT:
                    mensaje = 'Tiempo de espera agotado';
                    break;
            }
            
            document.getElementById('conexionIndicator').innerHTML = `
                <span class="punto rojo"></span>
                <span class="texto">Sin GPS</span>
            `;
        },
        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
        }
    );
    
    // Añadir círculo de precisión
    if(marcadorChofer) {
        L.circle([-16.5, -68.15], {
            radius: 50,
            color: '#4361ee',
            fillColor: '#4361ee',
            fillOpacity: 0.1,
            weight: 1
        }).addTo(mapa);
    }
}

// ===== CALCULAR DISTANCIA ENTRE DOS PUNTOS (Fórmula de Haversine) =====
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distancia = R * c; // Distancia en km
    return distancia;
}

// ===== DIBUJAR RUTA EN EL MAPA =====
function dibujarRutaEnMapa(rutaId) {
    // Coordenadas de ejemplo para rutas de 
    const rutas = {
        '288': [
            [-16.5234, -68.1423], // Villa Salomé
            [-16.5342, -68.1245], // Obrajes
            [-16.5045, -68.1456], // San Pedro
            [-16.4958, -68.1356]  // San Francisco
        ],
        '42': [
            [-16.5145, -68.1256], // Sopocachi
            [-16.5045, -68.1345], // El Prado
            [-16.4945, -68.1456]  // Cementerio
        ]
    };
    
    const coordenadas = rutas[rutaId] || rutas['288'];
    
    // Dibujar línea de la ruta
    L.polyline(coordenadas, {
        color: '#ff9e00',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10'
    }).addTo(mapa);
    
    // Añadir marcadores de paradas
    coordenadas.forEach((coord, index) => {
        L.marker(coord, {
            icon: L.divIcon({
                className: 'parada-marcador',
                html: `<div class="parada-numero">${index + 1}</div>`,
                iconSize: [25, 25]
            })
        }).addTo(mapa);
    });
}

// ===== ACTUALIZAR LISTA DE PARADAS =====
function actualizarParadas(rutaId) {
    const paradas = {
        '288': [
            { nombre: 'Villa Salomé', distancia: '0 km' },
            { nombre: 'Obrajes', distancia: '2.5 km' },
            { nombre: 'San Pedro', distancia: '4.2 km' },
            { nombre: 'Plaza San Francisco', distancia: '5.8 km' }
        ],
        '42': [
            { nombre: 'Sopocachi', distancia: '0 km' },
            { nombre: 'El Prado', distancia: '1.2 km' },
            { nombre: 'Cementerio', distancia: '2.8 km' }
        ]
    };
    
    const listaParadas = document.getElementById('listaParadas');
    const paradasRuta = paradas[rutaId] || paradas['288'];
    
    listaParadas.innerHTML = paradasRuta.map((p, index) => `
        <div class="parada-item">
            <span class="orden">${index + 1}</span>
            <span class="nombre">${p.nombre}</span>
            <span class="distancia">${p.distancia}</span>
        </div>
    `).join('');
}

// Exportar funciones
window.dibujarRutaEnMapa = dibujarRutaEnMapa;
window.actualizarParadas = actualizarParadas;