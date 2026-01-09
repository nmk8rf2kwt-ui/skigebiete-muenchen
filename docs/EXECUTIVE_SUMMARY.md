# Executive Summary

Unsere Anwendung ist ein Echtzeit-Informationssystem für Wintersportler, das den aktuellen Status (Lifte, Pisten, Schneehöhen) aller Skigebiete mit mehr als 10 km Größe im DACH/IT visualisiert und mit smarten Reiseinformationen anreichert. Sie dient dazu, Nutzern eine schnelle Entscheidungsfindung zu ermöglichen, indem sie statische Anlagedaten mit Live-Verkehrsdaten (TomTom API), präzisen Wettervorhersagen (Open-Meteo) und historischen Trendanalysen kombiniert.

## Technische Basis

Technisch basiert das System auf einem **Node.js/Express Backend**, das als zentrale Schnittstelle fungiert: Es aggregiert Daten durch modulare Scraper und APIs, speichert Historien in einer **Supabase PostgreSQL-Datenbank** und überwacht die Systemgesundheit mittels **Sentry**.

Für die operative Steuerung steht ein gesichertes **Admin Dashboard** zur Verfügung, das Echtzeit-Einblicke in Scraper-Status, Cache-Inhalte, System-Logs und Webcam-Health-Checks bietet.

Das Frontend ist eine performante **Vanilla JS Single-Page-Application**, die auf Framework-Overhead verzichtet und stattdessen auf **Bootstrap 5** für das UI, **Leaflet** für interaktive Karten und **Chart.js** für Datenvisualisierungen setzt.

Die Architektur folgt einem hybriden Ansatz, bei dem statische Konfigurationen (Git) mit dynamischen Live-Daten (Cache/DB) angereichert werden, um hohe Performance und Ausfallsicherheit zu gewährleisten.
