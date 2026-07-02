"""
Command Line Interface (CLI) for the Binance Futures Testnet Trading Bot.
Provides both direct command-line argument execution and an interactive step-by-step terminal menu.
"""

import sys
import os
from typing import Optional
from dotenv import load_dotenv
import typer
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text

try:
    import questionary
except ImportError:
    questionary = None

from trading_bot.logger import logger
from trading_bot.orders import OrderService, OrderResponse
from trading_bot.validators import (
    validate_all_order_params,
    ValidationError,
    BinanceAPIError,
    NetworkError,
    VALID_SIDES,
    VALID_ORDER_TYPES,
)

# Load environment variables from .env file if present
load_dotenv()

app = typer.Typer(
    name="trading-bot",
    help="Binance Futures Testnet Trading Bot - Place orders with CLI flags or interactive menu.",
    add_completion=False,
)
console = Console()

def display_request_summary(symbol: str, side: str, order_type: str, qty: float, price: Optional[float], stop_price: Optional[float]):
    """Print a styled Rich table summarizing the order request before placement."""
    table = Table(title="[SUMMARY] Order Request Summary", show_header=True, header_style="bold cyan", border_style="blue")
    table.add_column("Parameter", style="bold white", width=16)
    table.add_column("Value", style="yellow")

    table.add_row("Symbol", symbol)
    side_color = "bold green" if side == "BUY" else "bold red"
    table.add_row("Side", f"[{side_color}]{side}[/{side_color}]")
    table.add_row("Order Type", order_type)
    table.add_row("Quantity", str(qty))
    
    if price is not None:
        table.add_row("Limit Price", f"{price:,.2f} USDT")
    if stop_price is not None:
        table.add_row("Stop Price", f"{stop_price:,.2f} USDT")
        
    console.print(table)

def display_response_details(response: OrderResponse):
    """Print a styled Rich table showing the order execution response details."""
    table = Table(title="[SUCCESS] Order Response Details", show_header=True, header_style="bold green", border_style="green")
    table.add_column("Field", style="bold white", width=16)
    table.add_column("Detail", style="bold cyan")

    table.add_row("Order ID", str(response.order_id))
    table.add_row("Symbol", response.symbol)
    
    status_color = "bold green" if response.status in {"NEW", "FILLED", "PARTIALLY_FILLED"} else "bold yellow"
    table.add_row("Status", f"[{status_color}]{response.status}[/{status_color}]")
    
    side_color = "bold green" if response.side == "BUY" else "bold red"
    table.add_row("Side", f"[{side_color}]{response.side}[/{side_color}]")
    table.add_row("Order Type", response.order_type)
    table.add_row("Orig Quantity", str(response.orig_qty))
    table.add_row("Executed Qty", str(response.executed_qty))
    
    if response.avg_price > 0:
        table.add_row("Avg Price", f"{response.avg_price:,.2f} USDT")
    elif response.price is not None and response.price > 0:
        table.add_row("Limit Price", f"{response.price:,.2f} USDT")
        
    if response.stop_price is not None and response.stop_price > 0:
        table.add_row("Stop Price", f"{response.stop_price:,.2f} USDT")
        
    console.print(table)
    console.print(Panel("[bold green]SUCCESS[/bold green]: Order placed successfully on Binance Futures Testnet!", border_style="green"))

def handle_order_execution(symbol: str, side: str, order_type: str, qty: float, price: Optional[float] = None, stop_price: Optional[float] = None):
    """Coordinate validation, summary display, order placement, and error handling."""
    try:
        # Validate inputs before displaying summary
        cl_symbol, cl_side, cl_type, cl_qty, cl_price, cl_stop_price = validate_all_order_params(
            symbol, side, order_type, qty, price, stop_price
        )
        
        display_request_summary(cl_symbol, cl_side, cl_type, cl_qty, cl_price, cl_stop_price)
        
        service = OrderService()
        with console.status("[bold yellow]Sending order to Binance Futures Testnet...[/bold yellow]", spinner="dots"):
            res = service.create_and_place_order(
                symbol=cl_symbol,
                side=cl_side,
                order_type=cl_type,
                quantity=cl_qty,
                price=cl_price,
                stop_price=cl_stop_price
            )
            
        display_response_details(res)

    except ValidationError as ve:
        logger.error(f"Validation Failed: {str(ve)}")
        console.print(Panel(f"[bold red]Validation Error:[/bold red] {str(ve)}", title="[ERROR] Input Error", border_style="red"))
        sys.exit(1)
    except BinanceAPIError as bae:
        logger.error(f"Binance API Error: {str(bae)}")
        console.print(Panel(f"[bold red]Binance API Error [{bae.status_code}] (Code {bae.error_code}):[/bold red]\n{bae.message}", title="[ERROR] API Failure", border_style="red"))
        sys.exit(1)
    except NetworkError as ne:
        logger.error(f"Network Error: {str(ne)}")
        console.print(Panel(f"[bold red]Network Error:[/bold red] {str(ne)}", title="[ERROR] Connection Failure", border_style="red"))
        sys.exit(1)
    except Exception as e:
        logger.exception("Unexpected error occurred during order execution.")
        console.print(Panel(f"[bold red]Unexpected Error:[/bold red] {str(e)}", title="[ERROR] System Error", border_style="red"))
        sys.exit(1)

