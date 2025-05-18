import sys
import os
import importlib.metadata
import platform

def check_python_version():
    print(f"Python version: {sys.version}")
    print(f"Python implementation: {platform.python_implementation()}")
    print(f"Python executable: {sys.executable}")
    print(f"Python path: {sys.path}")

def check_installed_packages():
    print("\nInstalled packages:")
    try:
        packages = importlib.metadata.distributions()
        for pkg in packages:
            try:
                print(f"{pkg.metadata['Name']}=={pkg.version}")
            except Exception as e:
                print(f"Error reading package {pkg}: {e}")
    except Exception as e:
        print(f"Error listing packages: {e}")

def check_environment_variables():
    print("\nEnvironment variables:")
    env_vars = [
        'PYTHONPATH', 'PATH', 'VIRTUAL_ENV', 'PYTHONHOME',
        'PYTHONIOENCODING', 'PYTHONUNBUFFERED'
    ]
    for key in env_vars:
        value = os.environ.get(key)
        if value is not None:
            print(f"{key}: {value}")

def main():
    print("=== Python Environment Check ===")
    check_python_version()
    check_environment_variables()
    check_installed_packages()

if __name__ == "__main__":
    main()
