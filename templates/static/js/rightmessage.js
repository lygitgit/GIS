

function toggleSidebarRight() {
    var sidebarRight = document.getElementById('sidebar-right');
    sidebarRight.classList.toggle('expanded');

    // 修改按钮图标
    var buttonRight = document.querySelector('.sidebar-right-toggle');
    if (sidebarRight.classList.contains('expanded')) {
        buttonRight.innerHTML = '收起信息';  // 向右箭头
    } else {
        buttonRight.innerHTML = '展开信息';  // 向左箭头
    }
}


