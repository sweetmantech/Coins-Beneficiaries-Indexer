import assert from "assert";
import { TestHelpers } from "generated";
import type {
  Zora_Collections,
  Zora_Moments,
  Zora_Admins,
  Zora_Comments,
  Transfers,
  Primary_Sales,
  Secondary_Sales,
} from "generated";
import { zeroAddress } from "viem";

const {
  MockDb,
  ZoraCreatorFactory,
  ZoraCreator1155,
  ZoraCreatorFixedPriceSaleStrategy,
  ZoraERC20Minter,
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

    it("should create contract-level Secondary_Sales row (tokenId=0)", async () => {
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
      const saleId = `${collection}_0_${event.chainId}`;
      const actualSale = mockDbUpdated.entities.Secondary_Sales.get(saleId);

      const expectedSale: Secondary_Sales = {
        id: saleId,
        collection,
        token_id: 0n,
        royalty_recipient: FUNDS_RECIPIENT.toLowerCase(),
        royalty_bps: 500,
        chain_id: event.chainId,
        updated_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
      };

      assert.deepEqual(actualSale, expectedSale);
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

    it("should copy contract-level Secondary_Sales to token level when base row exists", async () => {
      const collection = COLLECTION.toLowerCase();
      const tokenId = 1n;

      const contractBase: Secondary_Sales = {
        id: `${collection}_0_1`,
        collection,
        token_id: 0n,
        royalty_recipient: FUNDS_RECIPIENT.toLowerCase(),
        royalty_bps: 500,
        chain_id: 1,
        updated_at: 1000,
        transaction_hash: "0xbase",
      };

      let mockDb = MockDb.createMockDb().entities.Secondary_Sales.set(contractBase);

      const event = ZoraCreator1155.SetupNewToken.createMockEvent({
        tokenId,
        newURI: "https://example.com/token/1",
        maxSupply: 100n,
        mockEventData: { srcAddress: COLLECTION },
      });

      const mockDbUpdated = await ZoraCreator1155.SetupNewToken.processEvent({ event, mockDb });

      const tokenSaleId = `${collection}_${tokenId}_${event.chainId}`;
      const actualTokenSale = mockDbUpdated.entities.Secondary_Sales.get(tokenSaleId);

      assert.ok(actualTokenSale, "token-level Secondary_Sales should exist");
      assert.equal(actualTokenSale.royalty_bps, 500);
      assert.equal(actualTokenSale.royalty_recipient, FUNDS_RECIPIENT.toLowerCase());
      assert.equal(actualTokenSale.token_id, tokenId);
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

  describe("ZoraCreator1155.UpdatedRoyalties", () => {
    it("should upsert Secondary_Sales royalty info", async () => {
      const mockDb = MockDb.createMockDb();
      const tokenId = 1n;

      const event = ZoraCreator1155.UpdatedRoyalties.createMockEvent({
        tokenId,
        user: ADMIN,
        configuration: [0n, 1000n, FUNDS_RECIPIENT],
        mockEventData: { srcAddress: COLLECTION },
      });

      const mockDbUpdated = await ZoraCreator1155.UpdatedRoyalties.processEvent({ event, mockDb });

      const saleId = `${COLLECTION.toLowerCase()}_${tokenId}_${event.chainId}`;
      const actualSale = mockDbUpdated.entities.Secondary_Sales.get(saleId);

      assert.equal(actualSale?.royalty_bps, 1000);
      assert.equal(actualSale?.royalty_recipient, FUNDS_RECIPIENT.toLowerCase());
    });
  });

  // ─── Admins ───────────────────────────────────────────────────────────────

  describe("ZoraCreator1155.UpdatedPermissions", () => {
    it("should create Zora_Admins for permission=2", async () => {
      const mockDb = MockDb.createMockDb();
      const tokenId = 1n;

      const event = ZoraCreator1155.UpdatedPermissions.createMockEvent({
        tokenId,
        user: ADMIN,
        permissions: 2n,
        mockEventData: { srcAddress: COLLECTION },
      });

      const mockDbUpdated = await ZoraCreator1155.UpdatedPermissions.processEvent({
        event,
        mockDb,
      });

      const entityId = `${COLLECTION.toLowerCase()}_${event.chainId}_${tokenId}_${ADMIN.toLowerCase()}`;
      const actualEntity = mockDbUpdated.entities.Zora_Admins.get(entityId);

      const expectedEntity: Zora_Admins = {
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

    it("should skip UpdatedPermissions from Zora factory address", async () => {
      const mockDb = MockDb.createMockDb();
      const tokenId = 0n;

      const event = ZoraCreator1155.UpdatedPermissions.createMockEvent({
        tokenId,
        user: ZORA_FACTORY,
        permissions: 2n,
        mockEventData: { srcAddress: COLLECTION },
      });

      const mockDbUpdated = await ZoraCreator1155.UpdatedPermissions.processEvent({
        event,
        mockDb,
      });

      const entityId = `${COLLECTION.toLowerCase()}_${event.chainId}_${tokenId}_${ZORA_FACTORY.toLowerCase()}`;
      assert.equal(mockDbUpdated.entities.Zora_Admins.get(entityId), undefined);
    });
  });

  // ─── Sales ────────────────────────────────────────────────────────────────

  describe("ZoraCreatorFixedPriceSaleStrategy.SaleSet", () => {
    it("should create Primary_Sales entity for ETH sale", async () => {
      const mockDb = MockDb.createMockDb();
      const tokenId = 1n;
      const price = 1000000000000000n; // 0.001 ETH

      const event = ZoraCreatorFixedPriceSaleStrategy.SaleSet.createMockEvent({
        mediaContract: COLLECTION,
        tokenId,
        salesConfig: [0n, 0n, 0n, price, FUNDS_RECIPIENT],
      });

      const mockDbUpdated = await ZoraCreatorFixedPriceSaleStrategy.SaleSet.processEvent({
        event,
        mockDb,
      });

      const saleId = `${COLLECTION.toLowerCase()}_${tokenId}_${event.chainId}`;
      const actualSale = mockDbUpdated.entities.Primary_Sales.get(saleId);

      assert.ok(actualSale, "Primary_Sales should exist");
      assert.equal(actualSale.price_per_token, price);
      assert.equal(actualSale.funds_recipient, FUNDS_RECIPIENT.toLowerCase());
      assert.equal(actualSale.currency, zeroAddress);
    });
  });

  describe("ZoraERC20Minter.SaleSet", () => {
    it("should create Primary_Sales entity for ERC20 sale", async () => {
      const mockDb = MockDb.createMockDb();
      const tokenId = 2n;
      const price = 5000000n; // 5 USDC
      const usdc = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";

      const event = ZoraERC20Minter.SaleSet.createMockEvent({
        mediaContract: COLLECTION,
        tokenId,
        salesConfig: [0n, 0n, 0n, price, FUNDS_RECIPIENT, usdc],
      });

      const mockDbUpdated = await ZoraERC20Minter.SaleSet.processEvent({ event, mockDb });

      const saleId = `${COLLECTION.toLowerCase()}_${tokenId}_${event.chainId}`;
      const actualSale = mockDbUpdated.entities.Primary_Sales.get(saleId);

      assert.ok(actualSale, "Primary_Sales should exist");
      assert.equal(actualSale.price_per_token, price);
      assert.equal(actualSale.currency, usdc.toLowerCase());
    });
  });

  // ─── Comments ────────────────────────────────────────────────────────────

  describe("ZoraERC20Minter.MintComment", () => {
    it("should create Zora_Comments entity", async () => {
      const mockDb = MockDb.createMockDb();

      const event = ZoraERC20Minter.MintComment.createMockEvent({
        sender: BUYER,
        tokenContract: COLLECTION,
        tokenId: 1n,
        quantity: 1n,
        comment: "Great track!",
      });

      const mockDbUpdated = await ZoraERC20Minter.MintComment.processEvent({ event, mockDb });

      const entityId = `${COLLECTION.toLowerCase()}_1_${event.chainId}_${event.block.number}_${event.logIndex}`;
      const actualEntity = mockDbUpdated.entities.Zora_Comments.get(entityId);

      const expectedEntity: Zora_Comments = {
        id: entityId,
        sender: BUYER.toLowerCase(),
        collection: COLLECTION.toLowerCase(),
        token_id: 1n,
        comment: "Great track!",
        commented_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
        chain_id: event.chainId,
      };

      assert.deepEqual(actualEntity, expectedEntity);
    });
  });

  describe("ZoraCreatorFixedPriceSaleStrategy.MintComment", () => {
    it("should create Zora_Comments entity", async () => {
      const mockDb = MockDb.createMockDb();

      const event = ZoraCreatorFixedPriceSaleStrategy.MintComment.createMockEvent({
        sender: BUYER,
        tokenContract: COLLECTION,
        tokenId: 2n,
        quantity: 1n,
        comment: "Love this!",
      });

      const mockDbUpdated = await ZoraCreatorFixedPriceSaleStrategy.MintComment.processEvent({
        event,
        mockDb,
      });

      const entityId = `${COLLECTION.toLowerCase()}_2_${event.chainId}_${event.block.number}_${event.logIndex}`;
      const actualEntity = mockDbUpdated.entities.Zora_Comments.get(entityId);

      const expectedEntity: Zora_Comments = {
        id: entityId,
        sender: BUYER.toLowerCase(),
        collection: COLLECTION.toLowerCase(),
        token_id: 2n,
        comment: "Love this!",
        commented_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
        chain_id: event.chainId,
      };

      assert.deepEqual(actualEntity, expectedEntity);
    });
  });

  // ─── Transfers ───────────────────────────────────────────────────────────

  describe("ZoraCreator1155.TransferSingle (mint)", () => {
    it("should create Transfers entity with undefined value/currency", async () => {
      const tokenId = 1n;
      const quantity = 2n;
      const txHash = "0x1234567890123456789012345678901234567890123456789012345678901234";

      const event = ZoraCreator1155.TransferSingle.createMockEvent({
        operator: ADMIN,
        from: zeroAddress,
        to: BUYER,
        id: tokenId,
        value: quantity,
        mockEventData: {
          srcAddress: COLLECTION,
          transaction: { hash: txHash },
        },
      });

      const mockDb = MockDb.createMockDb();
      const mockDbUpdated = await ZoraCreator1155.TransferSingle.processEvent({ event, mockDb });

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

  describe("ZoraCreator1155.Purchased (ETH mint)", () => {
    it("should enrich same-tx mint row with ETH value", async () => {
      const tokenId = 1n;
      const value = 1000000000000000n;
      const txHash = "0x1234567890123456789012345678901234567890123456789012345678901234";
      const collection = COLLECTION.toLowerCase();

      const transferEvent = ZoraCreator1155.TransferSingle.createMockEvent({
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
      });

      const purchasedEvent = ZoraCreator1155.Purchased.createMockEvent({
        sender: BUYER,
        minter: "0x04E2516A2c207E84a1839755675dfd8eF6302F0a",
        tokenId,
        quantity: 1n,
        value,
        mockEventData: {
          logIndex: 20,
          srcAddress: COLLECTION,
          transaction: { hash: txHash },
        },
      });

      let mockDb = MockDb.createMockDb();
      mockDb = await ZoraCreator1155.TransferSingle.processEvent({
        event: transferEvent,
        mockDb,
      });
      const mockDbUpdated = await ZoraCreator1155.Purchased.processEvent({
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

  describe("ZoraERC20Minter.ERC20RewardsDeposit (ERC20 mint)", () => {
    it("should enrich same-tx mint row with ERC20 value from Primary_Sales", async () => {
      const tokenId = 2n;
      const usdc = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
      const pricePerToken = 5000000n;
      const quantity = 2n;
      const collection = COLLECTION.toLowerCase();
      const txHash = "0x1234567890123456789012345678901234567890123456789012345678901234";

      const transferEvent = ZoraCreator1155.TransferSingle.createMockEvent({
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
      });

      const depositEvent = ZoraERC20Minter.ERC20RewardsDeposit.createMockEvent({
        firstMinter: BUYER,
        collection: COLLECTION,
        currency: usdc,
        tokenId,
        mockEventData: {
          logIndex: 15,
          transaction: { hash: txHash },
        },
      });

      const saleId = `${collection}_${tokenId}_${transferEvent.chainId}`;
      const sale: Primary_Sales = {
        id: saleId,
        collection,
        token_id: tokenId,
        price_per_token: pricePerToken,
        funds_recipient: FUNDS_RECIPIENT.toLowerCase(),
        currency: usdc,
        sale_start: undefined,
        sale_end: undefined,
        max_tokens_per_address: undefined,
        chain_id: transferEvent.chainId,
        transaction_hash: txHash,
        created_at: 0,
      };

      let mockDb = MockDb.createMockDb().entities.Primary_Sales.set(sale);
      mockDb = await ZoraCreator1155.TransferSingle.processEvent({ event: transferEvent, mockDb });
      const mockDbUpdated = await ZoraERC20Minter.ERC20RewardsDeposit.processEvent({
        event: depositEvent,
        mockDb,
      });

      const mintLogIndex = Number((transferEvent as { logIndex?: number }).logIndex ?? 0);
      const entityId = `${collection}_${tokenId}_${transferEvent.chainId}_${txHash}_${mintLogIndex}`;
      const actualEntity = mockDbUpdated.entities.Transfers.get(entityId);

      assert.ok(actualEntity, "Transfers entity should exist");
      assert.equal(actualEntity.value, pricePerToken * quantity);
      assert.equal(actualEntity.currency, usdc);
    });
  });
});
