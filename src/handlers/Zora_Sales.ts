import {
  ZoraCreatorFixedPriceSaleStrategy,
  ZoraERC20Minter,
  type ZoraERC20Minter_SaleSet_handlerArgs,
  type ZoraCreatorFixedPriceSaleStrategy_SaleSet_handlerArgs,
} from "generated";
import { buildSale } from "@/lib/zora_protocol/buildSale";

ZoraERC20Minter.SaleSet.handler(async ({ event, context }: ZoraERC20Minter_SaleSet_handlerArgs) => {
  context.Primary_Sales.set(buildSale(event));
});

ZoraCreatorFixedPriceSaleStrategy.SaleSet.handler(
  async ({ event, context }: ZoraCreatorFixedPriceSaleStrategy_SaleSet_handlerArgs) => {
    context.Primary_Sales.set(buildSale(event));
  }
);
