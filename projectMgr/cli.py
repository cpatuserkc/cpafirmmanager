"""
CLI Module - Command-line interface for ProjectMgr

Provides a comprehensive command-line interface for managing the CPA firm
resources ecosystem from the terminal.
"""

import click
import asyncio
import json
from pathlib import Path
from typing import Dict, Any
import sys
import os

from .api_server import APIServer
from .data_manager import DataManager
from .content_loader import ContentLoader
from .network_sync import NetworkSync
from .desktop_client import DesktopClient


@click.group()
@click.version_option(version="1.0.0")
@click.pass_context
def cli(ctx):
    """ProjectMgr - CPA Firm Resources Management Toolkit"""
    ctx.ensure_object(dict)


@cli.group()
def server():
    """API server management commands"""
    pass


@server.command()
@click.option('--host', default='localhost', help='Server host')
@click.option('--port', default=8001, help='Server port')
@click.option('--debug/--no-debug', default=True, help='Enable debug mode')
def start(host, port, debug):
    """Start the ProjectMgr API server"""
    click.echo(f"Starting ProjectMgr API server on {host}:{port}")
    
    api_server = APIServer(host=host, port=port)
    api_server.run(debug=debug)


@server.command()
def status():
    """Check API server status"""
    import httpx
    
    try:
        response = httpx.get("http://localhost:8001/health", timeout=5)
        if response.status_code == 200:
            click.echo("✅ API server is running")
            data = response.json()
            click.echo(f"Status: {data.get('status')}")
            click.echo(f"Timestamp: {data.get('timestamp')}")
        else:
            click.echo("❌ API server is not responding correctly")
    except Exception as e:
        click.echo("❌ API server is not running")
        click.echo(f"Error: {str(e)}")


@cli.group()
def data():
    """Data management commands"""
    pass


@data.command()
@click.argument('file_path')
def load(file_path):
    """Load data from a JSON file"""
    async def _load():
        data_manager = DataManager()
        try:
            result = await data_manager.load_data_file(file_path)
            click.echo(f"✅ Successfully loaded {file_path}")
            click.echo(f"Size: {result['size']} bytes")
            click.echo(f"Loaded at: {result['loaded_at']}")
        except Exception as e:
            click.echo(f"❌ Error loading {file_path}: {str(e)}")
            sys.exit(1)
    
    asyncio.run(_load())


@data.command()
@click.argument('source_path')
@click.argument('target_path')
def publish(source_path, target_path):
    """Publish data from source to target"""
    async def _publish():
        data_manager = DataManager()
        try:
            # Load source data
            source_result = await data_manager.load_data_file(source_path)
            data = source_result['data']
            
            # Publish to target
            result = await data_manager.publish_data(data, target_path)
            click.echo(f"✅ Successfully published to {target_path}")
            if 'size' in result:
                click.echo(f"Size: {result['size']} bytes")
            click.echo(f"Published at: {result['published_at']}")
        except Exception as e:
            click.echo(f"❌ Error publishing data: {str(e)}")
            sys.exit(1)
    
    asyncio.run(_publish())


@data.command()
@click.argument('source_path')
@click.argument('target_endpoint')
@click.option('--sync-type', default='push', type=click.Choice(['push', 'pull', 'bidirectional']))
def sync(source_path, target_endpoint, sync_type):
    """Synchronize data between source and target"""
    async def _sync():
        data_manager = DataManager()
        try:
            result = await data_manager.sync_data(source_path, target_endpoint, sync_type)
            click.echo(f"✅ Successfully synchronized data")
            click.echo(f"Sync type: {result['sync_type']}")
            click.echo(f"Records synced: {result['records_synced']}")
        except Exception as e:
            click.echo(f"❌ Error synchronizing data: {str(e)}")
            sys.exit(1)
    
    asyncio.run(_sync())


@data.command()
def structure():
    """Show ProjectToolkit structure"""
    async def _structure():
        data_manager = DataManager()
        try:
            structure = await data_manager.get_toolkit_structure()
            if structure:
                click.echo("📁 ProjectToolkit Structure:")
                for file_path, info in structure.items():
                    if 'error' in info:
                        click.echo(f"  ❌ {file_path}: {info['error']}")
                    else:
                        click.echo(f"  📄 {file_path}")
                        click.echo(f"     Size: {info['size']} bytes")
                        click.echo(f"     Keys: {info['keys']}")
                        click.echo(f"     Modified: {info['last_modified']}")
            else:
                click.echo("📁 ProjectToolkit directory is empty")
        except Exception as e:
            click.echo(f"❌ Error getting structure: {str(e)}")
            sys.exit(1)
    
    asyncio.run(_structure())


