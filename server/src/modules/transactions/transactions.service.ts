import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getPaginationParams, createPaginatedResult, PaginatedResult } from '../../utils/pagination';
import {
  CreateTransactionInput,
  ListTransactionsQuery,
  VoidTransactionInput,
  RefundTransactionInput,
} from './transactions.validation';
import { Decimal } from '@prisma/client/runtime/library';

export class TransactionService {
  private async generateTransactionNumber(): Promise<string> {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `TXN-${dateStr}-`;

    const lastTxn = await prisma.transactions.findFirst({
      where: {
        transaction_number: { startsWith: prefix },
      },
      orderBy: { transaction_number: 'desc' },
      select: { transaction_number: true },
    });

    let nextNumber = 1;
    if (lastTxn) {
      const parts = lastTxn.transaction_number.split('-');
      nextNumber = parseInt(parts[parts.length - 1], 10) + 1;
    }

    return `${prefix}${String(nextNumber).padStart(5, '0')}`;
  }

  async createTransaction(data: CreateTransactionInput, userId: number) {
    const transactionNumber = await this.generateTransactionNumber();

    const transaction = await prisma.$transaction(async (tx) => {
      for (const item of data.items) {
        if (item.product_id) {
          const product = await tx.products.findFirst({
            where: { id: item.product_id, deleted_at: null },
          });
          if (!product) {
            throw new AppError(`Product with ID ${item.product_id} not found`, 404);
          }

          const quantity = new Decimal(item.quantity.toString());
          const currentStock = new Decimal(product.current_stock.toString());
          const newStock = currentStock.minus(quantity);

          if (newStock.isNegative()) {
            throw new AppError(
              `Insufficient stock for product "${product.name}". Available: ${currentStock}, Requested: ${quantity}`,
              400
            );
          }

          await tx.products.update({
            where: { id: item.product_id },
            data: { current_stock: newStock },
          });

          await tx.inventory_movements.create({
            data: {
              product_id: item.product_id,
              type: 'sale',
              quantity: quantity,
              unit_cost: product.unit_cost,
              running_stock_after: newStock,
              reference_type: 'transaction',
              reference_id: null,
              performed_by: userId,
              notes: `Sale via transaction ${transactionNumber}`,
            },
          });
        }

        if (item.service_id) {
          const service = await tx.services.findFirst({
            where: { id: item.service_id, deleted_at: null },
          });
          if (!service) {
            throw new AppError(`Service with ID ${item.service_id} not found`, 404);
          }
        }
      }

      if (data.appointment_id) {
        const appointment = await tx.appointments.findFirst({
          where: { id: data.appointment_id, deleted_at: null },
        });
        if (!appointment) {
          throw new AppError(`Appointment with ID ${data.appointment_id} not found`, 404);
        }
      }

      let subtotal = new Decimal(0);
      for (const item of data.items) {
        const quantity = new Decimal(item.quantity.toString());
        const unitPrice = new Decimal(item.unit_price.toString());
        const discount = new Decimal((item.discount ?? 0).toString());
        const tax = new Decimal((item.tax ?? 0).toString());
        const lineTotal = unitPrice.times(quantity).minus(discount).plus(tax);
        subtotal = subtotal.plus(lineTotal);
      }

      const discountAmount = new Decimal((data.discount_amount ?? 0).toString());
      const taxAmount = new Decimal((data.tax_amount ?? 0).toString());
      const totalAmount = subtotal.minus(discountAmount).plus(taxAmount);

      const createdTransaction = await tx.transactions.create({
        data: {
          transaction_number: transactionNumber,
          customer_id: data.customer_id ?? null,
          staff_id: data.staff_id ?? null,
          appointment_id: data.appointment_id ?? null,
          type: data.type ?? 'sale',
          subtotal,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          payment_method: data.payment_method ?? null,
          payment_status: data.payment_status ?? 'pending',
          paid_at: data.paid_at ?? null,
          notes: data.notes ?? null,
        },
      });

      const createdItems = [];
      for (const item of data.items) {
        const quantity = new Decimal(item.quantity.toString());
        const unitPrice = new Decimal(item.unit_price.toString());
        const discount = new Decimal((item.discount ?? 0).toString());
        const tax = new Decimal((item.tax ?? 0).toString());
        const lineTotal = unitPrice.times(quantity).minus(discount).plus(tax);

        const createdItem = await tx.transaction_items.create({
          data: {
            transaction_id: createdTransaction.id,
            product_id: item.product_id ?? null,
            service_id: item.service_id ?? null,
            description: item.description,
            quantity,
            unit_price: unitPrice,
            discount,
            tax,
            line_total: lineTotal,
          },
        });
        createdItems.push(createdItem);
      }

      if (data.appointment_id) {
        const appointment = await tx.appointments.findFirst({
          where: { id: data.appointment_id },
        });

        if (appointment && appointment.status !== 'completed') {
          await tx.appointments.update({
            where: { id: data.appointment_id },
            data: { status: 'completed' },
          });

          await tx.appointment_status_history.create({
            data: {
              appointment_id: data.appointment_id,
              old_status: appointment.status,
              new_status: 'completed',
              changed_by: userId,
              reason: 'Service completed via transaction',
            },
          });
        }

        const serviceItems = data.items.filter((item) => item.service_id);
        for (const item of serviceItems) {
          const inventoryItems = await tx.service_inventory_items.findMany({
            where: { service_id: item.service_id! },
          });

          for (const invItem of inventoryItems) {
            const product = await tx.products.findFirst({
              where: { id: invItem.product_id, deleted_at: null },
            });
            if (!product) continue;

            const qtyPerSession = new Decimal(invItem.quantity_per_session.toString());
            const quantity = new Decimal(item.quantity.toString());
            const consumeQty = qtyPerSession.times(quantity);
            const currentStock = new Decimal(product.current_stock.toString());
            const newStock = currentStock.minus(consumeQty);

            if (newStock.isNegative()) {
              throw new AppError(
                `Insufficient stock for service consumption of "${product.name}". Available: ${currentStock}, Needed: ${consumeQty}`,
                400
              );
            }

            await tx.products.update({
              where: { id: invItem.product_id },
              data: { current_stock: newStock },
            });

            await tx.inventory_movements.create({
              data: {
                product_id: invItem.product_id,
                type: 'consumption',
                quantity: consumeQty,
                unit_cost: product.unit_cost,
                running_stock_after: newStock,
                reference_type: 'transaction',
                reference_id: createdTransaction.id,
                performed_by: userId,
                notes: `Service consumption for transaction ${transactionNumber}`,
              },
            });
          }
        }
      }

      return {
        ...createdTransaction,
        items: createdItems,
      };
    });

    return transaction;
  }

