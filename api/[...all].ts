import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const pool = new Pool({
  host: process.env.DB_HOST || 'aws-1-eu-west-1.pooler.supabase.com',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres.enlqpifpxuecxxozyiak',
  password: process.env.DB_PASSWORD || '@JIm47jhC_7%#',
  ssl: { rejectUnauthorized: false },
  max: 3,
  connectionTimeoutMillis: 10000,
});

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';
const OTP_EXPIRY_MS = 5 * 60 * 1000;
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// M-Pesa (Daraja) config (supports multiple env naming styles)
const MPESA_CONSUMER_KEY = firstEnv('MPESA_CONSUMER_KEY', 'DARAJA_CONSUMER_KEY');
const MPESA_CONSUMER_SECRET = firstEnv('MPESA_CONSUMER_SECRET', 'DARAJA_CONSUMER_SECRET');
const MPESA_SHORTCODE = firstEnv('MPESA_SHORTCODE', 'MPESA_BUSINESS_SHORTCODE', 'BUSINESS_SHORT_CODE');
const MPESA_TILL_NUMBER = firstEnv('MPESA_TILL_NUMBER', 'MPESA_TILL');
const MPESA_PASSKEY = firstEnv('MPESA_PASSKEY', 'DARAJA_PASSKEY');
const MPESA_CALLBACK_URL = firstEnv('MPESA_CALLBACK_URL') || 'https://hms-monorepo.vercel.app/api/mpesa/callback';
const MPESA_ENV = (firstEnv('MPESA_ENV', 'DARAJA_ENV') || 'sandbox').toLowerCase();
const MPESA_BASE_URL = MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

// Determine if we're using Till or Paybill
// For BOTH Till and Paybill: BusinessShortCode = Shortcode (Daraja-registered org code)
// Till: PartyB = Till Number, TransactionType = CustomerBuyGoodsOnline
// Paybill: PartyB = Shortcode, TransactionType = CustomerPayBillOnline
const MPESA_IS_TILL = !!MPESA_TILL_NUMBER;
const MPESA_TRANSACTION_TYPE = MPESA_IS_TILL ? 'CustomerBuyGoodsOnline' : 'CustomerPayBillOnline';
const MPESA_PARTY_B = MPESA_IS_TILL ? MPESA_TILL_NUMBER : MPESA_SHORTCODE;

function normalizePhone(phone: string): string {
  const raw = String(phone || '').replace(/[^\d]/g, '');
  if (raw.startsWith('254') && raw.length === 12) return raw;
  if (raw.startsWith('0') && raw.length === 10) return `254${raw.slice(1)}`;
  if (raw.length === 9 && raw.startsWith('7')) return `254${raw}`;
  return raw;
}

async function getMpesaAccessToken(): Promise<string> {
  if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET) {
    throw new Error('M-Pesa credentials missing. Set MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET.');
  }
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
  const resp = await fetch(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: { Authorization: `Basic ${auth}` },
  });
  const data = await resp.json() as any;
  if (!resp.ok || !data?.access_token) {
    throw new Error(data?.errorMessage || 'Failed to get M-Pesa access token');
  }
  return data.access_token as string;
}

function firstEnv(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key];
    if (value && String(value).trim().length > 0) return String(value).trim();
  }
  return '';
}

const EMAIL_USER = firstEnv('EMAIL_USER', 'SMTP_USER', 'MAIL_USER', 'SMTP_USERNAME');
const EMAIL_PASS = firstEnv('EMAIL_PASS', 'SMTP_PASS', 'MAIL_PASS', 'EMAIL_PASSWORD', 'SMTP_PASSWORD');
const EMAIL_HOST = firstEnv('EMAIL_HOST', 'SMTP_HOST', 'MAIL_HOST') || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(firstEnv('EMAIL_PORT', 'SMTP_PORT', 'MAIL_PORT') || '587', 10);
const EMAIL_FROM = firstEnv('EMAIL_FROM', 'SMTP_FROM') || EMAIL_USER;

const mailer = (EMAIL_USER && EMAIL_PASS)
  ? nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_PORT === 465,
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
      tls: { rejectUnauthorized: false },
    })
  : null;

const generateOtp = () => crypto.randomInt(100000, 999999).toString();

async function sendStaffOtp(email: string) {
  if (!mailer || !EMAIL_USER) {
    throw new Error(
      'SMTP not configured. Set EMAIL_USER/EMAIL_PASS (or SMTP_USER/SMTP_PASS) plus EMAIL_HOST/EMAIL_PORT.'
    );
  }
  const otp = generateOtp();
  otpStore.set(email.toLowerCase(), { otp, expiresAt: Date.now() + OTP_EXPIRY_MS });

  await mailer.sendMail({
    from: `"Hospital Management System" <${EMAIL_FROM}>`,
    to: email,
    subject: "Your OTP for Staff Registration",
    html: `<p>Hello,</p><p>Your OTP is:</p><h2 style="letter-spacing:4px">${otp}</h2><p>This code expires in 5 minutes.</p>`,
    text: `Your OTP is ${otp}. It expires in 5 minutes.`,
  });
}

function verifyStaffOtp(email: string, otp: string): boolean {
  const key = (email || "").toLowerCase();
  const rec = otpStore.get(key);
  if (!rec) return false;
  if (Date.now() > rec.expiresAt) {
    otpStore.delete(key);
    return false;
  }
  const ok = rec.otp === String(otp || "").trim();
  if (ok) otpStore.delete(key);
  return ok;
}

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function verifyToken(req: VercelRequest): any {
  try {
    const auth = req.headers.authorization;
    if (!auth) return null;
    return jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
  } catch { return null; }
}

// Convert snake_case DB columns to camelCase for frontend (keeps both)
function toCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
}
function tx(row: any): any {
  if (!row || typeof row !== 'object') return row;
  const r: any = {};
  for (const k of Object.keys(row)) {
    r[k] = row[k];
    const c = toCamel(k);
    if (c !== k) r[c] = row[k];
  }
  return r;
}
function txAll(rows: any[]): any[] { return rows.map(tx); }

