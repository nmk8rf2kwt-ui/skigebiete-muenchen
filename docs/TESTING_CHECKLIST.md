# Sentry Session Replay & Rechtliche Dokumente - Implementation Checklist

## ✅ Was wurde implementiert?

### 1. Sentry Session Replay Integration
- [x] `js/sentry-config.js` - Konfiguration erstellt
- [x] `index.html` - Sentry Script eingebunden
- [x] Test-Button im System Status Modal
- [x] Privacy-Maskierung für Eingabefelder

### 2. Rechtliche Dokumente
- [x] `impressum.html` - Impressum mit deinen Daten
- [x] `datenschutz.html` - DSGVO-konforme Datenschutzerklärung
- [x] Footer mit Links zu Impressum & Datenschutz
- [x] `robots.txt` - Schutz vor Suchmaschinen-Indexierung
- [x] `<meta name="robots" content="noindex, nofollow">` auf beiden Seiten

### 3. Datenschutz-Maßnahmen
- [x] Alle externen Dienste dokumentiert:
  - Sentry (Fehler-Monitoring & Session Replay)
  - TomTom (Verkehrsdaten)
  - Open-Meteo (Wetterdaten)
  - OpenStreetMap (Kartendaten)
  - OpenRouteService (Geocoding)
  - GitHub Pages (Frontend Hosting)
  - Render.com (Backend Hosting)
  - Supabase (Datenbank)

---

## 🧪 Test-Plan

### Phase 1: Lokales Testing

#### Test 1: Rechtliche Seiten
- [ ] Öffne `index.html` im Browser
- [ ] Scrolle nach unten zum Footer
- [ ] Klicke auf "Impressum"
  - [ ] Überprüfe: Deine Daten werden korrekt angezeigt
  - [ ] Überprüfe: "Zurück zur Hauptseite" Link funktioniert
- [ ] Klicke auf "Datenschutzerklärung"
  - [ ] Überprüfe: Alle Dienste sind aufgelistet
  - [ ] Überprüfe: Sentry Session Replay ist erwähnt
  - [ ] Überprüfe: "Zurück zur Hauptseite" Link funktioniert

#### Test 2: Sentry Session Replay (Lokal)
- [ ] Öffne `index.html` im Browser
- [ ] Öffne Browser Console (F12)
- [ ] Suche nach: "✅ Sentry initialized with Session Replay"
  - ✅ Wenn vorhanden: Sentry ist geladen
  - ❌ Wenn nicht: Überprüfe Sentry Loader Script
- [ ] Klicke auf "System Status" (unten rechts)
- [ ] Scrolle zu "🧪 Sentry Session Replay Test"
- [ ] Klicke auf "🎬 Session Replay testen"
- [ ] Erwartetes Ergebnis:
  - [ ] Button zeigt "⏳ Sende Test..."
  - [ ] Nach 1 Sekunde: Grüne Erfolgsmeldung
  - [ ] "✅ Test erfolgreich!" wird angezeigt

### Phase 2: Sentry Dashboard Überprüfung

#### Schritt 1: Session Replay Konfiguration überprüfen
- [ ] Gehe zu https://sentry.io
- [ ] Öffne dein Projekt: `skigebiete-backend`
- [ ] Gehe zu: **Settings** → **Client Keys (DSN)** → **Loader Script**
- [ ] Überprüfe:
  - [ ] "Enable Session Replay" ist aktiviert (Toggle ON)
  - [ ] `replaySessionSampleRate: 0.1` (10%)
  - [ ] `replaysOnErrorSampleRate: 1` (100%)

#### Schritt 2: Privacy Settings konfigurieren
- [ ] In den Loader Script Settings:
- [ ] Scrolle zu "Privacy Settings"
- [ ] Aktiviere:
  - [ ] ✅ Mask all text
  - [ ] ✅ Mask all inputs
  - [ ] ✅ Block all media
- [ ] Klicke auf "Save Changes"
- [ ] Warte 2-3 Minuten (Loader Script Update)

#### Schritt 3: Test-Replay überprüfen
- [ ] Warte 30-60 Sekunden nach dem Test
- [ ] Gehe zu Sentry Dashboard → **Issues**
- [ ] Suche nach: "Test Error: Session Replay Verification"
- [ ] Klicke auf den Fehler
- [ ] Gehe zum **Replays** Tab
- [ ] Klicke auf die Session
- [ ] Überprüfe:
  - [ ] Video-Wiedergabe funktioniert
  - [ ] Eingabefelder sind maskiert (`***`)
  - [ ] Klicks und Scrolling sind sichtbar
  - [ ] Fehler ist im Timeline sichtbar

### Phase 3: Production Testing

#### Test 1: Deployment
- [ ] Committe alle Änderungen
- [ ] Pushe zu GitHub
- [ ] Warte auf GitHub Pages Deployment (~2-3 Min)
- [ ] Öffne Production URL: https://nmk8rf2kwt-ui.github.io/skigebiete-muenchen/

#### Test 2: Production Sentry Test
- [ ] Wiederhole Test 2 von Phase 1 auf Production
- [ ] Überprüfe Sentry Dashboard für Production Errors

