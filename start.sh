#!/bin/bash

# Kolory dla lepszej czytelności
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Uruchamianie Food 4 Thought...${NC}\n"

# Funkcja do zabijania procesów na portach
cleanup_ports() {
    echo -e "${YELLOW}🧹 Czyszczenie portów...${NC}"
    lsof -ti:3001 | xargs kill -9 2>/dev/null  # Naprawione - backend działa na 3001
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    sleep 1
}

# Funkcja do sprawdzania czy port jest wolny
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# Czyszczenie portów przy starcie
cleanup_ports

# Trap do czyszczenia przy wyjściu (Ctrl+C)
trap 'cleanup_ports; exit' INT TERM EXIT

# Uruchomienie backendu
echo -e "${GREEN}📡 Uruchamianie serwera backend (port 3001)...${NC}"  # Naprawione
npx nodemon src/server/index.js &
BACKEND_PID=$!

# Czekanie aż backend wystartuje
echo -e "${YELLOW}⏳ Czekanie na start backendu...${NC}"
while ! check_port 3001; do  # Naprawione
    sleep 1
done
echo -e "${GREEN}✅ Backend działa!${NC}\n"

# Uruchomienie frontendu
echo -e "${GREEN}🎨 Uruchamianie aplikacji frontend (port 3000)...${NC}"
npx vite &
FRONTEND_PID=$!

# Czekanie aż frontend wystartuje
echo -e "${YELLOW}⏳ Czekanie na start frontendu...${NC}"
while ! check_port 3000; do
    sleep 1
done

echo -e "\n${GREEN}✅ Aplikacja Food 4 Thought jest gotowa!${NC}"
echo -e "${BLUE}📍 Frontend: http://localhost:3000${NC}"
echo -e "${BLUE}📍 Backend API: http://localhost:3001/api/health${NC}"  # Naprawione
echo -e "\n${YELLOW}💡 Naciśnij Ctrl+C aby zatrzymać oba serwery${NC}\n"

# Czekanie na zakończenie
wait $BACKEND_PID $FRONTEND_PID