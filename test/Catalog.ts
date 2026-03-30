import assert from "assert";
import { TestHelpers } from "generated";
import type {
  Catalog_Admins,
  Catalog_Collections,
  Catalog_Moments,
  Primary_Sales,
} from "generated";
import { encodeFunctionData, maxUint256 } from "viem";
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

    it("should not update if updated_at is more recent", async () => {
      const collection = COLLECTION.toLowerCase();

      const event = CatalogRelease1155.URI.createMockEvent({
        value: "ipfs://new-uri",
        id: 0n,
      });

      (event as { srcAddress: string }).srcAddress = COLLECTION;

      const originalUri = "ipfs://original-uri";
      const futureTimestamp = event.block.timestamp + 9999;

      const mockDb = MockDb.createMockDb().entities.Catalog_Collections.set({
        id: `${collection}_${event.chainId}`,
        address: collection,
        name: "My Release",
        creator: CREATOR.toLowerCase(),
        uri: originalUri,
        chain_id: event.chainId,
        created_at: 0,
        updated_at: futureTimestamp,
        transaction_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      });

      const mockDbUpdated = await CatalogRelease1155.URI.processEvent({ event, mockDb });

      const entityId = `${collection}_${event.chainId}`;
      const actualEntity = await mockDbUpdated.entities.Catalog_Collections.get(entityId);

      assert.equal(
        actualEntity?.uri,
        originalUri,
        "uri should not change when entity is more recent"
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

    it("should not overwrite a more recent entity", async () => {
      const collection = COLLECTION.toLowerCase();

      const event = CatalogRelease1155.ContractPermissionsUpdated.createMockEvent({
        user: ARTIST,
        authScope: BigInt(AUTH_SCOPE_OWNER),
      });
      (event as { srcAddress: string }).srcAddress = COLLECTION;

      const entityId = `${collection}_${event.chainId}_0_${ARTIST.toLowerCase()}`;
      const futureTimestamp = event.block.timestamp + 9999;
      const mockDb = MockDb.createMockDb().entities.Catalog_Admins.set({
        id: entityId,
        collection,
        token_id: 0n,
        admin: ARTIST.toLowerCase(),
        chain_id: event.chainId,
        auth_scope: AUTH_SCOPE_OWNER | AUTH_SCOPE_ARTIST,
        updated_at: futureTimestamp,
      });

      const mockDbUpdated = await CatalogRelease1155.ContractPermissionsUpdated.processEvent({
        event,
        mockDb,
      });

      const actualEntity = await mockDbUpdated.entities.Catalog_Admins.get(entityId);
      assert.equal(
        actualEntity?.auth_scope,
        AUTH_SCOPE_OWNER | AUTH_SCOPE_ARTIST,
        "auth_scope should not change when entity is more recent"
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
        currency: USDC_ADDRESSES[event.chainId] ?? "",
        sale_start: BigInt(0),
        sale_end: maxUint256,
        max_tokens_per_address: maxUint256,
        chain_id: event.chainId,
        created_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
      };

      assert.deepEqual(actualEntity, expectedEntity);
    });

    it("should not overwrite a more recent Catalog_Sales entity", async () => {
      const tokenId = 1n;
      const collection = COLLECTION.toLowerCase();
      const originalPrice = 1_000_000n;

      const event = USDCFixedPriceController.MintConfigurationUpdated.createMockEvent({
        releaseContract: COLLECTION,
        tokenId,
        configuration: [5_000_000n, CREATOR],
      });

      const futureTimestamp = event.block.timestamp + 9999;

      const mockDb = MockDb.createMockDb().entities.Primary_Sales.set({
        id: `${collection}_${tokenId}_${event.chainId}`,
        collection,
        token_id: tokenId,
        price_per_token: originalPrice,
        funds_recipient: CREATOR.toLowerCase(),
        currency: USDC_ADDRESSES[event.chainId] ?? "",
        sale_start: BigInt(0),
        sale_end: maxUint256,
        max_tokens_per_address: maxUint256,
        chain_id: event.chainId,
        created_at: futureTimestamp,
        transaction_hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      });

      const mockDbUpdated = await USDCFixedPriceController.MintConfigurationUpdated.processEvent({
        event,
        mockDb,
      });

      const entityId = `${collection}_${tokenId}_${event.chainId}`;
      const actualEntity = await mockDbUpdated.entities.Primary_Sales.get(entityId);

      assert.equal(actualEntity?.price_per_token, originalPrice, "price should not change");
    });
  });
});
