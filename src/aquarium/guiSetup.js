import { setupGuiModal } from "./guiModal.js";

/**
 * guiSetup.js – configures all lil-gui folders and controls.
 * Extracted from main.js to keep file sizes small.
 *
 * @param {GUI} gui
 * @param {object} config
 * @param {object} deps – { foodManager, foodStats, hofStats, createGizmos, hallOfFame,
 *                          gizmosRef, spawnGeneration, openSettingsModal, AQUARIUM_PRESETS,
 *                          buildAquariumFn, saveConfig, clearSelection, STORAGE_KEY }
 * @returns {{ openAquariumControls: Function, closeAquariumControls: Function, pauseRef: {value: boolean} }}
 */
export function setupGui(gui, config, deps) {
  const {
    foodManager,
    foodStats,
    hofStats,
    createGizmos,
    hallOfFame,
    gizmosRef,
    spawnGeneration,
    openSettingsModal,
    AQUARIUM_PRESETS,
    buildAquariumFn,
    saveConfig,
    clearSelection,
    STORAGE_KEY,
    startSimulation,
  } = deps;

  gui.domElement.style.display = "none";

  const pauseRef = { value: false };
  const { openAquariumControls } = setupGuiModal(gui, pauseRef);

  // ── Start Simulation button (top-level, always visible) ──────────────────
  if (startSimulation) {
    gui.add(
      { "▶ Start Simulation": () => startSimulation() },
      "▶ Start Simulation",
    );
  }

  // Population
  const popFolder = gui.addFolder("Population");
  popFolder
    .add(config, "gizmoCount", 20, 200, 1)
    .name("Gizmo count (→ restart)");
  popFolder
    .add(config, "carnivoreRatio", 0, 1, 0.01)
    .name("Carnivore % (→ restart)");
  popFolder.open();

  // Lifespan
  const lifespanFolder = gui.addFolder("Lifespan");
  lifespanFolder.add(config, "gizmoMaxAge", 60, 1200, 30).name("Max age (s)");
  lifespanFolder
    .add(config, "gizmoStarvation", 10, 600, 10)
    .name("Starvation (s)");
  lifespanFolder
    .add(config, "gizmoMaxWallTime", 5, 120, 5)
    .name("Wall trap (s)");
  lifespanFolder
    .add(hofStats, "herbGeneration")
    .name("Herb Generation")
    .listen()
    .disable(false);
  lifespanFolder
    .add(hofStats, "carnGeneration")
    .name("Carn Generation")
    .listen()
    .disable(false);
  lifespanFolder
    .add(hofStats, "herb")
    .name("Best Herb score (top-1)")
    .listen()
    .disable(false);
  lifespanFolder
    .add(hofStats, "carn")
    .name("Best Carn score (top-1)")
    .listen()
    .disable(false);
  lifespanFolder.open();

  // Physics
  const physicsFolder = gui.addFolder("Physics");
  physicsFolder
    .add(config, "deltaA", 0, 100, 0.5)
    .name("deltaA — accel multiplier");
  physicsFolder
    .add(config, "deltaV", 0, 100, 0.5)
    .name("deltaV — velocity scale");
  physicsFolder
    .add(config, "maxVelocity", 0, 1000, 5)
    .name("Max Velocity (px/s)");
  physicsFolder.open();

  // Gene Ranges
  const geneFolder = gui.addFolder("Gene Ranges");
  geneFolder.add(config, "visionMin", 10, 200, 1).name("Vision Min (px)");
  geneFolder.add(config, "visionMax", 10, 300, 1).name("Vision Max (px)");
  geneFolder.add(config, "sizeMin", 0.2, 3, 0.05).name("Size Min");
  geneFolder.add(config, "sizeMax", 0.2, 3, 0.05).name("Size Max");
  geneFolder.open();

  // Neural Network
  const nnFolder = gui.addFolder("Neural Network");
  nnFolder.add(config, "nnDisabled").name("Disable NN (random outputs)");
  nnFolder
    .add(config, "nnHiddenSize", 2, 32, 1)
    .name("Hidden neurons (→ restart)");
  nnFolder
    .add(config, "nnAccelScale", 10, 2000, 10)
    .name("Accel scale (px/s²)");
  nnFolder
    .add(config, "nnMutationDelta", 0.001, 0.5, 0.001)
    .name("Mutation δ (1%=0.01)");
  nnFolder.add(config, "scoreToReproduce", 1, 50, 1).name("Score to clone");
  nnFolder
    .add(config, "reproductionCooldown", 0, 120, 5)
    .name("Reprod. cooldown (s)");
  nnFolder.close();

  // Food
  const foodFolder = gui.addFolder("Food");
  foodFolder
    .add(foodStats, "count")
    .name("Total (live)")
    .listen()
    .disable(false);
  foodFolder
    .add(config, "foodInitial", 1, 200, 1)
    .name("Initial count (→ reset)");
  foodFolder.add(config, "foodMaxCount", 100, 2000, 100).name("Max count");
  foodFolder.add(config, "foodGrowthRate", 0.1, 30, 0.1).name("Growth rate");
  foodFolder.add(config, "foodSpawnSize", 2, 40, 1).name("Max size (px)");
  foodFolder.add(config, "foodSpawnRadius", 5, 300, 5).name("Spawn radius");
  foodFolder
    .add(config, "foodSpawnCooldown", 1, 60, 1)
    .name("Spawn cooldown (s)");
  foodFolder.add({ "Reset Food": () => foodManager.reset() }, "Reset Food");
  foodFolder.close();

  // Aquarium Settings
  const settingsFolder = gui.addFolder("⚙  Aquarium Settings");
  settingsFolder.add(
    {
      "Open Settings...": () =>
        openSettingsModal(config, AQUARIUM_PRESETS, () => {
          buildAquariumFn();
          saveConfig();
        }),
    },
    "Open Settings...",
  );
  settingsFolder.add(
    {
      "Reset Config": () => {
        if (confirm("Resetar todas as configurações para os valores padrão?")) {
          localStorage.removeItem(STORAGE_KEY);
          location.reload();
        }
      },
    },
    "Reset Config",
  );
  settingsFolder.open();

  // Restart / Hall of Fame actions
  gui.add(
    {
      "↺ Restart Gizmos": () => {
        if (confirm("Recriar todas as criaturas? O estado atual será perdido."))
          createGizmos();
      },
    },
    "↺ Restart Gizmos",
  );

  gui.add(
    {
      "⭐ Restaurar Melhores Genes": () => {
        if (!hallOfFame.herbivores.length && !hallOfFame.carnivores.length) {
          alert("Nenhum gene campeão registrado ainda.");
          return;
        }
        if (
          !confirm("Recriar população a partir dos melhores genes registrados?")
        )
          return;

        gizmosRef.current.forEach((g) => g.dispose());
        gizmosRef.current = [];
        clearSelection();

        const total = config.gizmoCount ?? 20;
        const carnRatio = config.carnivoreRatio ?? 0.1;
        const nCarns = Math.max(0, Math.round(total * carnRatio));
        spawnGeneration(
          hallOfFame.herbivores.length > 0 ? "herbivores" : "carnivores",
          total - nCarns,
          false,
        );
        spawnGeneration(
          hallOfFame.carnivores.length > 0 ? "carnivores" : "herbivores",
          nCarns,
          true,
        );
        hofStats.herbGeneration = (hofStats.herbGeneration ?? 1) + 1;
        hofStats.carnGeneration = (hofStats.carnGeneration ?? 1) + 1;
      },
    },
    "⭐ Restaurar Melhores Genes",
  );
  gui.onChange(() => saveConfig());
  return { openAquariumControls, closeAquariumControls: () => {}, pauseRef };
}
