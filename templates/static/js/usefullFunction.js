function openImageModalFrame(frameElement) {
    const divElement = frameElement.querySelector('.custom-popup');
    const imageUrl = divElement.getAttribute('data-img_url');
    const modalImage = document.getElementById('modalImage');
    const modalContent = document.querySelector('.modal-content');
    const updatedImageUrl = imageUrl.replace('images', 'images_processed_new');
    // 设置模态框中的图片路径
    modalImage.src = updatedImageUrl;

    // 确保图片加载完成后调整大小
    modalImage.onload = function() {
        const maxModalWidth = 600;
        const maxModalHeight = window.innerHeight * 0.8;

        const imgWidth = modalImage.naturalWidth;
        const imgHeight = modalImage.naturalHeight;
        const aspectRatio = imgWidth / imgHeight;

        let modalWidth = Math.min(maxModalWidth, imgWidth);
        let modalHeight = modalWidth / aspectRatio;

        if (modalHeight > maxModalHeight) {
            modalHeight = maxModalHeight;
            modalWidth = modalHeight * aspectRatio;
        }

        modalContent.style.width = `${modalWidth}px`;
        modalContent.style.height = `${modalHeight}px`;

        // 显示模态框
        document.getElementById('imageModal').style.display = 'flex';

        // 初始化 Zooming.js
        initZooming();
    };
}

// 初始化 Zooming.js
function initZooming() {
    const zooming = new Zooming({
        zoomSpeed: 0.3,        // 缩放速度
        background: 'rgba(0, 0, 0, 0.8)', // 背景色
        wheelZoom: true,       // 启用鼠标滚轮缩放
        clickZoom: true        // 启用点击缩放
    });

    // 监听模态框内的图片
    zooming.listen('.modal-content img');
}

// 防止滚轮事件冒泡
document.querySelector('.modal-content').addEventListener('wheel', function(event) {
    event.stopPropagation();  // 阻止事件冒泡，防止触发背景地图的滚轮缩放
});
