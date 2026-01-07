# Sentry Session Replay - Quick Start Guide

## ⚡ Schnellstart (5 Minuten)

### Schritt 1: Sentry Projekt öffnen
1. Gehen Sie zu: https://sentry.io
2. Login mit Ihren Credentials
3. Wählen Sie Ihr Projekt: `skigebiete-backend`

### Schritt 2: Session Replay aktivieren

**Option A: Über Loader Script (Empfohlen)**
1. Gehen Sie zu: **Settings** → **Client Keys (DSN)**
2. Klicken Sie auf **Loader Script**
3. Aktivieren Sie: **Session Replay** Toggle
4. Konfigurieren Sie:
   ```
   Session Sample Rate: 0.1 (10%)
   Error Sample Rate: 1.0 (100%)
   ```
5. Klicken Sie auf **Save Changes**

**Option B: Manuell**
1. Gehen Sie zu: **Settings** → **Projects** → Ihr Projekt
2. Klicken Sie auf **Session Replay** im Menü
3. Klicken Sie auf **Enable Session Replay**
4. Konfigurieren Sie die Sample Rates wie oben

### Schritt 3: Privacy-Einstellungen konfigurieren

1. In den Session Replay Settings:
2. Scrollen Sie zu **Privacy Settings**
3. Aktivieren Sie:
   - ✅ **Mask all text** (schützt sensible Daten)
   - ✅ **Mask all inputs** (maskiert Formulareingaben)
   - ✅ **Block all media** (blockiert Bilder/Videos)
4. Klicken Sie auf **Save**

### Schritt 4: Testen

1. Öffnen Sie Ihre Anwendung (lokal oder production)
2. Klicken Sie auf **System Status** (unten rechts)
3. Scrollen Sie zu **🧪 Sentry Session Replay Test**
4. Klicken Sie auf **🎬 Session Replay testen**
5. Warten Sie 30-60 Sekunden

### Schritt 5: Replay ansehen

1. Gehen Sie zu Sentry Dashboard
2. Klicken Sie auf **Issues** im Menü
3. Finden Sie den Test-Fehler: "Test Error: Session Replay Verification"
4. Klicken Sie auf den Fehler
5. Gehen Sie zum **Replays** Tab
6. Klicken Sie auf die Session
7. 🎬 Schauen Sie sich die Aufzeichnung an!

## ✅ Checkliste

- [ ] Session Replay in Sentry aktiviert
- [ ] Privacy Settings konfiguriert (Mask all text/inputs)
- [ ] Sample Rates gesetzt (0.1 / 1.0)
- [ ] Test durchgeführt
- [ ] Replay im Dashboard gesehen
- [ ] Datenschutzerklärung aktualisiert (siehe `SENTRY_SESSION_REPLAY.md`)

## 🔍 Troubleshooting

### "Sentry ist nicht geladen"
- Überprüfen Sie, ob der Loader Script in `index.html` korrekt ist
- Öffnen Sie die Browser Console und suchen Sie nach Sentry-Fehlern
- Prüfen Sie, ob Ihr Ad-Blocker Sentry blockiert

### "Keine Replays im Dashboard"
- Warten Sie 1-2 Minuten nach dem Test
- Überprüfen Sie, ob Session Replay wirklich aktiviert ist
- Prüfen Sie die Sample Rate (sollte 1.0 für Errors sein)
- Schauen Sie in **Replays** → **All Replays** (nicht nur in Issues)

### "Privacy Settings nicht sichtbar"
- Session Replay muss zuerst aktiviert werden
- Aktualisieren Sie die Seite
- Prüfen Sie Ihre Sentry Plan-Limits

## 📊 Monitoring

Nach der Aktivierung überwachen Sie:

1. **Quota Usage**:
   - Gehen Sie zu: **Settings** → **Subscription**
   - Überprüfen Sie: Session Replay Usage
   - Free Tier: 50 Replays/Monat

2. **Performance Impact**:
   - Öffnen Sie Browser DevTools → Performance
   - Session Replay sollte <5% CPU nutzen
   - Falls zu hoch: Reduzieren Sie die Sample Rate

3. **Replay Quality**:
   - Schauen Sie sich 2-3 Replays an
   - Prüfen Sie, ob sensible Daten maskiert sind
   - Verifizieren Sie, dass Fehler klar erkennbar sind

## 🎯 Best Practices

1. **Sample Rates**:
   - Development: 1.0 (100%) für alle Sessions
   - Production: 0.1 (10%) für normale Sessions, 1.0 für Errors

2. **Privacy**:
   - Immer "Mask all inputs" aktivieren
   - Zusätzlich spezifische Felder mit `data-sentry-mask` markieren
   - Regelmäßig Replays überprüfen

3. **Kosten**:
   - Starten Sie mit Free Tier (50 Replays/Monat)
   - Monitoren Sie die Usage
   - Upgraden Sie nur bei Bedarf

## 📚 Weitere Ressourcen

- [Vollständige Dokumentation](./SENTRY_SESSION_REPLAY.md)
- [Sentry Session Replay Docs](https://docs.sentry.io/platforms/javascript/session-replay/)
- [Privacy Best Practices](https://docs.sentry.io/platforms/javascript/session-replay/privacy/)

## 🆘 Support

Bei Problemen:
1. Lesen Sie die [vollständige Dokumentation](./SENTRY_SESSION_REPLAY.md)
2. Überprüfen Sie die [Sentry Docs](https://docs.sentry.io)
3. Kontaktieren Sie Sentry Support: https://sentry.io/support/