#### Test 3: robots.txt Überprüfung
- [ ] Öffne: https://nmk8rf2kwt-ui.github.io/skigebiete-muenchen/robots.txt
- [ ] Überprüfe:
  - [ ] Datei ist erreichbar
  - [ ] `Disallow: /impressum.html` ist vorhanden
  - [ ] `Disallow: /datenschutz.html` ist vorhanden

#### Test 4: Meta Tags Überprüfung
- [ ] Öffne Impressum in Production
- [ ] Rechtsklick → "Seitenquelltext anzeigen"
- [ ] Suche nach: `<meta name="robots" content="noindex, nofollow">`
- [ ] Wiederhole für Datenschutz-Seite

---

## 🚀 Deployment Checklist

### Vor dem Deployment
- [ ] Alle Tests in Phase 1 bestanden
- [ ] Sentry Session Replay in Dashboard aktiviert
- [ ] Privacy Settings konfiguriert

### Deployment
```bash
# 1. Status überprüfen
git status

# 2. Alle Änderungen hinzufügen
git add .

# 3. Commit mit aussagekräftiger Message
git commit -m "feat: Add Sentry Session Replay + Legal Pages (Impressum, Datenschutz)

- Integrated Sentry Session Replay with privacy-first configuration
- Added Impressum and Datenschutzerklärung (GDPR compliant)
- Added robots.txt and noindex meta tags for privacy protection
- Added footer with legal links
- Added test button in System Status modal

BREAKING CHANGE: None
"

# 4. Push zu GitHub
git push origin main

# 5. Warte auf Deployment
# GitHub Actions: https://github.com/nmk8rf2kwt-ui/skigebiete-muenchen/actions
```

### Nach dem Deployment
- [ ] Production URL öffnen
- [ ] Alle Tests in Phase 3 durchführen
- [ ] Sentry Dashboard überprüfen (Production Events)

---

## 📊 Monitoring (erste 7 Tage)

### Täglich überprüfen:
1. **Sentry Quota Usage**
   - Dashboard → Settings → Subscription
   - Überprüfe: Session Replay Usage
   - Ziel: < 50 Replays/Monat (Free Tier)

2. **Error Rate**
   - Dashboard → Issues
   - Überprüfe: Neue Errors mit Replays
   - Ziel: Alle kritischen Errors haben Replays

3. **Privacy Compliance**
   - Schaue dir 1-2 Replays an
   - Überprüfe: Eingabefelder sind maskiert
   - Überprüfe: Keine persönlichen Daten sichtbar

### Wöchentlich überprüfen:
1. **Search Engine Indexing**
   - Google: `site:nmk8rf2kwt-ui.github.io/skigebiete-muenchen/impressum.html`
   - Erwartung: Keine Ergebnisse
   - Falls doch: robots.txt überprüfen

2. **Performance Impact**
   - Browser DevTools → Performance
   - Session Replay sollte < 5% CPU nutzen
   - Falls höher: Sample Rate reduzieren

---

## 🆘 Troubleshooting

### Problem: "Sentry ist nicht geladen"
**Lösung:**
1. Öffne Browser Console
2. Suche nach Sentry-Fehlern
3. Überprüfe Ad-Blocker (deaktivieren für Test)
4. Überprüfe Loader Script URL in `index.html`

### Problem: "Keine Replays im Dashboard"
**Lösung:**
1. Warte 2-3 Minuten nach Test
2. Gehe zu **Replays** → **All Replays** (nicht nur Issues)
3. Überprüfe Sample Rates in Settings
4. Überprüfe Browser Console für Sentry Errors

### Problem: "Impressum wird von Google indexiert"
**Lösung:**
1. Überprüfe `robots.txt` ist deployed
2. Überprüfe `<meta name="robots">` Tag vorhanden
3. Beantrage Löschung in Google Search Console
4. Warte 1-2 Wochen (Google braucht Zeit)

### Problem: "Test-Button funktioniert nicht"
**Lösung:**
1. Öffne Browser Console
2. Suche nach JavaScript-Fehlern
3. Überprüfe `js/sentry-config.js` ist geladen
4. Überprüfe `js/app.js` Event Listener

---

## 📝 Nächste Schritte nach erfolgreichem Test

1. **Dokumentation aktualisieren**
   - [ ] `CHANGELOG.md` aktualisieren
   - [ ] `README.md` aktualisieren (Legal Links erwähnen)

2. **Release erstellen**
   - [ ] Version auf 1.5.1 erhöhen
   - [ ] Git Tag erstellen: `git tag v1.5.1`
   - [ ] Tag pushen: `git push --tags`

3. **Monitoring einrichten**
   - [ ] Sentry Alerts konfigurieren (optional)
   - [ ] Wöchentliche Quota-Überprüfung im Kalender

---

## ✅ Erfolgs-Kriterien

Das Projekt ist erfolgreich deployed, wenn:
- ✅ Alle Tests in Phase 1-3 bestanden
- ✅ Sentry Session Replay funktioniert in Production
- ✅ Impressum & Datenschutz sind erreichbar
- ✅ robots.txt blockiert Suchmaschinen
- ✅ Keine persönlichen Daten in Replays sichtbar
- ✅ Keine kritischen Errors in Sentry

**Status:** 🟡 Bereit für Testing

**Nächster Schritt:** Phase 1 Testing durchführen
