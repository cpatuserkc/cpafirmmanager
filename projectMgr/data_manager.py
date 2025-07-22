"""
Data Manager Module - Handles data loading, publishing, and synchronization

Manages the flow of data between static JSON files, the main application,
and external endpoints for the CPA firm resources ecosystem.
"""

import json
import aiofiles
import asyncio
import httpx
from pathlib import Path
from typing import Dict, Any, List, Optional, Union
from datetime import datetime
import shutil
import os


class DataManager:
    def __init__(self, base_path: str = "."):
        self.base_path = Path(base_path)
        self.toolkit_path = self.base_path / "ProjectToolkit"
        self.shared_path = self.base_path / "shared"
        self.client_path = self.base_path / "client" / "src"
        
        # Ensure directories exist
        self.toolkit_path.mkdir(exist_ok=True)
    
    async def load_data_file(self, file_path: str) -> Dict[str, Any]:
        """Load data from a JSON file"""
        try:
            full_path = self.base_path / file_path
            if not full_path.exists():
                raise FileNotFoundError(f"File not found: {file_path}")
            
            async with aiofiles.open(full_path, 'r', encoding='utf-8') as f:
                content = await f.read()
                data = json.loads(content)
            
            return {
                "file_path": str(full_path),
                "data": data,
                "size": len(content),
                "loaded_at": datetime.now().isoformat()
            }
        except Exception as e:
            raise Exception(f"Error loading data file {file_path}: {str(e)}")
    
    async def publish_data(self, data: Dict[str, Any], target_path: str) -> Dict[str, Any]:
        """Publish data to a JSON file or external endpoint"""
        try:
            if target_path.startswith("http"):
                # External endpoint
                return await self._publish_to_endpoint(data, target_path)
            else:
                # Local file
                return await self._publish_to_file(data, target_path)
        except Exception as e:
            raise Exception(f"Error publishing data to {target_path}: {str(e)}")
    
    async def _publish_to_file(self, data: Dict[str, Any], file_path: str) -> Dict[str, Any]:
        """Publish data to a local JSON file"""
        full_path = self.base_path / file_path
        
        # Create directory if it doesn't exist
        full_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Backup existing file if it exists
        if full_path.exists():
            backup_path = full_path.with_suffix(f".backup.{int(datetime.now().timestamp())}.json")
            shutil.copy2(full_path, backup_path)
        
        # Write new data
        async with aiofiles.open(full_path, 'w', encoding='utf-8') as f:
            await f.write(json.dumps(data, indent=2, ensure_ascii=False))
        
        return {
            "target_path": str(full_path),
            "size": full_path.stat().st_size,
            "published_at": datetime.now().isoformat()
        }
    
    async def _publish_to_endpoint(self, data: Dict[str, Any], endpoint: str) -> Dict[str, Any]:
        """Publish data to an external API endpoint"""
        async with httpx.AsyncClient() as client:
            response = await client.post(endpoint, json=data)
            response.raise_for_status()
            
            return {
                "endpoint": endpoint,
                "status_code": response.status_code,
                "response": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text,
                "published_at": datetime.now().isoformat()
            }
    
    async def sync_data(self, 
                       source_path: str, 
                       target_endpoint: str, 
                       sync_type: str = "push",
                       filter_criteria: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Synchronize data between source and target"""
        
        try:
            if sync_type == "push":
                return await self._sync_push(source_path, target_endpoint, filter_criteria)
            elif sync_type == "pull":
                return await self._sync_pull(source_path, target_endpoint, filter_criteria)
            elif sync_type == "bidirectional":
                return await self._sync_bidirectional(source_path, target_endpoint, filter_criteria)
            else:
                raise ValueError(f"Invalid sync type: {sync_type}")
        except Exception as e:
            raise Exception(f"Error synchronizing data: {str(e)}")
    
    async def _sync_push(self, source_path: str, target_endpoint: str, filter_criteria: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Push data from source to target"""
        # Load source data
        source_data = await self.load_data_file(source_path)
        data_to_sync = source_data["data"]
        
        # Apply filters if provided
        if filter_criteria:
            data_to_sync = self._apply_filters(data_to_sync, filter_criteria)
        
        # Push to target
        result = await self.publish_data(data_to_sync, target_endpoint)
        
        return {
            "sync_type": "push",
            "source": source_path,
            "target": target_endpoint,
            "records_synced": len(data_to_sync) if isinstance(data_to_sync, list) else 1,
            "result": result
        }
    
    async def _sync_pull(self, source_path: str, target_endpoint: str, filter_criteria: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Pull data from target to source"""
        # Fetch data from target endpoint
        async with httpx.AsyncClient() as client:
            response = await client.get(target_endpoint)
            response.raise_for_status()
            remote_data = response.json()
        
        # Apply filters if provided
        if filter_criteria:
            remote_data = self._apply_filters(remote_data, filter_criteria)
        
        # Save to source
        result = await self.publish_data(remote_data, source_path)
        
        return {
            "sync_type": "pull",
            "source": target_endpoint,
            "target": source_path,
            "records_synced": len(remote_data) if isinstance(remote_data, list) else 1,
            "result": result
        }
    
    async def _sync_bidirectional(self, source_path: str, target_endpoint: str, filter_criteria: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Perform bidirectional synchronization"""
        # This is a simplified implementation - in practice, you'd need conflict resolution
        push_result = await self._sync_push(source_path, target_endpoint, filter_criteria)
        pull_result = await self._sync_pull(source_path, target_endpoint, filter_criteria)
        
        return {
            "sync_type": "bidirectional",
            "push_result": push_result,
            "pull_result": pull_result
        }
    
    def _apply_filters(self, data: Dict[str, Any], filter_criteria: Dict[str, Any]) -> Dict[str, Any]:
        """Apply filter criteria to data"""
        # Simple implementation - can be extended for complex filtering
        if isinstance(data, list):
            filtered_data = []
            for item in data:
                if self._matches_criteria(item, filter_criteria):
                    filtered_data.append(item)
            return filtered_data
        elif isinstance(data, dict):
            if self._matches_criteria(data, filter_criteria):
                return data
            else:
                return {}
        return data
    
    def _matches_criteria(self, item: Dict[str, Any], criteria: Dict[str, Any]) -> bool:
        """Check if an item matches the filter criteria"""
        for key, value in criteria.items():
            if key not in item or item[key] != value:
                return False
        return True
    
    async def get_toolkit_structure(self) -> Dict[str, Any]:
        """Get the structure of the ProjectToolkit directory"""
        structure = {}
        
        if self.toolkit_path.exists():
            for file_path in self.toolkit_path.rglob("*.json"):
                relative_path = file_path.relative_to(self.toolkit_path)
                try:
                    async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                        content = await f.read()
                        data = json.loads(content)
                        structure[str(relative_path)] = {
                            "size": len(content),
                            "keys": list(data.keys()) if isinstance(data, dict) else "array",
                            "last_modified": datetime.fromtimestamp(file_path.stat().st_mtime).isoformat()
                        }
                except Exception as e:
                    structure[str(relative_path)] = {"error": str(e)}
        
        return structure
    
    async def backup_toolkit_data(self) -> str:
        """Create a backup of all toolkit data"""
        timestamp = int(datetime.now().timestamp())
        backup_dir = self.base_path / f"toolkit_backup_{timestamp}"
        
        if self.toolkit_path.exists():
            shutil.copytree(self.toolkit_path, backup_dir)
        
        return str(backup_dir)
    
    async def restore_toolkit_data(self, backup_path: str) -> Dict[str, Any]:
        """Restore toolkit data from a backup"""
        backup_dir = Path(backup_path)
        
        if not backup_dir.exists():
            raise FileNotFoundError(f"Backup directory not found: {backup_path}")
        
        # Backup current data first
        current_backup = await self.backup_toolkit_data()
        
        try:
            # Remove current toolkit directory
            if self.toolkit_path.exists():
                shutil.rmtree(self.toolkit_path)
            
            # Restore from backup
            shutil.copytree(backup_dir, self.toolkit_path)
            
            return {
                "restored_from": backup_path,
                "current_backup": current_backup,
                "restored_at": datetime.now().isoformat()
            }
        except Exception as e:
            # If restoration fails, try to restore the current backup
            if Path(current_backup).exists():
                shutil.copytree(Path(current_backup), self.toolkit_path)
            raise Exception(f"Error restoring toolkit data: {str(e)}")