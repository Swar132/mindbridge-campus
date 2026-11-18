import zlib
import struct
import os

def create_png(width, height, r, g, b, a=255):
    # Generates a valid uncompressed PNG file with gradient using pure python standard library
    # PNG signature
    png = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data)
    png += struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc)
    
    # Raw pixel data (RGBA with scanline filter byte 0)
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0) # filter type none
        for x in range(width):
            # Soft radial / diagonal gradient
            diag = (x + y) / (width + height)
            pr = int(r * (1.0 - diag * 0.2))
            pg = int(g * (1.0 - diag * 0.2))
            pb = int(b * (1.0 - diag * 0.2))
            # Draw a rounded center heart / leaf symbol or solid gradient
            cx, cy = x - width // 2, y - height // 2
            dist = (cx*cx + cy*cy) ** 0.5
            radius = width * 0.45
            if dist > radius:
                # Translucent corner
                raw_data.extend([pr, pg, pb, 0])
            else:
                raw_data.extend([pr, pg, pb, a])
                
    # IDAT chunk
    compressed = zlib.compress(bytes(raw_data), level=6)
    idat_crc = zlib.crc32(b'IDAT' + compressed)
    png += struct.pack('>I', len(compressed)) + b'IDAT' + compressed + struct.pack('>I', idat_crc)
    
    # IEND chunk
    iend_crc = zlib.crc32(b'IEND')
    png += struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc)
    return png

out_dir = r'C:\Users\swarp\.gemini\antigravity\scratch\mindbridge-campus\frontend\public\icons'
os.makedirs(out_dir, exist_ok=True)

# Generate 192x192 and 512x512 icons (Teal/Emerald theme #0D9488: r=13, g=148, b=136)
png_192 = create_png(192, 192, 13, 148, 136)
with open(os.path.join(out_dir, 'icon-192.png'), 'wb') as f:
    f.write(png_192)

png_512 = create_png(512, 512, 13, 148, 136)
with open(os.path.join(out_dir, 'icon-512.png'), 'wb') as f:
    f.write(png_512)

# Copy 192 to apple-touch-icon
with open(os.path.join(r'C:\Users\swarp\.gemini\antigravity\scratch\mindbridge-campus\frontend\public', 'apple-touch-icon.png'), 'wb') as f:
    f.write(png_192)

print('Generated PNG icons successfully!')
