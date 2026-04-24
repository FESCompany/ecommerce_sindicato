import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prismaService: PrismaService) {}

  async products(userId: string) {
    const products = await this.prismaService.product.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        name: true,
        stock: true,
        soldCount: true,
        price: true,
      },
    });

    // chart data
    const chart = products.map((product) => ({
      name: product.name,
      stock: product.stock,
      sold: product.soldCount,
    }));

    // extra metrics
    const summary = {
      totalProducts: products.length,
      totalStock: products.reduce((acc, p) => acc + p.stock, 0),
      totalSold: products.reduce((acc, p) => acc + p.soldCount, 0),
      totalRevenue: products.reduce((acc, p) => acc + p.soldCount * p.price, 0),
    };

    return {
      chart,
      summary,
    };
  }

  async orders(sellerId: string) {
    const orders = await this.prismaService.order.findMany({
      where: {
        sellerId,
        status: 'PAID', // only count real revenue
      },
      select: {
        total: true,
        createdAt: true,
      },
    });

    // group by day
    const grouped: Record<string, number> = {};

    for (const order of orders) {
      const date = order.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!grouped[date]) {
        grouped[date] = 0;
      }

      grouped[date] += order.total;
    }

    // transform to chart format
    const chart = Object.entries(grouped)
      .map(([date, revenue]) => ({
        date,
        revenue,
      }))
      .sort((a, b) => a.date.localeCompare(b.date)); // ensure correct order

    // summary
    const summary = {
      totalRevenue: orders.reduce((acc, o) => acc + o.total, 0),
      totalOrders: orders.length,
    };

    return {
      chart,
      summary,
    };
  }
}
