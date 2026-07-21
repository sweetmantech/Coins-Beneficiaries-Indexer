import assert from "assert";
import { encodeAbiParameters, zeroAddress } from "viem";
import { TestHelpers } from "envio";
import type { Sound_Editions, Sound_Moments, Transfers } from "envio";

const { MockDb, SoundCreatorV2, SoundMetadata, SoundEditionV2_1 } = TestHelpers;

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
        base_uri: "",
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
      assert.equal(actual?.base_uri, "");
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
        uri_from_metadata: true,
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
        uri_from_metadata: true,
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

const RECIPIENT = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

// ─────────────────────────────────────────────────────────
// Sound_Transfers Handler Tests
// ─────────────────────────────────────────────────────────

const COLLECTOR = "0xcccccccccccccccccccccccccccccccccccccccc";

describe("SoundEditionV2_1.Minted Handler Tests", () => {
  it("should create Transfers entity", async () => {
    const mockDb = MockDb.createMockDb();

    const event = SoundEditionV2_1.Minted.createMockEvent({
      tier: 0n,
      to: COLLECTOR as `0x${string}`,
      quantity: 2n,
      fromTokenId: 1n,
    });
    (event as { srcAddress: string }).srcAddress = EDITION;

    const db = await SoundEditionV2_1.Minted.processEvent({ event, mockDb });

    const id = `${EDITION}_0_${event.chainId}_${event.block.number}_${event.logIndex}`;
    const actual = await db.entities.Transfers.get(id);

    const expected: Transfers = {
      id,
      collection: EDITION,
      token_id: 1n,
      chain_id: event.chainId,
      recipient: COLLECTOR.toLowerCase(),
      quantity: 2n,
      value: undefined,
      currency: undefined,
      transaction_hash: event.transaction.hash,
      block_number: BigInt(event.block.number),
      transferred_at: event.block.timestamp,
    };

    assert.deepEqual(actual, expected);
  });

  it("should set token_id to tier plus one", async () => {
    const mockDb = MockDb.createMockDb();

    const event = SoundEditionV2_1.Minted.createMockEvent({
      tier: 1n,
      to: COLLECTOR as `0x${string}`,
      quantity: 1n,
      fromTokenId: 1n,
    });
    (event as { srcAddress: string }).srcAddress = EDITION;

    const db = await SoundEditionV2_1.Minted.processEvent({ event, mockDb });

    const id = `${EDITION}_1_${event.chainId}_${event.block.number}_${event.logIndex}`;
    const actual = await db.entities.Transfers.get(id);
    assert.equal(actual?.token_id, 2n);
  });

  it("should set collection to srcAddress", async () => {
    const mockDb = MockDb.createMockDb();

    const event = SoundEditionV2_1.Minted.createMockEvent({
      tier: 0n,
      to: COLLECTOR as `0x${string}`,
      quantity: 1n,
      fromTokenId: 1n,
    });
    (event as { srcAddress: string }).srcAddress = EDITION;

    const db = await SoundEditionV2_1.Minted.processEvent({ event, mockDb });

    const id = `${EDITION}_0_${event.chainId}_${event.block.number}_${event.logIndex}`;
    const actual = await db.entities.Transfers.get(id);
    assert.equal(actual?.collection, EDITION);
  });
});

