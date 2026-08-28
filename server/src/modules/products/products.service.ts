import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getPaginationParams, createPaginatedResult, PaginatedResult } from '../../utils/pagination';
import {
  CreateProductInput,
  UpdateProductInput,
  ListProductsQuery,
  CreateCategoryInput,
  UpdateCategoryInput,
  ListCategoriesQuery,
  StockAdjustmentInput,
} from './products.validation';
import { Decimal } from '@prisma/client/runtime/library';

export class ProductService {
  async generateSku(): Promise<string> {
    const lastProduct = await prisma.products.findFirst({
      orderBy: { id: 'desc' },
      select: { sku: true },
    });

    let nextNumber = 1;
    if (lastProduct) {
      const match = lastProduct.sku.match(/PRD-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `PRD-${String(nextNumber).padStart(5, '0')}`;
  }

  async createProduct(data: CreateProductInput) {
    const sku = data.sku || (await this.generateSku());

    const existingSku = await prisma.products.findUnique({ where: { sku } });
    if (existingSku) {
      throw new AppError('SKU already exists', 409);
    }

    if (data.product_category_id) {
      const category = await prisma.product_categories.findUnique({
        where: { id: data.product_category_id },
      });
      if (!category || category.deleted_at) {
        throw new AppError('Product category not found', 404);
      }
    }

    const product = await prisma.products.create({
      data: {
        product_category_id: data.product_category_id ?? null,
        name: data.name,
        sku,
        description: data.description ?? null,
        unit: data.unit ?? 'piece',
        unit_cost: data.unit_cost ?? 0,
        unit_price: data.unit_price ?? 0,
        current_stock: data.current_stock ?? 0,
        minimum_stock: data.minimum_stock ?? 0,
        maximum_stock: data.maximum_stock ?? null,
        is_retail: data.is_retail ?? true,
        is_consumable: data.is_consumable ?? true,
        barcode: data.barcode ?? null,
        image_url: data.image_url ?? null,
        status: data.status ?? 'active',
      },
      include: { category: true },
    });

    return product;
  }

  async getProducts(query: ListProductsQuery): Promise<PaginatedResult<any>> {
    const { page, limit, skip } = getPaginationParams(query);
    const { search, product_category_id, status, is_retail, is_consumable, low_stock, sort_by, sort_order } = query;

    if (low_stock) {
      return this.getLowStockProductsPaginated(query);
    }

    const where: any = { deleted_at: null };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (product_category_id) {
      where.product_category_id = product_category_id;
    }

    if (status) {
      where.status = status;
    }

    if (is_retail !== undefined) {
      where.is_retail = is_retail;
    }

    if (is_consumable !== undefined) {
      where.is_consumable = is_consumable;
    }

    const orderBy: any = {};
    if (sort_by) {
      orderBy[sort_by] = sort_order || 'asc';
    } else {
      orderBy.created_at = 'desc';
    }

    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where,
        include: { category: true },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.products.count({ where }),
    ]);

    return createPaginatedResult(products, total, { page, limit, skip });
  }

