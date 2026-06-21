const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const collectionsRoot = path.join(repoRoot, 'postman', 'collections');
const outputPath = path.join(repoRoot, 'postman', 'newman', 'retail-store.postman_collection.json');

function parseScalar(rawValue) {
  const value = rawValue.trim();

  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    return value.slice(1, -1);
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  if (/^-?\d+$/.test(value)) {
    return Number(value);
  }

  return value;
}

function readIndentedBlock(lines, startIndex, indentSize) {
  const blockLines = [];
  let currentIndex = startIndex;
  const indentPrefix = ' '.repeat(indentSize);

  while (currentIndex < lines.length) {
    const line = lines[currentIndex];

    if (!line.trim()) {
      blockLines.push('');
      currentIndex += 1;
      continue;
    }

    if (!line.startsWith(indentPrefix)) {
      break;
    }

    blockLines.push(line.slice(indentSize));
    currentIndex += 1;
  }

  return { blockLines, nextIndex: currentIndex };
}

function parseSimpleList(lines, startIndex) {
  const items = [];
  let currentIndex = startIndex;

  while (currentIndex < lines.length) {
    const line = lines[currentIndex];

    if (!line.trim()) {
      currentIndex += 1;
      continue;
    }

    if (!line.startsWith('  - ')) {
      break;
    }

    const item = {};
    const firstPair = line.trim().slice(2);
    const firstColonIndex = firstPair.indexOf(':');

    if (firstColonIndex !== -1) {
      const firstKey = firstPair.slice(0, firstColonIndex).trim();
      const firstValue = firstPair.slice(firstColonIndex + 1).trim();
      item[firstKey] = parseScalar(firstValue);
    }

    currentIndex += 1;

    while (currentIndex < lines.length) {
      const nestedLine = lines[currentIndex];

      if (!nestedLine.trim()) {
        currentIndex += 1;
        continue;
      }

      if (nestedLine.startsWith('  - ')) {
        break;
      }

      if (!nestedLine.startsWith('    ')) {
        break;
      }

      const trimmed = nestedLine.slice(4);
      const colonIndex = trimmed.indexOf(':');

      if (colonIndex !== -1) {
        const key = trimmed.slice(0, colonIndex).trim();
        const value = trimmed.slice(colonIndex + 1).trim();
        item[key] = parseScalar(value);
      }

      currentIndex += 1;
    }

    items.push(item);
  }

  return { items, nextIndex: currentIndex };
}

function parseScripts(lines, startIndex) {
  const scripts = [];
  let currentIndex = startIndex;

  while (currentIndex < lines.length) {
    const line = lines[currentIndex];

    if (!line.trim()) {
      currentIndex += 1;
      continue;
    }

    if (!line.startsWith('  - ')) {
      break;
    }

    const script = {};
    const firstPair = line.trim().slice(2);
    const firstColonIndex = firstPair.indexOf(':');

    if (firstColonIndex !== -1) {
      const firstKey = firstPair.slice(0, firstColonIndex).trim();
      const firstValue = firstPair.slice(firstColonIndex + 1).trim();
      script[firstKey] = parseScalar(firstValue);
    }

    currentIndex += 1;

    while (currentIndex < lines.length) {
      const nestedLine = lines[currentIndex];

      if (!nestedLine.trim()) {
        currentIndex += 1;
        continue;
      }

      if (nestedLine.startsWith('  - ')) {
        break;
      }

      if (!nestedLine.startsWith('    ')) {
        break;
      }

      if (nestedLine.startsWith('    code: |-')) {
        const blockStart = currentIndex + 1;
        const { blockLines, nextIndex } = readIndentedBlock(lines, blockStart, 6);
        script.code = blockLines.join('\n');
        currentIndex = nextIndex;
        continue;
      }

      const trimmed = nestedLine.slice(4);
      const colonIndex = trimmed.indexOf(':');

      if (colonIndex !== -1) {
        const key = trimmed.slice(0, colonIndex).trim();
        const value = trimmed.slice(colonIndex + 1).trim();
        script[key] = parseScalar(value);
      }

      currentIndex += 1;
    }

    scripts.push(script);
  }

  return { scripts, nextIndex: currentIndex };
}

