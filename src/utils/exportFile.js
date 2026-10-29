export async function assertExportBlob(blob) {
  if (blob.type && /json|text/.test(blob.type)) {
    const text = await blob.text()
    let message = '导出失败'
    try {
      const error = JSON.parse(text)
      message = (error.header || {}).message || error.message || message
    } catch (error) {
      // 非 JSON 的文本错误也不能保存为 Excel。
    }
    throw new Error(message)
  }
}

export async function downloadBlob(blob, fileName) {
  await assertExportBlob(blob)
  const href = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = href
  link.download = fileName
  document.body.appendChild(link)
  try {
    link.click()
  } finally {
    document.body.removeChild(link)
    window.URL.revokeObjectURL(href)
  }
}

export function exportFileGet(content, name, suffix = 'xlsx') {
  // 添加字节序标识，避免乱码
  // const data = `\uFEFF${content}`;

  const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const downloadElement = document.createElement('a');
  // 创建下载链接
  const href = window.URL.createObjectURL(blob);
  downloadElement.href = href;
  // 下载文件名
  downloadElement.download = `${name}.${suffix}`;
  // name ? downloadElement.download = `${name}.${suffix}` : '';
  document.body.appendChild(downloadElement);
  downloadElement.click();
  // 移除元素
  document.body.removeChild(downloadElement);
  // 释放blob对象
  window.URL.revokeObjectURL(href);
}

export function exportFilePost(name, data) {
  const blob = new Blob([data])
  const fileName = name + '.xlsx'
  if (window.navigator.msSaveOrOpenBlob) {
    navigator.msSaveBlob(blob, fileName);
  } else {
    const link = document.createElement('a');
    const body = document.querySelector('body');
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;
    // fix Firefox
    link.style.display = 'none';
    body.appendChild(link);
    link.click();
    body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
}
