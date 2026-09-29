from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseNotificationProvider(ABC):
    """
    Abstract interface for alert delivery channels (SMS, WhatsApp, Email).
    """

    @abstractmethod
    async def send(self, recipient: str, message: str, **kwargs) -> Dict[str, Any]:
        """
        Sends an alert message to a recipient.
        """
        raise NotImplementedError

    @abstractmethod
    def is_configured(self) -> bool:
        """
        Returns True if real credentials are fully configured.
        """
        raise NotImplementedError
