import { Review } from '../types/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Динамический импорт sqlite3
let sqlite3: any = null;

export class Database {
  private db: any;
  private inMemory: boolean;
  private memReviews: Review[] = [];

  constructor() {
    // Пытаемся использовать SQLite, если не получится — fallback на in-memory
    this.inMemory = !sqlite3;
    if (this.inMemory) {
      // Используем память как fallback
      this.db = null;
      return;
    }
    const baseDir = path.join(__dirname, '..', '..');
    const dbPath = path.join(baseDir, 'data', 'reviews.db');
    this.db = new sqlite3.Database(dbPath);
    this.initTables();
  }

  private initTables(): void {
    if (this.inMemory) return;
    const createReviewsTable = `
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        app_name TEXT NOT NULL,
        store TEXT NOT NULL,
        rating INTEGER NOT NULL,
        title TEXT,
        content TEXT NOT NULL,
        author TEXT NOT NULL,
        date DATETIME NOT NULL,
        region TEXT NOT NULL,
        version TEXT,
        helpful INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createAppsTable = `
      CREATE TABLE IF NOT EXISTS apps (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        developer TEXT NOT NULL,
        icon TEXT,
        store TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    this.db.run(createReviewsTable);
    this.db.run(createAppsTable);

    // Try to add app_id column if it doesn't exist (ignore error if already exists)
    this.db.run(`ALTER TABLE reviews ADD COLUMN app_id TEXT`, (err: Error | null) => {
      // ignore if column exists
    });
    // Ensure uniqueness across (id, store, region) to avoid cross-region collisions
    this.db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique ON reviews (id, store, region)`);
  }

  async saveReviews(reviews: Review[]): Promise<void> {
    if (this.inMemory) {
      // Обновляем/добавляем по уникальному ключу (id+store+region)
      const key = (r: Review) => `${r.id}|${r.store}|${r.region}`;
      const map = new Map(this.memReviews.map(r => [key(r), r] as const));
      for (const r of reviews) {
        map.set(key(r), r);
      }
      this.memReviews = Array.from(map.values());
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO reviews 
        (id, app_name, store, rating, title, content, author, date, region, version, helpful, app_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
        
        reviews.forEach(review => {
          stmt.run([
            review.id,
            review.appName,
            review.store,
            review.rating,
            review.title,
            review.content,
            review.author,
            review.date.toISOString(),
            review.region,
            review.version,
            review.helpful || 0,
            // @ts-ignore - database has app_id column; Review type may not include it directly
            (review as any).appId || null
          ]);
        });

        this.db.run('COMMIT', (err: Error | null) => {
          if (err) reject(err);
          else resolve();
        });
      });

      stmt.finalize();
    });
  }

  async getReviews(filters: {
    appName?: string;
    appId?: string;
    store?: string;
    ratings?: number[];
    region?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ reviews: Review[], total: number }> {
    if (this.inMemory) {
      let list = this.memReviews.slice();
      if (filters.appName) list = list.filter(r => r.appName === filters.appName);
      if (filters.appId) list = list.filter((r: any) => (r as any).appId === filters.appId);
      if (filters.store) list = list.filter(r => r.store === filters.store);
      if (filters.ratings && filters.ratings.length) list = list.filter(r => filters.ratings!.includes(r.rating));
      if (filters.region) list = list.filter(r => r.region === filters.region);
      if (filters.startDate) list = list.filter(r => r.date >= filters.startDate!);
      if (filters.endDate) list = list.filter(r => r.date <= filters.endDate!);
      list.sort((a, b) => b.date.getTime() - a.date.getTime());
      const total = list.length;
      const offset = filters.offset || 0;
      const limit = filters.limit || total;
      const page = list.slice(offset, offset + limit);
      return Promise.resolve({ reviews: page, total });
    }
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM reviews WHERE 1=1';
      let countQuery = 'SELECT COUNT(*) as total FROM reviews WHERE 1=1';
      const queryParams: any[] = [];
      const countParams: any[] = [];

      if (filters.appName) {
        const clause = ' AND app_name = ?';
        query += clause;
        countQuery += clause;
        queryParams.push(filters.appName);
        countParams.push(filters.appName);
      }

      if (filters.appId) {
        const clause = ' AND app_id = ?';
        query += clause;
        countQuery += clause;
        queryParams.push(filters.appId);
        countParams.push(filters.appId);
      }

      if (filters.store) {
        const clause = ' AND store = ?';
        query += clause;
        countQuery += clause;
        queryParams.push(filters.store);
        countParams.push(filters.store);
      }

      if (filters.ratings && filters.ratings.length > 0) {
        const placeholders = filters.ratings.map(() => '?').join(',');
        const clause = ` AND rating IN (${placeholders})`;
        query += clause;
        countQuery += clause;
        queryParams.push(...filters.ratings);
        countParams.push(...filters.ratings);
      }

      if (filters.region) {
        const clause = ' AND region = ?';
        query += clause;
        countQuery += clause;
        queryParams.push(filters.region);
        countParams.push(filters.region);
      }

      if (filters.startDate) {
        const clause = ' AND date >= ?';
        query += clause;
        countQuery += clause;
        queryParams.push(filters.startDate.toISOString());
        countParams.push(filters.startDate.toISOString());
      }

      if (filters.endDate) {
        const clause = ' AND date <= ?';
        query += clause;
        countQuery += clause;
        queryParams.push(filters.endDate.toISOString());
        countParams.push(filters.endDate.toISOString());
      }

      query += ' ORDER BY date DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        queryParams.push(filters.limit);
      }

      if (filters.offset) {
        query += ' OFFSET ?';
        queryParams.push(filters.offset);
      }

      // Получаем общее количество
      this.db.get(countQuery, countParams, (err: Error | null, row: any) => {
        if (err) {
          reject(err);
          return;
        }

        const total = row.total;

        // Получаем отзывы
        this.db.all(query, queryParams, (err: Error | null, rows: any[]) => {
          if (err) {
            reject(err);
            return;
          }

          const reviews: Review[] = rows.map(row => ({
            id: row.id,
            appName: row.app_name,
            store: row.store as 'google' | 'apple',
            rating: row.rating,
            title: row.title,
            content: row.content,
            author: row.author,
            date: new Date(row.date),
            region: row.region,
            version: row.version,
            helpful: row.helpful
          }));

          resolve({ reviews, total });
        });
      });
    });
  }

  close(): void {
    if (this.inMemory) return;
    this.db.close();
  }
}
