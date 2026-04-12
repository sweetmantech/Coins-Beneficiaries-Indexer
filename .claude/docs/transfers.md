## Transfers

All token transfer history is unified into a single `Transfers` table. Catalog and Sound.xyz are **discontinued services** — payment history is not tracked for them; only transfer history matters.

### Schema

```graphql
type Transfers {
  # ID format differs by protocol:
  #   InProcess: ${collection}_${token_id}_${chain_id}_${txHash}   (set by TransferSingle; updated by Purchased/ERC20RewardsDeposit)
  #   Catalog:   ${collection}_${token_id}_${chain_id}_${block_number}_${log_index}
  #   Sound.xyz: ${collection}_${tier}_${chain_id}_${block_number}_${log_index}[_${i}]   (Airdropped adds recipient index)
  id: ID!
  collection: String!
  token_id: BigInt! # Sound.xyz: tier + 1 (not a real token ID)
  chain_id: Int!
  recipient: String! # token receiver
  quantity: BigInt! # token quantity
  # InProcess only — undefined for Catalog/Sound.xyz
  payer: String
  value: BigInt
  currency: String
  funds_recipient: String
  transaction_hash: String!
  block_number: BigInt!
  transferred_at: Int!
}
```

### InProcess — Two-Step Transfer Assembly

InProcess transfers are assembled in two steps within the same transaction:

1. **Step 1 — `TransferSingle`** (on `InProcessMoment`): creates the `Transfers` row with `recipient` and `quantity`; `payer/value/currency/funds_recipient` left as `undefined`. Filtered to mints only (`from = zeroAddress`).
2. **Step 2a — `Purchased`** (ETH mint on `InProcessMoment`): looks up the row by ID and fills in `payer`, `value`, `currency = zeroAddress`, `funds_recipient` from `Primary_Sales`.
3. **Step 2b — `ERC20RewardsDeposit`** (ERC20 mint on `InProcessERC20Minter`): same lookup; fills in `payer = recipient` (no buyer address in event), `value = price_per_token × quantity`, `currency`, `funds_recipient` from `Primary_Sales`.

Transfer ID for InProcess: `${collection}_${tokenId}_${chainId}_${txHash}` — shared across steps within same tx.

**Why `txHash` in the ID (not `block_number` + `log_index` like Catalog/Sound):** Step 2 runs on **different events and contracts** (`Purchased` on the moment contract, `ERC20RewardsDeposit` on the minter). They do **not** share the `TransferSingle` log index. A mint-keyed ID would force those handlers to guess or persist the mint log's `(block, logIndex)` just to perform a lookup—tight coupling and easy breakage. Using the **transaction hash as the correlation key** is deliberate: for a given `(collection, tokenId, chainId)` within one tx, all assembly steps read/write the **same** `Transfers` row. Canonical on-chain position is still stored in `transaction_hash`, `block_number`, and `transferred_at` on the entity. Helper: `lib/in_process_transfers/transferId.ts`.

Handler: `src/handlers/In_Process_Transfers.ts`

### Transfer Type Inference (InProcess only)

| `payer`  | `value` | Type                 |
| -------- | ------- | -------------------- |
| non-null | > 0     | Paid mint            |
| non-null | 0       | Free mint            |
| null     | 0       | Airdrop / admin mint |

### Catalog — All Mint Types Covered

| Function                                 | Event                                                                | Handler                |
| ---------------------------------------- | -------------------------------------------------------------------- | ---------------------- |
| `purchaseTokenWithValue()`               | `TokenPurchased`                                                     | `Catalog_Transfers.ts` |
| `lzPurchaseTokenWithValue()` (lazy mint) | `TokenPurchased` (same — calls `_purchaseTokenWithValue` internally) | `Catalog_Transfers.ts` |
| `purchaseAlbumWithValue()`               | `AlbumPurchased`                                                     | `Catalog_Transfers.ts` |
| `mintTokenAdmin()` (airdrop)             | `TokenMinted`                                                        | `Catalog_Transfers.ts` |

### Sound.xyz — All Mint Types Covered

Sound.xyz tracking uses `SoundEditionV2_1` with `start_block: 44239100` for `Minted` and `Airdropped` events, so Envio only processes those events from that block onwards.

**Why edition-level events instead of SuperMinterV2:**

- `SuperMinterV2.Minted` ⊂ `SoundEditionV2_1.Minted` — edition event fires for both SuperMinterV2 purchases AND direct admin mints
- `SuperMinterV2.PlatformAirdropped` ⊂ `SoundEditionV2_1.Airdropped` — edition event fires for both platform and direct admin airdrops
- Tracking at edition level avoids duplication and covers all cases

| Function                                                 | Event                         | Handler              |
| -------------------------------------------------------- | ----------------------------- | -------------------- |
| User purchase via SuperMinterV2 → `edition.mint()`       | `SoundEditionV2_1.Minted`     | `Sound_Transfers.ts` |
| Admin direct `edition.mint()`                            | `SoundEditionV2_1.Minted`     | `Sound_Transfers.ts` |
| Platform airdrop via SuperMinterV2 → `edition.airdrop()` | `SoundEditionV2_1.Airdropped` | `Sound_Transfers.ts` |
| Admin direct `edition.airdrop()`                         | `SoundEditionV2_1.Airdropped` | `Sound_Transfers.ts` |

**Config pattern (after 2026-04-12 refactor):** `Minted` and `Airdropped` are now part of the main `SoundEditionV2_1` contract definition — the former separate `SoundEditionV2_1Transfers` contract definition has been removed. `SoundCreatorV2.Created.contractRegister` now calls only `context.addSoundEditionV2_1()`.
