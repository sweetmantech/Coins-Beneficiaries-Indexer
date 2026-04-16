## Zora Media Moments

`ZoraMedia_Moments` tracks ERC721 token registration for the Zora `Media` contract at `0xabefbc9fd2f806065b4f3c237d4b59d9a97bcac7`.

- Schema: `ZoraMedia_Moments`
- Admin schema: `ZoraMedia_Admins`
- Handler: `src/handlers/ZoraMedia_Moments.ts`
- Entity ID format: `${collection}_${tokenId}_${chainId}`

### Contract/Event Sources

The handler is driven by 3 on-chain events:

1. `Transfer(address indexed from, address indexed to, uint256 indexed tokenId)`
2. `TokenURIUpdated(uint256 indexed _tokenId, address owner, string _uri)`
3. `TokenMetadataURIUpdated(uint256 indexed _tokenId, address owner, string _uri)`

Relevant contract source:

- ERC721 standard event:
  - `contracts/ethereum/0xabefbc9fd2f806065b4f3c237d4b59d9a97bcac7/sources/@openzeppelin/contracts/token/ERC721/IERC721.sol`
- Zora Media interface:
  - `contracts/ethereum/0xabefbc9fd2f806065b4f3c237d4b59d9a97bcac7/sources/contracts/interfaces/IMedia.sol`

### Event Responsibilities

#### 1. `Transfer`

- Meaning: ERC721 ownership transfer
- Handler filter: `eventFilters: [{ from: zeroAddress }]`
- Why this matters: `from = zeroAddress` means mint, so this is the token creation signal
- Fields sourced here:
  - `id`
  - `collection`
  - `token_id`
  - `owner = event.params.to`
  - `created_at`
  - `updated_at`
  - `transaction_hash`
- `uri` and `metadata_uri` start as `undefined`

Interpretation:

- `from` = previous owner
- `to` = new owner
- on mint, previous owner does not exist, so `from = 0x0`
- therefore the initial owner is `to`
- the same `to` address is also stored as the initial token-level admin in `ZoraMedia_Admins`

#### 2. `TokenURIUpdated`

- Meaning: the token content URI changed or was emitted during mint flow
- Contract meaning comes from `IMedia.MediaData.tokenURI` and `updateTokenURI(...)`
- Fields sourced here:
  - `uri = event.params._uri`
  - `owner = event.params.owner`
- Preserves:
  - existing `metadata_uri`
  - existing `created_at`
  - original `transaction_hash` when entity already exists

#### 3. `TokenMetadataURIUpdated`

- Meaning: the token metadata URI changed or was emitted during mint flow
- Contract meaning comes from `IMedia.MediaData.metadataURI` and `updateTokenMetadataURI(...)`
- Fields sourced here:
  - `metadata_uri = event.params._uri`
  - `owner = event.params.owner`
- Preserves:
  - existing `uri`
  - existing `created_at`
  - original `transaction_hash` when entity already exists

### Tracking Priority

There are 2 useful ways to think about priority.

#### Semantic priority

1. `Transfer(from = zeroAddress)` — token existence + initial owner
2. `TokenURIUpdated` — content URI
3. `TokenMetadataURIUpdated` — metadata URI

This is the conceptual source-of-truth order:

- token must exist before its metadata matters
- mint transfer is the canonical creation signal

#### Field-level authority

- `owner` at creation time: `Transfer.to`
- `uri`: `TokenURIUpdated._uri`
- `metadata_uri`: `TokenMetadataURIUpdated._uri`

So the code is not choosing one global "best" event. It uses the best event per field.

### Why `get()` Is Used Here

`TokenURIUpdated` and `TokenMetadataURIUpdated` only carry part of the full entity shape.
Because `context.Entity.set()` requires a complete entity, the handler reads the existing row to preserve the other field.

This is a valid spread-read pattern, not the deleted `getLatest*` merge anti-pattern.

Examples:

- `TokenURIUpdated` must preserve `metadata_uri`
- `TokenMetadataURIUpdated` must preserve `uri`

### Current Limitation

This handler tracks only mint transfers, not later secondary transfers.

That means:

- `owner` is currently best interpreted as mint recipient / owner-at-registration
- it is **not guaranteed** to remain the current live owner after later transfers
- `ZoraMedia_Admins.admin` is also currently best interpreted as initial admin / mint recipient, not a live ERC721 authority graph

If true current owner tracking is needed, a second `Transfer` handler path for normal transfers must update:

- `owner = event.params.to`

### Mental Model

Read the file as a 3-step enrichment flow:

1. mint transfer registers the token
2. token URI event fills `uri`
3. metadata URI event fills `metadata_uri`

This is a token registration indexer first, not a full ownership history indexer.
