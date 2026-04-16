import assert from "assert";
import { encodeAbiParameters, encodeFunctionData, zeroAddress } from "viem";
import { TestHelpers } from "generated";
import type { Transfers, ZoraMedia_Admins, ZoraMedia_Moments } from "generated";

const { MockDb, ZoraMedia } = TestHelpers;

const ZORA_MEDIA_COLLECTION = "0xabefbc9fd2f806065b4f3c237d4b59d9a97bcac7";
const BUYER = "0xcfbf34d385ea2d5eb947063b67ea226dcda3dc38";
const OTHER_OWNER = "0x1111111111111111111111111111111111111111";
const zoraMediaMintAbi = [
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "data",
        type: "tuple",
        components: [
          { name: "tokenURI", type: "string" },
          { name: "metadataURI", type: "string" },
          { name: "contentHash", type: "bytes32" },
          { name: "metadataHash", type: "bytes32" },
        ],
      },
      {
        name: "bidShares",
        type: "tuple",
        components: [
          {
            name: "prevOwner",
            type: "tuple",
            components: [{ name: "value", type: "uint256" }],
          },
          {
            name: "creator",
            type: "tuple",
            components: [{ name: "value", type: "uint256" }],
          },
          {
            name: "owner",
            type: "tuple",
            components: [{ name: "value", type: "uint256" }],
          },
        ],
      },
    ],
    outputs: [],
  },
] as const;

