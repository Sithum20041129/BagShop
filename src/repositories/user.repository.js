const BaseRepository = require('./base.repository');

class UserRepository extends BaseRepository {
  constructor() {
    super('users.json');
  }

  findAll() {
    return this.read();
  }

  findById(id) {
    const users = this.read();
    return users.find(u => u.id === id) || null;
  }

  findByEmail(email) {
    const users = this.read();
    const clean = (email || '').trim().toLowerCase();
    return users.find(u => u.email.toLowerCase() === clean) || null;
  }

  findByClerkId(clerkId) {
    const users = this.read();
    return users.find(u => u.clerkId === clerkId) || null;
  }

  create(user) {
    const users = this.read();
    users.push(user);
    this.write(users);
    return user;
  }

  update(id, updates) {
    const users = this.read();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;

    users[index] = { ...users[index], ...updates, updatedAt: new Date().toISOString() };
    this.write(users);
    return users[index];
  }
}

module.exports = new UserRepository();
