FROM python:3.10-slim

# Set work directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_APP=run.py \
    FLASK_DEBUG=0 \
    HOST=0.0.0.0 \
    PORT=5000

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Expose port - use PORT environment variable with default
EXPOSE ${PORT:-5000}

# Run the application
CMD ["python", "run.py"]