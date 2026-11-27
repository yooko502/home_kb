from openai import OpenAI
from phase0.cost import log_call
from phase0.settings import DEEPSEEK_API_KEY, DEEPSEEK_MODEL

ds = OpenAI(api_key=DEEPSEEK_API_KEY,base_url="https://api.deepseek.com")
ds_model = DEEPSEEK_MODEL

response = ds.chat.completions.create(
    model=ds_model,
    messages=[
        {"role": "user", "content": "用中文解释[アニメ]是什么意思。"},
    ],
    reasoning_effort="none"
)
print(response.choices[0].message.content)
log_call(
    provider="deepseek",
    model=ds_model,
    purpose="check_api",
    input_tokens=response.usage.prompt_tokens,
    output_tokens=response.usage.completion_tokens
)