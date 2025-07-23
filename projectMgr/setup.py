"""
Setup script for ProjectMgr package
"""

from setuptools import setup, find_packages
from pathlib import Path

# Read requirements from requirements.txt
def read_requirements():
    requirements_path = Path(__file__).parent / "requirements.txt"
    if requirements_path.exists():
        with open(requirements_path, 'r') as f:
            requirements = []
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and not line.startswith('-'):
                    # Remove version constraints and comments for base requirements
                    req = line.split('>=')[0].split('==')[0].split(';')[0].strip()
                    if req:
                        requirements.append(req)
            return requirements
    return []

# Read the package description
def read_long_description():
    readme_path = Path(__file__).parent.parent / "README.md"
    if readme_path.exists():
        with open(readme_path, 'r', encoding='utf-8') as f:
            return f.read()
    return "ProjectMgr - CPA Firm Resources Management Toolkit"

setup(
    name="projectmgr",
    version="1.0.0",
    author="CPA Resource Hub Development Team",
    author_email="dev@cparesourcehub.com",
    description="Internal development tools for CPA firm resources ecosystem",
    long_description=read_long_description(),
    long_description_content_type="text/markdown",
    url="https://github.com/cpa-resource-hub/projectmgr",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Office/Business :: Financial :: Accounting",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.8",
    install_requires=read_requirements(),
    extras_require={
        "webview": ["pywebview>=4.4.0"],
        "dev": [
            "pytest>=7.4.0",
            "pytest-asyncio>=0.21.0",
            "black>=23.0.0",
            "flake8>=6.0.0",
            "mypy>=1.7.0",
        ],
        "enhanced": [
            "orjson>=3.9.0",
            "sqlalchemy>=2.0.0",
            "structlog>=23.2.0",
            "python-dotenv>=1.0.0",
            "cryptography>=41.0.0",
        ],
        "monitoring": [
            "prometheus-client>=0.19.0",
            "schedule>=1.2.0",
        ]
    },
    entry_points={
        "console_scripts": [
            "projectmgr=projectMgr.cli:cli",
            "pmgr=projectMgr.cli:cli",  # Short alias
        ],
    },
    include_package_data=True,
    package_data={
        "projectMgr": [
            "*.json",
            "*.yaml",
            "*.yml",
            "templates/*",
            "static/*",
        ],
    },
    project_urls={
        "Bug Reports": "https://github.com/cpa-resource-hub/projectmgr/issues",
        "Source": "https://github.com/cpa-resource-hub/projectmgr",
        "Documentation": "https://github.com/cpa-resource-hub/projectmgr/wiki",
    },
    keywords="cpa accounting management toolkit api development",
    zip_safe=False,  # Required for some GUI frameworks
)