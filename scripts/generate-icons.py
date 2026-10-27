from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / 'public'
ROOT.mkdir(exist_ok=True)
for size, name in [(512, 'pwa-512x512.png'), (192, 'pwa-192x192.png'), (180, 'apple-touch-icon.png')]:
    image = Image.new('RGB', (size, size), '#365e4d')
    draw = ImageDraw.Draw(image)
    scale = size / 512
    def box(coords):
        return tuple(round(value * scale) for value in coords)
    draw.rounded_rectangle(box((127, 101, 385, 411)), radius=round(61 * scale), fill='#f7f8f3')
    draw.line(box((179, 190, 333, 190)), fill='#9eafa1', width=round(24 * scale))
    draw.line(box((179, 246, 282, 246)), fill='#9eafa1', width=round(24 * scale))
    draw.ellipse(box((227, 250, 377, 400)), fill='#dce9d9')
    draw.line([box((267, 325))[:2], box((292, 350))[:2], box((341, 295))[:2]], fill='#365e4d', width=round(22 * scale), joint='curve')
    image.save(ROOT / name, optimize=True)
