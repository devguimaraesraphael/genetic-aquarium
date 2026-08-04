# Graph Report - .  (2026-07-07)

## Corpus Check
- Corpus is ~29,462 words - fits in a single context window. You may not need a graph.

## Summary
- 334 nodes · 555 edges · 35 communities (19 shown, 16 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.81)
- Token cost: 0 input · 58,457 output

## Community Hubs (Navigation)
- Aquarium Scene Builder
- Constants & Gizmo Identity
- Gizmo IDs & Population Spawning
- Food Management
- Gizmo Detail Panel UI
- Package Dependencies
- Gizmo Mesh Rendering
- Hall of Fame
- Visual Effects System
- Hall of Fame Panel UI
- Gizmo Controller & Selection
- Settings Modal UI
- Camera Selection Rules
- Early Design Docs (fish.md/index.html)
- Hall of Fame Persistence & UI
- Neural Network Architecture Spec
- Selection/Camera Behavior Spec
- Critical Rules & Maintenance Policy
- Reproduction Mechanism Spec Conflict
- File Size Rule
- Identity Rules
- Mandatory Checks
- NN Error Handling Rules
- Respawn Rules
- Selected Gizmo Panel Spec
- Test Organization Rules
- Visual Design Rules
- Start Script Entry
- Feeding Rules
- NN Runtime Safety Rules
- Project Stack Description

## God Nodes (most connected - your core abstractions)
1. `Gizmo` - 29 edges
2. `HallOfFame` - 15 edges
3. `FoodManager` - 13 edges
4. `NeuralNetwork` - 12 edges
5. `CONFIG` - 10 edges
6. `GizmoController` - 9 edges
7. `generateInitialId()` - 8 edges
8. `generateCloneId()` - 8 edges
9. `generateCrossoverId()` - 8 edges
10. `EffectsManager` - 7 edges

## Surprising Connections (you probably didn't know these)
- `File Size Rule (200 lines max)` --semantically_similar_to--> `File Size Rule (200 lines max)`  [INFERRED] [semantically similar]
  CLAUDE.md → .claude/project-rules.md
- `Mandatory Checks After Modification` --semantically_similar_to--> `Mandatory Checks After Modification`  [INFERRED] [semantically similar]
  CLAUDE.md → .claude/project-rules.md
- `Visual Behavior Spec (body, spikes, fangs, aquarium palette)` --semantically_similar_to--> `Visual Design Rules`  [INFERRED] [semantically similar]
  CLAUDE.md → .claude/project-rules.md
- `NN Error Handling` --semantically_similar_to--> `NN Error Handling Rules`  [INFERRED] [semantically similar]
  CLAUDE.md → .claude/project-rules.md
- `Respawn Rules` --semantically_similar_to--> `Respawn Rules`  [INFERRED] [semantically similar]
  CLAUDE.md → .claude/project-rules.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Evolution from fish.md pseudocode to formal NN/genes spec in CLAUDE.md** — fish_gizmo_class, fish_animation_formula, fish_genes, claude_neural_network_architecture [INFERRED 0.70]
- **UI panels forming the simulation's evolutionary observability system** — index_hof_panel, index_gen_overlay, index_gizmo_list_panel, claude_evolution_hall_of_fame [INFERRED 0.75]
- **Conflicting reproduction mechanism specs across CLAUDE.md and project-rules.md** — claude_dual_reproduction_mechanisms, claude_project_rules_reproduction_via_hof_crossover_only, claude_evolution_hall_of_fame, claude_project_rules_hall_of_fame_dna_persistence [INFERRED 0.75]

## Communities (35 total, 16 thin omitted)

### Community 0 - "Aquarium Scene Builder"
Cohesion: 0.05
Nodes (40): buildAquarium(), disposeObject(), roundedRectPath(), setupPlankton(), updatePlankton(), setupGuiModal(), setupGui(), bindResizeHandler() (+32 more)

### Community 1 - "Constants & Gizmo Identity"
Cohesion: 0.08
Nodes (19): AQUARIUM_PRESETS, CONFIG, crossoverColor(), mutateColor(), getGizmoDetails(), registerEat(), tryEat(), Gizmo (+11 more)

