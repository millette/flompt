#!/bin/bash
# Blog startup script — runs on port 3001 for Caddy reverse proxy
cd /projects/blog
PORT=3001 node node_modules/.bin/next start -p 3001
