import sys
from services.guardian import secret_redactor as _mod
sys.modules[__name__] = _mod
