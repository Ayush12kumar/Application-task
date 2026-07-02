"""
Binance Futures Testnet REST API Client Wrapper.
Handles HMAC SHA256 request signing, HTTP header management, error handling, and detailed logging.
"""

import hmac
import hashlib
import time
import os
import requests
from typing import Dict, Any, Optional
from urllib.parse import urlencode
from dotenv import load_dotenv

from trading_bot.logger import logger
from trading_bot.validators import BinanceAPIError, NetworkError, ValidationError

load_dotenv()
DEFAULT_BASE_URL = "https://testnet.binancefuture.com"

class BinanceFuturesClient:
    """
    REST API wrapper for Binance Futures Testnet (USDT-M).
    """
    def __init__(self, api_key: Optional[str] = None, api_secret: Optional[str] = None, base_url: Optional[str] = None):
        """
        Initialize Binance Futures Client.
        If credentials are not passed, loads from environment variables BINANCE_API_KEY and BINANCE_API_SECRET.
        """
        self.api_key = api_key or os.getenv("BINANCE_API_KEY", "").strip()
        self.api_secret = api_secret or os.getenv("BINANCE_API_SECRET", "").strip()
        self.base_url = (base_url or os.getenv("BINANCE_BASE_URL") or DEFAULT_BASE_URL).rstrip("/")
        self.session = requests.Session()
        
        if self.api_key:
            self.session.headers.update({
                "X-MBX-APIKEY": self.api_key,
                "Content-Type": "application/x-www-form-urlencoded"
            })
            
    def _mask_secret(self, text: str) -> str:
        """Helper to mask sensitive API keys or signatures in logs."""
        if not text or len(text) <= 8:
            return "****"
        return f"{text[:4]}****{text[-4:]}"

    def _is_mock_mode(self) -> bool:
        """Check if running in mock/demo mode due to placeholder or test keys."""
        if not self.api_key or not self.api_secret:
            return True
        key_lower = self.api_key.lower()
        if "0123456789" in key_lower or "paste_" in key_lower or "your_" in key_lower or "test_" in key_lower or "mock" in key_lower:
            return True
        return False

    def _generate_signature(self, params: Dict[str, Any]) -> str:
        """
        Generate HMAC SHA256 signature for signed endpoints.
        
        Args:
            params: Dictionary of query/body parameters.
            
        Returns:
            str: Hexadecimal signature string.
            
        Raises:
            ValidationError: If API secret is not set.
        """
        if self._is_mock_mode():
            return "mock_signature_hex_abcdef1234567890"

        if not self.api_secret:
            raise ValidationError("API Secret is required for signed API calls. Please set BINANCE_API_SECRET.")
        
        query_string = urlencode(params)
        signature = hmac.new(
            self.api_secret.encode("utf-8"),
            query_string.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        return signature

    def _send_request(self, method: str, endpoint: str, signed: bool = False, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Send HTTP request to Binance API with logging and error handling.
        
        Args:
            method: HTTP method ('GET' or 'POST').
            endpoint: API endpoint (e.g., '/fapi/v1/order').
            signed: Whether the endpoint requires HMAC SHA256 signature.
            params: Request parameters.
            
        Returns:
            Dict[str, Any]: Parsed JSON response.
            
        Raises:
            BinanceAPIError: If API returns an error status/code.
            NetworkError: If network connection fails.
            ValidationError: If API key/secret missing when required.
        """
        if signed and self._is_mock_mode():
            logger.info("Notice: Running in Simulated Testnet Demo Mode (Placeholder API credentials detected in .env)")
            url = f"{self.base_url}{endpoint}"
            payload = params.copy() if params else {}
            payload["timestamp"] = int(time.time() * 1000)
            payload["signature"] = "mock_signature_hex_abcdef1234567890"
            masked_headers = {"X-MBX-APIKEY": "mock****demo"}
            logger.debug(f"Sending Simulated API Request -> Method: {method} | URL: {url} | Headers: {masked_headers} | Params: {payload}")
            
            import random
            sim_id = random.randint(1000000000, 9999999999)
            order_type = str(payload.get("type", "MARKET"))
            qty = str(payload.get("quantity", "0.01"))
            price = str(payload.get("price", "0.00"))
            stop_price = str(payload.get("stopPrice", "0.00"))
            status = "FILLED" if order_type == "MARKET" else "NEW"
            avg_price = "65432.10" if order_type == "MARKET" else "0.00"
            exec_qty = qty if order_type == "MARKET" else "0.00"
            
            sim_res = {
                "orderId": sim_id,
                "symbol": str(payload.get("symbol", "BTCUSDT")),
                "status": status,
                "clientOrderId": f"simOrder_{sim_id}",
                "price": price,
                "avgPrice": avg_price,
                "origQty": qty,
                "executedQty": exec_qty,
                "cumQty": exec_qty,
                "cumQuote": "654.32",
                "timeInForce": str(payload.get("timeInForce", "GTC")),
                "type": order_type,
                "reduceOnly": False,
                "closePosition": False,
                "side": str(payload.get("side", "BUY")),
                "positionSide": "BOTH",
                "stopPrice": stop_price,
                "workingType": "CONTRACT_PRICE",
                "priceProtect": False,
                "origType": order_type,
                "updateTime": int(time.time() * 1000)
            }
            logger.debug(f"Received Simulated API Response -> Status: 200 | Elapsed: 32.15ms")
            logger.debug(f"API Response Data -> {sim_res}")
            return sim_res

        if signed and not self.api_key:
            raise ValidationError("API Key is required for signed API calls. Please set BINANCE_API_KEY.")
            
        url = f"{self.base_url}{endpoint}"
        payload = params.copy() if params else {}

        if signed:
            payload["timestamp"] = int(time.time() * 1000)
            payload["signature"] = self._generate_signature(payload)

        # Log request details (masking signature and API key for safety)
        masked_headers = {"X-MBX-APIKEY": self._mask_secret(self.api_key)} if self.api_key else {}
        masked_payload = payload.copy()
        if "signature" in masked_payload:
            masked_payload["signature"] = self._mask_secret(str(masked_payload["signature"]))

        logger.debug(f"Sending API Request -> Method: {method} | URL: {url} | Headers: {masked_headers} | Params: {masked_payload}")

        start_time = time.time()
        try:
            if method.upper() == "GET":
                response = self.session.get(url, params=payload, timeout=10)
            elif method.upper() == "POST":
                response = self.session.post(url, data=payload, timeout=10)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
                
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            logger.debug(f"Received API Response -> Status: {response.status_code} | Elapsed: {elapsed_ms}ms")
            
            # Try to parse JSON
            try:
                data = response.json()
            except ValueError:
                data = {"raw_text": response.text}

            # Check for HTTP or Binance specific error codes
            if response.status_code >= 400 or (isinstance(data, dict) and "code" in data and int(data["code"]) < 0):
                err_code = int(data.get("code", response.status_code))
                err_msg = str(data.get("msg", data.get("raw_text", "Unknown Binance API Error")))
                logger.error(f"Binance API Request Failed -> Endpoint: {endpoint} | Status: {response.status_code} | Code: {err_code} | Msg: {err_msg}")
                raise BinanceAPIError(status_code=response.status_code, error_code=err_code, message=err_msg)

            logger.debug(f"API Response Data -> {data}")
            return data

        except requests.exceptions.RequestException as e:
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            logger.error(f"Network Failure during API Request -> Endpoint: {endpoint} | Error: {str(e)} | Elapsed: {elapsed_ms}ms", exc_info=True)
            raise NetworkError(f"Network error while connecting to Binance Testnet ({endpoint}): {str(e)}") from e

    def ping(self) -> bool:
        """Test connectivity to the Rest API."""
        self._send_request("GET", "/fapi/v1/ping", signed=False)
        return True

    def get_server_time(self) -> int:
        """Get current Binance server time in milliseconds."""
        res = self._send_request("GET", "/fapi/v1/time", signed=False)
        return int(res.get("serverTime", 0))

    def get_exchange_info(self) -> Dict[str, Any]:
        """Get current exchange trading rules and symbol information."""
        return self._send_request("GET", "/fapi/v1/exchangeInfo", signed=False)

    def get_account_info(self) -> Dict[str, Any]:
        """Get current account balance and margin information (requires API Key + Secret)."""
        return self._send_request("GET", "/fapi/v2/account", signed=True)

    def place_order(self, order_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Place a new order on Binance Futures Testnet.
        
        Args:
            order_params: Dictionary containing symbol, side, type, quantity, price, etc.
            
        Returns:
            Dict[str, Any]: Raw order execution response from Binance.
        """
        logger.info(f"Placing order on Testnet: {order_params.get('side')} {order_params.get('quantity')} {order_params.get('symbol')} @ {order_params.get('type')}")
        return self._send_request("POST", "/fapi/v1/order", signed=True, params=order_params)
