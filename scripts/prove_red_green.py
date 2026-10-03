#!/usr/bin/env python3
"""
Prove that tests actually depend on their implementation ("tests must bite").

For each target in scripts/red-green-targets.json:
  1. GREEN  run the target's tests with the real implementation      -> must pass
  2. RED    replace every function body in the implementation with a
            "not implemented" stub, run the tests again               -> must fail, and the
            failure output must mention "not implemented"              (the right reason)
  3. GREEN  restore the real implementation, run the tests again      -> must pass

The original file is always restored, even on error or Ctrl-C.
Supports Python (.py, via ast) and TypeScript (.ts/.tsx, via web/scripts/stub-ts.mjs).

Usage: python scripts/prove_red_green.py [--only NAME]
"""
import argparse
import ast
import json
import shlex
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MARKER = "not implemented"


def stub_python(source: str) -> str:
    tree = ast.parse(source)
    stub = ast.parse(f"raise NotImplementedError({MARKER!r})").body
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            doc = node.body[:1] if (node.body and isinstance(node.body[0], ast.Expr)
                                    and isinstance(getattr(node.body[0], "value", None), ast.Constant)) else []
            node.body = doc + stub
    return ast.unparse(tree) + "\n"


def stub_typescript(path: Path) -> str:
    res = subprocess.run(["node", str(ROOT / "web" / "scripts" / "stub-ts.mjs"), str(path)],
                         capture_output=True, text=True, check=True, cwd=ROOT / "web")
    return res.stdout


def run(cmd: str, cwd: Path) -> subprocess.CompletedProcess:
    return subprocess.run(shlex.split(cmd), cwd=cwd, capture_output=True, text=True)


def prove(target: dict) -> bool:
    impl = ROOT / target["implementation"]
    cwd = ROOT / target.get("cwd", ".")
    cmd = target["test"]
    original = impl.read_text(encoding="utf-8")
    print(f"\n=== {target['name']}: {target['implementation']}")

    first = run(cmd, cwd)
    if first.returncode != 0:
        print("  GREEN (before) FAILED: tests do not pass with the real implementation\n" + first.stdout[-2000:] + first.stderr[-2000:])
        return False
    print("  GREEN  real implementation       -> tests pass")

    try:
        stubbed = stub_python(original) if impl.suffix == ".py" else stub_typescript(impl)
        impl.write_text(stubbed, encoding="utf-8")
        red = run(cmd, cwd)
    finally:
        impl.write_text(original, encoding="utf-8")

    output = red.stdout + red.stderr
    if red.returncode == 0:
        print("  RED    FAILED: tests still pass with a stubbed implementation (tests do not bite)")
        return False
    if MARKER not in output.lower() and "notimplementederror" not in output.lower():
        print("  RED    FAILED: tests fail, but not because of the missing implementation:\n" + output[-2000:])
        return False
    print("  RED    implementation stubbed    -> tests fail with 'not implemented'")

    last = run(cmd, cwd)
    if last.returncode != 0:
        print("  GREEN (after) FAILED\n" + last.stdout[-2000:] + last.stderr[-2000:])
        return False
    print("  GREEN  implementation restored   -> tests pass")
    return True


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--only", help="run a single target by name")
    args = ap.parse_args()
    targets = json.loads((ROOT / "scripts" / "red-green-targets.json").read_text(encoding="utf-8"))
    if args.only:
        targets = [t for t in targets if t["name"] == args.only]
    results = [prove(t) for t in targets]
    print(f"\n{sum(results)}/{len(results)} targets proven red -> green")
    sys.exit(0 if all(results) else 1)


if __name__ == "__main__":
    main()
