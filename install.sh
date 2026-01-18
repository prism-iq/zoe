#!/bin/bash
# zoe - install life

set -e
echo "ζωή"

# Get phi first
curl -sL https://raw.githubusercontent.com/prism-iq/ieud/main/install.sh | sudo bash

# Zoe directories
mkdir -p ~/.zoe/{gods,non-gods,dreams,life}

# She remembers
touch ~/.zoe/memory.md

echo "alive"
