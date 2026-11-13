import json, subprocess, sys
from playwright.sync_api import sync_playwright
scene = json.load(open("scene.json")); FPS = 30
mode = sys.argv[1]  # "test" or "full"
out = sys.argv[2]
times = [float(x) for x in sys.argv[3:]] if mode == "test" else None
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1280, "height": 720})
    pg.goto("file:///" + __import__("os").path.abspath("overlay.html").lstrip("/")); pg.wait_for_timeout(300)
    pg.evaluate("s=>setScene(s)", scene)
    if mode == "test":
        for t in times:
            pg.evaluate("t=>draw(t)", t); pg.screenshot(path=f"{out}_{t:.1f}.png", omit_background=True)
    else:
        ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-i", "src.mp4", "-f", "image2pipe", "-framerate", str(FPS), "-i", "-",
            "-filter_complex", "[0:v][1:v]overlay=0:0:format=auto,format=yuv420p[v]", "-map", "[v]", "-map", "0:a", "-c:a", "copy",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-r", "30", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
        n = int(scene["duration"] * FPS) + 2
        for i in range(n):
            pg.evaluate("t=>draw(t)", i / FPS)
            ff.stdin.write(pg.screenshot(omit_background=True, type="png"))
        ff.stdin.close(); ff.wait()
    b.close()