const gnosisSafeAbi = [
  {
    type: "function",
    name: "execTransaction",
    stateMutability: "payable",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "data", type: "bytes" },
      { name: "operation", type: "uint8" },
      { name: "safeTxGas", type: "uint256" },
      { name: "baseGas", type: "uint256" },
      { name: "gasPrice", type: "uint256" },
      { name: "gasToken", type: "address" },
      { name: "refundReceiver", type: "address" },
      { name: "signatures", type: "bytes" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
] as const;

describe("ZoraMedia Handler Tests", () => {
  describe("ZoraMedia.Transfer", () => {
    it("should ignore mint events for token id 0", async () => {
      const mockDb = MockDb.createMockDb();
      const tokenId = 0n;

      const event = ZoraMedia.Transfer.createMockEvent({
        from: zeroAddress,
        to: BUYER,
        tokenId,
      });
      (event as { srcAddress: string }).srcAddress = ZORA_MEDIA_COLLECTION;

      const mockDbUpdated = await ZoraMedia.Transfer.processEvent({ event, mockDb });

      const momentsId = `${ZORA_MEDIA_COLLECTION.toLowerCase()}_${tokenId}_${event.chainId}`;
      const transferId = `${ZORA_MEDIA_COLLECTION.toLowerCase()}_${tokenId}_${event.chainId}_${event.block.number}_${event.logIndex}`;
      const adminId = `${ZORA_MEDIA_COLLECTION.toLowerCase()}_${event.chainId}_${tokenId}_${BUYER.toLowerCase()}`;

      assert.equal(mockDbUpdated.entities.ZoraMedia_Moments.get(momentsId), undefined);
      assert.equal(mockDbUpdated.entities.Transfers.get(transferId), undefined);
      assert.equal(mockDbUpdated.entities.ZoraMedia_Admins.get(adminId), undefined);
    });

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

    it("should decode mint calldata and set initial token URIs", async () => {
      const mockDb = MockDb.createMockDb();
      const tokenId = 7n;
      const tokenURI = "https://ipfs.example/token/7";
      const metadataURI = "https://ipfs.example/token/7/metadata";

      const event = ZoraMedia.Transfer.createMockEvent({
        from: zeroAddress,
        to: BUYER,
        tokenId,
      });
      (event as { srcAddress: string }).srcAddress = ZORA_MEDIA_COLLECTION;
      (
        event as {
          transaction: { hash: string; input: string };
        }
      ).transaction.input = encodeFunctionData({
        abi: zoraMediaMintAbi,
        functionName: "mint",
        args: [
          {
            tokenURI,
            metadataURI,
            contentHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            metadataHash: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          },
          {
            prevOwner: { value: 0n },
            creator: { value: 0n },
            owner: { value: 1000000000000000000n },
          },
        ],
      });

      const mockDbUpdated = await ZoraMedia.Transfer.processEvent({ event, mockDb });

      const entityId = `${ZORA_MEDIA_COLLECTION.toLowerCase()}_${tokenId}_${event.chainId}`;
      const actualEntity = mockDbUpdated.entities.ZoraMedia_Moments.get(entityId);

      assert.equal(actualEntity?.uri, tokenURI);
      assert.equal(actualEntity?.metadata_uri, metadataURI);
    });

    it("should decode legacy mint calldata and set initial token URIs", async () => {
      const mockDb = MockDb.createMockDb();
      const tokenId = 145n;

      const event = ZoraMedia.Transfer.createMockEvent({
        from: zeroAddress,
        to: "0x517bab7661c315c63c6465eed1b4248e6f7fe183",
        tokenId,
      });
      (event as { srcAddress: string }).srcAddress = ZORA_MEDIA_COLLECTION;
      (
        event as {
          transaction: { hash: string; input: string };
        }
      ).transaction.input =
        "0x428284f7000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008ac7230489e80000000000000000000000000000000000000000000000000004e1003b28d9280000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000001004a41e993bdd8b97d0342c999efb22f7ba20d07f39f9c4cdd6c854c0d9f45e5d3dfd1253bbd01972e58cce15236d82d805410d0ff7bc9b3b25636e933d8db075d000000000000000000000000000000000000000000000000000000000000005c68747470733a2f2f696d616765732e6d6972726f722d6d656469612e78797a2f7075626c69636174696f6e2d696d616765732f35653834373134342d323131302d343665622d386530622d3430623162393539396639612e6a70656700000000000000000000000000000000000000000000000000000000000000000000004a68747470733a2f2f73332d75732d776573742d322e616d617a6f6e6177732e636f6d2f6d657461646174612e6d6972726f722e78797a2f73636973736f722d6c6162656c732e6a736f6e00000000000000000000000000000000000000000000";

      const mockDbUpdated = await ZoraMedia.Transfer.processEvent({ event, mockDb });

      const entityId = `${ZORA_MEDIA_COLLECTION.toLowerCase()}_${tokenId}_${event.chainId}`;
      const actualEntity = mockDbUpdated.entities.ZoraMedia_Moments.get(entityId);

      assert.equal(
        actualEntity?.uri,
        "https://images.mirror-media.xyz/publication-images/5e847144-2110-46eb-8e0b-40b1b9599f9a.jpeg"
      );
      assert.equal(
        actualEntity?.metadata_uri,
        "https://s3-us-west-2.amazonaws.com/metadata.mirror.xyz/scissor-labels.json"
      );
    });

    it("should decode mirror wrapper calldata and set initial token URIs", async () => {
      const mockDb = MockDb.createMockDb();
      const tokenId = 2394n;

      const event = ZoraMedia.Transfer.createMockEvent({
        from: zeroAddress,
        to: "0x00055b597e0050405b27c90d21343b1eb5b74165",
        tokenId,
      });
      (event as { srcAddress: string }).srcAddress = ZORA_MEDIA_COLLECTION;
      (
        event as {
          transaction: { hash: string; input: string };
        }
      ).transaction.input =
        "0xd09a71d6000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008ac7230489e80000000000000000000000000000000000000000000000000004e1003b28d9280000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000e0939c892814738495ffde06bc5de098ff4bf4610adfe4cf442f6d0b237955cadaded3ec30226f0ba6a0f463069d25905d2527ca382925305abf47b96fc302bca7000000000000000000000000000000000000000000000000000000000000003a68747470733a2f2f696d616765732e6d6972726f722d6d656469612e78797a2f766964656f732f545255455f46414c53455f434152442e6d7034000000000000000000000000000000000000000000000000000000000000000000000000004468747470733a2f2f6d657461646174612e6d6972726f722d6d656469612e78797a2f6e66742f7468652d70617261646f7865732d6f662d636f696e626173652e6a736f6e00000000000000000000000000000000000000000000000000000000";

      const mockDbUpdated = await ZoraMedia.Transfer.processEvent({ event, mockDb });

      const entityId = `${ZORA_MEDIA_COLLECTION.toLowerCase()}_${tokenId}_${event.chainId}`;
      const actualEntity = mockDbUpdated.entities.ZoraMedia_Moments.get(entityId);

      assert.equal(actualEntity?.uri, "https://images.mirror-media.xyz/videos/TRUE_FALSE_CARD.mp4");
      assert.equal(
        actualEntity?.metadata_uri,
        "https://metadata.mirror-media.xyz/nft/the-paradoxes-of-coinbase.json"
      );
    });

    it("should recover IPFS token and metadata URIs from non-mint calldata (e.g. sudoswap-style layout)", async () => {
      const mockDb = MockDb.createMockDb();
      const tokenId = 31873n;
      const tokenURI = "ipfs://bafkreihqzx47a24svnhfxw3sbzzaytm7x4q2osoem4n2l56z6ruatfq7oy";
      const metadataURI = "ipfs://bafkreicx24kezrnkw2mbas3c2wsnjwrqsio3is7upsieqa3hybkf45i4pa";

      const event = ZoraMedia.Transfer.createMockEvent({
        from: zeroAddress,
        to: "0xc197c5863b2d96f841e2d095d036a3be3917b6d7",
        tokenId,
      });
      (event as { srcAddress: string }).srcAddress = ZORA_MEDIA_COLLECTION;
      (
        event as {
          transaction: { hash: string; input: string };
        }
      ).transaction.input =
        "0x62149ad500000000000000000000000000000000000000000000000000000000013767dc" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000" +
        "697066733a2f2f6261666b72656968717a78343761323473766e686678773373627a7a6179746d37783471326f736f656d346e326c35367a36727561746671376f79" +
        "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000042" +
        "697066733a2f2f6261666b726569637832346b657a726e6b77326d62617333633277736e6a77727173696f3369733775707369657161336879626b66343569347061";

      const mockDbUpdated = await ZoraMedia.Transfer.processEvent({ event, mockDb });

      const entityId = `${ZORA_MEDIA_COLLECTION.toLowerCase()}_${tokenId}_${event.chainId}`;
      const actualEntity = mockDbUpdated.entities.ZoraMedia_Moments.get(entityId);

      assert.equal(actualEntity?.uri, tokenURI);
      assert.equal(actualEntity?.metadata_uri, metadataURI);
    });

    it("should decode Safe-wrapped calldata and set initial token URIs", async () => {
      const mockDb = MockDb.createMockDb();
      const tokenId = 7940n;
      const tokenURI =
        "https://storage.googleapis.com/nft-canvas/koodos/3/8/images/1644253591328.jpeg";
      const metadataURI = "https://storage.googleapis.com/nft-canvas/koodos/3/8/metadata.json";

      const event = ZoraMedia.Transfer.createMockEvent({
        from: zeroAddress,
        to: BUYER,
        tokenId,
      });
      (event as { srcAddress: string }).srcAddress = ZORA_MEDIA_COLLECTION;

      const wrappedData = `0x84684d43${encodeAbiParameters(
        [
          { name: "tokenURIs", type: "string[]" },
          { name: "metadataURIs", type: "string[]" },
        ],
        [[tokenURI], [metadataURI]]
      ).slice(2)}` as `0x${string}`;

      (
        event as {
          transaction: { hash: string; input: string };
        }
      ).transaction.input = encodeFunctionData({
        abi: gnosisSafeAbi,
        functionName: "execTransaction",
        args: [BUYER, 0n, wrappedData, 0, 0n, 0n, 0n, zeroAddress, zeroAddress, "0x"],
      });

      const mockDbUpdated = await ZoraMedia.Transfer.processEvent({ event, mockDb });

      const entityId = `${ZORA_MEDIA_COLLECTION.toLowerCase()}_${tokenId}_${event.chainId}`;
      const actualEntity = mockDbUpdated.entities.ZoraMedia_Moments.get(entityId);

      assert.equal(actualEntity?.uri, tokenURI);
      assert.equal(actualEntity?.metadata_uri, metadataURI);
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
        permission: 2,
        updated_at: event.block.timestamp,
      };

      assert.deepEqual(actualEntity, expectedEntity);
    });
  });

  describe("ZoraMedia.TokenURIUpdated", () => {
    it("should ignore TokenURIUpdated events for token id 0", async () => {
      const tokenId = 0n;
      const event = ZoraMedia.TokenURIUpdated.createMockEvent({
        _tokenId: tokenId,
        owner: OTHER_OWNER,
        _uri: "https://example.com/token/0",
      });
      (event as { srcAddress: string }).srcAddress = ZORA_MEDIA_COLLECTION;

      const mockDbUpdated = await ZoraMedia.TokenURIUpdated.processEvent({
        event,
        mockDb: MockDb.createMockDb(),
      });

      const entityId = `${ZORA_MEDIA_COLLECTION.toLowerCase()}_${tokenId}_${event.chainId}`;
      assert.equal(mockDbUpdated.entities.ZoraMedia_Moments.get(entityId), undefined);
    });

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
    it("should ignore TokenMetadataURIUpdated events for token id 0", async () => {
      const tokenId = 0n;
      const event = ZoraMedia.TokenMetadataURIUpdated.createMockEvent({
        _tokenId: tokenId,
        owner: OTHER_OWNER,
        _uri: "https://example.com/token/0/metadata",
      });
      (event as { srcAddress: string }).srcAddress = ZORA_MEDIA_COLLECTION;

      const mockDbUpdated = await ZoraMedia.TokenMetadataURIUpdated.processEvent({
        event,
        mockDb: MockDb.createMockDb(),
      });

      const entityId = `${ZORA_MEDIA_COLLECTION.toLowerCase()}_${tokenId}_${event.chainId}`;
      assert.equal(mockDbUpdated.entities.ZoraMedia_Moments.get(entityId), undefined);
    });

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
