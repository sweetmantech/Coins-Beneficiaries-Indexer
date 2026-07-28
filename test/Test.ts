import assert from "assert";
import { TestHelpers } from "generated";
import type {
  InProcess_Collections,
  InProcess_Comments,
  InProcess_Moments,
  InProcess_Admins,
  Transfers,
  Primary_Sales,
} from "generated";
import { zeroAddress } from "viem";

const {
  MockDb,
  InProcessCreatorFactory,
  InProcessCreatorFixedPriceSaleStrategy,
  InProcessERC20Minter,
  InProcessMoment,
  CatalogRelease1155,
  ZoraComments,
  InProcessComments,
} = TestHelpers;

const COLLECTION = "0x1234567890123456789012345678901234567890";
const ADMIN = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
const FUNDS_RECIPIENT = "0x5555555555555555555555555555555555555555";
const BUYER = "0xcfbf34d385ea2d5eb947063b67ea226dcda3dc38";

describe("Event Handler Tests", () => {
  // ─── InProcess Collections ───────────────────────────────────────────────

  describe("InProcessCreatorFactory.SetupNewContract", () => {
    it("should create InProcess_Collections entity correctly", async () => {
      const mockDb = MockDb.createMockDb();

      const event = InProcessCreatorFactory.SetupNewContract.createMockEvent({
        newContract: COLLECTION,
        name: "Test Collection",
        defaultAdmin: ADMIN,
        contractURI: "https://example.com/contract",
        defaultRoyaltyConfiguration: [0n, 0n, FUNDS_RECIPIENT],
      });

      const mockDbUpdated = await InProcessCreatorFactory.SetupNewContract.processEvent({
        event,
        mockDb,
      });

      const collection = COLLECTION.toLowerCase();
      const entityId = `${collection}_${event.chainId}`;
      const actualEntity = mockDbUpdated.entities.InProcess_Collections.get(entityId);

      const expectedEntity: InProcess_Collections = {
        id: entityId,
        address: collection,
        name: event.params.name,
        uri: event.params.contractURI,
        default_admin: ADMIN.toLowerCase(),
        chain_id: event.chainId,
        created_at: event.block.timestamp,
        updated_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
      };

      assert.deepEqual(actualEntity, expectedEntity);
    });
  });

  // ─── Comments ────────────────────────────────────────────────────────────

  describe("InProcessERC20Minter.MintComment", () => {
    it("should create InProcess_Comments entity", async () => {
      const mockDb = MockDb.createMockDb();

      const event = InProcessERC20Minter.MintComment.createMockEvent({
        sender: BUYER,
        tokenContract: COLLECTION,
        tokenId: 1n,
        quantity: 1n,
        comment: "Test comment",
      });

      const mockDbUpdated = await InProcessERC20Minter.MintComment.processEvent({
        event,
        mockDb,
      });

      const entityId = `${COLLECTION.toLowerCase()}_1_${event.chainId}_${event.block.number}_${event.logIndex}`;
      const actualEntity = mockDbUpdated.entities.InProcess_Comments.get(entityId);

      const expectedEntity: InProcess_Comments = {
        id: entityId,
        sender: BUYER.toLowerCase(),
        collection: COLLECTION.toLowerCase(),
        token_id: 1n,
        comment: "Test comment",
        comment_id: undefined,
        reply_to_id: undefined,
        nonce: undefined,
        sparks_quantity: undefined,
        commented_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
        chain_id: event.chainId,
      };

      assert.deepEqual(actualEntity, expectedEntity);
    });
  });

  describe("InProcessCreatorFixedPriceSaleStrategy.MintComment", () => {
    it("should create InProcess_Comments entity", async () => {
      const mockDb = MockDb.createMockDb();

      const event = InProcessCreatorFixedPriceSaleStrategy.MintComment.createMockEvent({
        sender: BUYER,
        tokenContract: COLLECTION,
        tokenId: 1n,
        quantity: 1n,
        comment: "ETH mint comment",
      });

      const mockDbUpdated = await InProcessCreatorFixedPriceSaleStrategy.MintComment.processEvent({
        event,
        mockDb,
      });

      const entityId = `${COLLECTION.toLowerCase()}_1_${event.chainId}_${event.block.number}_${event.logIndex}`;
      const actualEntity = mockDbUpdated.entities.InProcess_Comments.get(entityId);

      const expectedEntity: InProcess_Comments = {
        id: entityId,
        sender: BUYER.toLowerCase(),
        collection: COLLECTION.toLowerCase(),
        token_id: 1n,
        comment: "ETH mint comment",
        comment_id: undefined,
        reply_to_id: undefined,
        nonce: undefined,
        sparks_quantity: undefined,
        commented_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
        chain_id: event.chainId,
      };

      assert.deepEqual(actualEntity, expectedEntity);
    });
  });

  describe("ZoraComments.Commented", () => {
    const COMMENT_ID = "0xab6776473e27a7c8f9ee24553dfae47a10eb525142f6161de6346ecf48e77b60";
    const PARENT_COMMENT_ID = "0x1111111111111111111111111111111111111111111111111111111111111111";
    const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const NONCE = "0x0000000000000000000000000000000000000000000000000000000000082e64";

    it("should index Commented for InProcess collections including replies", async () => {
      let mockDb = MockDb.createMockDb();

      const setupEvent = InProcessCreatorFactory.SetupNewContract.createMockEvent({
        newContract: COLLECTION,
        name: "Test Collection",
        defaultAdmin: ADMIN,
        contractURI: "https://example.com/contract",
        defaultRoyaltyConfiguration: [0n, 0n, FUNDS_RECIPIENT],
      });
      mockDb = await InProcessCreatorFactory.SetupNewContract.processEvent({
        event: setupEvent,
        mockDb,
      });

      const event = ZoraComments.Commented.createMockEvent({
        commentId: COMMENT_ID,
        commentIdentifier: [BUYER, COLLECTION, 3n, NONCE],
        replyToId: PARENT_COMMENT_ID,
        replyTo: [ADMIN, COLLECTION, 3n, ZERO_BYTES32],
        sparksQuantity: 1n,
        text: "Reply comment",
        timestamp: 1234567890n,
        referrer: zeroAddress,
      });

      mockDb = await ZoraComments.Commented.processEvent({
        event,
        mockDb,
      });

      const entityId = `${COMMENT_ID}_${event.chainId}`;
      const actualEntity = mockDb.entities.InProcess_Comments.get(entityId);

      const expectedEntity: InProcess_Comments = {
        id: entityId,
        sender: BUYER.toLowerCase(),
        collection: COLLECTION.toLowerCase(),
        token_id: 3n,
        comment: "Reply comment",
        comment_id: COMMENT_ID,
        reply_to_id: PARENT_COMMENT_ID,
        nonce: NONCE,
        sparks_quantity: 1n,
        commented_at: 1234567890,
        transaction_hash: event.transaction.hash,
        chain_id: event.chainId,
      };

      assert.deepEqual(actualEntity, expectedEntity);
    });

    it("should skip Commented for non-InProcess collections", async () => {
      const mockDb = MockDb.createMockDb();

      const event = ZoraComments.Commented.createMockEvent({
        commentId: COMMENT_ID,
        commentIdentifier: [BUYER, COLLECTION, 3n, ZERO_BYTES32],
        replyToId: ZERO_BYTES32,
        replyTo: [zeroAddress, zeroAddress, 0n, ZERO_BYTES32],
        sparksQuantity: 1n,
        text: "Ignored comment",
        timestamp: 1234567890n,
        referrer: zeroAddress,
      });

      const mockDbUpdated = await ZoraComments.Commented.processEvent({
        event,
        mockDb,
      });

      const entityId = `${COMMENT_ID}_${event.chainId}`;
      assert.equal(mockDbUpdated.entities.InProcess_Comments.get(entityId), undefined);
    });
  });

  describe("InProcessComments.Commented", () => {
    const COMMENT_ID = "0xab6776473e27a7c8f9ee24553dfae47a10eb525142f6161de6346ecf48e77b60";
    const PARENT_COMMENT_ID = "0x1111111111111111111111111111111111111111111111111111111111111111";
    const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const NONCE = "0x0000000000000000000000000000000000000000000000000000000000082e64";

    it("should index Commented for InProcess collections including replies", async () => {
      let mockDb = MockDb.createMockDb();

      const setupEvent = InProcessCreatorFactory.SetupNewContract.createMockEvent({
        newContract: COLLECTION,
        name: "Test Collection",
        defaultAdmin: ADMIN,
        contractURI: "https://example.com/contract",
        defaultRoyaltyConfiguration: [0n, 0n, FUNDS_RECIPIENT],
      });
      mockDb = await InProcessCreatorFactory.SetupNewContract.processEvent({
        event: setupEvent,
        mockDb,
      });

      const event = InProcessComments.Commented.createMockEvent({
        commentId: COMMENT_ID,
        commentIdentifier: [BUYER, COLLECTION, 3n, NONCE],
        replyToId: PARENT_COMMENT_ID,
        replyTo: [ADMIN, COLLECTION, 3n, ZERO_BYTES32],
        sparksQuantity: 0n,
        text: "Reply comment",
        timestamp: 1234567890n,
        referrer: zeroAddress,
      });

      mockDb = await InProcessComments.Commented.processEvent({
        event,
        mockDb,
      });

      const entityId = `${COMMENT_ID}_${event.chainId}`;
      const actualEntity = mockDb.entities.InProcess_Comments.get(entityId);

      const expectedEntity: InProcess_Comments = {
        id: entityId,
        sender: BUYER.toLowerCase(),
        collection: COLLECTION.toLowerCase(),
        token_id: 3n,
        comment: "Reply comment",
        comment_id: COMMENT_ID,
        reply_to_id: PARENT_COMMENT_ID,
        nonce: NONCE,
        sparks_quantity: 0n,
        commented_at: 1234567890,
        transaction_hash: event.transaction.hash,
        chain_id: event.chainId,
      };

      assert.deepEqual(actualEntity, expectedEntity);
    });

    it("should skip Commented for non-InProcess collections", async () => {
      const mockDb = MockDb.createMockDb();

      const event = InProcessComments.Commented.createMockEvent({
        commentId: COMMENT_ID,
        commentIdentifier: [BUYER, COLLECTION, 3n, ZERO_BYTES32],
        replyToId: ZERO_BYTES32,
        replyTo: [zeroAddress, zeroAddress, 0n, ZERO_BYTES32],
        sparksQuantity: 0n,
        text: "Ignored comment",
        timestamp: 1234567890n,
        referrer: zeroAddress,
      });

      const mockDbUpdated = await InProcessComments.Commented.processEvent({
        event,
        mockDb,
      });

      const entityId = `${COMMENT_ID}_${event.chainId}`;
      assert.equal(mockDbUpdated.entities.InProcess_Comments.get(entityId), undefined);
    });
  });

  // ─── Transfers ───────────────────────────────────────────────────────────

  describe("InProcessMoment.TransferSingle (airdrop/mint)", () => {
    it("should create Transfers entity with undefined value/currency for admin mints", async () => {
      const tokenId = 1n;
      const quantity = 3n;
      const txHash = "0x1234567890123456789012345678901234567890123456789012345678901234";

      const event = InProcessMoment.TransferSingle.createMockEvent({
        operator: ADMIN,
        from: zeroAddress,
        to: BUYER,
        id: tokenId,
        value: quantity,
      });

      (event as { srcAddress: string }).srcAddress = COLLECTION;
      (event.transaction as { hash: string }).hash = txHash;

      const mockDb = MockDb.createMockDb();
      const mockDbUpdated = await InProcessMoment.TransferSingle.processEvent({ event, mockDb });

      const mintLogIndex = Number((event as { logIndex?: number }).logIndex ?? 0);
      const entityId = `${COLLECTION.toLowerCase()}_${tokenId}_${event.chainId}_${txHash}_${mintLogIndex}`;
      const actualEntity = mockDbUpdated.entities.Transfers.get(entityId);

      const expectedEntity: Transfers = {
        id: entityId,
        collection: COLLECTION.toLowerCase(),
        token_id: tokenId,
        chain_id: event.chainId,
        recipient: BUYER.toLowerCase(),
        quantity,
        value: undefined,
        currency: undefined,
        transaction_hash: txHash,
        block_number: BigInt(event.block.number),
        transferred_at: event.block.timestamp,
      };

      assert.deepEqual(actualEntity, expectedEntity);
    });
  });

  describe("InProcessMoment.Purchased (ETH mint)", () => {
    it("should enrich same-tx mint row with value ETH from Purchased (mint picked by logIndex before Purchased)", async () => {
      const tokenId = 1n;
      const value = 1000000000000000n; // 0.001 ETH
      const txHash = "0x1234567890123456789012345678901234567890123456789012345678901234";
      const collection = COLLECTION.toLowerCase();

      const transferEvent = InProcessMoment.TransferSingle.createMockEvent({
        operator: BUYER,
        from: zeroAddress,
        to: BUYER,
        id: tokenId,
        value: 1n,
        mockEventData: {
          logIndex: 10,
          srcAddress: COLLECTION,
          transaction: { hash: txHash },
        },
      } as Parameters<typeof InProcessMoment.TransferSingle.createMockEvent>[0]);

      const purchasedEvent = InProcessMoment.Purchased.createMockEvent({
        sender: BUYER,
        minter: "0x2994762aa0e4c750c51f333c10d81961faebe785",
        tokenId,
        quantity: 1n,
        value,
        mockEventData: {
          logIndex: 20,
          srcAddress: COLLECTION,
          transaction: { hash: txHash },
        },
      } as Parameters<typeof InProcessMoment.Purchased.createMockEvent>[0]);

      let mockDb = MockDb.createMockDb();
      mockDb = await InProcessMoment.TransferSingle.processEvent({ event: transferEvent, mockDb });
      const mockDbUpdated = await InProcessMoment.Purchased.processEvent({
        event: purchasedEvent,
        mockDb,
      });

      const mintLogIndex = Number((transferEvent as { logIndex?: number }).logIndex ?? 0);
      const entityId = `${collection}_${tokenId}_${transferEvent.chainId}_${txHash}_${mintLogIndex}`;
      const actualEntity = mockDbUpdated.entities.Transfers.get(entityId);

      assert.ok(actualEntity, "Transfers entity should exist");
      assert.equal(actualEntity.value, value);
      assert.equal(actualEntity.currency, zeroAddress);
    });
  });

  // ─── Moments ─────────────────────────────────────────────────────────────

  describe("InProcessMoment.SetupNewToken", () => {
    it("should create InProcess_Moments entity correctly", async () => {
      const mockDb = MockDb.createMockDb();
      const tokenId = 1n;

      const event = InProcessMoment.SetupNewToken.createMockEvent({
        tokenId,
        newURI: "https://example.com/token/1",
        maxSupply: 100n,
      });
      (event as { srcAddress: string }).srcAddress = COLLECTION;

      const mockDbUpdated = await InProcessMoment.SetupNewToken.processEvent({ event, mockDb });

      const entityId = `${COLLECTION.toLowerCase()}_${tokenId}_${event.chainId}`;
      const actualEntity = mockDbUpdated.entities.InProcess_Moments.get(entityId);

      const expectedEntity: InProcess_Moments = {
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

  // ─── Admins ───────────────────────────────────────────────────────────────

  describe("InProcessMoment.UpdatedPermissions", () => {
    it("should create InProcess_Admins entity correctly", async () => {
      const mockDb = MockDb.createMockDb();
      const tokenId = 1n;

      const event = InProcessMoment.UpdatedPermissions.createMockEvent({
        tokenId,
        user: ADMIN,
        permissions: 2n,
      });
      (event as { srcAddress: string }).srcAddress = COLLECTION;

      const mockDbUpdated = await InProcessMoment.UpdatedPermissions.processEvent({
        event,
        mockDb,
      });

      const entityId = `${COLLECTION.toLowerCase()}_${event.chainId}_${tokenId}_${ADMIN.toLowerCase()}`;
      const actualEntity = mockDbUpdated.entities.InProcess_Admins.get(entityId);

      const expectedEntity: InProcess_Admins = {
        id: entityId,
        collection: COLLECTION.toLowerCase(),
        token_id: tokenId,
        admin: ADMIN.toLowerCase(),
        chain_id: event.chainId,
        permission: 2,
        updated_at: event.block.timestamp,
      };

      assert.deepEqual(actualEntity, expectedEntity);
    });
  });

  // ─── Catalog ─────────────────────────────────────────────────────────────

  describe("CatalogRelease1155.TokenPurchased", () => {
    it("should create Transfers entity correctly", async () => {
      const mockDb = MockDb.createMockDb();
      const tokenId = 2n;
      const amount = 5n;

      const event = CatalogRelease1155.TokenPurchased.createMockEvent({
        tokenId,
        amount,
        buyer: BUYER,
        referrer0: zeroAddress,
        referrer1: zeroAddress,
      });
      (event as { srcAddress: string }).srcAddress = COLLECTION;

      const mockDbUpdated = await CatalogRelease1155.TokenPurchased.processEvent({ event, mockDb });

      const entityId = `${COLLECTION.toLowerCase()}_${tokenId}_${event.chainId}_${event.block.number}_${event.logIndex}`;
      const actualEntity = mockDbUpdated.entities.Transfers.get(entityId);

      const expectedEntity: Transfers = {
        id: entityId,
        collection: COLLECTION.toLowerCase(),
        token_id: tokenId,
        chain_id: event.chainId,
        recipient: BUYER.toLowerCase(),
        quantity: amount,
        value: undefined,
        currency: undefined,
        transaction_hash: event.transaction.hash,
        block_number: BigInt(event.block.number),
        transferred_at: event.block.timestamp,
      };

      assert.deepEqual(actualEntity, expectedEntity);
    });
  });

  describe("InProcessERC20Minter.ERC20RewardsDeposit (ERC20 mint)", () => {
    it("should enrich same-tx mint row with value and currency from Primary_Sales (mint before deposit by logIndex)", async () => {
      const tokenId = 2n;
      const currency = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"; // USDC
      const pricePerToken = 5000000n; // 5 USDC
      const quantity = 2n;
      const collection = COLLECTION.toLowerCase();
      const txHash = "0x1234567890123456789012345678901234567890123456789012345678901234";

      const transferEvent = InProcessMoment.TransferSingle.createMockEvent({
        operator: BUYER,
        from: zeroAddress,
        to: BUYER,
        id: tokenId,
        value: quantity,
        mockEventData: {
          logIndex: 5,
          srcAddress: COLLECTION,
          transaction: { hash: txHash },
        },
      } as Parameters<typeof InProcessMoment.TransferSingle.createMockEvent>[0]);

      const depositEvent = InProcessERC20Minter.ERC20RewardsDeposit.createMockEvent({
        firstMinter: BUYER,
        collection: COLLECTION,
        currency,
        tokenId,
        mockEventData: {
          logIndex: 15,
          transaction: { hash: txHash },
        },
      } as Parameters<typeof InProcessERC20Minter.ERC20RewardsDeposit.createMockEvent>[0]);

      const saleId = `${collection}_${tokenId}_${transferEvent.chainId}`;
      const sale: Primary_Sales = {
        id: saleId,
        collection,
        token_id: tokenId,
        price_per_token: pricePerToken,
        funds_recipient: FUNDS_RECIPIENT.toLowerCase(),
        currency,
        sale_start: undefined,
        sale_end: undefined,
        max_tokens_per_address: undefined,
        chain_id: transferEvent.chainId,
        transaction_hash: txHash,
        created_at: 0,
      };

      let mockDb = MockDb.createMockDb().entities.Primary_Sales.set(sale);
      mockDb = await InProcessMoment.TransferSingle.processEvent({ event: transferEvent, mockDb });
      const mockDbUpdated = await InProcessERC20Minter.ERC20RewardsDeposit.processEvent({
        event: depositEvent,
        mockDb,
      });

      const mintLogIndex = Number((transferEvent as { logIndex?: number }).logIndex ?? 0);
      const entityId = `${collection}_${tokenId}_${transferEvent.chainId}_${txHash}_${mintLogIndex}`;
      const actualEntity = mockDbUpdated.entities.Transfers.get(entityId);

      assert.ok(actualEntity, "Transfers entity should exist");
      assert.equal(actualEntity.value, pricePerToken * quantity);
      assert.equal(actualEntity.currency, currency);
    });
  });
});
