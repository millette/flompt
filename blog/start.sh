#!/bin/bash
# Blog startup script — runs on port 3002 for Caddy reverse proxy
cd /projects/blog
PORT=3002 node node_modules/.bin/next start -p 3002
