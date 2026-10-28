"""O'zbekcha ovoz fayllarini yaratadi: src/audio/clips.json -> public/audio/<kalit>.mp3

Ishga tushirish:  pip install edge-tts && python scripts/gen_voice.py
Faqat matni o'zgargan yoki yangi kalitlar qayta yaratiladi.
"""
import asyncio, hashlib, json, os, sys
import edge_tts

VOICE = os.environ.get("VOICE", "uz-UZ-MadinaNeural")
RATE = os.environ.get("RATE", "-8%")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLIPS = os.path.join(ROOT, "src", "audio", "clips.json")
OUT = os.path.join(ROOT, "public", "audio")
INDEX = os.path.join(OUT, "index.json")


def tts_text(key: str, text: str) -> str:
    # Raqamlar alohida aytilganda tabiiyroq eshitilishi uchun bosh harf bilan.
    return text[:1].upper() + text[1:] if key.startswith("n") and key[1:].isdigit() else text


async def make(key: str, text: str, sem: asyncio.Semaphore):
    async with sem:
        for attempt in range(4):
            try:
                await edge_tts.Communicate(tts_text(key, text), VOICE, rate=RATE).save(os.path.join(OUT, f"{key}.mp3"))
                return
            except Exception as e:  # tarmoq xatosi — qayta urinish
                print(f"{key}: {e}", file=sys.stderr)
                await asyncio.sleep(2 ** attempt)
        raise RuntimeError(f"failed: {key}")


async def main():
    os.makedirs(OUT, exist_ok=True)
    clips = json.load(open(CLIPS, encoding="utf-8"))
    index = json.load(open(INDEX)) if os.path.exists(INDEX) else {}
    todo = {}
    for key, text in clips.items():
        h = hashlib.sha1(f"{VOICE}|{RATE}|{text}".encode()).hexdigest()[:10]
        if index.get(key) != h or not os.path.exists(os.path.join(OUT, f"{key}.mp3")):
            todo[key] = (text, h)
    print(f"{len(todo)} ta fayl yaratiladi ({VOICE})")
    sem = asyncio.Semaphore(6)
    await asyncio.gather(*(make(k, t, sem) for k, (t, _) in todo.items()))
    for k, (_, h) in todo.items():
        index[k] = h
    for k in list(index):
        if k not in clips:
            index.pop(k)
            p = os.path.join(OUT, f"{k}.mp3")
            if os.path.exists(p):
                os.remove(p)
    json.dump(dict(sorted(index.items())), open(INDEX, "w"), indent=0)


asyncio.run(main())
