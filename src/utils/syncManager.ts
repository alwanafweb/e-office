import { Customer, SPH, PKS, Invoice } from '../types';
import {
  apiGetCustomers,
  apiGetSPHs,
  apiGetPKSs,
  apiGetInvoices,
  apiSyncAllData,
  apiCheckHealth,
  SyncDataPayload,
} from '../api/client';

export interface AutoMergeResult {
  success: boolean;
  timestamp: string;
  discrepanciesResolved: number;
  totalMerged: number;
  mergedData: {
    customers: Customer[];
    sphs: SPH[];
    pkss: PKS[];
    invoices: Invoice[];
  };
  error?: string;
}

/**
 * Safely parses date or returns fallback epoch timestamp for comparison
 */
function parseTimestamp(dateStr?: string): number {
  if (!dateStr) return 0;
  const time = new Date(dateStr).getTime();
  return isNaN(time) ? 0 : time;
}

/**
 * Auto-merges local items with remote items by ID and last-updated timestamp
 */
export function autoMergeEntities<T extends { id: string; updatedAt?: string; createdAt?: string }>(
  localList: T[] = [],
  remoteList: T[] = []
): { merged: T[]; discrepancies: number } {
  let discrepancies = 0;
  const mergedMap = new Map<string, T>();

  // Populate map with local items
  for (const item of localList) {
    if (item && item.id) {
      mergedMap.set(item.id, item);
    }
  }

  // Merge with remote items
  for (const remoteItem of remoteList) {
    if (!remoteItem || !remoteItem.id) continue;

    const localItem = mergedMap.get(remoteItem.id);
    if (!localItem) {
      // Remote item not present locally -> Auto-merge into local
      mergedMap.set(remoteItem.id, remoteItem);
      discrepancies++;
    } else {
      // Both exist: check timestamps
      const localTime = Math.max(parseTimestamp(localItem.updatedAt), parseTimestamp(localItem.createdAt));
      const remoteTime = Math.max(parseTimestamp(remoteItem.updatedAt), parseTimestamp(remoteItem.createdAt));

      if (remoteTime > localTime) {
        // Remote is newer
        mergedMap.set(remoteItem.id, remoteItem);
        discrepancies++;
      } else if (localTime > remoteTime) {
        // Local is newer
        discrepancies++;
      }
    }
  }

  const merged = Array.from(mergedMap.values());
  return { merged, discrepancies };
}

/**
 * Checks local database logs/state against Cloudflare D1 and auto-merges discrepancies
 */
export async function syncLocalWithCloudflareD1(localData: {
  customers: Customer[];
  sphs: SPH[];
  pkss: PKS[];
  invoices: Invoice[];
}): Promise<AutoMergeResult> {
  const nowStr = new Date().toISOString();

  try {
    // 1. Verify Cloudflare D1 / Worker backend health
    const health = await apiCheckHealth();
    if (!health || health.status !== 'online') {
      return {
        success: false,
        timestamp: nowStr,
        discrepanciesResolved: 0,
        totalMerged: 0,
        mergedData: localData,
        error: 'Cloudflare D1 backend offline or unreachable',
      };
    }

    // 2. Fetch remote collections from Cloudflare D1
    const [remoteCustomers, remoteSphs, remotePkss, remoteInvoices] = await Promise.all([
      apiGetCustomers().catch(() => []),
      apiGetSPHs().catch(() => []),
      apiGetPKSs().catch(() => []),
      apiGetInvoices().catch(() => []),
    ]);

    // 3. Auto-merge collections
    const customersMerge = autoMergeEntities(localData.customers, remoteCustomers);
    const sphsMerge = autoMergeEntities(localData.sphs, remoteSphs);
    const pkssMerge = autoMergeEntities(localData.pkss, remotePkss);
    const invoicesMerge = autoMergeEntities(localData.invoices, remoteInvoices);

    const totalDiscrepancies =
      customersMerge.discrepancies +
      sphsMerge.discrepancies +
      pkssMerge.discrepancies +
      invoicesMerge.discrepancies;

    const mergedData = {
      customers: customersMerge.merged,
      sphs: sphsMerge.merged,
      pkss: pkssMerge.merged,
      invoices: invoicesMerge.merged,
    };

    // 4. Push merged data back if discrepancies were auto-merged
    if (totalDiscrepancies > 0) {
      await apiSyncAllData(mergedData as SyncDataPayload).catch((err) => {
        console.warn('Auto-sync push to Cloudflare D1 notice:', err);
      });
    }

    const totalCount =
      mergedData.customers.length +
      mergedData.sphs.length +
      mergedData.pkss.length +
      mergedData.invoices.length;

    return {
      success: true,
      timestamp: nowStr,
      discrepanciesResolved: totalDiscrepancies,
      totalMerged: totalCount,
      mergedData,
    };
  } catch (err: any) {
    return {
      success: false,
      timestamp: nowStr,
      discrepanciesResolved: 0,
      totalMerged: 0,
      mergedData: localData,
      error: err.message || 'Error executing Cloudflare D1 auto-sync',
    };
  }
}
