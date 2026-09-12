import sys
from services.agent_runtime import worker_roles as _mod
sys.modules[__name__] = _mod
