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
# Explicitly include plate girder submodule so the worker registers run_pso_optimization
try:
    from django.conf import settings
    extra_modules = ["apps.modules.flexure_member.submodules.plate_girder"]
    app.autodiscover_tasks(lambda: list(settings.INSTALLED_APPS) + extra_modules)
except Exception:
    app.autodiscover_tasks()

