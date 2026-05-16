# 🏁 VRC Racing League - Pagina Riepilogo Eventi

Una pagina web moderna per visualizzare e gestire gli eventi della VRC Racing League direttamente da un Google Sheet.

## 🎯 Funzionalità

✅ **Caricamento automatico** da Google Sheets
✅ **Filtri avanzati** - Ricerca per nome e filtro per stato
✅ **Statistiche in tempo reale** - Totale eventi, programmati, completati, annullati
✅ **Design responsivo** - Perfetto su desktop, tablet e mobile
✅ **Interfaccia moderna** - Gradiente scuro, animazioni fluide
✅ **Ultimo aggiornamento** - Timestamp dell'ultimo caricamento

## 📋 Come utilizzare

### 1. **Preparazione del Google Sheet**

Il tuo Google Sheet deve avere una pagina chiamata `DettaglioEventi` con le seguenti colonne:

| Evento | Data | Ora | Luogo | Descrizione | Stato | Partecipanti | Link |
|--------|------|-----|-------|-------------|-------|--------------|------|
| Nome Evento | 2026-05-20 | 18:30 | Milano | Descrizione | Programmato | 25 | [URL] |

**Colonne supportate:**
- **Evento** (o Nome) - Nome dell'evento
- **Data** - Data in formato YYYY-MM-DD o DD/MM/YYYY
- **Ora** - Ora in formato HH:MM
- **Luogo** - Luogo dell'evento
- **Descrizione** - Descrizione dell'evento
- **Stato** - Programmato, Completato, Annullato, In corso
- **Partecipanti** - Numero di partecipanti
- **Link** - Link all'evento (opzionale)

### 2. **Condividi il Google Sheet**

⚠️ **IMPORTANTE**: Il foglio deve essere condiviso come **"Pubblico"** o almeno visibile a **"Chiunque abbia il link"**

1. Apri il tuo Google Sheet
2. Clicca su **"Condividi"** (tasto in alto a destra)
3. Seleziona **"Modifica impostazioni di condivisione"**
4. Cambia da "Ristretto" a **"Chiunque con il link"** o **"Pubblico su Internet"**
5. Copia il link (contiene l'ID del foglio)

### 3. **Configura l'ID del foglio**

Apri `config.js` e aggiorna:

```javascript
const SHEET_ID = '1rR7ZPX76LLlurBItxRPoK3Icj7t6ojM93NCkhW85Ffo'; // ← Il TUO ID
const SHEET_NAME = 'DettaglioEventi'; // Nome della pagina
```

**Come ottenere l'ID:**
- È nella URL del foglio: `https://docs.google.com/spreadsheets/d/QUESTO_È_L_ID/edit`

### 4. **(Opzionale) Configura API Google Sheets**

Se il foglio non è pubblico, puoi usare una API Key:

1. Vai a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuovo progetto
3. Abilita l'API "Google Sheets API"
4. Crea una chiave API in "Credenziali"
5. Incolla nel file `config.js`:

```javascript
const API_KEY = 'AIzaSy...'; // ← La TUA API Key
```

## 📁 Struttura file

```
├── index.html      # Pagina principale
├── styles.css      # Stili CSS
├── app.js          # Logica principale
├── config.js       # Configurazione (ID foglio, colonne, API key)
└── README.md       # Questo file
```

## 🚀 Uso

Semplicemente apri `index.html` in un browser. La pagina:
1. Carica automaticamente gli eventi
2. Mostra statistiche
3. Permette di filtrare per nome o stato
4. Aggiorna i dati con il tasto "🔄 Aggiorna Dati"

## 🎨 Personalizzazione

### Colori
Modifica le variabili CSS in `styles.css`:

```css
:root {
    --primary-color: #e63946;        /* Rosso */
    --secondary-color: #457b9d;      /* Blu */
    --accent-color: #f1faee;         /* Bianco crema */
    --success-color: #06a77d;        /* Verde */
    --warning-color: #fca311;        /* Arancione */
    --danger-color: #d62828;         /* Rosso scuro */
}
```

### Colonne visualizzate
Modifica `config.js`:

```javascript
const COLUMN_CONFIG = {
    nome: 'Evento',
    data: 'Data',
    // Aggiungi/rimuovi colonne come necessario
};
```

## 🔧 Troubleshooting

### ❌ "Errore nel caricamento"

**Possibili cause:**
1. Il foglio non è pubblico → Condividi come "Pubblico"
2. ID del foglio errato → Copia dalla URL
3. Nome pagina sbagliato → Deve essere "DettaglioEventi"
4. CORS bloccato → Usa un'API Key

### ❌ "Nessun dato trovato"

- Verifica che il foglio abbia almeno 2 righe (intestazione + dati)
- Controlla che i nomi delle colonne corrispondano esattamente

### ❌ Le date non si formattano

- I formati supportati: `YYYY-MM-DD` o `DD/MM/YYYY`
- Modifica la funzione `formatDate()` in `app.js` se necessario

## 📱 Responsive Design

La pagina è ottimizzata per:
- 📱 Mobile (< 768px)
- 📱 Tablet (768px - 1024px)
- 💻 Desktop (> 1024px)

## 🤝 Supporto

Se hai problemi:
1. Apri la console del browser (F12)
2. Cerca messaggi di errore
3. Verifica i dati nel Google Sheet
4. Controlla la configurazione in `config.js`

---

**Buon divertimento con la tua pagina eventi! 🏁**
