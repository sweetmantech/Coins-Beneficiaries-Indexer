import assert from "assert";
import { TestHelpers } from "generated";
import type {
  Catalog_Admins,
  Catalog_Albums,
  Catalog_Collections,
  Catalog_Moments,
  Primary_Sales,
  Transfers,
} from "generated";
import { encodeFunctionData, maxUint256, zeroAddress } from "viem";
import { crFactoryAbi } from "../lib/abi/crFactoryAbi";
import {
  USDC_ADDRESSES,
  AUTH_SCOPE_OWNER,
  AUTH_SCOPE_ARTIST,
  AUTH_SCOPE_MANAGER,
} from "../lib/consts";

const { MockDb, CatalogReleaseFactory, CatalogRelease1155, USDCFixedPriceController } = TestHelpers;

const COLLECTION = "0x1234567890123456789012345678901234567890";
const CREATOR = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
const ARTIST = "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";

describe("Catalog Event Handler Tests", () => {
  describe("CatalogReleaseFactory.CRContractCreated", () => {
    it("should create Catalog_Collections entity with name decoded from calldata", async () => {
      const mockDb = MockDb.createMockDb();

      const collectionName = "My Catalog Release";
      const input = encodeFunctionData({
        abi: crFactoryAbi,
        functionName: "deployReleaseContractWithCalls",
        args: [ARTIST, CREATOR, "ipfs://contract-uri", collectionName, []],
      });

      const event = CatalogReleaseFactory.CRContractCreated.createMockEvent({
        _contractAddress: COLLECTION,
        _creator: CREATOR,
      });

      (event.transaction as { input: string }).input = input;

      const mockDbUpdated = await CatalogReleaseFactory.CRContractCreated.processEvent({
        event,
        mockDb,
      });

      const collection = COLLECTION.toLowerCase();
      const entityId = `${collection}_${event.chainId}`;
      const actualEntity = await mockDbUpdated.entities.Catalog_Collections.get(entityId);

      const expectedEntity: Catalog_Collections = {
        id: entityId,
        address: collection,
        name: collectionName,
        creator: CREATOR.toLowerCase(),
        uri: "",
        chain_id: event.chainId,
        created_at: event.block.timestamp,
        updated_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
      };

      assert.deepEqual(actualEntity, expectedEntity);
    });

    it("should store empty name when calldata cannot be decoded", async () => {
      const mockDb = MockDb.createMockDb();

      const event = CatalogReleaseFactory.CRContractCreated.createMockEvent({
        _contractAddress: COLLECTION,
        _creator: CREATOR,
      });

      (event.transaction as { input: string }).input = "0xdeadbeef";

      const mockDbUpdated = await CatalogReleaseFactory.CRContractCreated.processEvent({
        event,
        mockDb,
      });

      const collection = COLLECTION.toLowerCase();
      const entityId = `${collection}_${event.chainId}`;
      const actualEntity = await mockDbUpdated.entities.Catalog_Collections.get(entityId);

      assert.ok(actualEntity, "entity should exist");
      assert.equal(actualEntity.name, "", "name should be empty when calldata is undecodable");
    });
  });

  describe("CatalogRelease1155.URI (id = 0 — contract URI)", () => {
    it("should update Catalog_Collections uri", async () => {
      const newUri = "ipfs://updated-contract-uri";
      const collection = COLLECTION.toLowerCase();

      const event = CatalogRelease1155.URI.createMockEvent({
        value: newUri,
        id: 0n,
      });

      (event as { srcAddress: string }).srcAddress = COLLECTION;
      (event.block as { timestamp: number }).timestamp = 1000;

      const mockDb = MockDb.createMockDb().entities.Catalog_Collections.set({
        id: `${collection}_${event.chainId}`,
        address: collection,
        name: "My Release",
        creator: CREATOR.toLowerCase(),
        uri: "",
        chain_id: event.chainId,
        created_at: 0,
        updated_at: 0,
        transaction_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      });

      const mockDbUpdated = await CatalogRelease1155.URI.processEvent({ event, mockDb });

      const entityId = `${collection}_${event.chainId}`;
      const actualEntity = await mockDbUpdated.entities.Catalog_Collections.get(entityId);

      assert.ok(actualEntity, "entity should exist");
      assert.equal(actualEntity.uri, newUri, "uri should be updated");
      assert.equal(
        actualEntity.updated_at,
        event.block.timestamp,
        "updated_at should be refreshed"
      );
    });
  });

  describe("CatalogRelease1155.TokenCreated", () => {
    it("should create Catalog_Moments entity correctly", async () => {
      const mockDb = MockDb.createMockDb();
      const tokenId = 1n;
      const tokenUri = "ipfs://token-uri";

      const event = CatalogRelease1155.TokenCreated.createMockEvent({
        _tokenId: tokenId,
        _contract: COLLECTION,
        _artist: ARTIST,
        _uri: tokenUri,
        _contentHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      });

      (event as { srcAddress: string }).srcAddress = COLLECTION;

      const mockDbUpdated = await CatalogRelease1155.TokenCreated.processEvent({ event, mockDb });

      const collection = COLLECTION.toLowerCase();
      const entityId = `${collection}_${tokenId}_${event.chainId}`;
      const actualEntity = await mockDbUpdated.entities.Catalog_Moments.get(entityId);

      const expectedEntity: Catalog_Moments = {
        id: entityId,
        collection,
        token_id: tokenId,
        artist: ARTIST.toLowerCase(),
        uri: tokenUri,
        chain_id: event.chainId,
        created_at: event.block.timestamp,
        updated_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
      };

      assert.deepEqual(actualEntity, expectedEntity);
    });
  });

  describe("CatalogRelease1155.URI (id > 0 — token URI)", () => {
    it("should update Catalog_Moments uri", async () => {
      const tokenId = 1n;
      const newUri = "ipfs://updated-token-uri";
      const collection = COLLECTION.toLowerCase();

      const event = CatalogRelease1155.URI.createMockEvent({
        value: newUri,
        id: tokenId,
      });

      (event as { srcAddress: string }).srcAddress = COLLECTION;
      (event.block as { timestamp: number }).timestamp = 1000;

      const mockDb = MockDb.createMockDb().entities.Catalog_Moments.set({
        id: `${collection}_${tokenId}_${event.chainId}`,
        collection,
        token_id: tokenId,
        artist: ARTIST.toLowerCase(),
        uri: "ipfs://old-uri",
        chain_id: event.chainId,
        created_at: 0,
        updated_at: 0,
        transaction_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      });

      const mockDbUpdated = await CatalogRelease1155.URI.processEvent({ event, mockDb });

      const entityId = `${collection}_${tokenId}_${event.chainId}`;
      const actualEntity = await mockDbUpdated.entities.Catalog_Moments.get(entityId);

      assert.ok(actualEntity, "entity should exist");
      assert.equal(actualEntity.uri, newUri, "uri should be updated");
      assert.equal(
        actualEntity.updated_at,
        event.block.timestamp,
        "updated_at should be refreshed"
      );
    });
  });

  describe("CatalogRelease1155.ContractPermissionsUpdated", () => {
    it("should create Catalog_Admins entity at token_id=0 (contract-level)", async () => {
      const mockDb = MockDb.createMockDb();
      const collection = COLLECTION.toLowerCase();

      const event = CatalogRelease1155.ContractPermissionsUpdated.createMockEvent({
        user: ARTIST,
        authScope: BigInt(AUTH_SCOPE_OWNER | AUTH_SCOPE_ARTIST),
      });
      (event as { srcAddress: string }).srcAddress = COLLECTION;

      const mockDbUpdated = await CatalogRelease1155.ContractPermissionsUpdated.processEvent({
        event,
        mockDb,
      });

      const entityId = `${collection}_${event.chainId}_0_${ARTIST.toLowerCase()}`;
      const actualEntity = await mockDbUpdated.entities.Catalog_Admins.get(entityId);

      const expectedEntity: Catalog_Admins = {
        id: entityId,
        collection,
        token_id: 0n,
        admin: ARTIST.toLowerCase(),
        chain_id: event.chainId,
        auth_scope: AUTH_SCOPE_OWNER | AUTH_SCOPE_ARTIST,
        updated_at: event.block.timestamp,
      };

      assert.deepEqual(actualEntity, expectedEntity);
    });

    it("should update auth_scope when a newer event arrives", async () => {
      const collection = COLLECTION.toLowerCase();

      const event = CatalogRelease1155.ContractPermissionsUpdated.createMockEvent({
        user: ARTIST,
        authScope: BigInt(AUTH_SCOPE_OWNER),
      });
      (event as { srcAddress: string }).srcAddress = COLLECTION;
      (event.block as { timestamp: number }).timestamp = 2000;

      const entityId = `${collection}_${event.chainId}_0_${ARTIST.toLowerCase()}`;
      const mockDb = MockDb.createMockDb().entities.Catalog_Admins.set({
        id: entityId,
        collection,
        token_id: 0n,
        admin: ARTIST.toLowerCase(),
        chain_id: event.chainId,
        auth_scope: AUTH_SCOPE_OWNER | AUTH_SCOPE_ARTIST,
        updated_at: 1000,
      });

      const mockDbUpdated = await CatalogRelease1155.ContractPermissionsUpdated.processEvent({
        event,
        mockDb,
      });

      const actualEntity = await mockDbUpdated.entities.Catalog_Admins.get(entityId);
      assert.equal(actualEntity?.auth_scope, AUTH_SCOPE_OWNER, "auth_scope should be updated");
      assert.equal(actualEntity?.updated_at, 2000, "updated_at should be refreshed");
    });

    it("should update auth_scope when timestamps are equal (same block)", async () => {
      const collection = COLLECTION.toLowerCase();

      const event = CatalogRelease1155.ContractPermissionsUpdated.createMockEvent({
        user: ARTIST,
        authScope: BigInt(AUTH_SCOPE_OWNER),
      });
      (event as { srcAddress: string }).srcAddress = COLLECTION;

      const entityId = `${collection}_${event.chainId}_0_${ARTIST.toLowerCase()}`;
      const mockDb = MockDb.createMockDb().entities.Catalog_Admins.set({
        id: entityId,
        collection,
        token_id: 0n,
        admin: ARTIST.toLowerCase(),
        chain_id: event.chainId,
        auth_scope: AUTH_SCOPE_OWNER | AUTH_SCOPE_ARTIST,
        updated_at: event.block.timestamp, // same block
      });

      const mockDbUpdated = await CatalogRelease1155.ContractPermissionsUpdated.processEvent({
        event,
        mockDb,
      });

      const actualEntity = await mockDbUpdated.entities.Catalog_Admins.get(entityId);
      assert.equal(
        actualEntity?.auth_scope,
        AUTH_SCOPE_OWNER,
        "same-block update should overwrite"
      );
    });

    it("should skip pure MANAGER scope (cannot airdrop)", async () => {
      const mockDb = MockDb.createMockDb();
      const collection = COLLECTION.toLowerCase();

      const event = CatalogRelease1155.ContractPermissionsUpdated.createMockEvent({
        user: ARTIST,
        authScope: BigInt(AUTH_SCOPE_MANAGER),
      });
      (event as { srcAddress: string }).srcAddress = COLLECTION;

      const mockDbUpdated = await CatalogRelease1155.ContractPermissionsUpdated.processEvent({
        event,
        mockDb,
      });

      const entityId = `${collection}_${event.chainId}_0_${ARTIST.toLowerCase()}`;
      const actualEntity = await mockDbUpdated.entities.Catalog_Admins.get(entityId);
      assert.equal(actualEntity, undefined, "pure MANAGER entity should not be stored");
    });

    it("should set auth_scope=0 when admin is removed", async () => {
      const mockDb = MockDb.createMockDb();
      const collection = COLLECTION.toLowerCase();

      const event = CatalogRelease1155.ContractPermissionsUpdated.createMockEvent({
        user: ARTIST,
        authScope: 0n,
      });
      (event as { srcAddress: string }).srcAddress = COLLECTION;

      const mockDbUpdated = await CatalogRelease1155.ContractPermissionsUpdated.processEvent({
        event,
        mockDb,
      });

      const entityId = `${collection}_${event.chainId}_0_${ARTIST.toLowerCase()}`;
      const actualEntity = await mockDbUpdated.entities.Catalog_Admins.get(entityId);

      assert.ok(actualEntity, "entity should still exist after removal");
      assert.equal(actualEntity.auth_scope, 0, "auth_scope should be 0 when removed");
    });
  });

  describe("CatalogRelease1155.TokenPermissionsUpdated", () => {
    it("should create Catalog_Admins entity at the given token_id", async () => {
      const mockDb = MockDb.createMockDb();
      const collection = COLLECTION.toLowerCase();
      const tokenId = 3n;

      const event = CatalogRelease1155.TokenPermissionsUpdated.createMockEvent({
        tokenId,
        user: ARTIST,
        authScope: BigInt(AUTH_SCOPE_ARTIST),
      });
      (event as { srcAddress: string }).srcAddress = COLLECTION;

      const mockDbUpdated = await CatalogRelease1155.TokenPermissionsUpdated.processEvent({
        event,
        mockDb,
      });

      const entityId = `${collection}_${event.chainId}_${tokenId}_${ARTIST.toLowerCase()}`;
      const actualEntity = await mockDbUpdated.entities.Catalog_Admins.get(entityId);

      const expectedEntity: Catalog_Admins = {
        id: entityId,
        collection,
        token_id: tokenId,
        admin: ARTIST.toLowerCase(),
        chain_id: event.chainId,
        auth_scope: AUTH_SCOPE_ARTIST,
        updated_at: event.block.timestamp,
      };

      assert.deepEqual(actualEntity, expectedEntity);
    });

    it("should skip pure MANAGER scope (cannot airdrop)", async () => {
      const mockDb = MockDb.createMockDb();
      const collection = COLLECTION.toLowerCase();
      const tokenId = 3n;

      const event = CatalogRelease1155.TokenPermissionsUpdated.createMockEvent({
        tokenId,
        user: ARTIST,
        authScope: BigInt(AUTH_SCOPE_MANAGER),
      });
      (event as { srcAddress: string }).srcAddress = COLLECTION;

      const mockDbUpdated = await CatalogRelease1155.TokenPermissionsUpdated.processEvent({
        event,
        mockDb,
      });

      const entityId = `${collection}_${event.chainId}_${tokenId}_${ARTIST.toLowerCase()}`;
      const actualEntity = await mockDbUpdated.entities.Catalog_Admins.get(entityId);
      assert.equal(actualEntity, undefined, "pure MANAGER entity should not be stored");
    });

    it("should be stored separately from contract-level (token_id=0) entity", async () => {
      const mockDb = MockDb.createMockDb();
      const collection = COLLECTION.toLowerCase();
      const tokenId = 1n;

      const contractEvent = CatalogRelease1155.ContractPermissionsUpdated.createMockEvent({
        user: ARTIST,
        authScope: BigInt(AUTH_SCOPE_OWNER),
      });
      (contractEvent as { srcAddress: string }).srcAddress = COLLECTION;

      const tokenEvent = CatalogRelease1155.TokenPermissionsUpdated.createMockEvent({
        tokenId,
        user: ARTIST,
        authScope: BigInt(AUTH_SCOPE_ARTIST),
      });
      (tokenEvent as { srcAddress: string }).srcAddress = COLLECTION;

      const db1 = await CatalogRelease1155.ContractPermissionsUpdated.processEvent({
        event: contractEvent,
        mockDb,
      });
      const db2 = await CatalogRelease1155.TokenPermissionsUpdated.processEvent({
        event: tokenEvent,
        mockDb: db1,
      });

      const contractEntityId = `${collection}_${contractEvent.chainId}_0_${ARTIST.toLowerCase()}`;
      const tokenEntityId = `${collection}_${tokenEvent.chainId}_${tokenId}_${ARTIST.toLowerCase()}`;

      const contractEntity = await db2.entities.Catalog_Admins.get(contractEntityId);
      const tokenEntity = await db2.entities.Catalog_Admins.get(tokenEntityId);

      assert.equal(contractEntity?.auth_scope, AUTH_SCOPE_OWNER, "contract-level scope");
      assert.equal(tokenEntity?.auth_scope, AUTH_SCOPE_ARTIST, "token-level scope");
    });
  });

  describe("USDCFixedPriceController.MintConfigurationUpdated", () => {
    it("should create Catalog_Sales entity correctly", async () => {
      const mockDb = MockDb.createMockDb();
      const tokenId = 1n;
      const pricePerToken = 5_000_000n; // 5 USDC
      const fundsRecipient = "0x9999999999999999999999999999999999999999";

      const event = USDCFixedPriceController.MintConfigurationUpdated.createMockEvent({
        releaseContract: COLLECTION,
        tokenId,
        configuration: [pricePerToken, fundsRecipient],
      });

      const mockDbUpdated = await USDCFixedPriceController.MintConfigurationUpdated.processEvent({
        event,
        mockDb,
      });

      const collection = COLLECTION.toLowerCase();
      const entityId = `${collection}_${tokenId}_${event.chainId}`;
      const actualEntity = await mockDbUpdated.entities.Primary_Sales.get(entityId);

      const expectedEntity: Primary_Sales = {
        id: entityId,
        collection,
        token_id: tokenId,
        price_per_token: pricePerToken,
        funds_recipient: fundsRecipient.toLowerCase(),
        currency: USDC_ADDRESSES[event.chainId],
        sale_start: BigInt(0),
        sale_end: maxUint256,
        max_tokens_per_address: maxUint256,
        chain_id: event.chainId,
        created_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
      };

      assert.deepEqual(actualEntity, expectedEntity);
    });
  });

  describe("USDCFixedPriceController.AlbumMintConfigurationUpdated", () => {
    it("should create Catalog_Albums entity with tokenIds, fundsRecipient, albumPrice", async () => {
      const mockDb = MockDb.createMockDb();
      const albumId = 1n;
      const albumPrice = 10_000_000n; // 10 USDC
      const fundsRecipient = "0x9999999999999999999999999999999999999999";
      const tokenIds = [1n, 2n, 3n];

      const event = USDCFixedPriceController.AlbumMintConfigurationUpdated.createMockEvent({
        releaseContract: COLLECTION,
        albumId,
        configuration: [albumPrice, fundsRecipient, tokenIds],
      });

      const mockDbUpdated =
        await USDCFixedPriceController.AlbumMintConfigurationUpdated.processEvent({
          event,
          mockDb,
        });

      const collection = COLLECTION.toLowerCase();
      const entityId = `${collection}_${albumId}_${event.chainId}`;
      const actualEntity = mockDbUpdated.entities.Catalog_Albums.get(entityId);

      const expectedEntity: Catalog_Albums = {
        id: entityId,
        collection,
        album_id: albumId,
        token_ids: JSON.stringify(tokenIds.map((id) => id.toString())),
        funds_recipient: fundsRecipient.toLowerCase(),
        album_price: albumPrice,
        chain_id: event.chainId,
      };

      assert.deepEqual(actualEntity, expectedEntity);
    });

    it("should overwrite existing album config on update", async () => {
      const albumId = 1n;
      const collection = COLLECTION.toLowerCase();

      const event = USDCFixedPriceController.AlbumMintConfigurationUpdated.createMockEvent({
        releaseContract: COLLECTION,
        albumId,
        configuration: [20_000_000n, ARTIST, [4n, 5n]],
      });

      const mockDb = MockDb.createMockDb().entities.Catalog_Albums.set({
        id: `${collection}_${albumId}_${event.chainId}`,
        collection,
        album_id: albumId,
        token_ids: JSON.stringify(["1", "2", "3"]),
        funds_recipient: CREATOR.toLowerCase(),
        album_price: 10_000_000n,
        chain_id: event.chainId,
      });

      const mockDbUpdated =
        await USDCFixedPriceController.AlbumMintConfigurationUpdated.processEvent({
          event,
          mockDb,
        });

      const entityId = `${collection}_${albumId}_${event.chainId}`;
      const actualEntity = mockDbUpdated.entities.Catalog_Albums.get(entityId);

      assert.equal(actualEntity?.album_price, 20_000_000n, "album_price should be updated");
      assert.equal(
        actualEntity?.token_ids,
        JSON.stringify(["4", "5"]),
        "token_ids should be updated"
      );
    });
  });

  describe("CatalogRelease1155.AlbumPurchased", () => {
    const albumId = 1n;
    const albumPrice = 10_000_000n; // 10 USDC
    const fundsRecipient = "0x9999999999999999999999999999999999999999";
    const tokenIds = [1n, 2n];
    const BUYER = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    const seedAlbum = (mockDb: ReturnType<typeof MockDb.createMockDb>, chainId: number) => {
      const collection = COLLECTION.toLowerCase();
      return mockDb.entities.Catalog_Albums.set({
        id: `${collection}_${albumId}_${chainId}`,
        collection,
        album_id: albumId,
        token_ids: JSON.stringify(tokenIds.map((id) => id.toString())),
        funds_recipient: fundsRecipient.toLowerCase(),
        album_price: albumPrice,
        chain_id: chainId,
      });
    };

    it("should create one Transfers entry per tokenId", async () => {
      const event = CatalogRelease1155.AlbumPurchased.createMockEvent({
        albumId,
        buyer: BUYER,
        referrer0: zeroAddress,
        referrer1: zeroAddress,
      });
      (event as { srcAddress: string }).srcAddress = COLLECTION;

      const mockDb = seedAlbum(MockDb.createMockDb(), event.chainId);
      const mockDbUpdated = await CatalogRelease1155.AlbumPurchased.processEvent({ event, mockDb });

      const collection = COLLECTION.toLowerCase();
      for (const tokenId of tokenIds) {
        const entityId = `${collection}_${tokenId}_${event.chainId}_${event.block.number}_${event.logIndex}`;
        const actualEntity = mockDbUpdated.entities.Transfers.get(entityId);

        const expectedEntity: Transfers = {
          id: entityId,
          collection,
          token_id: tokenId,
          chain_id: event.chainId,
          recipient: BUYER.toLowerCase(),
          quantity: 1n,
          payer: undefined,
          value: undefined,
          currency: undefined,
          funds_recipient: undefined,
          transaction_hash: event.transaction.hash,
          block_number: BigInt(event.block.number),
          transferred_at: event.block.timestamp,
        };

        assert.deepEqual(actualEntity, expectedEntity);
      }
    });

    it("should create one Transfers entry per tokenId regardless of album price", async () => {
      const event = CatalogRelease1155.AlbumPurchased.createMockEvent({
        albumId,
        buyer: BUYER,
        referrer0: zeroAddress,
        referrer1: zeroAddress,
      });
      (event as { srcAddress: string }).srcAddress = COLLECTION;

      const mockDb = seedAlbum(MockDb.createMockDb(), event.chainId);
      const mockDbUpdated = await CatalogRelease1155.AlbumPurchased.processEvent({ event, mockDb });

      const collection = COLLECTION.toLowerCase();
      for (const tokenId of tokenIds) {
        const entityId = `${collection}_${tokenId}_${event.chainId}_${event.block.number}_${event.logIndex}`;
        const actualEntity = mockDbUpdated.entities.Transfers.get(entityId);
        assert.ok(actualEntity, `Transfers entity should exist for tokenId ${tokenId}`);
        assert.equal(actualEntity.recipient, BUYER.toLowerCase());
        assert.equal(actualEntity.quantity, 1n);
      }
    });

    it("should return early without creating any entities when album record is missing", async () => {
      const event = CatalogRelease1155.AlbumPurchased.createMockEvent({
        albumId,
        buyer: BUYER,
        referrer0: zeroAddress,
        referrer1: zeroAddress,
      });
      (event as { srcAddress: string }).srcAddress = COLLECTION;

      const mockDb = MockDb.createMockDb();
      const mockDbUpdated = await CatalogRelease1155.AlbumPurchased.processEvent({ event, mockDb });

      const collection = COLLECTION.toLowerCase();
      for (const tokenId of tokenIds) {
        const transferId = `${collection}_${tokenId}_${event.chainId}_${event.block.number}_${event.logIndex}`;
        const actualTransfer = mockDbUpdated.entities.Transfers.get(transferId);
        assert.equal(
          actualTransfer,
          undefined,
          "no Transfers should be created without album record"
        );
      }
    });
  });
});