export default async (req: VercelRequest, res: VercelResponse) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = (req.url || '').replace(/\?.*$/, '');
  const path = url.startsWith('/api') ? url.slice(4) : url;
  const segments = path.split('/').filter(Boolean);
  const method = req.method || 'GET';

  console.log(`⚡ ${method} ${url} -> [${segments.join(', ')}]`);

  try {
    // ========== DASHBOARD STATS ==========
    if (segments[0] === 'dashboard-stats' && method === 'GET') {
      // Helper: safe query that returns default on error
      const sq = async (sql: string, def: any = []) => {
        try { return (await pool.query(sql)).rows; } catch(e: any) { console.warn('Stats query fail:', e.message); return def; }
      };
      const s1 = async (sql: string, field: string, def: any = 0) => {
        try { const r = (await pool.query(sql)).rows; return r[0]?.[field] ?? def; } catch { return def; }
      };

      const totalPatients = parseInt(await s1(`SELECT COUNT(*) as c FROM hms_patients`, 'c', '0'));
      const newPatientsThisMonth = parseInt(await s1(`SELECT COUNT(*) as c FROM hms_patients WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)`, 'c', '0'));
      const totalEncounters = parseInt(await s1(`SELECT COUNT(*) as c FROM hms_encounters`, 'c', '0'));
      const encountersThisMonth = parseInt(await s1(`SELECT COUNT(*) as c FROM hms_encounters WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)`, 'c', '0'));
      const totalAppointments = parseInt(await s1(`SELECT COUNT(*) as c FROM hms_appointments`, 'c', '0'));
      const appointmentsToday = parseInt(await s1(`SELECT COUNT(*) as c FROM hms_appointments WHERE appointment_date::date = CURRENT_DATE`, 'c', '0'));
      const totalRevenue = parseFloat(await s1(`SELECT COALESCE(SUM(amount),0) as s FROM hms_payments`, 's', '0'));
      const revenueThisMonth = parseFloat(await s1(`SELECT COALESCE(SUM(amount),0) as s FROM hms_payments WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)`, 's', '0'));

      // Gender
      let genderBreakdown = { male: 0, female: 0, other: 0 };
      try {
        const gR = await pool.query(`SELECT 
          COALESCE(SUM(CASE WHEN LOWER(gender) IN ('male','m') THEN 1 ELSE 0 END),0) as male,
          COALESCE(SUM(CASE WHEN LOWER(gender) IN ('female','f') THEN 1 ELSE 0 END),0) as female,
          COALESCE(SUM(CASE WHEN LOWER(gender) NOT IN ('male','m','female','f') THEN 1 ELSE 0 END),0) as other
          FROM hms_patients`);
        genderBreakdown = { male: parseInt(gR.rows[0].male), female: parseInt(gR.rows[0].female), other: parseInt(gR.rows[0].other) };
      } catch {}

      // Age groups
      let ageGroups: any[] = [];
      try {
        const ageR = await pool.query(`SELECT 
          CASE 
            WHEN EXTRACT(YEAR FROM AGE(dob)) < 5 THEN '00-04'
            WHEN EXTRACT(YEAR FROM AGE(dob)) < 10 THEN '05-09'
            WHEN EXTRACT(YEAR FROM AGE(dob)) < 15 THEN '10-14'
            WHEN EXTRACT(YEAR FROM AGE(dob)) < 20 THEN '15-19'
            WHEN EXTRACT(YEAR FROM AGE(dob)) < 25 THEN '20-24'
            WHEN EXTRACT(YEAR FROM AGE(dob)) < 30 THEN '25-29'
            WHEN EXTRACT(YEAR FROM AGE(dob)) < 35 THEN '30-34'
            WHEN EXTRACT(YEAR FROM AGE(dob)) < 40 THEN '35-39'
            WHEN EXTRACT(YEAR FROM AGE(dob)) < 45 THEN '40-44'
            WHEN EXTRACT(YEAR FROM AGE(dob)) < 50 THEN '45-49'
            WHEN EXTRACT(YEAR FROM AGE(dob)) < 55 THEN '50-54'
            WHEN EXTRACT(YEAR FROM AGE(dob)) < 60 THEN '55-59'
            WHEN EXTRACT(YEAR FROM AGE(dob)) < 65 THEN '60-64'
            ELSE '65+'
          END as age_group,
          COALESCE(SUM(CASE WHEN LOWER(gender) IN ('male','m') THEN 1 ELSE 0 END),0) as male,
          COALESCE(SUM(CASE WHEN LOWER(gender) IN ('female','f') THEN 1 ELSE 0 END),0) as female
          FROM hms_patients WHERE dob IS NOT NULL GROUP BY age_group ORDER BY age_group`);
        ageGroups = ageR.rows.map((r: any) => ({ label: r.age_group, male: parseInt(r.male), female: parseInt(r.female) }));
      } catch {}

      // Encounter types
      let encountersByType: any[] = [];
      try {
        const etR = await pool.query(`SELECT COALESCE(encounter_type,'Consultation') as type, COUNT(*) as c FROM hms_encounters GROUP BY encounter_type ORDER BY c DESC LIMIT 5`);
        encountersByType = etR.rows.map((r: any) => ({ type: r.type, count: parseInt(r.c) }));
      } catch {}

      // Encounters by hour
      let encountersByHour: any[] = [];
      try {
        const ehR = await pool.query(`SELECT EXTRACT(HOUR FROM created_at)::int as hr, COUNT(*)::int as c FROM hms_encounters GROUP BY hr ORDER BY hr`);
        encountersByHour = ehR.rows.map((r: any) => ({ hour: parseInt(r.hr), count: parseInt(r.c) }));
      } catch {}

      // Monthly trend
      let monthlyTrend: any[] = [];
      try {
        const mtR = await pool.query(`SELECT TO_CHAR(m, 'Mon YYYY') as month,
          (SELECT COUNT(*) FROM hms_encounters WHERE created_at >= m AND created_at < m + interval '1 month') as encounters,
          (SELECT COUNT(*) FROM hms_patients WHERE created_at >= m AND created_at < m + interval '1 month') as patients
          FROM generate_series(DATE_TRUNC('month', CURRENT_DATE) - interval '11 months', DATE_TRUNC('month', CURRENT_DATE), '1 month') as m ORDER BY m`);
        monthlyTrend = mtR.rows.map((r: any) => ({ month: r.month, encounters: parseInt(r.encounters), patients: parseInt(r.patients) }));
      } catch {}

      // Top diagnoses
      let topDiagnoses: any[] = [];
      try {
        const tdR = await pool.query(`SELECT complaint_text as name, COUNT(*) as c FROM hms_complaints GROUP BY complaint_text ORDER BY c DESC LIMIT 10`);
        topDiagnoses = tdR.rows.map((r: any) => ({ name: r.name, count: parseInt(r.c) }));
      } catch {}

      // Top investigations
      let topInvestigations: any[] = [];
      try {
        const tiR = await pool.query(`SELECT test_name as name, COUNT(*) as c FROM hms_investigation_requests GROUP BY test_name ORDER BY c DESC LIMIT 10`);
        topInvestigations = tiR.rows.map((r: any) => ({ name: r.name, count: parseInt(r.c) }));
      } catch {}

      // Top products
      let topProducts: any[] = [];
      try {
        const tpR = await pool.query(`SELECT product_name as name, COALESCE(SUM(quantity),0)::int as qty, COALESCE(SUM(subtotal),0)::numeric as rev FROM hms_pos_sale_items GROUP BY product_name ORDER BY rev DESC LIMIT 10`);
        topProducts = tpR.rows.map((r: any) => ({ name: r.name, qty: parseInt(r.qty), revenue: parseFloat(r.rev) }));
      } catch {}

      // Encounters by provider
      let encountersByProvider: any[] = [];
      try {
        const epR = await pool.query(`SELECT 
          COALESCE(s.first_name || ' ' || s.last_name, 'Unknown') as name,
          COUNT(*) as arrived, 0 as cancelled
          FROM hms_encounters e LEFT JOIN hms_staff s ON e.provider_id = s.id
          GROUP BY s.first_name, s.last_name ORDER BY arrived DESC LIMIT 7`);
        encountersByProvider = epR.rows.map((r: any) => ({ name: r.name || 'Unknown', arrived: parseInt(r.arrived), cancelled: parseInt(r.cancelled) }));
      } catch {}

      // Repeat vs single
      let repeatVsSingle = { repeat: 0, single: 0 };
      try {
        const rsR = await pool.query(`SELECT 
          COALESCE(SUM(CASE WHEN enc_count > 1 THEN 1 ELSE 0 END),0) as "repeat",
          COALESCE(SUM(CASE WHEN enc_count = 1 THEN 1 ELSE 0 END),0) as single
          FROM (SELECT patient_id, COUNT(*) as enc_count FROM hms_encounters GROUP BY patient_id) sub`);
        repeatVsSingle = { repeat: parseInt(rsR.rows[0]?.repeat || 0), single: parseInt(rsR.rows[0]?.single || 0) };
      } catch {}

      // Recent patients
      let recentPatients: any[] = [];
      try {
        const rpR = await pool.query(`SELECT id, first_name, last_name, gender, phone, TO_CHAR(created_at, 'DD Mon YYYY') as date FROM hms_patients ORDER BY created_at DESC LIMIT 10`);
        recentPatients = rpR.rows.map((r: any) => ({ id: r.id, name: `${r.first_name || ''} ${r.last_name || ''}`.trim(), gender: r.gender, phone: r.phone, date: r.date }));
      } catch {}

      return res.json({
        totalPatients, newPatientsThisMonth, totalEncounters, encountersThisMonth,
        totalAppointments, appointmentsToday, totalRevenue, revenueThisMonth,
        genderBreakdown, ageGroups, encountersByType, encountersByHour,
        monthlyTrend, topDiagnoses, topInvestigations, topProducts,
        encountersByProvider, repeatVsSingle, recentPatients
      });
    }

    // ========== AUTH ==========
    if (segments[0] === 'auth-v2') {
      if (segments[1] === 'login' && method === 'POST') {
        const { email, password } = req.body || {};
        if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
        const result = await pool.query(
          `SELECT u.id, u.name, u.email, u.password, u.role,
                  s.id as staff_id, s.active_status, s.first_name, s.last_name, s.job_title
           FROM hms_users u
           LEFT JOIN hms_staff s ON LOWER(s.email) = LOWER(u.email)
           WHERE LOWER(u.email) = LOWER($1)
           LIMIT 1`,
          [email]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
        const user = result.rows[0];
        if (user.staff_id && user.active_status === false) {
          return res.status(403).json({ message: 'Account is inactive. Contact administrator.' });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ message: 'Invalid credentials' });

        const roleRes = await pool.query(
          'SELECT id, role_name FROM hms_user_roles WHERE LOWER(role_name) = LOWER($1) AND is_active = true LIMIT 1',
          [user.role]
        );
        let permissions: any[] = [];
        if (roleRes.rows.length > 0) {
          const roleId = roleRes.rows[0].id;
          const permRes = await pool.query(
            `SELECT p.permission_key, p.permission_name, rp.can_create, rp.can_edit, rp.can_view, rp.can_archive
             FROM hms_role_permissions rp
             JOIN hms_permissions p ON p.id = rp.permission_id
             WHERE rp.role_id = $1`,
            [roleId]
          );
          permissions = permRes.rows;
        }

        const tokenPayload = {
          id: user.id,
          role: user.role,
          name: user.name,
          email: user.email,
          staffId: user.staff_id || null,
          activeStatus: user.staff_id ? user.active_status !== false : true,
        };
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1d' });
        return res.json({
          token,
          user: {
            id: user.id,
            name: user.name || [user.first_name, user.last_name].filter(Boolean).join(' ').trim(),
            email: user.email,
            role: user.role,
            staffId: user.staff_id || null,
            activeStatus: user.staff_id ? user.active_status !== false : true,
            permissions,
          }
        });
      }
      if (segments[1] === 'me' && method === 'GET') {
        const decoded = verifyToken(req);
        if (!decoded) return res.status(401).json({ message: 'Invalid token' });
        const result = await pool.query('SELECT id, name, email, role FROM hms_users WHERE id = $1', [decoded.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
        return res.json({ user: result.rows[0] });
      }
      return res.status(404).json({ message: 'Auth route not found' });
    }

    // ========== M-PESA ==========
    if (segments[0] === 'mpesa') {
      // Ensure hospital-specific mpesa_transactions table exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS hms_mpesa_transactions (
          id SERIAL PRIMARY KEY,
          checkout_request_id VARCHAR UNIQUE,
          merchant_request_id VARCHAR,
          phone_number VARCHAR,
          amount NUMERIC DEFAULT 0,
          account_reference VARCHAR,
          transaction_desc VARCHAR,
          mpesa_receipt_number VARCHAR,
          result_code INTEGER,
          result_desc TEXT,
          status VARCHAR DEFAULT 'Pending',
          inv_id INTEGER,
          invoice_no VARCHAR,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      if (segments[1] === 'register' && method === 'POST') {
        const b = req.body || {};
        const phone = normalizePhone(String(b.phone || ''));
        const amount = Number(b.amount || 0);
        const accountReference = String(b.accountReference || 'HMS_REG').slice(0, 20);
        const transactionDesc = String(b.transactionDesc || 'Patient Registration Fee').slice(0, 30);

        if (!phone || !/^254\d{9}$/.test(phone)) {
          return res.status(400).json({ message: 'Valid Kenyan phone is required (2547XXXXXXXX).' });
        }
        if (!amount || amount < 1) {
          return res.status(400).json({ message: 'Valid amount is required.' });
        }
        if (!MPESA_SHORTCODE || !MPESA_PASSKEY) {
          return res.status(500).json({ message: 'M-Pesa not configured. Set MPESA_SHORTCODE and MPESA_PASSKEY.' });
        }

        const token = await getMpesaAccessToken();
        const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
        const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');

        const stkPayload: Record<string, any> = {
          BusinessShortCode: MPESA_SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          TransactionType: MPESA_TRANSACTION_TYPE,
          Amount: Math.round(amount),
          PartyA: phone,
          PartyB: MPESA_PARTY_B,
          PhoneNumber: phone,
          CallBackURL: MPESA_CALLBACK_URL,
          AccountReference: accountReference,
          TransactionDesc: transactionDesc,
        };

        console.log('[MPESA STK] Sending:', JSON.stringify({
          BusinessShortCode: stkPayload.BusinessShortCode,
          TransactionType: stkPayload.TransactionType,
          Amount: stkPayload.Amount,
          PartyA: stkPayload.PartyA,
          PartyB: stkPayload.PartyB,
          env: MPESA_ENV,
          isTill: MPESA_IS_TILL,
        }));

        const stkResp = await fetch(`${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(stkPayload),
        });
        const stkData = await stkResp.json() as any;
        console.log('[MPESA STK] Response:', JSON.stringify(stkData));

        if (!stkResp.ok || stkData?.errorCode || stkData?.ResponseCode === '1' || stkData?.ResponseCode === '2') {
          const errMsg = stkData?.errorMessage || stkData?.ResponseDescription || stkData?.resultDesc || 'Failed to initiate STK push';
          return res.status(500).json({
            message: errMsg,
            errorCode: stkData?.errorCode || stkData?.ResponseCode,
            requestId: stkData?.CheckoutRequestID || stkData?.MerchantRequestID,
          });
        }

        const checkoutRequestId = String(stkData.CheckoutRequestID || '');
        const merchantRequestId = String(stkData.MerchantRequestID || '');

        if (checkoutRequestId) {
          await pool.query(
            `INSERT INTO hms_mpesa_transactions
             (checkout_request_id, merchant_request_id, phone_number, amount, account_reference, transaction_desc, status, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
             ON CONFLICT (checkout_request_id)
             DO UPDATE SET updated_at=NOW()`,
            [checkoutRequestId, merchantRequestId, phone, amount, accountReference, transactionDesc, 'Pending']
          );
        }

        return res.json({
          message: 'STK push sent successfully',
          checkoutRequestId,
          merchantRequestId,
        });
      }

      if (segments[1] === 'status' && method === 'GET') {
        const checkoutRequestId = String(req.query?.checkoutRequestId || req.query?.checkout_request_id || '');
        if (!checkoutRequestId) return res.status(400).json({ message: 'checkoutRequestId is required' });
        const txr = await pool.query(
          `SELECT * FROM hms_mpesa_transactions WHERE checkout_request_id=$1 ORDER BY created_at DESC LIMIT 1`,
          [checkoutRequestId]
        );
        if (txr.rows.length === 0) return res.status(404).json({ message: 'Transaction not found' });
        const tx = txr.rows[0];
        const rc = tx.result_code; // null when callback hasn't arrived yet
        const status = tx.status || 'Pending';
        const isPending = status === 'Pending' && (rc === null || rc === undefined);
        console.log(`[MPESA STATUS] checkoutRequestId=${checkoutRequestId}, status=${status}, result_code=${rc}, isPending=${isPending}`);
        return res.json({
          status,
          resultCode: rc === null || rc === undefined ? null : Number(rc),
          resultDesc: tx.result_desc || null,
          mpesaReceipt: tx.mpesa_receipt_number || null,
          amount: tx.amount,
          phone: tx.phone_number,
          success: status === 'Completed' || rc === 0,
          isPending,
        });
      }

      if (segments[1] === 'callback' && method === 'POST') {
        const body = req.body || {};
        const callback = body?.Body?.stkCallback;
        if (!callback) return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
        const resultCode = Number(callback.ResultCode ?? -1);
        const resultDesc = String(callback.ResultDesc || '');
        const checkoutRequestId = String(callback.CheckoutRequestID || '');
        const merchantRequestId = String(callback.MerchantRequestID || '');
        const items = callback?.CallbackMetadata?.Item || [];
        const getItem = (name: string) => {
          const m = items.find((i: any) => i?.Name === name);
          return m?.Value;
        };
        const receipt = String(getItem('MpesaReceiptNumber') || '');
        const amount = Number(getItem('Amount') || 0);
        const phone = String(getItem('PhoneNumber') || '');
        const status = resultCode === 0 ? 'Completed'
          : resultCode === 1032 ? 'Cancelled'
          : resultCode === 1001 ? 'Failed'  // Wrong PIN
          : resultCode === 1025 ? 'Failed'  // Insufficient balance
          : resultCode === 1037 ? 'Failed'  // Timeout / DS timeout
          : resultCode === 2001 ? 'Failed'  // Invalid PIN
          : resultCode === 1 ? 'Failed'     // Generic failure
          : 'Failed';

        if (checkoutRequestId) {
          console.log(`[MPESA CALLBACK] checkoutRequestId=${checkoutRequestId}, resultCode=${resultCode}, status=${status}, receipt=${receipt}, amount=${amount}`);
          await pool.query(
            `INSERT INTO hms_mpesa_transactions
             (checkout_request_id, merchant_request_id, phone_number, amount, mpesa_receipt_number, result_code, result_desc, status, created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
             ON CONFLICT (checkout_request_id)
             DO UPDATE SET
               merchant_request_id=EXCLUDED.merchant_request_id,
               phone_number=COALESCE(EXCLUDED.phone_number, hms_mpesa_transactions.phone_number),
               amount=CASE WHEN EXCLUDED.amount > 0 THEN EXCLUDED.amount ELSE hms_mpesa_transactions.amount END,
               mpesa_receipt_number=COALESCE(EXCLUDED.mpesa_receipt_number, hms_mpesa_transactions.mpesa_receipt_number),
               result_code=EXCLUDED.result_code,
               result_desc=EXCLUDED.result_desc,
               status=EXCLUDED.status,
               updated_at=NOW()`,
            [checkoutRequestId, merchantRequestId, phone, amount, receipt || null, resultCode, resultDesc, status]
          );
        }

        return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
      }
    }

    // ========== PAYMENTS ==========
    if (segments[0] === 'payments') {
      // Ensure settings table exists for registration fee
      await pool.query(`
        CREATE TABLE IF NOT EXISTS hms_settings (
          id SERIAL PRIMARY KEY,
          key VARCHAR UNIQUE NOT NULL,
          value TEXT,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);

      // GET /payments/registration-fee
      if (segments[1] === 'registration-fee' && method === 'GET') {
        const r = await pool.query(`SELECT value FROM hms_settings WHERE key = 'registration_fee'`);
        const fee = r.rows.length > 0 ? Number(r.rows[0].value) : 300;
        return res.json({ fee });
      }

      // PUT /payments/registration-fee
      if (segments[1] === 'registration-fee' && method === 'PUT') {
        const b = req.body || {};
        const fee = Number(b.fee);
        if (!fee || fee < 1) return res.status(400).json({ message: 'Valid fee amount required' });
        await pool.query(
          `INSERT INTO hms_settings (key, value, updated_at) VALUES ('registration_fee', $1, NOW())
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
          [String(fee)]
        );
        return res.json({ fee, message: 'Registration fee updated' });
      }

      // GET /payments - list all payments with patient info
      if (method === 'GET' && segments.length <= 1) {
        const dateFrom = req.query?.dateFrom as string || '';
        const dateTo = req.query?.dateTo as string || '';
        const search = (req.query?.search as string || '').trim();

        let whereClauses: string[] = [];
        let params: any[] = [];
        let paramIdx = 1;

        if (dateFrom) {
          whereClauses.push(`mt.created_at >= $${paramIdx++}`);
          params.push(`${dateFrom}T00:00:00`);
        }
        if (dateTo) {
          whereClauses.push(`mt.created_at <= $${paramIdx++}`);
          params.push(`${dateTo}T23:59:59`);
        }
        if (search) {
          whereClauses.push(`(p.first_name ILIKE $${paramIdx} OR p.last_name ILIKE $${paramIdx} OR p.phone ILIKE $${paramIdx} OR CONCAT(p.first_name,' ',p.last_name) ILIKE $${paramIdx} OR mt.phone_number ILIKE $${paramIdx} OR mt.mpesa_receipt_number ILIKE $${paramIdx})`);
          params.push(`%${search}%`);
          paramIdx++;
        }

        const where = whereClauses.length > 0 ? 'AND ' + whereClauses.join(' AND ') : '';

        const r = await pool.query(
          `SELECT mt.*, p.first_name as patient_first_name, p.last_name as patient_last_name, p.phone as patient_phone, p.id as patient_id
           FROM hms_mpesa_transactions mt
           LEFT JOIN hms_patients p ON mt.phone_number = p.phone OR mt.account_reference = p.patient_number
           WHERE mt.status IS NOT NULL ${where}
           ORDER BY mt.created_at DESC`,
          params
        );

        // Get summary stats
        const today = new Date().toISOString().slice(0, 10);
        const stats = await pool.query(`
          SELECT
            COUNT(*) FILTER (WHERE mt.status = 'Completed' AND mt.created_at::date = $1) as paid_today,
            COUNT(*) FILTER (WHERE mt.status = 'Completed') as total_payments,
            COALESCE(SUM(mt.amount) FILTER (WHERE mt.status = 'Completed' AND mt.created_at::date = $1), 0) as amount_today,
            COALESCE(SUM(mt.amount) FILTER (WHERE mt.status = 'Completed'), 0) as total_amount,
            COUNT(*) FILTER (WHERE mt.status = 'Failed') as failed_payments,
            COUNT(*) FILTER (WHERE mt.status = 'Cancelled') as cancelled_payments
          FROM hms_mpesa_transactions mt
        `, [today]);

        // New patients today
        const newPatientsToday = await pool.query(`SELECT COUNT(*) as count FROM hms_patients WHERE created_at::date = $1`, [today]);
        // Total patients
        const totalPatients = await pool.query(`SELECT COUNT(*) as count FROM hms_patients`);
        // Renewals (patients with registration > 1 year old who made a new payment)
        const renewals = await pool.query(`
          SELECT COUNT(DISTINCT p.id) as count
          FROM hms_patients p
          JOIN hms_mpesa_transactions mt ON mt.phone_number = p.phone AND mt.status = 'Completed'
          WHERE p.created_at < NOW() - INTERVAL '1 year' AND mt.created_at::date = $1
        `, [today]);

        // New user amounts vs renewal amounts
        const newVsRenewal = await pool.query(`
          SELECT
            COALESCE(SUM(mt.amount), 0) FILTER (WHERE p.created_at::date = mt.created_at::date) as new_user_amount,
            COALESCE(SUM(mt.amount), 0) FILTER (WHERE p.created_at::date != mt.created_at::date) as renewal_amount
          FROM hms_mpesa_transactions mt
          JOIN hms_patients p ON mt.phone_number = p.phone
          WHERE mt.status = 'Completed' AND mt.created_at::date = $1
        `, [today]);

        // Daily payment trend for charts (last 14 days)
        const dailyTrend = await pool.query(`
          SELECT DATE(mt.created_at) as date, COUNT(*) as count, COALESCE(SUM(mt.amount), 0) as total
          FROM hms_mpesa_transactions mt
          WHERE mt.status = 'Completed' AND mt.created_at >= NOW() - INTERVAL '14 days'
          GROUP BY DATE(mt.created_at) ORDER BY DATE(mt.created_at)
        `);

        return res.json({
          payments: txAll(r.rows),
          stats: {
            paidToday: Number(stats.rows[0]?.paid_today || 0),
            totalPayments: Number(stats.rows[0]?.total_payments || 0),
            amountToday: Number(stats.rows[0]?.amount_today || 0),
            totalAmount: Number(stats.rows[0]?.total_amount || 0),
            failedPayments: Number(stats.rows[0]?.failed_payments || 0),
            cancelledPayments: Number(stats.rows[0]?.cancelled_payments || 0),
            newPatientsToday: Number(newPatientsToday.rows[0]?.count || 0),
            totalPatients: Number(totalPatients.rows[0]?.count || 0),
            renewalsToday: Number(renewals.rows[0]?.count || 0),
            newUsersAmountToday: Number(newVsRenewal.rows[0]?.new_user_amount || 0),
            renewalAmountToday: Number(newVsRenewal.rows[0]?.renewal_amount || 0),
          },
          dailyTrend: txAll(dailyTrend.rows),
        });
      }

      return res.status(404).json({ message: 'Payment route not found' });
    }

    // ========== PATIENTS ==========
    if (segments[0] === 'patients') {
      if (segments[1] === 'count' && method === 'GET') {
        const r = await pool.query('SELECT COUNT(*) as total FROM hms_patients');
        return res.json({ total: parseInt(r.rows[0].total) });
      }
      // Patient search
      if (segments[1] === 'search' && method === 'GET') {
        const q = (req.query?.q as string || '').trim();
        if (!q) return res.json([]);
        const r = await pool.query(
          `SELECT * FROM hms_patients WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR phone ILIKE $1 OR CONCAT(first_name,' ',last_name) ILIKE $1 ORDER BY first_name LIMIT 20`,
          [`%${q}%`]
        );
        return res.json(txAll(r.rows));
      }
      if (segments.length === 3 && segments[2] === 'tags') {
        if (method === 'GET') return res.json([]);
        if (method === 'POST') return res.json({ message: 'Tag added' });
        if (method === 'DELETE') return res.json({ message: 'Tag removed' });
      }
      if (segments.length === 3 && segments[2] === 'consents') {
        if (method === 'GET') return res.json([]);
        if (method === 'POST') return res.json({ message: 'Consent saved' });
      }
      if (segments.length === 3 && segments[2] === 'send-consent-otp') {
        return res.json({ message: 'OTP sent' });
      }
      if (segments.length === 3 && segments[2] === 'verify-consent-otp') {
        return res.json({ message: 'OTP verified' });
      }
      if (segments.length === 3 && segments[2] === 'encounters' && method === 'POST') {
        const patientId = segments[1];
        const b = req.body || {};
        const encNum = `ENC-${Date.now()}-${Math.floor(Math.random()*1000)}`;
        const r = await pool.query(
          `INSERT INTO hms_encounters (encounter_number, encounter_type, priority_type, notes, patient_id, provider_id, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW()) RETURNING *`,
          [encNum, b.encounter_type || 'Outpatient', b.priority_type || 'Normal', b.notes, patientId, b.provider_id]
        );
        return res.status(201).json(tx(r.rows[0]));
      }
      if (segments.length === 2 && method === 'DELETE') {
        await pool.query('DELETE FROM hms_patients WHERE id = $1', [segments[1]]);
        return res.json({ message: 'Patient deleted' });
      }
      if (segments.length === 2 && method === 'PUT') {
        const id = segments[1];
        const b = req.body || {};
        const r = await pool.query(
          `UPDATE hms_patients SET first_name=COALESCE($1,first_name), last_name=COALESCE($2,last_name),
           middle_name=COALESCE($3,middle_name), gender=COALESCE($4,gender), dob=COALESCE($5,dob),
           phone=COALESCE($6,phone), email=COALESCE($7,email), occupation=COALESCE($8,occupation),
           county=COALESCE($9,county), sub_county=COALESCE($10,sub_county),
           area_of_residence=COALESCE($11,area_of_residence), updated_at=NOW()
           WHERE id=$12 RETURNING *`,
          [b.firstName||b.first_name, b.lastName||b.last_name, b.middleName||b.middle_name,
           b.gender, b.dob, b.phone, b.email, b.occupation,
           b.county, b.subCounty||b.sub_county, b.areaOfResidence||b.area_of_residence, id]
        );
        return res.json(tx(r.rows[0]));
      }
      // GET /patients/:id (single patient)
      if (segments.length === 2 && method === 'GET') {
        const r = await pool.query('SELECT * FROM hms_patients WHERE id = $1', [segments[1]]);
        if (r.rows.length === 0) return res.status(404).json({ message: 'Patient not found' });
        return res.json(tx(r.rows[0]));
      }
      // GET /patients or POST /patients
      if (segments.length <= 1) {
        if (method === 'GET') {
          const r = await pool.query('SELECT * FROM hms_patients ORDER BY created_at DESC');
          return res.json(txAll(r.rows));
        }
        if (method === 'POST') {
          const b = req.body || {};
          const registrationPayment = b.registrationPayment || b.registration_payment;
          if (!registrationPayment?.checkoutRequestId) {
            return res.status(400).json({ message: 'Registration payment is required before saving patient.' });
          }
          const paymentTx = await pool.query(
            `SELECT * FROM hms_mpesa_transactions WHERE checkout_request_id=$1 ORDER BY updated_at DESC LIMIT 1`,
            [registrationPayment.checkoutRequestId]
          );
          if (paymentTx.rows.length === 0) {
            return res.status(400).json({ message: 'M-Pesa transaction not found. Complete payment first.' });
          }
          const tx = paymentTx.rows[0];
          const isPaid = tx.status === 'Completed' || Number(tx.result_code) === 0;
          if (!isPaid) {
            return res.status(400).json({ message: 'M-Pesa payment not completed yet.' });
          }
          // Get dynamic registration fee
          const feeRes = await pool.query(`SELECT value FROM hms_settings WHERE key = 'registration_fee'`);
          const registrationFee = feeRes.rows.length > 0 ? Number(feeRes.rows[0].value) : 300;
          if (Number(tx.amount || 0) < registrationFee) {
            return res.status(400).json({ message: `Registration fee must be at least KSh ${registrationFee} via M-Pesa.` });
          }

          const client = await pool.connect();
          try {
            await client.query('BEGIN');
            const gender = String((b.gender || '').toLowerCase());
            const normalizedGender = gender.startsWith('m') ? 'Male' : gender.startsWith('f') ? 'Female' : 'Other';
            const heard = b.heardAboutFacility || b.heard_about_facility || null;
            const patientNumber = b.patientNumber || b.patient_number || null;
            const shaNumber = b.shaNumber || b.sha_number || null;

            const r = await client.query(
              `INSERT INTO hms_patients (first_name, last_name, middle_name, gender, dob, phone, email, occupation,
               patient_status, heard_about_facility, patient_number, sha_number, county, sub_county, area_of_residence,
               next_of_kin_first_name, next_of_kin_last_name, next_of_kin_phone, created_at, updated_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW(),NOW()) RETURNING *`,
              [b.firstName||b.first_name, b.lastName||b.last_name, b.middleName||b.middle_name,
               normalizedGender, b.dob, b.phone, b.email, b.occupation,
               b.patientStatus||b.patient_status||'Alive', heard,
               patientNumber, shaNumber,
               b.county, b.subCounty||b.sub_county, b.areaOfResidence||b.area_of_residence,
               b.nextOfKinFirstName||b.next_of_kin_first_name, b.nextOfKinLastName||b.next_of_kin_last_name,
               b.nextOfKinPhone||b.next_of_kin_phone]
            );

            const patient = r.rows[0];
            const invoiceNumber = `REG-${patient.id}-${Date.now().toString().slice(-6)}`;

            // Ensure enum types have the values we need (safe to run multiple times)
            try { await pool.query(`ALTER TYPE enum_hms_payments_method ADD VALUE IF NOT EXISTS 'mpesa'`); } catch(e: any) { console.log('[ENUM] payments_method mpesa:', e.message); }
            try { await pool.query(`ALTER TYPE enum_hms_invoices_status ADD VALUE IF NOT EXISTS 'paid'`); } catch(e: any) { console.log('[ENUM] invoices_status paid:', e.message); }

            const inv = await client.query(
              `INSERT INTO hms_invoices (patient_id, invoice_number, amount, status, created_at, updated_at)
               VALUES ($1,$2,$3,$4,NOW(),NOW()) RETURNING *`,
              [patient.id, invoiceNumber, registrationFee, 'paid']
            );
            await client.query(
              `INSERT INTO hms_payments (invoice_id, amount, method, transaction_code, created_at, updated_at)
               VALUES ($1,$2,$3,$4,NOW(),NOW())`,
              [inv.rows[0].id, registrationFee, 'mpesa', tx.mpesa_receipt_number || tx.checkout_request_id]
            );
            await client.query(
              `UPDATE hms_mpesa_transactions
               SET inv_id=$1, invoice_no=$2, updated_at=NOW()
               WHERE checkout_request_id=$3`,
              [inv.rows[0].id, invoiceNumber, registrationPayment.checkoutRequestId]
            );
            await client.query('COMMIT');
            return res.status(201).json(tx(patient));
          } catch (err: any) {
            await client.query('ROLLBACK');
            return res.status(500).json({ message: err.message || 'Failed to create patient' });
          } finally {
            client.release();
          }
        }
      }
      return res.status(404).json({ message: 'Patient route not found' });
    }

    // ========== ENCOUNTERS ==========
    if (segments[0] === 'encounters') {
      if (segments.length === 3 && segments[2] === 'close' && method === 'PATCH') {
        await pool.query(`UPDATE hms_encounters SET updated_at=NOW() WHERE id=$1`, [segments[1]]);
        return res.json({ message: 'Encounter closed' });
      }
      if (method === 'GET') {
        const r = await pool.query(`
          SELECT e.*, p.first_name as patient_first, p.last_name as patient_last, p.gender as patient_gender, p.dob as patient_dob,
                 s.first_name as provider_first, s.last_name as provider_last, s.title as provider_title
          FROM hms_encounters e
          LEFT JOIN hms_patients p ON e.patient_id = p.id
          LEFT JOIN hms_staff s ON e.provider_id = s.id
          ORDER BY e.created_at DESC
        `);
        return res.json(txAll(r.rows));
      }
      if (method === 'POST') {
        const b = req.body || {};
        const encNum = b.encounter_number || `ENC-${Date.now()}-${Math.floor(Math.random()*1000)}`;
        const r = await pool.query(
          `INSERT INTO hms_encounters (encounter_number, encounter_type, priority_type, notes, patient_id, provider_id, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW()) RETURNING *`,
          [encNum, b.encounter_type, b.priority_type, b.notes, b.patient_id, b.provider_id]
        );
        return res.status(201).json(tx(r.rows[0]));
      }
      return res.status(404).json({ message: 'Encounter route not found' });
    }

    // ========== APPOINTMENTS ==========
    if (segments[0] === 'appointments') {
      if (segments.length === 2 && method === 'PATCH') {
        const b = req.body || {};
        const r = await pool.query(
          `UPDATE hms_appointments SET status=COALESCE($1,status), updated_at=NOW() WHERE id=$2 RETURNING *`,
          [b.status, segments[1]]
        );
        return res.json(tx(r.rows[0]));
      }
      if (method === 'GET') {
        const r = await pool.query(`
          SELECT a.*, p.first_name, p.last_name, u.name as doctor_name
          FROM hms_appointments a
          LEFT JOIN hms_patients p ON a.patient_id = p.id
          LEFT JOIN hms_users u ON a.doctor_id = u.id
          ORDER BY a.appointment_date DESC, a.appointment_time DESC
        `);
        return res.json(txAll(r.rows));
      }
      if (method === 'POST') {
        const b = req.body || {};
        const r = await pool.query(
          `INSERT INTO hms_appointments (patient_id, doctor_id, appointment_date, appointment_time, reason, status, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW()) RETURNING *`,
          [b.patient_id, b.doctor_id, b.appointment_date, b.appointment_time, b.reason, b.status || 'Scheduled']
        );
        return res.status(201).json(tx(r.rows[0]));
      }
      return res.status(404).json({ message: 'Appointment route not found' });
    }

    // ========== STAFF ==========
    if (segments[0] === 'staff') {
      if (segments.length === 2 && segments[1] === 'request-otp' && method === 'POST') {
        const email = String((req.body || {}).email || '').trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Invalid email format.' });
        const exists = await pool.query('SELECT id FROM hms_users WHERE LOWER(email) = LOWER($1) LIMIT 1', [email]);
        if (exists.rows.length > 0) return res.status(409).json({ message: 'This email is already registered.' });
        try {
          await sendStaffOtp(email);
        } catch (e: any) {
          return res.status(500).json({
            message: `Failed to request OTP: ${e?.message || 'SMTP settings are not configured correctly.'}`
          });
        }
        return res.json({ message: 'OTP sent to your email.' });
      }
      if (segments.length === 2 && segments[1] === 'resend-otp' && method === 'POST') {
        const email = String((req.body || {}).email || '').trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Invalid email format.' });
        const exists = await pool.query('SELECT id FROM hms_users WHERE LOWER(email) = LOWER($1) LIMIT 1', [email]);
        if (exists.rows.length > 0) return res.status(409).json({ message: 'This email is already registered.' });
        try {
          await sendStaffOtp(email);
        } catch (e: any) {
          return res.status(500).json({
            message: `Failed to resend OTP: ${e?.message || 'SMTP settings are not configured correctly.'}`
          });
        }
        return res.json({ message: 'OTP resent to your email.' });
      }
      if (segments.length === 3 && segments[2] === 'active' && method === 'PATCH') {
        const b = req.body || {};
        await pool.query('UPDATE hms_staff SET active_status=$1, updated_at=NOW() WHERE id=$2', [b.is_active, segments[1]]);
        return res.json({ message: 'Staff status updated' });
      }
      if (segments.length === 2 && method === 'DELETE') {
        await pool.query('DELETE FROM hms_staff WHERE id = $1', [segments[1]]);
        return res.json({ message: 'Staff deleted' });
      }
      if (segments.length === 2 && method === 'PUT') {
        const b = req.body || {};
        const r = await pool.query(
          `UPDATE hms_staff SET title=COALESCE($1,title), first_name=COALESCE($2,first_name),
           last_name=COALESCE($3,last_name), gender=COALESCE($4,gender), email=COALESCE($5,email),
           phone=COALESCE($6,phone), address=COALESCE($7,address), role=COALESCE($8,role),
           job_title=COALESCE($9,job_title), updated_at=NOW() WHERE id=$10 RETURNING *`,
          [b.title, b.first_name||b.firstName, b.last_name||b.lastName, b.gender, b.email, b.phone, b.address, b.role, b.job_title||b.jobTitle, segments[1]]
        );
        const updated = tx(r.rows[0]);
        if (updated?.email) {
          await pool.query(
            `UPDATE hms_users
             SET name = COALESCE($1, name),
                 email = COALESCE($2, email),
                 role = COALESCE($3, role),
                 updated_at = NOW()
             WHERE LOWER(email) = LOWER($4)`,
            [
              `${updated.firstName || ''} ${updated.lastName || ''}`.trim(),
              updated.email,
              updated.role,
              updated.email
            ]
          );
        }
        return res.json(updated);
      }
      if (method === 'GET') {
        const r = await pool.query('SELECT * FROM hms_staff ORDER BY created_at DESC');
        return res.json(txAll(r.rows));
      }
      if (method === 'POST') {
        const b = req.body || {};
        const email = String(b.email || '').trim().toLowerCase();
        const otp = String(b.otp || '').trim();
        if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required.' });
        if (!verifyStaffOtp(email, otp)) return res.status(401).json({ message: 'Invalid or expired OTP.' });
        const existingUser = await pool.query('SELECT id FROM hms_users WHERE LOWER(email)=LOWER($1) LIMIT 1', [email]);
        if (existingUser.rows.length > 0) return res.status(409).json({ message: 'This email is already registered.' });

        const hashed = await bcrypt.hash(b.password || '1234', 10);
        const r = await pool.query(
          `INSERT INTO hms_staff (title, first_name, last_name, gender, email, phone, address, role, job_title, username, password, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW(),NOW()) RETURNING *`,
          [b.title, b.first_name||b.firstName, b.last_name||b.lastName, b.gender, email, b.phone, b.address, b.role, b.job_title||b.jobTitle, b.username || email, hashed]
        );
        const created = tx(r.rows[0]);
        await pool.query(
          `INSERT INTO hms_users (name, email, password, role, created_at, updated_at)
           VALUES ($1,$2,$3,$4,NOW(),NOW())`,
          [`${created.firstName || ''} ${created.lastName || ''}`.trim(), email, hashed, created.role || 'Staff']
        );
        return res.status(201).json(created);
      }
      return res.status(404).json({ message: 'Staff route not found' });
    }

    // ========== TRIAGE ==========
    if (segments[0] === 'triage') {
      if (method === 'GET') {
        const r = await pool.query(`
          SELECT t.*, p.first_name, p.last_name, p.gender, p.dob, p.phone
          FROM hms_triages t
          LEFT JOIN hms_patients p ON t.patient_id = p.id
          ORDER BY t.created_at DESC
        `);
        return res.json(txAll(r.rows));
      }
      if (method === 'POST') {
        const b = req.body || {};
        const r = await pool.query(
          `INSERT INTO hms_triages (patient_id, patient_status, temperature, heart_rate, blood_pressure,
           respiratory_rate, blood_oxygenation, weight, height, muac, lmp_date, comments, date, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW(),NOW()) RETURNING *`,
          [b.patient_id||b.patientId, b.patient_status||b.patientStatus, b.temperature, b.heart_rate||b.heartRate,
           b.blood_pressure||b.bloodPressure, b.respiratory_rate||b.respiratoryRate,
           b.blood_oxygenation||b.bloodOxygenation, b.weight, b.height, b.muac, b.lmp_date||b.lmpDate, b.comments]
        );
        return res.status(201).json(tx(r.rows[0]));
      }
    }

    // ========== ORGANISATION SETTINGS ==========
    if (segments[0] === 'organisation-settings') {
      if (segments[1] === 'discard' && method === 'DELETE') {
        return res.json({ message: 'Settings discarded' });
      }
      if (segments[1] === 'save' && method === 'POST') {
        const b = req.body || {};
        const existing = await pool.query('SELECT id FROM hms_organisation_settings LIMIT 1');
        if (existing.rows.length > 0) {
          const r = await pool.query(
            `UPDATE hms_organisation_settings SET organisation_name=COALESCE($1,organisation_name),
             email=COALESCE($2,email), phone=COALESCE($3,phone), address=COALESCE($4,address),
             country=COALESCE($5,country), city=COALESCE($6,city), town=COALESCE($7,town),
             county=COALESCE($8,county), sub_county=COALESCE($9,sub_county), ward=COALESCE($10,ward),
             "updatedAt"=NOW() WHERE id=$11 RETURNING *`,
            [b.organisation_name||b.organisationName, b.email, b.phone, b.address, b.country, b.city, b.town,
             b.county, b.sub_county||b.subCounty, b.ward, existing.rows[0].id]
          );
          return res.json(tx(r.rows[0]));
        } else {
          const r = await pool.query(
            `INSERT INTO hms_organisation_settings (organisation_name, email, phone, address, country, city, town, county, sub_county, ward, "createdAt", "updatedAt")
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW()) RETURNING *`,
            [b.organisation_name||b.organisationName, b.email, b.phone, b.address, b.country, b.city, b.town,
             b.county, b.sub_county||b.subCounty, b.ward]
          );
          return res.status(201).json(tx(r.rows[0]));
        }
      }
      if (method === 'GET') {
        const r = await pool.query('SELECT * FROM hms_organisation_settings LIMIT 1');
        return res.json(r.rows.length > 0 ? tx(r.rows[0]) : null);
      }
    }

    // ========== ORGANIZATION ==========
    if (segments[0] === 'organization') {
      if (segments[1] === 'settings') {
        if (method === 'GET') {
          const r = await pool.query('SELECT * FROM hms_organisation_settings LIMIT 1');
          return res.json(r.rows.length > 0 ? tx(r.rows[0]) : {});
        }
        if (method === 'PUT') {
          const b = req.body || {};
          const existing = await pool.query('SELECT id FROM hms_organisation_settings LIMIT 1');
          if (existing.rows.length > 0) {
            const r = await pool.query(
              `UPDATE hms_organisation_settings SET organisation_name=COALESCE($1,organisation_name),
               email=COALESCE($2,email), phone=COALESCE($3,phone), address=COALESCE($4,address),
               "updatedAt"=NOW() WHERE id=$5 RETURNING *`,
              [b.organisation_name||b.organisationName, b.email, b.phone, b.address, existing.rows[0].id]
            );
            return res.json(tx(r.rows[0]));
          }
          return res.json({});
        }
      }
      if (segments[1] === 'payment-methods') {
        if (segments.length === 3 && method === 'DELETE') {
          await pool.query('DELETE FROM hms_payment_methods WHERE id = $1', [segments[2]]);
          return res.json({ message: 'Payment method deleted' });
        }
        if (method === 'GET') {
          const r = await pool.query('SELECT * FROM hms_payment_methods ORDER BY id');
          return res.json(txAll(r.rows));
        }
        if (method === 'POST') {
          const b = req.body || {};
          const r = await pool.query(
            `INSERT INTO hms_payment_methods (name, active_on_pos, transaction_code, enabled, "createdAt", "updatedAt")
             VALUES ($1,$2,$3,$4,NOW(),NOW()) RETURNING *`,
            [b.name, b.active_on_pos || false, b.transaction_code || false, b.enabled !== false]
          );
          return res.status(201).json(tx(r.rows[0]));
        }
      }
      if (segments[1] === 'roles') {
        // GET /organization/roles/:id/permissions
        if (segments.length >= 4 && segments[3] === 'permissions' && method === 'GET') {
          const roleId = segments[2];
          const r = await pool.query(
            `SELECT rp.id, rp.role_id, rp.permission_id, rp.can_create, rp.can_edit, rp.can_view, rp.can_archive,
                    p.permission_name, p.permission_key, p.category, p.has_create, p.has_edit, p.has_view, p.has_archive, p.sort_order
             FROM hms_role_permissions rp
             JOIN hms_permissions p ON rp.permission_id = p.id
             WHERE rp.role_id = $1
             ORDER BY p.sort_order, p.permission_name`,
            [roleId]
          );
          return res.json(txAll(r.rows));
        }
        // POST /organization/roles/:id/permissions - save permissions
        if (segments.length >= 4 && segments[3] === 'permissions' && method === 'POST') {
          const roleId = segments[2];
          const permissions = req.body?.permissions || [];
          for (const perm of permissions) {
            await pool.query(
              `UPDATE hms_role_permissions SET can_create=$1, can_edit=$2, can_view=$3, can_archive=$4, "updated_at"=NOW()
               WHERE role_id=$5 AND permission_id=$6`,
              [perm.can_create || false, perm.can_edit || false, perm.can_view || false, perm.can_archive || false, roleId, perm.permission_id]
            );
          }
          return res.json({ message: 'Permissions updated successfully' });
        }
        // GET /organization/roles - list all roles
        if (method === 'GET') {
          const r = await pool.query('SELECT * FROM hms_user_roles ORDER BY id');
          return res.json(txAll(r.rows));
        }
      }
    }

    // ========== STOCK ==========
    if (segments[0] === 'stock') {
      if (method === 'GET') {
        const r = await pool.query('SELECT * FROM hms_stock ORDER BY created_at DESC');
        return res.json(txAll(r.rows));
      }
    }

    // ========== INVOICES ==========
    if (segments[0] === 'invoices') {
      if (method === 'GET') {
        const r = await pool.query(`
          SELECT i.*, p.first_name, p.last_name FROM hms_invoices i
          LEFT JOIN hms_patients p ON i.patient_id = p.id ORDER BY i.created_at DESC
        `);
        return res.json(txAll(r.rows));
      }
    }

    // ========== TAGS ==========
    if (segments[0] === 'tags') {
      if (method === 'POST') {
        return res.json({ id: Date.now(), name: req.body?.name || 'Tag' });
      }
      return res.json([]);
    }
    if (segments[0] === 'tag-categories') return res.json([]);

    // ========== POS ==========
    if (segments[0] === 'pos') {
      if (segments[1] === 'sales' && method === 'GET') {
        const r = await pool.query('SELECT * FROM hms_pos_sales ORDER BY created_at DESC');
        return res.json(txAll(r.rows));
      }
      if (segments[1] === 'products' && method === 'GET') {
        const r = await pool.query('SELECT * FROM hms_products ORDER BY created_at DESC');
        return res.json(txAll(r.rows));
      }
    }

    // ========== PRODUCTS ==========
    if (segments[0] === 'products') {
      if (method === 'GET') {
        const r = await pool.query('SELECT * FROM hms_products ORDER BY created_at DESC');
        return res.json(txAll(r.rows));
      }
    }

    // ========== APPOINTMENT TYPES ==========
    if (segments[0] === 'appointment-types') {
      if (method === 'GET') {
        const r = await pool.query('SELECT * FROM hms_appointment_types WHERE is_active = true ORDER BY sort_order');
        return res.json(txAll(r.rows));
      }
    }

    // ========== USER ROLES ==========
    if (segments[0] === 'user-roles' || segments[0] === 'roles') {
      if (method === 'GET') {
        const r = await pool.query('SELECT * FROM hms_user_roles ORDER BY id');
        return res.json(txAll(r.rows));
      }
    }

    // ========== PERMISSIONS ==========
    if (segments[0] === 'permissions') {
      if (method === 'GET') {
        const r = await pool.query('SELECT * FROM hms_permissions ORDER BY sort_order');
        return res.json(txAll(r.rows));
      }
    }

    // ========== COMPLAINTS ==========
    if (segments[0] === 'complaints') {
      if (method === 'GET') {
        const r = await pool.query('SELECT * FROM hms_complaints ORDER BY created_at DESC');
        return res.json(txAll(r.rows));
      }
    }

    // ========== INVESTIGATIONS ==========
    if (segments[0] === 'investigations' || segments[0] === 'investigation-requests') {
      if (method === 'GET') {
        const r = await pool.query('SELECT * FROM hms_investigation_requests ORDER BY created_at DESC');
        return res.json(txAll(r.rows));
      }
    }
    if (segments[0] === 'investigation-tests') {
      if (method === 'GET') {
        const r = await pool.query('SELECT * FROM hms_investigation_tests ORDER BY name');
        return res.json(txAll(r.rows));
      }
    }

    // ========== ORGANISATION SETTINGS ==========
    if (segments[0] === 'organisation-settings') {
      // GET /organisation-settings
      if (segments.length === 1 && method === 'GET') {
        const r = await pool.query('SELECT * FROM hms_organisation_settings ORDER BY id LIMIT 1');
        if (r.rows.length > 0) return res.json(tx(r.rows[0]));
        return res.json({});
      }
      // POST /organisation-settings/save
      if (segments[1] === 'save' && method === 'POST') {
        const b = req.body || {};
        // Check if record exists
        const existing = await pool.query('SELECT id FROM hms_organisation_settings LIMIT 1');
        if (existing.rows.length > 0) {
          // Build dynamic update - only update logo_url if provided
          let query = `UPDATE hms_organisation_settings SET 
              organisation_name=$1, country=$2, city=$3, town=$4, phone=$5, address=$6, email=$7, 
              payment_method_id=$8, county=$9, sub_county=$10, ward=$11, "updatedAt"=NOW()`;
          const params: any[] = [b.organisation_name||'', b.country||'', b.city||'', b.town||'', b.phone||'', b.address||'', b.email||'',
             b.payment_method_id||null, b.county||'', b.sub_county||'', b.ward||''];
          if (b.logo_url) {
            query += `, logo_url=$${params.length + 1}`;
            params.push(b.logo_url);
          }
          query += ` WHERE id=$${params.length + 1}`;
          params.push(existing.rows[0].id);
          await pool.query(query, params);
        } else {
          await pool.query(
            `INSERT INTO hms_organisation_settings (organisation_name, country, city, town, phone, address, email, payment_method_id, county, sub_county, ward, logo_url, "createdAt", "updatedAt")
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW())`,
            [b.organisation_name||'', b.country||'', b.city||'', b.town||'', b.phone||'', b.address||'', b.email||'',
             b.payment_method_id||null, b.county||'', b.sub_county||'', b.ward||'', b.logo_url||'']
          );
        }
        return res.json({ message: 'Organisation settings saved' });
      }
      // DELETE /organisation-settings/discard
      if (segments[1] === 'discard' && method === 'DELETE') {
        return res.json({ message: 'Discarded' });
      }
    }

    // ========== ORGANIZATION (payment methods, roles, permissions) ==========
    if (segments[0] === 'organization') {
      // Payment Methods
      if (segments[1] === 'payment-methods') {
        if (method === 'GET' && segments.length === 2) {
          const r = await pool.query('SELECT * FROM hms_payment_methods ORDER BY id');
          return res.json(txAll(r.rows));
        }
        if (method === 'POST' && segments.length === 2) {
          const b = req.body || {};
          await pool.query(
            `INSERT INTO hms_payment_methods (name, active_on_pos, transaction_code, enabled, "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,NOW(),NOW())`,
            [b.name, b.active_on_pos ? true : false, b.transaction_code ? true : false, b.enabled ? true : false]
          );
          return res.json({ message: 'Payment method added' });
        }
        if (method === 'PUT' && segments.length === 3) {
          const id = segments[2];
          const b = req.body || {};
          await pool.query(
            `UPDATE hms_payment_methods SET name=$1, active_on_pos=$2, transaction_code=$3, "updatedAt"=NOW() WHERE id=$4`,
            [b.name, b.active_on_pos ? true : false, b.transaction_code ? true : false, id]
          );
          return res.json({ message: 'Payment method updated' });
        }
        if (method === 'DELETE' && segments.length === 3) {
          const id = segments[2];
          await pool.query('DELETE FROM hms_payment_methods WHERE id=$1', [id]);
          return res.json({ message: 'Payment method deleted' });
        }
      }

      // Roles
      if (segments[1] === 'roles') {
        if (method === 'GET' && segments.length === 2) {
          const r = await pool.query('SELECT * FROM hms_user_roles ORDER BY id');
          return res.json(txAll(r.rows));
        }
        // GET /organization/roles/:id/permissions
        if (segments.length === 4 && segments[3] === 'permissions') {
          const roleId = segments[2];
          if (method === 'GET') {
            const r = await pool.query(
              `SELECT p.*, COALESCE(rp.can_create, false) as can_create, COALESCE(rp.can_edit, false) as can_edit,
                      COALESCE(rp.can_view, false) as can_view, COALESCE(rp.can_archive, false) as can_archive
               FROM hms_permissions p
               LEFT JOIN hms_role_permissions rp ON rp.permission_id = p.id AND rp.role_id = $1
               ORDER BY p.sort_order`, [roleId]
            );
            return res.json(txAll(r.rows));
          }
          // POST /organization/roles/:id/permissions
          if (method === 'POST') {
            const { permissions } = req.body || {};
            if (Array.isArray(permissions)) {
              for (const p of permissions) {
                const existing = await pool.query(
                  'SELECT id FROM hms_role_permissions WHERE role_id=$1 AND permission_id=$2', [roleId, p.permission_id]
                );
                if (existing.rows.length > 0) {
                  await pool.query(
                    `UPDATE hms_role_permissions SET can_create=$1, can_edit=$2, can_view=$3, can_archive=$4, updated_at=NOW() WHERE role_id=$5 AND permission_id=$6`,
                    [p.can_create, p.can_edit, p.can_view, p.can_archive, roleId, p.permission_id]
                  );
                } else {
                  await pool.query(
                    `INSERT INTO hms_role_permissions (role_id, permission_id, can_create, can_edit, can_view, can_archive, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())`,
                    [roleId, p.permission_id, p.can_create, p.can_edit, p.can_view, p.can_archive]
                  );
                }
              }
            }
            return res.json({ message: 'Permissions saved' });
          }
        }
      }
    }

    // ========== FALLBACK ==========
    console.warn(`⚠️ No handler: ${method} ${path}`);
    return res.status(404).json({ message: `Route not found: ${method} ${path}` });

  } catch (error: any) {
    console.error(`❌ Error (${method} ${path}):`, error.message);
    // If table doesn't exist, return empty array
    if (error.message?.includes('does not exist') || error.message?.includes('relation')) {
      return res.json([]);
    }
    return res.status(500).json({ error: error.message, path });
  }
};
