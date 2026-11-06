#!/bin/sh
# Ищет в рабочем дереве и во всей истории Git секреты, .env, телефон и запрещённые слова.
# Запрещённые слова лежат вне репозитория: FORBIDDEN_FILE=путь scripts/check-repo.sh
# Найденный текст не выводится, чтобы отчёт проверки сам ничего не раскрывал.
set -u

failed=0

fail() {
  echo "FAIL: $1"
  failed=1
}

# Каждый коммит истории как текст плюс незакоммиченные отслеживаемые файлы.
haystack=$(mktemp)
trap 'rm -f "$haystack"' EXIT
git log --all -p --no-color --format='%H %an %ae%n%B' > "$haystack"
git grep -I -n '' >> "$haystack" 2>/dev/null

# Служебные файлы .env: разрешён только шаблон .env.example.
env_files=$(git log --all --name-only --format= | sort -u | grep -E '(^|/)\.env($|\.)' | grep -v '^\.env\.example$')
[ -n "$env_files" ] && fail "в истории есть файл .env" || echo "ok: нет файлов .env"

# Телефон РФ в любом написании: с +7 или 8, со скобками, пробелами и дефисами.
if grep -Eq '(\+7|\b8)[ (-]*9[0-9]{2}[ )-]*[0-9]{3}[ -]*[0-9]{2}[ -]*[0-9]{2}\b' "$haystack"; then
  fail "найден номер телефона"
else
  echo "ok: нет номеров телефона"
fi

# Адрес почты в файлах и коммитах. Разрешён только служебный адрес GitHub и адрес соавтора-ассистента.
if grep -Eo '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}' "$haystack" \
  | grep -Ev '@users\.noreply\.github\.com$|^noreply@anthropic\.com$' | grep -q .; then
  fail "найден адрес почты"
else
  echo "ok: нет адресов почты"
fi

# Ключи, токены и адреса баз с паролем. local-dev-only это пароль только для локального Docker.
secret_patterns='-----BEGIN [A-Z ]*PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}'
if grep -Eq -e "$secret_patterns" "$haystack"; then
  fail "найден ключ или токен"
else
  echo "ok: нет ключей и токенов"
fi

db_urls=$(grep -Eo 'postgres(ql)?://[^[:space:]"'"'"']+' "$haystack" | grep -Ev '^postgresql://(USER:PASSWORD@HOST|visitka:local-dev-only@)' | grep -c .)
[ "$db_urls" -gt 0 ] && fail "найден адрес базы с паролем" || echo "ok: нет настоящих адресов баз"

# Запрещённые слова из файла вне репозитория: одно слово или фраза на строку.
if [ -n "${FORBIDDEN_FILE:-}" ]; then
  if [ ! -s "$FORBIDDEN_FILE" ]; then
    fail "файл запрещённых слов пуст или не найден"
  elif grep -Fiq -f "$FORBIDDEN_FILE" "$haystack"; then
    fail "найдено запрещённое слово из FORBIDDEN_FILE"
  else
    echo "ok: нет слов из FORBIDDEN_FILE ($(grep -c . "$FORBIDDEN_FILE") строк)"
  fi
else
  fail "не задан FORBIDDEN_FILE, название заказчика не проверено"
fi

[ "$failed" -eq 0 ] && echo "Проверка пройдена" || echo "Проверка НЕ пройдена"
exit "$failed"
