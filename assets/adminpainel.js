const DB = {
    get(key, fallback) { try { const data = localStorage.getItem('assga_'+key); return data ? JSON.parse(data) : fallback; } catch { return fallback; } },
    set(key, value) { localStorage.setItem('assga_'+key, JSON.stringify(value)); },
    getEventos() { return this.get('eventos', []); },
    setEventos(e) { this.set('eventos', e); },
    getAdmins() { return this.get('admins', []); },
    setAdmins(a) { this.set('admins', a); },
    getSession() { return this.get('session', null); },
    setSession(s) { this.set('session', s); },
    clearSession() { localStorage.removeItem('assga_session'); }
};

(function initDefaultAdmin() {
    const admins = DB.getAdmins();
    if (admins.length === 0) {
        DB.setAdmins([{ id:1, nome:'Administrador', email:'admin@assga.com', usuario:'admin', senha:'123456' }]);
    }
})();

function checkAuth() {
    if (!DB.getSession()) { window.location.href = 'admin-login.html'; return false; }
    return true;
}

function renderDashboard() {
    const eventos = DB.getEventos();
    document.getElementById('totalEventos').textContent = eventos.length;
    document.getElementById('totalPublicados').textContent = eventos.filter(e => e.status === 'publicado').length;
    document.getElementById('totalRascunhos').textContent = eventos.filter(e => e.status === 'rascunho').length;
    document.getElementById('totalAdmins').textContent = DB.getAdmins().length;
    const sorted = [...eventos].sort((a,b) => new Date(b.data) - new Date(a.data));
    const recentes = sorted.slice(0,5);
    const tbody = document.getElementById('ultimosEventos');
    if (recentes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#94a3b8;">Nenhum evento</td></tr>`;
    } else {
        tbody.innerHTML = recentes.map(e => `
            <tr><td><strong>${e.titulo}</strong></td><td>${formatDate(e.data)}</td><td><span class="badge ${e.status}">${traduzStatus(e.status)}</span></td></tr>
        `).join('');
    }
}

function renderEventos() {
    const lista = DB.getEventos();
    const tbody = document.getElementById('tabelaEventos');
    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#94a3b8;">Nenhum evento</td></tr>`;
        return;
    }
    tbody.innerHTML = lista.map(e => `
        <tr>
            <td><strong>${e.titulo}</strong></td>
            <td>${formatDate(e.data)}</td>
            <td><span class="badge ${e.status}">${traduzStatus(e.status)}</span></td>
            <td>
                <div class="table-actions">
                    <button class="edit-btn" data-id="${e.id}"><i class="fas fa-edit"></i></button>
                    <button class="publish-btn" data-id="${e.id}"><i class="fas fa-sync-alt"></i></button>
                    <button class="delete-btn" data-id="${e.id}"><i class="fas fa-trash-alt"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
    tbody.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => editarEvento(Number(btn.dataset.id))));
    tbody.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', () => {
        if (confirm('Excluir este evento?')) {
            deleteEvento(Number(btn.dataset.id));
            renderUI();
            showToast('Evento excluído!');
        }
    }));
    tbody.querySelectorAll('.publish-btn').forEach(btn => btn.addEventListener('click', () => alternarStatus(Number(btn.dataset.id))));
}

function renderPublish() {
    const eventos = DB.getEventos().filter(e => e.status === 'publicado');
    const container = document.getElementById('publishContainer');
    if (eventos.length === 0) {
        container.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#94a3b8;padding:40px 0;"><i class="fas fa-inbox" style="font-size:2rem;display:block;margin-bottom:10px;"></i> Nenhum evento publicado.</div>`;
        return;
    }
    container.innerHTML = eventos.map(e => `
        <div class="publish-card">
            <div class="titulo">${e.titulo}</div>
            <div class="meta"><span><i class="fas fa-calendar-alt"></i> ${formatDate(e.data)}</span><span><i class="fas fa-tag"></i> ${traduzStatus(e.status)}</span></div>
            <div class="desc">${e.descricao || 'Sem descrição'}</div>
            <span class="badge publicado">Publicado</span>
        </div>
    `).join('');
}

