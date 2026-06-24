import Database from 'better-sqlite3'
import path from 'path'
import bcrypt from 'bcryptjs'

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'cards.db')

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH)
    _db.pragma('journal_mode = WAL')
    _db.pragma('foreign_keys = ON')
    initSchema(_db)
  }
  return _db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_number TEXT UNIQUE NOT NULL,
      owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      balance REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      balance_after REAL NOT NULL,
      note TEXT,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  // Seed default admin if not exists
  const admin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin')
  if (!admin) {
    const password = process.env.ADMIN_PASSWORD || Math.random().toString(36).slice(-10)
    const hash = bcrypt.hashSync(password, 10)
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('admin', hash, 'admin')
    console.log(`[card-admin] Default admin created — username: admin  password: ${password}`)
  }
}

// Users
export const db = {
  users: {
    findByUsername: (username: string) =>
      getDb().prepare('SELECT * FROM users WHERE username = ?').get(username) as any,
    findById: (id: number) =>
      getDb().prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(id) as any,
    list: () =>
      getDb().prepare('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC').all() as any[],
    create: (username: string, passwordHash: string, role = 'user') =>
      getDb().prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(username, passwordHash, role),
    updatePassword: (id: number, passwordHash: string) =>
      getDb().prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, id),
    delete: (id: number) =>
      getDb().prepare('DELETE FROM users WHERE id = ?').run(id),
  },
  cards: {
    list: () =>
      getDb().prepare(`SELECT c.*, u.username as owner_name FROM cards c LEFT JOIN users u ON c.owner_id = u.id ORDER BY c.created_at DESC`).all() as any[],
    listByOwner: (ownerId: number) =>
      getDb().prepare(`SELECT c.*, u.username as owner_name FROM cards c LEFT JOIN users u ON c.owner_id = u.id WHERE c.owner_id = ? ORDER BY c.created_at DESC`).all(ownerId) as any[],
    findById: (id: number) =>
      getDb().prepare('SELECT c.*, u.username as owner_name FROM cards c LEFT JOIN users u ON c.owner_id = u.id WHERE c.id = ?').get(id) as any,
    create: (cardNumber: string, ownerId: number | null, balance: number, note: string, expiresAt: string | null) =>
      getDb().prepare('INSERT INTO cards (card_number, owner_id, balance, note, expires_at) VALUES (?, ?, ?, ?, ?)').run(cardNumber, ownerId, balance, note, expiresAt),
    updateStatus: (id: number, status: string) =>
      getDb().prepare('UPDATE cards SET status = ? WHERE id = ?').run(status, id),
    updateBalance: (id: number, balance: number) =>
      getDb().prepare('UPDATE cards SET balance = ? WHERE id = ?').run(balance, id),
    delete: (id: number) =>
      getDb().prepare('DELETE FROM cards WHERE id = ?').run(id),
    stats: () =>
      getDb().prepare('SELECT COUNT(*) as total, SUM(balance) as totalBalance, SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as active FROM cards').get('active') as any,
  },
  transactions: {
    list: (limit = 100) =>
      getDb().prepare(`SELECT t.*, c.card_number, u.username as created_by_name FROM transactions t LEFT JOIN cards c ON t.card_id = c.id LEFT JOIN users u ON t.created_by = u.id ORDER BY t.created_at DESC LIMIT ?`).all(limit) as any[],
    listByCard: (cardId: number) =>
      getDb().prepare(`SELECT t.*, c.card_number, u.username as created_by_name FROM transactions t LEFT JOIN cards c ON t.card_id = c.id LEFT JOIN users u ON t.created_by = u.id WHERE t.card_id = ? ORDER BY t.created_at DESC`).all(cardId) as any[],
    listByOwner: (ownerId: number) =>
      getDb().prepare(`SELECT t.*, c.card_number FROM transactions t JOIN cards c ON t.card_id = c.id WHERE c.owner_id = ? ORDER BY t.created_at DESC`).all(ownerId) as any[],
    create: (cardId: number, type: string, amount: number, balanceAfter: number, note: string, createdBy: number) =>
      getDb().prepare('INSERT INTO transactions (card_id, type, amount, balance_after, note, created_by) VALUES (?, ?, ?, ?, ?, ?)').run(cardId, type, amount, balanceAfter, note, createdBy),
    todayCount: () =>
      (getDb().prepare(`SELECT COUNT(*) as count FROM transactions WHERE date(created_at) = date('now')`).get() as any).count,
  },
}