  private async getLowStockProductsPaginated(query: ListProductsQuery): Promise<PaginatedResult<any>> {
    const { page, limit, skip } = getPaginationParams(query);
    const { search, product_category_id, status, is_retail, is_consumable, sort_by, sort_order } = query;

    const conditions: string[] = ['p.deleted_at IS NULL', 'p.current_stock <= p.minimum_stock'];
    const params: any[] = [];

    if (search) {
      conditions.push('(p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (product_category_id) {
      conditions.push('p.product_category_id = ?');
      params.push(product_category_id);
    }

    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    }

    if (is_retail !== undefined) {
      conditions.push('p.is_retail = ?');
      params.push(is_retail);
    }

    if (is_consumable !== undefined) {
      conditions.push('p.is_consumable = ?');
      params.push(is_consumable);
    }

    const whereClause = conditions.join(' AND ');

    const sortColumn = sort_by || 'created_at';
    const sortDirection = sort_order || 'desc';

    const countResult = await prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM products p WHERE ${whereClause}`,
      ...params
    );
    const total = Number(countResult[0]?.count || 0);

    const products = await prisma.$queryRawUnsafe<any[]>(
      `SELECT p.* FROM products p WHERE ${whereClause} ORDER BY p.${sortColumn} ${sortDirection} LIMIT ${limit} OFFSET ${skip}`,
      ...params
    );

    if (products.length > 0) {
      const categoryIds = [...new Set(products.map((p: any) => p.product_category_id).filter(Boolean))];
      if (categoryIds.length > 0) {
        const categories = await prisma.product_categories.findMany({
          where: { id: { in: categoryIds } },
        });
        const categoryMap = new Map(categories.map((c) => [c.id, c]));
        products.forEach((p: any) => {
          p.category = p.product_category_id ? categoryMap.get(p.product_category_id) || null : null;
        });
      }
    }

    return createPaginatedResult(products, total, { page, limit, skip });
  }

  async getProductById(id: number) {
    const product = await prisma.products.findFirst({
      where: { id, deleted_at: null },
      include: { category: true },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return product;
  }

  async getProductWithMovements(id: number) {
    const product = await prisma.products.findFirst({
      where: { id, deleted_at: null },
      include: {
        category: true,
        inventory_movements: {
          orderBy: { created_at: 'desc' },
          include: {
            performed_by_user: {
              select: { id: true, email: true },
            },
          },
        },
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return product;
  }

  async updateProduct(id: number, data: UpdateProductInput) {
    const existing = await prisma.products.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new AppError('Product not found', 404);
    }

    if (data.sku && data.sku !== existing.sku) {
      const skuExists = await prisma.products.findUnique({ where: { sku: data.sku } });
      if (skuExists) {
        throw new AppError('SKU already exists', 409);
      }
    }

    if (data.product_category_id) {
      const category = await prisma.product_categories.findUnique({
        where: { id: data.product_category_id },
      });
      if (!category || category.deleted_at) {
        throw new AppError('Product category not found', 404);
      }
    }

    const product = await prisma.products.update({
      where: { id },
      data,
      include: { category: true },
    });

    return product;
  }

  async deleteProduct(id: number) {
    const existing = await prisma.products.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new AppError('Product not found', 404);
    }

    await prisma.products.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async getLowStockProducts() {
    const products = await prisma.$queryRaw<any[]>`
      SELECT p.*, pc.name as category_name
      FROM products p
      LEFT JOIN product_categories pc ON p.product_category_id = pc.id
      WHERE p.deleted_at IS NULL
      AND p.current_stock <= p.minimum_stock
      ORDER BY (p.current_stock / NULLIF(p.minimum_stock, 0)) ASC
    `;

    return products;
  }

  async adjustStock(data: StockAdjustmentInput, userId: number) {
    const product = await prisma.products.findFirst({
      where: { id: data.product_id, deleted_at: null },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const currentStock = new Decimal(product.current_stock.toString());
    const quantity = new Decimal(data.quantity.toString());

    let newStock: Decimal;

    const addTypes = ['purchase', 'return', 'opening_stock'];
    const subtractTypes = ['sale', 'consumption', 'damage'];

    if (addTypes.includes(data.type)) {
      newStock = currentStock.add(quantity);
    } else if (subtractTypes.includes(data.type)) {
      newStock = currentStock.minus(quantity);
      if (newStock.isNegative()) {
        throw new AppError('Insufficient stock for this operation', 400);
      }
    } else {
      newStock = quantity;
    }

    const movement = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.products.update({
        where: { id: data.product_id },
        data: { current_stock: newStock },
      });

      const inventoryMovement = await tx.inventory_movements.create({
        data: {
          product_id: data.product_id,
          type: data.type,
          quantity: data.quantity,
          unit_cost: data.unit_cost ?? product.unit_cost,
          running_stock_after: newStock,
          reference_type: data.reference_type ?? 'manual',
          reference_id: data.reference_id ?? null,
          performed_by: userId,
          notes: data.notes ?? null,
        },
      });

      return { product: updatedProduct, movement: inventoryMovement };
    });

    return movement;
  }

  async createCategory(data: CreateCategoryInput) {
    const existing = await prisma.product_categories.findUnique({
      where: { name: data.name },
    });

    if (existing && !existing.deleted_at) {
      throw new AppError('Category name already exists', 409);
    }

    if (existing && existing.deleted_at) {
      const restored = await prisma.product_categories.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          description: data.description ?? existing.description,
          sort_order: data.sort_order ?? existing.sort_order,
          is_active: data.is_active ?? true,
          deleted_at: null,
        },
      });
      return restored;
    }

    const category = await prisma.product_categories.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        sort_order: data.sort_order ?? 0,
        is_active: data.is_active ?? true,
      },
    });

    return category;
  }

  async getCategories(query: ListCategoriesQuery): Promise<PaginatedResult<any>> {
    const { page, limit, skip } = getPaginationParams(query);

    const where: any = { deleted_at: null };

    if (!query.include_inactive) {
      where.is_active = true;
    }

    const [categories, total] = await Promise.all([
      prisma.product_categories.findMany({
        where,
        include: {
          _count: { select: { products: true } },
        },
        orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.product_categories.count({ where }),
    ]);

    return createPaginatedResult(categories, total, { page, limit, skip });
  }

  async getCategoryById(id: number) {
    const category = await prisma.product_categories.findFirst({
      where: { id, deleted_at: null },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    return category;
  }

  async updateCategory(id: number, data: UpdateCategoryInput) {
    const existing = await prisma.product_categories.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new AppError('Category not found', 404);
    }

    if (data.name && data.name !== existing.name) {
      const nameExists = await prisma.product_categories.findUnique({
        where: { name: data.name },
      });
      if (nameExists && nameExists.id !== id && !nameExists.deleted_at) {
        throw new AppError('Category name already exists', 409);
      }
    }

    const category = await prisma.product_categories.update({
      where: { id },
      data,
    });

    return category;
  }

  async deleteCategory(id: number) {
    const existing = await prisma.product_categories.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new AppError('Category not found', 404);
    }

    const productCount = await prisma.products.count({
      where: { product_category_id: id, deleted_at: null },
    });

    if (productCount > 0) {
      throw new AppError(
        'Cannot delete category with existing products. Reassign or remove products first.',
        400
      );
    }

    await prisma.product_categories.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }
}

export const productService = new ProductService();
