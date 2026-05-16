// =============================================
// CONFIG.JS - CONFIGURAZIONE GLOBALE
// =============================================

// ↓↓↓ MODIFICA QUESTI VALORI ↓↓↓

// ID del tuo Google Sheet
const SHEET_ID = '1rR7ZPX76LLlurBItxRPoK3Icj7t6ojM93NCkhW85Ffo';

// Nome della pagina nel foglio
const SHEET_NAME = 'DettaglioEventi';

// (OPZIONALE) Se il foglio non è pubblico, aggiungi una API Key di Google
const API_KEY = ''; // Lascia vuoto per fogli pubblici

// ↑↑↑ FINE CONFIGURAZIONE PRINCIPALE ↑↑↑

// =============================================
// CONFIGURAZIONE COLONNE
// =============================================

const COLUMN_CONFIG = {
    nome: 'Evento',           // Colonna del nome evento
    data: 'Data',             // Colonna della data
    ora: 'Ora',               // Colonna dell'ora
    luogo: 'Luogo',           // Colonna del luogo
    descrizione: 'Descrizione', // Colonna della descrizione
    stato: 'Stato',           // Colonna dello stato
    partecipanti: 'Partecipanti', // Colonna dei partecipanti
    link: 'Link'              // Colonna del link
};

// =============================================
// CONFIGURAZIONE VISUALIZZAZIONE
// =============================================

const CONFIG = {
    // Auto-refresh ogni N millisecondi (0 = disabilitato)
    autoRefreshInterval: 300000, // 5 minuti
    
    // Visualizza statistiche
    showStats: true,
    
    // Visualizza ultimo aggiornamento
    showLastUpdate: true,
    
    // Ordinamento eventi
    sortBy: 'data',        // 'data', 'nome', 'stato'
    sortOrder: 'asc',      // 'asc' (crescente) o 'desc' (decrescente)
    
    // Formato data
    dateFormat: 'dd/mm/yyyy' // 'dd/mm/yyyy' o 'yyyy-mm-dd'
};

// =============================================
// CONFIGURAZIONE STATI
// =============================================

const STATUS_CONFIG = {
    'Programmato': {
        label: 'Programmato',
        icon: '📅',
        color: '#457b9d'
    },
    'In corso': {
        label: 'In corso',
        icon: '🏃',
        color: '#fca311'
    },
    'Completato': {
        label: 'Completato',
        icon: '✅',
        color: '#06a77d'
    },
    'Annullato': {
        label: 'Annullato',
        icon: '❌',
        color: '#d62828'
    }
};

// =============================================
// FUNZIONE URL GOOGLE SHEETS
// =============================================

function getGoogleSheetsUrl() {
    const sheetName = encodeURIComponent(SHEET_NAME);
    const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}`;
    
    if (API_KEY) {
        return `${baseUrl}?key=${API_KEY}`;
    } else {
        // Per fogli pubblici, usa un proxy CORS gratuito
        return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
    }
}
