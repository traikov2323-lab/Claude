"""Генерира иконите на приложението (PWA, iOS, favicon) в pwa/icons/."""
import os
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(__file__), 'icons')
os.makedirs(OUT, exist_ok=True)
N = 1024


def gradient(size, top=(47, 140, 255), bottom=(0, 96, 223)):
    g = Image.new('RGB', (1, size))
    for y in range(size):
        t = y / (size - 1)
        g.putpixel((0, y), tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    return g.resize((size, size))


def glyph(draw, scale=1.0, cx=N / 2, cy=N / 2):
    s = N / 34 * scale
    ox, oy = cx - 17 * s, cy - 17 * s
    P = lambda x, y: (ox + x * s, oy + y * s)
    w = int(2.4 * s)
    pts = [P(8, 25), P(8, 14), P(17, 8), P(26, 14), P(26, 25)]
    draw.line(pts, fill='white', width=w, joint='curve')
    for p in (pts[0], pts[-1]):
        draw.ellipse([p[0] - w / 2, p[1] - w / 2, p[0] + w / 2, p[1] + w / 2], fill='white')
    draw.rounded_rectangle([*P(12, 17), *P(16.5, 25)], radius=int(1 * s), fill='white')
    draw.rounded_rectangle([*P(18.5, 17), *P(23, 21)], radius=int(1 * s), fill=(255, 181, 71))


def make(name, size, rounded=True, maskable=False):
    bg = gradient(N)
    img = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    if rounded:
        mask = Image.new('L', (N, N), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, N - 1, N - 1], radius=int(N * 0.225), fill=255)
        img.paste(bg, (0, 0), mask)
    else:
        img.paste(bg, (0, 0))
    glyph(ImageDraw.Draw(img), scale=0.78 if maskable else 1.0)
    img.resize((size, size), Image.LANCZOS).save(os.path.join(OUT, name))


make('icon-192.png', 192)
make('icon-512.png', 512)
make('icon-maskable-512.png', 512, rounded=False, maskable=True)
make('apple-touch-icon.png', 180, rounded=False)
make('favicon-32.png', 32)
print('icons ok')
