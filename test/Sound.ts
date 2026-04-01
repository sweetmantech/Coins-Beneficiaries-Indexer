import assert from "assert";
import { encodeAbiParameters, zeroAddress } from "viem";
import { TestHelpers } from "generated";
import type {
  Sound_Editions,
  Sound_Moments,
  Primary_Sales,
  Secondary_Sales,
  Collectors,
  Payments,
} from "generated";

const { MockDb, SoundCreatorV2, SoundMetadata, SuperMinterV2, SoundEditionV2_1 } = TestHelpers;

const EDITION = "0x38125f59663ad6b9f84efdb790dcde61692adec4";
const OWNER = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const CONTRACT_URI = "ar://contractHash/";
const TIER_FREE = 0;
const TIER_LIMITED = 1;
const FREE_BASE_URI = "ar://21xBOczDUFX0bg52sy34LDTO1Fro6mBGvd1FUYe0wvA";
const LIMITED_BASE_URI = "ar://yYH8g5Nt9bjK8B_qOk6R22K1rKkJMfPRuoMnbUhIQaI";

describe("Sound.xyz Handler Tests", () => {
  // ─────────────────────────────────────────────
  // Sound_Editions
  // ─────────────────────────────────────────────
  describe("SoundCreatorV2.Created", () => {
    it("should create Sound_Editions with owner", async () => {
      const mockDb = MockDb.createMockDb();

      const event = SoundCreatorV2.Created.createMockEvent({
        edition: EDITION,
        owner: OWNER,
      });

      const db = await SoundCreatorV2.Created.processEvent({ event, mockDb });

      const id = `${EDITION}_${event.chainId}`;
      const actual = await db.entities.Sound_Editions.get(id);

      const expected: Sound_Editions = {
        id,
        address: EDITION,
        name: "",
        owner: OWNER.toLowerCase(),
        uri: "",
        funding_recipient: "",
        royalty_bps: 0,
        chain_id: event.chainId,
        created_at: event.block.timestamp,
        updated_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
      };

      assert.deepEqual(actual, expected);
    });
  });

  describe("SoundCreatorV2.Created (with initData)", () => {
    it("should decode name and uri from initData", async () => {
      const encoded = encodeAbiParameters(
        [
          {
            name: "init",
            type: "tuple",
            components: [
              { name: "name", type: "string" },
              { name: "symbol", type: "string" },
              { name: "metadataModule", type: "address" },
              { name: "baseURI", type: "string" },
              { name: "contractURI", type: "string" },
              { name: "fundingRecipient", type: "address" },
              { name: "royaltyBPS", type: "uint16" },
              { name: "isCreateTierFrozen", type: "bool" },
              { name: "isMintRandomnessEnabled", type: "bool" },
              {
                name: "tierCreations",
                type: "tuple[]",
                components: [
                  { name: "tier", type: "uint8" },
                  { name: "maxMintableLower", type: "uint32" },
                  { name: "maxMintableUpper", type: "uint32" },
                  { name: "cutoffTime", type: "uint32" },
                  { name: "mintRandomnessEnabled", type: "bool" },
                  { name: "isFrozen", type: "bool" },
                ],
              },
            ],
          },
        ],
        [
          {
            name: "Test Album",
            symbol: "TA",
            metadataModule: "0x0000000000000000000000000000000000000000",
            baseURI: "",
            contractURI: CONTRACT_URI,
            fundingRecipient: OWNER as `0x${string}`,
            royaltyBPS: 1000,
            isCreateTierFrozen: false,
            isMintRandomnessEnabled: false,
            tierCreations: [],
          },
        ]
      );
      const initData = `0x12345678${encoded.slice(2)}` as `0x${string}`;

      const event = SoundCreatorV2.Created.createMockEvent({
        edition: EDITION,
        owner: OWNER,
        initData,
      });

      const db = await SoundCreatorV2.Created.processEvent({
        event,
        mockDb: MockDb.createMockDb(),
      });

      const id = `${EDITION.toLowerCase()}_${event.chainId}`;
      const actual = await db.entities.Sound_Editions.get(id);

      assert.equal(actual?.name, "Test Album");
      assert.equal(actual?.uri, CONTRACT_URI);
      assert.equal(actual?.owner, OWNER.toLowerCase());
    });
  });

  // ─────────────────────────────────────────────
  // Sound_Moments
  // ─────────────────────────────────────────────
  describe("SoundMetadata.BaseURISet", () => {
    it("should create Sound_Moments row for tier", async () => {
      const mockDb = MockDb.createMockDb();

      const event = SoundMetadata.BaseURISet.createMockEvent({
        edition: EDITION as `0x${string}`,
        tier: BigInt(TIER_FREE),
        uri: FREE_BASE_URI,
      });

      const db = await SoundMetadata.BaseURISet.processEvent({ event, mockDb });

      const id = `${EDITION}_${TIER_FREE}_${event.chainId}`;
      const actual = await db.entities.Sound_Moments.get(id);

      const expected: Sound_Moments = {
        id,
        collection: EDITION,
        tier: TIER_FREE,
        uri: `${FREE_BASE_URI}/${TIER_FREE}`,
        chain_id: event.chainId,
        created_at: event.block.timestamp,
        updated_at: event.block.timestamp,
        transaction_hash: event.transaction.hash,
      };

      assert.deepEqual(actual, expected);
    });

    it("should update uri and preserve created_at on subsequent BaseURISet", async () => {
      const mockDb = MockDb.createMockDb().entities.Sound_Moments.set({
        id: `${EDITION}_${TIER_FREE}_8453`,
        collection: EDITION,
        tier: TIER_FREE,
        uri: "ar://old/",
        chain_id: 8453,
        created_at: 1000,
        updated_at: 1000,
        transaction_hash: "0x00",
      });

      const event = SoundMetadata.BaseURISet.createMockEvent({
        edition: EDITION as `0x${string}`,
        tier: BigInt(TIER_FREE),
        uri: FREE_BASE_URI,
        mockEventData: { chainId: 8453 },
      });

      const db = await SoundMetadata.BaseURISet.processEvent({ event, mockDb });

      const id = `${EDITION}_${TIER_FREE}_8453`;
      const actual = await db.entities.Sound_Moments.get(id);

      assert.equal(actual?.uri, `${FREE_BASE_URI}/${TIER_FREE}`);
      assert.equal(actual?.created_at, 1000); // preserved
    });

    it("should create separate rows for different tiers", async () => {
      const mockDb = MockDb.createMockDb();

      const freeEvent = SoundMetadata.BaseURISet.createMockEvent({
        edition: EDITION as `0x${string}`,
        tier: BigInt(TIER_FREE),
        uri: FREE_BASE_URI,
        mockEventData: { chainId: 8453 },
      });
      const db1 = await SoundMetadata.BaseURISet.processEvent({ event: freeEvent, mockDb });

      const limitedEvent = SoundMetadata.BaseURISet.createMockEvent({
        edition: EDITION as `0x${string}`,
        tier: BigInt(TIER_LIMITED),
        uri: LIMITED_BASE_URI,
        mockEventData: { chainId: 8453 },
      });
      const db2 = await SoundMetadata.BaseURISet.processEvent({ event: limitedEvent, mockDb: db1 });

      const free = await db2.entities.Sound_Moments.get(`${EDITION}_${TIER_FREE}_8453`);
      const limited = await db2.entities.Sound_Moments.get(`${EDITION}_${TIER_LIMITED}_8453`);

      assert.equal(free?.uri, `${FREE_BASE_URI}/${TIER_FREE}`);
      assert.equal(limited?.uri, `${LIMITED_BASE_URI}/${TIER_LIMITED}`);
    });
  });
});

