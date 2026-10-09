// Static checks for the Taskade Make app. No dependencies: run with `node test/validate.mjs`.
//
// The checks cover what Make's app review looks at in the code (references, limits,
// sanitization, error handling, interfaces and samples), and they compare every
// Public API v2 request with the live OpenAPI spec. Pass a spec file as the first
// argument to check offline: `node test/validate.mjs ./v2.json`.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SPEC_URL = 'https://www.taskade.com/api/documentation/v2/json';
const errors = [];
const fail = (message) => errors.push(message);

/** Reads JSON with comments (`.iml.jsonc`). Comments are not used in this app, but Make allows them. */
function readJsonc(relativePath) {
  const text = readFileSync(path.join(APP_DIR, relativePath), 'utf8');
  const withoutComments = text.replace(/^\s*\/\/.*$/gm, '');
  try {
    return JSON.parse(withoutComments);
  } catch (error) {
    fail(`${relativePath}: invalid JSON (${error.message})`);
    return undefined;
  }
}

function walkStrings(value, visit, at = '') {
  if (typeof value === 'string') {
    visit(value, at);
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => walkStrings(item, visit, `${at}[${index}]`));
  } else if (value !== null && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      visit(key, `${at}.${key} (key)`);
      walkStrings(item, visit, `${at}.${key}`);
    }
  }
}

/** Checks that every `{{ ... }}` expression is closed and has balanced brackets and quotes. */
function checkIml(text, where) {
  const opens = text.split('{{').length - 1;
  const closes = text.split('}}').length - 1;
  if (opens !== closes) {
    fail(`${where}: unbalanced {{ }} in ${JSON.stringify(text)}`);
    return;
  }
  for (const [, expression] of text.matchAll(/\{\{(.*?)\}\}/g)) {
    let depth = 0;
    let quote = null;
    for (const char of expression) {
      if (quote) {
        if (char === quote) quote = null;
      } else if (char === "'" || char === '"' || char === '`') {
        quote = char;
      } else if (char === '(') {
        depth++;
      } else if (char === ')') {
        depth--;
      }
      if (depth < 0) break;
    }
    if (depth !== 0 || quote) {
      fail(`${where}: unbalanced brackets or quotes in {{${expression}}}`);
    }
  }
}

function collectParamNames(params, names = new Set()) {
  for (const param of params ?? []) {
    names.add(param.name);
    const nested = [];
    if (param.options && !Array.isArray(param.options) && typeof param.options === 'object') {
      nested.push(...(Array.isArray(param.options.nested) ? param.options.nested : []));
      nested.push(...(param.options.placeholder?.nested ?? []));
    }
    if (Array.isArray(param.options)) {
      for (const option of param.options) nested.push(...(option.nested ?? []));
    }
    collectParamNames(nested, names);
  }
  return names;
}

// ------------------------------------------------------------------ manifest
const manifest = readJsonc('makecomapp.json');
const components = manifest.components;
const referenced = new Set(['makecomapp.json']);
const code = {};

for (const [type, relativePath] of Object.entries(manifest.generalCodeFiles)) {
  if (relativePath === null) continue;
  referenced.add(relativePath);
  if (!existsSync(path.join(APP_DIR, relativePath))) {
    fail(`generalCodeFiles.${type}: missing file ${relativePath}`);
  } else if (relativePath.endsWith('.json') || relativePath.endsWith('.jsonc')) {
    code[`general.${type}`] = readJsonc(relativePath);
  }
}

for (const type of ['connection', 'webhook', 'module', 'rpc', 'function']) {
  if (!(type in components)) fail(`components.${type} is missing`);
}

for (const [type, entries] of Object.entries(components)) {
  for (const [id, meta] of Object.entries(entries)) {
    for (const [codeType, relativePath] of Object.entries(meta.codeFiles ?? {})) {
      if (relativePath === null) continue;
      referenced.add(relativePath);
      if (!existsSync(path.join(APP_DIR, relativePath))) {
        fail(`${type}.${id}.${codeType}: missing file ${relativePath}`);
        continue;
      }
      code[`${type}.${id}.${codeType}`] = readJsonc(relativePath);
    }
  }
}

// Every app file is part of the manifest, except the docs and this test.
const ignored = new Set(['README.md', 'SUBMISSION.md', 'test', 'assets', '.gitignore', '.secrets']);
function listFiles(dir) {
  return readdirSync(path.join(APP_DIR, dir)).flatMap((name) => {
    const relativePath = dir ? `${dir}/${name}` : name;
    if (!dir && ignored.has(name)) return [];
    return statSync(path.join(APP_DIR, relativePath)).isDirectory() ? listFiles(relativePath) : [relativePath];
  });
}
for (const file of listFiles('')) {
  if (!referenced.has(file)) fail(`${file} is not referenced in makecomapp.json`);
}