describe("SoundEditionV2_1 Handler Tests", () => {
  describe("ContractURISet", () => {
    it("should update Sound_Editions.uri", async () => {
      const NEW_URI = "ar://newContractHash/";
      const event = SoundEditionV2_1.ContractURISet.createMockEvent({
        contractURI: NEW_URI,
      });
      (event as { srcAddress: string }).srcAddress = EDITION;

      const mockDb = MockDb.createMockDb().entities.Sound_Editions.set({
        id: `${EDITION}_${event.chainId}`,
        address: EDITION,
        name: "Test",
        owner: OWNER,
        uri: "ar://oldContractHash/",
        base_uri: "",
        funding_recipient: RECIPIENT,
        royalty_bps: 1000,
        chain_id: event.chainId,
        created_at: 0,
        updated_at: 0,
        transaction_hash: "0x00",
      });

      const db = await SoundEditionV2_1.ContractURISet.processEvent({ event, mockDb });

      const actual = await db.entities.Sound_Editions.get(`${EDITION}_${event.chainId}`);
      assert.equal(actual?.uri, NEW_URI);
    });

    it("should do nothing when Sound_Editions does not exist", async () => {
      const event = SoundEditionV2_1.ContractURISet.createMockEvent({
        contractURI: "ar://new/",
      });
      (event as { srcAddress: string }).srcAddress = EDITION;

      const db = await SoundEditionV2_1.ContractURISet.processEvent({
        event,
        mockDb: MockDb.createMockDb(),
      });

      const actual = await db.entities.Sound_Editions.get(`${EDITION}_${event.chainId}`);
      assert.equal(actual, undefined);
    });
  });

  describe("BaseURISet (edition)", () => {
    it("should update Sound_Editions.base_uri", async () => {
      const NEW_BASE = "ar://newBase/";
      const event = SoundEditionV2_1.BaseURISet.createMockEvent({
        baseURI: NEW_BASE,
        mockEventData: { chainId: 8453 },
      });
      (event as { srcAddress: string }).srcAddress = EDITION;

      const mockDb = MockDb.createMockDb().entities.Sound_Editions.set({
        id: `${EDITION}_8453`,
        address: EDITION,
        name: "Test",
        owner: OWNER,
        uri: "",
        base_uri: "ar://oldBase/",
        funding_recipient: RECIPIENT,
        royalty_bps: 1000,
        chain_id: 8453,
        created_at: 0,
        updated_at: 0,
        transaction_hash: "0x00",
      });

      const db = await SoundEditionV2_1.BaseURISet.processEvent({ event, mockDb });

      const actual = await db.entities.Sound_Editions.get(`${EDITION}_8453`);
      assert.equal(actual?.base_uri, NEW_BASE);
    });

    it("should cascade new base_uri to uri_from_metadata=false Moments", async () => {
      const NEW_BASE = "ar://newBase/";
      const event = SoundEditionV2_1.BaseURISet.createMockEvent({
        baseURI: NEW_BASE,
        mockEventData: { chainId: 8453 },
      });
      (event as { srcAddress: string }).srcAddress = EDITION;

      const mockDb = MockDb.createMockDb()
        .entities.Sound_Editions.set({
          id: `${EDITION}_8453`,
          address: EDITION,
          name: "Test",
          owner: OWNER,
          uri: "",
          base_uri: "ar://oldBase/",
          funding_recipient: RECIPIENT,
          royalty_bps: 1000,
          chain_id: 8453,
          created_at: 0,
          updated_at: 0,
          transaction_hash: "0x00",
        })
        .entities.Sound_Moments.set({
          id: `${EDITION}_1_8453`,
          collection: EDITION,
          tier: 1,
          uri: "ar://oldBase//1",
          uri_from_metadata: false,
          chain_id: 8453,
          created_at: 0,
          updated_at: 0,
          transaction_hash: "0x00",
        });

      const db = await SoundEditionV2_1.BaseURISet.processEvent({ event, mockDb });

      const moment = await db.entities.Sound_Moments.get(`${EDITION}_1_8453`);
      assert.equal(moment?.uri, `${NEW_BASE}/1`);
    });

    it("should not update uri_from_metadata=true Moments on BaseURISet", async () => {
      const NEW_BASE = "ar://newBase/";
      const event = SoundEditionV2_1.BaseURISet.createMockEvent({
        baseURI: NEW_BASE,
        mockEventData: { chainId: 8453 },
      });
      (event as { srcAddress: string }).srcAddress = EDITION;

      const METADATA_URI = "ar://metadataHash/0";
      const mockDb = MockDb.createMockDb()
        .entities.Sound_Editions.set({
          id: `${EDITION}_8453`,
          address: EDITION,
          name: "Test",
          owner: OWNER,
          uri: "",
          base_uri: "ar://oldBase/",
          funding_recipient: RECIPIENT,
          royalty_bps: 1000,
          chain_id: 8453,
          created_at: 0,
          updated_at: 0,
          transaction_hash: "0x00",
        })
        .entities.Sound_Moments.set({
          id: `${EDITION}_0_8453`,
          collection: EDITION,
          tier: 0,
          uri: METADATA_URI,
          uri_from_metadata: true,
          chain_id: 8453,
          created_at: 0,
          updated_at: 0,
          transaction_hash: "0x00",
        });

      const db = await SoundEditionV2_1.BaseURISet.processEvent({ event, mockDb });

      const moment = await db.entities.Sound_Moments.get(`${EDITION}_0_8453`);
      assert.equal(moment?.uri, METADATA_URI); // unchanged
    });
  });

  describe("TierCreated", () => {
    it("should create Sound_Moments with uri_from_metadata=false using edition base_uri", async () => {
      const BASE_URI = "ar://editionBase/";
      const TIER = 1;

      const event = SoundEditionV2_1.TierCreated.createMockEvent({
        creation: [BigInt(TIER), 0n, 100n, 0n, false, false],
        mockEventData: { chainId: 8453 },
      });
      (event as { srcAddress: string }).srcAddress = EDITION;

      const mockDb = MockDb.createMockDb().entities.Sound_Editions.set({
        id: `${EDITION}_8453`,
        address: EDITION,
        name: "Test",
        owner: OWNER,
        uri: "",
        base_uri: BASE_URI,
        funding_recipient: RECIPIENT,
        royalty_bps: 1000,
        chain_id: 8453,
        created_at: 0,
        updated_at: 0,
        transaction_hash: "0x00",
      });

      const db = await SoundEditionV2_1.TierCreated.processEvent({ event, mockDb });

      const actual = await db.entities.Sound_Moments.get(`${EDITION}_${TIER}_8453`);
      assert.equal(actual?.tier, TIER);
      assert.equal(actual?.uri, `${BASE_URI}/${TIER}`);
      assert.equal(actual?.uri_from_metadata, false);
    });

    it("should not overwrite an existing Sound_Moments row set by SoundMetadata", async () => {
      const TIER = 0;
      const EXISTING_URI = "ar://metadataHash/0";

      const event = SoundEditionV2_1.TierCreated.createMockEvent({
        creation: [BigInt(TIER), 0n, 100n, 0n, false, false],
        mockEventData: { chainId: 8453 },
      });
      (event as { srcAddress: string }).srcAddress = EDITION;

      const mockDb = MockDb.createMockDb().entities.Sound_Moments.set({
        id: `${EDITION}_${TIER}_8453`,
        collection: EDITION,
        tier: TIER,
        uri: EXISTING_URI,
        uri_from_metadata: true,
        chain_id: 8453,
        created_at: 0,
        updated_at: 0,
        transaction_hash: "0x00",
      });

      const db = await SoundEditionV2_1.TierCreated.processEvent({ event, mockDb });

      const actual = await db.entities.Sound_Moments.get(`${EDITION}_${TIER}_8453`);
      assert.equal(actual?.uri, EXISTING_URI); // not overwritten
      assert.equal(actual?.uri_from_metadata, true);
    });
  });
});
