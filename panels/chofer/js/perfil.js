// ===== EDITAR PERFIL =====
function editarPerfil() {
    Swal.fire({
        title: 'Editar perfil',
        html: `
            <div class="text-start">
                <div class="mb-3">
                    <label class="form-label">Nombre completo</label>
                    <input type="text" class="form-control" id="editNombre" value="Juan Carlos Pérez Mamani">
                </div>
                <div class="mb-3">
                    <label class="form-label">Teléfono</label>
                    <input type="tel" class="form-control" id="editTelefono" value="71234567">
                </div>
                <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" id="editEmail" value="juan.perez@email.com">
                </div>
                <div class="mb-3">
                    <label class="form-label">Dirección</label>
                    <input type="text" class="form-control" id="editDireccion" value="Av. Arce #123, ">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Guardar cambios',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#28a745',
        preConfirm: () => {
            const nombre = document.getElementById('editNombre').value;
            const telefono = document.getElementById('editTelefono').value;
            const email = document.getElementById('editEmail').value;
            const direccion = document.getElementById('editDireccion').value;
            
            // Aquí se enviaría al backend
            console.log('Datos actualizados:', { nombre, telefono, email, direccion });
            
            Swal.fire({
                icon: 'success',
                title: 'Perfil actualizado',
                text: 'Los cambios han sido guardados',
                timer: 1500
            });
        }
    });
}

// ===== CAMBIAR FOTO =====
function cambiarFoto() {
    // Crear input de archivo temporal
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if(file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('fotoPerfil').src = e.target.result;
                
                Swal.fire({
                    icon: 'success',
                    title: 'Foto actualizada',
                    text: 'Tu foto de perfil ha sido cambiada',
                    timer: 1500
                });
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
}

// Exportar funciones
window.editarPerfil = editarPerfil;
window.cambiarFoto = cambiarFoto;