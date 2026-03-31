#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
 
 
def main():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'delivery_admin.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Não foi possível importar o Django. "
            "Verifique se está instalado e disponível na variável PYTHONPATH."
        ) from exc
    execute_from_command_line(sys.argv)
 
 
if __name__ == '__main__':
    main()
