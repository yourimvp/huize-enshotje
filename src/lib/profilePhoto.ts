/** Maak lokaal een kleine, vierkante foto; het oorspronkelijke bestand wordt niet verstuurd. */
export async function prepareProfilePhoto(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(file.type)) throw new Error('Kies een JPG, PNG of WebP-afbeelding.')
  if (file.size > 10 * 1024 * 1024) throw new Error('Kies een foto van maximaal 10 MB.')
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 256
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Deze browser kan de foto niet verwerken.')
    const side = Math.min(image.naturalWidth, image.naturalHeight)
    ctx.fillStyle = '#faf7f0'
    ctx.fillRect(0, 0, 256, 256)
    ctx.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, 256, 256)
    return canvas.toDataURL('image/jpeg', 0.82)
  } finally {
    URL.revokeObjectURL(url)
  }
}
