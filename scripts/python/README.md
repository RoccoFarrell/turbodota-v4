# Python scripts

Unlike `npm install` (which installs into `node_modules` in the project), **pip installs globally** by default—or into whatever Python environment is active.

To keep dependencies **local to this project**, use a virtual environment in this folder:

```bash
# From repo root
python -m venv scripts/python/.venv

# Activate (Windows PowerShell)
scripts/python/.venv/Scripts/Activate.ps1

# Activate (Windows cmd)
scripts/python/.venv/Scripts/activate.bat

# Activate (macOS/Linux)
source scripts/python/.venv/bin/activate

# Then install deps (they go into .venv, not globally)
pip install -r scripts/python/requirements.txt
```

After that, run scripts with the same terminal (so the venv is active), or with the venv’s Python:

```bash
scripts/python/.venv/Scripts/python scripts/python/make-icon-transparent.py input.png
```

Add `scripts/python/.venv/` to `.gitignore` so the environment isn’t committed.
