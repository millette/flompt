#!/bin/bash
SUPERVISORD=/home/botuser/.cache/pypoetry/virtualenvs/claude-code-telegram-9TtSrW0h-py3.11/bin/supervisord
SUPERVISORCTL=/home/botuser/.cache/pypoetry/virtualenvs/claude-code-telegram-9TtSrW0h-py3.11/bin/supervisorctl
CONF=/projects/flompt/supervisord.conf
LOG=/tmp/flompt-watchdog.log

log() { echo "[$(date '+%H:%M:%S')] $1" >> $LOG; }

# Si supervisor répond déjà → rien à faire
if $SUPERVISORCTL -c $CONF status > /dev/null 2>&1; then
  exit 0
fi

log "supervisor down, démarrage en cours..."

# Libérer le port 8000 si un ancien uvicorn l'occupe
inode=$(awk '/00001F40/{print $10}' /proc/net/tcp 2>/dev/null | head -1)
if [ -n "$inode" ]; then
  for pid in $(ls /proc/ 2>/dev/null | grep -E '^[0-9]+$'); do
    if ls -la /proc/$pid/fd 2>/dev/null | grep -q "socket:\[$inode\]"; then
      log "kill uvicorn zombie PID $pid"
      kill $pid 2>/dev/null || true
    fi
  done
  sleep 1
fi

# Lancer supervisord
$SUPERVISORD -c $CONF >> $LOG 2>&1
log "supervisord démarré"
