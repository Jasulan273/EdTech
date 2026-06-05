from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openrouter_api_key: str
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    models: list[str] = [
        "google/gemma-4-31b-it:free",
        "moonshotai/kimi-k2.6:free",
        "google/gemma-4-26b-a4b-it:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
        "qwen/qwen3-next-80b-a3b-instruct:free",
    ]
    database_url: str = "sqlite:///./data/chat.db"
    context_token_limit: int = 6000

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
