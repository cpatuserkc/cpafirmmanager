"""
Content Loader Module - Manages ProjectToolkit content loading and updating

Handles the loading, caching, and updating of ProjectToolkit JSON data
for dynamic content management in the CPA firm resources ecosystem.
"""

import json
import aiofiles
import asyncio
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime
import hashlib


class ContentLoader:
    def __init__(self, toolkit_path: str = "ProjectToolkit"):
        self.toolkit_path = Path(toolkit_path)
        self.cache = {}
        self.cache_timestamps = {}
        self.file_hashes = {}
        
        # Ensure toolkit directory exists
        self.toolkit_path.mkdir(exist_ok=True)
        
        # Initialize with default structure if empty - will be called manually when needed
    
    async def _ensure_default_structure(self):
        """Ensure default ProjectToolkit structure exists"""
        default_files = {
            "cpa_data.json": {
                "professional_roles": [
                    {"id": 1, "name": "Senior Partner", "tier": "senior", "rate_multiplier": 1.5},
                    {"id": 2, "name": "Partner", "tier": "senior", "rate_multiplier": 1.3},
                    {"id": 3, "name": "Senior Manager", "tier": "senior", "rate_multiplier": 1.2},
                    {"id": 4, "name": "Manager", "tier": "mid", "rate_multiplier": 1.0},
                    {"id": 5, "name": "Senior Associate", "tier": "mid", "rate_multiplier": 0.9},
                    {"id": 6, "name": "Associate", "tier": "junior", "rate_multiplier": 0.7},
                    {"id": 7, "name": "Staff Accountant", "tier": "junior", "rate_multiplier": 0.6}
                ],
                "service_categories": [
                    {"id": 1, "name": "Tax Preparation", "base_rate": 150},
                    {"id": 2, "name": "Audit & Assurance", "base_rate": 200},
                    {"id": 3, "name": "Bookkeeping", "base_rate": 75},
                    {"id": 4, "name": "Consulting", "base_rate": 250},
                    {"id": 5, "name": "Payroll Services", "base_rate": 100}
                ],
                "client_industries": [
                    "Technology", "Healthcare", "Manufacturing", "Retail", 
                    "Real Estate", "Professional Services", "Non-Profit",
                    "Construction", "Restaurant & Hospitality", "Agriculture"
                ],
                "time_categories": [
                    "Billable - Client Work", "Non-Billable - Admin", 
                    "Non-Billable - Marketing", "Non-Billable - Training",
                    "Non-Billable - Business Development"
                ]
            },
            "forms_config.json": {
                "client_onboarding": {
                    "fields": [
                        {"name": "company_name", "type": "text", "required": True},
                        {"name": "industry", "type": "select", "required": True, "options_source": "client_industries"},
                        {"name": "ein", "type": "text", "pattern": "^\\d{2}-\\d{7}$"},
                        {"name": "contact_name", "type": "text", "required": True},
                        {"name": "email", "type": "email", "required": True},
                        {"name": "phone", "type": "tel", "required": True}
                    ]
                },
                "project_setup": {
                    "fields": [
                        {"name": "project_name", "type": "text", "required": True},
                        {"name": "service_category", "type": "select", "required": True, "options_source": "service_categories"},
                        {"name": "estimated_hours", "type": "number", "min": 1},
                        {"name": "deadline", "type": "date", "required": True},
                        {"name": "assigned_role", "type": "select", "required": True, "options_source": "professional_roles"}
                    ]
                }
            },
            "menu_structure.json": {
                "main_navigation": [
                    {"id": "dashboard", "label": "Dashboard", "icon": "LayoutDashboard", "path": "/"},
                    {"id": "clients", "label": "Clients", "icon": "Users", "path": "/clients"},
                    {"id": "projects", "label": "Projects", "icon": "FolderOpen", "path": "/projects"},
                    {"id": "time-tracking", "label": "Time Tracking", "icon": "Clock", "path": "/time-tracking"},
                    {"id": "proposals", "label": "Proposals", "icon": "FileText", "path": "/proposals"},
                    {"id": "resources", "label": "Resources", "icon": "BookOpen", "path": "/resources"},
                    {"id": "analytics", "label": "Analytics", "icon": "BarChart3", "path": "/analytics"}
                ],
                "admin_navigation": [
                    {"id": "settings", "label": "Settings", "icon": "Settings", "path": "/settings"},
                    {"id": "users", "label": "User Management", "icon": "UserCog", "path": "/admin/users"},
                    {"id": "billing", "label": "Billing", "icon": "CreditCard", "path": "/admin/billing"}
                ]
            },
            "validation_rules.json": {
                "ein_format": "^\\d{2}-\\d{7}$",
                "phone_format": "^\\(?([0-9]{3})\\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$",
                "email_format": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
                "required_fields": {
                    "client": ["company_name", "contact_name", "email"],
                    "project": ["project_name", "service_category", "deadline"],
                    "proposal": ["title", "client_id", "total_amount"]
                }
            },
            "error_messages.json": {
                "validation": {
                    "required_field": "This field is required",
                    "invalid_email": "Please enter a valid email address",
                    "invalid_phone": "Please enter a valid phone number",
                    "invalid_ein": "Please enter a valid EIN (XX-XXXXXXX format)",
                    "min_length": "Minimum {min} characters required",
                    "max_length": "Maximum {max} characters allowed"
                },
                "api": {
                    "network_error": "Network connection error. Please try again.",
                    "server_error": "Server error. Please contact support if this persists.",
                    "unauthorized": "You don't have permission to perform this action.",
                    "not_found": "The requested resource was not found."
                }
            }
        }
        
        for filename, content in default_files.items():
            file_path = self.toolkit_path / filename
            if not file_path.exists():
                await self._write_json_file(file_path, content)
    
    async def load_all_toolkit_data(self) -> Dict[str, Any]:
        """Load all ProjectToolkit data files"""
        all_data = {}
        
        if not self.toolkit_path.exists():
            return all_data
        
        for json_file in self.toolkit_path.glob("*.json"):
            try:
                file_key = json_file.stem
                data = await self.load_toolkit_file(json_file.name)
                all_data[file_key] = data
            except Exception as e:
                all_data[json_file.stem] = {"error": f"Failed to load: {str(e)}"}
        
        return all_data
    
    async def load_toolkit_file(self, filename: str, use_cache: bool = True) -> Dict[str, Any]:
        """Load a specific ProjectToolkit file"""
        file_path = self.toolkit_path / filename
        
        if not file_path.exists():
            raise FileNotFoundError(f"Toolkit file not found: {filename}")
        
        # Check cache if enabled
        if use_cache and filename in self.cache:
            # Check if file has been modified
            current_hash = await self._get_file_hash(file_path)
            if current_hash == self.file_hashes.get(filename):
                return self.cache[filename]
        
        # Load from file
        async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
            content = await f.read()
            data = json.loads(content)
        
        # Update cache
        if use_cache:
            self.cache[filename] = data
            self.cache_timestamps[filename] = datetime.now()
            self.file_hashes[filename] = await self._get_file_hash(file_path)
        
        return data
    
    async def update_toolkit_data(self, content: Dict[str, Any]) -> Dict[str, Any]:
        """Update multiple toolkit files"""
        results = {}
        
        for filename, data in content.items():
            try:
                if not filename.endswith('.json'):
                    filename += '.json'
                
                result = await self.update_toolkit_file(filename, data)
                results[filename] = result
            except Exception as e:
                results[filename] = {"error": str(e)}
        
        return results
    
    async def update_toolkit_file(self, filename: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a specific toolkit file"""
        if not filename.endswith('.json'):
            filename += '.json'
        
        file_path = self.toolkit_path / filename
        
        # Create backup if file exists
        backup_info = None
        if file_path.exists():
            backup_info = await self._create_backup(file_path)
        
        try:
            # Write new data
            await self._write_json_file(file_path, data)
            
            # Update cache
            self.cache[filename] = data
            self.cache_timestamps[filename] = datetime.now()
            self.file_hashes[filename] = await self._get_file_hash(file_path)
            
            return {
                "filename": filename,
                "updated_at": datetime.now().isoformat(),
                "backup": backup_info,
                "size": file_path.stat().st_size
            }
        except Exception as e:
            # Restore backup if available
            if backup_info:
                await self._restore_backup(backup_info["backup_path"], file_path)
            raise Exception(f"Failed to update {filename}: {str(e)}")
    
    async def get_content_structure(self) -> Dict[str, Any]:
        """Get the structure of all toolkit content"""
        structure = {}
        
        if not self.toolkit_path.exists():
            return structure
        
        for json_file in self.toolkit_path.glob("*.json"):
            try:
                data = await self.load_toolkit_file(json_file.name, use_cache=False)
                structure[json_file.stem] = self._analyze_structure(data)
            except Exception as e:
                structure[json_file.stem] = {"error": str(e)}
        
        return structure
    
    def _analyze_structure(self, data: Any, max_depth: int = 3, current_depth: int = 0) -> Dict[str, Any]:
        """Analyze the structure of data"""
        if current_depth >= max_depth:
            return {"type": type(data).__name__, "truncated": True}
        
        if isinstance(data, dict):
            return {
                "type": "object",
                "keys": list(data.keys()),
                "properties": {
                    key: self._analyze_structure(value, max_depth, current_depth + 1)
                    for key, value in list(data.items())[:10]  # Limit to first 10 items
                }
            }
        elif isinstance(data, list):
            return {
                "type": "array",
                "length": len(data),
                "item_type": self._analyze_structure(data[0], max_depth, current_depth + 1) if data else "unknown"
            }
        else:
            return {
                "type": type(data).__name__,
                "value": str(data)[:100] if isinstance(data, str) else data
            }
    
    async def _write_json_file(self, file_path: Path, data: Dict[str, Any]):
        """Write data to JSON file with proper formatting"""
        async with aiofiles.open(file_path, 'w', encoding='utf-8') as f:
            await f.write(json.dumps(data, indent=2, ensure_ascii=False))
    
    async def _get_file_hash(self, file_path: Path) -> str:
        """Get MD5 hash of file content"""
        async with aiofiles.open(file_path, 'rb') as f:
            content = await f.read()
            return hashlib.md5(content).hexdigest()
    
    async def _create_backup(self, file_path: Path) -> Dict[str, Any]:
        """Create a backup of the file"""
        timestamp = int(datetime.now().timestamp())
        backup_name = f"{file_path.stem}.backup.{timestamp}.json"
        backup_path = file_path.parent / "backups" / backup_name
        
        # Ensure backup directory exists
        backup_path.parent.mkdir(exist_ok=True)
        
        # Copy file
        async with aiofiles.open(file_path, 'rb') as src:
            async with aiofiles.open(backup_path, 'wb') as dst:
                await dst.write(await src.read())
        
        return {
            "backup_path": str(backup_path),
            "original_path": str(file_path),
            "created_at": datetime.now().isoformat()
        }
    
    async def _restore_backup(self, backup_path: str, target_path: Path):
        """Restore a file from backup"""
        async with aiofiles.open(backup_path, 'rb') as src:
            async with aiofiles.open(target_path, 'wb') as dst:
                await dst.write(await src.read())
    
    def clear_cache(self, filename: Optional[str] = None):
        """Clear cache for specific file or all files"""
        if filename:
            self.cache.pop(filename, None)
            self.cache_timestamps.pop(filename, None)
            self.file_hashes.pop(filename, None)
        else:
            self.cache.clear()
            self.cache_timestamps.clear()
            self.file_hashes.clear()
    
    async def validate_content(self, content: Dict[str, Any]) -> Dict[str, Any]:
        """Validate toolkit content structure"""
        validation_results = {}
        
        for filename, data in content.items():
            try:
                # Basic JSON validation
                json.dumps(data)
                
                # File-specific validation
                if filename == "cpa_data.json":
                    validation_results[filename] = self._validate_cpa_data(data)
                elif filename == "forms_config.json":
                    validation_results[filename] = self._validate_forms_config(data)
                elif filename == "menu_structure.json":
                    validation_results[filename] = self._validate_menu_structure(data)
                else:
                    validation_results[filename] = {"valid": True, "message": "Basic validation passed"}
                    
            except Exception as e:
                validation_results[filename] = {"valid": False, "error": str(e)}
        
        return validation_results
    
    def _validate_cpa_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate CPA data structure"""
        required_keys = ["professional_roles", "service_categories", "client_industries"]
        missing_keys = [key for key in required_keys if key not in data]
        
        if missing_keys:
            return {"valid": False, "error": f"Missing required keys: {missing_keys}"}
        
        return {"valid": True, "message": "CPA data structure is valid"}
    
    def _validate_forms_config(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate forms configuration structure"""
        if not isinstance(data, dict):
            return {"valid": False, "error": "Forms config must be an object"}
        
        for form_name, form_config in data.items():
            if "fields" not in form_config:
                return {"valid": False, "error": f"Form '{form_name}' missing 'fields' property"}
        
        return {"valid": True, "message": "Forms configuration is valid"}
    
    def _validate_menu_structure(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate menu structure"""
        if "main_navigation" not in data:
            return {"valid": False, "error": "Missing 'main_navigation' property"}
        
        for item in data["main_navigation"]:
            required_props = ["id", "label", "path"]
            missing_props = [prop for prop in required_props if prop not in item]
            if missing_props:
                return {"valid": False, "error": f"Menu item missing properties: {missing_props}"}
        
        return {"valid": True, "message": "Menu structure is valid"}