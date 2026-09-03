from PIL import Image
import io


def compute_image_hash(image_bytes: bytes) -> str:
    """Computes a 64-bit difference hash (dHash): shrink the photo to a
    tiny 9x8 grayscale grid, then for each row compare each pixel to the
    next — 1 if it gets brighter, 0 if darker. Two photos of the same
    object tend to produce hashes differing in only a few bits, because
    the pattern of light-to-dark transitions in a photo is fairly stable
    across different phones, angles, and lighting. Same family of
    algorithm used by real reverse-image-search / duplicate-photo tools.
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("L").resize((9, 8), Image.LANCZOS)
    pixels = list(img.getdata())

    bits = ""
    for row in range(8):
        for col in range(8):
            left = pixels[row * 9 + col]
            right = pixels[row * 9 + col + 1]
            bits += "1" if left < right else "0"

    # Pack the 64-bit string into a 16-char hex string for compact storage.
    return "".join(f"{int(bits[i:i+4], 2):x}" for i in range(0, 64, 4))


def hamming_distance(hex_a: str, hex_b: str) -> int:
    distance = 0
    for a, b in zip(hex_a, hex_b):
        distance += bin(int(a, 16) ^ int(b, 16)).count("1")
    return distance


def image_similarity(hex_a: str, hex_b: str) -> float:
    if not hex_a or not hex_b or len(hex_a) != len(hex_b):
        return 0.0
    return max(0.0, 1 - hamming_distance(hex_a, hex_b) / 64)
