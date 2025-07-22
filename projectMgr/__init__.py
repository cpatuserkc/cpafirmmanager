"""
ProjectMgr - Internal Development Tool for CPA Firm Resources Ecosystem

A comprehensive toolkit for managing, testing, and deploying CPA firm resource data
across multiple platforms and applications.

Features:
- API management and testing
- Data loading/publishing pipeline
- Desktop client for content management
- Network synchronization across CPA firm ecosystem
- Development server for local testing
"""

__version__ = "1.0.0"
__author__ = "CPA Resource Hub Development Team"

from .api_server import APIServer
from .data_manager import DataManager
from .desktop_client import DesktopClient
from .content_loader import ContentLoader
from .network_sync import NetworkSync

__all__ = [
    "APIServer",
    "DataManager", 
    "DesktopClient",
    "ContentLoader",
    "NetworkSync"
]