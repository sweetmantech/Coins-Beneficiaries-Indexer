import assert from "assert";
import { TestHelpers } from "generated";
import type { Zora_Collections, Zora_Moments } from "generated";

const {
  MockDb,
  ZoraCreatorFactory,
  ZoraCreator1155,
} = TestHelpers;

const COLLECTION = "0x1234567890123456789012345678901234567890";
const ADMIN = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
const FUNDS_RECIPIENT = "0x5555555555555555555555555555555555555555";
const BUYER = "0xcfbf34d385ea2d5eb947063b67ea226dcda3dc38";
const ZORA_FACTORY = "0x777777C338d93e2C7adf08D102d45CA7CC4Ed021";

describe("Zora 1155 Creator Protocol Handler Tests", () => {
  // ─── Collections ─────────────────────────────────────────────────────────

  describe("ZoraCreatorFactory.SetupNewContract", () => {
    it("should create Zora_Collections entity", async () => {
      const mockDb = MockDb.createMockDb();

      const event = ZoraCreatorFactory.SetupNewContract.createMockEvent({
        newContract: COLLECTION,
        name: "Test Zora Collection",
        defaultAdmin: ADMIN,
        contractURI: "https://example.com/contract",
        defaultRoyaltyConfiguration: [0n, 500n, FUNDS_RECIPIENT],
      });

      const mockDbUpdated = await ZoraCreatorFactory.SetupNewContract.processEvent({
        event,
        mockDb,
      });

      const collection = COLLECTION.toLowerCase();
      const entityId = `${collection}_${event.chainId}`;
      const actualEntity = mockDbUpdated.entities.Zora_Collections.get(entityId);

      const expectedEntity: Zora_Collections = {
        id: entityId,
        address: collection,
        name: "Test Zora Collection",
        uri: "https://example.com/contract",
        default_admin: ADMIN.toLowerCase(),
        chain_id: event.chainId,
        created_at: event.block.timestamp,
        updated_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
      };

      assert.deepEqual(actualEntity, expectedEntity);
    });
  });

  describe("ZoraCreator1155.ContractMetadataUpdated", () => {
    it("should update existing Zora_Collections name and uri", async () => {
      const collection = COLLECTION.toLowerCase();
      const chainId = 1;

      const existingCollection: Zora_Collections = {
        id: `${collection}_${chainId}`,
        address: collection,
        name: "Old Name",
        uri: "https://old.uri",
        default_admin: ADMIN.toLowerCase(),
        chain_id: chainId,
        created_at: 1000,
        updated_at: 1000,
        transaction_hash: "0xold",
      };

      let mockDb = MockDb.createMockDb().entities.Zora_Collections.set(existingCollection);

      const event = ZoraCreator1155.ContractMetadataUpdated.createMockEvent({
        updater: ADMIN,
        uri: "https://new.uri",
        name: "New Name",
        mockEventData: { srcAddress: COLLECTION },
      });

      const mockDbUpdated = await ZoraCreator1155.ContractMetadataUpdated.processEvent({
        event,
        mockDb,
      });

      const actualEntity = mockDbUpdated.entities.Zora_Collections.get(
        `${collection}_${event.chainId}`
      );

      assert.equal(actualEntity?.name, "New Name");
      assert.equal(actualEntity?.uri, "https://new.uri");
      assert.equal(actualEntity?.created_at, 1000);
    });
  });

  // ─── Moments ─────────────────────────────────────────────────────────────

  describe("ZoraCreator1155.SetupNewToken", () => {
    it("should create Zora_Moments entity", async () => {
      const mockDb = MockDb.createMockDb();
      const tokenId = 1n;

      const event = ZoraCreator1155.SetupNewToken.createMockEvent({
        tokenId,
        newURI: "https://example.com/token/1",
        maxSupply: 100n,
        mockEventData: { srcAddress: COLLECTION },
      });

      const mockDbUpdated = await ZoraCreator1155.SetupNewToken.processEvent({ event, mockDb });

      const entityId = `${COLLECTION.toLowerCase()}_${tokenId}_${event.chainId}`;
      const actualEntity = mockDbUpdated.entities.Zora_Moments.get(entityId);

      const expectedEntity: Zora_Moments = {
        id: entityId,
        collection: COLLECTION.toLowerCase(),
        token_id: tokenId,
        max_supply: 100n,
        uri: "https://example.com/token/1",
        chain_id: event.chainId,
        created_at: event.block.timestamp,
        updated_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
      };

      assert.deepEqual(actualEntity, expectedEntity);
    });
  });

  describe("ZoraCreator1155.URI", () => {
    it("should update Zora_Moments uri", async () => {
      const tokenId = 1n;
      const collection = COLLECTION.toLowerCase();
      const chainId = 1;

      const existing: Zora_Moments = {
        id: `${collection}_${tokenId}_${chainId}`,
        collection,
        token_id: tokenId,
        max_supply: 100n,
        uri: "https://old.uri",
        chain_id: chainId,
        created_at: 1000,
        updated_at: 1000,
        transaction_hash: "0xold",
      };

      let mockDb = MockDb.createMockDb().entities.Zora_Moments.set(existing);

      const event = ZoraCreator1155.URI.createMockEvent({
        value: "https://new.uri",
        id: tokenId,
        mockEventData: { srcAddress: COLLECTION },
      });

      const mockDbUpdated = await ZoraCreator1155.URI.processEvent({ event, mockDb });

      const actualEntity = mockDbUpdated.entities.Zora_Moments.get(
        `${collection}_${tokenId}_${event.chainId}`
      );

      assert.equal(actualEntity?.uri, "https://new.uri");
      assert.equal(actualEntity?.created_at, 1000);
    });

    it("should skip URI update if token entity does not exist", async () => {
      const mockDb = MockDb.createMockDb();
      const tokenId = 99n;

      const event = ZoraCreator1155.URI.createMockEvent({
        value: "https://ghost.uri",
        id: tokenId,
        mockEventData: { srcAddress: COLLECTION },
      });

      const mockDbUpdated = await ZoraCreator1155.URI.processEvent({ event, mockDb });

      const entityId = `${COLLECTION.toLowerCase()}_${tokenId}_${event.chainId}`;
      assert.equal(mockDbUpdated.entities.Zora_Moments.get(entityId), undefined);
    });
  });

});
