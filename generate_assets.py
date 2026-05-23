#!/usr/bin/env python3
"""
Generates all placeholder game assets (images + audio) for local testing.
Run once from the project root:  python3 generate_assets.py
"""

import os, math, wave, array, random
from PIL import Image, ImageDraw

# ── Folders ──────────────────────────────────────────────────────────────────

os.makedirs('assets/tiles',   exist_ok=True)
os.makedirs('assets/sprites', exist_ok=True)
os.makedirs('assets/audio',   exist_ok=True)

S = 16  # source pixel size — Phaser scales to 48×48 automatically

# ── Colour helpers ────────────────────────────────────────────────────────────

def rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def rgba(h, a=255):
    return (*rgb(h), a)

def darken(h, amount=40):
    r, g, b = rgb(h)
    return (max(0, r-amount), max(0, g-amount), max(0, b-amount), 255)

# ── Image helpers ─────────────────────────────────────────────────────────────

def blank(with_alpha=True):
    mode = 'RGBA' if with_alpha else 'RGB'
    return Image.new(mode, (S, S), (0, 0, 0, 0) if with_alpha else (0, 0, 0))

def solid(color_hex):
    img = blank()
    img.paste(rgba(color_hex), [0, 0, S, S])
    return img

def save(img, path):
    img.save(path)
    print(f'  ✓  {path}')

# ── Tiles ─────────────────────────────────────────────────────────────────────

def make_floor(color_hex, path):
    img = solid(color_hex)
    d = ImageDraw.Draw(img)
    # Subtle 1-px border so tiles don't bleed together when zoomed
    d.rectangle([(0, 0), (S-1, S-1)], outline=darken(color_hex, 20))
    save(img, path)

def make_wall(path):
    img = solid('#455a64')
    d = ImageDraw.Draw(img)
    # Brick mortar lines
    dark = (50, 65, 72, 255)
    d.line([(0, 5), (S, 5)],   fill=dark, width=1)
    d.line([(0, 11), (S, 11)], fill=dark, width=1)
    d.line([(4, 0), (4, 5)],   fill=dark, width=1)
    d.line([(10, 5), (10, 11)],fill=dark, width=1)
    d.line([(6, 11), (6, S)],  fill=dark, width=1)
    save(img, path)

def make_soft_wall(path):
    img = solid('#8d4e1a')
    d = ImageDraw.Draw(img)
    inner = '#a0522d'
    # Wooden crate look — cross planks
    d.rectangle([(1, 1), (S-2, S-2)], fill=rgba(inner))
    d.line([(2, 2), (S-3, S-3)], fill=(70, 25, 5, 255), width=1)
    d.line([(S-3, 2), (2, S-3)], fill=(70, 25, 5, 255), width=1)
    d.rectangle([(1, 1), (S-2, S-2)], outline=(70, 25, 5, 255))
    save(img, path)

# ── Characters ────────────────────────────────────────────────────────────────

def make_player(color_hex, path):
    img = blank()
    d = ImageDraw.Draw(img)
    c = rgba(color_hex)
    outline = darken(color_hex, 50)
    # Body circle
    d.ellipse([(1, 2), (S-2, S-2)], fill=c, outline=outline)
    # Eyes (white + pupil)
    d.ellipse([(3, 5), (6, 8)],  fill=(255, 255, 255, 255))
    d.ellipse([(9, 5), (12, 8)], fill=(255, 255, 255, 255))
    d.ellipse([(4, 6), (6, 8)],  fill=(0, 0, 0, 255))
    d.ellipse([(10, 6), (12, 8)],fill=(0, 0, 0, 255))
    # Smile
    d.arc([(4, 8), (11, 13)], start=10, end=170, fill=(0, 0, 0, 200), width=1)
    save(img, path)

# ── Bomb ─────────────────────────────────────────────────────────────────────

def make_bomb(path):
    img = blank()
    d = ImageDraw.Draw(img)
    # Main sphere
    d.ellipse([(2, 4), (S-2, S-2)], fill=(25, 25, 25, 255), outline=(0, 0, 0, 255))
    # Shine highlight
    d.ellipse([(3, 5), (6, 8)], fill=(80, 80, 80, 180))
    # Fuse (curved line in two segments)
    d.line([(10, 4), (12, 2)], fill=(180, 120, 30, 255), width=1)
    d.line([(12, 2), (13, 1)], fill=(230, 180, 50, 255), width=1)
    # Fuse spark
    d.ellipse([(12, 0), (14, 2)], fill=(255, 220, 0, 255))
    save(img, path)

