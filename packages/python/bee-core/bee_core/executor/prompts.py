import sys
from services.agent_runtime import prompts as _mod
sys.modules[__name__] = _mod
