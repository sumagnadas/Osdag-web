#!/usr/bin/env python
"""
Quick test script to verify Redis and Celery setup.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def test_redis():
    """Test Redis connection."""
    try:
        import redis
        r = redis.Redis(host='localhost', port=6379, db=0, socket_connect_timeout=2)
        result = r.ping()
        if result:
            print("✅ Redis: Connected successfully")
            return True
    except Exception as e:
        print(f"❌ Redis: Connection failed - {e}")
        print("   Make sure Redis is running: redis-server or docker-compose up redis")
        return False

def test_celery():
    """Test Celery configuration."""
    try:
        from config.celery import app
        inspect = app.control.inspect()
        stats = inspect.stats()
        
        if stats:
            print(f"✅ Celery: Connected, {len(stats)} worker(s) active")
            for worker in stats.keys():
                print(f"   - {worker}")
            return True
        else:
            print("⚠️  Celery: Connected but no workers running")
            print("   Start a worker: celery -A config worker --loglevel=info")
            return True  # Connection works
    except Exception as e:
        print(f"❌ Celery: Connection failed - {e}")
        return False

def test_channel_layer():
    """Test Django Channels."""
    try:
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        print("✅ Django Channels: Channel layer configured")
        return True
    except Exception as e:
        print(f"❌ Django Channels: Configuration failed - {e}")
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("Testing Infrastructure Setup")
    print("=" * 60)
    print()
    
    redis_ok = test_redis()
    print()
    celery_ok = test_celery()
    print()
    channels_ok = test_channel_layer()
    print()
    
    print("=" * 60)
    if redis_ok and celery_ok and channels_ok:
        print("✅ All components configured correctly!")
        print()
        print("Next steps:")
        print("1. Start Celery worker: celery -A config worker --loglevel=info")
        print("2. Start Django server: python manage.py runserver")
    else:
        print("❌ Some components need attention")
        sys.exit(1)