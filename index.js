#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import https from 'https';
import { HttpsProxyAgent } from 'https-proxy-agent';

const OFFICIAL_SERVER_URL = 'https://knowledge-mcp.global.api.aws';

async function main() {
  try {
    await forwardRequest('tools/list', {});
  } catch (error) {
    console.error(`エラー: 公式サーバーへの接続に失敗しました: ${error.message}`);
    console.error('プロキシ設定を確認してください');
    process.exit(1);
  }
  
  const server = setupServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('AWS Knowledge MCP Server (Proxy Wrapper) が起動しました');
}

function setupServer() {
  const server = new Server(
    {
      name: 'aws-knowledge-mcp-server-proxy',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async (request) => {
    try {
      const response = await forwardRequest('tools/list', {});
      return response.result;
    } catch (error) {
      throw new Error(`ツール一覧の取得に失敗しました: ${error.message}`);
    }
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const { name, arguments: args } = request.params;
      const response = await forwardRequest('tools/call', {
        name,
        arguments: args,
      });
      return response.result;
    } catch (error) {
      throw new Error(`ツール呼び出しに失敗しました: ${error.message}`);
    }
  });

  return server;
}

function getProxyAgent() {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy || 
                   process.env.HTTP_PROXY || process.env.http_proxy;
  
  if (!proxyUrl) {
    return null;
  }
  
  try {
    return new HttpsProxyAgent(proxyUrl);
  } catch (error) {
    console.error(`プロキシ設定エラー: ${error.message}`);
    return null;
  }
}

function forwardRequest(method, params) {
  return new Promise((resolve, reject) => {
    const requestData = JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    });

    const agent = getProxyAgent();
    
    const options = {
      hostname: 'knowledge-mcp.global.api.aws',
      port: 443,
      path: '/',
      method: 'POST',
      agent: agent,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData),
        'User-Agent': 'AWS-Knowledge-MCP-Server-Proxy/1.0',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(`MCP Error: ${JSON.stringify(json.error)}`));
          } else {
            resolve(json);
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(requestData);
    req.end();
  });
}

main().catch((error) => {
  console.error('サーバー起動エラー:', error);
  process.exit(1);
});
