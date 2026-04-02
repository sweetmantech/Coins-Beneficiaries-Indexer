# InProcess Indexers — Project Knowledge

## Primary Sales

Both protocols use the unified `Primary_Sales` schema.

### InProcess/Zora

- Event: `SaleSet` from `InProcessCreatorFixedPriceSaleStrategy` or `InProcessERC20Minter`
- Fields: `sale_start`, `sale_end`, `max_tokens_per_address`, `price_per_token`, `funds_recipient`, `currency`
- Currency: ETH or ERC20 (dynamic)
- Handler: `src/handlers/In_Process_Sales.ts` → `lib/in_process_sales/getLatestSale.ts`

### Catalog

- Event: `MintConfigurationUpdated` from `USDCFixedPriceController`
- Fields: `price_per_token`, `funds_recipient`; `sale_start/end/max_tokens_per_address` set to defaults
- Currency: always USDC (hardcoded via `USDC_ADDRESSES`)
- Handler: `src/handlers/Catalog_Sales.ts` → `lib/catalog_sales/getLatestSale.ts`
- `MintConfigurationUpdated` handles **both initial setup and all updates** (no separate update event)

---

## Secondary Sales (Royalties)

Both protocols use the unified `Secondary_Sales` schema.
Entity ID format: `${collection}_${token_id}_${chainId}`

### InProcess/Zora

- Royalty is **contract-level** (tokenId=0) set via `SetupNewContract.defaultRoyaltyConfiguration`
- Tuple: `(uint32 royaltyMintSchedule, uint32 royaltyBPS, address royaltyRecipient)`
- `royaltyMintSchedule` is always zeroed out by the contract — not stored
- On `SetupNewToken`: copy tokenId=0 row to new tokenId (copy-down pattern)
- On `UpdatedRoyalties(tokenId=0)`: update contract base row only
- On `UpdatedRoyalties(tokenId=N)`: update/override that specific token row
- Primary (`funds_recipient`) and secondary (`royaltyRecipient`) are **independent addresses**
- Handler: `src/handlers/In_Process_Collections.ts` + `src/handlers/In_Process_Moments.ts`
- Events tracked in `config.yaml` under `InProcessMoment`: `UpdatedRoyalties(uint256 indexed tokenId, address indexed user, (uint32, uint32, address) configuration)`

### Catalog

- Royalty is **per-token**, same `fundsRecipient` used for both primary and secondary
- `royaltyBPS` is hardcoded at **1000 (10%)** in the contract
- `MintConfigurationUpdated` updates both `Primary_Sales` and `Secondary_Sales` simultaneously
- Primary and secondary recipient are **always the same address** — cannot be changed independently
- Handler: `src/handlers/Catalog_Sales.ts`

---

## Key Architectural Differences

|                     | InProcess/Zora                                    | Catalog                                   |
| ------------------- | ------------------------------------------------- | ----------------------------------------- |
| Primary recipient   | `SaleSet.funds_recipient`                         | `MintConfigurationUpdated.fundsRecipient` |
| Secondary recipient | `SetupNewContract.royaltyRecipient` (independent) | Same `fundsRecipient`                     |
| Can they differ?    | Yes                                               | No — always coupled                       |
| Secondary royalty % | Configurable                                      | Hardcoded 10%                             |
| Royalty level       | Contract-level default, per-token override        | Always per-token                          |
| Update events       | Separate events for primary/secondary             | Single event for both                     |

---

## Schema

```graphql
type Primary_Sales {
  id, collection, token_id, price_per_token, funds_recipient, currency,
  sale_start (nullable), sale_end (nullable), max_tokens_per_address (nullable),
  chain_id, transaction_hash, created_at
}

type Secondary_Sales {
  id, collection, token_id,
  royalty_recipient, royalty_bps,
  chain_id, updated_at, transaction_hash
}
```

## ERC-2981 Royalty Resolution (InProcess/Zora)

`CreatorRoyaltiesControl.getRoyalties(tokenId)`:

1. Returns token-specific royalty if `royaltyRecipient != address(0)`
2. Falls back to `CONTRACT_BASE_ID (tokenId=0)` default

