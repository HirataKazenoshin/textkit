"""
TxConv 開発用ローカルサーバー
- .mjs を application/javascript で配信（ESモジュール対応）
- .wasm を application/wasm で配信
- COOP/COEP ヘッダー付与（SharedArrayBuffer 有効化）

使い方:
  python server.py
  → http://localhost:8080/
"""

import http.server
import socketserver
import mimetypes

PORT = 8080

# Python の mimetypes モジュールに .mjs / .wasm を登録
mimetypes.add_type('application/javascript', '.mjs')
mimetypes.add_type('application/wasm', '.wasm')
mimetypes.add_type('application/json', '.json')


class Handler(http.server.SimpleHTTPRequestHandler):
    def guess_type(self, path):
        """MIME タイプを確実に返す（Python バージョン差吸収）"""
        if path.endswith('.mjs'):
            return 'application/javascript'
        if path.endswith('.wasm'):
            return 'application/wasm'
        if path.endswith('.json'):
            return 'application/json'
        return super().guess_type(path)

    def end_headers(self):
        # SharedArrayBuffer に必要なヘッダー
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        super().end_headers()


with socketserver.TCPServer(('', PORT), Handler) as httpd:
    print(f'Serving at http://localhost:{PORT}')
    print('Ctrl+C で停止')
    httpd.serve_forever()
