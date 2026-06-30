# Genetic Aquarium

Simulação de vida artificial onde criaturas chamadas **gizmos** navegam um aquário 2D usando redes neurais que evoluem geneticamente via crossover e mutação. Herbívoros caçam comida; carnívoros caçam herbívoros.

## Stack

- JavaScript (ES modules, sem TypeScript)
- Three.js `^0.167` — renderização 3D/2D
- lil-gui `^0.19` — painel de configurações em runtime
- Vite `^8` — build e dev server
- Vitest `^4` — testes unitários

## Comandos Essenciais

```bash
npm run dev       # dev server (http://localhost:5173)
npm run build     # build de produção → dist/
npm test          # vitest run (todos os testes)
npm run preview   # servir dist/ localmente
```

## Arquitetura

```
src/
  main.js              # entry point, monta aquarium
  Gizmo.js             # classe principal do gizmo
  NeuralNetwork.js     # rede neural (forward, crossover, clone)
  HallOfFame.js        # persistência de DNA por identidade/geração
  Identity.js          # one-hot vectors para food/herb/carn
  Food.js              # entidade comida
  constants.js         # constantes globais
  aquarium/            # setup de cena, GUI, tick de simulação
  gizmo/               # movement, inputs NN, inference, lifecycle, mesh
  ui/                  # painéis laterais, lista, canvas NN
  simulation/          # regras de respawn
  effects/             # efeitos visuais
tests/
  core/    ui/    simulation/    # espelhando src/
```

## Regras de Manutenção

### Tamanho de arquivos
- Nenhum arquivo deve ultrapassar **200 linhas** — extraia em módulos menores.

### Após cada modificação
1. `npm test` — todos os testes devem passar.
2. `npm run build` — build de produção deve ter sucesso.
3. Se comportamento mudou, adicionar/atualizar testes em `tests/`.

### Identidade (one-hot, imutável)
- Food: `[1, 0, 0]` · Herbivore: `[0, 1, 0]` · Carnivore: `[0, 0, 1]`
- Label mapping deve permanecer consistente com os vetores.

### Rede Neural
- Arquitetura fixa: **14 inputs → hidden → 3 outputs**.
- Hidden: tanh `[-1, 1]` · Output: sigmoid `[0, 1]`.
- Saídas: `ax[0]` e `ay[1]` remapeados para `[-1, 1]`; `eatDecision[2]` threshold 0.5.
- Fallback em falha de NN: `[0.5, 0.5, 0.5]`.
- Se `nnHiddenSize` mudar durante simulação: respawnar todos os gizmos, resetar Hall of Fame, limpar genes salvos.
- `clone()` deve ser deep copy; `crossover()` deve preservar dimensões — crossover por neurônio inteiro (linha de w1/w2 vem inteira de um pai, nunca mistura pesos de pais diferentes).
- Mutação Gaussiana aditiva (`weight += N(0, σ)`) com dois regimes: creep normal (σ=delta, padrão) e jump ocasional (σ=0.3, prob 5%); pesos clampeados em [-4, 4].

#### Inputs NN (todos normalizados `[0, 1]`)
| Idx | Nome | Descrição |
|-----|------|-----------|
| 0 | `c_food` | 1 se entidade mais próxima visível é comida |
| 1 | `c_herb` | 1 se é herbívoro |
| 2 | `c_carn` | 1 se é carnívoro |
| 3 | `c_prox` | proximidade: `1 - dist/visionRange`; 0 se sem alvo |
| 4 | `c_angle` | alinhamento: `(dot+1)/2`; 0 se sem alvo |
| 5 | `c_left` | 1 se alvo à esquerda/frente (cross≥0); 0 se sem alvo |
| 6 | `c_right` | 1 se alvo à direita/frente (cross≤0); 0 se sem alvo |
| 7 | `n_food` | contagem de comida na visão, normalizada 0-1 (>10=1) |
| 8 | `n_herb` | contagem de herbívoros na visão, normalizada |
| 9 | `n_carn` | contagem de carnívoros na visão, normalizada |
| 10 | `avg_d` | distância média de entidades visíveis, normalizada |
| 11 | `starv` | fome: 0=acabou de comer, 1=prestes a morrer |
| 12 | `wall` | proximidade de parede dentro do range de visão |
| 13 | `bias` | sempre 1.0 |

### Evolução / Hall of Fame
- `TOP_N = 10` por slot (herbívoros / carnívoros).
- `pickParents` usa seleção por torneio de tamanho 4.
- **Único mecanismo de reprodução: crossover do HoF ao fim de cada geração.** Gizmos não se clonam durante a vida — não existe `reproductionEnergy` nem `readyToReproduce`.
- `HallOfFame.register(gizmo)` chamado na morte; `finalizeGeneration` é no-op no modelo flat.

### Respawn
- Sempre manter dois grupos: herbívoros e carnívoros.
- Se apenas um grupo zerár: respawnar só esse grupo.
- Se ambos zerarem: respawnar ambos.

### Comportamento visual
- Corpo: círculo (2D) · Herbívoro: spike amarelo `#ffff00` arredondado · Carnívoro: spike vermelho `#ff0000` fino/pontudo.
- Círculo de visão: visível apenas com gizmo selecionado (linha sólida).
- Círculo vermelho: aparece na entidade mais próxima visível quando gizmo selecionado.
- Apenas entidades **dentro do vision range** contam como inputs NN ou alvo do círculo vermelho.

### Seleção e câmera
- Click no aquário e click na lista devem permanecer sincronizados.
- Click no aquário → fixa seleção e sincroniza highlight na lista.
- Click em item da lista → troca seleção imediatamente.
- Hover-follow só quando nenhum gizmo está fixado.
- Câmera segue o gizmo fixado.
- Sem toggle global de círculo de visão.

### Painel do gizmo selecionado (direita da tela)
- Campos: Score, Age, Time-without-eating (como barra decrescente).
- **Não mostrar**: posição, velocidade, aceleração, linhas active/sensing.
- Visualização da NN embutida abaixo do painel.
- Erros de NN: stack trace completo em `<pre>` dentro do painel + `console.error()`.

### Erros de NN
- Falha de NN de um gizmo não deve parar o loop de simulação.
- Stack trace em `gizmo._nnFaultStack`.
- Formato: `[Gizmo #ID NN ERROR] message\nstack_trace`.

### Testes
- Todos os testes em `tests/`, subpastas: `core/`, `ui/`, `simulation/`.
- Rendering tests: verificar que gizmos são adicionados à cena, têm mesh visível, geometria correta.
- NN tests: verificar inputs corretos, NN recebe inputs a cada frame, outputs válidos `[0,1]`, fallback funciona.

## Regras Críticas

- **NUNCA** commitar `.env` ou credenciais.
- Verificar este arquivo antes de alterar comportamento existente e preservar os invariantes listados.
