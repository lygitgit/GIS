let time1, time2;
let storedLocations = [];

// 设置时间轴的起始和结束时间和时间差
const startTime = new Date('2023-01-01T00:00:00'); // 时间轴的起点时间
const endTime = new Date('2023-12-31T23:59:59');   // 时间轴的终点时间
const totalDuration = endTime - startTime;

const event2timeInsert = {

};

const place2true = {

};

const event2area = {

};

const event2endTimeLimit = {

};

const event2time = {

};

// 自定义设置时间段
function initTimeline(eventSign) {
    const [startTimeText_event, endTimeText_event] = event2time[eventSign];
    document.getElementById('start-time').innerText = startTimeText_event;
    document.getElementById('end-time').innerText = endTimeText_event;
    updateStartTime();
    updateEndTime();
}

// 将位置映射为时间
function positionToTime(position, timelineWidth) {
    const percentage = position / timelineWidth;
    const timeOffset = totalDuration * percentage; // 根据百分比计算时间偏移
    return new Date(startTime.getTime() + timeOffset);
}

function timeToPosition(time, timelineWidth) {
    const timeOffset = time - startTime; // 计算时间与起始时间的差
    const percentage = timeOffset / totalDuration; // 转换为百分比
    return percentage * timelineWidth; // 将百分比转换为对应的像素值
}

function updateColorBar() {
    const left1 = $('#draggable1').position().left;
    const left2 = $('#draggable2').position().left;
    const minLeft = Math.min(left1, left2);
    const maxLeft = Math.max(left1, left2);
    const width = maxLeft - minLeft + 20; // +20 是为了考虑点的宽度

    $('#colorBar').css({
        left: minLeft + 10, // 调整颜色条的起始位置
        width: width - 20   // 调整颜色条的宽度
    });
}


