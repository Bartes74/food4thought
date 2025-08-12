import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getDb } from '../database.js';

/**
 * Generuje token weryfikacyjny dla email
 */
export const generateVerificationToken = (userId, email) => {
  return jwt.sign(
    { userId, email, type: 'email_verification' },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

/**
 * Weryfikuje token email
 */
export const verifyEmailToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    if (decoded.type !== 'email_verification') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired verification token');
  }
};

/**
 * Zapisuje token weryfikacyjny do bazy danych
 */
export const saveVerificationToken = async (userId, token) => {
  const db = await getDb();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 godziny
  
  await db.run(
    'INSERT OR REPLACE INTO email_verifications (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt.toISOString()]
  );
};

/**
 * Sprawdza czy token weryfikacyjny jest ważny
 */
export const checkVerificationToken = async (token) => {
  const db = await getDb();
  const verification = await db.get(
    'SELECT * FROM email_verifications WHERE token = ? AND expires_at > ? AND used = 0',
    [token, new Date().toISOString()]
  );
  
  return verification;
};

/**
 * Oznacza token jako użyty
 */
export const markTokenAsUsed = async (token) => {
  const db = await getDb();
  await db.run(
    'UPDATE email_verifications SET used = 1 WHERE token = ?',
    [token]
  );
};

/**
 * Oznacza użytkownika jako zweryfikowanego
 */
export const markUserAsVerified = async (userId) => {
  const db = await getDb();
  await db.run(
    'UPDATE users SET email_verified = 1 WHERE id = ?',
    [userId]
  );
};

/**
 * Generuje HTML email z linkiem weryfikacyjnym
 */
export const generateVerificationEmail = (email, verificationUrl) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Potwierdź swój adres email - Food 4 Thought</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Food 4 Thought</h1>
          <p>Potwierdź swój adres email</p>
        </div>
        <div class="content">
          <h2>Witaj w Food 4 Thought!</h2>
          <p>Dziękujemy za rejestrację. Aby aktywować swoje konto, kliknij poniższy przycisk:</p>
          <p style="text-align: center;">
            <a href="${verificationUrl}" class="button">Potwierdź adres email</a>
          </p>
          <p>Jeśli przycisk nie działa, skopiuj i wklej poniższy link do przeglądarki:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p><strong>Link jest ważny przez 24 godziny.</strong></p>
        </div>
        <div class="footer">
          <p>Jeśli nie zakładałeś konta w Food 4 Thought, zignoruj ten email.</p>
          <p>&copy; 2024 Food 4 Thought. Wszystkie prawa zastrzeżone.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Wysyła email weryfikacyjny (mock - w rzeczywistej aplikacji użyj nodemailer)
 */
export const sendVerificationEmail = async (email, verificationUrl) => {
  // W rzeczywistej aplikacji użyj nodemailer lub innej biblioteki
  console.log('📧 Email weryfikacyjny wysłany na:', email);
  console.log('🔗 Link weryfikacyjny:', verificationUrl);
  
  // Dla celów deweloperskich, wyświetlamy link w konsoli
  console.log('\n=== EMAIL WERYFIKACYJNY ===');
  console.log('Do:', email);
  console.log('Temat: Potwierdź swój adres email - Food 4 Thought');
  console.log('Link:', verificationUrl);
  console.log('===========================\n');
  
  return true;
};
