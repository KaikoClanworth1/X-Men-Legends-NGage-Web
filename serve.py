"""Local server for X-Men Legends Web with caching disabled, so code updates are always picked up."""
import http.server
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, '.js': 'text/javascript', '.wasm': 'application/wasm'}

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8770
    print(f'Serving on http://localhost:{port}/  (Ctrl+C or close the window to stop)')
    http.server.ThreadingHTTPServer(('', port), NoCacheHandler).serve_forever()
