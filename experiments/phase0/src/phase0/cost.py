import json, datetime
from zoneinfo import ZoneInfo
from .settings import RUNS

# 每百万 token 的rmb价格，开始前按官网更新
PRICES = {
    "deepseek-flash": {"input": 1.00, "cached": 0.02, "output": 4.00},
}
JST = ZoneInfo("Asia/Tokyo")

def is_deepseek_peak(now=None) -> bool:
    now = now or datetime.datetime.now(JST)
    if now.weekday() >= 5:
        return False
    return 10 <= now.hour < 13 or 15 <= now.hour < 19

def log_call(provider, model, purpose, input_tokens, output_tokens, cached_tokens=0):
    p = PRICES.get(model)
    rmb = 0.0
    peak = provider == "deepseek" and is_deepseek_peak()
    if p:
        rmb = ((input_tokens - cached_tokens) * p["input"] + cached_tokens * p["cached"]
               + output_tokens * p["output"]) / 1e6
        if peak:
            rmb *= 2
    rec = {"ts": datetime.datetime.now(JST).isoformat(),
           "provider": provider, "model": model, "purpose": purpose,
           "input_tokens": input_tokens, "cached_tokens": cached_tokens,
           "output_tokens": output_tokens, "peak": peak, "rmb": round(rmb, 6)}
    with open(RUNS / "cost_log.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    return rec