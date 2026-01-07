# API-Kostenanalyse für Skalierung 2026

**Projekt:** Skigebiete München  
**Datum:** 2026-01-07  
**Zweck:** Kostenvergleich für Routing/Matrix APIs bei steigenden Nutzerzahlen

---

## 📊 Aktuelles Setup

- **API:** TomTom Matrix API
- **Freemium-Limit:** 2.500 Requests/Tag
- **Zielorte pro Request:** ~100 Skigebiete
- **Requests pro User:** 1 Request (1 Origin → 100 Destinations = 100 Elemente)

---

## 🎯 Skalierungsszenarien

### Annahmen
- **100 Elemente** pro User-Request (1 Standort → 100 Skigebiete)
- **Nutzungsverhalten:** 
  - Konservativ: 1x pro Tag
  - Realistisch: 2x pro Tag (z.B. Morgen + Nachmittag)
  - Intensiv: 5x pro Tag (mehrfache Standortänderungen)

### Szenario 1: 100 User/Tag
| Nutzung | Requests/Tag | Requests/Monat | Elemente/Monat |
|---------|--------------|----------------|----------------|
| 1x/Tag  | 100          | 3.000          | 300.000        |
| 2x/Tag  | 200          | 6.000          | 600.000        |
| 5x/Tag  | 500          | 15.000         | 1.500.000      |

### Szenario 2: 1.000 User/Tag
| Nutzung | Requests/Tag | Requests/Monat | Elemente/Monat |
|---------|--------------|----------------|----------------|
| 1x/Tag  | 1.000        | 30.000         | 3.000.000      |
| 2x/Tag  | 2.000        | 60.000         | 6.000.000      |
| 5x/Tag  | 5.000        | 150.000        | 15.000.000     |

### Szenario 3: 10.000 User/Tag
| Nutzung | Requests/Tag | Requests/Monat | Elemente/Monat |
|---------|--------------|----------------|----------------|
| 1x/Tag  | 10.000       | 300.000        | 30.000.000     |
| 2x/Tag  | 20.000       | 600.000        | 60.000.000     |
| 5x/Tag  | 50.000       | 1.500.000      | 150.000.000    |

---

## 💰 Kostenvergleich nach Anbieter

### 1. **Google Maps Distance Matrix API**

#### Preisstruktur (2026)
- **Basic (ohne Traffic):** $4.00 / 1.000 Elemente (nach 10.000 free/Monat)
- **Advanced (mit Traffic):** $8.00 / 1.000 Elemente (nach 5.000 free/Monat)
- **Limit:** Max. 100 Elemente pro Request (25 Origins × 25 Destinations)

#### Kosten für Traffic-Daten (Advanced)

| Szenario | Nutzung | Elemente/Monat | Free Tier | Kostenpflichtig | Kosten/Monat |
|----------|---------|----------------|-----------|-----------------|--------------|
| **100 User** | 1x | 300.000 | 5.000 | 295.000 | **$2.360** |
| | 2x | 600.000 | 5.000 | 595.000 | **$4.760** |
| | 5x | 1.500.000 | 5.000 | 1.495.000 | **$11.960** |
| **1.000 User** | 1x | 3.000.000 | 5.000 | 2.995.000 | **$23.960** |
| | 2x | 6.000.000 | 5.000 | 5.995.000 | **$47.960** |
| | 5x | 15.000.000 | 5.000 | 14.995.000 | **$119.960** |
| **10.000 User** | 1x | 30.000.000 | 5.000 | 29.995.000 | **$239.960** |
| | 2x | 60.000.000 | 5.000 | 59.995.000 | **$479.960** |
| | 5x | 150.000.000 | 5.000 | 149.995.000 | **$1.199.960** |

**✅ Vorteile:**
- Höchste Datenqualität und Abdeckung
- Zuverlässige Traffic-Daten
- Umfassende Dokumentation

**❌ Nachteile:**
- **Teuerste Option** bei Traffic-Daten
- Neue Credit-Struktur ab März 2025 (nur 5.000 free für Advanced)

---

### 2. **TomTom Matrix Routing API**

