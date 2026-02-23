// ===== SUBIR PASAJERO =====
function subirPasajero() {
    if(totalPasajeros >= CAPACIDAD_MAXIMA) {
        Swal.fire({
            icon: 'warning',
            title: 'Minibus lleno',
            text: 'No puedes subir más pasajeros',
            timer: 1500
        });
        
        // Vibración de advertencia
        if(navigator.vibrate) {
            navigator.vibrate(200);
        }
        
        return;
    }
    
    totalPasajeros++;
    totalEfectivo += TARIFA_PASAJE;
    
    // Registrar movimiento
    const movimiento = {
        tipo: 'sube',
        hora: new Date().toLocaleTimeString(),
        pasajeros: totalPasajeros
    };
    
    movimientos.unshift(movimiento);
    if(movimientos.length > 5) movimientos.pop();
    
    // Actualizar UI
    actualizarContadoresUI();
    actualizarListaMovimientos();
    
    // Guardar estado
    guardarEstadoJornada();
    
    // Enviar a WebSocket
    if(socket) {
        socket.emit('pasajero-subio', {
            total: totalPasajeros,
            efectivo: totalEfectivo
        });
    }
    
    // Feedback háptico
    if(navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    // Actualizar total del día
    document.getElementById('totalPasajerosDia').textContent = totalPasajeros;
}

// ===== BAJAR PASAJERO =====
function bajarPasajero() {
    if(totalPasajeros <= 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Sin pasajeros',
            text: 'No hay pasajeros para bajar',
            timer: 1500
        });
        return;
    }
    
    totalPasajeros--;
    
    // Registrar movimiento
    const movimiento = {
        tipo: 'baja',
        hora: new Date().toLocaleTimeString(),
        pasajeros: totalPasajeros
    };
    
    movimientos.unshift(movimiento);
    if(movimientos.length > 5) movimientos.pop();
    
    // Actualizar UI
    actualizarContadoresUI();
    actualizarListaMovimientos();
    
    // Guardar estado
    guardarEstadoJornada();
    
    // Enviar a WebSocket
    if(socket) {
        socket.emit('pasajero-bajo', {
            total: totalPasajeros
        });
    }
    
    // Feedback háptico
    if(navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// ===== ACTUALIZAR UI =====
function actualizarContadoresUI() {
    document.getElementById('contadorPasajeros').textContent = totalPasajeros;
    document.getElementById('efectivo').textContent = `Bs ${totalEfectivo}`;
    document.getElementById('totalPasajes').textContent = `Bs ${totalPasajeros * TARIFA_PASAJE}`;
    document.getElementById('netoEfectivo').textContent = `Bs ${totalEfectivo - totalGastos}`;
    
    // Cambiar color si está cerca del límite
    const contadorElement = document.getElementById('contadorPasajeros');
    if(totalPasajeros >= CAPACIDAD_MAXIMA) {
        contadorElement.style.color = '#e63946';
        contadorElement.style.animation = 'pulse 1s infinite';
    } else if(totalPasajeros >= CAPACIDAD_MAXIMA - 3) {
        contadorElement.style.color = '#ff9e00';
        contadorElement.style.animation = 'none';
    } else {
        contadorElement.style.color = 'white';
        contadorElement.style.animation = 'none';
    }
}

function actualizarListaMovimientos() {
    const lista = document.getElementById('listaMovimientos');
    
    if(movimientos.length === 0) {
        lista.innerHTML = '<p class="text-muted">Sin movimientos recientes</p>';
        return;
    }
    
    lista.innerHTML = movimientos.map(m => `
        <div class="movimiento-item">
            <span>
                <i class="fas fa-arrow-${m.tipo === 'sube' ? 'up text-success' : 'down text-danger'}"></i>
                ${m.hora}
            </span>
            <span>${m.pasajeros} pasajeros</span>
        </div>
    `).join('');
}

// Exportar funciones
window.subirPasajero = subirPasajero;
window.bajarPasajero = bajarPasajero;