// ─────────────────────────────────────────────────────────
// Sound_Sales Handler Tests
// ─────────────────────────────────────────────────────────

const RECIPIENT = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000";

// MintCreation tuple: (address,uint96,uint32,uint32,uint32,uint32,uint16,bytes32,uint8,address,uint8,bytes32)
// Indexes:            [0]     [1]    [2]     [3]    [4]          [5]       [6]   [7]   [8] [9]     [10][11]
const MINT_CREATION = [
  EDITION, // [0] edition (address)
  1_000_000n, // [1] price (uint96)
  1000n, // [2] startTime (uint32)
  2000n, // [3] endTime (uint32)
  5n, // [4] maxMintablePerAccount (uint32)
  100n, // [5] maxMintable (uint32)
  0n, // [6] affiliateFeeBPS (uint16)
  ZERO_BYTES32, // [7] affiliateMerkleRoot (bytes32)
  0n, // [8] tier (uint8)
  zeroAddress, // [9] platform (address)
  0n, // [10] mode (uint8)
  ZERO_BYTES32, // [11] merkleRoot (bytes32)
] as [
  string,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  string,
  bigint,
  string,
  bigint,
  string,
];

function makeBasePrimarySale(chainId: number): Primary_Sales {
  return {
    id: `${EDITION}_0_0_${chainId}`,
    collection: EDITION,
    token_id: 0n,
    price_per_token: 1_000_000n,
    funds_recipient: zeroAddress,
    currency: zeroAddress,
    sale_start: 1000n,
    sale_end: 2000n,
    max_tokens_per_address: 5n,
    schedule_num: 0,
    chain_id: chainId,
    transaction_hash: "",
    created_at: 0,
  };
}