#### Preisstruktur (2026)
- **Freemium:** 2.500 Requests/Tag (75.000/Monat)
- **Matrix Routing v2:** €2.50 / 1.000 Requests (~$2.75 USD)
- **Limit:** 100 Elemente pro Request (Sync), Enterprise: höher

#### Kosten (Pay As You Grow)

| Szenario | Nutzung | Requests/Monat | Free Tier | Kostenpflichtig | Kosten/Monat |
|----------|---------|----------------|-----------|-----------------|--------------|
| **100 User** | 1x | 3.000 | 2.500 | 500 | **$1.38** |
| | 2x | 6.000 | 2.500 | 3.500 | **$9.63** |
| | 5x | 15.000 | 2.500 | 12.500 | **$34.38** |
| **1.000 User** | 1x | 30.000 | 2.500 | 27.500 | **$75.63** |
| | 2x | 60.000 | 2.500 | 57.500 | **$158.13** |
| | 5x | 150.000 | 2.500 | 147.500 | **$405.63** |
| **10.000 User** | 1x | 300.000 | 2.500 | 297.500 | **$818.13** |
| | 2x | 600.000 | 2.500 | 597.500 | **$1.643.13** |
| | 5x | 1.500.000 | 2.500 | 1.497.500 | **$4.118.13** |

**Hinweis:** Kosten basieren auf **Requests**, nicht Elementen! (1 Request = 100 Elemente)

**✅ Vorteile:**
- **Günstigste Option** bei hohem Volumen
- Großzügiger Free Tier (2.500/Tag)
- Batch-Verarbeitung bis 100 Ziele
- Bereits im Einsatz (keine Migration nötig)

**❌ Nachteile:**
- Enterprise-Preise für höhere Limits nicht öffentlich

---

### 3. **HERE Maps Matrix Routing API**

#### Preisstruktur (2026)
- **Freemium:** 2.500 Transactions/Monat
- **Pay-per-use:** $5.00 / 1.000 Transactions
- **Pro Plan:** $449/Monat für bis zu 1 Mio. Transactions
- **Limit:** 100 Destinations pro Route

#### Kosten

| Szenario | Nutzung | Requests/Monat | Free Tier | Kostenpflichtig | Kosten/Monat |
|----------|---------|----------------|-----------|-----------------|--------------|
| **100 User** | 1x | 3.000 | 2.500 | 500 | **$2.50** |
| | 2x | 6.000 | 2.500 | 3.500 | **$17.50** |
| | 5x | 15.000 | 2.500 | 12.500 | **$62.50** |
| **1.000 User** | 1x | 30.000 | 2.500 | 27.500 | **$137.50** |
| | 2x | 60.000 | 2.500 | 57.500 | **$287.50** |
| | 5x | 150.000 | 2.500 | 147.500 | **$737.50** |
| **10.000 User** | 1x | 300.000 | 2.500 | 297.500 | **$1.487.50** |
| | 2x | 600.000 | 2.500 | 597.500 | **$2.987.50** |
| | 5x | 1.500.000 | Pro Plan | - | **$449** (Pro) |

**💡 Pro Plan wird profitabel ab ~90.000 Requests/Monat**

**✅ Vorteile:**
- Pro Plan attraktiv bei hohem Volumen
- Gute Datenqualität
- Volume Discounts verfügbar

**❌ Nachteile:**
- Teurer als TomTom bei mittlerem Volumen
- Kleinerer Free Tier als TomTom

---

### 4. **Mapbox Matrix API**

#### Preisstruktur (2026)
- **Free Tier:** 100.000 Elemente/Monat
- **Pricing Tiers:**
  - 100.001 - 500.000: $2.00 / 1.000 Elemente
  - 500.001 - 1.000.000: $1.60 / 1.000 Elemente
  - 1.000.001 - 5.000.000: $1.20 / 1.000 Elemente
  - 5.000.001+: Custom Pricing
- **Limit:** 25×25 Matrix (625 Elemente max)

#### Kosten

