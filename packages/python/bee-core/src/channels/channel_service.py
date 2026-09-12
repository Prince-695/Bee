import sys
from services.notifications.channels import channel_service as _mod
sys.modules[__name__] = _mod
