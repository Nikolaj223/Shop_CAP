import { JsonRpcProvider } from "ethers";
import {
    EXPECTED_CHAIN_ID,
    EXPECTED_CHAIN_NAME,
    READ_ONLY_RPC_URL,
} from "../components/Utils/contract-config";

let readOnlyProvider = null;

export function getReadOnlyProvider() {
    if (!readOnlyProvider) {
        readOnlyProvider = new JsonRpcProvider(READ_ONLY_RPC_URL, {
            chainId: Number(EXPECTED_CHAIN_ID),
            name: EXPECTED_CHAIN_NAME.toLowerCase(),
        });
    }

    return readOnlyProvider;
}