describe("SuperMinterV2 Handler Tests", () => {
  describe("MintCreated", () => {
    it("should create Primary_Sales with zeroAddress funds_recipient when no edition exists", async () => {
      const mockDb = MockDb.createMockDb();

      const event = SuperMinterV2.MintCreated.createMockEvent({
        edition: EDITION as `0x${string}`,
        tier: 0n,
        scheduleNum: 0n,
        creation: MINT_CREATION,
      });

      const db = await SuperMinterV2.MintCreated.processEvent({ event, mockDb });

      const id = `${EDITION}_0_0_${event.chainId}`;
      const actual = await db.entities.Primary_Sales.get(id);

      const expected: Primary_Sales = {
        id,
        collection: EDITION,
        token_id: 0n,
        price_per_token: 1_000_000n,
        funds_recipient: zeroAddress,
        currency: zeroAddress,
        sale_start: 1000n,
        sale_end: 2000n,
        max_tokens_per_address: 5n,
        schedule_num: 0,
        chain_id: event.chainId,
        transaction_hash: event.transaction.hash,
        created_at: event.block.timestamp,
      };

      assert.deepEqual(actual, expected);
    });

    it("should use funding_recipient from Sound_Editions when present", async () => {
      const mockDb = MockDb.createMockDb().entities.Sound_Editions.set({
        id: `${EDITION}_8453`,
        address: EDITION,
        name: "Test",
        owner: OWNER,
        uri: "",
        funding_recipient: RECIPIENT,
        royalty_bps: 1000,
        chain_id: 8453,
        created_at: 0,
        updated_at: 0,
        transaction_hash: "0x00",
      });

      const event = SuperMinterV2.MintCreated.createMockEvent({
        edition: EDITION as `0x${string}`,
        tier: 0n,
        scheduleNum: 0n,
        creation: MINT_CREATION,
        mockEventData: { chainId: 8453 },
      });

      const db = await SuperMinterV2.MintCreated.processEvent({ event, mockDb });

      const actual = await db.entities.Primary_Sales.get(`${EDITION}_0_0_8453`);
      assert.equal(actual?.funds_recipient, RECIPIENT);
    });

    it("should not overwrite a more recent Primary_Sales entity", async () => {
      const event = SuperMinterV2.MintCreated.createMockEvent({
        edition: EDITION as `0x${string}`,
        tier: 0n,
        scheduleNum: 0n,
        creation: MINT_CREATION,
      });

      const futureTimestamp = event.block.timestamp + 9999;
      const originalPrice = 999n;

      const mockDb = MockDb.createMockDb().entities.Primary_Sales.set({
        ...makeBasePrimarySale(event.chainId),
        price_per_token: originalPrice,
        created_at: futureTimestamp,
      });

      const db = await SuperMinterV2.MintCreated.processEvent({ event, mockDb });

      const actual = await db.entities.Primary_Sales.get(`${EDITION}_0_0_${event.chainId}`);
      assert.equal(
        actual?.price_per_token,
        originalPrice,
        "should not overwrite more recent entity"
      );
    });
  });

  describe("PriceSet", () => {
    it("should update price_per_token on existing Primary_Sales", async () => {
      const event = SuperMinterV2.PriceSet.createMockEvent({
        edition: EDITION as `0x${string}`,
        tier: 0n,
        scheduleNum: 0n,
        price: 2_000_000n,
      });

      const mockDb = MockDb.createMockDb().entities.Primary_Sales.set(
        makeBasePrimarySale(event.chainId)
      );

      const db = await SuperMinterV2.PriceSet.processEvent({ event, mockDb });

      const actual = await db.entities.Primary_Sales.get(`${EDITION}_0_0_${event.chainId}`);
      assert.equal(actual?.price_per_token, 2_000_000n);
    });

    it("should do nothing when Primary_Sales entity does not exist", async () => {
      const mockDb = MockDb.createMockDb();

      const event = SuperMinterV2.PriceSet.createMockEvent({
        edition: EDITION as `0x${string}`,
        tier: 0n,
        scheduleNum: 0n,
        price: 2_000_000n,
      });

      const db = await SuperMinterV2.PriceSet.processEvent({ event, mockDb });

      const actual = await db.entities.Primary_Sales.get(`${EDITION}_0_0_${event.chainId}`);
      assert.equal(actual, undefined);
    });
  });

  describe("TimeRangeSet", () => {
    it("should update sale_start and sale_end on existing Primary_Sales", async () => {
      const event = SuperMinterV2.TimeRangeSet.createMockEvent({
        edition: EDITION as `0x${string}`,
        tier: 0n,
        scheduleNum: 0n,
        startTime: 5000n,
        endTime: 9000n,
      });

      const mockDb = MockDb.createMockDb().entities.Primary_Sales.set(
        makeBasePrimarySale(event.chainId)
      );

      const db = await SuperMinterV2.TimeRangeSet.processEvent({ event, mockDb });

      const actual = await db.entities.Primary_Sales.get(`${EDITION}_0_0_${event.chainId}`);
      assert.equal(actual?.sale_start, 5000n);
      assert.equal(actual?.sale_end, 9000n);
    });

    it("should do nothing when entity does not exist", async () => {
      const event = SuperMinterV2.TimeRangeSet.createMockEvent({
        edition: EDITION as `0x${string}`,
        tier: 0n,
        scheduleNum: 0n,
        startTime: 5000n,
        endTime: 9000n,
      });

      const db = await SuperMinterV2.TimeRangeSet.processEvent({
        event,
        mockDb: MockDb.createMockDb(),
      });

      const actual = await db.entities.Primary_Sales.get(`${EDITION}_0_0_${event.chainId}`);
      assert.equal(actual, undefined);
    });
  });

  describe("MaxMintablePerAccountSet", () => {
    it("should update max_tokens_per_address on existing Primary_Sales", async () => {
      const event = SuperMinterV2.MaxMintablePerAccountSet.createMockEvent({
        edition: EDITION as `0x${string}`,
        tier: 0n,
        scheduleNum: 0n,
        value: 10n,
      });

      const mockDb = MockDb.createMockDb().entities.Primary_Sales.set(
        makeBasePrimarySale(event.chainId)
      );

      const db = await SuperMinterV2.MaxMintablePerAccountSet.processEvent({ event, mockDb });

      const actual = await db.entities.Primary_Sales.get(`${EDITION}_0_0_${event.chainId}`);
      assert.equal(actual?.max_tokens_per_address, 10n);
    });

    it("should do nothing when entity does not exist", async () => {
      const event = SuperMinterV2.MaxMintablePerAccountSet.createMockEvent({
        edition: EDITION as `0x${string}`,
        tier: 0n,
        scheduleNum: 0n,
        value: 10n,
      });

      const db = await SuperMinterV2.MaxMintablePerAccountSet.processEvent({
        event,
        mockDb: MockDb.createMockDb(),
      });

      const actual = await db.entities.Primary_Sales.get(`${EDITION}_0_0_${event.chainId}`);
      assert.equal(actual, undefined);
    });
  });
});