function parseRequestFile(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n').split('\n');
  const request = {
    headers: [],
    pathVariables: [],
    queryParams: [],
    scripts: [],
  };

  let currentIndex = 0;

  while (currentIndex < lines.length) {
    const line = lines[currentIndex];

    if (!line.trim()) {
      currentIndex += 1;
      continue;
    }

    if (line.startsWith('$kind:')) {
      currentIndex += 1;
      continue;
    }

    if (line.startsWith('name:')) {
      request.name = parseScalar(line.slice('name:'.length));
      currentIndex += 1;
      continue;
    }

    if (line.startsWith('method:')) {
      request.method = parseScalar(line.slice('method:'.length));
      currentIndex += 1;
      continue;
    }

    if (line.startsWith('url:')) {
      request.url = parseScalar(line.slice('url:'.length));
      currentIndex += 1;
      continue;
    }

    if (line.startsWith('order:')) {
      request.order = parseScalar(line.slice('order:'.length));
      currentIndex += 1;
      continue;
    }

    if (line === 'pathVariables:') {
      const parsedList = parseSimpleList(lines, currentIndex + 1);
      request.pathVariables = parsedList.items;
      currentIndex = parsedList.nextIndex;
      continue;
    }

    if (line === 'queryParams:') {
      const parsedList = parseSimpleList(lines, currentIndex + 1);
      request.queryParams = parsedList.items;
      currentIndex = parsedList.nextIndex;
      continue;
    }

    if (line === 'headers:') {
      const parsedList = parseSimpleList(lines, currentIndex + 1);
      request.headers = parsedList.items;
      currentIndex = parsedList.nextIndex;
      continue;
    }

    if (line === 'body:') {
      currentIndex += 1;
      const body = {};

      while (currentIndex < lines.length) {
        const nestedLine = lines[currentIndex];

        if (!nestedLine.trim()) {
          currentIndex += 1;
          continue;
        }

        if (!nestedLine.startsWith('  ')) {
          break;
        }

        if (nestedLine.startsWith('  content: |-')) {
          const { blockLines, nextIndex } = readIndentedBlock(lines, currentIndex + 1, 4);
          body.content = blockLines.join('\n');
          currentIndex = nextIndex;
          continue;
        }

        const trimmed = nestedLine.slice(2);
        const colonIndex = trimmed.indexOf(':');

        if (colonIndex !== -1) {
          const key = trimmed.slice(0, colonIndex).trim();
          const value = trimmed.slice(colonIndex + 1).trim();
          body[key] = parseScalar(value);
        }

        currentIndex += 1;
      }

      request.body = body;
      continue;
    }

    if (line === 'scripts:') {
      const parsedScripts = parseScripts(lines, currentIndex + 1);
      request.scripts = parsedScripts.scripts;
      currentIndex = parsedScripts.nextIndex;
      continue;
    }

    currentIndex += 1;
  }

  return request;
}

function parseDefinitionFile(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n').split('\n');
  const definition = {};

  for (const line of lines) {
    if (line.startsWith('name:')) {
      definition.name = parseScalar(line.slice('name:'.length));
    }

    if (line.startsWith('description:')) {
      definition.description = parseScalar(line.slice('description:'.length));
    }
  }

  return definition;
}

function requestToPostmanItem(request) {
  const item = {
    name: request.name,
    request: {
      method: request.method,
      header: request.headers.map((header) => ({
        key: header.key,
        value: header.value,
      })),
      url: {
        raw: request.url,
      },
    },
  };

  if (request.pathVariables.length > 0) {
    item.request.url.variable = request.pathVariables.map((variable) => ({
      key: variable.key,
      value: variable.value,
    }));
  }

  if (request.queryParams.length > 0) {
    item.request.url.query = request.queryParams.map((queryParam) => {
      const converted = {
        key: queryParam.key,
        value: queryParam.value,
      };

      if (queryParam.disabled !== undefined) {
        converted.disabled = Boolean(queryParam.disabled);
      }

      return converted;
    });
  }

  if (request.body && Object.keys(request.body).length > 0) {
    item.request.body = {
      mode: request.body.type === 'json' ? 'raw' : (request.body.type || 'raw'),
      raw: request.body.content || '',
    };

    if (request.body.type === 'json') {
      item.request.body.options = {
        raw: {
          language: 'json',
        },
      };
    }
  }

  if (request.scripts.length > 0) {
    item.event = request.scripts.map((script) => ({
      listen: script.type === 'beforeRequest' ? 'prerequest' : 'test',
      script: {
        type: script.language || 'text/javascript',
        exec: (script.code || '').split('\n'),
      },
    }));
  }

  return item;
}

