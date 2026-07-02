#!/usr/bin/env python3
"""
Root entrypoint for the Binance Futures Testnet Trading Bot.
Run `python main.py --help` to see available CLI commands, or run `python main.py` to launch the interactive menu.
"""

from trading_bot.cli import app

if __name__ == "__main__":
    app()
