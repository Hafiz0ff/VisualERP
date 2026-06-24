import { BatchStatus } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { ValidationError, NotFoundError } from '../../shared/errors/app-error';
import { BatchResolutionStrategy } from './stock.types';
import { StockLedgerService } from './stock-ledger.service';

interface ResolvedBatchAllocation {
  batchId: string;
  batchNumber: string;
  quantity: number;
}

export class BatchResolverService {
  /**
   * Resolves batch allocations for a given quantity of an item at a specific location
   * using MANUAL, FIFO, or FEFO strategy.
   *
   * Returns a list of allocations: { batchId, batchNumber, quantity }.
   */
  public static async resolveBatches(
    organizationId: string,
    itemId: string,
    locationId: string,
    requestedQuantity: number,
    strategy: BatchResolutionStrategy,
    manualBatchId?: string | null
  ): Promise<ResolvedBatchAllocation[]> {
    if (requestedQuantity <= 0) {
      throw new ValidationError('Requested allocation quantity must be greater than zero');
    }

    // 1. If strategy is MANUAL, perform direct manual lookup and validation
    if (strategy === 'MANUAL') {
      if (!manualBatchId) {
        throw new ValidationError('manualBatchId is required when using MANUAL batch strategy');
      }

      const batch = await prisma.stockBatch.findFirst({
        where: { id: manualBatchId, itemId, organizationId },
      });

      if (!batch) {
        throw new NotFoundError(`Stock batch ${manualBatchId} not found for item ${itemId}`);
      }

      const balance = await StockLedgerService.calculateBalanceForItemLocation(
        organizationId,
        itemId,
        locationId,
        manualBatchId
      );

      if (balance < requestedQuantity) {
        throw new ValidationError(
          `Insufficient stock in manual batch "${batch.batchNumber}". Requested: ${requestedQuantity}, Available: ${balance}`
        );
      }

      return [{ batchId: batch.id, batchNumber: batch.batchNumber, quantity: requestedQuantity }];
    }

    // 2. Fetch all batches for the item
    const allBatches = await prisma.stockBatch.findMany({
      where: { itemId, organizationId, status: BatchStatus.APPROVED },
    });

    if (allBatches.length === 0) {
      throw new ValidationError(`No approved batches exist for item ID ${itemId}`);
    }

    // 3. Compute current balances for all batches at this location
    const batchAllocations: {
      batchId: string;
      batchNumber: string;
      balance: number;
      receivedAt: Date;
      expirationDate: Date | null;
    }[] = [];

    for (const batch of allBatches) {
      const balance = await StockLedgerService.calculateBalanceForItemLocation(
        organizationId,
        itemId,
        locationId,
        batch.id
      );

      if (balance > 0) {
        batchAllocations.push({
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          balance,
          receivedAt: batch.receivedDate || batch.createdAt,
          expirationDate: batch.expirationDate,
        });
      }
    }

    // 4. Sort batches based on selected strategy
    if (strategy === 'FIFO') {
      // FIFO: oldest received batch first; createdAt is only a fallback when receivedDate is absent.
      batchAllocations.sort((a, b) => a.receivedAt.getTime() - b.receivedAt.getTime());
    } else if (strategy === 'FEFO') {
      // FEFO: earliest expiration first. If expiration is absent, fallback to oldest received date.
      batchAllocations.sort((a, b) => {
        if (a.expirationDate && b.expirationDate) {
          return a.expirationDate.getTime() - b.expirationDate.getTime();
        }
        if (a.expirationDate) return -1; // expiration comes first
        if (b.expirationDate) return 1;  // expiration comes first
        return a.receivedAt.getTime() - b.receivedAt.getTime(); // fallback
      });
    } else {
      throw new ValidationError(`Unsupported batch resolution strategy: ${strategy}`);
    }

    // 5. Allocate quantity from sorted list
    let remainingToAllocate = requestedQuantity;
    const allocations: ResolvedBatchAllocation[] = [];

    for (const batch of batchAllocations) {
      if (remainingToAllocate <= 0) break;

      const take = Math.min(remainingToAllocate, batch.balance);
      allocations.push({
        batchId: batch.batchId,
        batchNumber: batch.batchNumber,
        quantity: take,
      });
      remainingToAllocate -= take;
    }

    if (remainingToAllocate > 0) {
      const totalAvailable = batchAllocations.reduce((acc, curr) => acc + curr.balance, 0);
      throw new ValidationError(
        `Insufficient overall stock for item ${itemId} at location ${locationId} to satisfy allocation of ${requestedQuantity} (Total available across all batches: ${totalAvailable})`
      );
    }

    return allocations;
  }
}
export default BatchResolverService;
