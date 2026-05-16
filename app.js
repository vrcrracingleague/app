// =============================================
// APP.JS - LOGICA PRINCIPALE PER GARE
// =============================================

let allRaces = [];
let filteredRaces = [];
let autoRefreshTimer = null;

// =============================================
// INIZIALIZZAZIONE
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    initEventListeners();
    loadRaces();
    
    // Auto-refresh se configurato
    if (CONFIG.autoRefreshInterval > 0) {
        autoRefreshTimer = setInterval(loadRaces, CONFIG.autoRefreshInterval);
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

    if (searchInput) searchInput.addEventListener('input', filterAndDisplayRaces);
    if (filterSelect) filterSelect.addEventListener('change', filterAndDisplayRaces);
    if (refreshBtn) refreshBtn.addEventListener('click', loadRaces);
    if (closeErrorBtn) closeErrorBtn.addEventListener('click', hideError);

    // Enter per ricerca
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                filterAndDisplayRaces();
            }
        });
    }
}

// =============================================
// CARICAMENTO DATI
// =============================================

async function loadRaces() {
    try {
        showLoading();
        const response = await fetch(getGoogleSheetsUrl());
        
        if (!response.ok) {
            throw new Error(`Errore: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Gestisci formato Google Visualization API
        let rows = [];
        if (data.table && data.table.rows) {
            // Formato gviz
            const headers = data.table.cols.map(col => col.label);
            rows = [headers];
            data.table.rows.forEach(row => {
                rows.push(row.c.map(cell => cell ? cell.v : ''));
            });
        } else if (data.values) {
            // Formato Sheets API
            rows = data.values;
        }
        
        if (!rows || rows.length < 2) {
            showError('Nessun dato trovato nel foglio Google Sheet');
            displayEmpty();
            return;
        }

        // Parsifica i dati
        allRaces = parseSheetData(rows);
        
        // Ordina gare
        allRaces.sort((a, b) => {
            let compareValue = 0;
            
            switch (CONFIG.sortBy) {
                case 'start_date':
                    compareValue = new Date(a.start_date_obj) - new Date(b.start_date_obj);
                    break;
                case 'name':
                    compareValue = a.name.localeCompare(b.name);
                    break;
                case 'status':
                    compareValue = a.status.localeCompare(b.status);
                    break;
            }
            
            return CONFIG.sortOrder === 'asc' ? compareValue : -compareValue;
        });

        // Filtra e visualizza
        filterAndDisplayRaces();
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
    const headers = rows[0].map(h => String(h).trim());
    const races = [];

    // Trova indici colonne
    const indices = {};
    for (const [key, colName] of Object.entries(COLUMN_CONFIG)) {
        indices[key] = headers.findIndex(h => h === colName);
    }

    // Processa righe dati
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        // Salta righe vuote
        if (!row || row.length === 0 || !row[indices.name]) continue;

        const race = {
            championship_id: row[indices.championship_id]?.toString().trim() || '',
            name: row[indices.name]?.toString().trim() || 'N/A',
            start_date: row[indices.start_date]?.toString().trim() || 'N/A',
            start_date_obj: parseDate(row[indices.start_date]?.toString().trim()),
            end_date: row[indices.end_date]?.toString().trim() || '',
            status: row[indices.status]?.toString().trim() || 'upcoming',
            capacity: parseInt(row[indices.capacity]) || 0,
            spots_taken: parseInt(row[indices.spots_taken]) || 0,
            entry_fee_required: row[indices.entry_fee_required]?.toString().toLowerCase() === 'true',
            accepting_registrations: row[indices.accepting_registrations]?.toString().toLowerCase() === 'true',
            game_name: row[indices.game_name]?.toString().trim() || '',
            host_name: row[indices.host_name]?.toString().trim() || '',
            round_number: row[indices.round_number]?.toString().trim() || '',
            upcoming_race_id: row[indices.upcoming_race_id]?.toString().trim() || '',
            upcoming_race_name: row[indices.upcoming_race_name]?.toString().trim() || '',
            upcoming_track_name: row[indices.upcoming_track_name]?.toString().trim() || '',
            upcoming_track_photo: row[indices.upcoming_track_photo]?.toString().trim() || '',
            upcoming_starts_at: row[indices.upcoming_starts_at]?.toString().trim() || '',
            url: row[indices.url]?.toString().trim() || '',
            image: row[indices.image]?.toString().trim() || ''
        };

        races.push(race);
    }

    return races;
}

// =============================================
// PARSING DATA
// =============================================

function parseDate(dateStr) {
    if (!dateStr) return new Date();
    
    dateStr = String(dateStr).trim();
    
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

function filterAndDisplayRaces() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const filterSelect = document.getElementById('filterSelect').value;

    filteredRaces = allRaces.filter(race => {
        // Filtro ricerca
        const matchesSearch = !searchInput || 
            race.name.toLowerCase().includes(searchInput) ||
            race.game_name.toLowerCase().includes(searchInput) ||
            race.host_name.toLowerCase().includes(searchInput) ||
            race.upcoming_track_name.toLowerCase().includes(searchInput);

        // Filtro stato
        const matchesFilter = filterSelect === 'all' || race.status === filterSelect;

        return matchesSearch && matchesFilter;
    });

    displayRaces(filteredRaces);
    updateStatistics();
}

// =============================================
// VISUALIZZAZIONE GARE
// =============================================

function displayRaces(races) {
    const container = document.getElementById('eventsContainer');
    
    if (races.length === 0) {
        displayEmpty();
        return;
    }

    container.innerHTML = races.map(race => createRaceCard(race)).join('');
}

function createRaceCard(race) {
    const statusConfig = STATUS_CONFIG[race.status] || STATUS_CONFIG['upcoming'];
    const startDate = formatDate(race.start_date);
    const endDate = race.end_date ? formatDate(race.end_date) : '';
    
    // Calcola posti disponibili
    const spotsAvailable = race.capacity - race.spots_taken;
    const percentage = race.capacity > 0 ? Math.round((race.spots_taken / race.capacity) * 100) : 0;
    
    // Immagine: usa quella della gara o della pista
    const imageUrl = race.image || race.upcoming_track_photo;
    const imageHtml = imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(race.name)}" class="event-image" onerror="this.style.display='none'">` : '';
    
    // Accetta iscrizioni
    const acceptingHtml = race.accepting_registrations 
        ? `<div class="event-detail accepting">✅ Accetta iscrizioni</div>` 
        : '';
    
    // Quota d'iscrizione
    const feeHtml = race.entry_fee_required 
        ? `<div class="event-detail"><strong>💰 Quota:</strong> Richiesta</div>` 
        : '';
    
    // Prossima gara
    const nextRaceHtml = race.upcoming_race_name
        ? `
        <div class="event-detail">
            <strong>🏎️ Prossima gara:</strong> ${escapeHtml(race.upcoming_race_name)}
        </div>
        ${race.upcoming_track_name ? `<div class="event-detail"><strong>🏁 Pista:</strong> ${escapeHtml(race.upcoming_track_name)}</div>` : ''}
        ${race.upcoming_starts_at ? `<div class="event-detail"><strong>⏰ Partenza:</strong> ${escapeHtml(race.upcoming_starts_at)}</div>` : ''}
        `
        : '';
    
    const linkHtml = race.url 
        ? `<a href="${escapeHtml(race.url)}" target="_blank" class="event-link">🔗 Dettagli</a>` 
        : '';

    return `
        <div class="event-card">
            ${imageHtml}
            <div class="event-header">
                <div>
                    <h2 class="event-title">${escapeHtml(race.name)}</h2>
                    ${race.round_number ? `<p class="event-round">Round ${escapeHtml(race.round_number)}</p>` : ''}
                </div>
                <span class="event-status" style="background-color: ${statusConfig.color}20; border: 2px solid ${statusConfig.color}; color: white;">
                    ${statusConfig.icon} ${statusConfig.label}
                </span>
            </div>
            <div class="event-body">
                <div class="event-detail">
                    <strong>🎮 Gioco:</strong> ${escapeHtml(race.game_name)}
                </div>
                <div class="event-detail">
                    <strong>👤 Host:</strong> ${escapeHtml(race.host_name)}
                </div>
                <div class="event-detail">
                    <strong>📅 Data inizio:</strong> ${startDate}
                </div>
                ${endDate ? `<div class="event-detail"><strong>📅 Data fine:</strong> ${endDate}</div>` : ''}
                
                <div class="event-detail">
                    <strong>👥 Posti:</strong> ${race.spots_taken}/${race.capacity}
                    <div class="progress-bar" style="width: ${percentage}%; background: linear-gradient(90deg, #06a77d, #457b9d);">
                        ${percentage}%
                    </div>
                </div>
                
                ${feeHtml}
                ${acceptingHtml}
                ${nextRaceHtml}
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

    const total = allRaces.length;
    const upcoming = allRaces.filter(r => r.status === 'upcoming').length;
    const active = allRaces.filter(r => r.status === 'active').length;
    const concluded = allRaces.filter(r => r.status === 'concluded').length;
    const cancelled = allRaces.filter(r => r.status === 'cancelled').length;

    document.getElementById('totalStat').textContent = total;
    document.getElementById('programmadoStat').textContent = upcoming;
    document.getElementById('inProgressStat').textContent = active;
    document.getElementById('completedStat').textContent = concluded;
    document.getElementById('cancelledStat').textContent = cancelled;
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
            <h2>Nessuna gara trovata</h2>
            <p>Prova a modificare i filtri o la ricerca</p>
        </div>
    `;
}

function showLoading() {
    const container = document.getElementById('eventsContainer');
    container.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Caricamento gare...</p>
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
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}
