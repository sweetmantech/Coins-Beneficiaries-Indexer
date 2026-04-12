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
- Handler: `src/handlers/In_Process_Admins.ts` — direct `context.InProcess_Admins.set(entity)`, no lib helper
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
- Handler: `src/handlers/Catalog_Admins.ts` — direct `context.Catalog_Admins.set(entity)`, no lib helper
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
