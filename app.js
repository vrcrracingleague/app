// =============================================
// APP.JS - LOGICA PRINCIPALE
// =============================================

let allEvents = [];
let filteredEvents = [];
let autoRefreshTimer = null;

// =============================================
// INIZIALIZZAZIONE
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    initEventListeners();
    loadEvents();
    
    // Auto-refresh se configurato
    if (CONFIG.autoRefreshInterval > 0) {
        autoRefreshTimer = setInterval(loadEvents, CONFIG.autoRefreshInterval);
    }
});

// =============================================
// EVENT LISTENERS
// =============================================

function initEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');
    const refreshBtn = document.getElementById('refreshBtn');
    const closeErrorBtn = document.getElementById('closeErrorBtn');

    if (searchInput) searchInput.addEventListener('input', filterAndDisplayEvents);
    if (filterSelect) filterSelect.addEventListener('change', filterAndDisplayEvents);
    if (refreshBtn) refreshBtn.addEventListener('click', loadEvents);
    if (closeErrorBtn) closeErrorBtn.addEventListener('click', hideError);

    // Enter per ricerca
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                filterAndDisplayEvents();
            }
        });
    }
}

// =============================================
// CARICAMENTO DATI
// =============================================

async function loadEvents() {
    try {
        showLoading();
        const response = await fetch(getGoogleSheetsUrl());
        
        if (!response.ok) {
            throw new Error(`Errore: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.values || data.values.length < 2) {
            showError('Nessun dato trovato nel foglio Google Sheet');
            displayEmpty();
            return;
        }

        // Parsifica i dati
        allEvents = parseSheetData(data.values);
        
        // Ordina eventi
        allEvents.sort((a, b) => {
            let compareValue = 0;
            
            switch (CONFIG.sortBy) {
                case 'data':
                    compareValue = new Date(a.dataObj) - new Date(b.dataObj);
                    break;
                case 'nome':
                    compareValue = a.nome.localeCompare(b.nome);
                    break;
                case 'stato':
                    compareValue = a.stato.localeCompare(b.stato);
                    break;
            }
            
            return CONFIG.sortOrder === 'asc' ? compareValue : -compareValue;
        });

        // Filtra e visualizza
        filterAndDisplayEvents();
        updateLastUpdate();
        hideError();

    } catch (error) {
        console.error('Errore caricamento:', error);
        showError(`Errore nel caricamento: ${error.message}`);
        displayEmpty();
    }
}

// =============================================
// PARSING DATI
// =============================================

function parseSheetData(rows) {
    const headers = rows[0].map(h => h.trim());
    const events = [];

    // Trova indici colonne
    const nameIndex = headers.findIndex(h => h === COLUMN_CONFIG.nome);
    const dataIndex = headers.findIndex(h => h === COLUMN_CONFIG.data);
    const oraIndex = headers.findIndex(h => h === COLUMN_CONFIG.ora);
    const luogoIndex = headers.findIndex(h => h === COLUMN_CONFIG.luogo);
    const descrizioneIndex = headers.findIndex(h => h === COLUMN_CONFIG.descrizione);
    const statoIndex = headers.findIndex(h => h === COLUMN_CONFIG.stato);
    const partecipantiIndex = headers.findIndex(h => h === COLUMN_CONFIG.partecipanti);
    const linkIndex = headers.findIndex(h => h === COLUMN_CONFIG.link);

    // Processa righe dati
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        // Salta righe vuote
        if (!row || row.length === 0 || !row[nameIndex]) continue;

        const event = {
            nome: row[nameIndex]?.trim() || 'N/A',
            data: row[dataIndex]?.trim() || 'N/A',
            dataObj: parseDate(row[dataIndex]?.trim()),
            ora: row[oraIndex]?.trim() || 'N/A',
            luogo: row[luogoIndex]?.trim() || 'N/A',
            descrizione: row[descrizioneIndex]?.trim() || '',
            stato: row[statoIndex]?.trim() || 'Programmato',
            partecipanti: row[partecipantiIndex]?.trim() || '',
            link: row[linkIndex]?.trim() || ''
        };

        events.push(event);
    }

    return events;
}

// =============================================
// PARSING DATA
// =============================================

function parseDate(dateStr) {
    if (!dateStr) return new Date();
    
    // Prova formato YYYY-MM-DD
    if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return new Date(dateStr);
        }
    }
    
    // Prova formato DD/MM/YYYY
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            return new Date(parts[2], parts[1] - 1, parts[0]);
        }
    }
    
    return new Date();
}

// =============================================
// FORMATTAZIONE DATA
// =============================================

function formatDate(dateStr) {
    const date = parseDate(dateStr);
    
    if (CONFIG.dateFormat === 'dd/mm/yyyy') {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } else {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

// =============================================
// FILTRI E VISUALIZZAZIONE
// =============================================

function filterAndDisplayEvents() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const filterSelect = document.getElementById('filterSelect').value;

    filteredEvents = allEvents.filter(event => {
        // Filtro ricerca
        const matchesSearch = !searchInput || 
            event.nome.toLowerCase().includes(searchInput) ||
            event.luogo.toLowerCase().includes(searchInput) ||
            event.descrizione.toLowerCase().includes(searchInput);

        // Filtro stato
        const matchesFilter = filterSelect === 'all' || event.stato === filterSelect;

        return matchesSearch && matchesFilter;
    });

    displayEvents(filteredEvents);
    updateStatistics();
}

// =============================================
// VISUALIZZAZIONE EVENTI
// =============================================

function displayEvents(events) {
    const container = document.getElementById('eventsContainer');
    
    if (events.length === 0) {
        displayEmpty();
        return;
    }

    container.innerHTML = events.map(event => createEventCard(event)).join('');
}

function createEventCard(event) {
    const statusConfig = STATUS_CONFIG[event.stato] || STATUS_CONFIG['Programmato'];
    const dataFormattata = formatDate(event.data);

    const linkHtml = event.link 
        ? `<a href="${event.link}" target="_blank" class="event-link">🔗 Dettagli</a>` 
        : '';

    return `
        <div class="event-card">
            <div class="event-header">
                <h2 class="event-title">${escapeHtml(event.nome)}</h2>
                <span class="event-status" style="background-color: ${statusConfig.color}20; border: 2px solid ${statusConfig.color}; color: white;">
                    ${statusConfig.icon} ${statusConfig.label}
                </span>
            </div>
            <div class="event-body">
                <div class="event-detail">
                    <strong>📅 Data:</strong> ${dataFormattata}
                </div>
                <div class="event-detail">
                    <strong>⏰ Ora:</strong> ${escapeHtml(event.ora)}
                </div>
                <div class="event-detail">
                    <strong>📍 Luogo:</strong> ${escapeHtml(event.luogo)}
                </div>
                ${event.descrizione ? `
                <div class="event-detail">
                    <strong>📝 Descrizione:</strong> ${escapeHtml(event.descrizione)}
                </div>
                ` : ''}
                ${event.partecipanti ? `
                <div class="event-detail">
                    <strong>👥 Partecipanti:</strong> ${escapeHtml(event.partecipanti)}
                </div>
                ` : ''}
            </div>
            <div class="event-footer">
                ${linkHtml}
            </div>
        </div>
    `;
}

// =============================================
// STATISTICHE
// =============================================

function updateStatistics() {
    if (!CONFIG.showStats) return;

    const total = allEvents.length;
    const programmato = allEvents.filter(e => e.stato === 'Programmato').length;
    const inCourso = allEvents.filter(e => e.stato === 'In corso').length;
    const completato = allEvents.filter(e => e.stato === 'Completato').length;
    const annullato = allEvents.filter(e => e.stato === 'Annullato').length;

    document.getElementById('totalStat').textContent = total;
    document.getElementById('programmadoStat').textContent = programmato;
    document.getElementById('inProgressStat').textContent = inCourso;
    document.getElementById('completedStat').textContent = completato;
    document.getElementById('cancelledStat').textContent = annullato;
}

// =============================================
// ULTIMO AGGIORNAMENTO
// =============================================

function updateLastUpdate() {
    if (!CONFIG.showLastUpdate) return;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    document.getElementById('lastUpdate').textContent = 
        `Ultimo aggiornamento: ${hours}:${minutes}:${seconds}`;
}

// =============================================
// STATI VUOTI/ERRORE
// =============================================

function displayEmpty() {
    const container = document.getElementById('eventsContainer');
    container.innerHTML = `
        <div class="empty-state" style="display: flex;">
            <div class="empty-icon">🏁</div>
            <h2>Nessun evento trovato</h2>
            <p>Prova a modificare i filtri o la ricerca</p>
        </div>
    `;
}

function showLoading() {
    const container = document.getElementById('eventsContainer');
    container.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Caricamento eventi...</p>
        </div>
    `;
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    errorText.textContent = message;
    errorDiv.style.display = 'flex';
    
    // Auto-hide dopo 10 secondi
    setTimeout(hideError, 10000);
}

function hideError() {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.style.display = 'none';
}

// =============================================
// UTILITY
// =============================================

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
