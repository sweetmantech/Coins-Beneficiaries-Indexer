# InProcess Indexers — Project Knowledge

## Envio Event Ordering Guarantee — Core Architectural Principle

**Envio processes all events in strict chronological order (block number → log index, ascending).** This is a fundamental guarantee of the Envio indexer runtime.

### What This Means for Handler Design

Because events always arrive in the correct order, **handlers never need to read the previous state of an entity before writing a new version.** Any `context.Entity.get()` call done purely to "merge with existing data" is unnecessary work — the latest write always wins and is always the correct one.

**Before (anti-pattern):** Many handlers used helper functions like `getLatestSale`, `getLatestAdmin`, `getValidateExistingEntity` that would:

1. Read the current entity from the DB
2. Merge new event fields onto the existing record
3. Write the merged result back

This pattern was a mistake. Because events are ordered, a later event's direct write already contains the correct final state. Reading first adds DB round-trips with zero correctness benefit.

**After (correct pattern):** Handlers now construct the entity object directly from event parameters and call `context.Entity.set()` once. When a prior entity must exist (e.g., URI updates), handlers call `context.Entity.get()` for existence validation only — not for field merging.

### Refactoring Applied (2026-04-12)

The following helper lib files were **deleted** because they existed solely to do unnecessary pre-read merges:

| Deleted file                                              | Replaced by                                    |
| --------------------------------------------------------- | ---------------------------------------------- |
| `lib/catalog_admins/getLatestAdmin.ts`                    | Inline `context.Catalog_Admins.set(entity)`    |
| `lib/catalog_collections/getValidateExistingEntity.ts`    | Inline `context.Catalog_Collections.get(id)`   |
| `lib/catalog_moments/getExistingEntity.ts`                | Inline `context.Catalog_Moments.get(id)`       |
| `lib/catalog_sales/getLatestSale.ts`                      | Inline entity construction in handler          |
| `lib/in_process_admins/getLatestAdmin.ts`                 | Inline `context.InProcess_Admins.set(entity)`  |
| `lib/in_process_collections/getValidateExistingEntity.ts` | Inline `context.InProcess_Collections.get(id)` |
| `lib/in_process_moments/getValidateExistingEntity.ts`     | Inline `context.InProcess_Moments.get(id)`     |
| `lib/in_process_sales/getLatestSale.ts`                   | `lib/in_process_sales/buildSale.ts` (pure fn)  |
| `lib/sound_admins/getLatestAdmin.ts`                      | Inline `context.Sound_Admins.set(entity)`      |
| `lib/sound_sales/getLatestSale.ts`                        | Inline entity construction in handler          |

**New file added:** `lib/in_process_sales/buildSale.ts` — a pure function (no DB reads) that constructs a `Primary_Sales` entity from a `SaleSet` event. Both `InProcessERC20Minter.SaleSet` and `InProcessCreatorFixedPriceSaleStrategy.SaleSet` handlers call this.

### Rule: When `context.Entity.get()` IS still correct

`context.Entity.get()` remains valid and necessary for two reasons:

**1. Spread reads** — `context.Entity.set()` requires a complete object. If the update event only carries a subset of fields (e.g., `URI` events carry only `value` and `id`, not `name`/`creator`/`created_at`), you must read the existing entity to spread its other fields. The existence guard (`if (!existing) return`) is separate from the read and should only be kept when the entity genuinely might not exist.

**2. Cascade reads** — Reading entity A to copy a field value into entity B (e.g., `FundingRecipientSet` reads `Sound_Editions` to propagate `funding_recipient` into `Primary_Sales`).

It is **wrong** when the sole purpose is to read your own entity just to merge in updates that could come entirely from the event itself — that is the deleted `getLatest*` anti-pattern.

### Handler-level `get()` Decision Reference (verified against contract source)

