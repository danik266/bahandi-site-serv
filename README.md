# Bahandi Write-off

В `site/` лежит сайт на React/Vite. Общий Express API поднят отдельно на сервере:

```txt
http://46.101.134.38:4000/api
```

Мобильное приложение лежит в `../mobile` и работает с тем же API.

## Локальный запуск

Из корня проекта:

```bash
npm run install:all
cp .env.example .env
npm run dev
```

Сайт будет на `http://localhost:5173` и по умолчанию будет ходить на серверный API.

Мобильное приложение запускается отдельно:

```bash
npm run dev:mobile
```

Для телефона в `mobile/.env` уже стоит серверный API:

```env
EXPO_PUBLIC_API_URL=http://46.101.134.38:4000/api
EXPO_PUBLIC_WEB_URL=http://46.101.134.38:4000
```

## Общий бекенд

Оба клиента используют одни и те же эндпоинты:

- `POST /api/auth/login` - вход сотрудника или проверяющего
- `GET /api/bootstrap` - справочники, заявки, аудит
- `POST /api/requests` - создание заявки
- `PATCH /api/requests/:requestId/approve` - подтверждение проверяющим
- `PATCH /api/requests/:requestId/reject` - отклонение проверяющим

В demo-данных PIN `1111` для сотрудников и `9999` для проверяющего.

## Backend на сервере

Backend-only процесс уже поднят на `46.101.134.38` в `/opt/bahandi-api` через PM2. Сайт на сервер не заливался.

## Полезные команды

```bash
npm run build
npm run lint
```
