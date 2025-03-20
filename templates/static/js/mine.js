const shipIdToName = {
    ship0: '海警船',
    ship1: '军舰',
};

// 创建地图并设置初始视图
var map = L.map('map').setView([31.6534, 150.6250], 3);
// 使用 OpenStreetMap 的海洋背景图
L.tileLayer(
    "../tiles/{z}/{x}/{y}.png",
).addTo(map);
// L.tileLayer(
//     "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
//     {"attribution": "© OpenStreetMap contributors"}).addTo(map);


// 点击按钮后跳转到指定位置
function initEvent(buttonElement) {
    // 获取按钮的 event-assign 属性值
    const eventSign = buttonElement.getAttribute('data-event-assign');

    // 获取 carryoutEvent 按钮并设置其 data-event-assign 属性
    const carryoutButton = document.getElementById('carryoutEvent');
    carryoutButton.setAttribute('data-event-assign', eventSign);
    const carryoutButtonOnce = document.getElementById('carryoutEventOnce');
    carryoutButtonOnce.setAttribute('data-event-assign', eventSign);
    const filterInfoButton = document.getElementById('filterInfo');
    filterInfoButton.setAttribute('data-event-assign', eventSign);


    // 从 event2pos 获取对应的经纬度和当前缩放级别
    const [lat, lng, currentZoom] = event2pos[eventSign];

    // 调用初始化时间轴的函数
    initTimeline(eventSign);
    jumpToLocation(lat, lng, currentZoom)
    const sidebarContent = document.getElementById('sidebarRightContent');
    sidebarContent.innerHTML = '';  // 清空所有内容

    markersData.forEach(function(data) {// 获取 marker 对应的地点（location）和 id
        const location = data.id.split('-')[0];
        const eventMarker = location.split('_')[1];
        if(`event${eventMarker}` === eventSign){
            togglePopupVisibility(data.id, true)
        }
        else{
            togglePopupVisibility(data.id, false)
        }
    });

    updateProabilityFixed(event2prob[eventSign]);
    // 获取 probability-frame 元素并显示
    const probabilityFrame = document.querySelector('.probability-frame');
    probabilityFrame.style.display = 'block'; // 或者 'inline-block'，根据需要调整
}

function jumpToLocation(lat, lng, currentZoom) {
    if (currentZoom === undefined) { // 如果未传递currentZoom参数
        currentZoom = map.getZoom(); // 使用默认值
    }
    map.setView([lat, lng], currentZoom, {
        animate: true, // 启用动画
    });
}

// 船只标记、历史轨迹标记和轨迹线
var shipMarkers = {};
var shipRotates = {};
var historyMarkers = {};
var historyLines = {};
var shipLayers = {};
var isUpdating = false;
var currentZoomLevel = map.getZoom();
var shipIcon;
// 上一次的船只 ID 列表
var currentShipIds = []; // 当前船只 ID 列表
var shipList = document.getElementById('ship-list'); // 假设 ship-list 是显示船只的元素的 ID
// 创建船只图标

if (currentZoomLevel < 10) {
    // 设置缩小的图标
    shipIcon = L.icon({
        iconUrl: shipIconUrlSmall,
        iconSize: [30, 21], // 缩小图标的尺寸
        iconAnchor: [15, 10.5],
        popupAnchor: [1, -20],
    });
} else {
    // 设置正常的图标
    shipIcon = L.icon({
        iconUrl: shipIconUrlLarge,
        iconSize: [45, 30], // 恢复原图标的尺寸
        iconAnchor: [12.5, 15],
        popupAnchor: [1, -34],
    });
}

// 监听地图缩放事件
map.on('zoomend', function() {
    var currentZoom = map.getZoom();
    for (const shipName in shipMarkers) {
        const marker = shipMarkers[shipName]; // 获取当前船只的标记
        if (currentZoom < 10) {
            // 设置缩小的图标
            shipIcon = L.icon({
                iconUrl:  shipIconUrlSmall,
                iconSize: [30, 21], // 缩小图标的尺寸
                iconAnchor: [15, 10.5],
                popupAnchor: [1, -20],
            });
        } else {
            // 设置正常的图标
            shipIcon = L.icon({
                iconUrl: shipIconUrlLarge,
                iconSize: [45, 30], // 恢复原图标的尺寸
                iconAnchor: [12.5, 15],
                popupAnchor: [1, -34],
            });
        }
        // 更新当前标记的图标
        marker.setIcon(shipIcon);
        // 再次设置旋转，确保图标被更新后还保持旋转
        // shipMarkers[shipName].setRotationAngle(shipRotates[shipName]);
    }
});
// 清理标记
function clearMap() {
    for (const shipName in shipMarkers) {
        if (shipLayers[shipName]) {
            map.removeLayer(shipLayers[shipName]); // 移除整个图层组
            delete shipLayers[shipName]; // 删除图层组的引用
            delete shipMarkers[shipName]; // 删除标记的引用
            // delete historyMarkers[shipName]; // 删除历史标记的引用
            delete historyLines[shipName]; // 删除轨迹线的引用
        }
    }
}

