#!/usr/bin/env python
import os
import sys
from dotenv import load_dotenv

def main():
    load_dotenv()
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    
    # Handle custom port 5000 by default if runserver is called
    if len(sys.argv) > 1 and sys.argv[1] == 'runserver' and len(sys.argv) == 2:
        sys.argv.append('5000')
        
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
