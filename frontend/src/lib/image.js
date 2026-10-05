// Profile photo helpers (used by the Cultural Passport and the standard profile).
// The chosen file is cropped to a square and shrunk to 256 px in a <canvas>,
// so it stays small enough for localStorage.
// Sprint 3: upload the original file to the server instead.

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const AVATAR_SIZE = 256;

// Crop the middle square of the image and shrink it. Returns a JPEG data URL.
export function shrinkImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = AVATAR_SIZE;
      canvas.height = AVATAR_SIZE;
      canvas
        .getContext("2d")
        .drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This file could not be opened as an image."));
    };
    img.src = url;
  });
}

// Checks a chosen file. Returns an error message, or "" when it is fine.
export function checkImageFile(file) {
  if (!file.type.startsWith("image/")) return "Choose an image file (JPG, PNG or WebP).";
  if (file.size > MAX_FILE_BYTES) return "This image is larger than 5 MB. Choose a smaller one.";
  return "";
}
