// 创建多个标记及其坐标
var markersData = [
    { id: '1-marker', lat: 10.1730, lng: 113.7533, text: 'xx1' },

    { id: '2-marker', lat: 42.5563, lng: 73.4394, text: 'xx2' },

    { id: '3-marker', lat: 24.7565, lng: 11.3873, text: 'xx3' },

    { id: '4-marker', lat: 16.7297, lng: 226.2437, text: 'xx4' },
    ];

// 存储 marker 和自定义文本框元素
var markers = {};
var popups = {};

// 创建 marker 并初始化文本框
markersData.forEach(function(data) {
    // 创建 marker，包括闪光效果的元素
    var marker = L.marker([data.lat, data.lng], {
        icon: L.divIcon({
            className: '',
            html:`<span style="cursor: pointer;" onclick="openImageModalFrame(this)">
                       <div class="custom-popup" id="${data.id}-popup" data-img_url="">${data.text} </div>
                  </span>
                  <div class="blinking" style="width: 10px; height: 10px; background-color: red; border-radius: 50%;"></div>
                  `,
            // iconSize: [500, 50], // 这里的大小应调整到实际内容的大小
            iconAnchor: [5, 46.25]  // 锚点设置为底部中点，[宽度的一半, 高度]
        })
    }).addTo(map);

    // 通过 _icon 获取 marker 的 DOM 元素，并设置 id
    var iconElement = marker._icon;
    if (iconElement) {
        iconElement.id = data.id;  // 将 id 添加到 marker 图标元素上
    }

    // 将 marker 和文本框的引用存储到对象中，方便后续操作
    markers[data.id] = marker;
    popups[data.id] = document.getElementById(`${data.id}-popup`);
});

// 控制文本框的显示与隐藏（通过透明度）
function togglePopupVisibility(popupId, isVisible) {
    var popup = document.getElementById(popupId);
    if (popup) {
        popup.style.opacity = isVisible ? '1' : '0';
    }
}

// 修改文本框内容
function updatePopupText(popupId, newText, imgUrlLatest) {
    var popup = document.getElementById(popupId);
    if (popup) {
        popup.innerText = newText;
        popup.setAttribute('data-img_url', imgUrlLatest)
    }
}

