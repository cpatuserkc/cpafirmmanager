"""
Desktop Client Module - Cross-platform desktop application for ProjectMgr

Provides both ttkbootstrap and pywebview options for desktop interaction
with the CPA firm resources ecosystem management tools.
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import ttkbootstrap as ttk_bs
from ttkbootstrap.constants import *
import asyncio
import threading
import json
import webbrowser
from typing import Dict, Any, Optional, Callable
from pathlib import Path
import logging

try:
    import webview
    WEBVIEW_AVAILABLE = True
except ImportError:
    WEBVIEW_AVAILABLE = False

from .api_server import APIServer
from .data_manager import DataManager
from .content_loader import ContentLoader


class DesktopClient:
    def __init__(self, app_type: str = "tkinter"):
        """
        Initialize desktop client
        
        Args:
            app_type: "tkinter" for ttkbootstrap GUI or "webview" for web-based UI
        """
        self.app_type = app_type
        self.api_server = None
        self.data_manager = DataManager()
        self.content_loader = ContentLoader()
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
        if app_type == "tkinter":
            self._setup_tkinter_app()
        elif app_type == "webview" and WEBVIEW_AVAILABLE:
            self._setup_webview_app()
        else:
            raise ValueError(f"Unsupported app type: {app_type}")
    
    def _setup_tkinter_app(self):
        """Setup ttkbootstrap-based desktop application"""
        self.root = ttk_bs.Window(
            title="ProjectMgr - CPA Firm Resources Manager",
            themename="superhero",
            size=(1200, 800),
            resizable=(True, True)
        )
        
        # Create main interface
        self._create_tkinter_interface()
    
    def _setup_webview_app(self):
        """Setup pywebview-based desktop application"""
        if not WEBVIEW_AVAILABLE:
            raise ImportError("pywebview is not installed. Install with: pip install pywebview")
        
        # Start API server in background
        self._start_api_server_background()
        
        # Create webview window
        self.webview_window = webview.create_window(
            title="ProjectMgr - CPA Firm Resources Manager",
            url="http://localhost:8001",
            width=1200,
            height=800,
            min_size=(800, 600)
        )
    
    def _create_tkinter_interface(self):
        """Create the main tkinter interface"""
        # Create main notebook for tabs
        self.notebook = ttk_bs.Notebook(self.root)
        self.notebook.pack(fill=BOTH, expand=True, padx=10, pady=10)
        
        # Create tabs
        self._create_data_management_tab()
        self._create_content_editor_tab()
        self._create_api_testing_tab()
        self._create_sync_management_tab()
        self._create_settings_tab()
        
        # Create status bar
        self._create_status_bar()
        
        # Create menu bar
        self._create_menu_bar()
    
    def _create_data_management_tab(self):
        """Create data management tab"""
        frame = ttk_bs.Frame(self.notebook)
        self.notebook.add(frame, text="Data Management")
        
        # File operations section
        file_frame = ttk_bs.LabelFrame(frame, text="File Operations", padding=10)
        file_frame.pack(fill=X, padx=10, pady=5)
        
        # Load data section
        load_frame = ttk_bs.Frame(file_frame)
        load_frame.pack(fill=X, pady=5)
        
        ttk_bs.Label(load_frame, text="Load Data File:").pack(side=LEFT)
        self.load_path_var = tk.StringVar()
        load_entry = ttk_bs.Entry(load_frame, textvariable=self.load_path_var, width=50)
        load_entry.pack(side=LEFT, padx=5)
        
        ttk_bs.Button(load_frame, text="Browse", command=self._browse_load_file).pack(side=LEFT, padx=5)
        ttk_bs.Button(load_frame, text="Load", bootstyle=SUCCESS, command=self._load_data_file).pack(side=LEFT, padx=5)
        
        # Data display area
        data_frame = ttk_bs.LabelFrame(frame, text="Data Preview", padding=10)
        data_frame.pack(fill=BOTH, expand=True, padx=10, pady=5)
        
        # Create treeview for data display
        self.data_tree = ttk_bs.Treeview(data_frame, columns=("Type", "Value"), show="tree headings")
        self.data_tree.heading("#0", text="Key")
        self.data_tree.heading("Type", text="Type")
        self.data_tree.heading("Value", text="Value")
        
        # Add scrollbars
        v_scrollbar = ttk_bs.Scrollbar(data_frame, orient=VERTICAL, command=self.data_tree.yview)
        h_scrollbar = ttk_bs.Scrollbar(data_frame, orient=HORIZONTAL, command=self.data_tree.xview)
        self.data_tree.configure(yscrollcommand=v_scrollbar.set, xscrollcommand=h_scrollbar.set)
        
        # Pack treeview and scrollbars
        self.data_tree.pack(side=LEFT, fill=BOTH, expand=True)
        v_scrollbar.pack(side=RIGHT, fill=Y)
        h_scrollbar.pack(side=BOTTOM, fill=X)
    
    def _create_content_editor_tab(self):
        """Create content editor tab for ProjectToolkit"""
        frame = ttk_bs.Frame(self.notebook)
        self.notebook.add(frame, text="Content Editor")
        
        # File selection
        file_select_frame = ttk_bs.Frame(frame)
        file_select_frame.pack(fill=X, padx=10, pady=5)
        
        ttk_bs.Label(file_select_frame, text="Select Toolkit File:").pack(side=LEFT)
        self.toolkit_file_var = tk.StringVar()
        self.toolkit_combo = ttk_bs.Combobox(file_select_frame, textvariable=self.toolkit_file_var, width=30)
        self.toolkit_combo.pack(side=LEFT, padx=5)
        self.toolkit_combo.bind("<<ComboboxSelected>>", self._load_toolkit_file)
        
        ttk_bs.Button(file_select_frame, text="Refresh List", command=self._refresh_toolkit_files).pack(side=LEFT, padx=5)
        ttk_bs.Button(file_select_frame, text="New File", bootstyle=SUCCESS, command=self._create_new_toolkit_file).pack(side=LEFT, padx=5)
        
        # Content editor
        editor_frame = ttk_bs.LabelFrame(frame, text="Content Editor", padding=10)
        editor_frame.pack(fill=BOTH, expand=True, padx=10, pady=5)
        
        # Text editor with syntax highlighting (basic)
        self.content_editor = tk.Text(editor_frame, wrap=tk.WORD, font=("Consolas", 11))
        editor_scrollbar = ttk_bs.Scrollbar(editor_frame, orient=VERTICAL, command=self.content_editor.yview)
        self.content_editor.configure(yscrollcommand=editor_scrollbar.set)
        
        self.content_editor.pack(side=LEFT, fill=BOTH, expand=True)
        editor_scrollbar.pack(side=RIGHT, fill=Y)
        
        # Action buttons
        action_frame = ttk_bs.Frame(frame)
        action_frame.pack(fill=X, padx=10, pady=5)
        
        ttk_bs.Button(action_frame, text="Save", bootstyle=SUCCESS, command=self._save_toolkit_file).pack(side=LEFT, padx=5)
        ttk_bs.Button(action_frame, text="Validate", bootstyle=INFO, command=self._validate_content).pack(side=LEFT, padx=5)
        ttk_bs.Button(action_frame, text="Format JSON", command=self._format_json).pack(side=LEFT, padx=5)
        ttk_bs.Button(action_frame, text="Backup", bootstyle=WARNING, command=self._backup_toolkit).pack(side=LEFT, padx=5)
    
    def _create_api_testing_tab(self):
        """Create API testing tab"""
        frame = ttk_bs.Frame(self.notebook)
        self.notebook.add(frame, text="API Testing")
        
        # Server control
        server_frame = ttk_bs.LabelFrame(frame, text="Server Control", padding=10)
        server_frame.pack(fill=X, padx=10, pady=5)
        
        self.server_status_var = tk.StringVar(value="Stopped")
        ttk_bs.Label(server_frame, text="Server Status:").pack(side=LEFT)
        ttk_bs.Label(server_frame, textvariable=self.server_status_var, bootstyle=DANGER).pack(side=LEFT, padx=5)
        
        ttk_bs.Button(server_frame, text="Start Server", bootstyle=SUCCESS, command=self._start_api_server).pack(side=LEFT, padx=5)
        ttk_bs.Button(server_frame, text="Stop Server", bootstyle=DANGER, command=self._stop_api_server).pack(side=LEFT, padx=5)
        ttk_bs.Button(server_frame, text="Open Dashboard", bootstyle=INFO, command=self._open_dashboard).pack(side=LEFT, padx=5)
        
        # API testing interface
        test_frame = ttk_bs.LabelFrame(frame, text="API Testing", padding=10)
        test_frame.pack(fill=BOTH, expand=True, padx=10, pady=5)
        
        # Request configuration
        req_config_frame = ttk_bs.Frame(test_frame)
        req_config_frame.pack(fill=X, pady=5)
        
        ttk_bs.Label(req_config_frame, text="Method:").grid(row=0, column=0, sticky=W, padx=5)
        self.method_var = tk.StringVar(value="GET")
        method_combo = ttk_bs.Combobox(req_config_frame, textvariable=self.method_var, values=["GET", "POST", "PUT", "DELETE"], width=10)
        method_combo.grid(row=0, column=1, padx=5)
        
        ttk_bs.Label(req_config_frame, text="Endpoint:").grid(row=0, column=2, sticky=W, padx=5)
        self.endpoint_var = tk.StringVar(value="http://localhost:8001/")
        endpoint_entry = ttk_bs.Entry(req_config_frame, textvariable=self.endpoint_var, width=50)
        endpoint_entry.grid(row=0, column=3, padx=5)
        
        ttk_bs.Button(req_config_frame, text="Send Request", bootstyle=PRIMARY, command=self._send_test_request).grid(row=0, column=4, padx=5)
        
        # Response display
        response_frame = ttk_bs.LabelFrame(test_frame, text="Response", padding=10)
        response_frame.pack(fill=BOTH, expand=True, pady=5)
        
        self.response_text = tk.Text(response_frame, wrap=tk.WORD, font=("Consolas", 10))
        response_scrollbar = ttk_bs.Scrollbar(response_frame, orient=VERTICAL, command=self.response_text.yview)
        self.response_text.configure(yscrollcommand=response_scrollbar.set)
        
        self.response_text.pack(side=LEFT, fill=BOTH, expand=True)
        response_scrollbar.pack(side=RIGHT, fill=Y)
    
    def _create_sync_management_tab(self):
        """Create synchronization management tab"""
        frame = ttk_bs.Frame(self.notebook)
        self.notebook.add(frame, text="Sync Management")
        
        # Sync configuration
        config_frame = ttk_bs.LabelFrame(frame, text="Sync Configuration", padding=10)
        config_frame.pack(fill=X, padx=10, pady=5)
        
        # Source and target configuration
        ttk_bs.Label(config_frame, text="Source Path:").grid(row=0, column=0, sticky=W, padx=5, pady=5)
        self.sync_source_var = tk.StringVar()
        source_entry = ttk_bs.Entry(config_frame, textvariable=self.sync_source_var, width=40)
        source_entry.grid(row=0, column=1, padx=5, pady=5)
        ttk_bs.Button(config_frame, text="Browse", command=self._browse_sync_source).grid(row=0, column=2, padx=5, pady=5)
        
        ttk_bs.Label(config_frame, text="Target Endpoint:").grid(row=1, column=0, sticky=W, padx=5, pady=5)
        self.sync_target_var = tk.StringVar(value="http://localhost:5000/api/")
        target_entry = ttk_bs.Entry(config_frame, textvariable=self.sync_target_var, width=40)
        target_entry.grid(row=1, column=1, padx=5, pady=5)
        
        ttk_bs.Label(config_frame, text="Sync Type:").grid(row=2, column=0, sticky=W, padx=5, pady=5)
        self.sync_type_var = tk.StringVar(value="push")
        sync_combo = ttk_bs.Combobox(config_frame, textvariable=self.sync_type_var, values=["push", "pull", "bidirectional"], width=20)
        sync_combo.grid(row=2, column=1, sticky=W, padx=5, pady=5)
        
        # Sync actions
        action_frame = ttk_bs.Frame(config_frame)
        action_frame.grid(row=3, column=0, columnspan=3, pady=10)
        
        ttk_bs.Button(action_frame, text="Start Sync", bootstyle=SUCCESS, command=self._start_sync).pack(side=LEFT, padx=5)
        ttk_bs.Button(action_frame, text="Schedule Sync", bootstyle=INFO, command=self._schedule_sync).pack(side=LEFT, padx=5)
        ttk_bs.Button(action_frame, text="Sync Status", command=self._check_sync_status).pack(side=LEFT, padx=5)
        
        # Sync log
        log_frame = ttk_bs.LabelFrame(frame, text="Sync Log", padding=10)
        log_frame.pack(fill=BOTH, expand=True, padx=10, pady=5)
        
        self.sync_log = tk.Text(log_frame, wrap=tk.WORD, font=("Consolas", 10))
        log_scrollbar = ttk_bs.Scrollbar(log_frame, orient=VERTICAL, command=self.sync_log.yview)
        self.sync_log.configure(yscrollcommand=log_scrollbar.set)
        
        self.sync_log.pack(side=LEFT, fill=BOTH, expand=True)
        log_scrollbar.pack(side=RIGHT, fill=Y)
    
    def _create_settings_tab(self):
        """Create settings tab"""
        frame = ttk_bs.Frame(self.notebook)
        self.notebook.add(frame, text="Settings")
        
        # API Configuration
        api_frame = ttk_bs.LabelFrame(frame, text="API Configuration", padding=10)
        api_frame.pack(fill=X, padx=10, pady=5)
        
        ttk_bs.Label(api_frame, text="API Server Host:").grid(row=0, column=0, sticky=W, padx=5, pady=5)
        self.api_host_var = tk.StringVar(value="localhost")
        host_entry = ttk_bs.Entry(api_frame, textvariable=self.api_host_var, width=20)
        host_entry.grid(row=0, column=1, padx=5, pady=5)
        
        ttk_bs.Label(api_frame, text="API Server Port:").grid(row=1, column=0, sticky=W, padx=5, pady=5)
        self.api_port_var = tk.StringVar(value="8001")
        port_entry = ttk_bs.Entry(api_frame, textvariable=self.api_port_var, width=20)
        port_entry.grid(row=1, column=1, padx=5, pady=5)
        
        # Theme Configuration
        theme_frame = ttk_bs.LabelFrame(frame, text="Theme Configuration", padding=10)
        theme_frame.pack(fill=X, padx=10, pady=5)
        
        ttk_bs.Label(theme_frame, text="Theme:").grid(row=0, column=0, sticky=W, padx=5, pady=5)
        self.theme_var = tk.StringVar(value="superhero")
        theme_combo = ttk_bs.Combobox(theme_frame, textvariable=self.theme_var, 
                                     values=["superhero", "darkly", "cyborg", "solar", "flatly", "litera"], width=20)
        theme_combo.grid(row=0, column=1, padx=5, pady=5)
        theme_combo.bind("<<ComboboxSelected>>", self._change_theme)
        
        # Save settings
        ttk_bs.Button(frame, text="Save Settings", bootstyle=SUCCESS, command=self._save_settings).pack(pady=20)
    
    def _create_status_bar(self):
        """Create status bar"""
        self.status_frame = ttk_bs.Frame(self.root)
        self.status_frame.pack(fill=X, side=BOTTOM)
        
        self.status_var = tk.StringVar(value="Ready")
        status_label = ttk_bs.Label(self.status_frame, textvariable=self.status_var)
        status_label.pack(side=LEFT, padx=5)
        
        # Add current time
        self.time_var = tk.StringVar()
        time_label = ttk_bs.Label(self.status_frame, textvariable=self.time_var)
        time_label.pack(side=RIGHT, padx=5)
        self._update_time()
    
    def _create_menu_bar(self):
        """Create menu bar"""
        menubar = tk.Menu(self.root)
        self.root.config(menu=menubar)
        
        # File menu
        file_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="File", menu=file_menu)
        file_menu.add_command(label="Open Project", command=self._open_project)
        file_menu.add_command(label="Save Project", command=self._save_project)
        file_menu.add_separator()
        file_menu.add_command(label="Exit", command=self.root.quit)
        
        # Tools menu
        tools_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Tools", menu=tools_menu)
        tools_menu.add_command(label="Start API Server", command=self._start_api_server)
        tools_menu.add_command(label="Open Dashboard", command=self._open_dashboard)
        tools_menu.add_command(label="Backup Toolkit", command=self._backup_toolkit)
        
        # Help menu
        help_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Help", menu=help_menu)
        help_menu.add_command(label="About", command=self._show_about)
    
    # Event handlers and utility methods
    def _browse_load_file(self):
        filename = filedialog.askopenfilename(
            title="Select Data File",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        if filename:
            self.load_path_var.set(filename)
    
    def _load_data_file(self):
        file_path = self.load_path_var.get()
        if not file_path:
            messagebox.showwarning("Warning", "Please select a file to load")
            return
        
        try:
            # Load data using async method (simplified for GUI)
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(self.data_manager.load_data_file(file_path))
            
            # Display in treeview
            self._populate_tree_view(result["data"])
            self.status_var.set(f"Loaded: {file_path}")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load file: {str(e)}")
    
    def _populate_tree_view(self, data, parent="", prefix=""):
        """Populate treeview with data"""
        # Clear existing items
        if not parent:
            for item in self.data_tree.get_children():
                self.data_tree.delete(item)
        
        if isinstance(data, dict):
            for key, value in data.items():
                item_id = self.data_tree.insert(parent, "end", text=f"{prefix}{key}", 
                                               values=(type(value).__name__, str(value)[:100]))
                if isinstance(value, (dict, list)):
                    self._populate_tree_view(value, item_id, "")
        elif isinstance(data, list):
            for i, value in enumerate(data):
                item_id = self.data_tree.insert(parent, "end", text=f"{prefix}[{i}]", 
                                               values=(type(value).__name__, str(value)[:100]))
                if isinstance(value, (dict, list)):
                    self._populate_tree_view(value, item_id, "")
    
    def _start_api_server_background(self):
        """Start API server in background thread"""
        def run_server():
            self.api_server = APIServer(
                host=self.api_host_var.get() if hasattr(self, 'api_host_var') else "localhost",
                port=int(self.api_port_var.get()) if hasattr(self, 'api_port_var') else 8001
            )
            self.api_server.run(debug=False)
        
        server_thread = threading.Thread(target=run_server, daemon=True)
        server_thread.start()
    
    def _start_api_server(self):
        """Start API server"""
        if not self.api_server:
            self._start_api_server_background()
            self.server_status_var.set("Running")
            self.status_var.set("API Server started")
    
    def _stop_api_server(self):
        """Stop API server"""
        # In a real implementation, you'd need proper server shutdown
        self.server_status_var.set("Stopped")
        self.status_var.set("API Server stopped")
    
    def _open_dashboard(self):
        """Open API dashboard in browser"""
        webbrowser.open("http://localhost:8001/docs")
    
    def _update_time(self):
        """Update time display"""
        import datetime
        current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.time_var.set(current_time)
        self.root.after(1000, self._update_time)
    
    def _change_theme(self, event=None):
        """Change application theme"""
        new_theme = self.theme_var.get()
        try:
            self.root.style.theme_use(new_theme)
            self.status_var.set(f"Theme changed to: {new_theme}")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to change theme: {str(e)}")
    
    def _show_about(self):
        """Show about dialog"""
        messagebox.showinfo("About", 
                           "ProjectMgr v1.0.0\n\n"
                           "CPA Firm Resources Management Tool\n"
                           "Internal development toolkit for data management,\n"
                           "API testing, and content synchronization.")
    
    # Placeholder methods for other functionality
    def _refresh_toolkit_files(self): pass
    def _load_toolkit_file(self, event=None): pass
    def _create_new_toolkit_file(self): pass
    def _save_toolkit_file(self): pass
    def _validate_content(self): pass
    def _format_json(self): pass
    def _backup_toolkit(self): pass
    def _send_test_request(self): pass
    def _browse_sync_source(self): pass
    def _start_sync(self): pass
    def _schedule_sync(self): pass
    def _check_sync_status(self): pass
    def _save_settings(self): pass
    def _open_project(self): pass
    def _save_project(self): pass
    
    def run(self):
        """Run the desktop application"""
        if self.app_type == "tkinter":
            self.root.mainloop()
        elif self.app_type == "webview":
            webview.start()


if __name__ == "__main__":
    # Example usage
    app = DesktopClient("tkinter")
    app.run()