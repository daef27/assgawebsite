document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('menuToggle');
    const nav = document.getElementById('navMenu');
    if (toggle && nav) {
        toggle.addEventListener('click', () => nav.classList.toggle('open'));
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => nav.classList.remove('open'));
        });
    }
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-menu a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
});

function showToast(msg, type = 'success') {
    let toast = document.getElementById('globalToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'globalToast';
        toast.className = 'toast';
        toast.innerHTML = `<i class="fas fa-check-circle"></i><span id="toastMsg">${msg}</span>`;
        document.body.appendChild(toast);
    } else {
        toast.querySelector('#toastMsg').textContent = msg;
    }
    toast.className = 'toast ' + type;
    toast.querySelector('i').className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 3500);
}