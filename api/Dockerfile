FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:0.6.11 /uv /bin/uv

WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PATH="/app/.venv/bin:$PATH"

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --group serve --no-install-project

COPY windesk ./windesk
COPY data ./data

RUN useradd --create-home app
USER app

EXPOSE 8000
CMD ["uvicorn", "windesk.main:app", "--host", "0.0.0.0", "--port", "8000"]
