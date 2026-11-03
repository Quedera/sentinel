// QUEDERA SENTINEL — Contract storage provider interface
//
// Pluggable interface so local filesystem / Azure Blob Storage / S3 all
// drop in via the CONTRACT_STORAGE env var. Mirrors the AuthProvider and
// EigProvider patterns.
//
// Blob keys are opaque strings stored on the Engagement row's
// `contractBlobKey` column. Providers translate them to storage-specific
// paths/URLs.

export interface ContractStorageProvider {
  /** Store a contract PDF under the given blob key. Creates intermediate directories if needed. */
  put(blobKey: string, content: Buffer): Promise<void>;

  /** Retrieve a contract PDF by blob key. Throws if the key doesn't exist. */
  get(blobKey: string): Promise<Buffer>;

  /** Delete a contract PDF. No-op if the key doesn't exist. */
  delete(blobKey: string): Promise<void>;

  /** Check whether a blob key exists. */
  exists(blobKey: string): Promise<boolean>;
}
