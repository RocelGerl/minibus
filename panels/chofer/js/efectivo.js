// ===== AGREGAR INGRESO =====
function agregarEfectivo() {
    Swal.fire({
        title: 'Registrar ingreso',
        html: `
            <input type="number" id="montoIngreso" class="swal2-input" placeholder="Monto en Bs" step="0.5" min="0">
            <select id="conceptoIngreso" class="swal2-select" style="width: 100%; margin-top: 10px;">
                <option value="pasajes">Pasajes</option>
                <option value="vuelta_completa">Vuelta completa</option>
                <option value="otro">Otro ingreso</option>
            </select>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Registrar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const monto = parseFloat(document.getElementById('montoIngreso').value);
            const concepto = document.getElementById('conceptoIngreso').value;
            
            if(!monto || monto <= 0) {
                Swal.showValidationMessage('Ingresa un monto válido');
                return false;
            }
            
            return { monto, concepto };
        }
    }).then((result) => {
        if(result.isConfirmed) {
            const { monto, concepto } = result.value;
            
            totalEfectivo += monto;
            
            // Registrar transacción
            registrarTransaccion('ingreso', monto, concepto);
            
            // Actualizar UI
            actualizarContadoresUI();
            
            Swal.fire({
                icon: 'success',
                title: 'Ingreso registrado',
                text: `+Bs ${monto}`,
                timer: 1500
            });
        }
    });
}

// ===== REGISTRAR GASTO =====
function gastarEfectivo() {
    const modal = new bootstrap.Modal(document.getElementById('modalGasto'));
    modal.show();
}

function guardarGasto() {
    const monto = parseFloat(document.getElementById('montoGasto').value);
    const concepto = document.getElementById('conceptoGasto').value;
    const descripcion = document.getElementById('descripcionGasto').value;
    
    if(!monto || monto <= 0 || !concepto) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Completa todos los campos requeridos'
        });
        return;
    }
    
    if(monto > totalEfectivo) {
        Swal.fire({
            icon: 'error',
            title: 'Saldo insuficiente',
            text: `Solo tienes Bs ${totalEfectivo} disponible`
        });
        return;
    }
    
    totalEfectivo -= monto;
    totalGastos += monto;
    
    // Registrar transacción
    registrarTransaccion('gasto', monto, concepto, descripcion);
    
    // Cerrar modal
    bootstrap.Modal.getInstance(document.getElementById('modalGasto')).hide();
    
    // Actualizar UI
    actualizarContadoresUI();
    document.getElementById('totalGastos').textContent = `Bs ${totalGastos}`;
    
    // Limpiar formulario
    document.getElementById('formGasto').reset();
    
    Swal.fire({
        icon: 'success',
        title: 'Gasto registrado',
        text: `-Bs ${monto}`,
        timer: 1500
    });
}

// ===== REGISTRAR TRANSACCIÓN =====
function registrarTransaccion(tipo, monto, concepto, descripcion = '') {
    const transaccion = {
        tipo,
        monto,
        concepto,
        descripcion,
        fecha: new Date().toISOString(),
        saldoResultante: totalEfectivo
    };
    
    // Guardar en movimientos
    movimientos.unshift({
        tipo: tipo === 'ingreso' ? '💰 Ingreso' : '💸 Gasto',
        hora: new Date().toLocaleTimeString(),
        detalle: `${tipo === 'ingreso' ? '+' : '-'}Bs ${monto} (${concepto})`
    });
    
    if(movimientos.length > 5) movimientos.pop();
    actualizarListaMovimientos();
    
    // Aquí se enviaría al backend
    console.log('Transacción:', transaccion);
    
    // Guardar en localStorage
    const transacciones = JSON.parse(localStorage.getItem('transacciones') || '[]');
    transacciones.push(transaccion);
    localStorage.setItem('transacciones', JSON.stringify(transacciones));
}

// ===== PAGO QR RECIBIDO =====
function pagoQRRecibido(monto, pasajero) {
    totalEfectivo += monto;
    
    // Registrar pago QR
    const pago = {
        monto,
        pasajero,
        hora: new Date().toLocaleTimeString()
    };
    
    pagosQR.unshift(pago);
    if(pagosQR.length > 5) pagosQR.pop();
    
    // Actualizar UI
    actualizarContadoresUI();
    actualizarListaPagosQR();
    
    // Notificación
    showNotification(`Pago QR recibido: Bs ${monto}`, 'success');
    
    // Feedback háptico
    if(navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
    }
}

function actualizarListaPagosQR() {
    const lista = document.getElementById('listaPagosQR');
    
    if(pagosQR.length === 0) {
        lista.innerHTML = '<p class="text-muted">Esperando pagos...</p>';
        return;
    }
    
    lista.innerHTML = pagosQR.map(p => `
        <div class="pago-item">
            <span>
                <i class="fas fa-user-circle me-1"></i>
                ${p.pasajero || 'Pasajero'}
            </span>
            <span class="pago-monto">+Bs ${p.monto}</span>
            <span class="pago-hora">${p.hora}</span>
        </div>
    `).join('');
}

// Exportar funciones
window.agregarEfectivo = agregarEfectivo;
window.gastarEfectivo = gastarEfectivo;
window.guardarGasto = guardarGasto;