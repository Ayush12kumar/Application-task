"""
Order management and placement logic.
Constructs order parameters, coordinates validation, communicates with the API client,
and formats responses into clean, structured objects.
"""

from dataclasses import dataclass
from typing import Optional, Dict, Any

from trading_bot.client import BinanceFuturesClient
from trading_bot.validators import validate_all_order_params
from trading_bot.logger import logger

@dataclass
class OrderResponse:
    """Structured representation of a Binance Futures order response."""
    order_id: int
    symbol: str
    status: str
    side: str
    order_type: str
    orig_qty: float
    executed_qty: float
    avg_price: float
    price: Optional[float] = None
    stop_price: Optional[float] = None
    time_in_force: Optional[str] = None
    raw_data: Optional[Dict[str, Any]] = None

    @classmethod
    def from_api_response(cls, data: Dict[str, Any]) -> "OrderResponse":
        """Parse raw Binance JSON response into structured OrderResponse."""
        return cls(
            order_id=int(data.get("orderId", 0)),
            symbol=str(data.get("symbol", "")),
            status=str(data.get("status", "UNKNOWN")),
            side=str(data.get("side", "")),
            order_type=str(data.get("type", "")),
            orig_qty=float(data.get("origQty", 0.0)),
            executed_qty=float(data.get("executedQty", 0.0)),
            avg_price=float(data.get("avgPrice", 0.0)),
            price=float(data.get("price")) if data.get("price") and float(data.get("price", 0)) > 0 else None,
            stop_price=float(data.get("stopPrice")) if data.get("stopPrice") and float(data.get("stopPrice", 0)) > 0 else None,
            time_in_force=str(data.get("timeInForce")) if data.get("timeInForce") else None,
            raw_data=data
        )

class OrderService:
    """Service class responsible for placing orders and managing order workflows."""
    def __init__(self, client: Optional[BinanceFuturesClient] = None):
        self.client = client or BinanceFuturesClient()

    def create_and_place_order(
        self,
        symbol: str,
        side: str,
        order_type: str,
        quantity: float,
        price: Optional[float] = None,
        stop_price: Optional[float] = None
    ) -> OrderResponse:
        """
        Validate parameters, format request payload, execute via API client, and return structured response.
        
        Args:
            symbol: Trading pair symbol (e.g. BTCUSDT).
            side: Order side ('BUY' or 'SELL').
            order_type: Order type ('MARKET', 'LIMIT', 'STOP_MARKET', 'STOP').
            quantity: Order quantity.
            price: Order limit price (required for LIMIT and STOP).
            stop_price: Stop trigger price (required for STOP_MARKET and STOP).
            
        Returns:
            OrderResponse: Structured response details.
        """
        # 1. Validate inputs
        val_symbol, val_side, val_type, val_qty, val_price, val_stop_price = validate_all_order_params(
            symbol=symbol,
            side=side,
            order_type=order_type,
            quantity=quantity,
            price=price,
            stop_price=stop_price
        )

        # 2. Build API parameters
        params: Dict[str, Any] = {
            "symbol": val_symbol,
            "side": val_side,
            "type": val_type,
            "quantity": str(val_qty)
        }

        if val_type == "LIMIT":
            params["price"] = str(val_price)
            params["timeInForce"] = "GTC"  # Good Till Cancelled is standard required for Limit orders
        elif val_type == "STOP_MARKET":
            params["stopPrice"] = str(val_stop_price)
        elif val_type == "STOP":
            params["price"] = str(val_price)
            params["stopPrice"] = str(val_stop_price)
            params["timeInForce"] = "GTC"

        logger.info(f"Preparing Order Request -> {params}")

        # 3. Place order via client
        raw_response = self.client.place_order(params)
        
        # 4. Parse structured response
        order_response = OrderResponse.from_api_response(raw_response)
        
        logger.info(
            f"Order Execution Successful! Order ID: {order_response.order_id} | "
            f"Status: {order_response.status} | Executed Qty: {order_response.executed_qty} | "
            f"Avg Price: {order_response.avg_price}"
        )
        
        return order_response
