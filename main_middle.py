from flask import Flask, request, jsonify, send_file, render_template, send_from_directory, abort
import threading
import time
import math
import numpy as np
import folium
import pandas as pd
import logging
from tools.clock import samples_num, get_time_from_index, time_step, start_datetime
from war_elements.ship_store import StorageShip
from tools.functions import *
from shapely.geometry import Point
import numpy as np
import random
from PIL import Image 
from datetime import datetime
from urllib.parse import quote
import io
import base64

app = Flask(__name__, static_folder='templates/static')
port = 5000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class HTTPStatusFilter(logging.Filter):
    def filter(self, record):
        return "200" not in record.getMessage() and "304" not in record.getMessage()

logging.getLogger('werkzeug').addFilter(HTTPStatusFilter()) 
TILE_DIR = 'tiles'

# 创建可拖动的标记
draggable_marker = folium.Marker(
    location=[37.7749, -122.4194],  # 起始位置
    popup="Drag me!",  # 初始弹出框内容
    draggable=True,  # 设置为可拖动
)

# 初始化虚拟时间
current_time_str = get_time_from_index(0)

# 初始化
def init_fleets(realtime=True):
    tracking_df_list = []

    for i in range(2):
        tracking_df = pd.read_csv(f'storage_vessage/filtered_data_{i}.csv')
        tracking_df_list.append(tracking_df)

    fleets_generate = {
        f"ship_{i}": StorageShip(f"Ship {i}", info)
        for i, info in enumerate(tracking_df_list)
    }
    return fleets_generate


fleets = init_fleets(realtime=False)


@app.route('/get_ships', methods=['GET', 'POST'])
def get_ships():
    data = request.get_json()
    time_start = data.get('time_start')
    time_end = data.get('time_end')
    # 解析 ISO 格式的时间字符串
    time_start_dt = datetime.fromisoformat(time_start.replace("Z", "+00:00"))  # 将 Z 替换为 +00:00
    time_end_dt = datetime.fromisoformat(time_end.replace("Z", "+00:00"))  # 将 Z 替换为 +00:00

    # 转换为字符串
    time_start_str = time_start_dt.strftime('%Y-%m-%d %H:%M:%S')
    time_end_str = time_end_dt.strftime('%Y-%m-%d %H:%M:%S')

    global fleets
    # fleets = init_fleets(realtime=False)
    for ship_storage in fleets.values():
        ship_storage.update_state(time_start=time_start_str, time_end=time_end_str)
        # print(ship_storage.history_record)
    response = jsonify({
            'ships': [
                {'name': ship.name, 'position': ship.position, 'mission': ship.mission,
                 'history': ship.get_history(), 'detected_sign': ship.get_detected_sign(),
                 'orientation': ship.orientation, 'activate': ship.activate_sign}
                for ship in fleets.values() if ship.get_history() != []
            ]
        })
    response.headers['Content-Type'] = 'application/json; charset=utf-8'
    return response


@app.route('/current_time')
def current_time():
    # return jsonify({'current_time': current_time_str})
    response = jsonify({'current_time': current_time_str})
    response.headers['Content-Type'] = 'application/json; charset=utf-8'
    return response


@app.route('/tiles/<int:z>/<int:x>/<int:y>.png')  # 确保URL中的参数为整数
def get_tile(z, x, y):
    # 将 z, x, y 转换为字符串
    tile_path = os.path.join(TILE_DIR, str(z), str(x), f"{y}.png")
    if os.path.exists(tile_path):
        return send_from_directory(os.path.join(TILE_DIR, str(z), str(x)), f"{y}.png")
    else:
        return download_tile(z, x, y)  # 返回 JSON 对象


@app.route('/')
def index():
    return render_template('map_middle.html')


# 定义一个缓存字典来保存文件夹中的图片列表
image_cache = {}


# 加载到信息栏
@app.route('/get_images', methods=['GET'])
def get_images():
    # 从查询参数中获取 container_id, start_time 和 end_time
    container_id = request.args.get('container_id')
    start_time_str = request.args.get('start_time')
    end_time_str = request.args.get('end_time')

    # 定义静态文件夹路径
    folder_path_opt = os.path.join(app.static_folder, 'images', container_id, 'Opt')
    folder_path_sar = os.path.join(app.static_folder, 'images', container_id, 'Sar')

    try:
        # 针对日期格式：2019年07月15日 02:06:13
        start_time = datetime.strptime(start_time_str, "%Y年%m月%d日 %H:%M:%S")
        end_time = datetime.strptime(end_time_str, "%Y年%m月%d日 %H:%M:%S")
    except ValueError:
        return jsonify({"error": "Invalid time format"}), 400

    # 检查是否已经缓存两个文件夹的图片列表
    if container_id not in image_cache:
        try:
            # 获取Opt文件夹中所有图片文件名，并缓存
            opt_images = [
                {'file_name': file_name, 'source': 'Opt'}
                for file_name in os.listdir(folder_path_opt)
                if file_name.lower().endswith(('.png', '.jpg', '.jpeg', '.gif'))
            ]

            # 获取Sar文件夹中所有图片文件名，并缓存
            sar_images = [
                {'file_name': file_name, 'source': 'Sar'}
                for file_name in os.listdir(folder_path_sar)
                if file_name.lower().endswith(('.png', '.jpg', '.jpeg', '.gif'))
            ]

            # 缓存两个文件夹的图片列表
            image_cache[container_id] = opt_images + sar_images
        except FileNotFoundError:
            return jsonify({"error": "Folder not found"}), 404

    # 从缓存的列表中筛选满足时间条件的图片
    filtered_images = []
    for image in image_cache[container_id]:
        file_name = image['file_name']
        source = image['source']
        folder_path = folder_path_opt if source == 'Opt' else folder_path_sar

        # 尝试解析文件名中的时间
        try:
            # 假设文件名格式为：2024-5-5 22.14.37.jpg
            time_str = os.path.splitext(file_name)[0].replace('.', ':')
            image_time = datetime.strptime(time_str, "%Y-%m-%d+%H:%M:%S")
            # 检查是否在指定时间段内
            if start_time <= image_time <= end_time:
                filtered_images.append({'file_name': file_name, 'time': image_time, 'source': source})
        except ValueError:
            # 如果文件名解析失败，则跳过该文件
            continue

    # 按时间排序图片
    filtered_images.sort(key=lambda x: x['time'])

    # 构建图片 URL 列表
    image_urls = []
    timestamps = []
    sources = []
    for image in filtered_images:
        file_name = image['file_name']
        source = image['source']
        folder = 'Opt' if source == 'Opt' else 'Sar'
        image_urls.append(f'/static/images/{container_id}/{folder}/{file_name}')
        timestamps.append(image['time'].strftime("%Y-%m-%d %H:%M:%S"))
        sources.append(source)

    # 返回筛选后的图片列表
    return jsonify({"images": [{"url": url, "timestamp": timestamp, "source": source} for url, timestamp, source in zip(image_urls, timestamps, sources)]})


