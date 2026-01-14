# 🚀 Инструкция по деплою на сервер (Ubuntu/Debian + Docker)

## Подготовка локально

### 1. Генерация секретных ключей

Сгенерируйте надежные пароли и ключи:

```bash
# Генерация JWT_SECRET (используется для аутентификации)
openssl rand -base64 32

# Генерация пароля для PostgreSQL
openssl rand -base64 16
```

**Сохраните эти значения!** Они понадобятся на сервере.

### 2. Подготовка кода к деплою

Запустите скрипт подготовки (он автоматически переключит Prisma на PostgreSQL):

```bash
./deploy.sh
```

Вручную это можно сделать так:
```bash
sed -i.bak 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
```

---

## Настройка сервера

### 3. Подключение к серверу

```bash
ssh user@your-server-ip
```

### 4. Установка Docker и Docker Compose

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER

# Установка Docker Compose (если не установлен автоматически)
sudo apt install docker-compose-plugin -y

# Проверка установки
docker --version
docker compose version
```

**Выйдите и зайдите снова**, чтобы изменения группы вступили в силу:
```bash
exit
ssh user@your-server-ip
```

---

## Деплой приложения

### 5. Копирование файлов на сервер

**На локальной машине:**

```bash
# Копирование проекта на сервер (замените user@server-ip на свои данные)
scp -r . user@your-server-ip:~/shopping-list

# Или через rsync (быстрее для больших проектов)
rsync -av --exclude='node_modules' --exclude='.next' --exclude='.git' \
  . user@your-server-ip:~/shopping-list
```

### 6. Настройка на сервере

**На сервере:**

```bash
# Переход в директорию проекта
cd ~/shopping-list

# Создание .env файла из примера
cp .env.production.example .env

# Редактирование .env
nano .env
```

**Заполните .env следующими значениями:**

```env
# База данных PostgreSQL
DATABASE_URL="postgresql://shoppinglist:ВАШ_POSTGRES_PARОЛЬ@postgres:5432/shoppinglist"

# JWT Secret (сгенерированный на шаге 1)
JWT_SECRET="ВАШ_JWT_SECRET_ОТ_ШАГА_1"

# Настройки PostgreSQL
POSTGRES_USER="shoppinglist"
POSTGRES_PASSWORD="ВАШ_POSTGRES_PARОЛЬ"
POSTGRES_DB="shoppinglist"

# Порт приложения
PORT=3000
```

Сохраните файл (`Ctrl+O`, `Enter`, `Ctrl+X` в nano).

### 7. Запуск приложения

```bash
# Сборка и запуск контейнеров
docker compose up -d --build

# Проверка статуса
docker compose ps

# Просмотр логов (если есть ошибки)
docker compose logs -f
```

### 8. Запуск миграций Prisma

```bash
# Выполнение миграций в контейнере
docker compose exec app npx prisma migrate deploy

# Или при первом запуске можно использовать:
docker compose exec app npx prisma db push
```

---

## Проверка работоспособности

### 9. Проверка приложения

```bash
# Проверка логов
docker compose logs -f app

# Проверка контейнеров
docker compose ps
```

Откройте в браузере: `http://your-server-ip:3000`

---

## Настройка Nginx (опционально, но рекомендуется)

### 10. Установка Nginx

```bash
sudo apt install nginx -y
```

### 11. Создание конфигурации Nginx

```bash
sudo nano /etc/nginx/sites-available/shopping-list
```

**Содержимое конфига:**

```nginx
server {
    listen 80;
    server_name your-domain.com;  # или IP сервера

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 12. Активация конфигурации

```bash
# Создание символической ссылки
sudo ln -s /etc/nginx/sites-available/shopping-list /etc/nginx/sites-enabled/

# Проверка конфигурации
sudo nginx -t

# Перезагрузка Nginx
sudo systemctl reload nginx
```

### 13. Настройка Firewall (если включен UFW)

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

---

## SSL с Let's Encrypt (рекомендуется для HTTPS)

### 14. Установка Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 15. Получение SSL сертификата

```bash
sudo certbot --nginx -d your-domain.com
```

Следуйте инструкциям. Certbot автоматически настроит HTTPS.

---

## Обновление приложения

### Когда нужно обновить код:

**На локальной машине:**

```bash
# Подготовка обновления
git pull  # или внесение изменений
./deploy.sh  # переключение на PostgreSQL

# Копирование на сервер
rsync -av --exclude='node_modules' --exclude='.next' --exclude='.git' \
  . user@your-server-ip:~/shopping-list
```

**На сервере:**

```bash
cd ~/shopping-list

# Пересборка и перезапуск
docker compose down
docker compose up -d --build

# Миграции базы данных
docker compose exec app npx prisma migrate deploy
```

---

## Полезные команды

### Управление Docker контейнерами

```bash
# Просмотр логов
docker compose logs -f app        # приложения
docker compose logs -f postgres   # базы данных

# Перезапуск контейнеров
docker compose restart

# Остановка контейнеров
docker compose down

# Запуск контейнеров
docker compose up -d

# Вход в контейнер (для отладки)
docker compose exec app sh
```

### Бэкап базы данных

```bash
# Создание бэкапа
docker compose exec postgres pg_dump -U shoppinglist shoppinglist > backup_$(date +%Y%m%d).sql

# Восстановление из бэкапа
cat backup_20250114.sql | docker compose exec -T postgres psql -U shoppinglist shoppinglist
```

---

## Мониторинг

### Проверка использования ресурсов

```bash
# Статистика Docker
docker stats

# Свободное место на диске
df -h

# Использование RAM
free -h
```

### Автоматический запуск при перезагрузке сервера

Docker Compose автоматически настроен на `restart: unless-stopped`, поэтому контейнеры запустятся при перезагрузке сервера.

---

## Безопасность

### Рекомендации по безопасности:

1. ✅ Используйте сложные пароли (сгенерированные через `openssl`)
2. ✅ Не открывайте порт 5432 (PostgreSQL) наружу
3. ✅ Используйте HTTPS (Let's Encrypt)
4. ✅ Регулярно обновляйте систему: `sudo apt update && sudo apt upgrade -y`
5. ✅ Настройте бэкапы базы данных
6. ✅ Используйте SSH ключи вместо паролей
7. ✅ Отключите password аутентификацию в SSH

### Отключение password аутентификации SSH

```bash
sudo nano /etc/ssh/sshd_config
```

Измените:
```
PasswordAuthentication no
```

Перезапустите SSH:
```bash
sudo systemctl restart sshd
```

---

## Решение проблем

### Приложение не запускается

```bash
# Проверка логов
docker compose logs -f

# Проверка статуса контейнеров
docker compose ps

# Пересборка с очисткой кэша
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Ошибки базы данных

```bash
# Проверка логов PostgreSQL
docker compose logs postgres

# Пересоздание базы данных
docker compose down -v
docker compose up -d
docker compose exec app npx prisma migrate deploy
```

### Нет доступа к приложению

```bash
# Проверка firewall
sudo ufw status

# Проверка Nginx
sudo nginx -t
sudo systemctl status nginx

# Проверка порта 3000
netstat -tlnp | grep 3000
```

---

## Контакты и поддержка

При возникновении проблем проверьте:
1. Логи Docker: `docker compose logs -f`
2. Конфигурацию Nginx: `sudo nginx -t`
3. Firewall: `sudo ufw status`