| Handler                                          | `get()` call                                    | Guard kept?        | Reason                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------ | ----------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Catalog_Collections.URI(id=0)`                  | `Catalog_Collections.get()`                     | ❌ removed         | `updateContractURI()` is post-deploy only; spread read required                                                                                                                                                                                                                                                |
| `Catalog_Collections.URI(id>0)`                  | `Catalog_Moments.get()`                         | ❌ removed         | `updateTokenURI()` is post-setup only; spread read required                                                                                                                                                                                                                                                    |
| `In_Process_Collections.ContractMetadataUpdated` | `InProcess_Collections.get()`                   | ❌ removed         | `updateContractMetadata()` is `onlyAdminOrRole`, post-deploy only; spread read required                                                                                                                                                                                                                        |
| `In_Process_Moments.URI`                         | `InProcess_Moments.get()`                       | ❌ removed         | `updateTokenURI()` is `onlyAdminOrRole(PERMISSION_BIT_METADATA)`, post-setup only; spread read required                                                                                                                                                                                                        |
| `Sound_Editions.ContractURISet`                  | `Sound_Editions.get()`                          | ❌ removed         | `setContractURI()` is `onlyRolesOrOwner(ADMIN_ROLE)`, post-deploy only; spread read required                                                                                                                                                                                                                   |
| `Sound_Editions.BaseURISet`                      | `Sound_Editions.get()`                          | ❌ removed         | `setBaseURI()` is `onlyRolesOrOwner(ADMIN_ROLE)`, post-deploy only; spread read required                                                                                                                                                                                                                       |
| `Sound_Sales.FundingRecipientSet`                | `Sound_Editions.get()`, `Secondary_Sales.get()` | ❌ removed         | Both always created in `SoundCreatorV2.Created`; `setFundingRecipient()` is post-deploy only; spread reads required                                                                                                                                                                                            |
| `Sound_Sales.RoyaltySet`                         | `Sound_Editions.get()`, `Secondary_Sales.get()` | ❌ removed         | Both always created in `SoundCreatorV2.Created`; `setRoyalty()` is post-deploy only; spread reads required                                                                                                                                                                                                     |
| `Sound_Sales.PriceSet`                           | `Primary_Sales.get()`                           | ✅ kept            | Non-DEFAULT schedules (`mode != 0`) never get a `Primary_Sales` row; update can fire for any schedule                                                                                                                                                                                                          |
| `Sound_Sales.TimeRangeSet`                       | `Primary_Sales.get()`                           | ✅ kept            | Same reason as `PriceSet`                                                                                                                                                                                                                                                                                      |
| `Sound_Sales.MaxMintablePerAccountSet`           | `Primary_Sales.get()`                           | ✅ kept            | Same reason as `PriceSet`                                                                                                                                                                                                                                                                                      |
| `Sound_Moments.TierCreated`                      | `Sound_Moments.get()`                           | ✅ kept (inverted) | Source priority: `SoundMetadata.BaseURISet` (`uri_from_metadata=true`) must not be overwritten by edition fallback URI (`uri_from_metadata=false`). Contract-level `_createTier()` has `revert TierAlreadyExists()` so duplicate `TierCreated` is impossible; the guard protects against cross-source ordering |
| `In_Process_Moments.SetupNewToken`               | `Secondary_Sales.get()` (×2)                    | ✅ kept            | First: contract-base row may not exist if factory events are in same tx. Second: copy-down guard — `UpdatedRoyalties` could theoretically create the row first                                                                                                                                                 |

---

## Codegen

Run after any `schema.graphql` change:

```bash
pnpm codegen
```

Generated types live in `generated/src/db/Entities.gen.ts`.
Type errors after schema changes are expected until codegen runs.

---

## Envio Indexing Pitfalls

### 1. `indexed` Mismatch in Event Signatures

**Always verify `indexed` against actual on-chain topics, not ABI docs.**

If a config event signature marks a param as `indexed` but the contract does not, envio will look for a topics entry that doesn't exist and either skip the event or misparse the data. The symptom is that handlers silently never fire or fields are empty/garbled.

**How to verify:** Count the topics in the on-chain log. Each `indexed` param occupies one topic slot after topics[0] (the event sig hash).

Sound.xyz examples caught:

- `BaseURISet(address indexed edition, uint8 tier, string uri)` — tier is **not** indexed (only 2 topics on-chain: sig + edition)

### 2. Factory Pattern: contractRegister Misses Same-Tx Events

When a factory deploys and initializes a new contract in the **same transaction**, events emitted by the new contract fire **before** the factory's `Created` event (lower log index). By the time `contractRegister` runs on `Created`, those earlier events have already passed and will never be re-processed.

Sound.xyz example (same tx log order):

- log 335: `SoundEditionInitialized` (new edition contract)
- log 340: `BaseURISet` (SoundMetadata, fixed address — always captured)
- log 345: `Created` (SoundCreatorV2 factory)

**Fix:** Decode `initData` bytes from the `Created` event directly instead of relying on the initialization event from the new contract.

- Implementation: `lib/sound_editions/decodeInitData.ts`
- `initData` = 4-byte function selector + ABI-encoded `EditionInitialization` struct
- Strip selector with `.slice(10)`, then use viem's `decodeAbiParameters`

---

## Protocol Details

@.claude/docs/sales.md
@.claude/docs/admins.md
@.claude/docs/sound-xyz.md
@.claude/docs/transfers.md
