"""
Network Sync Module - Manages synchronization across CPA firm ecosystem network

Handles synchronization of data and resources across multiple CPA firm
applications and network sites for centralized resource management.
"""

import asyncio
import aiohttp
import json
from typing import Dict, Any, List, Optional, Set
from datetime import datetime, timedelta
from pathlib import Path
import hashlib
import logging
from dataclasses import dataclass, asdict
from enum import Enum


class SyncStatus(Enum):
    IDLE = "idle"
    SYNCING = "syncing"
    ERROR = "error"
    COMPLETED = "completed"


@dataclass
class NetworkNode:
    id: str
    name: str
    url: str
    api_key: Optional[str] = None
    last_sync: Optional[datetime] = None
    sync_enabled: bool = True
    priority: int = 1  # 1=highest, 5=lowest
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        if self.last_sync:
            data['last_sync'] = self.last_sync.isoformat()
        return data


@dataclass
class SyncResult:
    node_id: str
    status: SyncStatus
    message: str
    records_synced: int = 0
    errors: List[str] = None
    duration: float = 0.0
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.errors is None:
            self.errors = []
        if self.timestamp is None:
            self.timestamp = datetime.now()


class NetworkSync:
    def __init__(self, config_path: str = "projectMgr/sync_config.json"):
        self.config_path = Path(config_path)
        self.nodes: Dict[str, NetworkNode] = {}
        self.sync_status = SyncStatus.IDLE
        self.current_sync_results: List[SyncResult] = []
        self.sync_history: List[Dict[str, Any]] = []
        
        # Setup logging
        self.logger = logging.getLogger(__name__)
        
        # Load configuration will be done when needed
    
    async def _load_config(self):
        """Load network synchronization configuration"""
        try:
            if self.config_path.exists():
                async with aiohttp.ClientSession() as session:
                    with open(self.config_path, 'r') as f:
                        config = json.load(f)
                        
                for node_data in config.get('nodes', []):
                    node = NetworkNode(**node_data)
                    if node_data.get('last_sync'):
                        node.last_sync = datetime.fromisoformat(node_data['last_sync'])
                    self.nodes[node.id] = node
            else:
                # Create default configuration
                await self._create_default_config()
        except Exception as e:
            self.logger.error(f"Error loading sync config: {e}")
            await self._create_default_config()
    
    async def _create_default_config(self):
        """Create default network synchronization configuration"""
        default_nodes = [
            NetworkNode(
                id="main_app",
                name="Main CPA Application",
                url="http://localhost:5000/api",
                priority=1
            ),
            NetworkNode(
                id="resource_hub",
                name="Resource Hub Portal", 
                url="http://localhost:3000/api",
                priority=2
            ),
            NetworkNode(
                id="client_portal",
                name="Client Portal",
                url="http://localhost:8080/api",
                priority=3,
                sync_enabled=False  # Disabled by default
            )
        ]
        
        for node in default_nodes:
            self.nodes[node.id] = node
        
        await self._save_config()
    
    async def _save_config(self):
        """Save network synchronization configuration"""
        try:
            # Ensure directory exists
            self.config_path.parent.mkdir(parents=True, exist_ok=True)
            
            config = {
                "nodes": [node.to_dict() for node in self.nodes.values()],
                "last_updated": datetime.now().isoformat()
            }
            
            with open(self.config_path, 'w') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
                
        except Exception as e:
            self.logger.error(f"Error saving sync config: {e}")
    
    async def add_network_node(self, node: NetworkNode) -> bool:
        """Add a new network node"""
        try:
            # Test connection first
            if await self._test_node_connection(node):
                self.nodes[node.id] = node
                await self._save_config()
                self.logger.info(f"Added network node: {node.name}")
                return True
            else:
                self.logger.warning(f"Failed to connect to node: {node.name}")
                return False
        except Exception as e:
            self.logger.error(f"Error adding network node: {e}")
            return False
    
    async def remove_network_node(self, node_id: str) -> bool:
        """Remove a network node"""
        try:
            if node_id in self.nodes:
                removed_node = self.nodes.pop(node_id)
                await self._save_config()
                self.logger.info(f"Removed network node: {removed_node.name}")
                return True
            return False
        except Exception as e:
            self.logger.error(f"Error removing network node: {e}")
            return False
    
    async def _test_node_connection(self, node: NetworkNode) -> bool:
        """Test connection to a network node"""
        try:
            headers = {}
            if node.api_key:
                headers['Authorization'] = f'Bearer {node.api_key}'
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{node.url}/health",
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    return response.status == 200
        except Exception as e:
            self.logger.warning(f"Connection test failed for {node.name}: {e}")
            return False
    
    async def sync_all_networks(self) -> List[SyncResult]:
        """Synchronize data across all enabled network nodes"""
        if self.sync_status == SyncStatus.SYNCING:
            self.logger.warning("Sync already in progress")
            return self.current_sync_results
        
        self.sync_status = SyncStatus.SYNCING
        self.current_sync_results = []
        
        try:
            # Get enabled nodes sorted by priority
            enabled_nodes = [
                node for node in self.nodes.values() 
                if node.sync_enabled
            ]
            enabled_nodes.sort(key=lambda x: x.priority)
            
            # Sync nodes concurrently with limited concurrency
            semaphore = asyncio.Semaphore(3)  # Max 3 concurrent syncs
            
            sync_tasks = [
                self._sync_single_node(node, semaphore)
                for node in enabled_nodes
            ]
            
            results = await asyncio.gather(*sync_tasks, return_exceptions=True)
            
            # Process results
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    error_result = SyncResult(
                        node_id=enabled_nodes[i].id,
                        status=SyncStatus.ERROR,
                        message=f"Sync failed: {str(result)}",
                        errors=[str(result)]
                    )
                    self.current_sync_results.append(error_result)
                else:
                    self.current_sync_results.append(result)
            
            # Update sync history
            await self._update_sync_history()
            
            self.sync_status = SyncStatus.COMPLETED
            self.logger.info(f"Network sync completed. Synced {len(enabled_nodes)} nodes")
            
        except Exception as e:
            self.sync_status = SyncStatus.ERROR
            self.logger.error(f"Network sync failed: {e}")
            
            error_result = SyncResult(
                node_id="all",
                status=SyncStatus.ERROR,
                message=f"Network sync failed: {str(e)}",
                errors=[str(e)]
            )
            self.current_sync_results = [error_result]
        
        return self.current_sync_results
    
    async def _sync_single_node(self, node: NetworkNode, semaphore: asyncio.Semaphore) -> SyncResult:
        """Synchronize data with a single network node"""
        async with semaphore:
            start_time = datetime.now()
            
            try:
                # Test connection first
                if not await self._test_node_connection(node):
                    return SyncResult(
                        node_id=node.id,
                        status=SyncStatus.ERROR,
                        message="Connection test failed",
                        errors=["Unable to connect to node"]
                    )
                
                # Sync different data types
                sync_operations = [
                    self._sync_toolkit_data(node),
                    self._sync_resource_data(node),
                    self._sync_configuration_data(node)
                ]
                
                operation_results = await asyncio.gather(*sync_operations, return_exceptions=True)
                
                # Aggregate results
                total_records = 0
                errors = []
                
                for result in operation_results:
                    if isinstance(result, Exception):
                        errors.append(str(result))
                    else:
                        total_records += result.get('records_synced', 0)
                        if result.get('errors'):
                            errors.extend(result['errors'])
                
                # Update node's last sync time
                node.last_sync = datetime.now()
                await self._save_config()
                
                duration = (datetime.now() - start_time).total_seconds()
                
                return SyncResult(
                    node_id=node.id,
                    status=SyncStatus.ERROR if errors else SyncStatus.COMPLETED,
                    message=f"Synced {total_records} records" if not errors else f"Completed with {len(errors)} errors",
                    records_synced=total_records,
                    errors=errors,
                    duration=duration
                )
                
            except Exception as e:
                duration = (datetime.now() - start_time).total_seconds()
                return SyncResult(
                    node_id=node.id,
                    status=SyncStatus.ERROR,
                    message=f"Sync failed: {str(e)}",
                    errors=[str(e)],
                    duration=duration
                )
    
    async def _sync_toolkit_data(self, node: NetworkNode) -> Dict[str, Any]:
        """Sync ProjectToolkit data with a node"""
        try:
            from .content_loader import ContentLoader
            content_loader = ContentLoader()
            
            # Load all toolkit data
            toolkit_data = await content_loader.load_all_toolkit_data()
            
            # Send to node
            headers = {'Content-Type': 'application/json'}
            if node.api_key:
                headers['Authorization'] = f'Bearer {node.api_key}'
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{node.url}/toolkit/sync",
                    json=toolkit_data,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    
                    if response.status == 200:
                        response_data = await response.json()
                        return {
                            'records_synced': len(toolkit_data),
                            'errors': []
                        }
                    else:
                        return {
                            'records_synced': 0,
                            'errors': [f"HTTP {response.status}: {await response.text()}"]
                        }
                        
        except Exception as e:
            return {
                'records_synced': 0,
                'errors': [f"Toolkit sync error: {str(e)}"]
            }
    
    async def _sync_resource_data(self, node: NetworkNode) -> Dict[str, Any]:
        """Sync resource data with a node"""
        try:
            # Get resources from main application
            async with aiohttp.ClientSession() as session:
                async with session.get("http://localhost:5000/api/resources") as response:
                    if response.status == 200:
                        resources = await response.json()
                        
                        # Send to target node
                        headers = {'Content-Type': 'application/json'}
                        if node.api_key:
                            headers['Authorization'] = f'Bearer {node.api_key}'
                        
                        async with session.post(
                            f"{node.url}/resources/sync",
                            json=resources,
                            headers=headers,
                            timeout=aiohttp.ClientTimeout(total=30)
                        ) as sync_response:
                            
                            if sync_response.status == 200:
                                return {
                                    'records_synced': len(resources) if isinstance(resources, list) else 1,
                                    'errors': []
                                }
                            else:
                                return {
                                    'records_synced': 0,
                                    'errors': [f"Resource sync failed: HTTP {sync_response.status}"]
                                }
                    else:
                        return {
                            'records_synced': 0,
                            'errors': [f"Failed to fetch resources: HTTP {response.status}"]
                        }
                        
        except Exception as e:
            return {
                'records_synced': 0,
                'errors': [f"Resource sync error: {str(e)}"]
            }
    
    async def _sync_configuration_data(self, node: NetworkNode) -> Dict[str, Any]:
        """Sync configuration data with a node"""
        try:
            # Load configuration files
            config_files = [
                "package.json",
                "theme.json"
            ]
            
            config_data = {}
            for config_file in config_files:
                try:
                    config_path = Path(config_file)
                    if config_path.exists():
                        with open(config_path, 'r') as f:
                            config_data[config_file] = json.load(f)
                except Exception as e:
                    self.logger.warning(f"Could not load {config_file}: {e}")
            
            if not config_data:
                return {'records_synced': 0, 'errors': []}
            
            # Send configuration to node
            headers = {'Content-Type': 'application/json'}
            if node.api_key:
                headers['Authorization'] = f'Bearer {node.api_key}'
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{node.url}/config/sync",
                    json=config_data,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    
                    if response.status == 200:
                        return {
                            'records_synced': len(config_data),
                            'errors': []
                        }
                    else:
                        return {
                            'records_synced': 0,
                            'errors': [f"Config sync failed: HTTP {response.status}"]
                        }
                        
        except Exception as e:
            return {
                'records_synced': 0,
                'errors': [f"Config sync error: {str(e)}"]
            }
    
    async def _update_sync_history(self):
        """Update synchronization history"""
        history_entry = {
            'timestamp': datetime.now().isoformat(),
            'total_nodes': len([n for n in self.nodes.values() if n.sync_enabled]),
            'successful_nodes': len([r for r in self.current_sync_results if r.status == SyncStatus.COMPLETED]),
            'failed_nodes': len([r for r in self.current_sync_results if r.status == SyncStatus.ERROR]),
            'total_records_synced': sum(r.records_synced for r in self.current_sync_results),
            'results': [
                {
                    'node_id': r.node_id,
                    'status': r.status.value,
                    'message': r.message,
                    'records_synced': r.records_synced,
                    'duration': r.duration,
                    'errors': r.errors
                }
                for r in self.current_sync_results
            ]
        }
        
        self.sync_history.append(history_entry)
        
        # Keep only last 50 sync records
        if len(self.sync_history) > 50:
            self.sync_history = self.sync_history[-50:]
    
    async def get_sync_status(self) -> Dict[str, Any]:
        """Get current synchronization status"""
        return {
            'status': self.sync_status.value,
            'nodes': {
                node_id: {
                    'name': node.name,
                    'url': node.url,
                    'enabled': node.sync_enabled,
                    'priority': node.priority,
                    'last_sync': node.last_sync.isoformat() if node.last_sync else None,
                    'connection_status': await self._test_node_connection(node)
                }
                for node_id, node in self.nodes.items()
            },
            'last_sync_results': [
                {
                    'node_id': r.node_id,
                    'status': r.status.value,
                    'message': r.message,
                    'records_synced': r.records_synced,
                    'duration': r.duration,
                    'timestamp': r.timestamp.isoformat()
                }
                for r in self.current_sync_results
            ],
            'sync_history_count': len(self.sync_history)
        }
    
    async def schedule_periodic_sync(self, interval_hours: int = 24):
        """Schedule periodic synchronization"""
        while True:
            try:
                await asyncio.sleep(interval_hours * 3600)  # Convert hours to seconds
                self.logger.info("Starting scheduled network sync")
                await self.sync_all_networks()
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Scheduled sync error: {e}")
    
    async def sync_specific_nodes(self, node_ids: List[str]) -> List[SyncResult]:
        """Synchronize specific nodes only"""
        if self.sync_status == SyncStatus.SYNCING:
            self.logger.warning("Sync already in progress")
            return []
        
        self.sync_status = SyncStatus.SYNCING
        results = []
        
        try:
            # Filter nodes
            target_nodes = [
                node for node_id, node in self.nodes.items()
                if node_id in node_ids and node.sync_enabled
            ]
            
            # Sync nodes
            semaphore = asyncio.Semaphore(3)
            sync_tasks = [
                self._sync_single_node(node, semaphore)
                for node in target_nodes
            ]
            
            results = await asyncio.gather(*sync_tasks, return_exceptions=True)
            
            # Process results
            processed_results = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    error_result = SyncResult(
                        node_id=target_nodes[i].id,
                        status=SyncStatus.ERROR,
                        message=f"Sync failed: {str(result)}",
                        errors=[str(result)]
                    )
                    processed_results.append(error_result)
                else:
                    processed_results.append(result)
            
            self.sync_status = SyncStatus.COMPLETED
            return processed_results
            
        except Exception as e:
            self.sync_status = SyncStatus.ERROR
            self.logger.error(f"Specific node sync failed: {e}")
            return []