---

---

## Admin Permissions

Both protocols track who has admin rights on a contract/token via events.
Entity ID format: `${collection}_${chainId}_${tokenId}_${user}`

### InProcess/Zora

- Contract: `ZoraCreator1155Impl` (inherits `CreatorPermissionControl`)
- Event: `UpdatedPermissions(uint256 indexed tokenId, address indexed user, uint256 indexed permissions)`
- Permission bits (power of 2):
  - `PERMISSION_BIT_ADMIN = 2` — full control, can manage all other roles
  - `PERMISSION_BIT_MINTER = 4` — `adminMint`, `setupNewToken`
  - `PERMISSION_BIT_SALES = 8` — `callSale` (configure sale strategies)
  - `PERMISSION_BIT_METADATA = 16` — update URIs, metadata, renderer
  - `PERMISSION_BIT_FUNDS_MANAGER = 32` — `setFundsRecipient`, `withdraw`
- `tokenId=0` = contract-level permission; `tokenId=N` = token-specific
- Contract-level ADMIN implicitly passes all token-level checks
- Handler filters: `permissions=2` (ADMIN grant) and `permissions=0` (removal)
- Handler: `src/handlers/In_Process_Admins.ts` → `lib/in_process_admins/getLatestAdmin.ts`
- Schema: `InProcess_Admins` — field `permission: Int`

### Catalog

- Contract: `CR1155Implementation` (inherits `PermissionController`)
- Two separate events:
  - `ContractPermissionsUpdated(address indexed user, uint256 authScope)` — contract-level, no tokenId → stored as `token_id=0`
  - `TokenPermissionsUpdated(uint256 indexed tokenId, address indexed user, uint256 authScope)` — token-level
- Auth scope bit flags:
  - `AUTH_SCOPE_OWNER = 1` — full control incl. `updateContractURI`, managing other permissions
  - `AUTH_SCOPE_ARTIST = 2` — `setupToken`, mint, configure sales/payout/URI, withdraw; can also manage permissions
  - `AUTH_SCOPE_MANAGER = 4` — `setupToken`, configure sales/referral, upgrade; **cannot** mint admin, update payout, or manage permissions
- Combined scopes possible (e.g. `OWNER|ARTIST = 3`)
- On init: `_artist` gets `OWNER|ARTIST (3)`, `catalogAdmin` gets `OWNER (1)`, `_operator` becomes Ownable owner
- Multiple addresses can hold the same scope on the same token
- `removeSingleContractAuthScope` removes one bit at a time → `authScope` can be any intermediate value
- `authScope=0` means all permissions revoked (record kept, value set to 0)
- Handler: `src/handlers/Catalog_Admins.ts` → `lib/catalog_admins/getLatestAdmin.ts`
- Schema: `Catalog_Admins` — field `auth_scope: Int`

### Removal Tracking (both protocols)

| Protocol       | Removal indicator | Record deleted?   |
| -------------- | ----------------- | ----------------- |
| InProcess/Zora | `permissions = 0` | No — updated to 0 |
| Catalog        | `authScope = 0`   | No — updated to 0 |

Query active admins: `permission != 0` / `auth_scope != 0`

### Admin Architecture Comparison

|                            | InProcess/Zora                       | Catalog                                         |
| -------------------------- | ------------------------------------ | ----------------------------------------------- |
| Roles                      | 5 fine-grained bits                  | 3 broad scopes                                  |
| "Super admin"              | `PERMISSION_BIT_ADMIN (2)`           | `AUTH_SCOPE_OWNER (1)`                          |
| Contract-level event       | `UpdatedPermissions(tokenId=0, ...)` | `ContractPermissionsUpdated(user, scope)`       |
| Token-level event          | `UpdatedPermissions(tokenId=N, ...)` | `TokenPermissionsUpdated(tokenId, user, scope)` |
| Who can manage permissions | ADMIN only                           | OWNER or ARTIST                                 |
| Funds/withdraw role        | Separate `FUNDS_MANAGER`             | Any OWNER or ARTIST                             |

