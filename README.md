# 🤖 Binance Futures Testnet Trading Bot (USDT-M)

A robust, beautifully structured Python application designed to interact with the **Binance Futures Testnet (USDT-M)** (`https://testnet.binancefuture.com`). It allows users to place trading orders with complete input validation, HMAC SHA256 signing, structured response parsing, and comprehensive logging.

---

## ✨ Key Features & Bonus Implementations

1. **Dual CLI & Interactive UX (Bonus Feature)**:
   - **Interactive Menu Mode**: Run the bot without arguments to enter a guided terminal menu built with `questionary` and `rich`. Features live input validation, colored summary tables, and confirmation prompts.
   - **Direct Command-Line Flags**: For rapid automation and scripting, place orders directly using clean command-line flags powered by `typer`.
2. **Extended Order Types (Bonus Feature)**:
   - Supports **`MARKET`** and **`LIMIT`** orders.
   - Supports **`STOP_MARKET`** and **`STOP` (Stop-Limit)** orders.
   - Supports both trading sides: **`BUY`** and **`SELL`**.
3. **Structured & Reusable Architecture**:
   - Strictly separates the **REST API/Client Layer**, **Business/Order Placement Logic Layer**, **Validation Layer**, and **Presentation/CLI Layer**.
4. **Professional Dual Logging**:
   - **Console**: Clean, colorful human-readable tables and panels using `rich`.
   - **File Logging (`logs/trading_bot.log`)**: Detailed traces capturing exact HTTP methods, endpoint URLs, headers (with masked API secrets), request parameters, response status codes, JSON payloads, and stack traces on error.
5. **Defensive Error Handling**:
   - Custom exception hierarchy (`ValidationError`, `BinanceAPIError`, `NetworkError`).
   - Prevents invalid API calls before network transmission (e.g., negative prices, missing limit prices, invalid symbol formats).

---

## 🛠️ Setup Instructions

### 1. Prerequisites
- Python 3.8 or higher installed on your system.
- An active Binance Futures Testnet account. Register and generate free API keys at: [https://testnet.binancefuture.com](https://testnet.binancefuture.com).

### 2. Installation
Clone or unzip the project directory, then navigate into it:
```bash
cd trading_bot_project
```

Create and activate a virtual environment (recommended):
```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

Install the required dependencies:
```bash
pip install -r requirements.txt
```

### 3. API Credentials Configuration
Copy the sample environment file to create your local `.env` file:
```bash
# On Windows (Command Prompt)
copy .env.example .env

# On macOS/Linux/PowerShell
cp .env.example .env
```

Open `.env` in a text editor and enter your Binance Futures Testnet credentials:
```env
BINANCE_API_KEY=your_actual_testnet_api_key
BINANCE_API_SECRET=your_actual_testnet_api_secret
BINANCE_BASE_URL=https://testnet.binancefuture.com
```

---

## 🚀 How to Run Examples

### 1. Interactive Terminal Menu (Recommended)
Simply execute `main.py` without any arguments to launch the interactive wizard:
```bash
python main.py
```
*Follow the on-screen prompts to select your trading symbol, order side, order type, quantity, and prices.*

### 2. Direct Command-Line Execution
You can place orders directly from your terminal using command-line arguments:

#### Place a MARKET Buy Order:
```bash
python main.py place --symbol BTCUSDT --side BUY --type MARKET --qty 0.01
```

#### Place a LIMIT Sell Order:
```bash
python main.py place --symbol BTCUSDT --side SELL --type LIMIT --qty 0.01 --price 105000.00
```

#### Place a STOP_MARKET Buy Order:
```bash
python main.py place --symbol ETHUSDT --side BUY --type STOP_MARKET --qty 0.1 --stop-price 3500.00
```

#### Place a STOP (Stop-Limit) Sell Order:
```bash
python main.py place --symbol BTCUSDT --side SELL --type STOP --qty 0.01 --price 94000.00 --stop-price 95000.00
```

### 3. Test Testnet Server Connectivity
Check your API connection and retrieve Binance Testnet server time:
```bash
python main.py ping
```

### 4. View Help & All Options
```bash
python main.py --help
python main.py place --help
```

---

## 🏗️ Project Architecture

```
trading_bot_project/
├── trading_bot/
│   ├── __init__.py      # Package initializer
│   ├── client.py        # Direct REST API client wrapper & HMAC SHA256 signer
│   ├── orders.py        # Order placement logic & structured response formatter
│   ├── validators.py    # Input sanitization & custom exception hierarchy
│   ├── logger.py        # Dual logging setup (Rich console + file logs)
│   └── cli.py           # Typer CLI commands & Questionary interactive menu
├── logs/
│   ├── sample_orders.log # Pre-recorded sample execution logs of MARKET & LIMIT orders
│   └── trading_bot.log   # Active application log generated at runtime
├── main.py              # Root runner script
├── pyproject.toml       # Project packaging metadata
├── requirements.txt     # Python dependency list
├── .env.example         # Template for API credentials
└── README.md            # Project documentation
```

### Layer Breakdown:
- **`validators.py`**: Ensures all arguments strictly conform to Binance trading rules (e.g., uppercase alphanumeric symbols, positive quantities, conditionally required limit/stop prices).
- **`client.py`**: A clean, dependency-minimal REST client using `requests`. Manages HTTP headers (`X-MBX-APIKEY`), generates query string HMAC SHA256 signatures, and transforms HTTP or API error codes into descriptive `BinanceAPIError` exceptions.
- **`orders.py`**: Coordinates validation and API calls. Transforms raw JSON dictionaries returned by Binance into a type-safe `OrderResponse` data object.
- **`logger.py`**: Formats and routes log messages. Ensures sensitive API keys and signatures are masked (`****`) in log files for security.
- **`cli.py`**: Binds the service layer to user presentation using `typer` and `rich`, providing beautiful tables and progress spinners.

---

## 📝 Assumptions & Notes
1. **Time in Force**: For all `LIMIT` and `STOP` (Stop-Limit) orders, `timeInForce` is automatically set to `GTC` (Good Till Cancelled) as required by Binance Futures trading rules.
2. **Security**: Sensitive secrets (API Keys and HMAC signatures) are masked in all generated log files (`logs/trading_bot.log`).
3. **Testnet Environment**: The application strictly defaults to `https://testnet.binancefuture.com`. Ensure your API keys are generated specifically for the Futures Testnet and not the live Binance production exchange.
