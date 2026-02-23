// Animaciones globales para todo el sistema

// Efecto de partículas para fondos
function initParticles() {
    particlesJS('particles-js', {
        particles: {
            number: {
                value: 50,
                density: {
                    enable: true,
                    value_area: 800
                }
            },
            color: {
                value: '#ffffff'
            },
            shape: {
                type: 'circle'
            },
            opacity: {
                value: 0.3,
                random: true
            },
            size: {
                value: 3,
                random: true
            },
            line_linked: {
                enable: true,
                distance: 150,
                color: '#ffffff',
                opacity: 0.2,
                width: 1
            },
            move: {
                enable: true,
                speed: 2,
                direction: 'none',
                random: true,
                straight: false,
                out_mode: 'out'
            }
        },
        interactivity: {
            detect_on: 'canvas',
            events: {
                onhover: {
                    enable: true,
                    mode: 'grab'
                }
            }
        }
    });
}

// Efecto de confeti para logros
function showConfetti() {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff9e00', '#ff4d4d', '#667eea', '#4cc9f0']
    });
}

// Notificaciones toast personalizadas
function showNotification(message, type = 'success') {
    const colors = {
        success: 'linear-gradient(135deg, #4cc9f0 0%, #4361ee 100%)',
        warning: 'linear-gradient(135deg, #ff9e00 0%, #ff4d4d 100%)',
        error: 'linear-gradient(135deg, #e63946 0%, #c1121f 100%)',
        info: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    };
    
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "right",
        style: {
            background: colors[type],
            borderRadius: "10px",
            padding: "15px 20px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
        },
        onClick: function(){}
    }).showToast();
}

// Efecto ripple para botones
document.addEventListener('click', function(e) {
    const button = e.target.closest('button');
    if(button) {
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        button.appendChild(ripple);
        
        const x = e.clientX - button.offsetLeft;
        const y = e.clientY - button.offsetTop;
        
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
});

// Efecto de escritura automática
function typeWriter(element, text, speed = 50) {
    let i = 0;
    element.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Contador animado
function animateNumber(element, start, end, duration = 1000) {
    let startTimestamp = null;
    
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.innerHTML = value.toLocaleString();
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    
    window.requestAnimationFrame(step);
}