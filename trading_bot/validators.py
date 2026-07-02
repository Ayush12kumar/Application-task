"""
Validators and custom exceptions for the trading bot.
Ensures user input is sanitized and conforms to Binance Futures trading rules before sending API requests.
"""

import re
from typing import Optional, Tuple

class BotException(Exception):
    """Base exception for trading bot errors."""
    pass

class ValidationError(BotException):
    """Raised when user or CLI input fails validation."""
    pass

class BinanceAPIError(BotException):
    """Raised when Binance API returns an error response."""
    def __init__(self, status_code: int, error_code: int, message: str):
        super().__init__(f"Binance API Error [{status_code}] (Code: {error_code}): {message}")
        self.status_code = status_code
        self.error_code = error_code
        self.message = message

class NetworkError(BotException):
    """Raised when network connection or HTTP request fails."""
    pass

VALID_SIDES = {"BUY", "SELL"}
VALID_ORDER_TYPES = {"MARKET", "LIMIT", "STOP_MARKET", "STOP"}

def validate_symbol(symbol: str) -> str:
    """
    Validate and clean trading symbol.
    
    Args:
        symbol: Raw symbol string (e.g., 'btcusdt' or 'BTCUSDT').
        
    Returns:
        str: Uppercase cleaned symbol.
        
    Raises:
        ValidationError: If symbol format is invalid.
    """
    if not symbol or not isinstance(symbol, str):
        raise ValidationError("Symbol cannot be empty.")
    
    cleaned_symbol = symbol.strip().upper()
    if not re.match(r"^[A-Z0-9]{4,15}$", cleaned_symbol):
        raise ValidationError(
            f"Invalid symbol format: '{symbol}'. Expected uppercase alphanumeric (e.g., BTCUSDT)."
        )
    return cleaned_symbol

def validate_side(side: str) -> str:
    """
    Validate order side.
    
    Args:
        side: 'BUY' or 'SELL'.
        
    Returns:
        str: Uppercase side.
        
    Raises:
        ValidationError: If side is not BUY or SELL.
    """
    if not side or not isinstance(side, str):
        raise ValidationError("Side cannot be empty.")
        
    cleaned_side = side.strip().upper()
    if cleaned_side not in VALID_SIDES:
        raise ValidationError(
            f"Invalid order side: '{side}'. Must be one of: {', '.join(VALID_SIDES)}."
        )
    return cleaned_side

def validate_order_type(order_type: str) -> str:
    """
    Validate order type.
    
    Args:
        order_type: 'MARKET', 'LIMIT', 'STOP_MARKET', or 'STOP'.
        
    Returns:
        str: Uppercase order type.
        
    Raises:
        ValidationError: If order type is unsupported.
    """
    if not order_type or not isinstance(order_type, str):
        raise ValidationError("Order type cannot be empty.")
        
    cleaned_type = order_type.strip().upper()
    if cleaned_type not in VALID_ORDER_TYPES:
        raise ValidationError(
            f"Invalid order type: '{order_type}'. Supported types: {', '.join(VALID_ORDER_TYPES)}."
        )
    return cleaned_type

def validate_quantity(qty: float) -> float:
    """
    Validate order quantity.
    
    Args:
        qty: Order quantity as float or numeric string.
        
    Returns:
        float: Validated positive quantity.
        
    Raises:
        ValidationError: If quantity is not a positive number.
    """
    try:
        val = float(qty)
    except (ValueError, TypeError):
        raise ValidationError(f"Invalid quantity: '{qty}'. Must be a valid number.")
        
    if val <= 0:
        raise ValidationError(f"Quantity must be greater than 0. Received: {val}")
    return val

def validate_price(price: Optional[float], order_type: str) -> Optional[float]:
    """
    Validate order price based on order type. Required for LIMIT and STOP (Stop-Limit) orders.
    
    Args:
        price: Order price.
        order_type: Uppercase order type.
        
    Returns:
        Optional[float]: Validated price or None if not applicable.
        
    Raises:
        ValidationError: If price is missing or invalid when required.
    """
    if order_type in {"LIMIT", "STOP"}:
        if price is None:
            raise ValidationError(f"Price is required when placing a {order_type} order.")
        try:
            val = float(price)
        except (ValueError, TypeError):
            raise ValidationError(f"Invalid price: '{price}'. Must be a valid number.")
        if val <= 0:
            raise ValidationError(f"Price must be greater than 0. Received: {val}")
        return val
    elif price is not None:
        try:
            val = float(price)
            if val <= 0:
                raise ValidationError(f"Price must be greater than 0. Received: {val}")
            return val
        except (ValueError, TypeError):
            raise ValidationError(f"Invalid price: '{price}'. Must be a valid number.")
    return None

def validate_stop_price(stop_price: Optional[float], order_type: str) -> Optional[float]:
    """
    Validate stop price based on order type. Required for STOP_MARKET and STOP orders.
    
    Args:
        stop_price: Stop trigger price.
        order_type: Uppercase order type.
        
    Returns:
        Optional[float]: Validated stop price or None.
        
    Raises:
        ValidationError: If stop_price is missing or invalid when required.
    """
    if order_type in {"STOP_MARKET", "STOP"}:
        if stop_price is None:
            raise ValidationError(f"Stop Price is required when placing a {order_type} order.")
        try:
            val = float(stop_price)
        except (ValueError, TypeError):
            raise ValidationError(f"Invalid stop price: '{stop_price}'. Must be a valid number.")
        if val <= 0:
            raise ValidationError(f"Stop Price must be greater than 0. Received: {val}")
        return val
    elif stop_price is not None:
        try:
            val = float(stop_price)
            if val <= 0:
                raise ValidationError(f"Stop Price must be greater than 0. Received: {val}")
            return val
        except (ValueError, TypeError):
            raise ValidationError(f"Invalid stop price: '{stop_price}'. Must be a valid number.")
    return None

def validate_all_order_params(
    symbol: str,
    side: str,
    order_type: str,
    quantity: float,
    price: Optional[float] = None,
    stop_price: Optional[float] = None
) -> Tuple[str, str, str, float, Optional[float], Optional[float]]:
    """
    Run validation across all parameters at once.
    
    Returns:
        Tuple of cleaned and validated arguments: (symbol, side, order_type, quantity, price, stop_price)
    """
    cl_symbol = validate_symbol(symbol)
    cl_side = validate_side(side)
    cl_type = validate_order_type(order_type)
    cl_qty = validate_quantity(quantity)
    cl_price = validate_price(price, cl_type)
    cl_stop_price = validate_stop_price(stop_price, cl_type)
    
    return cl_symbol, cl_side, cl_type, cl_qty, cl_price, cl_stop_price
