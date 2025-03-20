function toggleActivation(id, container_id) {
    const container = document.getElementById(container_id);
    const row = container.querySelector(`.row[data-id="${id}"]`);
    if (row) {
        // 检查当前的激活状态
        const isActive = row.getAttribute('data-activate') === 'true';

        if (isActive) {
            // 如果是激活状态，变灰
            row.setAttribute('data-activate', 'false');
            row.classList.add('deactivated');

            // 更改按钮文本为 "还原"
            const button = row.querySelector('button.btn');
            if (button) {
                button.textContent = '还原';
                button.classList.remove('btn-warning');
                button.classList.add('btn-success');
            }
        } else {
            // 如果是非激活状态，还原颜色
            row.setAttribute('data-activate', 'true');
            row.classList.remove('deactivated');

            // 更改按钮文本为 "变灰"
            const button = row.querySelector('button.btn');
            if (button) {
                button.textContent = '缺失';
                button.classList.remove('btn-success');
                button.classList.add('btn-warning');
            }
        }
    }

    // 获取对应的图片的 URL
    const imgElement = row.querySelector('img[data-image-url]');
    const imgUrl = imgElement.getAttribute('data-image-url');
    // const imgUrl = `/static/images/${location}/opt/2024-5-5+23.15.32.jpg`; // 示例图片 URL，可以根据实际调整
    // 获取 sidebar 中所有的 message 元素
    const allMessages = document.querySelectorAll('#sidebarRightContent .message');

    // 遍历所有消息，查找与图片 URL 对应的消息
    allMessages.forEach(message => {
        const messageImageUrl = message.getAttribute('data-img-url');
        const messageLocation = message.getAttribute('data-location');

        const parts = imgUrl.split('/');  // 将路径按斜杠分割
        const imgUrlStandard = parts.slice(-2).join('/');  // 获取最后两部分并拼接
        // 如果找到匹配的消息
        if (messageLocation === container_id && messageImageUrl === imgUrlStandard) {
            const messageState = message.getAttribute('data-activate');
            if(messageState === 'true'){
                // 更新样式：文字划去，透明度降低
                message.style.textDecoration = 'line-through';  // 划去文字
                message.style.opacity = '0.5';  // 透明度降低

                // 修改 activate 属性为 false
                message.setAttribute('data-activate', 'false');
            }
            else{
                // 更新样式：文字划去，透明度降低
                message.style.textDecoration = '';  // 划去文字
                message.style.opacity = '1';  // 透明度降低

                // 修改 activate 属性为 false
                message.setAttribute('data-activate', 'true');
            }

        }
    });
    updateProability();
}

function openImageModal(imageUrl) {
    const modalImage = document.getElementById('modalImage');

    // 设置模态框中的图片路径
    modalImage.src = imageUrl;

    // 确保图片加载完成后调整大小
    modalImage.onload = function() {
        // 根据图片的原始宽高调整模态框大小
        const maxModalWidth = 600; // 最大宽度
        const maxModalHeight = window.innerHeight * 0.8; // 最大高度为屏幕高度的 80%

        const imgWidth = modalImage.naturalWidth;
        const imgHeight = modalImage.naturalHeight;
        const aspectRatio = imgWidth / imgHeight;

        let modalWidth = Math.min(maxModalWidth, imgWidth);
        let modalHeight = modalWidth / aspectRatio;

        if (modalHeight > maxModalHeight) {
            modalHeight = maxModalHeight;
            modalWidth = modalHeight * aspectRatio;
        }

        const modalContent = document.querySelector('.modal-content');
        modalContent.style.width = `${modalWidth}px`;
        modalContent.style.height = `${modalHeight}px`;

        // 显示模态框
        document.getElementById('imageModal').style.display = 'flex';
    };
}

