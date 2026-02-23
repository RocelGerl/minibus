// Configuración del sistema
const API_URL = 'http://localhost:3000/api';
const SOCKET_URL = 'http://localhost:3000';

// Rutas predefinidas de 
const RUTAS = {
    '288': {
        nombre: 'Villa Salomé - Centro',
        paradas: [
            { nombre: 'Villa Salomé', lat: -16.5234, lng: -68.1423 },
            { nombre: 'Obrajes', lat: -16.5342, lng: -68.1245 },
            { nombre: 'San Pedro', lat: -16.5045, lng: -68.1456 },
            { nombre: 'Plaza San Francisco', lat: -16.4958, lng: -68.1356 }
        ]
    },
    '42': {
        nombre: 'Sopocachi - Caja Ferroviaria',
        paradas: [
            { nombre: 'Sopocachi', lat: -16.5145, lng: -68.1256 },
            { nombre: 'El Prado', lat: -16.5045, lng: -68.1345 },
            { nombre: 'Cementerio', lat: -16.4945, lng: -68.1456 }
        ]
    }
};

// Tarifas
const TARIFA_BASE = 2; // Bs
const TARIFA_ESTUDIANTE = 1; // Bs

// Colores para el sistema
const COLORES = {
    primary: '#0d6efd',
    success: '#198754',
    danger: '#dc3545',
    warning: '#ffc107'
};