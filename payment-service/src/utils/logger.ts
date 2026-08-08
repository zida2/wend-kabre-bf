import fs from 'fs';
import path from 'path';

const logsDir = path.join(process.cwd(), 'logs');
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (err) {
  // Silent
}

const logFilePath = path.join(logsDir, 'payment.log');
const errorsLogPath = path.join(logsDir, 'payment-errors.log');

const getTimestamp = (): string => new Date().toISOString();

const appendToFile = (targetPath: string, line: string) => {
  try {
    fs.appendFileSync(targetPath, line + '\n', { encoding: 'utf8' });
  } catch (e) {
    // Silent
  }
};

type Meta = Record<string, any> | undefined | null;

const formatMeta = (meta: Meta): string => {
  if (!meta || Object.keys(meta).length === 0) return '';
  try {
    return ` | ${JSON.stringify(meta)}`;
  } catch {
    return ' | [serialization_error]';
  }
};

interface StructuredLogRecord {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  event: string;
  message: string;
  meta?: any;
  durationMs?: number;
}

const emit = (
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
  event: string,
  message: string,
  meta: Meta = undefined,
  durationMs?: number
) => {
  const ts = getTimestamp();
  const metaStr = formatMeta(meta);
  const durationStr = typeof durationMs === 'number' ? ` | durationMs=${durationMs}` : '';
  const humanLine = `[${ts}] [${level}] [event=${event}] ${message}${metaStr}${durationStr}`;

  const record: StructuredLogRecord = {
    timestamp: ts,
    level,
    event,
    message,
    ...(meta && { meta }),
    ...(typeof durationMs === 'number' && { durationMs })
  };
  const jsonLine = JSON.stringify(record);

  switch (level) {
    case 'INFO':
      console.log(humanLine);
      appendToFile(logFilePath, humanLine);
      appendToFile(logFilePath, jsonLine);
      break;
    case 'WARN':
      console.warn(humanLine);
      appendToFile(logFilePath, humanLine);
      appendToFile(logFilePath, jsonLine);
      appendToFile(errorsLogPath, humanLine);
      break;
    case 'ERROR':
      console.error(humanLine);
      appendToFile(logFilePath, humanLine);
      appendToFile(logFilePath, jsonLine);
      appendToFile(errorsLogPath, humanLine);
      appendToFile(errorsLogPath, jsonLine);
      break;
    case 'DEBUG':
      if (process.env.NODE_ENV !== 'production') {
        console.debug(humanLine);
      }
      appendToFile(logFilePath, humanLine);
      appendToFile(logFilePath, jsonLine);
      break;
  }
};

export const logger = {
  info: (message: string, meta?: any) => emit('INFO', 'GENERIC_INFO', message, meta),
  warn: (message: string, meta?: any) => emit('WARN', 'GENERIC_WARN', message, meta),
  error: (message: string, meta?: any) => emit('ERROR', 'GENERIC_ERROR', message, meta),
  debug: (message: string, meta?: any) => emit('DEBUG', 'GENERIC_DEBUG', message, meta),

  paymentCreated: (userId: string, planId: string, amount: number, reference: string, meta?: Meta) =>
    emit('INFO', 'PAYMENT_CREATED',
      `Paiement créé: userId=${userId} plan=${planId} amount=${amount} reference=${reference}`,
      { userId, planId, amount, reference, ...(meta || {}) }),

  webhookReceived: (reference: string, meta?: Meta) =>
    emit('INFO', 'PAYMENT_RECEIVED',
      `Webhook Money Fusion reçu: reference=${reference}`,
      { reference, ...(meta || {}) }),

  webhookRejected: (reference: string, reason: string, meta?: Meta) =>
    emit('WARN', 'WEBHOOK_REJECTED',
      `Webhook rejeté: reference=${reference} raison=${reason}`,
      { reference, reason, ...(meta || {}) }),

  paymentValidated: (reference: string, amount: number, transactionId?: string, meta?: Meta) =>
    emit('INFO', 'PAYMENT_VALIDATED',
      `Paiement validé SUCCESS: reference=${reference} amount=${amount} transactionId=${transactionId || ''}`,
      { reference, amount, transactionId, ...(meta || {}) }),

  paymentRefused: (reference: string, amount: number, finalStatus: string, meta?: Meta) =>
    emit('WARN', 'PAYMENT_REFUSED',
      `Paiement refusé: reference=${reference} status=${finalStatus} amount=${amount}`,
      { reference, amount, finalStatus, ...(meta || {}) }),

  subscriptionActivated: (userId: string, plan: string, endDate: string, meta?: Meta) =>
    emit('INFO', 'SUBSCRIPTION_ACTIVATED',
      `Abonnement activé: userId=${userId} plan=${plan} endDate=${endDate}`,
      { userId, plan, endDate, ...(meta || {}) }),

  subscriptionExpired: (userId: string, subscriptionId: string, meta?: Meta) =>
    emit('INFO', 'SUBSCRIPTION_EXPIRED',
      `Abonnement expiré: userId=${userId} subscriptionId=${subscriptionId}`,
      { userId, subscriptionId, ...(meta || {}) }),

  moneyFusionApiCall: (endpoint: string, durationMs: number, success: boolean, meta?: Meta) =>
    emit(success ? 'INFO' : 'WARN', 'MONEY_FUSION_API_CALL',
      `Appel Money Fusion ${endpoint} - ${success ? 'OK' : 'ERREUR'} - ${durationMs}ms`,
      { endpoint, durationMs, success, ...(meta || {}) }),

  databaseError: (operation: string, err: any, meta?: Meta) =>
    emit('ERROR', 'DATABASE_ERROR',
      `Erreur BDD ${operation}: ${err?.message || 'inconnue'}`,
      { operation, error: err?.message, stack: err?.stack, ...(meta || {}) }),

  apiSuccess: (route: string, durationMs: number, meta?: Meta) =>
    emit('INFO', 'API_SUCCESS',
      `[2xx] ${route} (${durationMs}ms)`,
      { route, durationMs, ...(meta || {}) },
      durationMs),

  apiError: (route: string, err: any, durationMs: number, meta?: Meta) =>
    emit('ERROR', 'API_ERROR',
      `[5xx/4xx] ${route}: ${err?.message || 'erreur'} (${durationMs}ms)`,
      { route, durationMs, error: err?.message, statusCode: err?.statusCode, ...(meta || {}) },
      durationMs),

  serverStarted: (port: number, externalUrl: string, environment: string) =>
    emit('INFO', 'SERVER_STARTED',
      `Serveur démarré port=${port} env=${environment} url=${externalUrl}`,
      { port, externalUrl, environment }),

  databaseConnected: (dbName: string = 'postgresql-wend-kabre') =>
    emit('INFO', 'DATABASE_CONNECTED',
      `Connexion Prisma/PostgreSQL établie: ${dbName}`,
      { dbName }),
};
