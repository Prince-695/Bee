import sys
from services.integrations import hive_runtime as _mod
sys.modules[__name__] = _mod
