# ProjectMgr - CPA Firm Resources Management Toolkit

A comprehensive Python development tool ecosystem for managing dynamic content, API interactions, and data synchronization across the CPA firm resources platform.

## Features

### 🚀 API Server
- FastAPI-based REST API server for development and testing
- Built-in health checks and monitoring endpoints
- Support for data publishing and synchronization endpoints
- Swagger/OpenAPI documentation

### 📊 Data Management
- Load, publish, and synchronize JSON data files
- Support for both local files and remote endpoints
- Advanced filtering and transformation capabilities
- Backup and restore functionality

### 📝 Content Management
- ProjectToolkit content loading and updating
- JSON validation and structure analysis
- Automatic backup creation before updates
- Cache management for improved performance

### 🖥️ Desktop Client
- Cross-platform desktop application using ttkbootstrap
- Optional web-based UI using pywebview
- Integrated data editor and API testing tools
- Real-time synchronization management

### 🌐 Network Synchronization
- Multi-node network synchronization
- Priority-based sync ordering
- Automatic retry and error handling
- Comprehensive sync history and monitoring

### 💻 Command Line Interface
- Full-featured CLI for all operations
- Intuitive commands for data management
- Network synchronization control
- Desktop application launcher

## Installation

### Basic Installation
```bash
pip install -r requirements.txt
```

### With Web UI Support
```bash
pip install -r requirements.txt
pip install pywebview
```

### Development Installation
```bash
pip install -e .
pip install -r requirements.txt
```

## Quick Start

### 1. Initialize ProjectMgr
```bash
python -m projectMgr init
```

### 2. Start API Server
```bash
python -m projectMgr server start
```

### 3. Launch Desktop Client
```bash
python -m projectMgr desktop
```

### 4. View Project Status
```bash
python -m projectMgr info
```

## CLI Commands

### Server Management
```bash
# Start API server
python -m projectMgr server start --host localhost --port 8001

# Check server status
python -m projectMgr server status
```

### Data Operations
```bash
# Load data from file
python -m projectMgr data load path/to/data.json

# Publish data to target
python -m projectMgr data publish source.json target.json

# Synchronize data
python -m projectMgr data sync source.json http://api.example.com/data

# Show ProjectToolkit structure
python -m projectMgr data structure

# Create backup
python -m projectMgr data backup
```

### Content Management
```bash
# List all content files
python -m projectMgr content list

# Show specific file content
python -m projectMgr content show cpa_data.json

# Update content file
python -m projectMgr content update cpa_data.json new_data.json

# Validate content structure
python -m projectMgr content validate data.json
```

### Network Synchronization
```bash
# Sync all network nodes
python -m projectMgr network sync

# Check network status
python -m projectMgr network status
```

### Desktop Applications
```bash
# Launch tkinter desktop app
python -m projectMgr desktop --app-type tkinter

# Launch web-based desktop app (requires pywebview)
python -m projectMgr desktop --app-type webview
```

## API Endpoints

When the API server is running, the following endpoints are available:

- `GET /health` - Health check
- `POST /data/load` - Load data from file
- `POST /data/publish` - Publish data
- `POST /data/sync` - Synchronize data
- `GET /toolkit/structure` - Get ProjectToolkit structure
- `POST /toolkit/update` - Update toolkit content
- `GET /network/status` - Network sync status
- `POST /network/sync` - Trigger network sync

## Configuration

### Network Nodes Configuration
Create `projectMgr/sync_config.json` to configure network synchronization:

```json
{
  "nodes": [
    {
      "id": "main_app",
      "name": "Main CPA Application",
      "url": "http://localhost:5000/api",
      "priority": 1,
      "sync_enabled": true
    },
    {
      "id": "resource_hub", 
      "name": "Resource Hub Portal",
      "url": "http://localhost:3000/api",
      "priority": 2,
      "sync_enabled": true,
      "api_key": "your-api-key"
    }
  ]
}
```

### ProjectToolkit Structure
The system automatically creates and manages these JSON files in the ProjectToolkit directory:

- `cpa_data.json` - CPA-specific data (roles, services, industries)
- `forms_config.json` - Form field definitions and validation
- `menu_structure.json` - Navigation menu configuration
- `validation_rules.json` - Data validation patterns
- `error_messages.json` - Error messages with parameter substitution

## Development

### Project Structure
```
projectMgr/
├── __init__.py          # Package initialization
├── __main__.py          # Module entry point
├── api_server.py        # FastAPI server implementation
├── data_manager.py      # Data loading and publishing
├── content_loader.py    # ProjectToolkit content management
├── desktop_client.py    # Desktop GUI applications
├── network_sync.py      # Network synchronization
├── cli.py              # Command-line interface
├── requirements.txt     # Python dependencies
├── setup.py            # Package setup configuration
└── README.md           # This file
```

### Running Tests
```bash
pytest tests/
```

### Code Style
```bash
black projectMgr/
flake8 projectMgr/
mypy projectMgr/
```

## Integration with CPA Resources Platform

ProjectMgr is designed to work seamlessly with the main CPA Resources Platform:

1. **Data Flow**: Manages the flow of data between static JSON files and the main application
2. **Testing**: Provides comprehensive API testing capabilities for development
3. **Content Management**: Enables dynamic updates to application configuration and data
4. **Synchronization**: Keeps multiple instances of the platform synchronized

## License

MIT License - see LICENSE file for details.

## Support

For support and documentation:
- Check the [Wiki](https://github.com/cpa-resource-hub/projectmgr/wiki)
- Report issues on [GitHub Issues](https://github.com/cpa-resource-hub/projectmgr/issues)
- Contact the development team

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Changelog

### v1.0.0
- Initial release
- Complete API server implementation
- Desktop client with both tkinter and webview support
- Network synchronization capabilities
- Comprehensive CLI interface
- Full ProjectToolkit content management