const parseTime = (timeString) => {
    // 使用正则表达式解析日期和时间部分
    const regex = /(\d{4})年(\d{1,2})月(\d{1,2})日\s*(\d{1,2}):(\d{2}):(\d{2})/;
    const match = timeString.match(regex);

    if (match) {
        const [, year, month, day, hour, minute, second] = match;

        // 创建 ISO 格式的字符串
        const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute}:${second}+08:00`;

        return new Date(isoString);
    } else {
        console.error('时间格式不匹配');
        return null; // 如果格式不匹配返回 null
    }
};

const formatTimeToChinese = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 月份从 0 开始，需要 +1
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    const second = date.getSeconds().toString().padStart(2, '0');

    // 构建中文格式的时间字符串
    const chineseFormat = `${year}年${month}月${day}日 ${hour}:${minute}:${second}`;
    return chineseFormat;
};

function updateStartTime() {
    const startTimeText = document.getElementById('start-time').innerText;

    // 将输入的时间转换为 Date 对象
    time1 = parseTime(startTimeText);

    // 将时间转换为位置
    const timelineWidth = $('#timeline').width();
    const newLeft = timeToPosition(time1, timelineWidth)+10;

    // 更新 draggable1 的位置
    $('#draggable1').css('left', newLeft);

    // 更新 colorBar 的位置和宽度
    updateColorBar();

    updateMap_saved();
    storedLocations.forEach(location => {
        updateImg_saved(location, time1, time2);
    });
}


// 用于存储所有待添加的消息
let allMessages = [];

function updateEndTime() {
    const buttonElement = document.getElementById('carryoutEvent');
    const eventSign = buttonElement.getAttribute('data-event-assign');
    const endTimeText = document.getElementById('end-time').innerText; // 获取结束时间文本

    // 将结束时间字符串转换为 Date 对象
    time2 = parseTime(endTimeText); // 解析结束时间

    // 将结束时间转换为位置
    const timelineWidth = $('#timeline').width();
    const newLeft = timeToPosition(time2, timelineWidth) + 10; // 计算对应的时间轴位置

    // 更新 draggable2 元素的位置
    $('#draggable2').css('left', newLeft);

    // 更新 colorBar 的位置和宽度
    updateColorBar(); // 调用函数来更新颜色条

    updateMap_saved();
    storedLocations.forEach(location => {
        updateImg_saved(location, time1, time2);
    });

    if (eventSign !== null) {
        // 每次用之前要清空
        allMessages = [];

        // 获取与 eventSign 对应的地点列表
        const locations = event2area[eventSign];

        // 使用 Promise.all 来等待所有地点的文件处理完
        const filePromises = locations.map(location => fetchMessageFromFile(location, time1, time2));

        // 等待所有文件读取和处理完毕
        Promise.all(filePromises)
            .then(() => {
                // 所有文件处理完毕，按时间排序
                allMessages.sort((a, b) => a.time - b.time);  // 按时间排序

                // 批量添加消息到页面
                addMessagesToSidebar(allMessages);

                updateMarkers(eventSign);
                updateProability();
            })
            .catch(error => {
                console.error('处理文件时出错:', error);
            });

    }
}

$(document).ready(function() {
    let isDragging = false;
    let currentDraggable = null;

    // 格式化时间
    function formatTime(date) {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    }

    // 初始化函数，模拟拖动操作
    function simulateDrag(draggableElement) {
        isDragging = true;
        currentDraggable = $(draggableElement);

        // 获取当前位置
        const initialLeft = currentDraggable.position().left;

        // 模拟一次 mousedown 事件
        currentDraggable.trigger('mousedown');

        // 模拟一次 mousemove 事件，拖动距离为 0
        $(document).trigger($.Event('mousemove', {
            pageX: initialLeft + $('#timeline').offset().left + 10 // +10 是调整中心点
        }));

        // 模拟 mouseup 事件
        $(document).trigger('mouseup');
    }

    $('.draggable').mousedown(function(e) {
        isDragging = true;
        currentDraggable = $(this);
        $('#tooltip').show(); // 显示气泡框
    });

    $(document).mouseup(function() {
        if (isDragging) {
            isDragging = false;
            currentDraggable = null;
            $('#tooltip').css('opacity', 0); // 隐藏气泡框
            // 更新两个全局变量 time1 和 time2
            const left1 = $('#draggable1').position().left;
            const left2 = $('#draggable2').position().left;
            const timelineWidth = $('#timeline').width();
            time1 = positionToTime(left1, timelineWidth);
            time2 = positionToTime(left2, timelineWidth);
            // 使用 toLocaleString 方法格式化日期
            const options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false, // 24小时制
                timeZone: 'Asia/Shanghai' // 设置时区
            };
            const formattedTime1 = time1.toLocaleString('zh-CN', options); // 格式化为中文
            const formattedTime2 = time2.toLocaleString('zh-CN', options); // 格式化为中文
            // 将格式化后的时间赋值给页面元素
            document.getElementById('start-time').innerText = formattedTime1;
            document.getElementById('end-time').innerText = formattedTime2;
            updateMap_saved();
            storedLocations.forEach(location => {
                updateImg_saved(location, time1, time2);
            });
        }
    });

    $(document).mousemove(function(e) {
        if (isDragging && currentDraggable) {
            const timelineOffset = $('#timeline').offset().left;
            const newLeft = e.pageX - timelineOffset - 10; // -10是为了调整中心点
            const timelineWidth = $('#timeline').width();
            if (newLeft >= 0 && newLeft <= (timelineWidth - 20)) {
                currentDraggable.css('left', newLeft);
                // 更新颜色条的位置和宽度
                const left1 = $('#draggable1').position().left;
                const left2 = $('#draggable2').position().left;
                const minLeft = Math.min(left1, left2);
                const maxLeft = Math.max(left1, left2);
                const width = maxLeft - minLeft + 20; // +20是为了考虑点的宽度
                $('#colorBar').css({
                    left: minLeft + 10,
                    width: width - 20
                });
                // 计算当前位置对应的时间
                const time = positionToTime(newLeft-10, timelineWidth);
                const timeString = formatTime(time);
                const draggableLeft = currentDraggable.position().left;
                // 更新 tooltip 的位置
                $('#tooltip').css({
                    left: draggableLeft + 40, // 与 draggable 的水平位置对齐
                    top: $('#colorBar').offset().top - 50, // 使 tooltip 位于 colorBar 之上
                    opacity: 1 // 显示 tooltip
                }).text(timeString);
            }
        }
    });

    // 自动模拟一次拖动操作
    simulateDrag($('#draggable1'));
});

let intervalId = null; // 保存定时器的ID
let isRunning = false; // 标记是否正在运行

function forwardEndTime(buttonElement) {
    const eventSign = buttonElement.getAttribute('data-event-assign');
    const timeInsert = event2timeInsert[eventSign];
    if(timeInsert===undefined){
        alert('请先选择事件查看');
        buttonElement.innerText = '开始'; // 更新按钮为“开始”
        isRunning = false; // 更新状态
        return;
    }
    const timeEndLimit = parseTime(event2endTimeLimit[eventSign]);
    const currentEndTime = time2;
    if (isRunning) {
        // 如果已经在运行，则暂停
        clearInterval(intervalId);
        buttonElement.innerText = '开始'; // 更新按钮为“开始”
    } else {
        // 如果当前没有运行，则开始
        intervalId = setInterval(() => {
            // 每秒钟增加 5 小时
            currentEndTime.setHours(currentEndTime.getHours() + timeInsert);

            // 检查是否超出最大时间范围
            if (currentEndTime > timeEndLimit) {
                clearInterval(intervalId);
                alert('事件发生');
                buttonElement.innerText = '开始'; // 更新按钮为“开始”
                isRunning = false; // 更新状态
                return;
            }

            // 更新时间显示
            document.getElementById('end-time').innerText = formatTimeToChinese(currentEndTime);
            updateEndTime();
        }, 1000); // 每秒增加一次时间
        buttonElement.innerText = '暂停'; // 更新按钮为“暂停”
    }

    isRunning = !isRunning; // 切换运行状态
}

function forwardEndTimeOnce_(buttonElement) {
    const eventSign = buttonElement.getAttribute('data-event-assign');
    const timeInsert = event2timeInsert[eventSign];
    if (timeInsert === undefined) {
        alert('请先选择事件查看');
        buttonElement.innerText = '开始'; // 更新按钮为“开始”
        isRunning = false; // 更新状态
        return;
    }
    const timeEndLimit = parseTime(event2endTimeLimit[eventSign]);
    const currentEndTime = time2;

    currentEndTime.setHours(currentEndTime.getHours() + timeInsert);

    // 检查是否超出最大时间范围
    if (currentEndTime > timeEndLimit) {
        alert('xx事件');
        return;
    }

    // 更新时间显示
    document.getElementById('end-time').innerText = formatTimeToChinese(currentEndTime);
    updateEndTime();
}

function forwardEndTimeOnce(buttonElement) {
    const eventSign = buttonElement.getAttribute('data-event-assign');
    const timeInsert = event2timeInsert[eventSign];

    if (timeInsert === undefined) {
        alert('请先选择事件查看');
        return;
    }

    const currentEndTime = new Date(time2);

    // 假设 allMessages 是一个包含所有地点消息的数组
    let closestMessage = null;
    let closestTimeDifference = Infinity; // 初始时间差设为一个很大的值

    // 每次用之前要清空
    allMessages = [];
    // 获取与 eventSign 对应的地点列表
    const locations = event2area[eventSign];
    currentEndTime.setHours(currentEndTime.getHours() + 480);

    // 使用 Promise.all 来等待所有地点的文件处理完
    const promises = locations.map(location => fetchMessageFromFile(location, time2, currentEndTime));

    // 遍历所有消息，查找时间大于 time2 且最接近 currentEndTime 的消息
    Promise.all(promises).then(() => {
        allMessages.forEach(message => {
            const messageTime = message.time; // 消息的时间戳
            if (messageTime > time2 && messageTime <= currentEndTime) {
                const timeDifference = Math.abs(messageTime - time2);
                if (timeDifference < closestTimeDifference) {
                    closestTimeDifference = timeDifference;
                    closestMessage = message;
                }
            }
        });

        // 如果找到最近的消息
        if (closestMessage) {
            const closestMessageTime = closestMessage.time;
            // 将 currentEndTime 更新为找到的最接近的消息时间
            document.getElementById('end-time').innerText = formatTimeToChinese(closestMessageTime);
            updateEndTime();
        } else {
            alert('xx事件');
        }
    });
}


// 获取所有消息并按时间排序后批量添加到页面
function fetchMessageFromFile(location, timeStart, timeEnd) {
    return new Promise((resolve, reject) => {
        // 构造文件路径
        const filePath = `static/message/${location}.txt`;

        // 假设你已经获取到文件内容，可以直接解析它
        fetch(filePath)
            .then(response => response.text())
            .then(fileContent => {
                // 清理文本中的多余换行符和空行
                const cleanedContent = fileContent.replace(/\n\s*\n/g, '\n\n').trim();

                // 按段落分割消息
                const paragraphs = cleanedContent.split('\n\n');

                // 逐个解析每个段落
                paragraphs.forEach(paragraph => {
                    const lines = paragraph.split('\n');  // 按行分割段落

                    // 处理文件路径和日期
                    const fileName = lines[0].trim();   // 第一行是文件路径
                    const fileParts = fileName.split('/');  // 按 / 分割路径
                    const source = fileParts[0];         // 文件路径的第一部分
                    const dateTime = fileParts[1];       // 文件路径的第二部分

                    // 处理目标信息和消息信息
                    const targetInfo = lines[1].split('：')[1]?.trim();  // 获取目标信息，去掉两侧空格
                    const messageInfo = lines[2].split('：')[1]?.trim(); // 获取消息信息，去掉两侧空格
                    const probability_saved = lines[3].split('：')[1]?.trim(); // 获取消息信息，去掉两侧空格
                    //TODO：加征候的标注（第四行）
                    //TODO：预测概率如果弱相关减没再增加会bug

                    // 解析时间
                    const formattedTime = dateTime
                        .replace(/(\d{4})-(\d{1,2})-(\d{1,2})\+(\d{1,2})\.(\d{2})\.(\d{2})/, "$1年$2月$3日 $4:$5:$6");

                    // 解析时间
                    const messageTime = parseTime(formattedTime);

                    // console.log(messageTime, timeStart, timeEnd);
                    // console.log(messageTime > timeStart && messageTime <= timeEnd);
                    // 检查该消息是否在时间范围内
                    if (messageTime > timeStart && messageTime <= timeEnd) {
                        // 将消息存入数组而不是直接添加
                        allMessages.push({
                            time: messageTime,
                            location: location,
                            formattedTime: formattedTime,
                            targetInfo: targetInfo,
                            messageInfo: messageInfo,
                            imgUrl: fileName,
                            probability: probability_saved,
                        });
                    }
                });

                resolve(); // 处理完毕后，通知 Promise 完成
            })
            .catch(error => {
                reject(error); // 如果出错，返回 reject
            });
    });
}

function scrollToBottom() {
    const container = document.querySelector('.sidebar-right-content');
    container.scrollTop = container.scrollHeight;
}

// 批量添加消息到页面
function addMessagesToSidebar(messages) {
    const sidebarContent = document.getElementById('sidebarRightContent');

    // 获取所有现有的消息
    const existingMessages = sidebarContent.querySelectorAll('.message');

    // 遍历现有消息，检查是否在 messages 中
    existingMessages.forEach(existingMessage => {
        const location = existingMessage.getAttribute('data-location');
        const imgUrl = existingMessage.getAttribute('data-img-url').replace('.jpg', '');  // 去掉后缀
        // 如果该消息不在 messages 中，则删除
        const messageExists = messages.some(message => message.location === location && message.imgUrl === imgUrl);
        if (!messageExists) {
            sidebarContent.removeChild(existingMessage);
        }
    });

    // 遍历 messages，添加缺少的消息
    messages.forEach(message => {
        // 检查是否已经有相同的消息
        const existingMessage = document.querySelector(
            `#sidebarRightContent .message[data-location="${message.location}"][data-img-url="${message.imgUrl}.jpg"]`);

        if (!existingMessage) {
            // 如果没有该消息，创建新消息
            const newMessage = document.createElement('div');
            newMessage.classList.add('message');
            newMessage.classList.add(message.location);  // 根据地点不同为消息指定颜色
            newMessage.setAttribute('data-location', message.location);
            newMessage.setAttribute('data-time', message.time);
            newMessage.setAttribute('data-img-url', message.imgUrl + '.jpg');
            newMessage.setAttribute('data-activate', 'true');
            newMessage.setAttribute('data-probability', message.probability);

            newMessage.innerHTML = `地点：${place2true[message.location]}   时间: ${message.formattedTime}<br/>
                                    目标: ${message.targetInfo}<br/>
                                    信息: ${message.messageInfo}`;

            // 添加消息到 sidebar-right-content
            sidebarContent.appendChild(newMessage);
        }
    });
    scrollToBottom();
}


