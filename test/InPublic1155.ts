import assert from "assert";
import { TestHelpers } from "generated";
import type { InProcess_Comments, Transfers } from "generated";
import { zeroAddress } from "viem";
import { IN_PUBLIC_1155 } from "@/lib/inpublic/constants";

const { MockDb, InPublic1155, Zora } = TestHelpers;

const ADMIN = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
const BUYER = "0xcfbf34d385ea2d5eb947063b67ea226dcda3dc38";
const OTHER_COLLECTION = "0x1234567890123456789012345678901234567890";

describe("IN PUBLIC 1155 Handler Tests", () => {
  describe("InPublic1155.TransferSingle", () => {
    it("should create Transfers entity for mints and secondary transfers", async () => {
      const tokenId = 1n;
      const quantity = 2n;
      const txHash = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd";
      const mockDb = MockDb.createMockDb();

      const event = InPublic1155.TransferSingle.createMockEvent({
        operator: ADMIN,
        from: zeroAddress,
        to: BUYER,
        id: tokenId,
        value: quantity,
        mockEventData: { srcAddress: IN_PUBLIC_1155 },
      });
      (event.transaction as { hash: string }).hash = txHash;

      const mockDbUpdated = await InPublic1155.TransferSingle.processEvent({ event, mockDb });

      const mintLogIndex = Number((event as { logIndex?: number }).logIndex ?? 0);
      const collection = IN_PUBLIC_1155.toLowerCase();
      const entityId = `${collection}_${tokenId}_${event.chainId}_${txHash}_${mintLogIndex}`;
      const actualEntity = mockDbUpdated.entities.Transfers.get(entityId);

      const expectedEntity: Transfers = {
        id: entityId,
        collection,
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

    it("should skip burns to zeroAddress", async () => {
      const mockDb = MockDb.createMockDb();

      const event = InPublic1155.TransferSingle.createMockEvent({
        operator: ADMIN,
        from: BUYER,
        to: zeroAddress,
        id: 1n,
        value: 1n,
        mockEventData: { srcAddress: IN_PUBLIC_1155 },
      });

      const mockDbUpdated = await InPublic1155.TransferSingle.processEvent({ event, mockDb });

      assert.equal(mockDbUpdated.entities.Transfers.getAll().length, 0);
    });
  });

  describe("InPublic1155.TransferBatch", () => {
    it("should create one Transfers row per id in the batch", async () => {
      const txHash = "0x1234567890123456789012345678901234567890123456789012345678901234";
      const mockDb = MockDb.createMockDb();

      const event = InPublic1155.TransferBatch.createMockEvent({
        operator: ADMIN,
        from: zeroAddress,
        to: BUYER,
        ids: [1n, 2n],
        values: [3n, 5n],
        mockEventData: { srcAddress: IN_PUBLIC_1155 },
      });
      (event.transaction as { hash: string }).hash = txHash;

      const mockDbUpdated = await InPublic1155.TransferBatch.processEvent({ event, mockDb });

      const logIndex = Number((event as { logIndex?: number }).logIndex ?? 0);
      const collection = IN_PUBLIC_1155.toLowerCase();

      assert.deepEqual(
        mockDbUpdated.entities.Transfers.get(
          `${collection}_1_${event.chainId}_${txHash}_${logIndex}_0`
        ),
        {
          id: `${collection}_1_${event.chainId}_${txHash}_${logIndex}_0`,
          collection,
          token_id: 1n,
          chain_id: event.chainId,
          recipient: BUYER.toLowerCase(),
          quantity: 3n,
          value: undefined,
          currency: undefined,
          transaction_hash: txHash,
          block_number: BigInt(event.block.number),
          transferred_at: event.block.timestamp,
        }
      );

      assert.deepEqual(
        mockDbUpdated.entities.Transfers.get(
          `${collection}_2_${event.chainId}_${txHash}_${logIndex}_1`
        )?.quantity,
        5n
      );
    });
  });

  describe("Zora.MintComment", () => {
    it("should create InProcess_Comments for IN PUBLIC mint comments", async () => {
      const mockDb = MockDb.createMockDb();

      const event = Zora.MintComment.createMockEvent({
        sender: BUYER,
        tokenContract: IN_PUBLIC_1155,
        tokenId: 1n,
        quantity: 1n,
        comment: "IN PUBLIC mint comment",
      });

      const mockDbUpdated = await Zora.MintComment.processEvent({
        event,
        mockDb,
      });

      const collection = IN_PUBLIC_1155.toLowerCase();
      const entityId = `${collection}_1_${event.chainId}_${event.block.number}_${event.logIndex}`;
      const actualEntity = mockDbUpdated.entities.InProcess_Comments.get(entityId);

      const expectedEntity: InProcess_Comments = {
        id: entityId,
        sender: BUYER.toLowerCase(),
        collection,
        token_id: 1n,
        comment: "IN PUBLIC mint comment",
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

    it("should skip mint comments for non-IN PUBLIC collections", async () => {
      const mockDb = MockDb.createMockDb();

      const event = Zora.MintComment.createMockEvent({
        sender: BUYER,
        tokenContract: OTHER_COLLECTION,
        tokenId: 1n,
        quantity: 1n,
        comment: "Other collection comment",
      });

      const mockDbUpdated = await Zora.MintComment.processEvent({
        event,
        mockDb,
      });

      assert.equal(mockDbUpdated.entities.InProcess_Comments.getAll().length, 0);
    });
  });
});