### Community 2 - "Gizmo IDs & Population Spawning"
Cohesion: 0.12
Nodes (16): generateCloneId(), generateCrossoverId(), generateInitialId(), getGen(), isBoring(), nextGen(), parse(), randHex() (+8 more)

### Community 3 - "Food Management"
Cohesion: 0.13
Nodes (10): FoodManager, _color, createFoodMeshes(), _dummy, FOOD_GEOS, FOOD_PALETTE, _pelletGeo, renderFoodInstances() (+2 more)

### Community 4 - "Gizmo Detail Panel UI"
Cohesion: 0.21
Nodes (16): _ensure(), hide(), show(), showFood(), _startNNInlineLoop(), _stopNNInlineLoop(), update(), updateFood() (+8 more)

### Community 5 - "Package Dependencies"
Cohesion: 0.12
Nodes (16): dependencies, lil-gui, three, devDependencies, jsdom, vite, vitest, name (+8 more)

### Community 6 - "Gizmo Mesh Rendering"
Cohesion: 0.24
Nodes (10): buildBodyMesh(), buildBodyOutline(), buildEyesMesh(), buildSeenTargetMarker(), buildSpikeMesh(), buildVisionMesh(), barbTriangle(), buildFangGroup() (+2 more)

### Community 8 - "Visual Effects System"
Cohesion: 0.15
Nodes (4): BurstEffect, EffectsManager, RingEffect, _v

### Community 9 - "Hall of Fame Panel UI"
Cohesion: 0.21
Nodes (13): carnList, _escapeHtml(), _formatGeneration(), _formatScore(), genCarnNum, genHerbNum, genOverlay, _groupHtml() (+5 more)

### Community 11 - "Settings Modal UI"
Cohesion: 0.43
Nodes (6): applyPresetToForm(), colorField(), openSettingsModal(), rangeField(), readFormIntoConfig(), setVal()

### Community 12 - "Camera Selection Rules"
Cohesion: 0.50
Nodes (3): createCameraSelectionRules(), g1, g2

### Community 13 - "Early Design Docs (fish.md/index.html)"
Cohesion: 0.50
Nodes (4): Project Architecture / Directory Layout, Early Animation/Movement Formula, Early Gizmo Class Pseudocode, Aquarium Controls Button (UI)

### Community 14 - "Hall of Fame Persistence & UI"
Cohesion: 0.67
Nodes (4): Evolution / Hall of Fame (flat TOP_N=10 model), Hall of Fame / DNA Persistence (3-tier: historical, latest-gen, current-gen), Generation Overlay (UI), Hall of Fame Panel (UI)

### Community 15 - "Neural Network Architecture Spec"
Cohesion: 0.50
Nodes (4): Neural Network Architecture (14-in, hidden, 3-out), NN Input Vector Specification (14 inputs), Neural Network Rules, Early Genes Concept (vision, size)

### Community 16 - "Selection/Camera Behavior Spec"
Cohesion: 0.67
Nodes (4): Selection and Camera Behavior Rules, Selection and Camera Behavior, Follow Best Button (UI), Gizmo List Panel (UI)

## Knowledge Gaps
- **77 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+72 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Gizmo` connect `Constants & Gizmo Identity` to `Gizmo IDs & Population Spawning`, `Gizmo Controller & Selection`, `Gizmo Mesh Rendering`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Why does `HallOfFame` connect `Hall of Fame` to `Aquarium Scene Builder`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `FoodManager` connect `Food Management` to `Aquarium Scene Builder`, `Constants & Gizmo Identity`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _84 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Aquarium Scene Builder` be split into smaller, more focused modules?**
  _Cohesion score 0.053246753246753244 - nodes in this community are weakly interconnected._
- **Should `Constants & Gizmo Identity` be split into smaller, more focused modules?**
  _Cohesion score 0.08326530612244898 - nodes in this community are weakly interconnected._
- **Should `Gizmo IDs & Population Spawning` be split into smaller, more focused modules?**
  _Cohesion score 0.12298387096774194 - nodes in this community are weakly interconnected._