function renderAdmins() {
    const admins = DB.getAdmins();
    const container = document.getElementById('adminList');
    if (admins.length === 0) {
        container.innerHTML = `<p style="color:#94a3b8;">Nenhum administrador.</p>`;
        return;
    }
    container.innerHTML = admins.map(a => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #e2e8f0;">
            <div><strong>${a.nome}</strong> (${a.usuario}) <span style="color:#94a3b8;font-size:0.8rem;margin-left:8px;">${a.email}</span></div>
            <div>${a.id === 1 ? '<span style="font-size:0.7rem;background:#e2e8f0;padding:2px 10px;border-radius:30px;">Padrão</span>' : ''}</div>
        </div>
    `).join('');
}

function getEventos() { return DB.getEventos(); }
function saveEventos(lista) { DB.setEventos(lista); }
function addEvento(evento) { const lista = getEventos(); evento.id = Date.now(); lista.push(evento); saveEventos(lista); }
function deleteEvento(id) { let lista = getEventos(); lista = lista.filter(e => e.id !== id); saveEventos(lista); }
function updateEvento(id, novosDados) {
    let lista = getEventos();
    const idx = lista.findIndex(e => e.id === id);
    if (idx !== -1) { lista[idx] = { ...lista[idx], ...novosDados }; saveEventos(lista); return true; }
    return false;
}
function alternarStatus(id) {
    const lista = getEventos();
    const evento = lista.find(e => e.id === id);
    if (!evento) return;
    const mapa = { 'rascunho':'publicado', 'publicado':'arquivado', 'arquivado':'rascunho' };
    const novo = mapa[evento.status] || 'rascunho';
    updateEvento(id, { status: novo });
    renderUI();
    showToast(`Status alterado para "${traduzStatus(novo)}"`);
}
function editarEvento(id) {
    const evento = DB.getEventos().find(e => e.id === id);
    if (!evento) return;
    document.getElementById('eventoTitulo').value = evento.titulo;
    document.getElementById('eventoData').value = evento.data;
    document.getElementById('eventoDescricao').value = evento.descricao;
    document.getElementById('eventoStatus').value = evento.status;
    document.getElementById('eventoForm')._editId = id;
    document.getElementById('eventoForm').querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-edit"></i> Atualizar';
    document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
}
function traduzStatus(s) {
    const map = { 'publicado':'Publicado', 'rascunho':'Rascunho', 'arquivado':'Arquivado' };
    return map[s] || s;
}
function formatDate(d) {
    if (!d) return '';
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return d;
}
function renderUI() {
    renderDashboard();
    renderEventos();
    renderPublish();
    renderAdmins();
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('management.html') && !checkAuth()) return;
    const session = DB.getSession();
    if (session) {
        const display = document.getElementById('userNameDisplay');
        if (display) display.textContent = session.nome || 'Administrador';
    }
    const eventoForm = document.getElementById('eventoForm');
    if (eventoForm) {
        eventoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const titulo = document.getElementById('eventoTitulo').value.trim();
            const data = document.getElementById('eventoData').value;
            const descricao = document.getElementById('eventoDescricao').value.trim();
            const status = document.getElementById('eventoStatus').value;
            if (!titulo || !data || !descricao) {
                showToast('Preencha todos os campos!', 'error');
                return;
            }
            const editId = eventoForm._editId;
            if (editId) {
                const ok = updateEvento(editId, { titulo, data, descricao, status });
                if (ok) showToast('Evento atualizado!');
                else showToast('Erro ao atualizar.', 'error');
                delete eventoForm._editId;
                eventoForm.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Salvar';
            } else {
                addEvento({ titulo, data, descricao, status });
                showToast('Evento cadastrado!');
            }
            eventoForm.reset();
            renderUI();
        });
        eventoForm.addEventListener('reset', () => {
            delete eventoForm._editId;
            eventoForm.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> Salvar';
        });
    }
    const adminRegisterForm = document.getElementById('adminRegisterForm');
    if (adminRegisterForm) {
        adminRegisterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nome = document.getElementById('adminNome').value.trim();
            const email = document.getElementById('adminEmail').value.trim();
            const usuario = document.getElementById('adminUser').value.trim();
            const senha = document.getElementById('adminPass').value.trim();
            if (!nome || !email || !usuario || !senha || senha.length < 6) {
                showToast('Preencha todos os campos (senha ≥ 6 caracteres).', 'error');
                return;
            }
            const admins = DB.getAdmins();
            if (admins.some(a => a.usuario === usuario)) {
                showToast('Usuário já existe!', 'error');
                return;
            }
            admins.push({ id: Date.now(), nome, email, usuario, senha });
            DB.setAdmins(admins);
            adminRegisterForm.reset();
            renderUI();
            showToast('Administrador cadastrado!');
        });
    }
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            DB.clearSession();
            window.location.href = 'admin-login.html';
        });
    }
    renderUI();
    const dataInput = document.getElementById('eventoData');
    if (dataInput && !dataInput.value) {
        dataInput.value = new Date().toISOString().split('T')[0];
    }
});