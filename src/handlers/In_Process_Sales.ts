import {
  InProcessCreatorFixedPriceSaleStrategy,
  InProcessERC20Minter,
  type InProcessERC20Minter_SaleSet_handlerArgs,
  type InProcessCreatorFixedPriceSaleStrategy_SaleSet_handlerArgs,
} from "generated";
import getLatestSale from "@/lib/in_process_sales/getLatestSale";

InProcessERC20Minter.SaleSet.handler(
  async ({ event, context }: InProcessERC20Minter_SaleSet_handlerArgs) => {
    const latestSale = await getLatestSale(event, context);
    context.Primary_Sales.set(latestSale);
  }
);

InProcessCreatorFixedPriceSaleStrategy.SaleSet.handler(
  async ({ event, context }: InProcessCreatorFixedPriceSaleStrategy_SaleSet_handlerArgs) => {
    const latestSale = await getLatestSale(event, context);
    context.Primary_Sales.set(latestSale);
  }
);