  async getTransactions(query: ListTransactionsQuery): Promise<PaginatedResult<any>> {
    const { page, limit, skip } = getPaginationParams(query);
    const {
      search,
      customer,
      type,
      payment_status,
      payment_method,
      customer_id,
      staff_id,
      appointment_id,
      date_from,
      date_to,
      sort_by,
      sort_order,
    } = query;

    const where: any = { deleted_at: null };

    if (search) {
      where.OR = [
        { transaction_number: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    if (customer) {
      const matchingCustomers = await prisma.customers.findMany({
        where: {
          deleted_at: null,
          OR: [
            { first_name: { contains: customer } },
            { last_name: { contains: customer } },
          ],
        },
        select: { id: true },
      });
      const customerIds = matchingCustomers.map((c) => c.id);
      if (customerIds.length > 0) {
        where.customer_id = { in: customerIds };
      } else {
        where.customer_id = -1;
      }
    }

    if (type) where.type = type;
    if (payment_status) where.payment_status = payment_status;
    if (payment_method) where.payment_method = payment_method;
    if (customer_id) where.customer_id = customer_id;
    if (staff_id) where.staff_id = staff_id;
    if (appointment_id) where.appointment_id = appointment_id;

    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) where.created_at.gte = new Date(date_from);
      if (date_to) {
        const endDate = new Date(date_to);
        endDate.setHours(23, 59, 59, 999);
        where.created_at.lte = endDate;
      }
    }

    const orderBy: any = {};
    if (sort_by) {
      orderBy[sort_by] = sort_order || 'desc';
    } else {
      orderBy.created_at = 'desc';
    }

    const [transactions, total] = await Promise.all([
      prisma.transactions.findMany({
        where,
        include: {
          customer: {
            select: { id: true, first_name: true, last_name: true },
          },
          staff: {
            select: { id: true, first_name: true, last_name: true },
          },
          _count: { select: { items: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.transactions.count({ where }),
    ]);

    return createPaginatedResult(transactions, total, { page, limit, skip });
  }

  async getTransactionById(id: number) {
    const transaction = await prisma.transactions.findFirst({
      where: { id, deleted_at: null },
      include: {
        customer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            user: { select: { phone: true } },
          },
        },
        staff: {
          select: { id: true, first_name: true, last_name: true },
        },
        appointment: {
          select: { id: true, appointment_date: true, start_time: true, end_time: true, status: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true },
            },
            service: {
              select: { id: true, name: true, price: true },
            },
          },
        },
      },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    return transaction;
  }

  async voidTransaction(id: number, data: VoidTransactionInput, userId: number) {
    const existing = await prisma.transactions.findFirst({
      where: { id, deleted_at: null },
      include: { items: true },
    });

    if (!existing) {
      throw new AppError('Transaction not found', 404);
    }

    if (existing.payment_status === 'voided') {
      throw new AppError('Transaction is already voided', 400);
    }

    if (existing.payment_status === 'refunded') {
      throw new AppError('Cannot void a refunded transaction', 400);
    }

    const updatedTransaction = await prisma.$transaction(async (tx) => {
      for (const item of existing.items) {
        if (item.product_id) {
          const product = await tx.products.findFirst({
            where: { id: item.product_id, deleted_at: null },
          });
          if (!product) continue;

          const quantity = new Decimal(item.quantity.toString());
          const currentStock = new Decimal(product.current_stock.toString());
          const newStock = currentStock.plus(quantity);

          await tx.products.update({
            where: { id: item.product_id },
            data: { current_stock: newStock },
          });

          await tx.inventory_movements.create({
            data: {
              product_id: item.product_id,
              type: 'return',
              quantity: quantity,
              unit_cost: product.unit_cost,
              running_stock_after: newStock,
              reference_type: 'transaction',
              reference_id: id,
              performed_by: userId,
              notes: `Return from voided transaction ${existing.transaction_number}`,
            },
          });
        }
      }

      if (existing.appointment_id) {
        const appointment = await tx.appointments.findFirst({
          where: { id: existing.appointment_id },
        });

        if (appointment && appointment.status === 'completed') {
          await tx.appointments.update({
            where: { id: existing.appointment_id },
            data: { status: 'in_progress' },
          });

          await tx.appointment_status_history.create({
            data: {
              appointment_id: existing.appointment_id,
              old_status: 'completed',
              new_status: 'in_progress',
              changed_by: userId,
              reason: data.reason ?? 'Transaction voided',
            },
          });
        }
      }

      const result = await tx.transactions.update({
        where: { id },
        data: {
          payment_status: 'voided',
          notes: data.reason
            ? `${existing.notes ? existing.notes + ' | ' : ''}${data.reason}`
            : existing.notes,
        },
      });

      return result;
    });

    return updatedTransaction;
  }

  async refundTransaction(id: number, data: RefundTransactionInput, userId: number) {
    const existing = await prisma.transactions.findFirst({
      where: { id, deleted_at: null },
      include: { items: true },
    });

    if (!existing) {
      throw new AppError('Transaction not found', 404);
    }

    if (existing.payment_status === 'voided') {
      throw new AppError('Cannot refund a voided transaction', 400);
    }

    if (existing.payment_status === 'refunded') {
      throw new AppError('Transaction is already refunded', 400);
    }

    const itemsToRefund = data.item_ids
      ? existing.items.filter((item) => data.item_ids!.includes(item.id))
      : existing.items;

    if (itemsToRefund.length === 0) {
      throw new AppError('No valid items selected for refund', 400);
    }

    const refundNumber = await this.generateTransactionNumber();

    const refundTransaction = await prisma.$transaction(async (tx) => {
      let subtotal = new Decimal(0);
      const refundItemsData = [];

      for (const item of itemsToRefund) {
        const quantity = new Decimal(item.quantity.toString());
        const unitPrice = new Decimal(item.unit_price.toString());
        const discount = new Decimal(item.discount.toString());
        const tax = new Decimal(item.tax.toString());
        const negQuantity = new Decimal(-1).times(quantity);
        const negUnitPrice = new Decimal(-1).times(unitPrice);
        const negDiscount = new Decimal(-1).times(discount);
        const negTax = new Decimal(-1).times(tax);
        const lineTotal = negUnitPrice.times(quantity).plus(discount).minus(tax);

        subtotal = subtotal.plus(lineTotal);

        refundItemsData.push({
          product_id: item.product_id,
          service_id: item.service_id,
          description: `Refund: ${item.description}`,
          quantity: negQuantity,
          unit_price: negUnitPrice,
          discount: negDiscount,
          tax: negTax,
          line_total: lineTotal,
        });
      }

      const refundDiscount = new Decimal(existing.discount_amount.toString());
      const refundTax = new Decimal(existing.tax_amount.toString());
      const refundTotal = subtotal.plus(refundDiscount).minus(refundTax);

      const refund = await tx.transactions.create({
        data: {
          transaction_number: refundNumber,
          customer_id: existing.customer_id,
          staff_id: existing.staff_id,
          appointment_id: existing.appointment_id,
          type: 'refund',
          subtotal,
          discount_amount: new Decimal(0),
          tax_amount: new Decimal(0),
          total_amount: refundTotal,
          payment_method: data.payment_method ?? existing.payment_method,
          payment_status: 'paid',
          paid_at: new Date(),
          notes: data.reason ?? `Refund for transaction ${existing.transaction_number}`,
        },
      });

      const createdRefundItems = [];
      for (const refundItemData of refundItemsData) {
        const createdItem = await tx.transaction_items.create({
          data: {
            transaction_id: refund.id,
            ...refundItemData,
          },
        });
        createdRefundItems.push(createdItem);
      }

      for (const item of itemsToRefund) {
        if (item.product_id) {
          const product = await tx.products.findFirst({
            where: { id: item.product_id, deleted_at: null },
          });
          if (!product) continue;

          const quantity = new Decimal(item.quantity.toString());
          const currentStock = new Decimal(product.current_stock.toString());
          const newStock = currentStock.plus(quantity);

          await tx.products.update({
            where: { id: item.product_id },
            data: { current_stock: newStock },
          });

          await tx.inventory_movements.create({
            data: {
              product_id: item.product_id,
              type: 'return',
              quantity: quantity,
              unit_cost: product.unit_cost,
              running_stock_after: newStock,
              reference_type: 'transaction',
              reference_id: refund.id,
              performed_by: userId,
              notes: `Restored from refund on transaction ${existing.transaction_number}`,
            },
          });
        }
      }

      const allRefunded = itemsToRefund.length === existing.items.length;
      await tx.transactions.update({
        where: { id },
        data: {
          payment_status: allRefunded ? 'refunded' : 'partial',
          notes: `${existing.notes ? existing.notes + ' | ' : ''}Refunded via ${refundNumber}`,
        },
      });

      return {
        ...refund,
        items: createdRefundItems,
        original_transaction_number: existing.transaction_number,
      };
    });

    return refundTransaction;
  }
}

export const transactionService = new TransactionService();
