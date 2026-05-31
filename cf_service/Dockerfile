# implicit /scipy/numpy потребують компіляторів під час встановлення
# Ставляться у builder-образі, щоб фінальний runtime лишився чистим
FROM python:3.11-slim AS builder

WORKDIR /app

# Системні залежності для збірки наукових пакетів
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    gfortran \
    libopenblas-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Збирає всі залежності у wheels (готові бінарники), щоб у рантаймі просто їх поставити без компіляції
RUN pip wheel --no-cache-dir --wheel-dir /app/wheels -r requirements.txt



FROM python:3.11-slim AS runtime

WORKDIR /app

# libgomp1 - рантайм OpenMP, потрібен implicit/ALS для багатопотокового навчання
# libopenblas - рантайм лінійної алгебри для numpy/scipy
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    libopenblas0 \
    && rm -rf /var/lib/apt/lists/*

# Ставить залежності з заздалегідь зібраних wheels
COPY --from=builder /app/wheels /wheels
COPY requirements.txt .
RUN pip install --no-cache-dir --no-index --find-links=/wheels -r requirements.txt \
    && rm -rf /wheels

# Копіює код CF-сервісу
COPY . .

WORKDIR /app/src

# main.py запускає uvicorn на 8000, але для App Runner відкриваю порт явно через env
ENV PORT=8000
EXPOSE 8000

# Запускаєься напряму через uvicorn (без релоуда бо це прод)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]