# Task 001-00 — Foundry Project Setup

**Spec:** 001 — Savings Account
**Milestone:** 0 (Setup)
**Status:** Done ✓
**Estimated effort:** 1–2 hours
**Dependencies:** None
**Parallel-safe:** No — foundational setup

---

## Objective

Initialize the Foundry project at repository root with `contracts/` as the Solidity source directory (not `backend/contracts`). Install OpenZeppelin Contracts and Chainlink dependencies.

---

## Context

The Mandinga protocol uses Foundry for Solidity development. `foundry.toml` and `contracts/` are placed at the **repo root** (`/mandinga`), alongside `script/`, `test/`, and `lib/`. Chainlink (VRF v2.5) is required by Spec 002 (SavingsCircle); installed here as a shared dependency. Spec 001 itself does not use Chainlink directly.

See: CLAUDE.md (Active Technologies).

---

## Acceptance Criteria

- [x] Foundry project initialized at `contracts/` (project root for all Solidity work)
- [x] `contracts/foundry.toml` configured as:
  ```toml
  [profile.default]
  src = "src"
  out = "out"
  test = "test"
  script = "script"
  libs = ["lib"]
  solc = "0.8.20"
  fs_permissions = [{ access = "read", path = "lib/foundry-chainlink-toolkit/out" }]
  ```
- [x] `forge install foundry-rs/forge-std` → `contracts/lib/forge-std/`
- [x] OpenZeppelin installed:
  - `contracts/lib/openzeppelin-contracts-upgradeable/` ✓ (includes `openzeppelin-contracts` as internal submodule)
  - `contracts/lib/openzeppelin-foundry-upgrades/` ✓
- [x] Chainlink installed:
  - `contracts/lib/foundry-chainlink-toolkit/` ✓
  - Actual contracts path: `lib/foundry-chainlink-toolkit/lib/chainlink-brownie-contracts/contracts/` (updated in remappings)
- [x] `contracts/remappings.txt` created
- [x] Directory structure created under `contracts/src/`:
  - `contracts/src/core/`
  - `contracts/src/yield/`
  - `contracts/src/interfaces/`
  - `contracts/src/governance/.gitkeep` — reservado para v2
- [x] `forge build` succeeds (from `contracts/`)

---

## Output Files

- `contracts/foundry.toml` ✓
- `contracts/remappings.txt` ✓
- `contracts/src/core/`, `contracts/src/yield/`, `contracts/src/interfaces/` ✓
- `contracts/src/governance/.gitkeep` ✓
- `contracts/script/` ✓
- `contracts/test/unit/`, `contracts/test/integration/`, `contracts/test/invariant/` ✓
- `contracts/lib/forge-std/` ✓
- `contracts/lib/openzeppelin-contracts-upgradeable/` ✓
- `contracts/lib/openzeppelin-foundry-upgrades/` ✓
- `contracts/lib/foundry-chainlink-toolkit/` ✓

---

## Notes

- `openzeppelin-contracts-upgradeable` inclui `openzeppelin-contracts` como submodule interno — **não instalar** `OpenZeppelin/openzeppelin-contracts` separadamente. Isso garante que ambos os remappings (`@openzeppelin/contracts/` e `@openzeppelin/contracts-upgradeable/`) apontem para a mesma release, necessário para verificação no Etherscan.
- `foundry-chainlink-toolkit` é o pacote oficial para Foundry (Chainlink docs). Remapping usa o caminho interno `lib/foundry-chainlink-toolkit/lib/chainlink-brownie-contracts/contracts/` — **diferente** do path original documentado (`lib/chainlink/contracts/`). Já corrigido em `remappings.txt`.
- Chainlink é instalado agora como dependência transversal; Spec 001 não o usa, mas Spec 002 (VRF v2.5) e Spec 006 (CRE) dependem dele.
- `fs_permissions` em `foundry.toml` é necessário para que o Foundry Chainlink Toolkit leia seus arquivos de output durante testes.
- Usar `--no-commit` em todos os `forge install`; commitar dependências em etapa separada após validar `forge build`.
- **`contracts/governance/` não tem contratos em v1.** Em v1, parâmetros "governance-configurable" (fee rate, formation threshold) são gerenciados via `Ownable`/`AccessControl` apontando para a multi-sig (3-of-5 Gnosis Safe) — sem contrato de governança dedicado. `MandigaGovernor` e `TimelockController` são v2, ativados quando `OracleAggregator` e multi-adapter entrarem.