// 船只轨迹显示/隐藏交互代码
function customFunction(shipId, button) {
    // 获取另一个按钮
    const showButton = document.getElementById(`hide-${shipId}`); // 替换为实际的 ID
    if (button.innerText === "高亮" && showButton.innerText === "隐藏") {
        // 遍历 shipLayers[shipId] 中的所有标记
        shipLayers[shipId].eachLayer(function (layer) {
            if (layer instanceof L.CircleMarker) {
                // 更新颜色和大小
                layer.setStyle({
                    color: 'yellow', // 设置新颜色
                    radius: 3, // 设置新半径
                });
            }
        });
        // 恢复轨迹线的原始颜色
        if (historyLines[shipId]) {
            historyLines[shipId].setStyle({ color: 'red' }); // 改变轨迹线颜色
        }
        // 更新按钮的颜色和文字
        button.style.backgroundColor = 'gray'; // 设置按钮的新背景颜色
        button.innerText = '普通'; // 更新按钮文字
    } else if (button.innerText === "普通" && showButton.innerText === "隐藏") {
        // 恢复标记的原始样式
        shipLayers[shipId].eachLayer(function (layer) {
            if (layer instanceof L.CircleMarker) {
                layer.setStyle({
                    color: 'red', // 恢复原颜色
                    radius: 2, // 恢复原半径
                });
            }
        });
        // 恢复轨迹线的原始颜色
        if (historyLines[shipId]) {
            historyLines[shipId].setStyle({ color: 'gray' }); // 恢复轨迹线颜色
        }
        // 恢复按钮的颜色和文字
        button.style.backgroundColor = ''; // 恢复按钮原背景颜色
        button.innerText = '高亮'; // 更新按钮文字
    }
    if (button.innerText === "隐藏") {
        // 隐藏该船的所有标记
        shipLayers[shipId].eachLayer(function (layer) {
            if (layer instanceof L.CircleMarker) {
                layer.setStyle({
                    opacity: 0, // 设置透明度为0以隐藏
                    color: 'rgba(0, 0, 0, 0)', // 设置颜色为透明
                    radius: 0 // 设置半径为0
                });
            }
        });
        // 隐藏船只标记
        if (shipMarkers[shipId]) {
            shipMarkers[shipId].setOpacity(0); // 隐藏船只标记
        }
        // 隐藏轨迹
        if (historyLines[shipId]) {
            historyLines[shipId].setStyle({ opacity: 0 }); // 隐藏轨迹线
        }
        // 更新按钮的颜色和文字
        button.style.backgroundColor = 'gray'; // 设置按钮的新背景颜色
        button.innerText = '显示'; // 更新按钮文字
    } else if (button.innerText === "显示") {
        // 显示该船的所有标记
        shipLayers[shipId].eachLayer(function (layer) {
            if (layer instanceof L.CircleMarker) {
                layer.setStyle({
                    opacity: 1, // 恢复透明度
                    color: 'red', // 恢复颜色
                    radius: 2 // 恢复半径
                });
            }
        });
        // 显示船只标记
        if (shipMarkers[shipId]) {
            shipMarkers[shipId].setOpacity(1); // 显示船只标记
        }
        // 显示轨迹
        if (historyLines[shipId]) {
            historyLines[shipId].setStyle({ opacity: 1 }); // 显示轨迹线
        }
        // 更新按钮的颜色和文字
        button.style.backgroundColor = ''; // 设置按钮的新背景颜色
        button.innerText = '隐藏'; // 更新按钮文字
    }
    // clearMap();
    // updateMap_saved()
}

