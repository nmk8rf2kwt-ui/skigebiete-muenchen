# Sentry Session Replay - Datenschutz & Implementierung

## Übersicht

Wir haben Sentry Session Replay aktiviert, um Fehler besser debuggen zu können. Diese Funktion zeichnet User-Interaktionen auf, wenn ein Fehler auftritt.

## Was wird aufgezeichnet?

### ✅ Aufgezeichnet:
- Klicks und Mausbewegungen
- Scroll-Verhalten
- Seitennavigation
- DOM-Änderungen (visuelle Darstellung)
- Konsolenausgaben (Fehler)

### ❌ NICHT aufgezeichnet (automatisch maskiert):
- Eingaben in `<input>` Feldern (werden als `***` angezeigt)
- Passwörter
- Kreditkartendaten
- Persönliche Daten in Formularen

## Privacy-Einstellungen

Die folgenden Felder werden automatisch maskiert:
- `#addressInput` - Adresssuche (wird als `***` aufgezeichnet)
- Alle `<input type="password">` Felder
- Alle Felder mit `data-sentry-mask` Attribut

## Sentry Projekt-Konfiguration

### Schritt 1: Session Replay aktivieren

1. Gehen Sie zu: https://sentry.io/organizations/YOUR_ORG/projects/
2. Wählen Sie Ihr Projekt: `skigebiete-backend`
3. Gehen Sie zu: **Settings** → **Loader Script**
4. Aktivieren Sie: **Session Replay**
5. Konfigurieren Sie:
   - **Sample Rate**: `0.1` (10% aller Sessions)
   - **Error Sample Rate**: `1.0` (100% bei Fehlern)
   - **Privacy Settings**: 
     - ✅ Block all media (images, videos)
     - ✅ Mask all text
     - ✅ Mask all inputs

### Schritt 2: Privacy-Einstellungen

In den Sentry Project Settings unter **Session Replay** → **Privacy**:

```
Privacy Mode: Mask
- Mask all text: ON
- Mask all inputs: ON  
- Block all media: ON
```

### Schritt 3: Loader Script aktualisieren

Der Loader Script in `index.html` (Zeile 15) sollte automatisch aktualisiert werden, sobald Sie Session Replay aktivieren.

Falls nicht, können Sie den Script-Tag manuell aktualisieren mit den neuen Parametern.

## Testing

### Lokales Testing:

1. Öffnen Sie die Anwendung: http://localhost:3000
2. Klicken Sie auf **System Status**
3. Klicken Sie auf **🎬 Session Replay testen**
4. Warten Sie 30 Sekunden
5. Gehen Sie zu Sentry Dashboard → **Issues**
6. Klicken Sie auf den Test-Fehler
7. Gehen Sie zum **Replays** Tab
8. Schauen Sie sich die Aufzeichnung an

### Production Testing:

Gleicher Ablauf wie oben, aber auf der Production-URL.

## Datenschutzerklärung - Text-Vorschlag

Fügen Sie folgenden Text zu Ihrer Datenschutzerklärung hinzu:

---

### Fehler-Monitoring und Session Replay

Wir nutzen Sentry (Functional Software, Inc., USA) zur Überwachung von Anwendungsfehlern und zur Verbesserung der Benutzererfahrung.

**Was wird erfasst:**
- Technische Fehlerinformationen (Browser, Betriebssystem, Fehlertyp)
- Anonymisierte Session-Aufzeichnungen bei Fehlern (Klicks, Scrolling, Seitennavigation)
- Anonyme Session-ID (keine personenbezogenen Daten)

**Was wird NICHT erfasst:**
- Eingaben in Formularfeldern werden automatisch maskiert (`***`)
- Keine IP-Adressen
- Keine persönlichen Daten

**Rechtsgrundlage:** Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO) zur Fehleranalyse und Verbesserung der Anwendung.

**Speicherdauer:** 90 Tage

**Widerspruchsrecht:** Sie können Session Replay deaktivieren, indem Sie in Ihrem Browser JavaScript deaktivieren oder einen Ad-Blocker verwenden.

**Weitere Informationen:** https://sentry.io/privacy/

---

## Kosten

### Sentry Free Tier:
- 5.000 Errors/Monat
- 50 Session Replays/Monat

### Empfehlung:
Starten Sie mit dem Free Tier und überwachen Sie die Nutzung. Bei Bedarf können Sie auf einen bezahlten Plan upgraden.

## Monitoring

Überprüfen Sie regelmäßig:
1. **Sentry Dashboard** → **Stats** → Session Replay Nutzung
2. **Issues** → Schauen Sie sich Replays bei kritischen Fehlern an
3. **Performance** → Überprüfen Sie, ob Session Replay die Performance beeinflusst

## Deaktivierung

Falls Sie Session Replay deaktivieren möchten:

1. Entfernen Sie `js/sentry-config.js` aus `index.html`
2. Deaktivieren Sie Session Replay in den Sentry Project Settings
3. Der Loader Script wird automatisch aktualisiert

## Support

Bei Fragen:
- Sentry Dokumentation: https://docs.sentry.io/platforms/javascript/session-replay/
- Sentry Support: https://sentry.io/support/
