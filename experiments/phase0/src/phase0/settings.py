import os
from pathlib import Path
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
REPO = ROOT.parents[1]
load_dotenv(REPO / ".env.local")

DATA = ROOT / "data"
RUNS = ROOT / "runs"
DATABASE_URL = os.environ["DATABASE_URL"]
DEEPSEEK_API_KEY = os.environ["DEEPSEEK_API_KEY"]
GOOGLE_API_KEY = os.environ["GOOGLE_API_KEY"]

DEEPSEEK_MODEL = "deepseek-flash"
GOOGLE_MODEL = ""
GOOGLE_EMBEDDING_MODEL = ""
