import type { ContractStorageProvider } from "./types";
import { LocalContractStorage } from "./providers/local";

/**
 * Pluggable contract storage selector.
 *
 * Reads CONTRACT_STORAGE from env at module load and instantiates the
 * matching provider. Default is `local`.
 *
 * For production, set CONTRACT_STORAGE=azureblob (TODO: ship AzureBlobContractStorage
 * adapter — uses the AZURE_STORAGE_CONNECTION_STRING + AZURE_STORAGE_CONTAINER vars
 * documented in .env.example).
 *
 * Application code should ALWAYS import `contractStorage` from this file,
 * never a concrete provider class.
 *
 * Mirrors the AuthProvider and EigProvider patterns.
 */
const which = (process.env.CONTRACT_STORAGE ?? "local").toLowerCase();

let instance: ContractStorageProvider;

switch (which) {
  case "local":
  default:
    instance = new LocalContractStorage(
      process.env.CONTRACT_STORAGE_LOCAL_DIR ?? "./var/contracts"
    );
    break;
  // case "azureblob":
  //   instance = new AzureBlobContractStorage(...);
  //   break;
}

export const contractStorage: ContractStorageProvider = instance;

export type { ContractStorageProvider } from "./types";