@data.command()
def backup():
    """Create backup of ProjectToolkit data"""
    async def _backup():
        data_manager = DataManager()
        try:
            backup_path = await data_manager.backup_toolkit_data()
            click.echo(f"✅ Backup created: {backup_path}")
        except Exception as e:
            click.echo(f"❌ Error creating backup: {str(e)}")
            sys.exit(1)
    
    asyncio.run(_backup())


@cli.group()
def content():
    """Content management commands"""
    pass


@content.command()
def list():
    """List all ProjectToolkit content files"""
    async def _list():
        content_loader = ContentLoader()
        try:
            structure = await content_loader.get_content_structure()
            if structure:
                click.echo("📚 ProjectToolkit Content:")
                for filename, info in structure.items():
                    if 'error' in info:
                        click.echo(f"  ❌ {filename}: {info['error']}")
                    else:
                        click.echo(f"  📄 {filename}")
                        click.echo(f"     Type: {info['type']}")
                        if info['type'] == 'object' and 'keys' in info:
                            click.echo(f"     Keys: {', '.join(info['keys'][:5])}{'...' if len(info['keys']) > 5 else ''}")
            else:
                click.echo("📚 No content files found")
        except Exception as e:
            click.echo(f"❌ Error listing content: {str(e)}")
            sys.exit(1)
    
    asyncio.run(_list())


@content.command()
@click.argument('filename')
def show(filename):
    """Show content of a specific file"""
    async def _show():
        content_loader = ContentLoader()
        try:
            data = await content_loader.load_toolkit_file(filename)
            click.echo(f"📄 Content of {filename}:")
            click.echo(json.dumps(data, indent=2, ensure_ascii=False))
        except Exception as e:
            click.echo(f"❌ Error loading {filename}: {str(e)}")
            sys.exit(1)
    
    asyncio.run(_show())


@content.command()
@click.argument('filename')
@click.argument('content_file')
def update(filename, content_file):
    """Update content file with data from JSON file"""
    async def _update():
        content_loader = ContentLoader()
        try:
            # Load new content
            with open(content_file, 'r') as f:
                new_data = json.load(f)
            
            # Update file
            result = await content_loader.update_toolkit_file(filename, new_data)
            click.echo(f"✅ Updated {filename}")
            click.echo(f"Size: {result['size']} bytes")
            click.echo(f"Updated at: {result['updated_at']}")
            
            if result.get('backup'):
                click.echo(f"Backup: {result['backup']['backup_path']}")
                
        except Exception as e:
            click.echo(f"❌ Error updating {filename}: {str(e)}")
            sys.exit(1)
    
    asyncio.run(_update())


@content.command()
@click.argument('content_data')
def validate(content_data):
    """Validate content structure"""
    async def _validate():
        content_loader = ContentLoader()
        try:
            # Parse content data (JSON string or file path)
            if os.path.exists(content_data):
                with open(content_data, 'r') as f:
                    data = json.load(f)
            else:
                data = json.loads(content_data)
            
            results = await content_loader.validate_content(data)
            
            click.echo("🔍 Validation Results:")
            for filename, result in results.items():
                if result['valid']:
                    click.echo(f"  ✅ {filename}: {result['message']}")
                else:
                    click.echo(f"  ❌ {filename}: {result.get('error', 'Validation failed')}")
                    
        except Exception as e:
            click.echo(f"❌ Error validating content: {str(e)}")
            sys.exit(1)
    
    asyncio.run(_validate())


@cli.group()
def network():
    """Network synchronization commands"""
    pass


@network.command()
def sync():
    """Synchronize all network nodes"""
    async def _sync():
        network_sync = NetworkSync()
        try:
            click.echo("🔄 Starting network synchronization...")
            results = await network_sync.sync_all_networks()
            
            success_count = len([r for r in results if r.status.value == 'completed'])
            error_count = len([r for r in results if r.status.value == 'error'])
            
            click.echo(f"✅ Sync completed: {success_count} successful, {error_count} errors")
            
            for result in results:
                status_icon = "✅" if result.status.value == 'completed' else "❌"
                click.echo(f"  {status_icon} {result.node_id}: {result.message}")
                if result.records_synced > 0:
                    click.echo(f"     Records: {result.records_synced}")
                if result.duration > 0:
                    click.echo(f"     Duration: {result.duration:.2f}s")
                    
        except Exception as e:
            click.echo(f"❌ Error during network sync: {str(e)}")
            sys.exit(1)
    
    asyncio.run(_sync())


