#!/bin/sh
# Renders the proposal PDF. The leader's student ID is injected at render time so it never lands in the public repo:
#   LEADER_NIM=xxxxxxxx ./render.sh
set -e
cd "$(dirname "$0")"
TMP="$PWD/.render.tmp.html"
sed "s/\[Student ID\]/${LEADER_NIM:-[Student ID]}/" proposal.html > "$TMP"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --no-pdf-header-footer \
  --virtual-time-budget=15000 --print-to-pdf="$PWD/ClassPause-Proposal-Semifinal.pdf" "$TMP" 2>/dev/null
rm -f "$TMP"
echo "wrote ClassPause-Proposal-Semifinal.pdf"
