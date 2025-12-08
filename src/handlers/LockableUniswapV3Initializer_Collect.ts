import {
  LockableUniswapV3Initializer,
  LockableUniswapV3Initializer_Collect,
} from "generated";

LockableUniswapV3Initializer.Collect.handler(async ({ event, context }) => {
  const entity: LockableUniswapV3Initializer_Collect = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    pool: event.params.pool,
    beneficiary: event.params.beneficiary,
    fees0: event.params.fees0,
    fees1: event.params.fees1,
    transactionHash: event.transaction.hash,
    blockNumber: event.block.number,
  };
  context.LockableUniswapV3Initializer_Collect.set(entity);
});
