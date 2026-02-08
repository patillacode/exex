FROM python:3.10-slim

# Set work directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=5054

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Expose default port
EXPOSE ${PORT}

# Run with waitress production WSGI server (shell form to resolve $PORT at runtime)
CMD waitress-serve --host=0.0.0.0 --port=${PORT} --call app:create_app