---

## Sound.xyz Protocol

### Contract Architecture

Sound.xyz uses **ERC721A** (not ERC1155, unlike Zora/Catalog).

- Each artist/album deploys an independent edition contract (`SoundEditionV2_1`)
- Factory: `SoundCreatorV2` → track new editions via `Created` event

|                | Sound.xyz                            | InProcess/Zora                             | Catalog                  |
| -------------- | ------------------------------------ | ------------------------------------------ | ------------------------ |
| Token standard | ERC721A (each token has a unique ID) | ERC1155 (fungible editions)                | ERC1155                  |
| Edition unit   | 1 contract per edition               | 1 contract per creator (multiple tokenIds) | 1 contract per creator   |
| Pricing        | External minter contracts            | SaleStrategy contracts                     | USDCFixedPriceController |

---

### Collection Initialization

- **Factory event**: `Created(address indexed implementation, address indexed edition, address indexed owner, bytes initData, ...)` from `SoundCreatorV2`
- **Edition init event**: `SoundEditionInitialized(EditionInitialization init)` from `SoundEditionV2_1`
  - `init` fields: `name`, `symbol`, `baseURI`, `contractURI`, `fundingRecipient`, `royaltyBPS`, `metadataModule`, `tierCreations[]`

---

### Tier System (Sound.xyz-specific concept)

- Each edition has one or more **Tiers** (uint8)
- Tier 0 = GA (General Admission) — the default/base tier
- Higher tiers (1, 2, ...) = VIP or premium tiers
- Per-tier config: `maxMintableLower`, `maxMintableUpper`, `cutoffTime`, `mintRandomnessEnabled`, `isFrozen`
- Before `cutoffTime`: `maxMintableUpper` cap applies; after: drops to `maxMintableLower`
- Tiers can be added dynamically: `TierCreated(TierCreation creation)` event

---

### Primary Sales

The edition contract itself has **no price information**.
Pricing/sale configuration is handled by **external Minter contracts**.

#### V2 Minter: SuperMinterV2 (current)

In V2, all mint types are handled by a single **`SuperMinterV2`** contract.

- Address (all chains): `0x000000000001A36777f9930aAEFf623771b13e70`
- Source: `contracts/sound.xyz/contracts/modules/SuperMinterV2.sol`
- Must be granted `MINTER_ROLE` on the edition

**Mint Modes** (stored as `uint8 mode` on each schedule):

| Value | Constant           | Description                                                       |
| ----- | ------------------ | ----------------------------------------------------------------- |
| 0     | `DEFAULT`          | Public open mint. GA tier: price=0, unlimited supply, endTime=max |
| 1     | `VERIFY_MERKLE`    | Allowlist via Merkle proof                                        |
| 2     | `VERIFY_SIGNATURE` | Signature-gated. Supports signed price override                   |
| 3     | `PLATFORM_AIRDROP` | Free platform airdrop, signed by platform signer                  |

**Key Concepts:**

- `scheduleNum` — per-tier incrementing sequence number (not global). Identified by `(edition, tier, scheduleNum)`
- **GA tier price** is **platform-level**, not per-edition: `gaPrice[platform]` set via `setGAPrice`. NOT stored per schedule
- Non-GA tier price is per-schedule: stored in `MintData.price`
- `VERIFY_SIGNATURE` mode allows a per-tx `signedPrice` that overrides the floor price

**Sale Creation Event:**

```
MintCreated(
  address indexed edition,
  uint8 tier,           // NOT indexed (verified on-chain)
  uint8 scheduleNum,
  MintCreation c   // tuple field order (verified via ABI):
                   // edition(address), price(uint96), startTime(uint32), endTime(uint32),
                   // maxMintablePerAccount(uint32), maxMintable(uint32), affiliateFeeBPS(uint16),
                   // affiliateMerkleRoot(bytes32), tier(uint8), platform(address),
                   // mode(uint8), merkleRoot(bytes32)
)
```

**Sale Update Events:**

