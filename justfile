set dotenv-load
set shell := ["bash", "-cu"]

import 'just/service.just'

# Show available recipes
default:
    @just --list
