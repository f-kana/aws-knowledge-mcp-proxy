# AWS Knowledge MCP Proxy

## 概要 (Overview )

AWS公式の`aws-knowledge-mcp-server`がプロキシ環境下で動作しないため、
プロキシ対応可能なClientとして実装した。
公式とセットアップ方法が異なるが、使い方は同じなので、[公式のWebサイト](https://awslabs.github.io/mcp/servers/aws-knowledge-mcp-server)を参照のこと。

Since the official AWS `aws-knowledge-mcp-server` does not work in proxy environments,
this has been implemented as a proxy-capable client.
The setup method differs from the official one, but the usage is the same, so please refer to the [official website](https://awslabs.github.io/mcp/servers/aws-knowledge-mcp-server).

## セットアップ (Setup)

### 1. ソースコードをローカルに置く

`git clone xxx`など。

### 2. 依存関係のインストール

```bash
cd aws-knowledge-server-proxy
npm install
```

### 3. MCP設定ファイルの更新

`.amazonq/mcp.json` または `.cursor/mcp.json` に以下を追加：

**方法1: 環境変数を直接指定（推奨）**

```json
{
  "mcpServers": {
    "aws-knowledge-mcp-server-proxy": {
      "command": "node",
      "args": [
        "/path/to/aws-knowledge-server-proxy/index.js"
      ],
      "env": {
        "HTTP_PROXY": "http://proxy.example.com:8080",
        "HTTPS_PROXY": "http://proxy.example.com:8080",
        "NO_PROXY": "localhost,127.0.0.1"
      },
      "timeout": 60000,
      "disabled": false
    }
  },
  "toolsPermissions": {
    "@aws-knowledge-mcp-server-proxy/*": "Always allow"
  }
}
```

**方法2: システム環境変数を使用**

システムレベルで環境変数を設定している場合、`env`セクションは省略可能です：
```bash
# ~/.bashrc
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080
export NO_PROXY=localhost,127.0.0.1
```

```json
{
  "mcpServers": {
    "aws-knowledge-mcp-with-proxy": {
      "command": "node",
      "args": [
        "/path/to/aws-knowledge-server-proxy/index.js"
      ],
      "timeout": 60000,
      "disabled": false
    }
  }
}
```

なお、MCPツール名を"aws-knowledge-mcp-server-proxy"のようにすると、ツール名+Function名が制限である60文字を越えるらしく、警告が出る。

## ライセンス (License)

MIT
