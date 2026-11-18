# 墨刀 AI MCP 接入记录

记录 2026-11-18 接入墨刀 AI MCP 的过程、证据与结论，供以后排障参考。

## 结论先说

**用 OAuth 授权接入，别用令牌设置里的个人空间令牌。**

- 服务地址：`https://modao.cc/agent-py/ai/mcp`（Streamable HTTP）
- 鉴权：`Authorization: Bearer <OAuth access token>`
- 令牌方式（`modao-token: modao_xxx`）在本人账号上**始终 401**，原因在服务端

## 证据链

### 1. 令牌方式失败（两个不同的 key）

| 令牌 | 来源 | `modao-token` 头 | `Authorization: Bearer` |
|---|---|---|---|
| `modao_UzrDarQuo…` | 令牌设置里原有的 | 401 | 401 |
| `modao_…luHA` | 当场新建的 | 401 | 401 |
| OAuth access token | 浏览器授权 | **200** | **200** |

两个 key 形态完全一致（`modao_` + 43 位 = 49 字符），服务端返回的错误与"随便编一个 key"完全一样：

```
401 {"error":"UNAUTHORIZED","message":"MCP API Key 无效，请重新复制或创建。"}
```

### 2. 排除客户端因素

- 头名 `modao-token` 是官方写法（[落地页](https://modao.cc/feature/ai-mcp.html)五个客户端示例一致）
- 地址正确：`/agent-py/ai/mcp`，带尾斜杠 307、`/a2-mcp/ai/mcp` 404
- 换过 7 种请求形态（Origin / Referer / 浏览器 UA / HTTP1.1 / 去前缀）全 401

### 3. 判定

网关认 `modao_` 令牌（OAuth token 用 `modao-token` 头也 200），但**令牌设置签发的 key 没进网关的校验库**。
属于服务端数据问题，客户端无法绕过。

## OAuth 接入步骤（可复用）

```bash
POST https://modao.cc/a2-mcp/oauth/register          # 动态注册，redirect_uris 支持 http://127.0.0.1:PORT/callback
GET  https://modao.cc/embed/mcp_oauth?...            # 授权页（PKCE S256 + resource 参数）
POST https://modao.cc/a2-mcp/oauth/token             # 换 token，必须带 resource
```

**坑 1**：换 token 时漏 `resource` → `400 invalid_grant: resource does not match authorization code`
**坑 2**：回调服务用单线程 `socketserver.TCPServer`，`shutdown()` 会被浏览器 keep-alive 连接卡死 → 改用 `ThreadingHTTPServer` 且不调 `shutdown()`

## 刷新（access token 只有 1 小时）

```bash
POST https://modao.cc/a2-mcp/oauth/token
grant_type=refresh_token&refresh_token=...&client_id=...&resource=https://modao.cc/agent-py/ai/mcp
```

刷新会返回新的 refresh token（轮换续期），所以定期刷新可以一直续下去。

## 本地配置（DSH）

`~/.dsh/profiles/desktop/cordis.patch.yml`：

```yaml
- id: mcp-modao
  name: '@deepseek-ai/dsh-mcp-client'
  config:
    serverName: modao
    transport: streamable-http
    url: https://modao.cc/agent-py/ai/mcp
    expandTemplates: true
    headers:
      Authorization: Bearer ${credential:MODAO_ACCESS_TOKEN}
    toolCallTimeoutMs: 300000
```

凭据（`~/.dsh/.credentials.yaml`，权限 600）：`MODAO_ACCESS_TOKEN` / `MODAO_REFRESH_TOKEN` / `MODAO_CLIENT_ID`

## 工具能力（19 个）

生成：`generate` / `generate_html` / `generate_react` / `generate_vue` / `generate_prd` / `generate_image`
任务：`get_task_result` / `continue_task` / `paused_task` / `list_recent_tasks`
原型：`new_proto` / `process_proto_json` / `list_created_prototypes` / `get_proto_details`
导出：`export_proto_to_png` / `export_proto_to_html` / `download_generated_content` / `import_to_proto`
账号：`get_account_status`

**注意**：生成类会扣墨刀积分（该账号 100 分，约等于一次简单生成），只读与导出不扣。
