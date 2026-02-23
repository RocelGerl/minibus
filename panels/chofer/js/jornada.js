// ===== INICIAR JORNADA =====
function iniciarJornada() {
    const rutaSelect = document.getElementById('selectRuta');
    rutaActual = rutaSelect.value;
    const nombreRuta = rutaSelect.options[rutaSelect.selectedIndex].text;
    
    Swal.fire({
        title: '¿Iniciar jornada?',
        text: `Ruta seleccionada: ${nombreRuta}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, iniciar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if(result.isConfirmed) {
            jornadaActiva = true;
            inicioJornadaTime = new Date();
            
            // Ocultar inicio, mostrar panel
            document.getElementById('inicioJornada').style.display = 'none';
            document.getElementById('panelPrincipal').style.display = 'block';
            
            // Mostrar ruta activa
            document.getElementById('rutaActiva').textContent = nombreRuta;
            
            // Inicializar sistemas
            iniciarMapa();
            iniciarGPS();
            conectarWebSocket();
            generarQR();
            
            // Guardar estado
            guardarEstadoJornada();
            
            // Notificación
            Swal.fire({
                icon: 'success',
                title: '¡Jornada iniciada!',
                text: 'Buena ruta compañero',
                timer: 2000,
                showConfirmButton: false
            });
            
            // Enviar al servidor
            enviarInicioJornada();
        }
    });
}

// ===== FINALIZAR JORNADA =====
function finalizarJornada() {
    Swal.fire({
        title: '¿Finalizar jornada?',
        html: `
            <div class="text-start">
                <p><strong>Resumen del día:</strong></p>
                <p>👥 Pasajeros: ${totalPasajeros}</p>
                <p>💰 Efectivo: Bs ${totalEfectivo}</p>
                <p>📊 Gastos: Bs ${totalGastos}</p>
                <p>🔄 Vueltas: ${vueltasCompletadas}</p>
                <p>📏 KM recorridos: ${kmRecorridos.toFixed(1)} km</p>
            </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, finalizar',
        cancelButtonText: 'Seguir trabajando'
    }).then((result) => {
        if(result.isConfirmed) {
            // Detener GPS
            if(rastreadorGPS) {
                navigator.geolocation.clearWatch(rastreadorGPS);
            }
            
            // Desconectar socket
            if(socket) {
                socket.disconnect();
            }
            
            // Guardar historial
            guardarHistorialJornada();
            
            // Limpiar estado
            localStorage.removeItem('jornadaActiva');
            
            Swal.fire({
                icon: 'success',
                title: '¡Jornada finalizada!',
                text: 'Gracias por tu trabajo',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                window.location.reload();
            });
        }
    });
}

// ===== MARCAR VUELTA COMPLETADA =====
function marcarVuelta() {
    vueltasCompletadas++;
    
    // Calcular promedio
    const promedio = (totalPasajeros / vueltasCompletadas).toFixed(1);
    document.getElementById('vueltasRealizadas').textContent = vueltasCompletadas;
    document.getElementById('promedioPasajeros').textContent = promedio;
    
    // Notificación
    showNotification('¡Vuelta completada!', 'success');
    
    // Actualizar estadísticas
    actualizarEstadisticas();
}

// ===== CAMBIAR RUTA =====
function cambiarRuta() {
    Swal.fire({
        title: 'Cambiar de ruta',
        input: 'select',
        inputOptions: {
            '288': 'Ruta 288 - Villa Salomé → Centro',
            '42': 'Ruta 42 - Sopocachi → Caja Ferroviaria',
            '15': 'Ruta 15 - San Pedro → Obrajes',
            '7': 'Ruta 7 - Miraflores → El Alto',
            '21': 'Ruta 21 - Calacoto → Centro'
        },
        inputPlaceholder: 'Selecciona nueva ruta',
        showCancelButton: true,
        confirmButtonText: 'Cambiar',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
            if(!value) {
                return 'Debes seleccionar una ruta';
            }
        }
    }).then((result) => {
        if(result.isConfirmed) {
            rutaActual = result.value;
            const nombreRuta = result.value === '288' ? 'Villa Salomé → Centro' :
                              result.value === '42' ? 'Sopocachi → Caja Ferroviaria' :
                              result.value === '15' ? 'San Pedro → Obrajes' :
                              result.value === '7' ? 'Miraflores → El Alto' :
                              'Calacoto → Centro';
            
            document.getElementById('rutaActiva').textContent = `Ruta ${rutaActual} - ${nombreRuta}`;
            
            // Regenerar QR con nueva ruta
            regenerarQR();
            
            Swal.fire({
                icon: 'success',
                title: 'Ruta cambiada',
                text: `Ahora estás en ruta ${rutaActual}`,
                timer: 1500
            });
        }
    });
}

// ===== REPORTAR PROBLEMA =====
function reportarProblema() {
    const modal = new bootstrap.Modal(document.getElementById('modalProblema'));
    modal.show();
}

