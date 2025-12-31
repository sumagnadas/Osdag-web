# Installing Phase 1 Packages in conda-v2 Environment

## Quick Install Commands

Activate your conda environment and install the new Phase 1 packages:

```bash
# Activate your conda environment
conda activate conda-v2

# Install Phase 1 packages (Celery, Channels, Redis)
pip install celery~=5.3.0 channels~=4.0.0 channels-redis~=4.1.0 redis~=5.0.0
```

## Alternative: Install from requirements.txt

If you prefer to use the updated requirements.txt:

```bash
conda activate conda-v2
pip install -r requirements.txt
```

This will install all packages including the new Phase 1 dependencies.

## Verify Installation

After installation, verify the packages are installed:

```bash
conda activate conda-v2
python -c "import celery; import channels; import redis; print('✅ All Phase 1 packages installed successfully!')"
```

## Redis Server

**Important:** You also need to install and run the Redis server (not just the Python client):

### Windows:
- Download from: https://redis.io/download
- Or use WSL: `wsl sudo apt install redis-server`

### Linux/Mac:
```bash
# Ubuntu/Debian
sudo apt install redis-server

# macOS
brew install redis
```

### Start Redis:
```bash
# Linux/Mac
redis-server

# Windows (if installed via WSL)
wsl redis-server
```

## Next Steps

After installing the packages:
1. Start Redis server
2. Start Celery worker: `celery -A config worker --loglevel=info`
3. Start Django server: `python manage.py runserver`

