#!/usr/bin/env python3
"""
Push all files to GitHub using the API

⚠️ SECURITY: GITHUB_TOKEN 必須從環境變量讀取，絕不寫死明文
   用法：
     export GITHUB_TOKEN=ghp_xxx
     python push-to-github.py
"""
import os
import sys
import base64
import requests
import json
from pathlib import Path

# ⚠️ 從環境變量讀取，絕不寫死明文 token
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
if not GITHUB_TOKEN:
    print('❌ 錯誤：請先設置環境變量 GITHUB_TOKEN')
    print('   export GITHUB_TOKEN=ghp_xxxxxxxxxxxx')
    sys.exit(1)

REPO_OWNER = os.environ.get('GITHUB_REPO_OWNER', 'ronkou')
REPO_NAME = os.environ.get('GITHUB_REPO_NAME', 'weco-cafe')
BRANCH = os.environ.get('GITHUB_BRANCH', 'main')

BASE_URL = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}"

HEADERS = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json",
    "Content-Type": "application/json"
}

def get_file_sha(path):
    """Get the SHA of an existing file"""
    url = f"{BASE_URL}/contents/{path}"
    resp = requests.get(url, headers=HEADERS)
    if resp.status_code == 200:
        return resp.json().get("sha")
    return None

def create_or_update_file(path, content, message, sha=None):
    """Create or update a file in the repository"""
    url = f"{BASE_URL}/contents/{path}"
    data = {
        "message": message,
        "content": base64.b64encode(content.encode('utf-8')).decode('utf-8'),
        "branch": BRANCH
    }
    if sha:
        data["sha"] = sha

    resp = requests.put(url, headers=HEADERS, json=data)
    return resp

def get_all_files(directory, base_path=""):
    """Get all files in a directory recursively"""
    files = []
    skip_dirs = {'.git', 'node_modules', '.workbuddy', '.vercel'}

    for root, dirs, filenames in os.walk(directory):
        # Filter out skip directories
        dirs[:] = [d for d in dirs if d not in skip_dirs]

        for filename in filenames:
            filepath = os.path.join(root, filename)
            rel_path = os.path.join(base_path, os.path.relpath(filepath, directory))

            # Skip .git directory
            if '.git' in rel_path:
                continue

            files.append((rel_path, filepath))

    return files

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))

    # Files to include (root level only, skip some generated files)
    root_files = [
        'index.js',
        'package.json',
        'vercel.json',
        'Dockerfile',
        'README.md'
    ]

    # Directories to include
    include_dirs = ['public', 'coffee-order-app/backend']

    # Also include coffee-order-app/backend for the payment settings
    backend_index = os.path.join(base_dir, 'coffee-order-app', 'backend', 'index.js')

    all_files = []

    # Add root files
    for f in root_files:
        filepath = os.path.join(base_dir, f)
        if os.path.exists(filepath):
            all_files.append((f, filepath))

    # Add directories
    for d in include_dirs:
        dirpath = os.path.join(base_dir, d)
        if os.path.exists(dirpath):
            files = get_all_files(dirpath, d)
            all_files.extend(files)

    print(f"Total files to push: {len(all_files)}")

    # First, create the initial commit if the repo is empty
    url = f"{BASE_URL}/git/refs/heads/{BRANCH}"
    resp = requests.get(url, headers=HEADERS)

    if resp.status_code == 422:  # Branch doesn't exist
        print("Repository is empty, will create initial structure...")

        # Create a README first
        readme_path = os.path.join(base_dir, 'README.md')
        if not os.path.exists(readme_path):
            with open(readme_path, 'w', encoding='utf-8') as f:
                f.write("# WECO CAFE Backend\n\nAPI Backend for WECO CAFE POS System\n")

    # Push files in batches
    success_count = 0
    error_count = 0

    for rel_path, filepath in all_files:
        try:
            # Read file content
            with open(filepath, 'rb') as f:
                # Try UTF-8 first
                try:
                    content = f.read().decode('utf-8')
                except:
                    # Binary file - skip for now
                    print(f"Skipping binary: {rel_path}")
                    continue

            # Get SHA if file exists
            sha = get_file_sha(rel_path)

            # Create or update file
            message = f"Add/update {rel_path}"
            resp = create_or_update_file(rel_path, content, message, sha)

            if resp.status_code in [200, 201]:
                success_count += 1
                if success_count % 10 == 0:
                    print(f"Pushed: {success_count}/{len(all_files)} - {rel_path}")
            else:
                error_count += 1
                print(f"Error pushing {rel_path}: {resp.status_code} - {resp.text[:200]}")

        except Exception as e:
            error_count += 1
            print(f"Exception pushing {rel_path}: {e}")

    print(f"\nDone! Success: {success_count}, Errors: {error_count}")

if __name__ == "__main__":
    main()
