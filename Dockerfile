# Use official Python base image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="/root/.local/bin:$PATH"

# Copy only project metadata to cache dependencies
COPY pyproject.toml poetry.lock ./

# Install Python dependencies (without virtualenv)
RUN poetry config virtualenvs.create false && poetry install --no-interaction --no-ansi

# Copy project files
COPY . .

# Collect static files and apply migrations at build time (optional)
RUN python manage.py collectstatic --noinput

# Expose port
EXPOSE 8000

# Start the app
CMD ["gunicorn", "django_setup.wsgi:application", "--bind", "0.0.0.0:8000"]