// 更新地图的函数
function updateMap_saved() {
    if (isUpdating) return; // 如果正在更新，则直接返回
    isUpdating = true; // 设置为正在更新
    fetch('/get_ships', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ time_start: time1, time_end: time2})
    })
        .then(response => response.json())
        .then(data => {
            // 清除地图上的标记和线条
            clearMap();
            data.ships.forEach(ship => {
                var position = ship.position;
                var activate = ship.activate;
                // 创建一个图层组来包含船的标记、历史标记和轨迹线
                var shipLayerGroup = L.layerGroup().addTo(map);
                // 添加新船只
                const shipId = ship.name;
                if (!currentShipIds.includes(shipId)) {
                    // 创建新的行元素
                    const shipRow = document.createElement('div');
                    shipRow.className = 'row';
                    shipRow.id = `ship-${shipId}`; // 设置ID方便后续移除

                    // 填充行内容
                    const shipIdOld = shipId.toLowerCase().replace(' ', ''); // 'ship0' 或 'ship1'
                    // 获取对应的船只名称
                    const shipNameNew = shipIdToName[shipIdOld] || shipId; // 默认使用原 ship.name

                    shipRow.innerHTML = `
                           <div class="col-lg-1 col-md-1 col-sm-1 col-xs-1 levl3">${shipId.split(" ")[1]}</div>
                           <div class="col-lg-4 col-md-4 col-sm-4 col-xs-4 levl3"><span></span><span>${shipNameNew}</span></div>
                           <div class="col-lg-5 col-md-5 col-sm-5 col-xs-5">xxxxx</div>
                           <div class="col-lg-2 col-md-2 col-sm-2 col-xs-2" style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; margin-left: -30px;">
                               <span id="highlight-${shipId}" class="btn btn-success btn-xs" style="cursor: pointer;" onclick="customFunction('${shipId}', this)">高亮</span>
                               <span id="hide-${shipId}" class="btn btn-danger btn-xs" style="cursor: pointer;" onclick="customFunction('${shipId}', this)">隐藏</span>
                           </div>
                       `;
                    // 将新行添加到船只列表中
                    document.getElementById('ship-list').appendChild(shipRow);
                    currentShipIds.push(shipId); // 更新当前船只ID
                }
                // 创建标记并设置旋转角度
                shipRotates[ship.name] = ship.orientation;
                shipMarkers[ship.name] = L.marker(position, {
                    icon: shipIcon,
                }).addTo(shipLayerGroup);
                // 绑定弹出框，点击时显示船名
                console.log(ship.name);
                const shipIdOld = ship.name.toLowerCase().replace(' ', ''); // 'ship0' 或 'ship1'
                // 获取对应的名字
                const shipNameNew = shipIdToName[shipIdOld] || ship.name; // 如果没有对应的名字，默认使用原名字
                shipMarkers[ship.name].bindPopup(`${shipNameNew}<br>${ship.mission}`);
                // historyMarkers[ship.name] = [];
                historyLines[ship.name] = L.polyline([], { color: 'gray', weight: 2, opacity: 0.7 }).addTo(shipLayerGroup);
                shipLayers[ship.name] = shipLayerGroup; // 保存图层组
                // 更新历史轨迹
                let previousPosition = null;
                ship.history.forEach((hist, index) => {
                    var histPosition = hist[0];
                    var histTime = hist[1];
                    if (index > 0) {
                        if (ship.detected_sign[index] === 1) {
                            var marker = L.circleMarker(histPosition, {
                                color: 'red',
                                radius: 2,
                                fillOpacity: 0.5,
                                weight: 0 // 去掉边框
                            }).bindPopup('Time: ' + histTime).addTo(shipLayers[ship.name]);
                            // historyMarkers[ship.name].push(marker);
                        }
                        if (previousPosition) {
                            var segment = [previousPosition, histPosition];
                            historyLines[ship.name].addLatLng(segment[1]);
                        }
                    }
                    previousPosition = histPosition;
                });
                // 与当前位置连线
                var segment = [ship.history[ship.history.length - 1][0], position];
                historyLines[ship.name].addLatLng(segment[1]);
            });
            // 创建一个新数组，存储当前存在的船只ID
            const existingShipIds = [];
            // 检查 currentShipIds 中的船只是否不在 data.ships 中
            currentShipIds.forEach(shipId => {
                if (!data.ships.some(ship => ship.name === shipId)) {
                    // 如果 currentShipIds 中的船只不在 data.ships 中，则移除
                    const shipItem = document.getElementById(`ship-${shipId}`);
                    if (shipItem) {
                        shipList.removeChild(shipItem); // 移除元素
                    }
                } else {
                    // 如果存在，则添加到新数组中
                    existingShipIds.push(shipId);
                }
            });
            // 更新 currentShipIds 为只包含存在的船只ID
            currentShipIds = existingShipIds;
        })
        .catch(error => console.error('Error fetching ships:', error)) // 错误处理
        .finally(() => {
            isUpdating = false; // 更新完成后重置标志
        });
}

// // 创建可拖动的标记
// var marker = L.marker([12.75, 110.85], { draggable: true }).addTo(map);
// function updatePopup() {
//     var position = marker.getLatLng();
//     marker.bindPopup("Coordinates: " + position.lat.toFixed(4) + ", " + position.lng.toFixed(4)).openPopup();
// }
// marker.on('dragend', function() {
//     updatePopup();
// });
// updatePopup();
// 创建多个标记及其坐标


