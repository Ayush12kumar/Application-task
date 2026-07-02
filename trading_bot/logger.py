"""
Logging module for the trading bot.
Provides dual logging: formatted Rich console output and detailed file logging.
"""

import logging
import os
from pathlib import Path
from rich.logging import RichHandler
from rich.console import Console

# Create console instance for rich UI printing
console = Console()

def setup_logger(name: str = "trading_bot", log_dir: str = "logs", log_level: int = logging.INFO) -> logging.Logger:
    """
    Configure and return a logger instance that writes to both a file and console.
    
    Args:
        name: The logger name.
        log_dir: Directory where log files are stored.
        log_level: Minimum logging level.
        
    Returns:
        logging.Logger: Configured logger instance.
    """
    # Create logs directory if it doesn't exist
    log_path = Path(log_dir)
    log_path.mkdir(parents=True, exist_ok=True)
    log_file = log_path / "trading_bot.log"

    logger = logging.getLogger(name)
    logger.setLevel(log_level)
    
    # Avoid adding duplicate handlers if setup_logger is called multiple times
    if logger.handlers:
        return logger

    # File Handler - Detailed formatting with timestamps and exact trace data
    file_formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | [%(filename)s:%(lineno)d] | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    file_handler = logging.FileHandler(log_file, encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)  # File captures DEBUG and above
    file_handler.setFormatter(file_formatter)

    # Console Handler - Using RichHandler for beautiful CLI output
    console_handler = RichHandler(
        console=console,
        show_time=False,
        show_path=False,
        rich_tracebacks=True,
        markup=True
    )
    console_handler.setLevel(log_level)

    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    return logger

# Global logger instance
logger = setup_logger()