@network.command()
def status():
    """Show network synchronization status"""
    async def _status():
        network_sync = NetworkSync()
        try:
            status = await network_sync.get_sync_status()
            
            click.echo(f"🌐 Network Status: {status['status'].upper()}")
            click.echo(f"Sync History: {status['sync_history_count']} records")
            
            click.echo("\n📡 Network Nodes:")
            for node_id, node_info in status['nodes'].items():
                status_icon = "🟢" if node_info['connection_status'] else "🔴"
                enabled_icon = "✅" if node_info['enabled'] else "⏸️"
                
                click.echo(f"  {status_icon} {enabled_icon} {node_info['name']} ({node_id})")
                click.echo(f"     URL: {node_info['url']}")
                click.echo(f"     Priority: {node_info['priority']}")
                if node_info['last_sync']:
                    click.echo(f"     Last Sync: {node_info['last_sync']}")
            
            if status['last_sync_results']:
                click.echo("\n📊 Last Sync Results:")
                for result in status['last_sync_results']:
                    status_icon = "✅" if result['status'] == 'completed' else "❌"
                    click.echo(f"  {status_icon} {result['node_id']}: {result['message']}")
                    
        except Exception as e:
            click.echo(f"❌ Error getting network status: {str(e)}")
            sys.exit(1)
    
    asyncio.run(_status())


@cli.command()
@click.option('--app-type', default='tkinter', type=click.Choice(['tkinter', 'webview']))
def desktop(app_type):
    """Launch desktop client application"""
    try:
        click.echo(f"🖥️ Launching desktop client ({app_type})...")
        
        if app_type == 'webview':
            try:
                import webview
            except ImportError:
                click.echo("❌ pywebview is not installed. Install with: pip install pywebview")
                sys.exit(1)
        
        client = DesktopClient(app_type=app_type)
        client.run()
        
    except Exception as e:
        click.echo(f"❌ Error launching desktop client: {str(e)}")
        sys.exit(1)


@cli.command()
def init():
    """Initialize ProjectMgr in current directory"""
    try:
        click.echo("🚀 Initializing ProjectMgr...")
        
        # Create ProjectToolkit directory if it doesn't exist
        toolkit_dir = Path("ProjectToolkit")
        toolkit_dir.mkdir(exist_ok=True)
        
        # Initialize content loader to create default files
        from .content_loader import ContentLoader
        content_loader = ContentLoader()
        
        # Ensure default structure is created
        asyncio.run(content_loader._ensure_default_structure())
        
        click.echo("✅ ProjectMgr initialized successfully!")
        click.echo(f"📁 Created ProjectToolkit directory: {toolkit_dir.absolute()}")
        click.echo("\n🎯 Next steps:")
        click.echo("  1. Run 'projectmgr server start' to start the API server")
        click.echo("  2. Run 'projectmgr desktop' to launch the desktop client")
        click.echo("  3. Run 'projectmgr data structure' to see your data structure")
        
    except Exception as e:
        click.echo(f"❌ Error initializing ProjectMgr: {str(e)}")
        sys.exit(1)


@cli.command()
def info():
    """Show ProjectMgr information and status"""
    click.echo("📊 ProjectMgr Information")
    click.echo("=" * 40)
    click.echo("Version: 1.0.0")
    click.echo("Description: CPA Firm Resources Management Toolkit")
    
    # Check if ProjectToolkit exists
    toolkit_path = Path("ProjectToolkit")
    if toolkit_path.exists():
        try:
            json_files = [f for f in toolkit_path.iterdir() if f.suffix == '.json']
            click.echo(f"📁 ProjectToolkit: {len(json_files)} files")
        except Exception as e:
            click.echo(f"📁 ProjectToolkit: Error reading directory - {e}")
    else:
        click.echo("📁 ProjectToolkit: Not initialized")
    
    # Check server status
    try:
        import httpx
        response = httpx.get("http://localhost:8001/health", timeout=2)
        if response.status_code == 200:
            click.echo("🟢 API Server: Running")
        else:
            click.echo("🔴 API Server: Not responding")
    except:
        click.echo("🔴 API Server: Not running")
    
    # Check main app status  
    try:
        import httpx
        response = httpx.get("http://localhost:5000/api/resources", timeout=2)
        if response.status_code == 200:
            click.echo("🟢 Main App: Running")
        else:
            click.echo("🔴 Main App: Not responding")
    except:
        click.echo("🔴 Main App: Not running")


if __name__ == '__main__':
    cli()