// ─────────────────────────────────────────────────────────
// Sound_Collectors Handler Tests
// ─────────────────────────────────────────────────────────

const COLLECTOR = "0xcccccccccccccccccccccccccccccccccccccccc";
const FUNDING_RECIPIENT = "0xdddddddddddddddddddddddddddddddddddddddd";

// MintedLogData tuple: [quantity, fromTokenId, allowlisted, allowlistedQuantity,
//   signedQuantity, signedClaimTicket, affiliate, affiliated,
//   requiredEtherValue, unitPrice, finalArtistFee, finalAffiliateFee, finalPlatformFee]
function makeMintedData(finalArtistFee: bigint) {
  return [
    2n, // [0] quantity
    1n, // [1] fromTokenId
    ZERO_BYTES32, // [2] allowlisted (bytes32)
    0n, // [3] allowlistedQuantity
    0n, // [4] signedQuantity
    0n, // [5] signedClaimTicket
    zeroAddress, // [6] affiliate
    false, // [7] affiliated
    finalArtistFee, // [8] requiredEtherValue
    500_000n, // [9] unitPrice
    finalArtistFee, // [10] finalArtistFee
    0n, // [11] finalAffiliateFee
    0n, // [12] finalPlatformFee
  ] as [
    bigint,
    bigint,
    string,
    bigint,
    bigint,
    bigint,
    string,
    boolean,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
  ];
}