# 示例图片路径
INITIAL_IMAGES = [
    {"url": "/static/images/1.jpg"},
    {"url": "/static/images/2.jpg"},
    {"url": "/static/images/3.jpg"}
]


@app.route('/load_images', methods=['POST'])
def load_images():
    data = request.get_json()  # 从请求体中获取 JSON 数据

    if not data:
        return jsonify({"error": "No JSON data provided"}), 400

    container_id = data.get('container_id')
    images = data.get('images')

    if images:
        return jsonify(images)

    return jsonify({"error": "No images data provided"}), 400


def generate_new_image(image1, image2):
    # 将 URL 转换为相对文件路径
    image1_path = image1.replace(f'http://127.0.0.1:{port}', '').lstrip('/')
    image2_path = image2.replace(f'http://127.0.0.1:{port}', '').lstrip('/')

    # 拼接成完整的文件路径
    image1_full_path = os.path.join(BASE_DIR, image1_path)
    image2_full_path = os.path.join(BASE_DIR, image2_path)

    # 加载图像并处理（假设你使用 PIL 进行图像处理）
    img1 = Image.open(image1_full_path)
    img2 = Image.open(image2_full_path)

    img = fusing_images(img1, img2)

    # 这里进行图像处理逻辑，例如合并图像、叠加等操作
    # 假设处理后保存新的图像
    new_image_path = os.path.join(BASE_DIR, 'static/images_processed/processed_image.jpg')
    # 示例操作：保存 img 为新的图像
    img.save(new_image_path)

    # 返回新的图像的相对路径（Web 访问路径）
    return '/static/images_processed/processed_image.jpg'


PROCESSED_IMAGES_DIR = './templates/static/images_processed/'  # 存储处理后图像的目录

@app.route('/process_images', methods=['POST'])
def process_images():
    data = request.get_json()
    images = data.get('images', [])
    target_aria = data.get('aria')

    if len(images) != 2:
        return jsonify({"status": "error", "message": "需要选择两张图片进行拼接"})

    image1_path = images[0].replace(f'http://127.0.0.1:{port}', 'templates').lstrip('/')
    image2_path = images[1].replace(f'http://127.0.0.1:{port}', 'templates').lstrip('/')

    # 提取路径中的时间部分
    def extract_time(path):
        # 分割路径，找到日期和时间部分
        parts = path.split('/')
        filename = parts[-1]  # 获取文件名部分
        time_part = filename.split('.')[0]  # 获取去掉扩展名的文件名部分
        return time_part

    # 提取两个路径中的时间
    time1 = extract_time(image1_path)
    time2 = extract_time(image2_path)

    # 判断时间是否相同
    if time1 != time2:
        return jsonify({"status": "false"})

    image1_full_path = os.path.join(BASE_DIR, image1_path)
    image2_full_path = os.path.join(BASE_DIR, image2_path)

    image1 = Image.open(image1_full_path)
    image2 = Image.open(image2_full_path)

    new_image = fusing_images(image1, image2)

    # 根据图片的文件名动态生成拼接后的文件名
    image1_name = os.path.splitext(os.path.basename(images[0]))[0]  # 提取文件名，不包含扩展名
    image2_name = os.path.splitext(os.path.basename(images[1]))[0]  # 提取文件名，不包含扩展名
    new_image_filename = f"{target_aria}/fusion/{image1_name}_{image2_name}.jpg"

    # 保存拼接后的图片
    if not os.path.exists(PROCESSED_IMAGES_DIR):
        os.makedirs(PROCESSED_IMAGES_DIR)  # 如果目录不存在，创建目录
    new_image_path = os.path.join(PROCESSED_IMAGES_DIR, new_image_filename)
    new_image.save(new_image_path)  # 保存为 JPG 文件

    # 返回处理后的图像的 URL
    image_url = f"/static/images_processed/{new_image_filename}"
    return jsonify({"status": "success", "image_url": image_url})

if __name__ == '__main__':
    app.run(port=port)
