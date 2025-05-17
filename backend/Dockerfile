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

ENV PYTHONPATH=/app

# Debug block
RUN echo "=== DEBUG: Current working directory ===" \
 && pwd \
 && echo "=== DEBUG: /app contents ===" \
 && ls -la /app \
 && echo "=== DEBUG: Recursive structure under /app ===" \
 && find /app \
 && echo "=== DEBUG: Does django_setup/ exist? ===" \
 && [ -d /app/django_setup ] && echo "Yes, it's there." || echo "Nope, missing." \
 && echo "=== DEBUG: Does wsgi.py exist? ===" \
 && [ -f /app/django_setup/wsgi.py ] && echo "Yes, it exists." || echo "Nope, missing." \
 && echo "=== DEBUG: Python sys.path ===" \
 && python3 -c "import sys; print('\n'.join(sys.path))"

# Start Django app using gunicorn
CMD ["gunicorn", "django_setup.wsgi:application", "--bind", "0.0.0.0:8000"]