// 更新 markers 的函数
function updateMarkers(eventSign) {
    // 遍历 markersData，找到与 sidebarContent 中的 message 相匹配的最新信息
    markersData.forEach(function(data) {
        // 获取 marker 对应的地点（location）和 id
        const location = data.id.split('-')[0];  // 'Princesa_1' from 'Princesa_1-marker1'

        // 查找 sidebarContent 中对应地点的 message
        const messagesInArea = document.querySelectorAll(`#sidebarRightContent .message[data-location="${location}"][data-activate="true"]`);
        let latestMessage = null;

        messagesInArea.forEach(message_ => {
            const messageTime = new Date(message_.getAttribute('data-time'));
            if (!latestMessage || messageTime > new Date(latestMessage.getAttribute('data-time'))) {
                latestMessage = message_;
            }
        });

        if (latestMessage) {
            // 获取该地点的最新信息
            const infoText = latestMessage.innerHTML.split('信息:')[1].split('<br>')[0].trim();
            const locationLatest = latestMessage.getAttribute('data-location'); // 获取 data-location
            const imgUrlLatest = latestMessage.getAttribute('data-img-url'); // 获取 data-img-url

            // 拼接完整的图片路径
            const fullImgUrlLatest = `/static/images/${locationLatest}/${imgUrlLatest}`;
            // 获取对应的 popup 元素
            const popupId = `${data.id}-popup`;

            // 更新 marker 弹出框内容
            const popupText = `${place2true[locationLatest]}：${infoText}`;
            updatePopupText(popupId, popupText, fullImgUrlLatest);

        }
    });
}
