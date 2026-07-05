import { Router } from 'express';
import { db } from '../db/client.js';
import { hashPassword, comparePassword } from '../lib/password.js';
import { signToken } from '../lib/jwt.js';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

interface UserRow {
  id: number;
  username: string;
  password_hash: string;
}

function validateCredentials(username: unknown, password: unknown): string | null {
  if (typeof username !== 'string' || !USERNAME_RE.test(username)) {
    return 'Username must be 3-20 characters, letters/numbers/underscore only';
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    return 'Password must be 8-72 characters';
  }
  return null;
}

export const authRouter = Router();

authRouter.post('/signup', async (req, res) => {
  const { username, password } = req.body ?? {};
  const validationError = validateCredentials(username, password);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const normalizedUsername = (username as string).toLowerCase();
  const existing = db
    .prepare('SELECT id FROM users WHERE username = ?')
    .get(normalizedUsername);
  if (existing) {
    res.status(409).json({ error: 'Username is already taken' });
    return;
  }

  const passwordHash = await hashPassword(password as string);
  const result = db
    .prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
    .run(normalizedUsername, passwordHash);

  const token = signToken({ sub: Number(result.lastInsertRowid), username: normalizedUsername });
  res.status(201).json({ token, user: { id: result.lastInsertRowid, username: normalizedUsername } });
});

authRouter.post('/signin', async (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const normalizedUsername = username.toLowerCase();
  const user = db
    .prepare('SELECT id, username, password_hash FROM users WHERE username = ?')
    .get(normalizedUsername) as UserRow | undefined;

  if (!user || !(await comparePassword(password, user.password_hash))) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  const token = signToken({ sub: user.id, username: user.username });
  res.status(200).json({ token, user: { id: user.id, username: user.username } });
});
