import { promises as fs } from "fs";
import { join, dirname } from "path";
import type { ContractStorageProvider } from "../types";

/**
 * Local-filesystem contract storage. For dev and small deployments.
 *
 * Select with: CONTRACT_STORAGE=local
 * Configure with: CONTRACT_STORAGE_LOCAL_DIR (default './var/contracts')
 *
 * Blob keys are resolved as relative paths under the base directory.
 * Path traversal is rejected — blob keys must be simple opaque strings
 * (we generate them with `crypto.randomUUID()` server-side).
 */
export class LocalContractStorage implements ContractStorageProvider {
  private readonly baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  async put(blobKey: string, content: Buffer): Promise<void> {
    const path = this.resolve(blobKey);
    await fs.mkdir(dirname(path), { recursive: true });
    await fs.writeFile(path, content);
  }

  async get(blobKey: string): Promise<Buffer> {
    const path = this.resolve(blobKey);
    return fs.readFile(path);
  }

  async delete(blobKey: string): Promise<void> {
    const path = this.resolve(blobKey);
    try {
      await fs.unlink(path);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err;
      }
    }
  }

  async exists(blobKey: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(blobKey));
      return true;
    } catch {
      return false;
    }
  }

  private resolve(blobKey: string): string {
    // Prevent path traversal — blobKey should be a simple opaque string
    if (
      blobKey.includes("..") ||
      blobKey.startsWith("/") ||
      blobKey.includes("\\")
    ) {
      throw new Error(`[LocalContractStorage] Invalid blob key: ${blobKey}`);
    }
    return join(this.baseDir, blobKey);
  }
}
