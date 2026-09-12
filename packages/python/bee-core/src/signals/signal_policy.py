import sys
from services.observability.signals import signal_policy as _mod
sys.modules[__name__] = _mod