describe("SuperMinterV2.Minted Handler Tests", () => {
  it("should create Collectors entity", async () => {
    const mockDb = MockDb.createMockDb();

    const event = SuperMinterV2.Minted.createMockEvent({
      edition: EDITION as `0x${string}`,
      tier: 0n,
      scheduleNum: 0n,
      to: COLLECTOR as `0x${string}`,
      data: makeMintedData(0n),
      attributionId: 0n,
    });

    const db = await SuperMinterV2.Minted.processEvent({ event, mockDb });

    const id = `${EDITION}_0_${event.chainId}_${event.block.number}_${event.logIndex}`;
    const actual = await db.entities.Collectors.get(id);

    const expected: Collectors = {
      id,
      collection: EDITION,
      token_id: 1n,
      amount: 2n,
      chain_id: event.chainId,
      collector: COLLECTOR.toLowerCase(),
      transaction_hash: event.transaction.hash,
      collected_at: event.block.timestamp,
    };

    assert.deepEqual(actual, expected);
  });

  it("should skip Payments when finalArtistFee is 0", async () => {
    const mockDb = MockDb.createMockDb();

    const event = SuperMinterV2.Minted.createMockEvent({
      edition: EDITION as `0x${string}`,
      tier: 0n,
      scheduleNum: 0n,
      to: COLLECTOR as `0x${string}`,
      data: makeMintedData(0n),
      attributionId: 0n,
    });

    const db = await SuperMinterV2.Minted.processEvent({ event, mockDb });

    const id = `${event.chainId}_${event.block.number}_${event.logIndex}`;
    const actual = await db.entities.Payments.get(id);
    assert.equal(actual, undefined);
  });

  it("should create Payments with funding_recipient from Sound_Editions", async () => {
    const mockDb = MockDb.createMockDb().entities.Sound_Editions.set({
      id: `${EDITION}_8453`,
      address: EDITION,
      name: "Test",
      owner: OWNER,
      uri: "",
      funding_recipient: FUNDING_RECIPIENT,
      royalty_bps: 1000,
      chain_id: 8453,
      created_at: 0,
      updated_at: 0,
      transaction_hash: "0x00",
    });

    const event = SuperMinterV2.Minted.createMockEvent({
      edition: EDITION as `0x${string}`,
      tier: 0n,
      scheduleNum: 0n,
      to: COLLECTOR as `0x${string}`,
      data: makeMintedData(1_000_000n),
      attributionId: 0n,
      mockEventData: { chainId: 8453 },
    });

    const db = await SuperMinterV2.Minted.processEvent({ event, mockDb });

    const id = `8453_${event.block.number}_${event.logIndex}`;
    const actual = await db.entities.Payments.get(id);

    assert.equal(actual?.recipient, FUNDING_RECIPIENT);
    assert.equal(actual?.spender, COLLECTOR.toLowerCase());
    assert.equal(actual?.collection, EDITION);
  });

  it("should fallback to edition address when Sound_Editions not found", async () => {
    const mockDb = MockDb.createMockDb();

    const event = SuperMinterV2.Minted.createMockEvent({
      edition: EDITION as `0x${string}`,
      tier: 0n,
      scheduleNum: 0n,
      to: COLLECTOR as `0x${string}`,
      data: makeMintedData(1_000_000n),
      attributionId: 0n,
    });

    const db = await SuperMinterV2.Minted.processEvent({ event, mockDb });

    const id = `${event.chainId}_${event.block.number}_${event.logIndex}`;
    const actual = await db.entities.Payments.get(id);

    assert.equal(actual?.recipient, EDITION);
  });
});

