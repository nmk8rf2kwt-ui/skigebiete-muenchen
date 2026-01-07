# Logging Strategy - Skigebiete Backend

## 📊 State-of-the-Art Logging Approach

### Log Storage Location

**Filesystem (nicht Datenbank)** - Industry Standard

**Warum Dateien statt Datenbank?**
- ✅ **Performance**: Keine DB-Last durch Logging
- ✅ **Unabhängigkeit**: Logs funktionieren auch bei DB-Ausfall
- ✅ **Standard-Tools**: Tail, grep, awk funktionieren
- ✅ **Rotation**: Automatisches Archivieren und Löschen
- ✅ **Kosten**: Keine DB-Speicherkosten

### Log-Struktur

```
backend/logs/
├── combined-2026-01-07.log      # Alle Logs (rotiert täglich)
├── error-2026-01-07.log         # Nur Fehler (rotiert täglich)
├── scraper-2026-01-07.log       # Scraper-spezifisch
├── traffic-2026-01-07.log       # Traffic API calls
└── archived/
    ├── combined-2026-01-01.log.gz
    └── error-2026-01-01.log.gz
```

### Retention Policy (Aufbewahrung)

| Log-Typ | Aufbewahrung | Kompression | Grund |
|---------|--------------|-------------|-------|
| **Error Logs** | 14 Tage | Ja (gzip) | Fehleranalyse |
| **Combined Logs** | 14 Tage | Ja (gzip) | Debugging |
| **Scraper Logs** | 7 Tage | Ja (gzip) | Kurzfristige Analyse |
| **Traffic Logs** | 7 Tage | Ja (gzip) | Performance-Monitoring |

### Automatische Rotation

**Winston Daily Rotate File** übernimmt:
- ✅ Tägliche Rotation (neue Datei pro Tag)
- ✅ Größen-Limit (max 20MB pro Datei)
- ✅ Automatisches Löschen alter Logs
- ✅ Automatische gzip-Kompression

### Log-Levels

```javascript
{
  error: 0,   // Fehler, die Aufmerksamkeit brauchen
  warn: 1,    // Warnungen (z.B. API Rate Limit)
  info: 2,    // Wichtige Events (Server Start, Scheduler)
  debug: 5,   // Debugging (nur Development)
}
```

### Production vs Development

**Production:**
- Console: nur `warn` und `error`
- Files: `info` und höher
- Rotation: aktiv

**Development:**
- Console: `debug` und höher
- Files: alle Levels
- Farbige Console-Ausgabe

### Datenbank-Logging (Nein!)

**Warum NICHT in der Datenbank?**
- ❌ Performance-Impact
- ❌ DB-Größe wächst unkontrolliert
- ❌ Logs gehen verloren bei DB-Crash
- ❌ Schwer zu analysieren (kein grep/tail)

**Ausnahme:** Audit-Logs für Compliance
- User-Aktionen (Login, Datenänderungen)
- Sicherheitsrelevante Events
- → Separate `audit_log` Tabelle in DB

### Zugriff auf Logs

**Lokal:**
```bash
# Alle Logs live anzeigen
tail -f backend/logs/combined-$(date +%Y-%m-%d).log

# Nur Fehler
tail -f backend/logs/error-$(date +%Y-%m-%d).log

# Nach Pattern suchen
grep "TomTom" backend/logs/traffic-*.log
```

**Production (Render.com):**
- Render Dashboard → Logs Tab
- Logs werden 7 Tage gespeichert

### Best Practices

1. ✅ **Strukturierte Logs** (JSON Format)
2. ✅ **Timestamps** (ISO 8601)
3. ✅ **Context** (component, resortId)
4. ✅ **Rotation** (automatisch)
5. ✅ **Retention** (14 Tage max)
6. ✅ **Compression** (gzip für alte Logs)
7. ❌ **Keine sensiblen Daten** (Passwörter, API Keys)
