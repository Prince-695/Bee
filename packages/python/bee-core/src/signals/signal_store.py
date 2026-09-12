import sys
from services.observability.signals import signal_store as _mod
sys.modules[__name__] = _mod
