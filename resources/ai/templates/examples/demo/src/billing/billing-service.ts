/**
 * @section imports:externals
 */

// empty

/**
 * @section imports:internals
 */

import type { InvoiceService } from "../invoices/invoice-service.js";
import type { InvoiceSummary } from "../invoices/invoice-types.js";

/**
 * @section consts
 */

const CURRENCY_SYMBOL = "$";

/**
 * @section types
 */

export type BillingSnapshot = {
  customerId: string;
  invoiceCount: number;
  totalAmount: number;
  formattedTotal: string;
};

export class BillingService {
  /**
   * @section private:attributes
   */

  // empty

  /**
   * @section private:properties
   */

  private readonly invoiceService: InvoiceService;

  /**
   * @section public:properties
   */

  // empty

  /**
   * @section constructor
   */

  public constructor(invoiceService: InvoiceService) {
    this.invoiceService = invoiceService;
  }

  /**
   * @section static:properties
   */

  // empty

  /**
   * @section factory
   */

  public static create(invoiceService: InvoiceService): BillingService {
    const service = new BillingService(invoiceService);
    return service;
  }

  /**
   * @section private:methods
   */

  private formatCurrency(amount: number): string {
    const formattedAmount = `${CURRENCY_SYMBOL}${amount.toFixed(2)}`;
    return formattedAmount;
  }

  /**
   * @section public:methods
   */

  public async snapshot(customerId: string): Promise<BillingSnapshot> {
    const summary: InvoiceSummary = await this.invoiceService.summarizeForCustomer(customerId);
    const snapshot: BillingSnapshot = {
      customerId,
      invoiceCount: summary.count,
      totalAmount: summary.totalAmount,
      formattedTotal: this.formatCurrency(summary.totalAmount)
    };
    return snapshot;
  }

  /**
   * @section static:methods
   */

  // empty
}
