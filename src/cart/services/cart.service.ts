import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database';
import { Cart, CartStatuses } from '../models';
import { PutCartPayload } from 'src/order/type';

@Injectable()
export class CartService {
  constructor(private db: DatabaseService) {}

  async findByUserId(userId: string): Promise<Cart> {
    const result = await this.db.getPool().query(
      `SELECT c.*, ci.product_id, ci.count 
       FROM carts c 
       LEFT JOIN cart_items ci ON c.id = ci.cart_id 
       WHERE c.user_id = $1 AND c.status = 'OPEN'`,
      [userId],
    );

    if (result.rows.length === 0) return null;

    // Transform the rows into Cart object
    const cart = {
      id: result.rows[0].id,
      user_id: result.rows[0].user_id,
      created_at: new Date(result.rows[0].created_at).getTime(),
      updated_at: new Date(result.rows[0].updated_at).getTime(),
      status: result.rows[0].status,
      items: result.rows
        .map((row) => ({
          product: {
            id: row.product_id,
            title: row.product_title || 'Unknown Title',
            description: row.product_description || 'No Description',
            price: row.product_price || 0,
          }, // Assuming these fields exist in the database
          count: row.count,
        }))
        .filter((item) => item.product.id !== null),
    };

    return cart;
  }

  async createByUserId(userId: string): Promise<Cart> {
    const result = await this.db.getPool().query(
      `INSERT INTO carts (user_id, status) 
       VALUES ($1, $2) 
       RETURNING *`,
      [userId, CartStatuses.OPEN],
    );

    return {
      id: result.rows[0].id,
      user_id: result.rows[0].user_id,
      created_at: new Date(result.rows[0].created_at).getTime(),
      updated_at: new Date(result.rows[0].updated_at).getTime(),
      status: result.rows[0].status,
      items: [],
    };
  }

  async findOrCreateByUserId(userId: string): Promise<Cart> {
    const cart = await this.findByUserId(userId);
    if (cart) return cart;
    return this.createByUserId(userId);
  }

  async updateByUserId(userId: string, payload: PutCartPayload): Promise<Cart> {
    const client = await this.db.getPool().connect();

    try {
      await client.query('BEGIN');

      const cart = await this.findOrCreateByUserId(userId);

      // Update cart items
      await client.query(
        `INSERT INTO cart_items (cart_id, product_id, count)
         VALUES ($1, $2, $3)
         ON CONFLICT (cart_id, product_id) 
         DO UPDATE SET count = $3`,
        [cart.id, payload.product.id, payload.count],
      );

      if (payload.count === 0) {
        await client.query(
          `DELETE FROM cart_items 
           WHERE cart_id = $1 AND product_id = $2`,
          [cart.id, payload.product.id],
        );
      }

      await client.query('COMMIT');

      return this.findByUserId(userId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async removeByUserId(userId: string): Promise<void> {
    await this.db
      .getPool()
      .query(`DELETE FROM carts WHERE user_id = $1`, [userId]);
  }
}