@app.command("place")
def place_order_cmd(
    symbol: str = typer.Option(..., "--symbol", "-s", help="Trading symbol (e.g., BTCUSDT)"),
    side: str = typer.Option(..., "--side", help="Order side: BUY or SELL"),
    order_type: str = typer.Option(..., "--type", "-t", help="Order type: MARKET, LIMIT, STOP_MARKET, or STOP"),
    quantity: float = typer.Option(..., "--qty", "-q", help="Order quantity (e.g., 0.01)"),
    price: Optional[float] = typer.Option(None, "--price", "-p", help="Limit price (required for LIMIT and STOP orders)"),
    stop_price: Optional[float] = typer.Option(None, "--stop-price", help="Stop trigger price (required for STOP_MARKET and STOP orders)"),
):
    """
    Place a trading order directly via command line arguments.
    """
    handle_order_execution(symbol, side, order_type, quantity, price, stop_price)

@app.command("interactive")
def interactive_menu_cmd():
    """
    Launch an interactive terminal menu for guided order placement.
    """
    if questionary is None:
        console.print("[bold red]Error:[/bold red] `questionary` is not installed. Please run `pip install questionary`.")
        sys.exit(1)

    console.print(Panel("[bold cyan][MENU] Binance Futures Testnet Trading Bot - Interactive Menu[/bold cyan]", border_style="cyan"))

    try:
        symbol = questionary.text(
            "Enter Trading Symbol (e.g., BTCUSDT):",
            default="BTCUSDT",
            validate=lambda val: len(val.strip()) >= 4 or "Please enter a valid symbol."
        ).ask()
        if symbol is None: return

        side = questionary.select(
            "Select Order Side:",
            choices=["BUY", "SELL"]
        ).ask()
        if side is None: return

        order_type = questionary.select(
            "Select Order Type:",
            choices=["MARKET", "LIMIT", "STOP_MARKET", "STOP (Stop-Limit)"]
        ).ask()
        if order_type is None: return

        # Clean order type name if extra text was present
        clean_type = "STOP" if "STOP (Stop-Limit)" in order_type else order_type

        qty_str = questionary.text(
            "Enter Quantity (e.g., 0.01):",
            default="0.01",
            validate=lambda val: (try_float(val) and float(val) > 0) or "Please enter a positive number."
        ).ask()
        if qty_str is None: return
        quantity = float(qty_str)

        price: Optional[float] = None
        if clean_type in {"LIMIT", "STOP"}:
            price_str = questionary.text(
                f"Enter Limit Price for {clean_type} order (USDT):",
                validate=lambda val: (try_float(val) and float(val) > 0) or "Please enter a positive price."
            ).ask()
            if price_str is None: return
            price = float(price_str)

        stop_price: Optional[float] = None
        if clean_type in {"STOP_MARKET", "STOP"}:
            stop_str = questionary.text(
                f"Enter Stop Trigger Price for {clean_type} order (USDT):",
                validate=lambda val: (try_float(val) and float(val) > 0) or "Please enter a positive stop price."
            ).ask()
            if stop_str is None: return
            stop_price = float(stop_str)

        console.print("\n")
        display_request_summary(symbol.upper(), side, clean_type, quantity, price, stop_price)

        confirm = questionary.confirm("Do you want to place this order on Binance Testnet?", default=True).ask()
        if not confirm:
            console.print("[yellow]Order placement cancelled by user.[/yellow]")
            return

        console.print("\n")
        handle_order_execution(symbol, side, clean_type, quantity, price, stop_price)

    except KeyboardInterrupt:
        console.print("\n[yellow]Interactive menu cancelled.[/yellow]")
        sys.exit(0)

@app.command("ping")
def ping_cmd():
    """
    Test connectivity to the Binance Futures Testnet server.
    """
    from trading_bot.client import BinanceFuturesClient
    try:
        client = BinanceFuturesClient()
        with console.status("[bold cyan]Testing connection to Binance Testnet...[/bold cyan]"):
            client.ping()
            server_time = client.get_server_time()
        console.print(Panel(f"[bold green]Connected successfully![/bold green]\nServer Time (ms): {server_time}", title="[PING] Ping Result", border_style="green"))
    except Exception as e:
        console.print(Panel(f"[bold red]Connection Failed:[/bold red] {str(e)}", title="[ERROR] Ping Error", border_style="red"))
        sys.exit(1)

@app.callback(invoke_without_command=True)
def main_callback(ctx: typer.Context):
    """
    If no subcommand is provided, launch the interactive menu by default.
    """
    if ctx.invoked_subcommand is None:
        interactive_menu_cmd()

def try_float(val: str) -> bool:
    try:
        float(val)
        return True
    except ValueError:
        return False

if __name__ == "__main__":
    app()