// ------------------------------------------------------------------ references
const connectionIds = new Set(Object.keys(components.connection));
const rpcIds = new Set(Object.keys(components.rpc));
for (const type of ['module', 'webhook', 'rpc']) {
  for (const [id, meta] of Object.entries(components[type])) {
    for (const key of ['connection', 'altConnection']) {
      if (meta[key] != null && !connectionIds.has(meta[key])) fail(`${type}.${id}.${key}: unknown connection ${meta[key]}`);
    }
    if (meta.connection == null) fail(`${type}.${id}: no connection`);
  }
}
for (const [id, meta] of Object.entries(components.module)) {
  if (meta.moduleType === 'instant_trigger' && !(meta.webhook in components.webhook)) {
    fail(`module.${id}: instant trigger needs a known webhook, got ${meta.webhook}`);
  }
}
for (const [key, value] of Object.entries(code)) {
  walkStrings(value, (text, at) => {
    checkIml(text, `${key}${at}`);
    for (const [, rpcId] of text.matchAll(/rpc:\/\/([\w-]+)/g)) {
      if (!rpcIds.has(rpcId)) fail(`${key}${at}: unknown RPC rpc://${rpcId}`);
    }
  });
}

const grouped = (code['general.groups'] ?? []).flatMap((group) => group.modules);
for (const id of grouped) {
  if (!(id in components.module)) fail(`groups: unknown module ${id}`);
}
for (const id of Object.keys(components.module)) {
  if (grouped.filter((entry) => entry === id).length !== 1) fail(`groups: module ${id} must be in exactly one group`);
}

// ------------------------------------------------------------------ review rules
const base = code['general.base'];
if (!base?.log?.sanitize?.includes('request.headers.authorization')) fail('base: sanitize request.headers.authorization');
if (!base?.response?.error?.message) fail('base: needs response.error handling');
for (const [id] of Object.entries(components.connection)) {
  const communication = code[`connection.${id}.communication`];
  // The OAuth `authorize` step only redirects the browser. Every other request carries a secret.
  const requests = communication?.token
    ? Object.entries(communication).filter(([step]) => step !== 'authorize').map(([, request]) => request)
    : [communication];
  for (const request of requests) {
    if (!request?.log?.sanitize?.length) fail(`connection.${id}: every request that sends a secret needs log.sanitize`);
  }
  const check = communication?.info ?? communication;
  if (!check?.response?.error && !base) fail(`connection.${id}: needs error handling`);
}

const labels = new Set();
for (const [id, meta] of Object.entries(components.module)) {
  const where = `module.${id}`;
  if (labels.has(meta.label)) fail(`${where}: duplicate label ${meta.label}`);
  labels.add(meta.label);
  if (!/^[A-Z]/.test(meta.label)) fail(`${where}: label must start with a capital letter`);
  if (!meta.description?.endsWith('.')) fail(`${where}: description must be a sentence that ends with a period`);

  const communication = code[`${where}.communication`];
  const mappable = code[`${where}.mappableParams`] ?? [];
  const iface = code[`${where}.interface`] ?? [];
  const samples = code[`${where}.samples`];
  if (!iface.length) fail(`${where}: empty interface`);
  if (!samples || Object.keys(samples).length === 0) fail(`${where}: missing samples`);
  const ifaceNames = new Set(iface.map((field) => field.name));
  for (const key of Object.keys(samples ?? {})) {
    if (!ifaceNames.has(key)) fail(`${where}: sample key ${key} is not in the interface`);
  }

  const params = collectParamNames(mappable);
  walkStrings(communication, (text, at) => {
    for (const [, name] of text.matchAll(/parameters\.(\w+)/g)) {
      if (!params.has(name)) fail(`${where}.communication${at}: unknown parameter ${name}`);
    }
  });

  if (meta.moduleType === 'search') {
    if (!params.has('limit')) fail(`${where}: search modules need a limit parameter`);
    if (communication?.response?.limit !== '{{parameters.limit}}') fail(`${where}: response.limit must use parameters.limit`);
  }
  // The user enters only a path. A fixed host keeps the token on the Taskade API.
  if (meta.moduleType === 'universal' && !(communication?.url ?? '').startsWith('https://www.taskade.com/api/{{')) {
    fail(`${where}: the universal module must pin the Taskade API host before the user path`);
  }
  for (const param of mappable) {
    if (param.type === 'date' && !JSON.stringify(communication).includes(`formatDate(parameters.${param.name}`)) {
      fail(`${where}: date parameter ${param.name} must be formatted with formatDate()`);
    }
  }
}
for (const id of Object.keys(components.webhook)) {
  const params = collectParamNames(code[`webhook.${id}.params`] ?? []);
  for (const step of ['attach', 'detach', 'communication']) {
    walkStrings(code[`webhook.${id}.${step}`], (text, at) => {
      for (const [, name] of text.matchAll(/parameters\.(\w+)/g)) {
        if (!params.has(name)) fail(`webhook.${id}.${step}${at}: unknown parameter ${name}`);
      }
    });
  }
}
if (Object.values(components.module).filter((meta) => meta.moduleType === 'universal').length !== 1) {
  fail('the app needs exactly one universal module');
}
for (const id of Object.keys(components.rpc)) {
  const communication = code[`rpc.${id}.communication`];
  if (typeof communication?.response?.limit !== 'number') fail(`rpc.${id}: needs a numeric response.limit`);
}

