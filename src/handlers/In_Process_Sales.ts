import { indexer, InProcessCreatorFixedPriceSaleStrategy, InProcessERC20Minter, type InProcessERC20Minter_SaleSet_handlerArgs, type InProcessCreatorFixedPriceSaleStrategy_SaleSet_handlerArgs } from "envio";
import { buildSale } from "@/lib/zora_protocol/buildSale";

indexer.onEvent(
  { contract: "InProcessERC20Minter", event: "SaleSet" },
  async ({ event, context }: InProcessERC20Minter_SaleSet_handlerArgs) => {
    context.Primary_Sales.set(buildSale(event));
  }
);

indexer.onEvent(
  { contract: "InProcessCreatorFixedPriceSaleStrategy", event: "SaleSet" },
  async ({ event, context }: InProcessCreatorFixedPriceSaleStrategy_SaleSet_handlerArgs) => {
    context.Primary_Sales.set(buildSale(event));
  }
);
