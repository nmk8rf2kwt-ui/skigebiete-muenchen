# Resort Selection Framework & Research Concept

## 1. Decision Criteria (Entscheidungskriterien)

To ensure high data quality and relevance, we apply the following filter criteria. The long-term goal is a comprehensive database for the DACH region (Germany, Austria, Switzerland) to support dynamic user locations, not just Munich.

### Primary Criteria (Must-Haves)
1.  **Operational Status**: Ski operation must be currently possible (active resort, not permanently closed).
2.  **Size**: Minimum **10 km** of slopes (Pistenkilometer).
    *   *Rationale*: Filters out very small "village lifts" that are less relevant for day trips from Munich, unless they are specifically for nearby quick access.
3.  **Sledding Exception**:
    *   If a resort offers **only** or **primarily** sledding (Rodelbahn) without significant skiing, it is routed to a separate "Sledding Database" (Future Feature).
    *   **Threshold for Sledding**: Minimum **3 km** sledding run length to be included in the Sledding DB.

### Secondary Criteria (To be discussed/defined)
*   **Data Availability**: Is there a parseable source (Website/API) for live status?

## 2. Research Workflow (Workflow)

We follow a systematic "Region-by-Region" approach to complete the database for the entire DACH region.

### Phase 1: Germany (Deutschland)
*   **Focus**: All major ski regions (Bavaria, Black Forest, Harz, Sauerland, Erzgebirge) meeting the >10km criteria.
*   **Sources**:
    *   Wikipedia Lists of Ski Resorts in Germany.
    *   Skiresort.de / Bergfex (filtered by >10km).

### Phase 2: Austria (Österreich)
*   **Focus**: Tirol, Salzburger Land, Vorarlberg, Carinthia (Kärnten), Styria (Steiermark).

### Phase 3: Switzerland (Schweiz)
*   **Focus**: All major cantons (Graubünden, Bern, Valais, etc.).

## 3. The "Target Picture" (Zielbild)
We will maintain a `candidate_resorts_overview.md` document acting as the master list.
*   **Structure**: Country > Federal State/Region > Resort Name.
*   **Status Tracking**:
    *   `[ ]` Candidate Identified
    *   `[x]` Parsable Source Found
    *   `[x]` Added to Static DB (backend/resorts.json)

---
*Created by Antigravity*
