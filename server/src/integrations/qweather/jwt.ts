/**
 * @file 和风天气 JWT 认证
 * @description 使用 Ed25519 私钥生成 JWT，并在有效期内缓存复用，减少重复签名开销
 */

import { createPrivateKey, sign, type KeyObject } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from '../../app/config';

/** JWT 有效期（秒），和风天气允许最长 86400 秒，这里采用较短有效期提升安全性 */
const TOKEN_TTL_SECONDS = 900;

/** 提前刷新阈值（秒），避免请求期间 Token 恰好过期 */
const TOKEN_REFRESH_AHEAD_SECONDS = 60;

/** 签发时间回溯量（秒），用于抵消服务器与和风天气的时间误差 */
const ISSUED_AT_BACKTRACK_SECONDS = 30;

/**
 * 缓存的 JWT 信息
 * @property token JWT 字符串
 * @property expiresAt 过期时间（UNIX 秒）
 */
interface CachedJwt {
  token: string;
  expiresAt: number;
}

/** 已缓存的 JWT */
let cachedJwt: CachedJwt | null = null;

/** 已缓存的私钥对象，避免每次请求重复解析 PEM */
let cachedPrivateKey: KeyObject | null = null;

/**
 * 获取缺失的 JWT 配置项名称
 * @returns 缺失的环境变量名称数组；为空表示配置完整
 */
export function getMissingJwtConfigKeys(): string[] {
  const missingKeys: string[] = [];

  if (!config.qweatherJwtCredentialId) {
    missingKeys.push('QWEATHER_JWT_CREDENTIAL_ID');
  }

  if (!config.qweatherJwtProjectId) {
    missingKeys.push('QWEATHER_JWT_PROJECT_ID');
  }

  if (!config.qweatherJwtDeveloperId) {
    missingKeys.push('QWEATHER_JWT_DEVELOPER_ID');
  }

  if (!config.qweatherJwtPrivateKey && !config.qweatherJwtPrivateKeyPath) {
    missingKeys.push('QWEATHER_JWT_PRIVATE_KEY 或 QWEATHER_JWT_PRIVATE_KEY_PATH');
  }

  return missingKeys;
}

/**
 * 将字符串或字节内容编码为 Base64URL
 * @param value 类型：string | Buffer；含义：待编码内容；是否必填：是；默认值：无
 * @returns 类型：string；含义：Base64URL 编码结果
 * @throws 无
 */
function encodeBase64Url(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url');
}

/**
 * 规范化私钥内容
 * @param raw 类型：string；含义：环境变量或私钥文件中的原始内容；是否必填：是；默认值：无
 * @returns 类型：string；含义：标准 PKCS#8 PEM 私钥
 * @description 兼容环境变量中用 \n 表示换行的写法，以及仅提供 Base64 内容的情况
 * @throws 无
 */
function normalizePrivateKeyContent(raw: string): string {
  const content = raw.trim().replace(/\\n/g, '\n');

  if (content.includes('BEGIN PRIVATE KEY')) {
    return content;
  }

  return `-----BEGIN PRIVATE KEY-----\n${content.replace(/\s+/g, '')}\n-----END PRIVATE KEY-----`;
}

/**
 * 读取并解析 Ed25519 私钥
 * @returns 类型：KeyObject；含义：可用于签名的私钥对象
 * @throws 当私钥未配置、文件不可读或格式无效时抛出中文异常
 */
function getPrivateKey(): KeyObject {
  if (cachedPrivateKey) {
    return cachedPrivateKey;
  }

  let rawContent = config.qweatherJwtPrivateKey;

  if (!rawContent) {
    try {
      rawContent = readFileSync(resolve(config.qweatherJwtPrivateKeyPath), 'utf-8');
    } catch {
      throw new Error(
        `无法读取和风天气 JWT 私钥文件：${config.qweatherJwtPrivateKeyPath}，请确认文件存在且已正确挂载到容器`
      );
    }
  }

  try {
    cachedPrivateKey = createPrivateKey(normalizePrivateKeyContent(rawContent));
  } catch {
    throw new Error('和风天气 JWT 私钥格式无效，请使用 Ed25519 PKCS#8 PEM 格式私钥');
  }

  return cachedPrivateKey;
}

/**
 * 生成新的 JWT
 * @returns 类型：CachedJwt；含义：新生成的 JWT 及其过期时间
 * @throws 当私钥不可用或签名失败时抛出中文异常
 */
function buildJwt(): CachedJwt {
  const issuedAt = Math.floor(Date.now() / 1000) - ISSUED_AT_BACKTRACK_SECONDS;
  const expiresAt = issuedAt + TOKEN_TTL_SECONDS;

  const header = {
    alg: 'EdDSA',
    kid: config.qweatherJwtCredentialId,
  };
  const payload = {
    iss: config.qweatherJwtDeveloperId,
    sub: config.qweatherJwtProjectId,
    iat: issuedAt,
    exp: expiresAt,
  };

  const unsignedToken = `${encodeBase64Url(JSON.stringify(header))}.${encodeBase64Url(
    JSON.stringify(payload)
  )}`;

  let signature: Buffer;
  try {
    signature = sign(null, Buffer.from(unsignedToken, 'utf-8'), getPrivateKey());
  } catch {
    throw new Error('和风天气 JWT 签名失败，请检查私钥是否与已上传到控制台的公钥匹配');
  }

  return {
    token: `${unsignedToken}.${encodeBase64Url(signature)}`,
    expiresAt,
  };
}

/**
 * 获取可用的 JWT
 * @returns 类型：string；含义：可直接放入 Authorization 请求头的 JWT
 * @description 有效期内复用缓存 Token，临近过期时自动重新生成
 * @throws 当 JWT 配置不完整或生成失败时抛出中文异常
 */
export function getQWeatherJwt(): string {
  const missingKeys = getMissingJwtConfigKeys();

  if (missingKeys.length > 0) {
    throw new Error(`和风天气 JWT 认证配置不完整，缺少：${missingKeys.join('、')}`);
  }

  const nowSeconds = Math.floor(Date.now() / 1000);

  if (cachedJwt && cachedJwt.expiresAt - nowSeconds > TOKEN_REFRESH_AHEAD_SECONDS) {
    return cachedJwt.token;
  }

  cachedJwt = buildJwt();
  return cachedJwt.token;
}
