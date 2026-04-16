import assert from "assert";
import { zeroAddress } from "viem";
import { TestHelpers } from "generated";
import type { Transfers, ZoraMedia_Admins, ZoraMedia_Moments } from "generated";

const { MockDb, ZoraMedia } = TestHelpers;

const ZORA_MEDIA_COLLECTION = "0xabefbc9fd2f806065b4f3c237d4b59d9a97bcac7";
const BUYER = "0xcfbf34d385ea2d5eb947063b67ea226dcda3dc38";
const OTHER_OWNER = "0x1111111111111111111111111111111111111111";

describe("ZoraMedia Handler Tests", () => {
  describe("ZoraMedia.Transfer", () => {
    it("should register a ZoraMedia token on mint", async () => {
      const mockDb = MockDb.createMockDb();
      const tokenId = 1n;

      const event = ZoraMedia.Transfer.createMockEvent({
        from: zeroAddress,
        to: BUYER,
        tokenId,
      });
      (event as { srcAddress: string }).srcAddress = ZORA_MEDIA_COLLECTION;

      const mockDbUpdated = await ZoraMedia.Transfer.processEvent({ event, mockDb });

      const entityId = `${ZORA_MEDIA_COLLECTION.toLowerCase()}_${tokenId}_${event.chainId}`;
      const actualEntity = mockDbUpdated.entities.ZoraMedia_Moments.get(entityId);

      const expectedEntity: ZoraMedia_Moments = {
        id: entityId,
        collection: ZORA_MEDIA_COLLECTION.toLowerCase(),
        token_id: tokenId,
        owner: BUYER.toLowerCase(),
        uri: undefined,
        metadata_uri: undefined,
        chain_id: event.chainId,
        created_at: event.block.timestamp,
        updated_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
      };

      assert.deepEqual(actualEntity, expectedEntity);
    });

    it("should create Transfers entity for ZoraMedia mint", async () => {
      const mockDb = MockDb.createMockDb();
      const tokenId = 3n;

      const event = ZoraMedia.Transfer.createMockEvent({
        from: zeroAddress,
        to: BUYER,
        tokenId,
      });
      (event as { srcAddress: string }).srcAddress = ZORA_MEDIA_COLLECTION;

      const mockDbUpdated = await ZoraMedia.Transfer.processEvent({ event, mockDb });

      const entityId = `${ZORA_MEDIA_COLLECTION.toLowerCase()}_${tokenId}_${event.chainId}_${event.block.number}_${event.logIndex}`;
      const actualEntity = mockDbUpdated.entities.Transfers.get(entityId);

      const expectedEntity: Transfers = {
        id: entityId,
        collection: ZORA_MEDIA_COLLECTION.toLowerCase(),
        token_id: tokenId,
        chain_id: event.chainId,
        recipient: BUYER.toLowerCase(),
        quantity: 1n,
        value: undefined,
        currency: undefined,
        transaction_hash: event.transaction.hash,
        block_number: BigInt(event.block.number),
        transferred_at: event.block.timestamp,
      };

      assert.deepEqual(actualEntity, expectedEntity);
    });

    it("should register mint recipient as initial ZoraMedia admin", async () => {
      const mockDb = MockDb.createMockDb();
      const tokenId = 2n;

      const event = ZoraMedia.Transfer.createMockEvent({
        from: zeroAddress,
        to: BUYER,
        tokenId,
      });
      (event as { srcAddress: string }).srcAddress = ZORA_MEDIA_COLLECTION;

      const mockDbUpdated = await ZoraMedia.Transfer.processEvent({ event, mockDb });

      const entityId = `${ZORA_MEDIA_COLLECTION.toLowerCase()}_${event.chainId}_${tokenId}_${BUYER.toLowerCase()}`;
      const actualEntity = mockDbUpdated.entities.ZoraMedia_Admins.get(entityId);

      const expectedEntity: ZoraMedia_Admins = {
        id: entityId,
        admin: BUYER.toLowerCase(),
        collection: ZORA_MEDIA_COLLECTION.toLowerCase(),
        token_id: tokenId,
        chain_id: event.chainId,
        updated_at: event.block.timestamp,
      };

      assert.deepEqual(actualEntity, expectedEntity);
    });
  });

  describe("ZoraMedia.TokenURIUpdated", () => {
    it("should enrich an existing ZoraMedia token with token URI", async () => {
      const tokenId = 1n;
      const transferEvent = ZoraMedia.Transfer.createMockEvent({
        from: zeroAddress,
        to: BUYER,
        tokenId,
      });
      (transferEvent as { srcAddress: string }).srcAddress = ZORA_MEDIA_COLLECTION;

      const uriEvent = ZoraMedia.TokenURIUpdated.createMockEvent({
        _tokenId: tokenId,
        owner: BUYER,
        _uri: "https://example.com/token/1",
      });
      (uriEvent as { srcAddress: string }).srcAddress = ZORA_MEDIA_COLLECTION;

      let mockDb = MockDb.createMockDb();
      mockDb = await ZoraMedia.Transfer.processEvent({ event: transferEvent, mockDb });
      const mockDbUpdated = await ZoraMedia.TokenURIUpdated.processEvent({
        event: uriEvent,
        mockDb,
      });

      const entityId = `${ZORA_MEDIA_COLLECTION.toLowerCase()}_${tokenId}_${uriEvent.chainId}`;
      const actualEntity = mockDbUpdated.entities.ZoraMedia_Moments.get(entityId);

      assert.ok(actualEntity, "ZoraMedia_Moments entity should exist");
      assert.equal(actualEntity?.uri, "https://example.com/token/1");
      assert.equal(actualEntity?.metadata_uri, undefined);
      assert.equal(actualEntity?.created_at, transferEvent.block.timestamp);
      assert.equal(actualEntity?.transaction_hash, transferEvent.transaction.hash);
    });

    it("should create a row from TokenURIUpdated even if mint row is missing", async () => {
      const tokenId = 4n;
      const event = ZoraMedia.TokenURIUpdated.createMockEvent({
        _tokenId: tokenId,
        owner: OTHER_OWNER,
        _uri: "https://example.com/token/4",
      });
      (event as { srcAddress: string }).srcAddress = ZORA_MEDIA_COLLECTION;

      const mockDbUpdated = await ZoraMedia.TokenURIUpdated.processEvent({
        event,
        mockDb: MockDb.createMockDb(),
      });

      const entityId = `${ZORA_MEDIA_COLLECTION.toLowerCase()}_${tokenId}_${event.chainId}`;
      const actualEntity = mockDbUpdated.entities.ZoraMedia_Moments.get(entityId);

      assert.equal(actualEntity?.owner, OTHER_OWNER.toLowerCase());
      assert.equal(actualEntity?.uri, "https://example.com/token/4");
      assert.equal(actualEntity?.metadata_uri, undefined);
      assert.equal(actualEntity?.created_at, event.block.timestamp);
      assert.equal(actualEntity?.transaction_hash, event.transaction.hash);
    });
  });

  describe("ZoraMedia.TokenMetadataURIUpdated", () => {
    it("should enrich an existing ZoraMedia token with metadata URI", async () => {
      const tokenId = 5n;
      const transferEvent = ZoraMedia.Transfer.createMockEvent({
        from: zeroAddress,
        to: BUYER,
        tokenId,
      });
      (transferEvent as { srcAddress: string }).srcAddress = ZORA_MEDIA_COLLECTION;

      const metadataEvent = ZoraMedia.TokenMetadataURIUpdated.createMockEvent({
        _tokenId: tokenId,
        owner: BUYER,
        _uri: "https://example.com/token/5/metadata",
      });
      (metadataEvent as { srcAddress: string }).srcAddress = ZORA_MEDIA_COLLECTION;

      let mockDb = MockDb.createMockDb();
      mockDb = await ZoraMedia.Transfer.processEvent({ event: transferEvent, mockDb });
      const mockDbUpdated = await ZoraMedia.TokenMetadataURIUpdated.processEvent({
        event: metadataEvent,
        mockDb,
      });

      const entityId = `${ZORA_MEDIA_COLLECTION.toLowerCase()}_${tokenId}_${metadataEvent.chainId}`;
      const actualEntity = mockDbUpdated.entities.ZoraMedia_Moments.get(entityId);

      assert.equal(actualEntity?.uri, undefined);
      assert.equal(actualEntity?.metadata_uri, "https://example.com/token/5/metadata");
      assert.equal(actualEntity?.created_at, transferEvent.block.timestamp);
      assert.equal(actualEntity?.transaction_hash, transferEvent.transaction.hash);
    });

    it("should preserve existing uri when metadata URI updates later", async () => {
      const tokenId = 6n;
      const transferEvent = ZoraMedia.Transfer.createMockEvent({
        from: zeroAddress,
        to: BUYER,
        tokenId,
      });
      (transferEvent as { srcAddress: string }).srcAddress = ZORA_MEDIA_COLLECTION;

      const uriEvent = ZoraMedia.TokenURIUpdated.createMockEvent({
        _tokenId: tokenId,
        owner: BUYER,
        _uri: "https://example.com/token/6",
      });
      (uriEvent as { srcAddress: string }).srcAddress = ZORA_MEDIA_COLLECTION;

      const metadataEvent = ZoraMedia.TokenMetadataURIUpdated.createMockEvent({
        _tokenId: tokenId,
        owner: BUYER,
        _uri: "https://example.com/token/6/metadata",
      });
      (metadataEvent as { srcAddress: string }).srcAddress = ZORA_MEDIA_COLLECTION;

      let mockDb = MockDb.createMockDb();
      mockDb = await ZoraMedia.Transfer.processEvent({ event: transferEvent, mockDb });
      mockDb = await ZoraMedia.TokenURIUpdated.processEvent({ event: uriEvent, mockDb });
      const mockDbUpdated = await ZoraMedia.TokenMetadataURIUpdated.processEvent({
        event: metadataEvent,
        mockDb,
      });

      const entityId = `${ZORA_MEDIA_COLLECTION.toLowerCase()}_${tokenId}_${metadataEvent.chainId}`;
      const actualEntity = mockDbUpdated.entities.ZoraMedia_Moments.get(entityId);

      assert.equal(actualEntity?.uri, "https://example.com/token/6");
      assert.equal(actualEntity?.metadata_uri, "https://example.com/token/6/metadata");
    });
  });
});
