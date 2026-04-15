# Mecenate Feed (Expo + TypeScript)

Тестовое задание: экран ленты публикаций для платформы Mecenate (аналог Patreon/Boosty).

## Что реализовано

- Лента постов: аватар автора, имя, превью, обложка, лайки и комментарии.
- Курсорная пагинация при скролле вниз.
- Pull-to-refresh.
- Для постов `tier: "paid"` показывается заглушка вместо текста.
- Ошибка API: сообщение `Не удалось загрузить публикации` и кнопка `Повторить`.
- Стек состояния: `React Query` + `MobX`.
- Стилизация через дизайн-токены.

## Технологии

- React Native + Expo
- TypeScript
- @tanstack/react-query
- MobX + mobx-react-lite

## Переменные окружения

Создайте файл `.env` на основе `.env.example`.

```bash
cp .env.example .env
```

Поддерживаемые переменные:

- `EXPO_PUBLIC_API_BASE_URL` — базовый URL API (по умолчанию `https://k8s.mectest.ru/test-app/`).
- `EXPO_PUBLIC_API_BEARER_UUID` — токен Bearer UUID для авторизации.

## Запуск проекта

1. Установить зависимости:

```bash
npm install
```

2. Запустить Expo:

```bash
npm run start
```

3. Открыть приложение:

- `a` — Android Emulator
- `i` — iOS Simulator (только macOS)
- `w` — Web
- Expo Go: сканируйте QR-код из терминала/DevTools

## Expo Go

Проект можно запускать через Expo Go (Android/iOS) без дополнительной нативной сборки.

## Полезные команды

- `npm run lint` — проверка ESLint
- `npm run android` — запуск на Android
- `npm run ios` — запуск на iOS
- `npm run web` — запуск в браузере

## API и дизайн

- Swagger: https://k8s.mectest.ru/test-app/openapi.json
- Figma: https://www.figma.com/design/bAxXrk7TaPN13TZ60yf7uD/Test-Assignment?node-id=0-1
