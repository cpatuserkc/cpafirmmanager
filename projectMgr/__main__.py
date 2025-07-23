"""
Main entry point for ProjectMgr package

Allows running the package as a module: python -m projectMgr
"""

from .cli import cli

if __name__ == "__main__":
    cli()