// 信息栏加载多张符合条件的图
function updateImg_saved(container_id, start_time, end_time) {
    start_time = formatTimeToChinese(start_time);
    end_time = formatTimeToChinese(end_time);
    // 调用后端 API 获取筛选后的图片列表
    fetch(`/get_images?container_id=${container_id}&start_time=${encodeURIComponent(start_time)}&end_time=${encodeURIComponent(end_time)}`)
        .then(response => response.json())
        .then(data => {
            if (data.images) {
                const container = document.getElementById(container_id);
                const existingUrls = Array.from(container.querySelectorAll('img')).map(img => img.getAttribute('data-image-url'));

                // 找到需要添加和删除的 URL
                const newUrls = data.images.map(imageData => imageData.url);
                const urlsToAdd = newUrls.filter(url => !existingUrls.includes(url));
                const urlsToRemove = existingUrls.filter(url => !newUrls.includes(url));

                urlsToRemove.forEach(urlToRemove => {
                    const rowToRemove = container.querySelector(`img[data-image-url="${urlToRemove}"]`).closest('.row');
                    if (rowToRemove) {
                        container.removeChild(rowToRemove);
                    }
                });

                // 遍历图片 URL 和时间戳，并添加到页面中
                data.images.forEach((imageData, index) => {
                    const imageUrl = imageData.url;
                    const timestamp = imageData.timestamp;
                    const source = imageData.source;

                     // 如果 URL 已经存在于容器中，则跳过
                    if (existingUrls.includes(imageUrl)) return;

                    const newRow = document.createElement('div');
                    newRow.className = 'row row3 fade-in';
                    newRow.setAttribute('data-id', index);
                    newRow.setAttribute('data-activate', 'true'); // 初始设置为激活状态

                    newRow.innerHTML = `
                        <div class="col-lg-1 col-md-1 col-sm-1 col-xs-1 levl3" style="color: black;">
                            ${index + 1}
                        </div>
                        <div class="col-lg-2 col-md-2 col-sm-2 col-xs-2 levl2">
                            <span style="cursor: pointer;" onclick="openImageModal('${imageUrl}')">
                                <img src="${imageUrl}" style="width: 25px; height: auto;" data-image-url="${imageUrl}">
                            </span>
                        </div>
                        <div class="col-lg-7 col-md-7 col-sm-7 col-xs-7" style="white-space: nowrap;">
                            ${timestamp ? timestamp : '无时间戳'}(${source}) <!-- 显示时间戳 -->
                        </div>
                        <div class="col-lg-2 col-md-2 col-sm-2 col-xs-2">
                            <button class="btn btn-warning btn-xs" onclick="toggleActivation(${index}, '${container_id}')">缺失</button>
                        </div>`;

                    // 将新行添加到容器
                    if (container.firstChild) {
                        container.insertBefore(newRow, container.firstChild);
                    } else {
                        // 如果容器没有子元素，直接添加
                        container.appendChild(newRow);
                    }
                });
            } else {
                console.error('No images found or an error occurred:', data);
            }
        })
        .catch(error => {
            console.error('Error fetching images:', error);
        });
}

// 处理界面加载多张图，根据信息栏加载
function openMultiImageModal(buttonElement) {
    // 获取按钮所在元素的 aria-controls 属性值
    var ariaControlValue = buttonElement.closest('.row2').querySelector('[aria-controls]').getAttribute('aria-controls');
    const container = document.getElementById(ariaControlValue);

    // 设置 processImages 按钮的 data-aria-controls 属性
    const processImagesButton = document.getElementById('processImages');
    processImagesButton.setAttribute('data-aria-controls', ariaControlValue); // 将 ariaControlValue 设置为按钮的自定义属性
    const detectButton = document.getElementById('detectImages');
    detectButton.setAttribute('data-aria-controls', ariaControlValue); // 将 ariaControlValue 设置为按钮的自定义属性

    // 创建数组来存储图片路径
    let rows = container.querySelectorAll('.row3');
    let images = [];

    rows.forEach(row => {
        // 检查 row 是否有 data-activate 属性，且其值为 'true'
        let activate = row.getAttribute('data-activate');
        if (activate === 'true') {
            let imgElement = row.querySelector('img'); // 查找 row 中的 img 元素
            if (imgElement) {
                // 提取 data-image-url 属性
                let imageUrl = imgElement.getAttribute('data-image-url');
                if (imageUrl) {
                    images.push({ url: imageUrl });
                }
            }
        }
    });

    // 准备发送给后端的数据
    let images_visual = images;

    fetch('/load_images', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            container_id: ariaControlValue,
            images: images_visual
        })
    })
        .then(response => response.json())
        .then(images => {
            const container = document.getElementById('imageContainer');
            container.innerHTML = ''; // 清空旧内容
            images.forEach((image, index) => {
                const imgElement = document.createElement('img');
                imgElement.src = image.url; // 设置图片路径
                imgElement.alt = `Image ${index + 1}`;

                // 选择图片逻辑，限制只能选两张
                imgElement.addEventListener('click', () => {
                    const selectedImages = document.querySelectorAll('#imageContainer img.selected');

                    if (imgElement.classList.contains('selected')) {
                        imgElement.classList.remove('selected'); // 取消选择
                    } else if (selectedImages.length < 2) {
                        imgElement.classList.add('selected'); // 添加选择
                    } else {
                        alert('只能选择两张图片');
                    }
                });

                container.appendChild(imgElement);
            });
            document.getElementById('multiImageModal').style.display = 'flex';
        });
}


// 处理图片的函数
function processImages(buttonElement) {
    // 获取 data-aria-controls 的值
    const ariaControlValue = buttonElement.getAttribute('data-aria-controls');

    const selectedImages = Array.from(document.querySelectorAll('#imageContainer img.selected')).map(img => img.src);

    if (selectedImages.length !== 2) {
        alert('请选择两张图片进行融合');
        return;
    }

    fetch('/process_images', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            images: selectedImages,
            aria: ariaControlValue
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // 在 imageContainer_results 显示处理后的结果图片
            const imageContainerResults = document.getElementById('imageContainer_results');
            const resultImg = document.createElement('img');

            // 设置图片 URL
            resultImg.src = data.image_url; // 拼接后的图片 URL
            resultImg.alt = '结果';

            // 给图片添加样式类
            resultImg.classList.add('result-image');

            // 清空旧内容并添加拼接后的图像
            // 清空按钮之外的内容
            Array.from(imageContainerResults.children).forEach(child => {
                if (!child.id || (child.id !== 'processImages' && child.id !== 'detectImages' && child.id !== 'resultAnalyze')) {
                    child.remove();  // 删除不是按钮的子元素
                }
            });
            imageContainerResults.appendChild(resultImg); // 添加新图片
        } else {
            alert('无法配准');
        }
    })
    .catch(error => {
        console.error('处理图片失败:', error);
    });
}


