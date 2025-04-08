import crypto from 'node:crypto';

export function generateStreamKey(length = 16) {
  // 필요한 바이트 수 계산 (base64는 3바이트당 4문자 생성됨)
  const bytes = Math.ceil((length * 3) / 4);
  return crypto.randomBytes(bytes).toString('base64').slice(0, length);
}
