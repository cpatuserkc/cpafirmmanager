"""
API Server Module - FastAPI-based development server for ProjectMgr

Provides a local development server for testing and managing the CPA firm
resources ecosystem APIs.
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import uvicorn
import json
import os
import asyncio
import httpx
from datetime import datetime
from pathlib import Path

from .data_manager import DataManager
from .content_loader import ContentLoader
from .network_sync import NetworkSync


class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class DataSyncRequest(BaseModel):
    source_path: str
    target_endpoint: str
    sync_type: str = Field(default="push")  # push, pull, bidirectional
    filter_criteria: Optional[Dict[str, Any]] = None


class TestRequest(BaseModel):
    endpoint: str
    method: str = "GET"
    headers: Optional[Dict[str, str]] = None
    payload: Optional[Dict[str, Any]] = None


class APIServer:
    def __init__(self, host: str = "localhost", port: int = 8001):
        self.host = host
        self.port = port
        self.app = FastAPI(
            title="ProjectMgr Development Server",
            description="Internal development API for CPA firm resources ecosystem",
            version="1.0.0"
        )
        # Initialize components (async initialization will be handled when needed)
        self.data_manager = DataManager()
        self.content_loader = ContentLoader()
        self.network_sync = NetworkSync()
        
        self._setup_middleware()
        self._setup_routes()
    
    def _setup_middleware(self):
        """Configure CORS and other middleware"""
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["http://localhost:3000", "http://localhost:5000"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    
    def _setup_routes(self):
        """Setup all API routes"""
        
        @self.app.get("/", response_model=APIResponse)
        async def root():
            return APIResponse(
                success=True,
                message="ProjectMgr Development Server is running",
                data={
                    "version": "1.0.0",
                    "endpoints": [
                        "/data/load",
                        "/data/publish", 
                        "/data/sync",
                        "/content/toolkit",
                        "/api/test",
                        "/network/sync"
                    ]
                }
            )
        
        @self.app.get("/health")
        async def health_check():
            return {"status": "healthy", "timestamp": datetime.now().isoformat()}
        
        # Data Management Routes
        @self.app.post("/data/load", response_model=APIResponse)
        async def load_data(file_path: str):
            """Load data from JSON files into the main application"""
            try:
                result = await self.data_manager.load_data_file(file_path)
                return APIResponse(
                    success=True,
                    message=f"Successfully loaded data from {file_path}",
                    data=result
                )
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/data/publish", response_model=APIResponse)
        async def publish_data(data: Dict[str, Any], target_path: str):
            """Publish data to JSON files or external endpoints"""
            try:
                result = await self.data_manager.publish_data(data, target_path)
                return APIResponse(
                    success=True,
                    message=f"Successfully published data to {target_path}",
                    data=result
                )
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/data/sync", response_model=APIResponse)
        async def sync_data(sync_request: DataSyncRequest):
            """Synchronize data between different sources"""
            try:
                result = await self.data_manager.sync_data(
                    sync_request.source_path,
                    sync_request.target_endpoint,
                    sync_request.sync_type,
                    sync_request.filter_criteria
                )
                return APIResponse(
                    success=True,
                    message="Data synchronization completed",
                    data=result
                )
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        # Content Management Routes
        @self.app.get("/content/toolkit", response_model=APIResponse)
        async def get_toolkit_content():
            """Get all ProjectToolkit content"""
            try:
                content = await self.content_loader.load_all_toolkit_data()
                return APIResponse(
                    success=True,
                    message="Successfully loaded toolkit content",
                    data=content
                )
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/content/toolkit/update", response_model=APIResponse)
        async def update_toolkit_content(content: Dict[str, Any]):
            """Update ProjectToolkit content"""
            try:
                result = await self.content_loader.update_toolkit_data(content)
                return APIResponse(
                    success=True,
                    message="Successfully updated toolkit content",
                    data=result
                )
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        # API Testing Routes
        @self.app.post("/api/test", response_model=APIResponse)
        async def test_api_endpoint(test_request: TestRequest):
            """Test external API endpoints"""
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.request(
                        method=test_request.method,
                        url=test_request.endpoint,
                        headers=test_request.headers or {},
                        json=test_request.payload
                    )
                    
                return APIResponse(
                    success=True,
                    message=f"API test completed for {test_request.endpoint}",
                    data={
                        "status_code": response.status_code,
                        "headers": dict(response.headers),
                        "response": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
                    }
                )
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        # Network Synchronization Routes
        @self.app.post("/network/sync", response_model=APIResponse)
        async def network_sync(background_tasks: BackgroundTasks):
            """Synchronize data across the CPA firm ecosystem network"""
            try:
                background_tasks.add_task(self.network_sync.sync_all_networks)
                return APIResponse(
                    success=True,
                    message="Network synchronization started in background",
                    data={"status": "initiated"}
                )
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/network/status", response_model=APIResponse)
        async def network_status():
            """Get network synchronization status"""
            try:
                status = await self.network_sync.get_sync_status()
                return APIResponse(
                    success=True,
                    message="Network status retrieved",
                    data=status
                )
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))
    
    def run(self, debug: bool = True):
        """Start the development server"""
        print(f"🚀 Starting ProjectMgr Development Server on {self.host}:{self.port}")
        print(f"📊 Dashboard: http://{self.host}:{self.port}")
        print(f"📖 API Docs: http://{self.host}:{self.port}/docs")
        
        uvicorn.run(
            self.app,
            host=self.host,
            port=self.port,
            reload=debug,
            log_level="info" if debug else "warning"
        )
    
    async def start_async(self):
        """Start server asynchronously for integration with other tools"""
        config = uvicorn.Config(
            self.app,
            host=self.host,
            port=self.port,
            log_level="info"
        )
        server = uvicorn.Server(config)
        await server.serve()


if __name__ == "__main__":
    server = APIServer()
    server.run()