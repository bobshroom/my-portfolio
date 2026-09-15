var src = {};
var Client = {};
var logging = {};
var utils = {};
var hasRequiredUtils;
function requireUtils() {
  if (hasRequiredUtils) return utils;
  hasRequiredUtils = 1;
  Object.defineProperty(utils, "__esModule", { value: true });
  utils.assertNever = assertNever;
  utils.pick = pick;
  utils.isObject = isObject;
  utils.getUnknownParams = getUnknownParams;
  function assertNever(value) {
    throw new Error(`Unexpected value should never occur: ${value}`);
  }
  function pick(base, keys) {
    const entries = keys.map((key) => [key, base === null || base === void 0 ? void 0 : base[key]]);
    return Object.fromEntries(entries);
  }
  function isObject(o) {
    return typeof o === "object" && o !== null;
  }
  function getUnknownParams(args, endpoint) {
    var _a;
    const knownKeys = /* @__PURE__ */ new Set([
      ...endpoint.pathParams,
      ...endpoint.queryParams,
      ...endpoint.bodyParams,
      ...(_a = endpoint.formDataParams) !== null && _a !== void 0 ? _a : [],
      "auth"
    ]);
    return Object.keys(args).filter((k) => !knownKeys.has(k));
  }
  return utils;
}
var hasRequiredLogging;
function requireLogging() {
  if (hasRequiredLogging) return logging;
  hasRequiredLogging = 1;
  Object.defineProperty(logging, "__esModule", { value: true });
  logging.LogLevel = void 0;
  logging.makeConsoleLogger = makeConsoleLogger;
  logging.logLevelSeverity = logLevelSeverity;
  const utils_1 = requireUtils();
  var LogLevel;
  (function(LogLevel2) {
    LogLevel2["DEBUG"] = "debug";
    LogLevel2["INFO"] = "info";
    LogLevel2["WARN"] = "warn";
    LogLevel2["ERROR"] = "error";
  })(LogLevel || (logging.LogLevel = LogLevel = {}));
  function makeConsoleLogger(name2) {
    return (level, message, extraInfo) => {
      console[level](`${name2} ${level}:`, message, extraInfo);
    };
  }
  function logLevelSeverity(level) {
    switch (level) {
      case LogLevel.DEBUG:
        return 20;
      case LogLevel.INFO:
        return 40;
      case LogLevel.WARN:
        return 60;
      case LogLevel.ERROR:
        return 80;
      default:
        return (0, utils_1.assertNever)(level);
    }
  }
  return logging;
}
var errors = {};
var hasRequiredErrors;
function requireErrors() {
  if (hasRequiredErrors) return errors;
  hasRequiredErrors = 1;
  Object.defineProperty(errors, "__esModule", { value: true });
  errors.APIResponseError = errors.UnknownHTTPResponseError = errors.InvalidPathParameterError = errors.RequestTimeoutError = errors.ClientErrorCode = errors.APIErrorCode = void 0;
  errors.isNotionClientError = isNotionClientError;
  errors.validateRequestPath = validateRequestPath;
  errors.getResponseHeader = getResponseHeader;
  errors.isHTTPResponseError = isHTTPResponseError;
  errors.buildRequestError = buildRequestError;
  const utils_1 = requireUtils();
  var APIErrorCode;
  (function(APIErrorCode2) {
    APIErrorCode2["Unauthorized"] = "unauthorized";
    APIErrorCode2["RestrictedResource"] = "restricted_resource";
    APIErrorCode2["ObjectNotFound"] = "object_not_found";
    APIErrorCode2["RateLimited"] = "rate_limited";
    APIErrorCode2["InvalidJSON"] = "invalid_json";
    APIErrorCode2["InvalidRequestURL"] = "invalid_request_url";
    APIErrorCode2["InvalidRequest"] = "invalid_request";
    APIErrorCode2["InvalidBeta"] = "invalid_beta";
    APIErrorCode2["ValidationError"] = "validation_error";
    APIErrorCode2["ConflictError"] = "conflict_error";
    APIErrorCode2["InternalServerError"] = "internal_server_error";
    APIErrorCode2["ServiceOverload"] = "service_overload";
    APIErrorCode2["ServiceUnavailable"] = "service_unavailable";
    APIErrorCode2["GatewayTimeout"] = "gateway_timeout";
  })(APIErrorCode || (errors.APIErrorCode = APIErrorCode = {}));
  var ClientErrorCode;
  (function(ClientErrorCode2) {
    ClientErrorCode2["RequestTimeout"] = "notionhq_client_request_timeout";
    ClientErrorCode2["ResponseError"] = "notionhq_client_response_error";
    ClientErrorCode2["InvalidPathParameter"] = "notionhq_client_invalid_path_parameter";
  })(ClientErrorCode || (errors.ClientErrorCode = ClientErrorCode = {}));
  class NotionClientErrorBase extends Error {
  }
  function isNotionClientError(error) {
    return (0, utils_1.isObject)(error) && error instanceof NotionClientErrorBase;
  }
  function isNotionClientErrorWithCode(error, codes) {
    return isNotionClientError(error) && error.code in codes;
  }
  class RequestTimeoutError extends NotionClientErrorBase {
    constructor(message = "Request to Notion API has timed out") {
      super(message);
      this.code = ClientErrorCode.RequestTimeout;
      this.name = "RequestTimeoutError";
    }
    static isRequestTimeoutError(error) {
      return isNotionClientErrorWithCode(error, {
        [ClientErrorCode.RequestTimeout]: true
      });
    }
    static rejectAfterTimeout(promise, timeoutMS) {
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new RequestTimeoutError());
        }, timeoutMS);
        promise.then(resolve).catch(reject).then(() => clearTimeout(timeoutId));
      });
    }
  }
  errors.RequestTimeoutError = RequestTimeoutError;
  class InvalidPathParameterError extends NotionClientErrorBase {
    constructor(message = "Path parameter contains invalid characters that could alter the request path") {
      super(message);
      this.code = ClientErrorCode.InvalidPathParameter;
      this.name = "InvalidPathParameterError";
    }
    static isInvalidPathParameterError(error) {
      return isNotionClientErrorWithCode(error, {
        [ClientErrorCode.InvalidPathParameter]: true
      });
    }
  }
  errors.InvalidPathParameterError = InvalidPathParameterError;
  function validateRequestPath(path) {
    if (path.includes("..")) {
      throw new InvalidPathParameterError(`Request path "${path}" contains path traversal sequence ".."`);
    }
    if (/%2e/i.test(path)) {
      let decoded;
      try {
        decoded = decodeURIComponent(path);
      } catch {
        return;
      }
      if (decoded.includes("..")) {
        throw new InvalidPathParameterError(`Request path "${path}" contains encoded path traversal sequence`);
      }
    }
  }
  function getResponseHeader(headers, name2) {
    if (!(0, utils_1.isObject)(headers)) {
      return void 0;
    }
    const get = headers["get"];
    if (typeof get === "function") {
      const value = get.call(headers, name2);
      return typeof value === "string" ? value : void 0;
    }
    const lowerName = name2.toLowerCase();
    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() !== lowerName) {
        continue;
      }
      if (typeof value === "string") {
        return value;
      }
      if (Array.isArray(value) && typeof value[0] === "string") {
        return value[0];
      }
    }
    return void 0;
  }
  class HTTPResponseError extends NotionClientErrorBase {
    constructor(args) {
      super(args.message);
      this.name = "HTTPResponseError";
      const { code, status, headers, rawBodyText, additional_data, request_id } = args;
      this.code = code;
      this.status = status;
      this.headers = headers;
      this.body = rawBodyText;
      this.additional_data = additional_data;
      this.request_id = request_id !== null && request_id !== void 0 ? request_id : getResponseHeader(headers, "x-notion-request-id");
      this.ray_id = getResponseHeader(headers, "cf-ray");
    }
  }
  const httpResponseErrorCodes = {
    [ClientErrorCode.ResponseError]: true,
    [APIErrorCode.Unauthorized]: true,
    [APIErrorCode.RestrictedResource]: true,
    [APIErrorCode.ObjectNotFound]: true,
    [APIErrorCode.RateLimited]: true,
    [APIErrorCode.InvalidJSON]: true,
    [APIErrorCode.InvalidRequestURL]: true,
    [APIErrorCode.InvalidRequest]: true,
    [APIErrorCode.InvalidBeta]: true,
    [APIErrorCode.ValidationError]: true,
    [APIErrorCode.ConflictError]: true,
    [APIErrorCode.InternalServerError]: true,
    [APIErrorCode.ServiceOverload]: true,
    [APIErrorCode.ServiceUnavailable]: true,
    [APIErrorCode.GatewayTimeout]: true
  };
  function isHTTPResponseError(error) {
    if (!isNotionClientErrorWithCode(error, httpResponseErrorCodes)) {
      return false;
    }
    return true;
  }
  class UnknownHTTPResponseError extends HTTPResponseError {
    constructor(args) {
      var _a;
      const ray_id = getResponseHeader(args.headers, "cf-ray");
      const request_id = getResponseHeader(args.headers, "x-notion-request-id");
      super({
        ...args,
        code: ClientErrorCode.ResponseError,
        message: (_a = args.message) !== null && _a !== void 0 ? _a : buildUnknownResponseMessage({
          status: args.status,
          contentType: getResponseHeader(args.headers, "content-type"),
          ray_id,
          request_id
        }),
        additional_data: void 0,
        request_id
      });
      this.name = "UnknownHTTPResponseError";
    }
    static isUnknownHTTPResponseError(error) {
      return isNotionClientErrorWithCode(error, {
        [ClientErrorCode.ResponseError]: true
      });
    }
  }
  errors.UnknownHTTPResponseError = UnknownHTTPResponseError;
  const apiErrorCodes = {
    [APIErrorCode.Unauthorized]: true,
    [APIErrorCode.RestrictedResource]: true,
    [APIErrorCode.ObjectNotFound]: true,
    [APIErrorCode.RateLimited]: true,
    [APIErrorCode.InvalidJSON]: true,
    [APIErrorCode.InvalidRequestURL]: true,
    [APIErrorCode.InvalidRequest]: true,
    [APIErrorCode.InvalidBeta]: true,
    [APIErrorCode.ValidationError]: true,
    [APIErrorCode.ConflictError]: true,
    [APIErrorCode.InternalServerError]: true,
    [APIErrorCode.ServiceOverload]: true,
    [APIErrorCode.ServiceUnavailable]: true,
    [APIErrorCode.GatewayTimeout]: true
  };
  class APIResponseError extends HTTPResponseError {
    constructor() {
      super(...arguments);
      this.name = "APIResponseError";
    }
    static isAPIResponseError(error) {
      return isNotionClientErrorWithCode(error, apiErrorCodes);
    }
  }
  errors.APIResponseError = APIResponseError;
  function buildRequestError(response, bodyText) {
    const apiErrorResponseBody = parseAPIErrorResponseBody(bodyText);
    if (apiErrorResponseBody !== void 0) {
      return new APIResponseError({
        code: apiErrorResponseBody.code,
        message: apiErrorResponseBody.message,
        headers: response.headers,
        status: response.status,
        rawBodyText: bodyText,
        additional_data: apiErrorResponseBody.additional_data,
        request_id: apiErrorResponseBody.request_id
      });
    }
    return new UnknownHTTPResponseError({
      message: void 0,
      headers: response.headers,
      status: response.status,
      rawBodyText: bodyText
    });
  }
  function buildUnknownResponseMessage(args) {
    const { status, contentType, ray_id, request_id } = args;
    const base = `Request to Notion API failed with status: ${status}`;
    if (ray_id === void 0 || request_id !== void 0) {
      return base;
    }
    const contentTypeNote = contentType !== void 0 ? ` (content-type: ${contentType})` : "";
    const blockedRequestNote = status === 403 ? " This may mean the request was blocked by a network security rule." : "";
    return `${base}. The response was returned by Notion's edge proxy before reaching the Notion API${contentTypeNote}.${blockedRequestNote} Cloudflare Ray ID: ${ray_id}. Include this ID when contacting Notion support.`;
  }
  function parseAPIErrorResponseBody(body) {
    if (typeof body !== "string") {
      return;
    }
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch (parseError) {
      return;
    }
    if (!(0, utils_1.isObject)(parsed) || typeof parsed["message"] !== "string" || !isAPIErrorCode(parsed["code"])) {
      return;
    }
    const additional_data = parsed["additional_data"];
    const request_id = parsed["request_id"];
    return {
      ...parsed,
      code: parsed["code"],
      message: parsed["message"],
      additional_data,
      request_id
    };
  }
  function isAPIErrorCode(code) {
    return typeof code === "string" && code in apiErrorCodes;
  }
  return errors;
}
var constants = {};
var hasRequiredConstants;
function requireConstants() {
  if (hasRequiredConstants) return constants;
  hasRequiredConstants = 1;
  Object.defineProperty(constants, "__esModule", { value: true });
  constants.MIN_VIEW_COLUMN_WIDTH = constants.DEFAULT_MAX_RETRY_DELAY_MS = constants.DEFAULT_INITIAL_RETRY_DELAY_MS = constants.DEFAULT_MAX_RETRIES = constants.DEFAULT_TIMEOUT_MS = constants.DEFAULT_BASE_URL = void 0;
  constants.DEFAULT_BASE_URL = "https://api.notion.com";
  constants.DEFAULT_TIMEOUT_MS = 6e4;
  constants.DEFAULT_MAX_RETRIES = 2;
  constants.DEFAULT_INITIAL_RETRY_DELAY_MS = 1e3;
  constants.DEFAULT_MAX_RETRY_DELAY_MS = 6e4;
  constants.MIN_VIEW_COLUMN_WIDTH = 32;
  return constants;
}
var apiEndpoints = {};
var agents = {};
var hasRequiredAgents;
function requireAgents() {
  if (hasRequiredAgents) return agents;
  hasRequiredAgents = 1;
  Object.defineProperty(agents, "__esModule", { value: true });
  agents.updateSession = agents.updateAgentStatus = agents.updateAgentCreditLimit = agents.startExternalAgentStubSession = agents.sendExternalAgentStubSessionMessage = agents.retrieveSession = agents.queryThreads = agents.queryThreadMessages = agents.querySessions = agents.querySessionEvents = agents.queryAgents = agents.listThreads = agents.sendThreadMessage = agents.listThreadMessages = agents.listExternalAgentStubSessionEvents = agents.listAgents = agents.getInsights = agents.updateExternalAgentStubVault = agents.deleteExternalAgentStubVault = agents.getAgent = agents.deleteAgent = agents.createExternalAgentStubVault = agents.continueThread = agents.chatWithAgent = agents.cancelSession = agents.agentBatch = agents.updateSessionStream = void 0;
  agents.updateSessionStream = {
    method: "post",
    pathParams: [],
    queryParams: [],
    bodyParams: [
      "message",
      "agent_id",
      "session_id",
      "attachments",
      "metadata",
      "prompt_context",
      "actions",
      "continue_from"
    ],
    headers: { Accept: "text/event-stream" },
    path: () => `sessions`
  };
  agents.agentBatch = {
    method: "post",
    pathParams: [],
    queryParams: [],
    bodyParams: ["operations"],
    path: () => `agents/batch`
  };
  agents.cancelSession = {
    method: "post",
    pathParams: ["session_id"],
    queryParams: [],
    bodyParams: ["event_id"],
    path: (p) => `sessions/${p.session_id}/cancel`
  };
  agents.chatWithAgent = {
    method: "post",
    pathParams: ["agent_id"],
    queryParams: ["verbose"],
    bodyParams: [
      "message",
      "attachments",
      "metadata",
      "prompt_context",
      "thread_id"
    ],
    path: (p) => `agents/${p.agent_id}/chat`
  };
  agents.continueThread = {
    method: "post",
    pathParams: ["thread_id"],
    queryParams: [],
    bodyParams: ["action_id", "option_id", "input"],
    path: (p) => `threads/${p.thread_id}/continue`
  };
  agents.createExternalAgentStubVault = {
    method: "post",
    pathParams: ["agent_id"],
    queryParams: [],
    bodyParams: ["name", "credential", "target"],
    path: (p) => `external_agent_stub/${p.agent_id}/vaults`
  };
  agents.deleteAgent = {
    method: "delete",
    pathParams: ["agent_id"],
    queryParams: [],
    bodyParams: [],
    path: (p) => `agents/${p.agent_id}`
  };
  agents.getAgent = {
    method: "get",
    pathParams: ["agent_id"],
    queryParams: ["verbose"],
    bodyParams: [],
    path: (p) => `agents/${p.agent_id}`
  };
  agents.deleteExternalAgentStubVault = {
    method: "delete",
    pathParams: ["agent_id", "vault_id"],
    queryParams: [],
    bodyParams: [],
    path: (p) => `external_agent_stub/${p.agent_id}/vaults/${p.vault_id}`
  };
  agents.updateExternalAgentStubVault = {
    method: "patch",
    pathParams: ["agent_id", "vault_id"],
    queryParams: [],
    bodyParams: ["expected_version", "credential"],
    path: (p) => `external_agent_stub/${p.agent_id}/vaults/${p.vault_id}`
  };
  agents.getInsights = {
    method: "get",
    pathParams: ["agent_id"],
    queryParams: ["start_time", "end_time"],
    bodyParams: [],
    path: (p) => `agents/${p.agent_id}/insights`
  };
  agents.listAgents = {
    method: "get",
    pathParams: [],
    queryParams: [
      "name",
      "agent_type",
      "agent_ids",
      "created_by",
      "start_cursor",
      "page_size",
      "verbose"
    ],
    bodyParams: [],
    path: () => `agents`
  };
  agents.listExternalAgentStubSessionEvents = {
    method: "get",
    pathParams: ["agent_id", "session_id"],
    queryParams: ["cursor"],
    bodyParams: [],
    path: (p) => `external_agent_stub/${p.agent_id}/sessions/${p.session_id}/events`
  };
  agents.listThreadMessages = {
    method: "get",
    pathParams: ["thread_id"],
    queryParams: ["verbose", "role", "start_cursor", "page_size"],
    bodyParams: [],
    path: (p) => `threads/${p.thread_id}/messages`
  };
  agents.sendThreadMessage = {
    method: "post",
    pathParams: ["thread_id"],
    queryParams: [],
    bodyParams: ["message", "attachments", "metadata", "prompt_context"],
    path: (p) => `threads/${p.thread_id}/messages`
  };
  agents.listThreads = {
    method: "get",
    pathParams: ["agent_id"],
    queryParams: [
      "id",
      "title",
      "status",
      "activity",
      "created_by",
      "last_used_by",
      "sort_by",
      "sort_direction",
      "start_cursor",
      "page_size"
    ],
    bodyParams: [],
    path: (p) => `agents/${p.agent_id}/threads`
  };
  agents.queryAgents = {
    method: "post",
    pathParams: [],
    queryParams: [],
    bodyParams: [
      "query",
      "filter",
      "sorts",
      "start_cursor",
      "page_size",
      "verbose",
      "include_deleted"
    ],
    path: () => `agents/query`
  };
  agents.querySessionEvents = {
    method: "post",
    pathParams: ["session_id"],
    queryParams: [],
    bodyParams: ["filter", "sorts", "start_cursor", "page_size"],
    path: (p) => `sessions/${p.session_id}/events/query`
  };
  agents.querySessions = {
    method: "post",
    pathParams: [],
    queryParams: [],
    bodyParams: ["query", "filter", "sorts", "start_cursor", "page_size"],
    path: () => `sessions/query`
  };
  agents.queryThreadMessages = {
    method: "post",
    pathParams: ["thread_id"],
    queryParams: [],
    bodyParams: ["verbose", "start_cursor", "page_size"],
    path: (p) => `threads/${p.thread_id}/messages/query`
  };
  agents.queryThreads = {
    method: "post",
    pathParams: ["agent_id"],
    queryParams: [],
    bodyParams: ["query", "filter", "sorts", "start_cursor", "page_size"],
    path: (p) => `agents/${p.agent_id}/threads/query`
  };
  agents.retrieveSession = {
    method: "get",
    pathParams: ["session_id"],
    queryParams: [],
    bodyParams: [],
    path: (p) => `sessions/${p.session_id}`
  };
  agents.sendExternalAgentStubSessionMessage = {
    method: "post",
    pathParams: ["agent_id", "session_id"],
    queryParams: [],
    bodyParams: ["message", "client_message_id"],
    path: (p) => `external_agent_stub/${p.agent_id}/sessions/${p.session_id}/messages`
  };
  agents.startExternalAgentStubSession = {
    method: "post",
    pathParams: ["agent_id"],
    queryParams: [],
    bodyParams: [
      "spec_version",
      "client_reference_id",
      "configs",
      "model",
      "cwd",
      "locale",
      "system_prompt"
    ],
    path: (p) => `external_agent_stub/${p.agent_id}/sessions`
  };
  agents.updateAgentCreditLimit = {
    method: "patch",
    pathParams: ["agent_id"],
    queryParams: [],
    bodyParams: ["credit_limit"],
    path: (p) => `agents/${p.agent_id}/credit_limit`
  };
  agents.updateAgentStatus = {
    method: "patch",
    pathParams: ["agent_id"],
    queryParams: [],
    bodyParams: ["status"],
    path: (p) => `agents/${p.agent_id}/status`
  };
  agents.updateSession = {
    method: "post",
    pathParams: [],
    queryParams: [],
    bodyParams: [
      "message",
      "agent_id",
      "session_id",
      "attachments",
      "metadata",
      "prompt_context",
      "actions",
      "continue_from"
    ],
    path: () => `sessions`
  };
  return agents;
}
var asyncTasks = {};
var hasRequiredAsyncTasks;
function requireAsyncTasks() {
  if (hasRequiredAsyncTasks) return asyncTasks;
  hasRequiredAsyncTasks = 1;
  Object.defineProperty(asyncTasks, "__esModule", { value: true });
  asyncTasks.getAsyncTask = void 0;
  asyncTasks.getAsyncTask = {
    method: "get",
    pathParams: ["task_id"],
    queryParams: [],
    bodyParams: [],
    path: (p) => `async_tasks/${p.task_id}`
  };
  return asyncTasks;
}
var blocks = {};
var hasRequiredBlocks;
function requireBlocks() {
  if (hasRequiredBlocks) return blocks;
  hasRequiredBlocks = 1;
  Object.defineProperty(blocks, "__esModule", { value: true });
  blocks.appendBlockChildren = blocks.listBlockChildren = blocks.deleteBlock = blocks.updateBlock = blocks.getBlock = void 0;
  blocks.getBlock = {
    method: "get",
    pathParams: ["block_id"],
    queryParams: [],
    bodyParams: [],
    path: (p) => `blocks/${p.block_id}`
  };
  blocks.updateBlock = {
    method: "patch",
    pathParams: ["block_id"],
    queryParams: [],
    bodyParams: [
      "archived",
      "embed",
      "type",
      "in_trash",
      "bookmark",
      "image",
      "video",
      "pdf",
      "file",
      "audio",
      "code",
      "equation",
      "divider",
      "breadcrumb",
      "tab",
      "table_of_contents",
      "link_to_page",
      "table_row",
      "heading_1",
      "heading_2",
      "heading_3",
      "heading_4",
      "paragraph",
      "bulleted_list_item",
      "numbered_list_item",
      "quote",
      "to_do",
      "toggle",
      "template",
      "callout",
      "synced_block",
      "table",
      "column"
    ],
    path: (p) => `blocks/${p.block_id}`
  };
  blocks.deleteBlock = {
    method: "delete",
    pathParams: ["block_id"],
    queryParams: [],
    bodyParams: [],
    path: (p) => `blocks/${p.block_id}`
  };
  blocks.listBlockChildren = {
    method: "get",
    pathParams: ["block_id"],
    queryParams: ["start_cursor", "page_size"],
    bodyParams: [],
    path: (p) => `blocks/${p.block_id}/children`
  };
  blocks.appendBlockChildren = {
    method: "patch",
    pathParams: ["block_id"],
    queryParams: [],
    bodyParams: ["after", "children", "position"],
    path: (p) => `blocks/${p.block_id}/children`
  };
  return blocks;
}
var comments = {};
var hasRequiredComments;
function requireComments() {
  if (hasRequiredComments) return comments;
  hasRequiredComments = 1;
  Object.defineProperty(comments, "__esModule", { value: true });
  comments.deleteComment = comments.updateComment = comments.getComment = comments.listComments = comments.createComment = void 0;
  comments.createComment = {
    method: "post",
    pathParams: [],
    queryParams: [],
    bodyParams: [
      "attachments",
      "display_name",
      "parent",
      "rich_text",
      "markdown",
      "discussion_id"
    ],
    path: () => `comments`
  };
  comments.listComments = {
    method: "get",
    pathParams: [],
    queryParams: ["block_id", "start_cursor", "page_size"],
    bodyParams: [],
    path: () => `comments`
  };
  comments.getComment = {
    method: "get",
    pathParams: ["comment_id"],
    queryParams: [],
    bodyParams: [],
    path: (p) => `comments/${p.comment_id}`
  };
  comments.updateComment = {
    method: "patch",
    pathParams: ["comment_id"],
    queryParams: [],
    bodyParams: ["rich_text", "markdown"],
    path: (p) => `comments/${p.comment_id}`
  };
  comments.deleteComment = {
    method: "delete",
    pathParams: ["comment_id"],
    queryParams: [],
    bodyParams: [],
    path: (p) => `comments/${p.comment_id}`
  };
  return comments;
}
var common = {};
var hasRequiredCommon;
function requireCommon() {
  if (hasRequiredCommon) return common;
  hasRequiredCommon = 1;
  Object.defineProperty(common, "__esModule", { value: true });
  return common;
}
var customEmojis = {};
var hasRequiredCustomEmojis;
function requireCustomEmojis() {
  if (hasRequiredCustomEmojis) return customEmojis;
  hasRequiredCustomEmojis = 1;
  Object.defineProperty(customEmojis, "__esModule", { value: true });
  customEmojis.listCustomEmojis = void 0;
  customEmojis.listCustomEmojis = {
    method: "get",
    pathParams: [],
    queryParams: ["start_cursor", "page_size", "name"],
    bodyParams: [],
    path: () => `custom_emojis`
  };
  return customEmojis;
}
var dataSources = {};
var hasRequiredDataSources;
function requireDataSources() {
  if (hasRequiredDataSources) return dataSources;
  hasRequiredDataSources = 1;
  Object.defineProperty(dataSources, "__esModule", { value: true });
  dataSources.listDataSourceTemplates = dataSources.createDataSource = dataSources.queryDataSource = dataSources.updateDataSource = dataSources.getDataSource = void 0;
  dataSources.getDataSource = {
    method: "get",
    pathParams: ["data_source_id"],
    queryParams: [],
    bodyParams: [],
    path: (p) => `data_sources/${p.data_source_id}`
  };
  dataSources.updateDataSource = {
    method: "patch",
    pathParams: ["data_source_id"],
    queryParams: [],
    bodyParams: ["archived", "title", "icon", "properties", "in_trash", "parent"],
    path: (p) => `data_sources/${p.data_source_id}`
  };
  dataSources.queryDataSource = {
    method: "post",
    pathParams: ["data_source_id"],
    queryParams: ["filter_properties"],
    bodyParams: [
      "archived",
      "sorts",
      "filter",
      "start_cursor",
      "page_size",
      "in_trash",
      "result_type"
    ],
    path: (p) => `data_sources/${p.data_source_id}/query`
  };
  dataSources.createDataSource = {
    method: "post",
    pathParams: [],
    queryParams: [],
    bodyParams: ["parent", "properties", "title", "icon"],
    path: () => `data_sources`
  };
  dataSources.listDataSourceTemplates = {
    method: "get",
    pathParams: ["data_source_id"],
    queryParams: ["name", "start_cursor", "page_size"],
    bodyParams: [],
    path: (p) => `data_sources/${p.data_source_id}/templates`
  };
  return dataSources;
}
var databases = {};
var hasRequiredDatabases;
function requireDatabases() {
  if (hasRequiredDatabases) return databases;
  hasRequiredDatabases = 1;
  Object.defineProperty(databases, "__esModule", { value: true });
  databases.createDatabase = databases.updateDatabase = databases.getDatabase = void 0;
  databases.getDatabase = {
    method: "get",
    pathParams: ["database_id"],
    queryParams: [],
    bodyParams: [],
    path: (p) => `databases/${p.database_id}`
  };
  databases.updateDatabase = {
    method: "patch",
    pathParams: ["database_id"],
    queryParams: [],
    bodyParams: [
      "parent",
      "title",
      "description",
      "is_inline",
      "icon",
      "cover",
      "in_trash",
      "is_locked"
    ],
    path: (p) => `databases/${p.database_id}`
  };
  databases.createDatabase = {
    method: "post",
    pathParams: [],
    queryParams: [],
    bodyParams: [
      "parent",
      "title",
      "description",
      "is_inline",
      "initial_data_source",
      "icon",
      "cover"
    ],
    path: () => `databases`
  };
  return databases;
}
var fileUploads = {};
var hasRequiredFileUploads;
function requireFileUploads() {
  if (hasRequiredFileUploads) return fileUploads;
  hasRequiredFileUploads = 1;
  Object.defineProperty(fileUploads, "__esModule", { value: true });
  fileUploads.getFileUpload = fileUploads.completeFileUpload = fileUploads.sendFileUpload = fileUploads.listFileUploads = fileUploads.createFileUpload = void 0;
  fileUploads.createFileUpload = {
    method: "post",
    pathParams: [],
    queryParams: [],
    bodyParams: [
      "mode",
      "filename",
      "content_type",
      "number_of_parts",
      "external_url"
    ],
    path: () => `file_uploads`
  };
  fileUploads.listFileUploads = {
    method: "get",
    pathParams: [],
    queryParams: ["status", "start_cursor", "page_size"],
    bodyParams: [],
    path: () => `file_uploads`
  };
  fileUploads.sendFileUpload = {
    method: "post",
    pathParams: ["file_upload_id"],
    queryParams: [],
    bodyParams: [],
    formDataParams: ["file", "part_number"],
    path: (p) => `file_uploads/${p.file_upload_id}/send`
  };
  fileUploads.completeFileUpload = {
    method: "post",
    pathParams: ["file_upload_id"],
    queryParams: [],
    bodyParams: [],
    path: (p) => `file_uploads/${p.file_upload_id}/complete`
  };
  fileUploads.getFileUpload = {
    method: "get",
    pathParams: ["file_upload_id"],
    queryParams: [],
    bodyParams: [],
    path: (p) => `file_uploads/${p.file_upload_id}`
  };
  return fileUploads;
}
var meetingNotes$1 = {};
var hasRequiredMeetingNotes$1;
function requireMeetingNotes$1() {
  if (hasRequiredMeetingNotes$1) return meetingNotes$1;
  hasRequiredMeetingNotes$1 = 1;
  Object.defineProperty(meetingNotes$1, "__esModule", { value: true });
  meetingNotes$1.queryMeetingNotes = meetingNotes$1.createMeetingNote = void 0;
  meetingNotes$1.createMeetingNote = {
    method: "post",
    pathParams: [],
    queryParams: [],
    bodyParams: ["title", "language", "options", "source", "parent"],
    path: () => `blocks/meeting_notes`
  };
  meetingNotes$1.queryMeetingNotes = {
    method: "post",
    pathParams: [],
    queryParams: [],
    bodyParams: ["filter", "sort", "limit"],
    path: () => `blocks/meeting_notes/query`
  };
  return meetingNotes$1;
}
var oauth = {};
var hasRequiredOauth;
function requireOauth() {
  if (hasRequiredOauth) return oauth;
  hasRequiredOauth = 1;
  Object.defineProperty(oauth, "__esModule", { value: true });
  oauth.oauthIntrospect = oauth.oauthRevoke = oauth.oauthToken = void 0;
  oauth.oauthToken = {
    method: "post",
    pathParams: [],
    queryParams: [],
    bodyParams: [
      "grant_type",
      "code",
      "redirect_uri",
      "external_account",
      "refresh_token"
    ],
    path: () => `oauth/token`
  };
  oauth.oauthRevoke = {
    method: "post",
    pathParams: [],
    queryParams: [],
    bodyParams: ["token"],
    path: () => `oauth/revoke`
  };
  oauth.oauthIntrospect = {
    method: "post",
    pathParams: [],
    queryParams: [],
    bodyParams: ["token"],
    path: () => `oauth/introspect`
  };
  return oauth;
}
var pages = {};
var hasRequiredPages;
function requirePages() {
  if (hasRequiredPages) return pages;
  hasRequiredPages = 1;
  Object.defineProperty(pages, "__esModule", { value: true });
  pages.updatePageMarkdown = pages.getPageMarkdown = pages.getPageProperty = pages.movePage = pages.updatePage = pages.getPage = pages.createPage = void 0;
  pages.createPage = {
    method: "post",
    pathParams: [],
    queryParams: ["filter_properties"],
    bodyParams: [
      "parent",
      "properties",
      "icon",
      "cover",
      "content",
      "children",
      "markdown",
      "allow_async",
      "template",
      "position"
    ],
    path: () => `pages`
  };
  pages.getPage = {
    method: "get",
    pathParams: ["page_id"],
    queryParams: ["filter_properties"],
    bodyParams: [],
    path: (p) => `pages/${p.page_id}`
  };
  pages.updatePage = {
    method: "patch",
    pathParams: ["page_id"],
    queryParams: ["filter_properties"],
    bodyParams: [
      "archived",
      "properties",
      "icon",
      "cover",
      "is_locked",
      "template",
      "erase_content",
      "in_trash",
      "is_archived"
    ],
    path: (p) => `pages/${p.page_id}`
  };
  pages.movePage = {
    method: "post",
    pathParams: ["page_id"],
    queryParams: [],
    bodyParams: ["parent"],
    path: (p) => `pages/${p.page_id}/move`
  };
  pages.getPageProperty = {
    method: "get",
    pathParams: ["page_id", "property_id"],
    queryParams: ["start_cursor", "page_size"],
    bodyParams: [],
    path: (p) => `pages/${p.page_id}/properties/${p.property_id}`
  };
  pages.getPageMarkdown = {
    method: "get",
    pathParams: ["page_id"],
    queryParams: ["include_transcript"],
    bodyParams: [],
    path: (p) => `pages/${p.page_id}/markdown`
  };
  pages.updatePageMarkdown = {
    method: "patch",
    pathParams: ["page_id"],
    queryParams: [],
    bodyParams: [
      "allow_async",
      "type",
      "insert_content",
      "replace_content_range",
      "update_content",
      "replace_content"
    ],
    path: (p) => `pages/${p.page_id}/markdown`
  };
  return pages;
}
var search = {};
var hasRequiredSearch;
function requireSearch() {
  if (hasRequiredSearch) return search;
  hasRequiredSearch = 1;
  Object.defineProperty(search, "__esModule", { value: true });
  search.search = void 0;
  search.search = {
    method: "post",
    pathParams: [],
    queryParams: [],
    bodyParams: ["sort", "query", "start_cursor", "page_size", "filter"],
    path: () => `search`
  };
  return search;
}
var users = {};
var hasRequiredUsers;
function requireUsers() {
  if (hasRequiredUsers) return users;
  hasRequiredUsers = 1;
  Object.defineProperty(users, "__esModule", { value: true });
  users.listUsers = users.getUser = users.getSelf = void 0;
  users.getSelf = {
    method: "get",
    pathParams: [],
    queryParams: [],
    bodyParams: [],
    path: () => `users/me`
  };
  users.getUser = {
    method: "get",
    pathParams: ["user_id"],
    queryParams: [],
    bodyParams: [],
    path: (p) => `users/${p.user_id}`
  };
  users.listUsers = {
    method: "get",
    pathParams: [],
    queryParams: ["start_cursor", "page_size"],
    bodyParams: [],
    path: () => `users`
  };
  return users;
}
var views = {};
var hasRequiredViews;
function requireViews() {
  if (hasRequiredViews) return views;
  hasRequiredViews = 1;
  Object.defineProperty(views, "__esModule", { value: true });
  views.deleteViewQuery = views.getViewQueryResults = views.createViewQuery = views.deleteView = views.updateView = views.getView = views.createView = views.listDatabaseViews = void 0;
  views.listDatabaseViews = {
    method: "get",
    pathParams: [],
    queryParams: ["database_id", "data_source_id", "start_cursor", "page_size"],
    bodyParams: [],
    path: () => `views`
  };
  views.createView = {
    method: "post",
    pathParams: [],
    queryParams: [],
    bodyParams: [],
    path: () => `views`
  };
  views.getView = {
    method: "get",
    pathParams: ["view_id"],
    queryParams: [],
    bodyParams: [],
    path: (p) => `views/${p.view_id}`
  };
  views.updateView = {
    method: "patch",
    pathParams: ["view_id"],
    queryParams: [],
    bodyParams: [],
    path: (p) => `views/${p.view_id}`
  };
  views.deleteView = {
    method: "delete",
    pathParams: ["view_id"],
    queryParams: [],
    bodyParams: [],
    path: (p) => `views/${p.view_id}`
  };
  views.createViewQuery = {
    method: "post",
    pathParams: ["view_id"],
    queryParams: [],
    bodyParams: [],
    path: (p) => `views/${p.view_id}/queries`
  };
  views.getViewQueryResults = {
    method: "get",
    pathParams: ["view_id", "query_id"],
    queryParams: ["start_cursor", "page_size"],
    bodyParams: [],
    path: (p) => `views/${p.view_id}/queries/${p.query_id}`
  };
  views.deleteViewQuery = {
    method: "delete",
    pathParams: ["view_id", "query_id"],
    queryParams: [],
    bodyParams: [],
    path: (p) => `views/${p.view_id}/queries/${p.query_id}`
  };
  return views;
}
var webhooks$1 = {};
var hasRequiredWebhooks$1;
function requireWebhooks$1() {
  if (hasRequiredWebhooks$1) return webhooks$1;
  hasRequiredWebhooks$1 = 1;
  Object.defineProperty(webhooks$1, "__esModule", { value: true });
  return webhooks$1;
}
var hasRequiredApiEndpoints;
function requireApiEndpoints() {
  if (hasRequiredApiEndpoints) return apiEndpoints;
  hasRequiredApiEndpoints = 1;
  (function(exports) {
    var __createBinding = apiEndpoints && apiEndpoints.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = apiEndpoints && apiEndpoints.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(requireAgents(), exports);
    __exportStar(requireAsyncTasks(), exports);
    __exportStar(requireBlocks(), exports);
    __exportStar(requireComments(), exports);
    __exportStar(requireCommon(), exports);
    __exportStar(requireCustomEmojis(), exports);
    __exportStar(requireDataSources(), exports);
    __exportStar(requireDatabases(), exports);
    __exportStar(requireFileUploads(), exports);
    __exportStar(requireMeetingNotes$1(), exports);
    __exportStar(requireOauth(), exports);
    __exportStar(requirePages(), exports);
    __exportStar(requireSearch(), exports);
    __exportStar(requireUsers(), exports);
    __exportStar(requireViews(), exports);
    __exportStar(requireWebhooks$1(), exports);
  })(apiEndpoints);
  return apiEndpoints;
}
const name = "@notionhq/client";
const version = "5.26.0";
const require$$6 = {
  name,
  version
};
var hasRequiredClient;
function requireClient() {
  if (hasRequiredClient) return Client;
  hasRequiredClient = 1;
  var __classPrivateFieldSet = Client && Client.__classPrivateFieldSet || function(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
  };
  var __classPrivateFieldGet = Client && Client.__classPrivateFieldGet || function(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
  };
  var _Client_auth, _Client_logLevel, _Client_logger, _Client_prefixUrl, _Client_timeoutMs, _Client_notionVersion, _Client_fetch, _Client_agent, _Client_userAgent, _Client_maxRetries, _Client_initialRetryDelayMs, _Client_maxRetryDelayMs;
  Object.defineProperty(Client, "__esModule", { value: true });
  const logging_1 = requireLogging();
  const errors_1 = requireErrors();
  const utils_1 = requireUtils();
  const constants_1 = requireConstants();
  const api_endpoints_1 = requireApiEndpoints();
  const meeting_notes_1 = requireMeetingNotes$1();
  const package_json_1 = require$$6;
  const START_CURSOR_PARAM_NAME = "start_cursor";
  let Client$1 = class Client2 {
    constructor(options) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
      _Client_auth.set(this, void 0);
      _Client_logLevel.set(this, void 0);
      _Client_logger.set(this, void 0);
      _Client_prefixUrl.set(this, void 0);
      _Client_timeoutMs.set(this, void 0);
      _Client_notionVersion.set(this, void 0);
      _Client_fetch.set(this, void 0);
      _Client_agent.set(this, void 0);
      _Client_userAgent.set(this, void 0);
      _Client_maxRetries.set(this, void 0);
      _Client_initialRetryDelayMs.set(this, void 0);
      _Client_maxRetryDelayMs.set(this, void 0);
      this.agents = {
        /**
         * Retrieve an agent
         */
        retrieve: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.getAgent);
          return this.request({
            path: api_endpoints_1.getAgent.path(args),
            method: api_endpoints_1.getAgent.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.getAgent.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.getAgent.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Query agents
         */
        query: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.queryAgents);
          return this.request({
            path: api_endpoints_1.queryAgents.path(),
            method: api_endpoints_1.queryAgents.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.queryAgents.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.queryAgents.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Retrieve agent insights
         */
        retrieveInsights: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.getInsights);
          return this.request({
            path: api_endpoints_1.getInsights.path(args),
            method: api_endpoints_1.getInsights.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.getInsights.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.getInsights.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Update an agent's credit limit
         */
        updateCreditLimit: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.updateAgentCreditLimit);
          return this.request({
            path: api_endpoints_1.updateAgentCreditLimit.path(args),
            method: api_endpoints_1.updateAgentCreditLimit.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.updateAgentCreditLimit.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.updateAgentCreditLimit.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Update an agent's status
         */
        updateStatus: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.updateAgentStatus);
          return this.request({
            path: api_endpoints_1.updateAgentStatus.path(args),
            method: api_endpoints_1.updateAgentStatus.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.updateAgentStatus.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.updateAgentStatus.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Delete an agent
         */
        delete: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.deleteAgent);
          return this.request({
            path: api_endpoints_1.deleteAgent.path(args),
            method: api_endpoints_1.deleteAgent.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.deleteAgent.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.deleteAgent.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Apply many agent operations
         */
        batch: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.agentBatch);
          return this.request({
            path: api_endpoints_1.agentBatch.path(),
            method: api_endpoints_1.agentBatch.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.agentBatch.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.agentBatch.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        }
      };
      this.sessions = {
        /**
         * Retrieve a session
         */
        retrieve: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.retrieveSession);
          return this.request({
            path: api_endpoints_1.retrieveSession.path(args),
            method: api_endpoints_1.retrieveSession.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.retrieveSession.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.retrieveSession.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Update a session
         */
        update: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.updateSession);
          return this.request({
            path: api_endpoints_1.updateSession.path(),
            method: api_endpoints_1.updateSession.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.updateSession.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.updateSession.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Open a session stream
         */
        stream: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.updateSessionStream);
          return this.streamRequest({
            path: api_endpoints_1.updateSessionStream.path(),
            method: api_endpoints_1.updateSessionStream.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.updateSessionStream.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.updateSessionStream.bodyParams),
            headers: api_endpoints_1.updateSessionStream.headers,
            auth: args === null || args === void 0 ? void 0 : args.auth
          }, parseSessionStreamEvent);
        },
        /**
         * Cancel a session
         */
        cancel: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.cancelSession);
          return this.request({
            path: api_endpoints_1.cancelSession.path(args),
            method: api_endpoints_1.cancelSession.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.cancelSession.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.cancelSession.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Query sessions
         */
        query: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.querySessions);
          return this.request({
            path: api_endpoints_1.querySessions.path(),
            method: api_endpoints_1.querySessions.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.querySessions.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.querySessions.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Query session events
         */
        queryEvents: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.querySessionEvents);
          return this.request({
            path: api_endpoints_1.querySessionEvents.path(args),
            method: api_endpoints_1.querySessionEvents.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.querySessionEvents.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.querySessionEvents.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        }
      };
      this.asyncTasks = {
        /**
         * Retrieve an async task
         */
        retrieve: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.getAsyncTask);
          return this.request({
            path: api_endpoints_1.getAsyncTask.path(args),
            method: api_endpoints_1.getAsyncTask.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.getAsyncTask.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.getAsyncTask.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        }
      };
      this.blocks = {
        /**
         * Retrieve block
         */
        retrieve: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.getBlock);
          return this.request({
            path: api_endpoints_1.getBlock.path(args),
            method: api_endpoints_1.getBlock.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.getBlock.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.getBlock.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Update block
         */
        update: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.updateBlock);
          return this.request({
            path: api_endpoints_1.updateBlock.path(args),
            method: api_endpoints_1.updateBlock.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.updateBlock.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.updateBlock.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Delete block
         */
        delete: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.deleteBlock);
          return this.request({
            path: api_endpoints_1.deleteBlock.path(args),
            method: api_endpoints_1.deleteBlock.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.deleteBlock.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.deleteBlock.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        children: {
          /**
           * Append block children
           */
          append: (args) => {
            this.warnUnknownParams(args, api_endpoints_1.appendBlockChildren);
            return this.request({
              path: api_endpoints_1.appendBlockChildren.path(args),
              method: api_endpoints_1.appendBlockChildren.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.appendBlockChildren.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.appendBlockChildren.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          },
          /**
           * Retrieve block children
           */
          list: (args) => {
            this.warnUnknownParams(args, api_endpoints_1.listBlockChildren);
            return this.request({
              path: api_endpoints_1.listBlockChildren.path(args),
              method: api_endpoints_1.listBlockChildren.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.listBlockChildren.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.listBlockChildren.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          }
        },
        meetingNotes: {
          /**
           * Create a meeting note
           */
          create: (args) => {
            this.warnUnknownParams(args, meeting_notes_1.createMeetingNote);
            return this.request({
              path: meeting_notes_1.createMeetingNote.path(),
              method: meeting_notes_1.createMeetingNote.method,
              query: (0, utils_1.pick)(args, meeting_notes_1.createMeetingNote.queryParams),
              body: (0, utils_1.pick)(args, meeting_notes_1.createMeetingNote.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          },
          /**
           * Query meeting notes
           */
          query: (args) => {
            return this.request({
              path: meeting_notes_1.queryMeetingNotes.path(),
              method: meeting_notes_1.queryMeetingNotes.method,
              query: (0, utils_1.pick)(args, meeting_notes_1.queryMeetingNotes.queryParams),
              body: (0, utils_1.pick)(args, meeting_notes_1.queryMeetingNotes.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          }
        }
      };
      this.databases = {
        /**
         * Retrieve a database
         */
        retrieve: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.getDatabase);
          return this.request({
            path: api_endpoints_1.getDatabase.path(args),
            method: api_endpoints_1.getDatabase.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.getDatabase.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.getDatabase.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Create a database
         */
        create: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.createDatabase);
          return this.request({
            path: api_endpoints_1.createDatabase.path(),
            method: api_endpoints_1.createDatabase.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.createDatabase.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.createDatabase.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Update a database
         */
        update: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.updateDatabase);
          return this.request({
            path: api_endpoints_1.updateDatabase.path(args),
            method: api_endpoints_1.updateDatabase.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.updateDatabase.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.updateDatabase.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        }
      };
      this.dataSources = {
        /**
         * Retrieve a data source
         */
        retrieve: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.getDataSource);
          return this.request({
            path: api_endpoints_1.getDataSource.path(args),
            method: api_endpoints_1.getDataSource.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.getDataSource.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.getDataSource.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Query a data source
         */
        query: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.queryDataSource);
          return this.request({
            path: api_endpoints_1.queryDataSource.path(args),
            method: api_endpoints_1.queryDataSource.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.queryDataSource.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.queryDataSource.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Create a data source
         */
        create: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.createDataSource);
          return this.request({
            path: api_endpoints_1.createDataSource.path(),
            method: api_endpoints_1.createDataSource.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.createDataSource.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.createDataSource.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Update a data source
         */
        update: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.updateDataSource);
          return this.request({
            path: api_endpoints_1.updateDataSource.path(args),
            method: api_endpoints_1.updateDataSource.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.updateDataSource.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.updateDataSource.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * List page templates that are available for a data source
         */
        listTemplates: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.listDataSourceTemplates);
          return this.request({
            path: api_endpoints_1.listDataSourceTemplates.path(args),
            method: api_endpoints_1.listDataSourceTemplates.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.listDataSourceTemplates.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.listDataSourceTemplates.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        }
      };
      this.pages = {
        /**
         * Create a page
         */
        create: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.createPage);
          return this.request({
            path: api_endpoints_1.createPage.path(),
            method: api_endpoints_1.createPage.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.createPage.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.createPage.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Retrieve a page
         */
        retrieve: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.getPage);
          return this.request({
            path: api_endpoints_1.getPage.path(args),
            method: api_endpoints_1.getPage.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.getPage.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.getPage.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Update page properties
         */
        update: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.updatePage);
          return this.request({
            path: api_endpoints_1.updatePage.path(args),
            method: api_endpoints_1.updatePage.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.updatePage.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.updatePage.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Move a page
         */
        move: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.movePage);
          return this.request({
            path: api_endpoints_1.movePage.path(args),
            method: api_endpoints_1.movePage.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.movePage.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.movePage.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Retrieve a page as markdown
         */
        retrieveMarkdown: (args) => {
          return this.request({
            path: api_endpoints_1.getPageMarkdown.path(args),
            method: api_endpoints_1.getPageMarkdown.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.getPageMarkdown.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.getPageMarkdown.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Update a page's content as markdown
         */
        updateMarkdown: (args) => {
          return this.request({
            path: api_endpoints_1.updatePageMarkdown.path(args),
            method: api_endpoints_1.updatePageMarkdown.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.updatePageMarkdown.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.updatePageMarkdown.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        properties: {
          /**
           * Retrieve page property
           */
          retrieve: (args) => {
            this.warnUnknownParams(args, api_endpoints_1.getPageProperty);
            return this.request({
              path: api_endpoints_1.getPageProperty.path(args),
              method: api_endpoints_1.getPageProperty.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.getPageProperty.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.getPageProperty.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          }
        }
      };
      this.users = {
        /**
         * Retrieve a user
         */
        retrieve: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.getUser);
          return this.request({
            path: api_endpoints_1.getUser.path(args),
            method: api_endpoints_1.getUser.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.getUser.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.getUser.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * List all users
         */
        list: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.listUsers);
          return this.request({
            path: api_endpoints_1.listUsers.path(),
            method: api_endpoints_1.listUsers.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.listUsers.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.listUsers.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Get details about bot
         */
        me: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.getSelf);
          return this.request({
            path: api_endpoints_1.getSelf.path(),
            method: api_endpoints_1.getSelf.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.getSelf.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.getSelf.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        }
      };
      this.customEmojis = {
        /**
         * List custom emojis
         */
        list: (args) => {
          this.warnUnknownParams(args !== null && args !== void 0 ? args : {}, api_endpoints_1.listCustomEmojis);
          return this.request({
            path: api_endpoints_1.listCustomEmojis.path(),
            method: api_endpoints_1.listCustomEmojis.method,
            query: (0, utils_1.pick)(args !== null && args !== void 0 ? args : {}, api_endpoints_1.listCustomEmojis.queryParams),
            body: (0, utils_1.pick)(args !== null && args !== void 0 ? args : {}, api_endpoints_1.listCustomEmojis.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        }
      };
      this.comments = {
        /**
         * Create a comment
         */
        create: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.createComment);
          return this.request({
            path: api_endpoints_1.createComment.path(),
            method: api_endpoints_1.createComment.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.createComment.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.createComment.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * List comments
         */
        list: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.listComments);
          return this.request({
            path: api_endpoints_1.listComments.path(),
            method: api_endpoints_1.listComments.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.listComments.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.listComments.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Retrieve a comment
         */
        retrieve: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.getComment);
          return this.request({
            path: api_endpoints_1.getComment.path(args),
            method: api_endpoints_1.getComment.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.getComment.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.getComment.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Update a comment
         */
        update: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.updateComment);
          return this.request({
            path: api_endpoints_1.updateComment.path(args),
            method: api_endpoints_1.updateComment.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.updateComment.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.updateComment.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Delete a comment
         */
        delete: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.deleteComment);
          return this.request({
            path: api_endpoints_1.deleteComment.path(args),
            method: api_endpoints_1.deleteComment.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.deleteComment.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.deleteComment.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        }
      };
      this.fileUploads = {
        /**
         * Create a file upload
         */
        create: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.createFileUpload);
          return this.request({
            path: api_endpoints_1.createFileUpload.path(),
            method: api_endpoints_1.createFileUpload.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.createFileUpload.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.createFileUpload.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Retrieve a file upload
         */
        retrieve: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.getFileUpload);
          return this.request({
            path: api_endpoints_1.getFileUpload.path(args),
            method: api_endpoints_1.getFileUpload.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.getFileUpload.queryParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * List file uploads
         */
        list: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.listFileUploads);
          return this.request({
            path: api_endpoints_1.listFileUploads.path(),
            method: api_endpoints_1.listFileUploads.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.listFileUploads.queryParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Send a file upload
         *
         * Requires a `file_upload_id`, obtained from the `id` of the Create File
         * Upload API response.
         *
         * The `file` parameter contains the raw file contents or Blob/File object
         * under `file.data`, and an optional `file.filename` string.
         *
         * Supply a stringified `part_number` parameter when using file uploads
         * in multi-part mode.
         *
         * This endpoint sends HTTP multipart/form-data instead of JSON parameters.
         */
        send: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.sendFileUpload);
          return this.request({
            path: api_endpoints_1.sendFileUpload.path(args),
            method: api_endpoints_1.sendFileUpload.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.sendFileUpload.queryParams),
            formDataParams: (0, utils_1.pick)(args, api_endpoints_1.sendFileUpload.formDataParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Complete a file upload
         */
        complete: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.completeFileUpload);
          return this.request({
            path: api_endpoints_1.completeFileUpload.path(args),
            method: api_endpoints_1.completeFileUpload.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.completeFileUpload.queryParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        }
      };
      this.views = {
        /**
         * Create a view
         */
        create: (args) => {
          return this.request({
            path: api_endpoints_1.createView.path(),
            method: api_endpoints_1.createView.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.createView.queryParams),
            body: (0, utils_1.pick)(args, [
              "data_source_id",
              "name",
              "type",
              "database_id",
              "view_id",
              "filter",
              "sorts",
              "quick_filters",
              "create_database",
              "configuration",
              "position",
              "placement"
            ]),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Retrieve a view
         */
        retrieve: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.getView);
          return this.request({
            path: api_endpoints_1.getView.path(args),
            method: api_endpoints_1.getView.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.getView.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.getView.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Update a view
         */
        update: (args) => {
          return this.request({
            path: api_endpoints_1.updateView.path(args),
            method: api_endpoints_1.updateView.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.updateView.queryParams),
            body: (0, utils_1.pick)(args, [
              "name",
              "filter",
              "sorts",
              "quick_filters",
              "configuration"
            ]),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * Delete a view
         */
        delete: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.deleteView);
          return this.request({
            path: api_endpoints_1.deleteView.path(args),
            method: api_endpoints_1.deleteView.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.deleteView.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.deleteView.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        /**
         * List views for a database
         */
        list: (args) => {
          this.warnUnknownParams(args, api_endpoints_1.listDatabaseViews);
          return this.request({
            path: api_endpoints_1.listDatabaseViews.path(),
            method: api_endpoints_1.listDatabaseViews.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.listDatabaseViews.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.listDatabaseViews.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        },
        queries: {
          /**
           * Create a view query
           */
          create: (args) => {
            return this.request({
              path: api_endpoints_1.createViewQuery.path(args),
              method: api_endpoints_1.createViewQuery.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.createViewQuery.queryParams),
              body: (0, utils_1.pick)(args, ["page_size"]),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          },
          /**
           * Get view query results
           */
          results: (args) => {
            this.warnUnknownParams(args, api_endpoints_1.getViewQueryResults);
            return this.request({
              path: api_endpoints_1.getViewQueryResults.path(args),
              method: api_endpoints_1.getViewQueryResults.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.getViewQueryResults.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.getViewQueryResults.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          },
          /**
           * Delete a view query
           */
          delete: (args) => {
            this.warnUnknownParams(args, api_endpoints_1.deleteViewQuery);
            return this.request({
              path: api_endpoints_1.deleteViewQuery.path(args),
              method: api_endpoints_1.deleteViewQuery.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.deleteViewQuery.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.deleteViewQuery.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          }
        }
      };
      this.search = (args) => {
        this.warnUnknownParams(args, api_endpoints_1.search);
        return this.request({
          path: api_endpoints_1.search.path(),
          method: api_endpoints_1.search.method,
          query: (0, utils_1.pick)(args, api_endpoints_1.search.queryParams),
          body: (0, utils_1.pick)(args, api_endpoints_1.search.bodyParams),
          auth: args === null || args === void 0 ? void 0 : args.auth
        });
      };
      this.oauth = {
        /**
         * Get token
         */
        token: (args) => {
          return this.request({
            path: api_endpoints_1.oauthToken.path(),
            method: api_endpoints_1.oauthToken.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.oauthToken.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.oauthToken.bodyParams),
            auth: {
              client_id: args.client_id,
              client_secret: args.client_secret
            }
          });
        },
        /**
         * Introspect token
         */
        introspect: (args) => {
          return this.request({
            path: api_endpoints_1.oauthIntrospect.path(),
            method: api_endpoints_1.oauthIntrospect.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.oauthIntrospect.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.oauthIntrospect.bodyParams),
            auth: {
              client_id: args.client_id,
              client_secret: args.client_secret
            }
          });
        },
        /**
         * Revoke token
         */
        revoke: (args) => {
          return this.request({
            path: api_endpoints_1.oauthRevoke.path(),
            method: api_endpoints_1.oauthRevoke.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.oauthRevoke.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.oauthRevoke.bodyParams),
            auth: {
              client_id: args.client_id,
              client_secret: args.client_secret
            }
          });
        }
      };
      __classPrivateFieldSet(this, _Client_auth, options === null || options === void 0 ? void 0 : options.auth, "f");
      __classPrivateFieldSet(this, _Client_logLevel, (_a = options === null || options === void 0 ? void 0 : options.logLevel) !== null && _a !== void 0 ? _a : logging_1.LogLevel.WARN, "f");
      __classPrivateFieldSet(this, _Client_logger, (_b = options === null || options === void 0 ? void 0 : options.logger) !== null && _b !== void 0 ? _b : (0, logging_1.makeConsoleLogger)(package_json_1.name), "f");
      __classPrivateFieldSet(this, _Client_prefixUrl, `${(_c = options === null || options === void 0 ? void 0 : options.baseUrl) !== null && _c !== void 0 ? _c : constants_1.DEFAULT_BASE_URL}/v1/`, "f");
      __classPrivateFieldSet(this, _Client_timeoutMs, (_d = options === null || options === void 0 ? void 0 : options.timeoutMs) !== null && _d !== void 0 ? _d : constants_1.DEFAULT_TIMEOUT_MS, "f");
      __classPrivateFieldSet(this, _Client_notionVersion, (_e = options === null || options === void 0 ? void 0 : options.notionVersion) !== null && _e !== void 0 ? _e : Client2.defaultNotionVersion, "f");
      __classPrivateFieldSet(this, _Client_fetch, (_f = options === null || options === void 0 ? void 0 : options.fetch) !== null && _f !== void 0 ? _f : fetch.bind(globalThis), "f");
      __classPrivateFieldSet(this, _Client_agent, options === null || options === void 0 ? void 0 : options.agent, "f");
      __classPrivateFieldSet(this, _Client_userAgent, `notionhq-client/${package_json_1.version}`, "f");
      if ((options === null || options === void 0 ? void 0 : options.retry) === false) {
        __classPrivateFieldSet(this, _Client_maxRetries, 0, "f");
        __classPrivateFieldSet(this, _Client_initialRetryDelayMs, 0, "f");
        __classPrivateFieldSet(this, _Client_maxRetryDelayMs, 0, "f");
      } else {
        __classPrivateFieldSet(this, _Client_maxRetries, (_h = (_g = options === null || options === void 0 ? void 0 : options.retry) === null || _g === void 0 ? void 0 : _g.maxRetries) !== null && _h !== void 0 ? _h : constants_1.DEFAULT_MAX_RETRIES, "f");
        __classPrivateFieldSet(this, _Client_initialRetryDelayMs, (_k = (_j = options === null || options === void 0 ? void 0 : options.retry) === null || _j === void 0 ? void 0 : _j.initialRetryDelayMs) !== null && _k !== void 0 ? _k : constants_1.DEFAULT_INITIAL_RETRY_DELAY_MS, "f");
        __classPrivateFieldSet(this, _Client_maxRetryDelayMs, (_m = (_l = options === null || options === void 0 ? void 0 : options.retry) === null || _l === void 0 ? void 0 : _l.maxRetryDelayMs) !== null && _m !== void 0 ? _m : constants_1.DEFAULT_MAX_RETRY_DELAY_MS, "f");
      }
    }
    /**
     * Sends a request.
     */
    async request(args) {
      const { path, method, query, body, formDataParams, auth } = args;
      (0, errors_1.validateRequestPath)(path);
      this.log(logging_1.LogLevel.INFO, "request start", { method, path });
      const url = this.buildRequestUrl(path, query);
      const bodyAsJsonString = this.serializeBody(body);
      const headers = this.buildRequestHeaders(args.headers, auth, bodyAsJsonString);
      const formData = this.buildFormData(formDataParams, headers);
      return this.executeWithRetry({
        url,
        method,
        path,
        headers,
        body: bodyAsJsonString !== null && bodyAsJsonString !== void 0 ? bodyAsJsonString : formData
      }, (request) => this.executeSingleRequest(request));
    }
    /**
     * Opens an SSE response and yields each parsed event as it arrives.
     */
    async *streamRequest(args, parseEvent) {
      var _a;
      const { path, method, query, body, auth } = args;
      (0, errors_1.validateRequestPath)(path);
      this.log(logging_1.LogLevel.INFO, "stream request start", { method, path });
      const url = this.buildRequestUrl(path, query);
      const bodyAsJsonString = this.serializeBody(body);
      const headers = this.buildRequestHeaders(args.headers, auth, bodyAsJsonString);
      const response = await this.executeWithRetry({
        url,
        method,
        path,
        headers,
        body: bodyAsJsonString
      }, (request) => this.executeSingleStreamRequest(request));
      this.log(logging_1.LogLevel.INFO, "stream request opened", { method, path });
      if (response.body === void 0 || response.body === null) {
        for (const frame of takeSseFrames({
          content: await response.text(),
          complete: true
        }).frames) {
          yield parseEvent(frame);
        }
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let remaining = "";
      let complete = false;
      try {
        while (!complete) {
          const { done, value } = await reader.read();
          if (done) {
            complete = true;
            continue;
          }
          if (value === void 0) {
            throw new Error("SSE response body ended without a data chunk.");
          }
          const frames = takeSseFrames({
            content: `${remaining}${decoder.decode(value, { stream: true })}`,
            complete: false
          });
          remaining = frames.remaining;
          for (const frame of frames.frames) {
            yield parseEvent(frame);
          }
        }
        for (const frame of takeSseFrames({
          content: `${remaining}${decoder.decode()}`,
          complete: true
        }).frames) {
          yield parseEvent(frame);
        }
      } finally {
        try {
          if (!complete) {
            await ((_a = reader.cancel) === null || _a === void 0 ? void 0 : _a.call(reader));
          }
        } finally {
          reader.releaseLock();
        }
      }
    }
    /**
     * Builds the full URL with query parameters.
     */
    buildRequestUrl(path, query) {
      const url = new URL(`${__classPrivateFieldGet(this, _Client_prefixUrl, "f")}${path}`);
      if (query) {
        for (const [key, value] of Object.entries(query)) {
          if (value !== void 0 && value !== null) {
            if (Array.isArray(value)) {
              for (const val of value) {
                url.searchParams.append(key, decodeURIComponent(val));
              }
            } else {
              url.searchParams.append(key, String(value));
            }
          }
        }
      }
      return url;
    }
    /**
     * Serializes the request body to JSON string if non-empty.
     */
    serializeBody(body) {
      if (!body) {
        return void 0;
      }
      const serializedBody = { ...body };
      if (serializedBody[START_CURSOR_PARAM_NAME] === null) {
        delete serializedBody[START_CURSOR_PARAM_NAME];
      }
      if (Object.entries(serializedBody).length === 0) {
        return void 0;
      }
      return JSON.stringify(serializedBody);
    }
    /**
     * Builds the request headers including auth and content-type.
     */
    buildRequestHeaders(customHeaders, auth, bodyAsJsonString) {
      const authorizationHeader = this.buildAuthHeader(auth);
      const headers = {
        ...customHeaders,
        ...authorizationHeader,
        "Notion-Version": __classPrivateFieldGet(this, _Client_notionVersion, "f"),
        "user-agent": __classPrivateFieldGet(this, _Client_userAgent, "f")
      };
      if (bodyAsJsonString !== void 0) {
        headers["content-type"] = "application/json";
      }
      return headers;
    }
    /**
     * Builds the authorization header based on auth type.
     */
    buildAuthHeader(auth) {
      if (typeof auth === "object") {
        const unencodedCredential = `${auth.client_id}:${auth.client_secret}`;
        const encodedCredential = Buffer.from(unencodedCredential).toString("base64");
        return { authorization: `Basic ${encodedCredential}` };
      }
      return this.authAsHeaders(auth);
    }
    /**
     * Builds FormData from form parameters if provided.
     * Also removes content-type header to let fetch set the boundary.
     */
    buildFormData(formDataParams, headers) {
      if (!formDataParams) {
        return void 0;
      }
      delete headers["content-type"];
      const formData = new FormData();
      for (const [key, value] of Object.entries(formDataParams)) {
        if (typeof value === "string") {
          formData.append(key, value);
        } else if (typeof value === "object") {
          formData.append(key, typeof value.data === "object" ? value.data : new Blob([value.data]), value.filename);
        }
      }
      return formData;
    }
    /**
     * Executes the request with retry logic.
     */
    async executeWithRetry(args, execute) {
      const { url, method, path, headers, body } = args;
      let attempt = 0;
      while (true) {
        try {
          return await execute({
            url,
            method,
            path,
            headers,
            body
          });
        } catch (error) {
          if (!(0, errors_1.isNotionClientError)(error)) {
            throw error;
          }
          this.logRequestError(error, attempt);
          if (attempt < __classPrivateFieldGet(this, _Client_maxRetries, "f") && this.canRetry(error, method)) {
            const delayMs = this.calculateRetryDelay(error, attempt);
            this.log(logging_1.LogLevel.INFO, "retrying request", {
              method,
              path,
              attempt: attempt + 1,
              delayMs
            });
            await this.sleep(delayMs);
            attempt++;
            continue;
          }
          throw error;
        }
      }
    }
    /**
     * Executes a single HTTP request (no retry).
     */
    async executeSingleRequest(args) {
      const { url, method, path, headers, body } = args;
      const response = await errors_1.RequestTimeoutError.rejectAfterTimeout(__classPrivateFieldGet(this, _Client_fetch, "f").call(this, url.toString(), {
        method: method.toUpperCase(),
        headers,
        body,
        agent: __classPrivateFieldGet(this, _Client_agent, "f")
      }), __classPrivateFieldGet(this, _Client_timeoutMs, "f"));
      const responseText = await response.text();
      if (!response.ok) {
        throw (0, errors_1.buildRequestError)(response, responseText);
      }
      const responseJson = JSON.parse(responseText);
      this.log(logging_1.LogLevel.INFO, "request success", {
        method,
        path,
        ...this.extractRequestId(responseJson)
      });
      return responseJson;
    }
    /**
     * Opens an SSE response without consuming its body. Retry orchestration is
     * shared with JSON requests so only the initial, retryable HTTP failures are
     * retried; once a stream has opened, its events are never replayed.
     */
    async executeSingleStreamRequest(args) {
      const { url, method, body } = args;
      const response = await errors_1.RequestTimeoutError.rejectAfterTimeout(__classPrivateFieldGet(this, _Client_fetch, "f").call(this, url.toString(), {
        method: method.toUpperCase(),
        headers: args.headers,
        body,
        agent: __classPrivateFieldGet(this, _Client_agent, "f")
      }), __classPrivateFieldGet(this, _Client_timeoutMs, "f"));
      if (!response.ok) {
        throw (0, errors_1.buildRequestError)(response, await response.text());
      }
      return response;
    }
    /**
     * Logs a request error with appropriate detail level.
     */
    logRequestError(error, attempt) {
      this.log(logging_1.LogLevel.WARN, "request fail", {
        code: error.code,
        message: error.message,
        attempt,
        ...this.extractRequestId(error)
      });
      if ((0, errors_1.isHTTPResponseError)(error)) {
        this.log(logging_1.LogLevel.DEBUG, "failed response body", {
          body: error.body
        });
      }
    }
    /**
     * Extracts request_id from an object if present.
     */
    extractRequestId(obj) {
      if (obj && typeof obj === "object" && "request_id" in obj && typeof obj.request_id === "string") {
        return { requestId: obj.request_id };
      }
      return {};
    }
    /**
     * Determines if an error can be retried based on its error code and method.
     * Rate limits (429) and service overloads (529) are always retryable since
     * the server explicitly asks us to retry. Server errors (500, 503) are only
     * retried for idempotent methods (GET, DELETE) to avoid duplicate side
     * effects.
     */
    canRetry(error, method) {
      if (!errors_1.APIResponseError.isAPIResponseError(error)) {
        return false;
      }
      if (error.code === errors_1.APIErrorCode.RateLimited || error.code === errors_1.APIErrorCode.ServiceOverload) {
        return true;
      }
      const isIdempotent = method === "get" || method === "delete";
      if (isIdempotent) {
        return error.code === errors_1.APIErrorCode.InternalServerError || error.code === errors_1.APIErrorCode.ServiceUnavailable;
      }
      return false;
    }
    /**
     * Calculates the delay before the next retry attempt.
     * Uses retry-after header if present, otherwise exponential back-off with
     * jitter.
     */
    calculateRetryDelay(error, attempt) {
      if (errors_1.APIResponseError.isAPIResponseError(error)) {
        const retryAfterMs = this.parseRetryAfterHeader(error.headers);
        if (retryAfterMs !== void 0) {
          return Math.min(retryAfterMs, __classPrivateFieldGet(this, _Client_maxRetryDelayMs, "f"));
        }
      }
      const baseDelay = __classPrivateFieldGet(this, _Client_initialRetryDelayMs, "f") * Math.pow(2, attempt);
      const jitter = Math.random();
      return Math.min(baseDelay * jitter + baseDelay / 2, __classPrivateFieldGet(this, _Client_maxRetryDelayMs, "f"));
    }
    /**
     * Parses the retry-after header value.
     * Supports both delta-seconds (e.g., "120") and HTTP-date formats.
     * Returns the delay in milliseconds, or undefined if not present or invalid.
     */
    parseRetryAfterHeader(headers) {
      const retryAfterValue = (0, errors_1.getResponseHeader)(headers, "retry-after");
      if (!retryAfterValue) {
        return void 0;
      }
      const seconds = parseInt(retryAfterValue, 10);
      if (!isNaN(seconds) && seconds >= 0) {
        return seconds * 1e3;
      }
      const date = Date.parse(retryAfterValue);
      if (!isNaN(date)) {
        const delayMs = date - Date.now();
        return delayMs > 0 ? delayMs : 0;
      }
      return void 0;
    }
    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Logs a warning when the caller passes parameters that are not recognized
     * by the endpoint definition. This helps catch typos and renamed parameters
     * (e.g. `archived` vs `in_trash` for `databases.update`) that would
     * otherwise be silently dropped by `pick()`.
     */
    warnUnknownParams(args, endpoint) {
      var _a;
      if (!args || typeof args !== "object")
        return;
      const unknownKeys = (0, utils_1.getUnknownParams)(args, endpoint);
      if (unknownKeys.length > 0) {
        this.log(logging_1.LogLevel.WARN, "unknown parameters were ignored", {
          unknownParams: unknownKeys,
          knownParams: [
            ...endpoint.pathParams,
            ...endpoint.queryParams,
            ...endpoint.bodyParams,
            ...(_a = endpoint.formDataParams) !== null && _a !== void 0 ? _a : []
          ]
        });
      }
    }
    /**
     * Emits a log message to the console.
     *
     * @param level The level for this message
     * @param args Arguments to send to the console
     */
    log(level, message, extraInfo) {
      if ((0, logging_1.logLevelSeverity)(level) >= (0, logging_1.logLevelSeverity)(__classPrivateFieldGet(this, _Client_logLevel, "f"))) {
        __classPrivateFieldGet(this, _Client_logger, "f").call(this, level, message, extraInfo);
      }
    }
    /**
     * Transforms an API key or access token into a headers object suitable for an HTTP request.
     *
     * This method uses the instance's value as the default when the input is undefined. If neither are defined, it returns
     * an empty object
     *
     * @param auth API key or access token
     * @returns headers key-value object
     */
    authAsHeaders(auth) {
      const headers = {};
      const authHeaderValue = auth !== null && auth !== void 0 ? auth : __classPrivateFieldGet(this, _Client_auth, "f");
      if (authHeaderValue !== void 0) {
        headers["authorization"] = `Bearer ${authHeaderValue}`;
      }
      return headers;
    }
  };
  _Client_auth = /* @__PURE__ */ new WeakMap(), _Client_logLevel = /* @__PURE__ */ new WeakMap(), _Client_logger = /* @__PURE__ */ new WeakMap(), _Client_prefixUrl = /* @__PURE__ */ new WeakMap(), _Client_timeoutMs = /* @__PURE__ */ new WeakMap(), _Client_notionVersion = /* @__PURE__ */ new WeakMap(), _Client_fetch = /* @__PURE__ */ new WeakMap(), _Client_agent = /* @__PURE__ */ new WeakMap(), _Client_userAgent = /* @__PURE__ */ new WeakMap(), _Client_maxRetries = /* @__PURE__ */ new WeakMap(), _Client_initialRetryDelayMs = /* @__PURE__ */ new WeakMap(), _Client_maxRetryDelayMs = /* @__PURE__ */ new WeakMap();
  Client$1.defaultNotionVersion = "2025-09-03";
  Client.default = Client$1;
  const sessionStreamEventTypes = /* @__PURE__ */ new Set([
    "session.snapshot",
    "event.provisional",
    "event.committed",
    "stream.timeout",
    "stream.end",
    "stream.error"
  ]);
  function takeSseFrames(args) {
    const frames = [];
    let remaining = args.content.replace(/\r\n/g, "\n");
    let boundary = remaining.indexOf("\n\n");
    while (boundary !== -1) {
      const frame = parseSseFrame(remaining.slice(0, boundary));
      if (frame !== void 0) {
        frames.push(frame);
      }
      remaining = remaining.slice(boundary + 2);
      boundary = remaining.indexOf("\n\n");
    }
    if (args.complete && remaining !== "") {
      const frame = parseSseFrame(remaining);
      if (frame !== void 0) {
        frames.push(frame);
      }
      remaining = "";
    }
    return { frames, remaining };
  }
  function parseSseFrame(content) {
    let eventName;
    const dataLines = [];
    for (const line of content.split("\n")) {
      if (line.startsWith(":")) {
        continue;
      }
      const colonIndex = line.indexOf(":");
      if (colonIndex === -1) {
        continue;
      }
      const field = line.slice(0, colonIndex);
      const valueStart = line.charAt(colonIndex + 1) === " " ? colonIndex + 2 : colonIndex + 1;
      const value = line.slice(valueStart);
      if (field === "event") {
        eventName = value;
      } else if (field === "data") {
        dataLines.push(value);
      }
    }
    if (dataLines.length === 0) {
      return void 0;
    }
    if (eventName === void 0) {
      throw new Error("Session stream event is missing its SSE event name.");
    }
    return { eventName, data: dataLines.join("\n") };
  }
  function parseSessionStreamEvent(frame) {
    const event = JSON.parse(frame.data);
    if (typeof event !== "object" || event === null || !sessionStreamEventTypes.has(event.type) || event.type !== frame.eventName) {
      throw new Error("Session stream event does not match its SSE event name.");
    }
    return event;
  }
  return Client;
}
var helpers = {};
var hasRequiredHelpers;
function requireHelpers() {
  if (hasRequiredHelpers) return helpers;
  hasRequiredHelpers = 1;
  Object.defineProperty(helpers, "__esModule", { value: true });
  helpers.iteratePaginatedAPI = iteratePaginatedAPI;
  helpers.collectPaginatedAPI = collectPaginatedAPI;
  helpers.iterateDataSourceTemplates = iterateDataSourceTemplates;
  helpers.collectDataSourceTemplates = collectDataSourceTemplates;
  helpers.iterateAllDataSourceRows = iterateAllDataSourceRows;
  helpers.collectAllDataSourceRows = collectAllDataSourceRows;
  helpers.isFullBlock = isFullBlock;
  helpers.isFullPage = isFullPage;
  helpers.isFullDataSource = isFullDataSource;
  helpers.isFullDatabase = isFullDatabase;
  helpers.isFullPageOrDataSource = isFullPageOrDataSource;
  helpers.isFullUser = isFullUser;
  helpers.isFullComment = isFullComment;
  helpers.isFullView = isFullView;
  helpers.isTextRichTextItemResponse = isTextRichTextItemResponse;
  helpers.isEquationRichTextItemResponse = isEquationRichTextItemResponse;
  helpers.isMentionRichTextItemResponse = isMentionRichTextItemResponse;
  helpers.extractNotionId = extractNotionId;
  helpers.extractDatabaseId = extractDatabaseId;
  helpers.extractPageId = extractPageId;
  helpers.extractBlockId = extractBlockId;
  async function* iteratePaginatedAPI(listFn, firstPageArgs) {
    let nextCursor = firstPageArgs.start_cursor;
    do {
      const response = await listFn({
        ...firstPageArgs,
        start_cursor: nextCursor
      });
      yield* response.results;
      nextCursor = response.next_cursor;
    } while (nextCursor);
  }
  async function collectPaginatedAPI(listFn, firstPageArgs) {
    const results = [];
    for await (const item of iteratePaginatedAPI(listFn, firstPageArgs)) {
      results.push(item);
    }
    return results;
  }
  async function* iterateDataSourceTemplates(client, args) {
    let nextCursor = args.start_cursor;
    do {
      const response = await client.dataSources.listTemplates({
        ...args,
        start_cursor: nextCursor
      });
      yield* response.templates;
      nextCursor = response.next_cursor;
    } while (nextCursor);
  }
  async function collectDataSourceTemplates(client, args) {
    const results = [];
    for await (const template of iterateDataSourceTemplates(client, args)) {
      results.push(template);
    }
    return results;
  }
  async function* iterateAllDataSourceRows(client, args) {
    var _a, _b;
    const seenRowIds = /* @__PURE__ */ new Set();
    let windowStart = void 0;
    for (; ; ) {
      let limitReached = false;
      let lastCreatedTime = void 0;
      let cursor = void 0;
      do {
        const response = await client.dataSources.query({
          ...args,
          sorts: [{ timestamp: "created_time", direction: "ascending" }],
          filter: createdTimeLowerBound(args.filter, windowStart),
          start_cursor: cursor
        });
        for (const row of response.results) {
          if (isFullPageOrDataSource(row)) {
            lastCreatedTime = row.created_time;
          }
          if (!seenRowIds.has(row.id)) {
            seenRowIds.add(row.id);
            yield row;
          }
        }
        if (((_a = response.request_status) === null || _a === void 0 ? void 0 : _a.type) === "incomplete") {
          limitReached = true;
        }
        cursor = (_b = response.next_cursor) !== null && _b !== void 0 ? _b : void 0;
      } while (cursor);
      if (!limitReached) {
        return;
      }
      if (lastCreatedTime === void 0 || lastCreatedTime === windowStart) {
        throw new Error(`iterateAllDataSourceRows cannot make progress: the per-query result limit was reached but the created_time window could not advance past ${String(lastCreatedTime)}. More rows share this timestamp than the limit allows. Add a filter to narrow the query.`);
      }
      windowStart = lastCreatedTime;
    }
  }
  async function collectAllDataSourceRows(client, args) {
    const rows = [];
    for await (const row of iterateAllDataSourceRows(client, args)) {
      rows.push(row);
    }
    return rows;
  }
  function createdTimeLowerBound(filter, windowStart) {
    if (windowStart === void 0) {
      return filter;
    }
    const bound = {
      timestamp: "created_time",
      created_time: { on_or_after: windowStart }
    };
    if (filter === void 0) {
      return bound;
    }
    if ("and" in filter) {
      return { and: [...filter.and, bound] };
    }
    return { and: [filter, bound] };
  }
  function isFullBlock(response) {
    return response.object === "block" && "type" in response;
  }
  function isFullPage(response) {
    return response.object === "page" && "url" in response;
  }
  function isFullDataSource(response) {
    return response.object === "data_source" && "title" in response;
  }
  function isFullDatabase(response) {
    return response.object === "database" && "title" in response;
  }
  function isFullPageOrDataSource(response) {
    if (response.object === "data_source") {
      return isFullDataSource(response);
    } else {
      return isFullPage(response);
    }
  }
  function isFullUser(response) {
    return "type" in response;
  }
  function isFullComment(response) {
    return "created_by" in response;
  }
  function isFullView(response) {
    return "type" in response;
  }
  function isTextRichTextItemResponse(richText) {
    return richText.type === "text";
  }
  function isEquationRichTextItemResponse(richText) {
    return richText.type === "equation";
  }
  function isMentionRichTextItemResponse(richText) {
    return richText.type === "mention";
  }
  function extractNotionId(urlOrId) {
    if (!urlOrId || typeof urlOrId !== "string") {
      return null;
    }
    const trimmed = urlOrId.trim();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(trimmed)) {
      return trimmed.toLowerCase();
    }
    const compactUuidRegex = /^[0-9a-f]{32}$/i;
    if (compactUuidRegex.test(trimmed)) {
      return formatUuid(trimmed);
    }
    const pathMatch = trimmed.match(/\/[^/?#]*-([0-9a-f]{32})(?:[/?#]|$)/i);
    if (pathMatch && pathMatch[1]) {
      return formatUuid(pathMatch[1]);
    }
    const queryMatch = trimmed.match(/[?&](?:p|page_id|database_id)=([0-9a-f]{32})/i);
    if (queryMatch && queryMatch[1]) {
      return formatUuid(queryMatch[1]);
    }
    const anyMatch = trimmed.match(/([0-9a-f]{32})/i);
    if (anyMatch && anyMatch[1]) {
      return formatUuid(anyMatch[1]);
    }
    return null;
  }
  function formatUuid(compactId) {
    const clean = compactId.toLowerCase();
    return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20, 32)}`;
  }
  function extractDatabaseId(databaseUrl) {
    return extractNotionId(databaseUrl);
  }
  function extractPageId(pageUrl) {
    return extractNotionId(pageUrl);
  }
  function extractBlockId(urlWithBlock) {
    if (!urlWithBlock || typeof urlWithBlock !== "string") {
      return null;
    }
    const blockMatch = urlWithBlock.match(/#(?:block-)?([0-9a-f]{32})/i);
    if (blockMatch && blockMatch[1]) {
      return formatUuid(blockMatch[1]);
    }
    return null;
  }
  return helpers;
}
var webhooks = {};
var hasRequiredWebhooks;
function requireWebhooks() {
  if (hasRequiredWebhooks) return webhooks;
  hasRequiredWebhooks = 1;
  Object.defineProperty(webhooks, "__esModule", { value: true });
  webhooks.verifyWebhookSignature = verifyWebhookSignature;
  webhooks.signWebhookPayload = signWebhookPayload;
  const SIGNATURE_PREFIX = "sha256=";
  const SHA256_HEX_LENGTH = 64;
  async function verifyWebhookSignature(args) {
    const { body, signature, verificationToken } = args;
    if (typeof signature !== "string")
      return false;
    if (!signature.startsWith(SIGNATURE_PREFIX))
      return false;
    const providedHex = signature.slice(SIGNATURE_PREFIX.length).toLowerCase();
    if (providedHex.length !== SHA256_HEX_LENGTH)
      return false;
    if (!/^[0-9a-f]+$/.test(providedHex))
      return false;
    const computedHex = await computeHmacSha256Hex(verificationToken, body);
    return timingSafeEqualHex(providedHex, computedHex);
  }
  async function signWebhookPayload(args) {
    const hex = await computeHmacSha256Hex(args.verificationToken, args.body);
    return `${SIGNATURE_PREFIX}${hex}`;
  }
  async function computeHmacSha256Hex(key, body) {
    const subtle = await getSubtle();
    const encoder = new TextEncoder();
    const keyBytes = encoder.encode(key);
    const bodyBytes = typeof body === "string" ? encoder.encode(body) : Uint8Array.from(body);
    const cryptoKey = await subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signatureBuffer = await subtle.sign("HMAC", cryptoKey, bodyBytes);
    return bytesToHex(new Uint8Array(signatureBuffer));
  }
  let cachedSubtle;
  async function getSubtle() {
    var _a, _b;
    if (cachedSubtle)
      return cachedSubtle;
    const fromGlobal = (_a = globalThis.crypto) === null || _a === void 0 ? void 0 : _a.subtle;
    if (fromGlobal) {
      cachedSubtle = fromGlobal;
      return cachedSubtle;
    }
    try {
      const nodeCrypto = require("crypto");
      if ((_b = nodeCrypto.webcrypto) === null || _b === void 0 ? void 0 : _b.subtle) {
        cachedSubtle = nodeCrypto.webcrypto.subtle;
        return cachedSubtle;
      }
    } catch {
    }
    throw new Error("verifyWebhookSignature requires Web Crypto support (globalThis.crypto.subtle or node:crypto.webcrypto). Upgrade to a runtime that provides one of them.");
  }
  function bytesToHex(bytes) {
    let hex = "";
    for (let i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, "0");
    }
    return hex;
  }
  function timingSafeEqualHex(a, b) {
    if (a.length !== b.length)
      return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
  }
  return webhooks;
}
var meetingNotes = {};
var hasRequiredMeetingNotes;
function requireMeetingNotes() {
  if (hasRequiredMeetingNotes) return meetingNotes;
  hasRequiredMeetingNotes = 1;
  Object.defineProperty(meetingNotes, "__esModule", { value: true });
  meetingNotes.meetingNotesFilterableProperties = void 0;
  meetingNotes.meetingNotesFilterableProperties = [
    "title",
    "created_time",
    "last_edited_time",
    "created_by",
    "last_edited_by",
    "attendees"
  ];
  return meetingNotes;
}
var hasRequiredSrc;
function requireSrc() {
  if (hasRequiredSrc) return src;
  hasRequiredSrc = 1;
  (function(exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.meetingNotesFilterableProperties = exports.signWebhookPayload = exports.verifyWebhookSignature = exports.extractBlockId = exports.extractPageId = exports.extractDatabaseId = exports.extractNotionId = exports.isFullPageOrDataSource = exports.isFullView = exports.isFullComment = exports.isFullUser = exports.isFullPage = exports.isFullDatabase = exports.isFullDataSource = exports.isFullBlock = exports.collectAllDataSourceRows = exports.iterateAllDataSourceRows = exports.iterateDataSourceTemplates = exports.collectDataSourceTemplates = exports.iteratePaginatedAPI = exports.collectPaginatedAPI = exports.MIN_VIEW_COLUMN_WIDTH = exports.DEFAULT_MAX_RETRY_DELAY_MS = exports.DEFAULT_INITIAL_RETRY_DELAY_MS = exports.DEFAULT_MAX_RETRIES = exports.DEFAULT_TIMEOUT_MS = exports.DEFAULT_BASE_URL = exports.isHTTPResponseError = exports.isNotionClientError = exports.InvalidPathParameterError = exports.RequestTimeoutError = exports.UnknownHTTPResponseError = exports.APIResponseError = exports.ClientErrorCode = exports.APIErrorCode = exports.LogLevel = exports.Client = void 0;
    var Client_1 = requireClient();
    Object.defineProperty(exports, "Client", { enumerable: true, get: function() {
      return Client_1.default;
    } });
    var logging_1 = requireLogging();
    Object.defineProperty(exports, "LogLevel", { enumerable: true, get: function() {
      return logging_1.LogLevel;
    } });
    var errors_1 = requireErrors();
    Object.defineProperty(exports, "APIErrorCode", { enumerable: true, get: function() {
      return errors_1.APIErrorCode;
    } });
    Object.defineProperty(exports, "ClientErrorCode", { enumerable: true, get: function() {
      return errors_1.ClientErrorCode;
    } });
    Object.defineProperty(exports, "APIResponseError", { enumerable: true, get: function() {
      return errors_1.APIResponseError;
    } });
    Object.defineProperty(exports, "UnknownHTTPResponseError", { enumerable: true, get: function() {
      return errors_1.UnknownHTTPResponseError;
    } });
    Object.defineProperty(exports, "RequestTimeoutError", { enumerable: true, get: function() {
      return errors_1.RequestTimeoutError;
    } });
    Object.defineProperty(exports, "InvalidPathParameterError", { enumerable: true, get: function() {
      return errors_1.InvalidPathParameterError;
    } });
    Object.defineProperty(exports, "isNotionClientError", { enumerable: true, get: function() {
      return errors_1.isNotionClientError;
    } });
    Object.defineProperty(exports, "isHTTPResponseError", { enumerable: true, get: function() {
      return errors_1.isHTTPResponseError;
    } });
    var constants_1 = requireConstants();
    Object.defineProperty(exports, "DEFAULT_BASE_URL", { enumerable: true, get: function() {
      return constants_1.DEFAULT_BASE_URL;
    } });
    Object.defineProperty(exports, "DEFAULT_TIMEOUT_MS", { enumerable: true, get: function() {
      return constants_1.DEFAULT_TIMEOUT_MS;
    } });
    Object.defineProperty(exports, "DEFAULT_MAX_RETRIES", { enumerable: true, get: function() {
      return constants_1.DEFAULT_MAX_RETRIES;
    } });
    Object.defineProperty(exports, "DEFAULT_INITIAL_RETRY_DELAY_MS", { enumerable: true, get: function() {
      return constants_1.DEFAULT_INITIAL_RETRY_DELAY_MS;
    } });
    Object.defineProperty(exports, "DEFAULT_MAX_RETRY_DELAY_MS", { enumerable: true, get: function() {
      return constants_1.DEFAULT_MAX_RETRY_DELAY_MS;
    } });
    Object.defineProperty(exports, "MIN_VIEW_COLUMN_WIDTH", { enumerable: true, get: function() {
      return constants_1.MIN_VIEW_COLUMN_WIDTH;
    } });
    var helpers_1 = requireHelpers();
    Object.defineProperty(exports, "collectPaginatedAPI", { enumerable: true, get: function() {
      return helpers_1.collectPaginatedAPI;
    } });
    Object.defineProperty(exports, "iteratePaginatedAPI", { enumerable: true, get: function() {
      return helpers_1.iteratePaginatedAPI;
    } });
    Object.defineProperty(exports, "collectDataSourceTemplates", { enumerable: true, get: function() {
      return helpers_1.collectDataSourceTemplates;
    } });
    Object.defineProperty(exports, "iterateDataSourceTemplates", { enumerable: true, get: function() {
      return helpers_1.iterateDataSourceTemplates;
    } });
    Object.defineProperty(exports, "iterateAllDataSourceRows", { enumerable: true, get: function() {
      return helpers_1.iterateAllDataSourceRows;
    } });
    Object.defineProperty(exports, "collectAllDataSourceRows", { enumerable: true, get: function() {
      return helpers_1.collectAllDataSourceRows;
    } });
    Object.defineProperty(exports, "isFullBlock", { enumerable: true, get: function() {
      return helpers_1.isFullBlock;
    } });
    Object.defineProperty(exports, "isFullDataSource", { enumerable: true, get: function() {
      return helpers_1.isFullDataSource;
    } });
    Object.defineProperty(exports, "isFullDatabase", { enumerable: true, get: function() {
      return helpers_1.isFullDatabase;
    } });
    Object.defineProperty(exports, "isFullPage", { enumerable: true, get: function() {
      return helpers_1.isFullPage;
    } });
    Object.defineProperty(exports, "isFullUser", { enumerable: true, get: function() {
      return helpers_1.isFullUser;
    } });
    Object.defineProperty(exports, "isFullComment", { enumerable: true, get: function() {
      return helpers_1.isFullComment;
    } });
    Object.defineProperty(exports, "isFullView", { enumerable: true, get: function() {
      return helpers_1.isFullView;
    } });
    Object.defineProperty(exports, "isFullPageOrDataSource", { enumerable: true, get: function() {
      return helpers_1.isFullPageOrDataSource;
    } });
    Object.defineProperty(exports, "extractNotionId", { enumerable: true, get: function() {
      return helpers_1.extractNotionId;
    } });
    Object.defineProperty(exports, "extractDatabaseId", { enumerable: true, get: function() {
      return helpers_1.extractDatabaseId;
    } });
    Object.defineProperty(exports, "extractPageId", { enumerable: true, get: function() {
      return helpers_1.extractPageId;
    } });
    Object.defineProperty(exports, "extractBlockId", { enumerable: true, get: function() {
      return helpers_1.extractBlockId;
    } });
    var webhooks_1 = requireWebhooks();
    Object.defineProperty(exports, "verifyWebhookSignature", { enumerable: true, get: function() {
      return webhooks_1.verifyWebhookSignature;
    } });
    Object.defineProperty(exports, "signWebhookPayload", { enumerable: true, get: function() {
      return webhooks_1.signWebhookPayload;
    } });
    var meeting_notes_1 = requireMeetingNotes();
    Object.defineProperty(exports, "meetingNotesFilterableProperties", { enumerable: true, get: function() {
      return meeting_notes_1.meetingNotesFilterableProperties;
    } });
  })(src);
  return src;
}
var srcExports = requireSrc();
const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/projects" && request.method === "GET") {
        const notion = new srcExports.Client({
          auth: env.NOTION_TOKEN
        });
        const response = await notion.dataSources.query({
          data_source_id: env.NOTION_PROJECTS_DATABASE_ID
        });
        const projects = response.results.filter((page) => page.properties.Name?.title?.length > 0).map((page) => {
          const properties = page.properties;
          return {
            id: properties.ID?.rich_text?.[0]?.plain_text ?? "",
            title: properties.Name?.title?.[0]?.plain_text ?? "",
            shortDescription: properties.ShortDescription?.rich_text?.[0]?.plain_text ?? "",
            description: properties.Description?.rich_text?.[0]?.plain_text ?? "",
            development: properties.Development?.rich_text?.[0]?.plain_text ?? "",
            startDate: properties.StartDate?.date?.start ?? "",
            endDate: properties.EndDate?.date?.start ?? "",
            updatedDate: properties.UpdatedDate?.date?.start ?? "",
            team: properties.Team?.rich_text?.[0]?.plain_text ?? "",
            role: properties.Role?.rich_text?.[0]?.plain_text ?? "",
            technologies: properties.Technologies?.multi_select?.map(
              (item) => item.name
            ) ?? [],
            imageUrl: properties.Image?.files?.[0]?.file?.url ?? properties.Image?.files?.[0]?.external?.url ?? "",
            publicUrl: properties.PublicURL?.url ?? null,
            sourceUrl: properties.SourceURL?.url ?? null
          };
        });
        return Response.json({
          ok: true,
          count: projects.length,
          projects
        });
      }
      if (url.pathname.startsWith("/api/projects/") && request.method === "GET") {
        const id = url.pathname.split("/")[3];
        const notion = new srcExports.Client({
          auth: env.NOTION_TOKEN
        });
        const response = await notion.dataSources.query({
          data_source_id: env.NOTION_PROJECTS_DATABASE_ID
        });
        const page = response.results.find(
          (page2) => page2.properties.ID?.rich_text?.[0]?.plain_text === id
        );
        if (!page) {
          return Response.json(
            {
              ok: false,
              message: "Project not found"
            },
            { status: 404 }
          );
        }
        const properties = page.properties;
        const project = {
          id: properties.ID?.rich_text?.[0]?.plain_text ?? "",
          title: properties.Name?.title?.[0]?.plain_text ?? "",
          shortDescription: properties.ShortDescription?.rich_text?.[0]?.plain_text ?? "",
          description: properties.Description?.rich_text?.[0]?.plain_text ?? "",
          development: properties.Development?.rich_text?.[0]?.plain_text ?? "",
          startDate: properties.StartDate?.date?.start ?? "",
          endDate: properties.EndDate?.date?.start ?? "",
          updatedDate: properties.UpdatedDate?.date?.start ?? "",
          team: properties.Team?.rich_text?.[0]?.plain_text ?? "",
          role: properties.Role?.rich_text?.[0]?.plain_text ?? "",
          technologies: properties.Technologies?.multi_select?.map(
            (item) => item.name
          ) ?? [],
          imageUrl: properties.Image?.files?.[0]?.file?.url ?? properties.Image?.files?.[0]?.external?.url ?? "",
          publicUrl: properties.PublicURL?.url ?? null,
          sourceUrl: properties.SourceURL?.url ?? null
        };
        return Response.json(project);
      }
      if (url.pathname === "/api/career" && request.method === "GET") {
        const notion = new srcExports.Client({
          auth: env.NOTION_TOKEN
        });
        const response = await notion.dataSources.query({
          data_source_id: env.NOTION_CAREER_DATABASE_ID
        });
        const career = response.results.filter((page) => page.properties.Name?.title?.length > 0).map((page) => {
          const properties = page.properties;
          return {
            title: properties.Name?.title?.[0]?.plain_text ?? "",
            date: properties.Date?.date?.start ?? "",
            category: properties.Category?.multi_select?.map(
              (item) => item.name
            ) ?? [],
            sortOrder: properties.SortOrder?.number ?? 0,
            description: properties.Description?.rich_text?.[0]?.plain_text ?? ""
          };
        }).sort((a, b) => a.sortOrder - b.sortOrder);
        return Response.json({
          ok: true,
          count: career.length,
          career
        });
      }
      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error(error);
      return Response.json(
        {
          ok: false,
          message: error.message ?? "Internal Server Error"
        },
        { status: 500 }
      );
    }
  }
};
const workerEntry = worker ?? {};
export {
  workerEntry as default
};
