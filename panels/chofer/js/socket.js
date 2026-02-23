// ===== CONECTAR WEBSOCKET =====
function conectarWebSocket() {
    socket = io(SOCKET_URL, {
        query: {
            token: localStorage.getItem('token'),
            rol: 'chofer',
            minibusId: 'CH-2880',
            ruta: rutaActual
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10
    });
    
    socket.on('connect', function() {
        console.log('✅ Conectado al servidor');
        document.getElementById('conexionIndicator').innerHTML = `
            <span class="punto verde"></span>
            <span class="texto">Conectado</span>
        `;
        
        // Unirse a sala de su ruta
        socket.emit('unirse-ruta', rutaActual);
    });
    
    socket.on('disconnect', function() {
        console.log('❌ Desconectado del servidor');
        document.getElementById('conexionIndicator').innerHTML = `
            <span class="punto rojo"></span>
            <span class="texto">Reconectando...</span>
        `;
    });
    
    socket.on('connect_error', function(error) {
        console.error('Error de conexión:', error);
    });
    
    // Escuchar pagos QR
    socket.on('pago-qr-recibido', function(data) {
        procesarPagoQR(data);
    });
    
    // Escuchar mensajes del sindicato
    socket.on('mensaje-sindicato', function(data) {
        mostrarMensajeSindicato(data);
    });
    
    // Escuchar actualizaciones de ruta
    socket.on('actualizacion-ruta', function(data) {
        if(data.ruta === rutaActual) {
            actualizarAlertasRuta(data);
        }
    });
    
    // Escuchar confirmación de alerta
    socket.on('alerta-recibida', function(data) {
        Swal.fire({
            icon: 'info',
            title: 'Alerta recibida',
            text: `El sindicato ha recibido tu alerta: ${data.mensaje}`,
            timer: 3000
        });
    });
}

// ===== MOSTRAR MENSAJE DEL SINDICATO =====
function mostrarMensajeSindicato(data) {
    const { titulo, mensaje, tipo } = data;
    
    Swal.fire({
        icon: tipo || 'info',
        title: titulo || 'Mensaje del sindicato',
        text: mensaje,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 5000
    });
    
    // También mostrar en una notificación del sistema si es posible
    if(Notification.permission === 'granted') {
        new Notification(titulo || 'Mi Chofer ', {
            body: mensaje,
            icon: '/assets/img/logo.png'
        });
    }
}

// ===== ACTUALIZAR ALERTAS DE RUTA =====
function actualizarAlertasRuta(data) {
    const { tipo, descripcion, ubicacion } = data;
    
    // Mostrar alerta en el mapa
    if(ubicacion && mapa) {
        L.marker([ubicacion.lat, ubicacion.lng], {
            icon: L.divIcon({
                className: 'alerta-marcador',
                html: '<i class="fas fa-exclamation-triangle" style="color: #e63946; font-size: 24px;"></i>',
                iconSize: [30, 30]
            })
        }).addTo(mapa).bindPopup(`
            <b>⚠️ Alerta en ruta</b><br>
            ${descripcion}
        `);
    }
    
    // Mostrar notificación
    Swal.fire({
        icon: 'warning',
        title: `Alerta en ruta ${rutaActual}`,
        text: descripcion,
        timer: 4000
    });
}

// ===== ENVIAR UBICACIÓN (ya implementado en GPS) =====
// ===== ENVIAR ACTUALIZACIÓN DE PASAJEROS (ya implementado en contador) =====

// Exportar funciones
window.conectarWebSocket = conectarWebSocket;