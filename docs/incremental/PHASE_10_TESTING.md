# Testing Phase 10 – Map & Run Flow

## Quick access

- **Incremental nav**: use **Run (Map)** to open the run flow. If you have an active run, you go straight to the map; otherwise you see “Start a run from Lineups” and a link to Lineups.

## How to test

1. **Sign in** and open **Incremental** (e.g. `/incremental`).

2. **Get to the map**
   - Click **Run (Map)** in the nav:
     - With an **active run**: you are redirected to the map page (`/incremental/run/[runId]`).
     - With **no active run**: you see “You have no active run” and **Go to Lineups →**.
   - Or go to **Lineups**, pick a lineup, click **Start run**; you land on the map.

3. **Map page**
   - You should see a **visual path**: nodes with knight icons, connectors, and node type labels (quest board style). **Tap a node** (not “Choose next node” buttons) to enter battle or advance.
   - **Combat/Elite/Boss**: tap the node → **POST battle/enter** → you are taken to the **battle** page (`/incremental/run/[runId]/battle`). Fight there; when done, use **Continue** (which calls POST battle/complete) to return to the map.
   - **Base**: tap the node → POST advance → you stay on the map, see a “Healed!” toast and the path refreshes with next choices.

4. **Errors**
   - Invalid or missing run: “Run not found” (or similar) and **← Back to Lineups**.
   - Advance failure (e.g. invalid node): error message and you remain on the map; fix and try again or go back to Lineups.

5. **Full flow**
   - Lineups → **Start run** → Map → **Tap a node** → (Combat/Elite/Boss → battle/enter → Battle → win → **Continue** → Map) or (Base → advance → “Healed!” → next choices). Repeat until the run ends or you leave.

## Prerequisites

- At least one **save** and one **lineup** with 1–5 heroes from your **roster** (recruit heroes in Hero Tavern if needed).