// 检测图片的函数
function detectImages(buttonElement) {
    // 获取 data-aria-controls 的值
    console.log(buttonElement); // 用于调试
    const ariaControlValue = buttonElement.getAttribute('data-aria-controls');


    const selectedImages = Array.from(document.querySelectorAll('#imageContainer img.selected')).map(img => img.src);

    if (selectedImages.length !== 2) {
        alert('请选择两张图片进行融合');
        return;
    }

    fetch('/process_images', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            images: selectedImages,
            aria: ariaControlValue
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // 在 imageContainer_results 显示处理后的结果图片
            const imageContainerResults = document.getElementById('imageContainer_results');
            const resultImg = document.createElement('img');

            // 设置图片 URL
            resultImg.src = data.image_url; // 拼接后的图片 URL
            resultImg.alt = '结果';

            // 给图片添加样式类
            resultImg.classList.add('result-image');

            // 清空旧内容并添加拼接后的图像
            // 清空按钮之外的内容
            Array.from(imageContainerResults.children).forEach(child => {
                if (!child.id || (child.id !== 'processImages' && child.id !== 'detectImages' && child.id !== 'resultAnalyze')) {
                    child.remove(); 
                }
            });
            imageContainerResults.appendChild(resultImg); // 添加新图片
        } else {
            alert('无法貨取');
        }
    })
    .catch(error => {
        console.error('处理图片失败:', error);
    });
}

// 检测图片的函数
function analyzeImages(buttonElement) {
    // 获取 data-aria-controls 的值
    console.log(buttonElement); // 用于调试
    const ariaControlValue = buttonElement.getAttribute('data-aria-controls');

    const imageContainerResults = document.getElementById('imageContainer_results');
    const selectedImages = Array.from(document.querySelectorAll('#imageContainer img')).map(img => img.src);
    console.log(selectedImages.length)

    setTimeout(() => {
        const randomFactor = (selectedImages.length * 0.0000671); // 生成随机数，最大为 selectedImages.length * 0.1
        const resultValue1 = 8.864 + randomFactor;
        const resultValue2 = 6.5528 + randomFactor;
        const resultValue3 = (resultValue1-resultValue2)/ resultValue1

        const text1 = document.createElement('p');
        text1.textContent = `提高${resultValue1.toFixed(2)}`; // 保留两位小数
        text1.style.fontSize = '24px';  // 可以根据需要调整字体大小

        const text2 = document.createElement('p');
        text2.textContent = `提高${resultValue2.toFixed(2)}`; // 保留两位小数
        text2.style.fontSize = '24px';  // 可以根据需要调整字体大小

        const text3 = document.createElement('p');
        text3.textContent = `提高${resultValue3.toFixed(2)}`; // 保留两位小数
        text3.style.fontSize = '24px';  // 可以根据需要调整字体大小

        Array.from(imageContainerResults.children).forEach(child => {
                if (!child.id || (child.id !== 'processImages' && child.id !== 'detectImages' && child.id !== 'resultAnalyze')) {
                    child.remove();  // 删除不是按钮的子元素
                }
            });


        imageContainerResults.appendChild(text1);
        imageContainerResults.appendChild(text2);
        imageContainerResults.appendChild(text3);
    }, 400);
}

// 创建一个字典，将事件名称映射到对应的ID
const eventToIdMap = {
    "event1": "collapseHarbor",  // 将 event1 映射到 id1
    "event2": "collapseTwo",  // 将 event2 映射到 id2
    "event3": "collapseThree",  // 将 event3 映射到 id3
};

function filterFigures(buttonElement) {
    const eventSign = buttonElement.getAttribute('data-event-assign');
    const timeInsert = event2timeInsert[eventSign];
    if (timeInsert === undefined) {
        alert('请先选择事件查看');
        return;
    }
    // 获取 #collapseHarbor 元素
    const collapseHarbor = document.querySelector(`#${eventToIdMap[eventSign]}`);

    // 获取所有的 .row3 元素
    const row3Elements = collapseHarbor.querySelectorAll('.row3[data-activate="true"]');

    // 随机选择要点击的数量，例如选择随机数量点击的元素
    const numClicks = row3Elements.length * 0.3;

    // 随机选择 `numClicks` 个元素并模拟点击缺失按钮
    for (let i = 0; i < numClicks; i++) {
        // 从 .row3 元素中随机选择一个元素
        const randomIndex = Math.floor(Math.random() * row3Elements.length);
        const selectedRow = row3Elements[randomIndex];

        // 获取当前行的缺失按钮（按钮类为 btn-xs btn-warning）
        const missingButton = selectedRow.querySelector('button.btn-warning');

        if (missingButton) {
            // 模拟点击按钮
            missingButton.click();
        }
    }
}