function enviarReporteProblema() {
    const tipo = document.getElementById('tipoProblema').value;
    const descripcion = document.getElementById('descripcionProblema').value;
    
    if(!tipo || !descripcion) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Completa todos los campos'
        });
        return;
    }
    
    // Cerrar modal
    bootstrap.Modal.getInstance(document.getElementById('modalProblema')).hide();
    
    // Enviar reporte
    if(socket) {
        socket.emit('reporte-problema', {
            tipo,
            descripcion,
            ubicacion: marcadorChofer ? marcadorChofer.getLatLng() : null,
            timestamp: new Date()
        });
    }
    
    Swal.fire({
        icon: 'success',
        title: 'Reporte enviado',
        text: 'El sindicato recibirá tu reporte',
        timer: 2000
    });
    
    // Limpiar formulario
    document.getElementById('formProblema').reset();
}

// ===== BOTÓN DE PÁNICO =====
function activarPanico() {
    Swal.fire({
        title: '¿ACTIVAR ALERTA DE EMERGENCIA?',
        text: 'Esto notificará al sindicato y a servicios de emergencia',
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'SÍ, ACTIVAR',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if(result.isConfirmed) {
            // Enviar alerta
            if(socket) {
                socket.emit('alerta-emergencia', {
                    tipo: 'boton_panico',
                    ubicacion: marcadorChofer ? marcadorChofer.getLatLng() : null,
                    timestamp: new Date()
                });
            }
            
            // Vibración
            if(navigator.vibrate) {
                navigator.vibrate([500, 200, 500]);
            }
            
            Swal.fire({
                icon: 'success',
                title: 'ALERTA ENVIADA',
                text: 'Espera ayuda, ya se notificó a emergencias',
                confirmButtonColor: '#28a745'
            });
            
            // Llamar a emergencias
            window.location.href = 'tel:911';
        }
    });
}

// ===== FUNCIONES AUXILIARES =====
function guardarEstadoJornada() {
    const estado = {
        activa: true,
        inicio: inicioJornadaTime,
        ruta: rutaActual,
        pasajeros: totalPasajeros,
        efectivo: totalEfectivo,
        gastos: totalGastos,
        vueltas: vueltasCompletadas,
        km: kmRecorridos
    };
    
    localStorage.setItem('jornadaActiva', JSON.stringify(estado));
}

function restaurarJornada(datos) {
    jornadaActiva = true;
    inicioJornadaTime = new Date(datos.inicio);
    rutaActual = datos.ruta;
    totalPasajeros = datos.pasajeros || 0;
    totalEfectivo = datos.efectivo || 0;
    totalGastos = datos.gastos || 0;
    vueltasCompletadas = datos.vueltas || 0;
    kmRecorridos = datos.km || 0;
    
    // Actualizar UI
    document.getElementById('inicioJornada').style.display = 'none';
    document.getElementById('panelPrincipal').style.display = 'block';
    document.getElementById('rutaActiva').textContent = `Ruta ${rutaActual}`;
    document.getElementById('contadorPasajeros').textContent = totalPasajeros;
    document.getElementById('efectivo').textContent = `Bs ${totalEfectivo}`;
    document.getElementById('vueltasRealizadas').textContent = vueltasCompletadas;
    
    // Iniciar sistemas
    iniciarMapa();
    iniciarGPS();
    conectarWebSocket();
    generarQR();
}

function guardarHistorialJornada() {
    const historial = JSON.parse(localStorage.getItem('historialJornadas') || '[]');
    
    historial.push({
        fecha: new Date().toISOString(),
        inicio: inicioJornadaTime,
        fin: new Date(),
        ruta: rutaActual,
        pasajeros: totalPasajeros,
        efectivo: totalEfectivo,
        gastos: totalGastos,
        vueltas: vueltasCompletadas,
        km: kmRecorridos,
        movimientos: movimientos
    });
    
    localStorage.setItem('historialJornadas', JSON.stringify(historial));
}

function showNotification(message, type = 'info') {
    Swal.fire({
        icon: type,
        title: message,
        showConfirmButton: false,
        timer: 1500,
        toast: true,
        position: 'top-end'
    });
}

function enviarInicioJornada() {
    // Enviar al backend
    fetch(`${API_URL}/jornada/iniciar`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
            ruta: rutaActual,
            inicio: inicioJornadaTime,
            minibus: 'CH-2880'
        })
    }).catch(error => console.error('Error:', error));
}

// Exportar funciones
window.iniciarJornada = iniciarJornada;
window.finalizarJornada = finalizarJornada;
window.marcarVuelta = marcarVuelta;
window.cambiarRuta = cambiarRuta;
window.reportarProblema = reportarProblema;
window.enviarReporteProblema = enviarReporteProblema;
window.activarPanico = activarPanico;