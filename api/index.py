import os
import sys
from pathlib import Path

# Fallback path resolution if PYTHONPATH is not picked up
backend_dir = Path(__file__).parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Standard Django Setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

try:
    from config.wsgi import application
except ImportError as e:
    # Diagnostic info if it still fails
    print(f"ImportError: {e}")
    print(f"Current sys.path: {sys.path}")
    print(f"Current PYTHONPATH: {os.environ.get('PYTHONPATH')}")
    raise

# Vercel entry point
app = application
