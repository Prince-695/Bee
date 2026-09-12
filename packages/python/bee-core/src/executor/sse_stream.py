import sys
from services.observability import sse_stream as _mod
sys.modules[__name__] = _mod
