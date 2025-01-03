import { createThirdwebClient, getContract } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";
import { env } from "~/env";

export const CHAIN = baseSepolia;
export const ACCOUNT_FACTORY = "0x093e3379747533bFE5B4aD660599C03fFc3eE419";
export const ACCOUNT_FACTORY_ADMIN = "0x14550cc02BFB53c0B6f410D4C43f109cc2Ca1142";
export const THIRDWEB_ENGINE_BACKEND_WALLET = "0x14550cc02BFB53c0B6f410D4C43f109cc2Ca1142";
export const TIP_TOKEN = "0x216665E6f1d9d6C403e39a484f6031cBAADC671E";
export const TIP_INDICATOR = ":taco:";
export const CLIENT = createThirdwebClient({
  secretKey: env.THIRDWEB_SECRET_KEY,
});
export const CONTRACT = getContract({
  chain: CHAIN,
  client: CLIENT,
  address: TIP_TOKEN,
});