| Szenario | Nutzung | Elemente/Monat | Free Tier | Tier 1 (2.00) | Tier 2 (1.60) | Tier 3 (1.20) | Kosten/Monat |
|----------|---------|----------------|-----------|---------------|---------------|---------------|--------------|
| **100 User** | 1x | 300.000 | 100.000 | 200.000 | - | - | **$400** |
| | 2x | 600.000 | 100.000 | 400.000 | 100.000 | - | **$960** |
| | 5x | 1.500.000 | 100.000 | 400.000 | 500.000 | 500.000 | **$2.200** |
| **1.000 User** | 1x | 3.000.000 | 100.000 | 400.000 | 500.000 | 2.000.000 | **$4.560** |
| | 2x | 6.000.000 | 100.000 | 400.000 | 500.000 | 5.000.000 | **$9.360** |
| | 5x | 15.000.000 | 100.000 | 400.000 | 500.000 | 4.000.000 | **Custom** |
| **10.000 User** | 1x | 30.000.000 | Custom Pricing | - | - | - | **Custom** |
| | 2x | 60.000.000 | Custom Pricing | - | - | - | **Custom** |
| | 5x | 150.000.000 | Custom Pricing | - | - | - | **Custom** |

**⚠️ Problem:** Matrix-Limit von 25×25 = **4 Requests nötig** für 100 Ziele!

**✅ Vorteile:**
- Großzügiger Free Tier (100.000 Elemente)
- Gestaffelte Preise bei hohem Volumen

**❌ Nachteile:**
- Matrix-Limit erfordert mehrere Requests
- Teurer als TomTom bei mittlerem Volumen
- Custom Pricing ab 5 Mio. Elementen

---

### 5. **Azure Maps Route Matrix API**

#### Preisstruktur (2026)
- **Pricing:** ~$5.00 / 1.000 Transactions (ähnlich HERE)
- **Free Tier:** Variiert je nach Azure-Plan
- **Limit:** 700 Origins × Destinations (max. 700 Zellen)

**Hinweis:** Detaillierte Preise erfordern Azure-Konto-Setup

**✅ Vorteile:**
- Integration mit Azure-Ökosystem
- Höheres Matrix-Limit als Google/Mapbox

**❌ Nachteile:**
- Komplexere Preisstruktur
- Ähnlich teuer wie HERE

---

### 6. **OpenRouteService (ORS)**

#### Preisstruktur (2026)
- **Standard Plan:** Kostenlos mit täglichen Limits
- **Collaborative Plan:** Kostenlos für Non-Profit/Academic
- **Enterprise:** Kontaktbasiert
- **Self-Hosting:** Unbegrenzt (Infrastrukturkosten)

#### Self-Hosting Kosten (geschätzt)
- **Cloud Server:** $50-200/Monat (je nach Traffic)
- **Wartung:** Intern oder $500-1.000/Monat (extern)

**✅ Vorteile:**
- **Kostenlos** für Open-Source-Projekte
- Self-Hosting = volle Kontrolle
- Keine API-Limits bei Self-Hosting

**❌ Nachteile:**
- Infrastruktur-Overhead
- Wartungsaufwand
- Möglicherweise schlechtere Traffic-Daten

---

## 📈 Kostenvergleich: Übersicht

### Szenario: 1.000 User/Tag, 2x Nutzung (6.000 Requests/Monat)

| Anbieter | Kosten/Monat | Kosten/Jahr | Bemerkung |
|----------|--------------|-------------|-----------|
| **TomTom** | **$158** | **$1.896** | ✅ Günstigste Option |
| **HERE** | $288 | $3.456 | Pro Plan nicht erreicht |
| **Mapbox** | $960 | $11.520 | Element-basiert, 4x Requests |
| **Google Maps** | $4.760 | $57.120 | ❌ Teuerste Option |
| **ORS (Self-Host)** | $100-300 | $1.200-3.600 | + Wartungsaufwand |

### Szenario: 10.000 User/Tag, 1x Nutzung (300.000 Requests/Monat)

| Anbieter | Kosten/Monat | Kosten/Jahr | Bemerkung |
|----------|--------------|-------------|-----------|
| **TomTom** | **$818** | **$9.816** | ✅ Günstigste Option |
| **HERE** | $1.488 | $17.856 | Pro Plan nicht erreicht |
| **Mapbox** | Custom | Custom | Über 5 Mio. Elemente |
| **Google Maps** | $239.960 | $2.879.520 | ❌ Extrem teuer |
| **ORS (Self-Host)** | $200-500 | $2.400-6.000 | + Wartungsaufwand |

