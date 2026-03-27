/**
 * Minimal in-memory MySQL mock for local testing without a database server.
 */
class MockPool {
  constructor() {
    this.tables = {
      users: [],
      projects: [],
      freelancer_profiles: [],
      project_applications: [],
      notifications: [],
      messages: [],
      project_payments: [],
    };
    this.nextId = 1;
  }

  warnActivated() {
    console.warn('[MOCK DB] Running in-memory fallback. Data will not persist after restart.');
  }

  async getConnection() {
    return this;
  }

  async beginTransaction() {}

  async commit() {}

  async rollback() {}

  release() {}

  async query(sql, params = []) {
    const s = sql.toLowerCase().trim();

    // Mock Login
    if (s.includes('select') && s.includes('from users') && s.includes('email = ?')) {
      const user = this.tables.users.find((u) => u.email === params[0]);
      return [user ? [user] : [], []];
    }

    // Mock Find User by Phone
    if (s.includes('select') && s.includes('from users') && s.includes('phone = ?')) {
      const user = this.tables.users.find((u) => String(u.phone) === String(params[0]));
      return [user ? [user] : [], []];
    }

    // Mock Find User by ID
    if (s.includes('select') && s.includes('from users') && s.includes('id = ?')) {
      const user = this.tables.users.find((u) => String(u.id) === String(params[0]));
      return [user ? [user] : [], []];
    }

    // Mock Registration
    if (s.includes('insert into users')) {
      const id = this.nextId++;
      const [name, email, phone, passwordHash, role] = params;
      const user = { 
        id, 
        name, 
        email, 
        phone, 
        contactPhone: phone, // Sync with business logic expectations
        passwordHash, 
        role, 
        createdAt: new Date() 
      };
      this.tables.users.push(user);
      return [{ insertId: id }, []];
    }

    // Mock Projects list
    if (s.includes('select') && s.includes('from projects') && !s.includes('where id = ?')) {
      return [this.tables.projects, []];
    }

    // Default empty array for unknown select
    if (s.includes('select')) {
      return [[], []];
    }

    // Default success for other mutations
    return [{ affectedRows: 1, insertId: this.nextId++ }, []];
  }

  async execute(sql, params) {
    return this.query(sql, params);
  }

  async end() {}
}

module.exports = new MockPool();
