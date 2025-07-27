// 测试管理后台访问方式的脚本
// 在浏览器控制台中粘贴此代码来测试各种访问方式

console.log('🔧 管理后台测试脚本');
console.log('');

// 方式1: URL参数访问
console.log('方式1: URL参数访问');
console.log('请在地址栏输入: ' + window.location.origin + '?admin=true');
console.log('');

// 方式2: Hash访问  
console.log('方式2: Hash访问');
console.log('请在地址栏输入: ' + window.location.origin + '#admin-panel');
console.log('');

// 方式3: 控制台命令
console.log('方式3: 控制台命令');
console.log('直接在此控制台输入: __openAdmin()');
console.log('');

// 方式4: 隐藏点击区域
console.log('方式4: 隐藏点击区域');
console.log('点击左上角5x5像素的透明区域');
console.log('');

// 检查__openAdmin是否可用
if (typeof window.__openAdmin === 'function') {
  console.log('✅ __openAdmin() 函数已可用');
} else {
  console.log('❌ __openAdmin() 函数不可用，可能需要刷新页面');
}

console.log('');
console.log('📋 管理后台密码: admin123'); 