---

## 🎯 Empfehlungen

### Kurzfristig (< 1.000 User/Tag)
**✅ TomTom Matrix API (aktuell)**
- Bereits implementiert
- Günstigster Anbieter
- Free Tier deckt kleine Nutzerzahlen ab
- **Kosten:** $0-158/Monat

### Mittelfristig (1.000 - 10.000 User/Tag)
**✅ TomTom Matrix API (Pay As You Grow)**
- Weiterhin günstigste Option
- **Kosten:** $158-818/Monat
- Bei >90.000 Requests: HERE Pro Plan prüfen ($449/Monat)

**Alternative:** HERE Pro Plan ab ~90.000 Requests/Monat

### Langfristig (> 10.000 User/Tag)
**Option 1: TomTom Enterprise**
- Custom Pricing für höhere Limits
- Verhandlungsbasis bei hohem Volumen
- **Geschätzte Kosten:** $500-1.500/Monat

**Option 2: OpenRouteService Self-Hosting**
- Unbegrenzte Nutzung
- Volle Kontrolle
- **Kosten:** $200-500/Monat (Server) + Wartung
- **Geeignet ab:** >500.000 Requests/Monat

**Option 3: HERE Enterprise**
- Volume Discounts verfügbar
- Kontaktbasierte Preise

---

## 🚨 Wichtige Überlegungen

### 1. **Traffic-Datenqualität**
- **Google Maps:** Beste Qualität, aber extrem teuer
- **TomTom/HERE:** Sehr gut, deutlich günstiger
- **Mapbox:** Gut, aber teurer als TomTom
- **ORS:** Abhängig von Datenquelle (OSM)

### 2. **API-Limits**
- **TomTom:** 100 Destinations/Request ✅
- **Google/Mapbox:** 25×25 Matrix (mehrere Requests nötig)
- **HERE:** 100 Destinations/Request ✅
- **Azure:** 700 Zellen/Request ✅

### 3. **Skalierbarkeit**
- **TomTom/HERE:** Gut skalierbar mit Enterprise-Plänen
- **Google:** Skaliert, aber sehr teuer
- **ORS Self-Host:** Unbegrenzt skalierbar (Infrastruktur-abhängig)

### 4. **Vendor Lock-in**
- Aktuell: TomTom-spezifische Implementierung
- Migration zu anderem Anbieter: ~2-4 Tage Entwicklungszeit
- **Empfehlung:** Abstraktionsschicht für API-Calls implementieren

---

## 📋 Nächste Schritte

### Sofort
1. ✅ **Bei TomTom bleiben** (beste Kosten-Nutzen-Ratio)
2. Monitoring der täglichen API-Nutzung einrichten
3. Alert bei 80% des Free Tiers (2.000 Requests/Tag)

### Bei 1.000+ User/Tag
1. TomTom Pay As You Grow aktivieren
2. HERE Pro Plan evaluieren (ab 90.000 Requests/Monat)
3. Kosten-Tracking Dashboard implementieren

### Bei 10.000+ User/Tag
1. TomTom Enterprise-Konditionen verhandeln
2. OpenRouteService Self-Hosting als Backup evaluieren
3. Multi-Provider-Strategie prüfen (Fallback-System)

---

## 💡 Fazit

**TomTom bleibt die beste Wahl** für euer Projekt:
- ✅ Günstigste Option bei allen Skalierungsstufen
- ✅ Bereits implementiert (keine Migrationskosten)
- ✅ Großzügiger Free Tier (2.500/Tag)
- ✅ Batch-Verarbeitung (100 Ziele/Request)
- ✅ Gute Traffic-Datenqualität

**Kostenschätzung für realistisches Wachstum:**
- **100 User/Tag:** $0-10/Monat (Free Tier)
- **1.000 User/Tag:** $150-400/Monat
- **10.000 User/Tag:** $800-1.500/Monat

**Google Maps ist keine Option** aufgrund der 10-30x höheren Kosten.

---

**Erstellt:** 2026-01-07  
**Autor:** Antigravity AI  
**Version:** 1.0
