"""
Celery configuration for osdag_web project.

Celery is used for offloading heavy PSO optimization tasks to separate worker processes,
preventing Django event loop blocking.
"""

import os
from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Create Celery app instance
app = Celery('osdag_web')

# Load configuration from Django settings
# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from all installed apps
# Celery will look for tasks.py files in all Django apps
app.autodiscover_tasks()