function getServiceVariableName(serviceName) {
  const normalizedName = serviceName.toLowerCase();

  if (normalizedName.includes('admin')) {
    return 'adminBaseUrl';
  }

  if (normalizedName.includes('cart')) {
    return 'cartBaseUrl';
  }

  if (normalizedName.includes('checkout')) {
    return 'checkoutBaseUrl';
  }

  if (normalizedName.includes('order')) {
    return 'ordersBaseUrl';
  }

  if (normalizedName.includes('catalog')) {
    return 'catalogBaseUrl';
  }

  return 'baseUrl';
}

function rewriteRequestForService(request, serviceVariableName) {
  const rewrittenRequest = JSON.parse(JSON.stringify(request));

  rewrittenRequest.url = rewrittenRequest.url.replaceAll('{{baseUrl}}', `{{${serviceVariableName}}}`);

  if (Array.isArray(rewrittenRequest.scripts) && rewrittenRequest.scripts.length > 0) {
    rewrittenRequest.scripts = rewrittenRequest.scripts.map((script) => ({
      ...script,
      code: (script.code || '').replaceAll('{{baseUrl}}', `{{${serviceVariableName}}}`),
    }));
  }

  return rewrittenRequest;
}

function normalizeServiceName(serviceName) {
  return serviceName.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function getSelectedServiceDirectories(serviceDirectories) {
  const requestedServices = process.env.POSTMAN_SERVICES;

  if (!requestedServices) {
    return serviceDirectories;
  }

  const allowedServices = new Set(
    requestedServices
      .split(',')
      .map((serviceName) => normalizeServiceName(serviceName.trim()))
      .filter(Boolean),
  );

  return serviceDirectories.filter((serviceName) => {
    const normalizedServiceName = normalizeServiceName(serviceName);

    return Array.from(allowedServices).some(
      (requestedService) =>
        normalizedServiceName.includes(requestedService) || requestedService.includes(normalizedServiceName),
    );
  });
}

function main() {
  const serviceDirectories = fs
    .readdirSync(collectionsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  const selectedServiceDirectories = getSelectedServiceDirectories(serviceDirectories);
  const collectionVariableKeys = new Set();

  const collectionItems = [];
  const defaultBaseUrl = process.env.NODE_ENV === 'test' ? 'http://localhost:8080' : '';

  for (const serviceName of selectedServiceDirectories) {
    const servicePath = path.join(collectionsRoot, serviceName);
    const definitionPath = path.join(servicePath, '.resources', 'definition.yaml');
    const definition = parseDefinitionFile(definitionPath);
    const serviceVariableName = getServiceVariableName(serviceName);
    collectionVariableKeys.add(serviceVariableName);

    const requestFiles = fs
      .readdirSync(servicePath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.request.yaml'))
      .map((entry) => entry.name)
      .sort((left, right) => {
        const leftRequest = parseRequestFile(path.join(servicePath, left));
        const rightRequest = parseRequestFile(path.join(servicePath, right));

        const leftOrder = Number.isFinite(leftRequest.order) ? leftRequest.order : Number.MAX_SAFE_INTEGER;
        const rightOrder = Number.isFinite(rightRequest.order) ? rightRequest.order : Number.MAX_SAFE_INTEGER;

        if (leftOrder !== rightOrder) {
          return leftOrder - rightOrder;
        }

        return left.localeCompare(right);
      });

    const requests = requestFiles.map((fileName) => {
      const requestPath = path.join(servicePath, fileName);
      return rewriteRequestForService(parseRequestFile(requestPath), serviceVariableName);
    });

    collectionItems.push({
      name: definition.name || serviceName,
      description: definition.description,
      item: requests.map(requestToPostmanItem),
    });
  }

  const collectionVariables = Array.from(collectionVariableKeys)
    .filter((key) => key !== 'baseUrl')
    .sort((left, right) => left.localeCompare(right))
    .map((key) => ({ key, value: defaultBaseUrl }));

  const collection = {
    info: {
      name: 'Retail Store API',
      description: 'Combined Newman collection generated from the Bruno-style postman folders.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    variable: [
      ...collectionVariables,
    ],
    item: collectionItems,
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(collection, null, 2)}\n`);
}

main();