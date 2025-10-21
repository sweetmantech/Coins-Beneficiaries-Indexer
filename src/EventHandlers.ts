/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  LockableUniswapV3Initializer,
  LockableUniswapV3Initializer_Lock,
  BeneficiaryData,
} from "generated";

LockableUniswapV3Initializer.Lock.handler(async ({ event, context }) => {
  const lockId = `${event.chainId}_${event.block.number}_${event.logIndex}`;

  // Create the Lock entity
  const lockEntity: LockableUniswapV3Initializer_Lock = {
    id: lockId,
    pool: event.params.pool,
    transactionHash: event.transaction.hash,
    blockNumber: event.block.number,
  };
  context.LockableUniswapV3Initializer_Lock.set(lockEntity);

  // Process the beneficiaries tuple array
  event.params.beneficiaries.forEach((beneficiary: any, index: number) => {
    const beneficiaryEntity: BeneficiaryData = {
      id: `${lockId}_${index}`,
      lockId: lockId,
      pool: event.params.pool,
      beneficiary: beneficiary[0], // First element is beneficiary address
      shares: beneficiary[1], // Second element is shares
      transactionHash: event.transaction.hash,
      blockNumber: event.block.number,
    };
    context.BeneficiaryData.set(beneficiaryEntity);
  });
});
