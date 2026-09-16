"""Start local services without duplicate processes or changing Windows settings."""
from pathlib import Path
import os
import shutil
import socket
import subprocess
import sys
import time
import urllib.request

root = Path(__file__).resolve().parent.parent
backend = Path.home() / "Downloads/skillshift-api"
node = Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe"
node_command = str(node) if node.exists() else shutil.which("node")

def listening(port):
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=1):
            return True
    except OSError:
        return False

def start(command, cwd, label):
    logs = root / "work"
    logs.mkdir(exist_ok=True)
    with (logs / f"{label}.stdout.log").open("w") as out, (logs / f"{label}.stderr.log").open("w") as err:
        subprocess.Popen(command, cwd=cwd, stdin=subprocess.DEVNULL, stdout=out, stderr=err,
                         creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
                         close_fds=True)

def main():
    if not node_command or not (root / ".next/BUILD_ID").exists():
        raise RuntimeError("Node or production build missing. Install dependencies and run pnpm build first.")
    if not (backend / "main.py").exists():
        raise RuntimeError("Backend missing: Downloads/skillshift-api/main.py")
    if not listening(8000):
        start([sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"], backend, "gemini-backend")
    if not listening(3000):
        start([node_command, "node_modules/next/dist/bin/next", "start", "--hostname", "0.0.0.0"], root, "frontend")
    for url in ("http://localhost:8000/api/market/overview", "http://localhost:3000/login"):
        for attempt in range(15):
            try:
                with urllib.request.urlopen(url, timeout=4) as response:
                    if response.status == 200:
                        break
            except (OSError, TimeoutError):
                time.sleep(1)
        else:
            raise RuntimeError(f"Service unavailable: {url}. Check logs in {root / 'work'}")
    print("SkillMAP is ready: http://localhost:3000/dashboard")
    print("You can close this window. Services remain running until Windows or the processes stop.")

if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Unable to start SkillMAP: {error}", file=sys.stderr)
        sys.exit(1)
