# Genetic Aquarium Project Rules

## file sizes

- nao permita que arquivos tenham mais de 200 linhas, separe as funcinalidades em modulos menores

## Mandatory checks after each modification

- Run `npm test` and ensure all tests pass.
- Run `npm run build` and ensure production build succeeds.
- If behavior changed, add or update tests under `tests/`.

## Visual design rules

- **Body**: Simple circle geometry (2D)
- **Color**:
  - Herbivore yellow spike (#ffff00)
  - Carnivore red spike (#ff0000)
- **Direction indicator (spike)**:
  - Herbivore: Arredondado (smooth, rounded)
  - Carnivore: Fino e pontudo (thin, sharp V-shape)
- Vision circle: Always visible when gizmo is selected, solid line
- Red circle marker: Appears on closest visible entity when gizmo selected

## Error handling rules

- **NN Errors**: Capture full stack trace when NN inference fails
  - Store in `gizmo._nnFaultStack`
  - Display in detail panel with full stack trace (preformatted text)
  - Log to browser console with `console.error()` for debugging
  - Error message format: `[Gizmo #ID NN ERROR] message\nstack_trace`

## Respawn rules

- Gizmos must always be accounted into two lists: herbivores and carnivores.
- If one class list reaches zero, only that class must be respawned using generation rules.
- If both class lists reach zero, both classes must be respawned.

## Identity rules

- Identity vectors must remain one-hot:
  - Food: `[1, 0, 0]`
  - Herbivore: `[0, 1, 0]`
  - Carnivore: `[0, 0, 1]`
- Label mapping must remain consistent with the vectors.

## Neural network rules

- Architecture for gizmos must remain `14 inputs -> hidden -> 3 outputs`.
- Activation functions:
  - **Hidden layer neurons**: use tanh activation (range [-1, 1]).
  - **Output layer neurons**: all use sigmoid activation (range [0, 1]).
- Output specification:
  - `ax` (output[0]): sigmoid → [0, 1], remapped to [-1, 1] for bidirectional acceleration.
  - `ay` (output[1]): sigmoid → [0, 1], remapped to [-1, 1] for bidirectional acceleration.
  - `eatDecision` (output[2]): sigmoid → [0, 1], threshold at 0.5 determines if gizmo eats.
- **All outputs must ALWAYS be in [0, 1]** — never negative or exceeding 1.
- Fallback on NN failure: [0.5, 0.5, 0.5] (no acceleration, no eat).
- **Input layout** (all values normalised to [0, 1]):
  - `[0]  c_food` — 1 if nearest visible entity is food, else 0 (one-hot with [1,2])
  - `[1]  c_herb` — 1 if nearest visible entity is herbivore, else 0
  - `[2]  c_carn` — 1 if nearest visible entity is carnivore, else 0
  - `[3]  c_prox` — proximity to nearest entity: `1 - dist/visionRange`; **0 when no target**
  - `[4]  c_angle` — heading alignment: `(dot+1)/2` where dot = facing·target_dir; 1=front, 0=behind; **0 when no target**
  - `[5]  c_left` — 1 if target is to the left or directly ahead (cross≥0); 0 otherwise; **0 when no target**
  - `[6]  c_right` — 1 if target is to the right or directly ahead (cross≤0); 0 otherwise; **0 when no target**
  - When totally in front: `[c_prox, 1, 1, 1]`; when totally to left: `[c_prox, 0.5, 1, 0]`; when totally to right: `[c_prox, 0.5, 0, 1]`
  - `[7]  n_food` — count of food items in vision field, normalised 0-1 (0 foods=0, >10=1)
  - `[8]  n_herb` — count of herbivores in vision field, normalised 0-1
  - `[9]  n_carn` — count of carnivores in vision field, normalised 0-1
  - `[10] avg_d` — average distance of all visible entities, normalised 0-1
  - `[11] starv` — starvation level (0=just ate, 1=about to die)
  - `[12] wall` — wall proximity within vision range: 0 if outside vision, 1 if touching
  - `[13] bias` — always 1.0
- **Critical rule**: If `nnHiddenSize` changes during simulation, ALL gizmos must be respawned with new NN architecture, Hall of Fame must be reset, and all saved champion genes must be cleared (structure changes invalidate all trained weights).
- `clone()` must be deep copy (mutating clone must not mutate source).
- `crossover()` must preserve dimensions.

## Hall of Fame rules

- Hall of Fame must keep top scores sorted descending.
- Hall of Fame size per class must stay capped (top N).
- `bestChampion()` must pick highest score across classes.
- `pickParents()` must return valid parents when class data exists.

## Test organization

- Keep all tests centralized under the `tests/` folder.
- Use subfolders by domain, e.g. `tests/ui`, `tests/simulation`, and `tests/core`.
- **Rendering tests**: Verify live gizmos are added to scene, have visible mesh, have correct geometry
- **NN tests**: Verify inputs are built correctly, NN receives inputs each frame, outputs are valid [0,1], fallback works

## Selection and camera behavior

- Keep list-click and aquarium-click selection synchronized.
- Clicking a gizmo in the aquarium must fix selection to that gizmo and sync list highlight.
- Clicking a different list item must immediately switch fixed selection to the new gizmo.
- Hover follow must only happen when no gizmo is fixed.
- Camera focus/zoom must follow the currently fixed gizmo selection.
- Vision circle must be enabled immediately on gizmo selection.
- Vision circle must be disabled immediately on gizmo deselection.
- No global vision-circle toggle should exist.
- When a gizmo is selected by click, the nearest item currently fed as NN input (the item being seen) must receive a red circle highlight around it.
- Only entities **within the gizmo's vision range** count as NN inputs or as the red-circle target; entities beyond the vision circle are ignored entirely.

## Selected gizmo panel behavior

- Selected gizmo panel must render on the right side of the screen.
- Panel fields must keep: Score, Age, and Time-without-eating.
- Position, velocity, acceleration, and active/sensing rows must not be shown.
- Time-without-eating must be displayed as a decreasing bar.
- Neural network visualization must stay open inline under the panel.
- NN error display must show full stack trace in preformatted text

## NN runtime safety

- NN failures for an individual gizmo must not stop the simulation loop.
- Use defensive handling (e.g., try/catch + safe fallback outputs).

## Maintenance policy

- Before changing existing behavior, check this file and preserve the listed invariants.
