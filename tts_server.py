"""
tts_server.py - Máy chủ cục bộ chuyển văn bản thành giọng đọc trí tuệ nhân tạo
Hỗ trợ 2 công nghệ giọng đọc thông minh:
1. ElevenLabs AI (Giọng Người Thật 100% Siêu Cảm Xúc)
2. Microsoft Edge Neural TTS (Nữ Hoài My & Nam Minh - 100% Miễn phí, không cần API Key)
Tích hợp bộ nhớ đệm thông minh (.cache_tts) giúp phát âm thanh ngay lập tức và tiết kiệm quota.
Cho Trợ Lý Ảo Najimez
"""

import sys, os, asyncio, json, urllib.parse, urllib.request, hashlib, re
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
import edge_tts

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

HOST = '127.0.0.1'
PORT = 5050
CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.cache_tts')
MAX_CACHE_SIZE_MB = 100
os.makedirs(CACHE_DIR, exist_ok=True)

def enforce_cache_limit(max_mb: int = MAX_CACHE_SIZE_MB):
    """Giới hạn dung lượng bộ nhớ đệm, tự động dọn dẹp các tệp cũ nhất khi vượt ngưỡng."""
    try:
        if not os.path.exists(CACHE_DIR):
            return
        max_bytes = max_mb * 1024 * 1024
        files = []
        total_size = 0
        for entry in os.scandir(CACHE_DIR):
            if entry.is_file() and entry.name.endswith('.mp3'):
                stat = entry.stat()
                files.append((entry.path, stat.st_mtime, stat.st_size))
                total_size += stat.st_size

        if total_size > max_bytes:
            # Sắp xếp theo mtime tăng dần (cũ nhất đứng trước)
            files.sort(key=lambda x: x[1])
            target_size = int(max_bytes * 0.8)  # Dọn về 80% mức trần
            for path, _, size in files:
                try:
                    os.remove(path)
                    total_size -= size
                except Exception:
                    pass
                if total_size <= target_size:
                    break
    except Exception:
        pass

def strip_emojis(text: str) -> str:
    """Loại bỏ 100% emoji và biểu tượng icon để voice engine không đọc tên emoji thành tiếng."""
    if not text:
        return ''
    # Loại bỏ supplementary planes (Unicode emoji blocks 1F000 - 1FFFF)
    text = re.sub(r'[\U00010000-\U0010ffff]', '', text)
    # Loại bỏ misc symbols, dingbats (2600 - 27BF)
    text = re.sub(r'[\u2600-\u27BF]', '', text)
    # Dọn dẹp khoảng trắng
    text = re.sub(r'\s+([.,!?;:])', r'\1', text)
    return re.sub(r'\s+', ' ', text).strip()

