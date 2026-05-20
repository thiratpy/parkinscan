FROM node:20-slim AS frontend

WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci --production=false
COPY app/ ./app/
COPY public/ ./public/
COPY next.config.mjs postcss.config.mjs jsconfig.json ./
RUN npm run build

# ── Python runtime ──
FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies (CPU-only torch)
COPY py-api/requirements-prod.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy API code + model
COPY py-api/main.py ./main.py
COPY py-api/model/ ./model/

# Copy frontend static build
COPY --from=frontend /build/out ./static

EXPOSE 7860

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
