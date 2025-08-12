#!/bin/bash

# Kolory
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${RED}🛑 Zatrzymywanie Food 4 Thought...${NC}\n"

# Zabijanie procesów na portach
echo -e "Zatrzymywanie backendu (port 3001)..."
lsof -ti:3001 | xargs kill -9 2>/dev/null

echo -e "Zatrzymywanie frontendu (port 3000)..."
lsof -ti:3000 | xargs kill -9 2>/dev/null

echo -e "\n${GREEN}✅ Wszystkie procesy zostały zatrzymane${NC}"