```
PriceSet(address indexed edition, uint8 tier, uint8 scheduleNum, uint96 price)
TimeRangeSet(address indexed edition, uint8 tier, uint8 scheduleNum, uint32 startTime, uint32 endTime)
MaxMintableSet(address indexed edition, uint8 tier, uint8 scheduleNum, uint32 value)
MaxMintablePerAccountSet(address indexed edition, uint8 tier, uint8 scheduleNum, uint32 value)
PausedSet(address indexed edition, uint8 tier, uint8 scheduleNum, bool paused)
MerkleRootSet(address indexed edition, uint8 tier, uint8 scheduleNum, bytes32 merkleRoot)
GAPriceSet(address indexed platform, uint96 price)   // GA price, platform-level
```

> **Note on `indexed`:** edition is indexed in all update events. Verified via Basescan ABI (not contract source docs).

**Mint Event (actual purchase):**

```
Minted(
  address indexed edition,
  uint8 indexed tier,
  uint8 scheduleNum,
  address indexed to,
  MintedLogData l,      // { fromTokenId, quantity, unitPrice, requiredEtherValue,
                        //   finalArtistFee, finalPlatformFee, finalAffiliateFee,
                        //   affiliate, affiliated, allowlisted, allowlistedQuantity,
                        //   signedClaimTicket }
  uint256 attributionId
)
```

**Platform Airdrop Event:**

```
PlatformAirdropped(address edition, uint8 tier, uint8 scheduleNum, address[] to, uint32 quantity, uint256 fromTokenId)
```

#### V1 Minters (legacy — separate contracts per mint type)

Located in `contracts/sound.xyz/contracts/modules/`. Used with `SoundEditionV1`.

| Contract                    | Address (Mainnet & Goerli)                   | Use case                                         |
| --------------------------- | -------------------------------------------- | ------------------------------------------------ |
| `EditionMaxMinter`          | `0x5e5d50ea70c9a1b6ed64506f121b094156b8fd20` | Public fixed-price, edition-wide supply cap      |
| `RangeEditionMinter`        | `0x4552f8b70a72a8ea1084bf7b7ba50f10f2f9daa7` | Fixed-price with `cutoffTime`-based supply range |
| `FixedPriceSignatureMinter` | `0xc8ae7e42e834bc11c906d01726e55571a0620158` | Fixed-price, ECDSA signature-gated               |
| `MerkleDropMinter`          | `0xda4b6fbb85918700e5ee91f6ce3cc2148af02912` | Fixed-price, Merkle proof allowlist              |

**Common fields across all V1 minters:**

- `edition` — the `SoundEditionV1` contract address (= collection)
- `mintId` — global incrementing ID within the minter contract
- `price` — ETH price per token (uint96)
- `startTime` / `endTime` — sale window

Key V1 minter creation events:

- `EditionMaxMintCreated(edition, mintId, price, startTime, endTime, affiliateFeeBPS, maxMintablePerAccount)`
- `RangeEditionMintCreated(edition, mintId, price, startTime, cutoffTime, endTime, affiliateFeeBPS, maxMintableLower, maxMintableUpper, maxMintablePerAccount)`
- `FixedPriceSignatureMintCreated(edition, mintId, price, signer, maxMintable, startTime, endTime, affiliateFeeBPS)`
- `MerkleDropMintCreated(edition, mintId, merkleRootHash, price, startTime, endTime, affiliateFeeBPS, maxMintable, maxMintablePerAccount)`

**Price update event (shared):** `PriceSet(address edition, uint128 mintId, uint96 price)`

Events emitted on the edition contract during minting:

- V2: `Minted(uint8 tier, address to, uint256 quantity, uint256 fromTokenId)`
- V1: `Minted(uint8 tier, address to, uint256 quantity, uint256 fromTokenId)` (same signature)

---

### Secondary Sales (Royalties)