# ── Explosion ─────────────────────────────────────────────────────────────────

def make_explosion(path):
    img = blank()
    d = ImageDraw.Draw(img)
    hot    = (255, 220, 0,   255)
    orange = (255, 110, 0,   230)
    # Cross arms
    d.rectangle([(6, 0),  (9, S)],  fill=orange)
    d.rectangle([(0, 6),  (S, 9)],  fill=orange)
    # Diagonal rays (shorter)
    d.rectangle([(3, 3),  (5, 5)],  fill=orange)
    d.rectangle([(10, 3), (12, 5)], fill=orange)
    d.rectangle([(3, 10), (5, 12)], fill=orange)
    d.rectangle([(10,10), (12,12)], fill=orange)
    # Bright center
    d.ellipse([(4, 4), (11, 11)], fill=hot)
    save(img, path)

# ── Power-ups ─────────────────────────────────────────────────────────────────

def make_powerup_bomb(path):
    """Yellow circle with a + symbol — means +1 max bomb."""
    img = blank()
    d = ImageDraw.Draw(img)
    d.ellipse([(1, 1), (S-2, S-2)], fill=(255, 235, 59, 255), outline=(180, 160, 0, 255))
    # Plus
    d.rectangle([(7, 4),  (9, 12)], fill=(100, 75, 0, 255))
    d.rectangle([(4, 7),  (12, 9)], fill=(100, 75, 0, 255))
    save(img, path)

def make_powerup_range(path):
    """Purple circle with an arrow — means +1 blast range."""
    img = blank()
    d = ImageDraw.Draw(img)
    d.ellipse([(1, 1), (S-2, S-2)], fill=(171, 71, 188, 255), outline=(110, 20, 130, 255))
    # Arrow →
    d.polygon([(3, 7), (3, 9), (9, 9), (9, 11), (13, 8), (9, 5), (9, 7)],
              fill=(255, 255, 255, 230))
    save(img, path)

# ── Run all image generators ──────────────────────────────────────────────────

print('\n── Tiles ──')
make_floor('#8bc34a', 'assets/tiles/floor.png')
make_floor('#7cb342', 'assets/tiles/floor_alt.png')
make_wall('assets/tiles/wall.png')
make_soft_wall('assets/tiles/soft_wall.png')

print('\n── Sprites ──')
make_player('#2196f3', 'assets/sprites/player_blue.png')
make_player('#e53935', 'assets/sprites/player_red.png')
make_bomb('assets/sprites/bomb.png')
make_explosion('assets/sprites/explosion.png')
make_powerup_bomb('assets/sprites/powerup_bomb.png')
make_powerup_range('assets/sprites/powerup_range.png')

# ── Audio ─────────────────────────────────────────────────────────────────────
# Generates real WAV files using sine waves and noise.
# Nothing fancy — just distinct enough sounds to confirm each event fires.

RATE = 44100

def make_wav(path, samples):
    clamped = array.array('h', [max(-32767, min(32767, int(s))) for s in samples])
    with wave.open(path, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(RATE)
        f.writeframes(clamped.tobytes())
    print(f'  ✓  {path}')

def sine(freq, dur, vol=0.5):
    return [math.sin(2 * math.pi * freq * i / RATE) * 32767 * vol
            for i in range(int(RATE * dur))]

def apply_decay(samples):
    n = len(samples)
    return [s * (1 - i / n) for i, s in enumerate(samples)]

def noise(dur, vol=0.55):
    n = int(RATE * dur)
    return [random.uniform(-1, 1) * 32767 * vol * (1 - i / n) for i in range(n)]

print('\n── Audio ──')

# Bomb place — short mid-pitched thud
make_wav('assets/audio/bomb_place.wav',
         apply_decay(sine(220, 0.12, 0.55)))

# Explosion — noise burst with low rumble underneath
rumble  = apply_decay(sine(80, 0.55, 0.4))
n_burst = noise(0.55, 0.45)
make_wav('assets/audio/explosion.wav',
         [r + n for r, n in zip(rumble, n_burst)])

# Player death — descending four-note drop
death_samples = []
for freq in [523, 415, 349, 262]:
    death_samples += apply_decay(sine(freq, 0.11, 0.45))
make_wav('assets/audio/player_death.wav', death_samples)

# Powerup pickup — bright ascending arpeggio
pickup_samples = []
for freq in [523, 659, 784, 1047]:
    pickup_samples += apply_decay(sine(freq, 0.07, 0.45))
make_wav('assets/audio/powerup_pickup.wav', pickup_samples)

print('\n✅  All assets generated. Run: python3 -m http.server 8000\n')
