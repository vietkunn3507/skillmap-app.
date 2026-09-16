FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv ca-certificates tini && rm -rf /var/lib/apt/lists/*
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack pnpm install --frozen-lockfile
COPY deploy/backend/requirements.txt /tmp/requirements.txt
RUN python3 -m venv /opt/venv && /opt/venv/bin/pip install --no-cache-dir -r /tmp/requirements.txt
COPY . .
# Build uses a disposable database, never the production profile database.
RUN AUTH_DB_PATH=/tmp/skillmap-build.sqlite BETTER_AUTH_SECRET=build-only-placeholder-not-used-at-runtime NEXT_PUBLIC_API_URL=http://127.0.0.1:8000 corepack pnpm build
ENV NODE_ENV=production NEXT_PUBLIC_API_URL=http://127.0.0.1:8000 PYTHONUNBUFFERED=1
EXPOSE 10000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["bash", "deploy/start.sh"]