class NajimezTTSHandler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def end_headers(self):
        # Giới hạn CORS về localhost:* / 127.0.0.1:* hoặc domain chính thức của app thay vì wildcard '*'
        req_origin = self.headers.get('Origin', '')
        allowed_origins = [
            'http://localhost', 'http://127.0.0.1',
            'https://najimez.firebaseapp.com', 'https://najimez.web.app'
        ]
        send_origin = None
        if req_origin:
            if re.match(r'^https?://(?:localhost|127\.0\.0\.1)(?::\d+)?$', req_origin) or req_origin in allowed_origins:
                send_origin = req_origin
            elif req_origin == 'null':  # Trường hợp mở file HTML trực tiếp
                send_origin = 'null'

        if send_origin:
            self.send_header('Access-Control-Allow-Origin', send_origin)
            self.send_header('Vary', 'Origin')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, xi-api-key')
        super().end_headers()

    def send_error_response(self, code, message, content_type='text/plain; charset=utf-8'):
        """Gửi phản hồi lỗi kèm Content-Length và Connection: close để client không bị treo."""
        if isinstance(message, dict):
            body = json.dumps(message, ensure_ascii=False).encode('utf-8')
            content_type = 'application/json; charset=utf-8'
        elif isinstance(message, str):
            body = message.encode('utf-8')
        elif isinstance(message, bytes):
            body = message
        else:
            body = str(message).encode('utf-8')

        self.send_response(code)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Connection', 'close')
        self.end_headers()
        try:
            self.wfile.write(body)
        except Exception:
            pass

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Content-Length', '0')
        self.end_headers()

    async def stream_edge(self, text, voice, rate, pitch, cache_path):
        self.send_response(200)
        self.send_header('Content-Type', 'audio/mpeg')
        self.send_header('Transfer-Encoding', 'chunked')
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('X-Cache', 'STREAM')
        self.end_headers()

        communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
        chunks = []
        stream_completed = False
        try:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    data = chunk["data"]
                    chunks.append(data)
                    chunk_header = f"{len(data):X}\r\n".encode('ascii')
                    self.wfile.write(chunk_header + data + b"\r\n")
                    self.wfile.flush()

            # Đóng chunked stream đúng chuẩn HTTP
            self.wfile.write(b"0\r\n\r\n")
            self.wfile.flush()
            stream_completed = True
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            pass
        except Exception as e:
            # Xử lý lỗi edge_tts bằng cách đóng stream đúng chuẩn chunked, không gửi thêm 500 sau 200
            try:
                self.wfile.write(b"0\r\n\r\n")
                self.wfile.flush()
            except Exception:
                pass
        finally:
            # Chỉ ghi cache khi stream hoàn tất đầy đủ không có lỗi
            if stream_completed and chunks:
                all_bytes = b''.join(chunks)
                tmp_path = cache_path + f".tmp.{os.getpid()}_{id(chunks)}"
                try:
                    with open(tmp_path, 'wb') as f:
                        f.write(all_bytes)
                    os.replace(tmp_path, cache_path)
                    enforce_cache_limit()
                except Exception:
                    if os.path.exists(tmp_path):
                        try:
                            os.remove(tmp_path)
                        except Exception:
                            pass

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/health':
            body = json.dumps({
                'status': 'ok',
                'engines': ['elevenlabs', 'edge-tts'],
                'voices': ['vi-VN-HoaiMyNeural', 'vi-VN-NamMinhNeural', 'elevenlabs-multilingual-v2']
            }).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        # GET /tts - Phát Microsoft Edge Neural TTS siêu tốc qua Streaming hoặc Cache
        if parsed.path == '/tts':
            qs = urllib.parse.parse_qs(parsed.query)
            text = strip_emojis(qs.get('text', [''])[0].strip())
            voice = qs.get('voice', ['vi-VN-HoaiMyNeural'])[0]
            rate = qs.get('rate', ['+0%'])[0]
            pitch = qs.get('pitch', ['+0Hz'])[0]

            if not text:
                self.send_error_response(400, 'Missing text')
                return

            # Kiểm tra cache đĩa để phát tức thì 0.005s
            cache_hash = hashlib.md5(f"edge_{voice}_{rate}_{pitch}_{text}".encode('utf-8')).hexdigest()
            cache_path = os.path.join(CACHE_DIR, f"edge_{cache_hash}.mp3")

            if os.path.exists(cache_path) and os.path.getsize(cache_path) > 0:
                try:
                    with open(cache_path, 'rb') as f:
                        audio_bytes = f.read()
                    self.send_response(200)
                    self.send_header('Content-Type', 'audio/mpeg')
                    self.send_header('Content-Length', str(len(audio_bytes)))
                    self.send_header('X-Cache', 'HIT')
                    self.end_headers()
                    self.wfile.write(audio_bytes)
                    return
                except Exception:
                    pass

            try:
                asyncio.run(self.stream_edge(text, voice, rate, pitch, cache_path))
            except Exception:
                pass
            return

        self.send_error_response(404, 'Not Found')

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8', errors='replace')
        try:
            data = json.loads(body)
        except Exception:
            data = {}

        # 1. Edge Neural TTS qua POST
        if parsed.path == '/tts':
            text = strip_emojis(data.get('text', '').strip())
            voice = data.get('voice', 'vi-VN-HoaiMyNeural')
            rate = data.get('rate', '+0%')
            pitch = data.get('pitch', '+0Hz')

            if not text:
                self.send_error_response(400, 'Missing text')
                return

            cache_hash = hashlib.md5(f"edge_{voice}_{rate}_{pitch}_{text}".encode('utf-8')).hexdigest()
            cache_path = os.path.join(CACHE_DIR, f"edge_{cache_hash}.mp3")

            if os.path.exists(cache_path) and os.path.getsize(cache_path) > 0:
                try:
                    with open(cache_path, 'rb') as f:
                        audio_bytes = f.read()
                    self.send_response(200)
                    self.send_header('Content-Type', 'audio/mpeg')
                    self.send_header('Content-Length', str(len(audio_bytes)))
                    self.send_header('X-Cache', 'HIT')
                    self.end_headers()
                    self.wfile.write(audio_bytes)
                    return
                except Exception:
                    pass

            try:
                asyncio.run(self.stream_edge(text, voice, rate, pitch, cache_path))
            except Exception:
                pass
            return

        # 2. Kiểm tra ElevenLabs API Key & Hạn mức ký tự
        if parsed.path == '/check_eleven':
            api_key = data.get('apiKey', '').strip() or self.headers.get('xi-api-key', '').strip()
            if not api_key:
                self.send_error_response(400, {'valid': False, 'message': 'Vui lòng cung cấp ElevenLabs API Key'})
                return

            try:
                req = urllib.request.Request(
                    'https://api.elevenlabs.io/v1/user/subscription',
                    headers={'xi-api-key': api_key}
                )
                with urllib.request.urlopen(req, timeout=10) as resp:
                    info = json.loads(resp.read().decode('utf-8'))
                    tier = info.get('tier', 'free')
                    used = info.get('character_count', 0)
                    limit = info.get('character_limit', 10000)
                    resp_body = json.dumps({
                        'valid': True,
                        'tier': tier,
                        'character_count': used,
                        'character_limit': limit,
                        'remaining': max(0, limit - used)
                    }).encode('utf-8')
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                    self.send_header('Content-Length', str(len(resp_body)))
                    self.end_headers()
                    self.wfile.write(resp_body)
            except urllib.error.HTTPError as he:
                try:
                    err_json = json.loads(he.read().decode('utf-8'))
                    raw_msg = err_json.get('detail', {}).get('message', '')
                    if 'must be exactly 51 characters' in raw_msg:
                        got_len = len(api_key)
                        friendly_msg = f"Key ElevenLabs bị thiếu ký tự! Chuẩn là 51 ký tự, bạn mới dán {got_len} ký tự (hãy copy lại trọn vẹn key)."
                    elif 'invalid_api_key' in str(err_json) or he.code == 401:
                        friendly_msg = "API Key không hợp lệ hoặc không tồn tại trên ElevenLabs."
                    else:
                        friendly_msg = raw_msg or f"ElevenLabs báo lỗi (Mã {he.code})"
                except Exception:
                    friendly_msg = f"ElevenLabs HTTP {he.code}"

                resp_body = json.dumps({'valid': False, 'message': friendly_msg}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Length', str(len(resp_body)))
                self.end_headers()
                self.wfile.write(resp_body)
            except Exception as e:
                resp_body = json.dumps({'valid': False, 'message': str(e)}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Length', str(len(resp_body)))
                self.end_headers()
                self.wfile.write(resp_body)
            return

        # 3. Tạo giọng đọc ElevenLabs (kèm Cache đệm thông minh)
        if parsed.path == '/tts_eleven':
            api_key = data.get('apiKey', '').strip() or self.headers.get('xi-api-key', '').strip()
            text = strip_emojis(data.get('text', '').strip())
            voice_id = data.get('voiceId', '21m00Tcm4TlvDq8ikWAM').strip() or '21m00Tcm4TlvDq8ikWAM'
            model_id = data.get('modelId', 'eleven_flash_v2_5').strip() or 'eleven_flash_v2_5'

            # Bọc float(stability/similarity) bằng try/except trả 400
            try:
                stability = float(data.get('stability', 0.5))
                similarity = float(data.get('similarity', 0.8))
            except (ValueError, TypeError):
                self.send_error_response(400, {'error': 'Tham số stability và similarity phải là số thực (float)'})
                return

            if not api_key:
                self.send_error_response(400, {'error': 'Thiếu ElevenLabs API Key'})
                return
            if not text:
                self.send_error_response(400, {'error': 'Thiếu nội dung văn bản'})
                return

            cache_hash = hashlib.md5(f"el_{voice_id}_{model_id}_{text}_{stability}_{similarity}".encode('utf-8')).hexdigest()
            cache_path = os.path.join(CACHE_DIR, f"el_{cache_hash}.mp3")

            if os.path.exists(cache_path) and os.path.getsize(cache_path) > 0:
                try:
                    with open(cache_path, 'rb') as f:
                        audio_bytes = f.read()
                    self.send_response(200)
                    self.send_header('Content-Type', 'audio/mpeg')
                    self.send_header('Content-Length', str(len(audio_bytes)))
                    self.send_header('X-Cache', 'HIT')
                    self.end_headers()
                    self.wfile.write(audio_bytes)
                    return
                except Exception:
                    pass

            try:
                payload = json.dumps({
                    "text": text,
                    "model_id": model_id,
                    "voice_settings": {
                        "stability": stability,
                        "similarity_boost": similarity,
                        "use_speaker_boost": True
                    }
                }).encode('utf-8')

                req = urllib.request.Request(
                    f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                    data=payload,
                    headers={
                        "Accept": "audio/mpeg",
                        "Content-Type": "application/json",
                        "xi-api-key": api_key
                    }
                )

                with urllib.request.urlopen(req, timeout=25) as resp:
                    audio_bytes = resp.read()

                tmp_path = cache_path + f".tmp.{os.getpid()}_{id(payload)}"
                try:
                    with open(tmp_path, 'wb') as f:
                        f.write(audio_bytes)
                    os.replace(tmp_path, cache_path)
                    enforce_cache_limit()
                except Exception:
                    if os.path.exists(tmp_path):
                        try:
                            os.remove(tmp_path)
                        except Exception:
                            pass

                self.send_response(200)
                self.send_header('Content-Type', 'audio/mpeg')
                self.send_header('Content-Length', str(len(audio_bytes)))
                self.send_header('X-Cache', 'MISS')
                self.end_headers()
                self.wfile.write(audio_bytes)
            except urllib.error.HTTPError as he:
                err_body = he.read().decode('utf-8', errors='replace')
                self.send_error_response(he.code, err_body)
            except Exception as e:
                self.send_error_response(500, str(e))
            return

        self.send_error_response(404, 'Not Found')

    def log_message(self, format, *args):
        pass

def main():
    try:
        server = ThreadingHTTPServer((HOST, PORT), NajimezTTSHandler)
    except OSError as e:
        if getattr(e, 'winerror', None) == 10048 or 'address already in use' in str(e).lower():
            try:
                with urllib.request.urlopen(f'http://{HOST}:{PORT}/health', timeout=2) as resp:
                    if resp.status == 200:
                        print(f"✨ Máy chủ TTS đã đang chạy ngầm sẵn sàng tại: http://{HOST}:{PORT}")
                        return
            except Exception:
                pass
            print(f"⚠️ Cổng {PORT} đang bị một tiến trình khác chiếm dụng.")
            return
        raise e

    print(f"============================================================")
    print(f"  NAJIMEZ AI VOICE SERVER (ElevenLabs + Edge Neural TTS)")
    print(f"  Địa chỉ: http://{HOST}:{PORT}")
    print(f"  1. ElevenLabs AI: Multilingual v2 & Flash v2.5")
    print(f"  2. Edge Neural TTS: Hoai My (Nu) & Nam Minh (Nam) - 100% Free")
    print(f"  Bộ nhớ đệm tiết kiệm quota: {CACHE_DIR}")
    print(f"============================================================")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__ == '__main__':
    main()