- **Edition-level** royalty (per-edition, not per-token)
- Single `fundingRecipient` receives **both** primary proceeds and secondary royalties (same as Catalog)
- `royaltyBPS` is **configurable** (unlike Catalog's hardcoded 1000)
- ERC-2981 compliant: `royaltyInfo(tokenId, salePrice)` → `(fundingRecipient, royaltyAmount)`
- Set at initialization via `SoundEditionInitialized`; subsequent update events:
  - `FundingRecipientSet(address recipient)`
  - `RoyaltySet(uint16 bps)`

---

### Admin / Roles System

- Library: `solady/OwnableRoles` (Owner + bitmask roles)
- **Owner**: implicitly holds all privileges
- **Role bits** (two roles):
  - `ADMIN_ROLE = 1` (1 << 0) — can update metadata, tiers, royalties, `fundingRecipient`, and other edition settings
  - `MINTER_ROLE = 2` (1 << 1) — can call `mint()` and `airdrop()`
- Roles can be combined: `ADMIN_ROLE | MINTER_ROLE = 3`
- Role management functions: `grantRoles`, `revokeRoles` (from OwnableRoles)
- Event: `RolesUpdated(address indexed user, uint256 indexed roles)` (from `OwnableRoles`)
  - Emits the **full current roles bitmap** whenever roles are granted or revoked
  - `roles = 0` → all permissions revoked
- Note: No `tokenId` concept unlike InProcess/Zora's `UpdatedPermissions` — roles are edition-level only

---

### Deployed Contract Addresses

Sound.xyz uses **CREATE2 deterministic deployment** — same addresses on all supported chains.

**Supported chains:** Ethereum Mainnet, Optimism, Goerli, Optimism-Goerli, Sepolia

#### V2 Core Contracts

| Contract                               | Address                                      |
| -------------------------------------- | -------------------------------------------- |
| `SoundCreatorV2` (factory)             | `0x0000000000aec84F5BFc2af15EAfb943bf4e3522` |
| `SoundEditionV2_1` (implementation)    | `0x000000000053C8B49473BDa4b8d1DC47CAb411CC` |
| `SoundEditionV2` (older impl)          | `0x0000000000c78FEE168002D89D141517b8E6E0FE` |
| `SuperMinterV2`                        | `0x000000000001A36777f9930aAEFf623771b13e70` |
| `SuperMinter` (V1 consolidated minter) | `0x0000000000CF4558c36229ac0026ee16D3aE35Cd` |
| `SoundMetadata`                        | `0x0000000000f5A96Dc85959cAeb0Cfe680f108FB5` |
| `SoundOnChainMetadata`                 | `0x0000000000724868d80283B098Ffa809B2181692` |

#### V1 Minter Contracts (Mainnet & Goerli)

| Contract                    | Address                                      |
| --------------------------- | -------------------------------------------- |
| `EditionMaxMinter`          | `0x5e5d50ea70c9a1b6ed64506f121b094156b8fd20` |
| `RangeEditionMinter`        | `0x4552f8b70a72a8ea1084bf7b7ba50f10f2f9daa7` |
| `FixedPriceSignatureMinter` | `0xc8ae7e42e834bc11c906d01726e55571a0620158` |
| `MerkleDropMinter`          | `0xda4b6fbb85918700e5ee91f6ce3cc2148af02912` |
| `SoundFeeRegistry`          | `0x8f921211c9771baeb648ac7becb322a540298a4b` |

#### Shared / External

| Contract               | Address                                      |
| ---------------------- | -------------------------------------------- |
| `SplitMain` (0xSplits) | `0x2ed6c4B5dA6378c7897AC67Ba9e43102Feb694EE` |

---

### Sound.xyz Event Summary

| Event                                                 | Contract           | Purpose                                                                 |
| ----------------------------------------------------- | ------------------ | ----------------------------------------------------------------------- |
| `Created(implementation, edition, owner, ...)`        | `SoundCreatorV2`   | New edition deployed                                                    |
| `SoundEditionInitialized(EditionInitialization)`      | `SoundEditionV2_1` | Edition initialized (name, symbol, fundingRecipient, royaltyBPS, tiers) |
| `BaseURISet(address edition, uint8 tier, string uri)` | `SoundMetadata`    | Per-tier base URI set — source of Sound_Moments rows                    |

---

### Sound.xyz Indexer Implementation

#### Schema Tables

```graphql
type Sound_Editions {
  id: ID! # ${edition}_${chainId}
  address: String!
  name: String!
  owner: String! # from SoundCreatorV2.Created
  uri: String! # contractURI — collection metadata (OpenSea etc.)
  base_uri: String! # token baseURI — edition-level fallback for tokenURI resolution
  funding_recipient: String!
  royalty_bps: Int!
  chain_id: Int!
  created_at: Int!
  updated_at: Int!
  transaction_hash: String!
}

type Sound_Moments {
  id: ID! # ${edition}_${tier}_${chainId}
  collection: String! @index
  tier: Int! # 0=GA, 1+=premium (uint8 category, NOT a token ID)
  uri: String! # SoundMetadata per-tier URI if uri_from_metadata=true, else edition base_uri/${tier}
  uri_from_metadata: Boolean! # true = set by SoundMetadata.BaseURISet; false = edition fallback
  chain_id: Int!
  created_at: Int!
  updated_at: Int!
  transaction_hash: String!
}
```

#### Key Distinctions

- **tier**: uint8 category (0=GA, 1+=premium). One `Sound_Moments` row per tier per edition.
- No per-token rows — Sound.xyz tokens are grouped by tier, not tracked individually.
- `_createTier()` does **not** set a URI — tier creation and URI assignment are separate operations.

#### URI Resolution Design (two-source)

Sound.xyz has two independent URI sources that must be tracked separately:

| Source | Contract | Event | Field |
|--------|---------|-------|-------|
| Per-tier URI | `SoundMetadata` (fixed address) | `BaseURISet(address indexed edition, uint8 tier, string uri)` | `Sound_Moments.uri` |
| Edition fallback URI | `SoundEditionV2_1` (per edition) | `BaseURISet(string baseURI)` | `Sound_Editions.base_uri` |

**On-chain resolution logic** (`SoundMetadata.tokenURI`):
1. If per-tier URI exists → use it (format: `uri + tokenIndex`)
2. Else fall back to edition `baseURI` (format: `uri + tokenId + "_" + tier`)

**Indexer mirrors this with `uri_from_metadata`:**
- `uri_from_metadata = true`: `Sound_Moments.uri` holds the SoundMetadata per-tier URI
- `uri_from_metadata = false`: `Sound_Moments.uri` holds `Sound_Editions.base_uri/${tier}` at time of creation

When `SoundEditionV2_1.BaseURISet` fires, all Sound_Moments for that edition with `uri_from_metadata = false` are updated via `getWhere.collection.eq(address)` + in-memory filter.

#### URI Format

```
SoundMetadata.BaseURISet(edition, tier=0, uri="ar://...hash/"):
  Sound_Moments.uri = "ar://...hash/0"   (uri_from_metadata=true)

TierCreated with edition base_uri="ar://...fallback/":
  Sound_Moments.uri = "ar://...fallback/1"   (uri_from_metadata=false)
```

#### Two `BaseURISet` Events — Do Not Confuse

There are **two distinct `BaseURISet` events** with different signatures:

| Event                | Contract                         | Signature                                                     |
| -------------------- | -------------------------------- | ------------------------------------------------------------- |
| Tier URI (primary)   | `SoundMetadata` (fixed address)  | `BaseURISet(address indexed edition, uint8 tier, string uri)` |
| Edition fallback URI | `SoundEditionV2_1` (per edition) | `BaseURISet(string baseURI)`                                  |

> **Note on `indexed`:** `tier` in `SoundMetadata.BaseURISet` is **not** indexed on-chain despite appearing `indexed` in source — only 2 topics (sig + edition). Config must NOT mark `tier` as indexed.

#### Tier Creation

- `initialize()` → calls `_createTier()` for each entry in `tierCreations[]` — **no `TierCreated` event emitted**
- `createTier()` (post-deploy) → calls `_createTier()` + emits `TierCreated(TierCreation creation)`
- `TierCreation` tuple fields (by index): `[0]=tier, [1]=maxMintableLower, [2]=maxMintableUpper, [3]=cutoffTime, [4]=mintRandomnessEnabled, [5]=isFrozen`
- Envio decodes the tuple as an array — use `event.params.creation[0]` for tier (named field access does not work)
- Initial tiers are decoded from `initData` in `SoundCreatorV2.Created` via `lib/sound_editions/decodeInitData.ts`

#### Edition-level `contractURI` — Collection Metadata

`Sound_Editions.uri` is set at initialization from `initData.contractURI` (decoded from `SoundCreatorV2.Created`).

After initialization, updates via `SoundEditionV2_1.setContractURI(string)` emit `ContractURISet(string contractURI)` — **tracked** in `src/handlers/Sound_Editions.ts`.

`Sound_Editions.base_uri` (token baseURI) is separate — set from `initData.baseURI` and updated via `SoundEditionV2_1.BaseURISet(string baseURI)`.

#### Handler Files

- `src/handlers/Sound_Editions.ts`
  - `SoundCreatorV2.Created` — create Sound_Editions (decodes initData for name, contractURI, baseURI, fundingRecipient, royaltyBPS)
  - `SoundEditionV2_1.ContractURISet` — update Sound_Editions.uri
  - `SoundEditionV2_1.BaseURISet` — update Sound_Editions.base_uri + update non-metadata Sound_Moments URIs
- `src/handlers/Sound_Moments.ts`
  - `SoundMetadata.BaseURISet` — upsert Sound_Moments per tier (uri_from_metadata=true)
  - `SoundEditionV2_1.TierCreated` — create Sound_Moments for post-deploy tiers (uri_from_metadata=false, uri from edition base_uri)

#### Envio getWhere Limitation

`context.Entity.getWhere` supports only **single `@index` field** with `eq/gt/lt`. Multi-field AND filtering is not supported. Use `getWhere` on the indexed field then filter in memory:

```typescript
const moments = await context.Sound_Moments.getWhere.collection.eq(address);
for (const moment of moments) {
  if (moment.chain_id !== event.chainId || moment.uri_from_metadata) continue;
  // ...
}
```

#### Config (Base Mainnet 8453)

- Network `start_block: 7272930` (SoundCreatorV2 deployment block on Base)
- SoundCreatorV2, SoundEditionV2_1, SoundMetadata inherit network start_block (no override needed)
- Catalog contracts set `start_block: 18357751`, InProcess contracts set `start_block: 27712746`

---

### Sound.xyz vs Existing Protocols

|                     | InProcess/Zora                              | Catalog                    | Sound.xyz                            |
| ------------------- | ------------------------------------------- | -------------------------- | ------------------------------------ |
| Token standard      | ERC1155                                     | ERC1155                    | ERC721A                              |
| Edition unit        | tokenId within a contract                   | tokenId within a contract  | Independent contract per edition     |
| Primary recipient   | `SaleSet.funds_recipient` (independent)     | `fundsRecipient` (coupled) | `fundingRecipient` (coupled)         |
| Secondary recipient | `royaltyRecipient` (independent)            | Same `fundsRecipient`      | Same `fundingRecipient`              |
| Pricing location    | SaleStrategy contracts                      | USDCFixedPriceController   | External Minter contracts (separate) |
| Royalty BPS         | Configurable                                | Hardcoded 10%              | Configurable                         |
| Royalty level       | Contract-level default + per-token override | Always per-token           | Edition-level (single)               |
| Permission system   | `UpdatedPermissions` (with tokenId)         | 2 events (contract/token)  | `RolesUpdated` (edition-level only)  |
| "Super admin"       | `PERMISSION_BIT_ADMIN = 2`                  | `AUTH_SCOPE_OWNER = 1`     | Contract `owner` (Ownable)           |
| Sub-roles           | 5 (ADMIN/MINTER/SALES/META/FUNDS)           | 3 (OWNER/ARTIST/MANAGER)   | 2 (ADMIN_ROLE=1, MINTER_ROLE=2)      |
| Token grouping      | By tokenId                                  | By tokenId                 | By tier (uint8); IDs are sequential  |

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
