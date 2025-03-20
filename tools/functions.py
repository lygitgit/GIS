import os
import requests
from flask import send_from_directory

# 下载并保存切片
TILE_DIR = 'tiles' # 设置保存切片的本地目录
def download_tile(z, x, y):
    url = f"https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    local_path = os.path.join(TILE_DIR, str(z), str(x), f"{y}.png")
    # 创建目录
    os.makedirs(os.path.dirname(local_path), exist_ok=True)
    # 下载并保存
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36',
        'Referer': 'https://openstreetmap.org/'
    }
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        with open(local_path, 'wb') as f:
            for chunk in response.iter_content(1024):
                f.write(chunk)

        return send_from_directory(os.path.join(TILE_DIR, str(z), str(x)), f"{y}.png")
    else:
        return "Failed to download", 404