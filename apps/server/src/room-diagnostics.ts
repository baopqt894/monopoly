type Fields = Record<string, unknown>;
const record = (value: unknown): Fields =>
  value !== null && typeof value === 'object' ? value as Fields : {};

/** Allowlist only: never log messages, stacks, URI, credentials, requests or room state. */
export function roomFailureDetails(cause: unknown) {
  const pending = [cause];
  const seen = new Set<unknown>();
  const codes: (string | number)[] = [];
  const names: string[] = [];
  for (let i = 0; i < pending.length && i < 24; i++) {
    const value = pending[i];
    if (seen.has(value)) continue;
    seen.add(value);
    const item = record(value);
    if (typeof item.code === 'number' && Number.isSafeInteger(item.code)) codes.push(item.code);
    else if (typeof item.code === 'string' && [
      'ENOTFOUND', 'ENODATA', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT',
      'EAI_AGAIN', 'CERT_HAS_EXPIRED', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
    ].includes(item.code)) codes.push(item.code);
    if (typeof item.name === 'string' && [
      'MongoParseError', 'MongoInvalidArgumentError', 'MongoServerError',
      'MongoServerSelectionError', 'MongoNetworkError', 'MongoNetworkTimeoutError',
      'MongoTopologyClosedError', 'MongoAPIError', 'TypeError', 'Error',
    ].includes(item.name)) names.push(item.name);
    if (item.message === 'ROOM_STORE_NOT_CONFIGURED') codes.push('ROOM_STORE_NOT_CONFIGURED');
    if (item.cause) pending.push(item.cause);
    if (item.reason) pending.push(item.reason);
    if (item.error) pending.push(item.error);
    if (item.servers instanceof Map) pending.push(...item.servers.values());
  }
  const category = codes.includes('ROOM_STORE_NOT_CONFIGURED') ? 'missing_configuration'
    : codes.includes('ENOTFOUND') || codes.includes('ENODATA') ? 'dns'
    : codes.includes(18) ? 'authentication'
    : codes.includes(13) ? 'authorization'
    : codes.includes(85) || codes.includes(86) ? 'index_conflict'
    : codes.includes(73) ? 'invalid_database'
    : names.includes('MongoParseError') || names.includes('MongoInvalidArgumentError') ? 'invalid_configuration'
    : names.includes('MongoServerSelectionError') || names.includes('MongoNetworkTimeoutError') ||
      codes.includes('ETIMEDOUT') ? 'connection_timeout'
    : names.includes('MongoNetworkError') ? 'network'
    : 'unknown';
  return { category, names: [...new Set(names)], codes: [...new Set(codes)] };
}

export function roomConfigurationDetails(env: Record<string, string | undefined> = process.env) {
  const uri = env.MONGODB_URI ?? '';
  const db = env.MONGODB_DB;
  return {
    uriPresent: !!uri,
    uriScheme: uri.startsWith('mongodb+srv://') ? 'srv'
      : uri.startsWith('mongodb://') ? 'standard' : 'invalid',
    uriSurroundingWhitespace: uri !== uri.trim(),
    uriSurroundingQuotes: /^["']|["']$/.test(uri),
    databaseDefault: db === undefined,
    databaseInvalid: db !== undefined && (!db || /[/\\. "$\x00]/.test(db)),
  };
}

export function logRoomFailure(
  operation: 'health' | 'room' | 'events' | 'events.subscribe' |
    'mongodb.configure' | 'mongodb.connect' | 'mongodb.indexes',
  cause: unknown,
) {
  console.error(JSON.stringify({
    event: 'room_store_failure', operation,
    ...roomFailureDetails(cause), configuration: roomConfigurationDetails(),
  }));
}
