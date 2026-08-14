#!/usr/bin/env python3
"""Compatibility entrypoint for the canonical tools/build_review_board.py."""

from pathlib import Path
import runpy
import sys

tool_root = Path(__file__).resolve().parents[1] / "tools"
sys.path.insert(0, str(tool_root))
runpy.run_path(str(tool_root / "build_review_board.py"), run_name="__main__")
