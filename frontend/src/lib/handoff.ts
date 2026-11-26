/** 首页跳转到对话页时，暂存拍照提问的照片（不能放进 URL） */
let pendingImage: File | null = null;

export function setPendingImage(file: File | null) {
  pendingImage = file;
}

export function takePendingImage(): File | null {
  const f = pendingImage;
  pendingImage = null;
  return f;
}
