# Use slim Python base
FROM python:3.11-slim

# Set env vars
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set working dir
WORKDIR /app

# Install system packages needed for poetry & builds
RUN apt-get update && apt-get install -y \
    curl build-essential libpq-dev libffi-dev libssl-dev python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="/root/.local/bin:$PATH"

# Copy dependency files first
COPY pyproject.toml poetry.lock ./

# Install Python deps using Poetry
RUN poetry config virtualenvs.create false && poetry install --no-root --no-interaction --no-ansi
# Copy actual project files
COPY . .

EXPOSE 8000
# Debug block
RUN echo "=== DEBUG: /app contents ===" \
 && ls -la /app || echo "ls failed" \
 && echo "=== DEBUG: full tree under /app ===" \
 && find /app || echo "find failed" \
 && echo "=== DEBUG: Python sys.path ===" \
 && python3 -c "import sys; print('\n'.join(sys.path))" || echo "sys.path failed" \
 && echo "=== DEBUG: trying import" \
 && python3 -c "import django_setup.wsgi" || echo "import failed"

# Start Django app using gunicorn
CMD ["gunicorn", "django_setup.wsgi:application", "--bind", "0.0.0.0:8000"]
