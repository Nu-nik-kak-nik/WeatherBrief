import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path

from app.core.core_settings import core_settings


def setup_logger() -> logging.Logger:
    core_settings.log_dir.mkdir(parents=True, exist_ok=True)
    log_file_path = core_settings.log_dir / core_settings.log_file

    logger = logging.getLogger("weather_brief")
    logger.setLevel(getattr(logging, core_settings.log_level.upper(), logging.INFO))

    if logger.handlers:
        return logger

    formatter = logging.Formatter(
        "%(asctime)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    file_handler = RotatingFileHandler(
        log_file_path,
        maxBytes=core_settings.log_max_bytes,
        backupCount=core_settings.log_backup_count,
        encoding="utf-8",
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(
        getattr(logging, core_settings.log_level.upper(), logging.INFO)
    )
    logger.addHandler(file_handler)

    console_handler = logging.StreamHandler(sys.stderr)
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logging.ERROR)
    logger.addHandler(console_handler)

    logger.propagate = False

    return logger


logger = setup_logger()
