import {
  InProcessCreatorFixedPriceSaleStrategy,
  InProcessERC20Minter,
  type InProcessERC20Minter_SaleSet_handlerArgs,
  type InProcessCreatorFixedPriceSaleStrategy_SaleSet_handlerArgs,
} from "generated";
import { buildSale } from "@/lib/in_process_sales/buildSale";

InProcessERC20Minter.SaleSet.handler(
  async ({ event, context }: InProcessERC20Minter_SaleSet_handlerArgs) => {
    context.Primary_Sales.set(buildSale(event));
  }
);

InProcessCreatorFixedPriceSaleStrategy.SaleSet.handler(
  async ({ event, context }: InProcessCreatorFixedPriceSaleStrategy_SaleSet_handlerArgs) => {
    context.Primary_Sales.set(buildSale(event));
  }
);
