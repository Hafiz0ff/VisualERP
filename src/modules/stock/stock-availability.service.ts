import { prisma } from '../../db/prisma';
import { StockLedgerService } from './stock-ledger.service';
import { ValidationError } from '../../shared/errors/app-error';

export class StockAvailabilityService {
  /**
   * Retrieves the current available stock quantity for an item at a specific location,
   * optionally filtered by batch.
   */
  public static async getAvailableQuantity(
    organizationId: string,
    itemId: string,
    locationId: string,
    batchId?: string | null
  ): Promise<number> {
    return StockLedgerService.calculateBalanceForItemLocation(
      organizationId,
      itemId,
      locationId,
      batchId
    );
  }

  /**
   * Asserts that there is enough stock available.
   * Throws a ValidationError if the dynamic stock level is below the requested quantity.
   */
  public static async assertAvailable(
    organizationId: string,
    itemId: string,
    locationId: string,
    quantity: number,
    batchId?: string | null
  ): Promise<void> {
    const available = await this.getAvailableQuantity(
      organizationId,
      itemId,
      locationId,
      batchId
    );
    if (available < quantity) {
      throw new ValidationError(
        `Insufficient stock: requested ${quantity} of item ${itemId} at location ${locationId}, but only ${available} is available`
      );
    }
  }

  /**
   * Returns items whose total balance across all locations falls below a given minimum threshold.
   */
  public static async listLowStockCandidates(
    organizationId: string,
    minThreshold = 10
  ): Promise<{ itemId: string; itemName: string; quantity: number }[]> {
    const items = await prisma.item.findMany({
      where: { organizationId, isActive: true },
    });

    const candidates: { itemId: string; itemName: string; quantity: number }[] = [];

    for (const item of items) {
      const balance = await StockLedgerService.calculateBalanceForItem(
        organizationId,
        item.id
      );
      if (balance < minThreshold) {
        candidates.push({
          itemId: item.id,
          itemName: item.name,
          quantity: balance,
        });
      }
    }

    return candidates;
  }
}
export default StockAvailabilityService;
