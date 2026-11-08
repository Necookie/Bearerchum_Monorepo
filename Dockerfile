# Bearerchum — single image: content build -> web build -> FastAPI runtime (serves API + static site)

# ---------- 1) content: validate + run every reference solution, emit JSON
FROM python:3.12-slim AS content
WORKDIR /repo
COPY content ./content
COPY tools ./tools
COPY reviewer/build ./reviewer/build
RUN python tools/build_content.py --strict --out /out/content

# ---------- 2) web: React + Vite
FROM node:22-alpine AS web
WORKDIR /repo/apps/web
COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY apps/web ./
COPY --from=content /out/content ./public/content
RUN npm run build

# ---------- 3) runtime
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 \
    DATA_DIR=/data WEB_DIR=/app/web
WORKDIR /app
COPY apps/api/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY apps/api/app ./app
COPY --from=web /repo/apps/web/dist ./web
COPY reviewer/CodeBearers_NPC2026_Python_Reviewer.pdf ./web/reviewer.pdf
RUN useradd --uid 10001 --create-home bear && mkdir -p /data && chown -R bear /data
USER bear
VOLUME ["/data"]
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=4).status == 200 else 1)"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