describe("SoundEditionV2_1 Handler Tests", () => {
  describe("FundingRecipientSet", () => {
    it("should update Sound_Editions.funding_recipient", async () => {
      const event = SoundEditionV2_1.FundingRecipientSet.createMockEvent({
        recipient: RECIPIENT as `0x${string}`,
      });
      (event as { srcAddress: string }).srcAddress = EDITION;

      const mockDb = MockDb.createMockDb().entities.Sound_Editions.set({
        id: `${EDITION}_${event.chainId}`,
        address: EDITION,
        name: "Test",
        owner: OWNER,
        uri: "",
        funding_recipient: zeroAddress,
        royalty_bps: 500,
        chain_id: event.chainId,
        created_at: 0,
        updated_at: 0,
        transaction_hash: "0x00",
      });

      const db = await SoundEditionV2_1.FundingRecipientSet.processEvent({ event, mockDb });

      const actual = await db.entities.Sound_Editions.get(`${EDITION}_${event.chainId}`);
      assert.equal(actual?.funding_recipient, RECIPIENT.toLowerCase());
    });

    it("should update Secondary_Sales.royalty_recipient", async () => {
      const event = SoundEditionV2_1.FundingRecipientSet.createMockEvent({
        recipient: RECIPIENT as `0x${string}`,
      });
      (event as { srcAddress: string }).srcAddress = EDITION;

      const secondary: Secondary_Sales = {
        id: `${EDITION}_0_${event.chainId}`,
        collection: EDITION,
        token_id: 0n,
        royalty_recipient: zeroAddress,
        royalty_bps: 500,
        chain_id: event.chainId,
        updated_at: 0,
        transaction_hash: "0x00",
      };

      const mockDb = MockDb.createMockDb().entities.Secondary_Sales.set(secondary);

      const db = await SoundEditionV2_1.FundingRecipientSet.processEvent({ event, mockDb });

      const actual = await db.entities.Secondary_Sales.get(`${EDITION}_0_${event.chainId}`);
      assert.equal(actual?.royalty_recipient, RECIPIENT.toLowerCase());
    });

    it("should update Primary_Sales.funds_recipient for tiers that have a Sound_Moments row", async () => {
      const event = SoundEditionV2_1.FundingRecipientSet.createMockEvent({
        recipient: RECIPIENT as `0x${string}`,
        mockEventData: { chainId: 8453 },
      });
      (event as { srcAddress: string }).srcAddress = EDITION;

      const mockDb = MockDb.createMockDb()
        .entities.Sound_Moments.set({
          id: `${EDITION}_0_8453`,
          collection: EDITION,
          tier: 0,
          uri: "ar://foo/0",
          chain_id: 8453,
          created_at: 0,
          updated_at: 0,
          transaction_hash: "0x00",
        })
        .entities.Primary_Sales.set({
          ...makeBasePrimarySale(8453),
          id: `${EDITION}_0_0_8453`,
          funds_recipient: zeroAddress,
        });

      const db = await SoundEditionV2_1.FundingRecipientSet.processEvent({ event, mockDb });

      const actual = await db.entities.Primary_Sales.get(`${EDITION}_0_0_8453`);
      assert.equal(actual?.funds_recipient, RECIPIENT.toLowerCase());
    });

    it("should update Primary_Sales.funds_recipient regardless of Sound_Moments", async () => {
      const event = SoundEditionV2_1.FundingRecipientSet.createMockEvent({
        recipient: RECIPIENT as `0x${string}`,
        mockEventData: { chainId: 8453 },
      });
      (event as { srcAddress: string }).srcAddress = EDITION;

      // Primary_Sales exists for tier 0, no Sound_Moments row — should still be updated
      const mockDb = MockDb.createMockDb().entities.Primary_Sales.set({
        ...makeBasePrimarySale(8453),
        id: `${EDITION}_0_0_8453`,
        funds_recipient: zeroAddress,
      });

      const db = await SoundEditionV2_1.FundingRecipientSet.processEvent({ event, mockDb });

      const actual = await db.entities.Primary_Sales.get(`${EDITION}_0_0_8453`);
      assert.equal(actual?.funds_recipient, RECIPIENT.toLowerCase());
    });
  });

  describe("RoyaltySet", () => {
    it("should update Sound_Editions.royalty_bps", async () => {
      const event = SoundEditionV2_1.RoyaltySet.createMockEvent({
        bps: 750n,
      });
      (event as { srcAddress: string }).srcAddress = EDITION;

      const mockDb = MockDb.createMockDb().entities.Sound_Editions.set({
        id: `${EDITION}_${event.chainId}`,
        address: EDITION,
        name: "Test",
        owner: OWNER,
        uri: "",
        funding_recipient: RECIPIENT,
        royalty_bps: 500,
        chain_id: event.chainId,
        created_at: 0,
        updated_at: 0,
        transaction_hash: "0x00",
      });

      const db = await SoundEditionV2_1.RoyaltySet.processEvent({ event, mockDb });

      const actual = await db.entities.Sound_Editions.get(`${EDITION}_${event.chainId}`);
      assert.equal(actual?.royalty_bps, 750);
    });

    it("should update Secondary_Sales.royalty_bps", async () => {
      const event = SoundEditionV2_1.RoyaltySet.createMockEvent({
        bps: 750n,
      });
      (event as { srcAddress: string }).srcAddress = EDITION;

      const secondary: Secondary_Sales = {
        id: `${EDITION}_0_${event.chainId}`,
        collection: EDITION,
        token_id: 0n,
        royalty_recipient: RECIPIENT,
        royalty_bps: 500,
        chain_id: event.chainId,
        updated_at: 0,
        transaction_hash: "0x00",
      };

      const mockDb = MockDb.createMockDb().entities.Secondary_Sales.set(secondary);

      const db = await SoundEditionV2_1.RoyaltySet.processEvent({ event, mockDb });

      const actual = await db.entities.Secondary_Sales.get(`${EDITION}_0_${event.chainId}`);
      assert.equal(actual?.royalty_bps, 750);
    });

    it("should do nothing when neither Sound_Editions nor Secondary_Sales exist", async () => {
      const event = SoundEditionV2_1.RoyaltySet.createMockEvent({ bps: 750n });
      (event as { srcAddress: string }).srcAddress = EDITION;

      const db = await SoundEditionV2_1.RoyaltySet.processEvent({
        event,
        mockDb: MockDb.createMockDb(),
      });

      const edition = await db.entities.Sound_Editions.get(`${EDITION}_${event.chainId}`);
      const secondary = await db.entities.Secondary_Sales.get(`${EDITION}_0_${event.chainId}`);
      assert.equal(edition, undefined);
      assert.equal(secondary, undefined);
    });
  });
});
