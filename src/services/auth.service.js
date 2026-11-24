const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const envConfig = require('../config/env.config');
const userRepository = require('../repositories/user.repository');

class AuthService {
  generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'customer'
    };
    return jwt.sign(payload, envConfig.jwt.secret, {
      expiresIn: envConfig.jwt.expiresIn
    });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, envConfig.jwt.secret);
    } catch {
      return null;
    }
  }

  async register({ name, email, password, phone }) {
    if (!name || !email || !password) {
      const error = new Error('Name, email, and password are required.');
      error.statusCode = 400;
      throw error;
    }

    if (password.length < 6) {
      const error = new Error('Password must be at least 6 characters long.');
      error.statusCode = 400;
      throw error;
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = userRepository.findByEmail(cleanEmail);
    if (existing) {
      const error = new Error('An account with this email already exists.');
      error.statusCode = 409;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = {
      id: `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      phone: phone ? phone.trim() : '',
      role: 'customer',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=0F172A&color=D4AF37`,
      provider: 'local',
      createdAt: new Date().toISOString()
    };

    userRepository.create(newUser);

    const token = this.generateToken(newUser);
    const safeUser = this.sanitizeUser(newUser);

    return { user: safeUser, token };
  }

  async login({ email, password }) {
    if (!email || !password) {
      const error = new Error('Email and password are required.');
      error.statusCode = 400;
      throw error;
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = userRepository.findByEmail(cleanEmail);

    if (!user || !user.passwordHash) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      throw error;
    }

    const token = this.generateToken(user);
    const safeUser = this.sanitizeUser(user);

    return { user: safeUser, token };
  }

  // Integration with third-party service Clerk
  async syncClerkUser({ clerkId, email, name, avatar }) {
    if (!clerkId || !email) {
      const error = new Error('Clerk ID and email are required to sync user.');
      error.statusCode = 400;
      throw error;
    }

    let user = userRepository.findByClerkId(clerkId);
    if (!user) {
      user = userRepository.findByEmail(email);
    }

    if (user) {
      user = userRepository.update(user.id, {
        clerkId,
        name: name || user.name,
        avatar: avatar || user.avatar,
        provider: 'clerk'
      });
    } else {
      user = {
        id: `usr_clerk_${Date.now()}`,
        clerkId,
        email: email.trim().toLowerCase(),
        name: name || 'Bright Buy Member',
        avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Member')}&background=0F172A&color=D4AF37`,
        role: 'customer',
        provider: 'clerk',
        createdAt: new Date().toISOString()
      };
      userRepository.create(user);
    }

    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }

  sanitizeUser(user) {
    const { passwordHash, ...safe } = user;
    return safe;
  }
}

module.exports = new AuthService();