// ------------------------------------------------------------------ Public API v2 spec
async function loadSpec() {
  const specPath = process.argv[2];
  if (specPath) return JSON.parse(readFileSync(specPath, 'utf8'));
  try {
    const response = await fetch(SPEC_URL, { signal: AbortSignal.timeout(15000) });
    if (response.ok) return await response.json();
  } catch {
    // Offline: the spec check is skipped below with a notice.
  }
  return undefined;
}

function resolveSchema(spec, schema) {
  let current = schema;
  while (current?.$ref) {
    current = current.$ref
      .replace(/^#\//, '')
      .split('/')
      .reduce((node, key) => node?.[key], spec);
  }
  return current;
}

function checkBody(spec, schema, body, where) {
  const resolved = resolveSchema(spec, schema);
  if (!resolved || typeof body !== 'object' || body === null || Array.isArray(body)) return;
  if (resolved.anyOf) {
    // Accept the body when it fits at least one branch.
    const before = errors.length;
    const fits = resolved.anyOf.some((branch) => {
      const probe = errors.length;
      checkBody(spec, branch, body, where);
      const ok = errors.length === probe;
      errors.length = probe;
      return ok;
    });
    errors.length = before;
    if (!fits) fail(`${where}: body fits no anyOf branch of the spec`);
    return;
  }
  const properties = resolved.properties ?? {};
  for (const key of Object.keys(body)) {
    if (key === '{{...}}') continue;
    if (!(key in properties)) fail(`${where}: property ${key} is not in the spec`);
  }
  for (const key of resolved.required ?? []) {
    if (!(key in body)) fail(`${where}: required property ${key} is missing`);
  }
  for (const [key, value] of Object.entries(body)) {
    const property = resolveSchema(spec, properties[key]);
    if (property?.type === 'array' && Array.isArray(value)) {
      value.forEach((item, index) => checkBody(spec, property.items, item, `${where}.${key}[${index}]`));
    } else if (property && typeof value === 'object' && !Array.isArray(value)) {
      checkBody(spec, property, value, `${where}.${key}`);
    }
  }
}

const spec = await loadSpec();
if (spec === undefined && process.env.CI) {
  fail(`the OpenAPI spec is not reachable (${SPEC_URL}), so the request check cannot run`);
} else if (spec === undefined) {
  console.log('NOTICE: the OpenAPI spec is not reachable, so the request check was skipped.');
} else {
  const requests = [];
  for (const [key, value] of Object.entries(code)) {
    const list = key.endsWith('oauth-communication') || key.includes('connection.') ? [] : [value];
    for (const request of list) {
      if (request?.url) requests.push([key, request]);
      if (request?.pagination?.body) requests.push([`${key}.pagination`, { ...request, body: request.pagination.body }]);
    }
  }
  for (const [where, request] of requests) {
    const match = /^(?:https:\/\/www\.taskade\.com\/api)?\/v2(\/[^?]*)$/.exec(request.url);
    if (!match) continue;
    const specPathKey = match[1].replace(/\{\{.*\}\}/, '{id}');
    const operation = spec.paths?.[specPathKey]?.[(request.method ?? 'GET').toLowerCase()];
    if (!operation) {
      fail(`${where}: ${request.method} /v2${specPathKey} is not in the spec`);
      continue;
    }
    const schema = operation.requestBody?.content?.['application/json']?.schema;
    if (schema && request.body !== undefined) checkBody(spec, schema, request.body, where);
  }
  console.log(`Checked ${requests.length} requests against the Public API v2 spec.`);
}

if (errors.length > 0) {
  console.error(`FAIL: ${errors.length} problem(s)`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(
  `PASS: ${Object.keys(components.module).length} modules, ${rpcIds.size} RPCs, ${Object.keys(components.webhook).length} webhooks, ${connectionIds.size} connections`,
);
