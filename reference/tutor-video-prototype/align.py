import re, json, wave, subprocess, sys
import numpy as np
from scipy.signal import find_peaks

SRC = "src.mp4"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", SRC, "-vn", "-ac", "1", "-ar", "16000", "audio16.wav"], check=True)
w = wave.open("audio16.wav"); sr = w.getframerate()
x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
dur = len(x) / sr

HOP = int(sr * 0.010); WIN = int(sr * 0.025)
n = (len(x) - WIN) // HOP
rms = np.array([np.sqrt(np.mean(x[i * HOP:i * HOP + WIN] ** 2)) for i in range(n)])
db = 20 * np.log10(rms + 1e-6)
t = np.arange(n) * 0.010 + 0.0125
floor = np.percentile(db, 10); level = np.percentile(db, 95)
thr = floor + 0.38 * (level - floor)
print(f"dur {dur:.2f}s floor {floor:.1f}dB level {level:.1f}dB thr {thr:.1f}dB")

# voiced mask with small-gap closing and blip removal
mask = db > thr
def runs(m):
    out = []; i = 0
    while i < len(m):
        if m[i]:
            j = i
            while j < len(m) and m[j]: j += 1
            out.append([i, j]); i = j
        else: i += 1
    return out
r = runs(mask)
merged = []
for a, b in r:
    if merged and (a - merged[-1][1]) * 0.01 < 0.12: merged[-1][1] = b
    else: merged.append([a, b])
V = [(a * 0.01, b * 0.01) for a, b in merged if (b - a) * 0.01 >= 0.07]
print("voiced intervals", len(V), "total voiced", round(sum(b - a for a, b in V), 1))

# smoothed envelope (linear amplitude) for syllable peaks
k = np.hanning(9); k /= k.sum()
env = np.convolve(rms, k, mode="same")

# ---------------- transcript ----------------
BLOCK1 = ("Assalamu alaikum. My name is Rejwan. I'm a professional Bengali teacher. I've been teaching Bengali for last six years now. "
          "I recently completed my masters. I help people learn languages especially people who have a Bengali background or anyone who wants to learn languages "
          "either to talk with their family members, friends, uh loved ones or just for curiosity or their enthusiasm for learning languages. "
          "I uh focus on everyday conversations um grammar, speaking, pronunciation, listening, writing. I teach everything")
BLOCK2 = ("and my lessons are personalized and customized according to your needs. So anyone can learn from me. My method of teaching is really very engaging and very friendly. "
          "The materials I use for teaching are generally in PDFs and also I provide stories with visuals, videos, audios, anything that you might need "
          "and it might help you to learn Bengali faster and efficiently. So thank you. Have a nice day. Book a trial lesson now. I'll see you soon. Thank you.")
OVR = {"assalamu": 4, "alaikum": 4, "rejwan": 2, "bengali": 3, "professional": 4, "recently": 3, "especially": 4, "background": 2, "curiosity": 5,
       "enthusiasm": 4, "everyday": 3, "conversations": 4, "pronunciation": 5, "everything": 3, "personalized": 4, "customized": 3, "according": 3,
       "materials": 4, "generally": 4, "pdfs": 4, "visuals": 3, "videos": 3, "audios": 3, "efficiently": 4, "engaging": 3, "languages": 3, "language": 2,
       "learning": 2, "listening": 3, "writing": 2, "speaking": 2, "completed": 3, "teaching": 2, "teacher": 2, "masters": 2, "years": 1, "lesson": 2,
       "lessons": 2, "anything": 3, "anyone": 3, "family": 3, "members": 2, "either": 2, "loved": 1, "uh": 1, "um": 1, "i'm": 1, "i've": 1, "i'll": 1,
       "trial": 2, "provide": 2, "stories": 2, "method": 2, "really": 2, "very": 2, "faster": 2, "friendly": 2, "grammar": 2, "focus": 2, "people": 2,
       "learn": 1, "help": 1, "name": 1, "thank": 1, "nice": 1, "book": 1, "soon": 1}
def syl(word):
    w_ = re.sub(r"[^a-z']", "", word.lower())
    if w_ in OVR: return OVR[w_]
    w2 = re.sub(r"e$", "", w_) if not w_.endswith("le") else w_
    g = re.findall(r"[aeiouy]+", w2)
    return max(1, len(g))

def tokens(text, block):
    out = []
    for m in re.finditer(r"[A-Za-z0-9'’]+[.,]?", text):
        tok = m.group(0)
        brk = "." if tok.endswith(".") else ("," if tok.endswith(",") else "")
        word = tok.rstrip(".,")
        out.append(dict(w=word, brk=brk, filler=word.lower() in ("uh", "um"), block=block, syl=syl(word)))
    return out

# block split at the long pause nearest 43 s
gaps = [(V[i][1], V[i + 1][0]) for i in range(len(V) - 1)]
cand = [g for g in gaps if g[1] - g[0] > 0.9 and 38 < g[0] < 46]
split = max(cand, key=lambda g: g[1] - g[0]) if cand else (42.0, 43.0)
print("block split gap", split)
regions = [(0.0, split[0]), (split[1], dur)]
words_all = []

for bi, (text, (r0, r1)) in enumerate(zip([BLOCK1, BLOCK2], regions)):
    W_ = tokens(text, bi + 1)
    Vb = [(a, b) for a, b in V if a >= r0 - 0.01 and b <= r1 + 0.01]
    S = sum(wd["syl"] for wd in W_)
    dv = [b - a for a, b in Vb]; Vtot = sum(dv)
    cum = np.concatenate([[0], np.cumsum(dv)])
    Gb = [(Vb[i][1], Vb[i + 1][0], cum[i + 1]) for i in range(len(Vb) - 1) if Vb[i + 1][0] - Vb[i][1] >= 0.18]
    # breaks: cumulative syllable index after word w
    brks = []; ks = 0
    for wd in W_:
        ks += wd["syl"]
        if wd["brk"]: brks.append((ks, 1.0 if wd["brk"] == "." else 0.5))
    brks = [b for b in brks if b[0] < S]
    nb, ng = len(brks), len(Gb)
    INF = 1e9
    dp = np.full((nb + 1, ng + 1), INF); bp = {}
    dp[0, 0] = 0
    for i in range(nb + 1):
        for j in range(ng + 1):
            if dp[i, j] >= INF: continue
            if i < nb and j < ng:   # match
                pred = brks[i][0] / S * Vtot; act = Gb[j][2]
                c = abs(pred - act) - 0.35 * min(Gb[j][1] - Gb[j][0], 1.5) * brks[i][1]
                if dp[i, j] + c < dp[i + 1, j + 1]: dp[i + 1, j + 1] = dp[i, j] + c; bp[(i + 1, j + 1)] = (i, j, "m")
            if i < nb:              # skip break
                c = 1.1 * brks[i][1]
                if dp[i, j] + c < dp[i + 1, j]: dp[i + 1, j] = dp[i, j] + c; bp[(i + 1, j)] = (i, j, "b")
            if j < ng:              # skip gap (hesitation)
                c = 0.15 * min(Gb[j][1] - Gb[j][0], 1.5)
                if dp[i, j] + c < dp[i, j + 1]: dp[i, j + 1] = dp[i, j] + c; bp[(i, j + 1)] = (i, j, "g")
    i, j = nb, ng; matches = []
    while (i, j) != (0, 0):
        pi, pj, op = bp[(i, j)]
        if op == "m": matches.append((brks[pi][0], Gb[pj]))
        i, j = pi, pj
    matches.reverse()
    good = [(kb, g) for kb, g in matches if abs(kb / S * Vtot - g[2]) < 2.0]
    print(f"block {bi + 1}: words {len(W_)} syl {S} voiced {Vtot:.1f}s breaks {nb} gaps {ng} matched {len(matches)} kept {len(good)}")

    # anchors in (syllable index, real-time of start/end around the gap)
    anchors = [(0, None, r0)] + [(kb, g[0], g[1]) for kb, g in good] + [(S, r1, None)]
    # piecewise syllable boundaries
    sy_bounds = np.zeros(S + 1)
    sy_bounds_set = False
    sylt = []  # list of (start,end) per syllable
    for ai in range(len(anchors) - 1):
        ka, _, ta = anchors[ai]; kb_, tb, _ = anchors[ai + 1]
        # real-time range of this segment: voiced start at/after ta, to voiced end at/before tb
        a_t = ta; b_t = tb if tb is not None else r1
        seg_v = [(max(a, a_t), min(b, b_t)) for a, b in Vb if b > a_t and a < b_t]
        seg_v = [(a, b) for a, b in seg_v if b - a > 0.02]
        if not seg_v: continue
        Si = kb_ - ka
        a0 = seg_v[0][0]; b0 = seg_v[-1][1]
        i0, i1 = int(a0 / 0.01), int(b0 / 0.01)
        e = env[i0:i1]; tt = t[i0:i1]
        pk, _ = find_peaks(e, distance=7, prominence=0.12 * np.max(e) if len(e) else 0)
        P = len(pk)
        if P >= 3 and 0.6 <= P / Si <= 1.6:
            val = [a0]
            for m in range(1, P):
                seg = e[pk[m - 1]:pk[m] + 1]; val.append(tt[pk[m - 1] + int(np.argmin(seg))])
            val.append(b0)
            val = np.array(val)
            idx = np.arange(P + 1)
            bt = np.interp(np.arange(Si + 1) * P / Si, idx, val)
            mode = "peaks"
        else:
            # uniform over voiced time inside the segment
            dvs = [b - a for a, b in seg_v]; cs = np.concatenate([[0], np.cumsum(dvs)])
            sp = np.arange(Si + 1) / Si * cs[-1]
            bt = []
            for s_ in sp:
                q = min(np.searchsorted(cs, s_, side="right") - 1, len(seg_v) - 1)
                bt.append(seg_v[q][0] + min(s_ - cs[q], dvs[q]))
            bt = np.array(bt); mode = "uniform"
        print(f"   seg {ai}: syl {Si:>3} peaks {P:>3} {mode:7} {a0:6.2f}-{b0:6.2f}")
        for s_ in range(Si): sylt.append((bt[s_], bt[s_ + 1]))
    # assign syllables to words
    p = 0
    for wd in W_:
        ss = sylt[p:p + wd["syl"]]; p += wd["syl"]
        wd["start"] = float(ss[0][0]); wd["end"] = float(ss[-1][1])
    # snap word edges out of silences
    def in_v(tm): return any(a - 1e-6 <= tm <= b + 1e-6 for a, b in Vb)
    for wd in W_:
        if not in_v(wd["start"]):
            nxt = [a for a, b in Vb if a > wd["start"]]
            if nxt: wd["start"] = min(nxt[0], wd["end"] - 0.05)
        if not in_v(wd["end"]):
            prv = [b for a, b in Vb if b < wd["end"]]
            if prv: wd["end"] = max(prv[-1], wd["start"] + 0.05)
    words_all += W_

# make strictly ordered
for i in range(1, len(words_all)):
    if words_all[i]["start"] < words_all[i - 1]["start"]: words_all[i]["start"] = words_all[i - 1]["start"] + 0.01
    if words_all[i]["end"] <= words_all[i]["start"]: words_all[i]["end"] = words_all[i]["start"] + 0.08

json.dump(dict(duration=dur, voiced=[list(v) for v in V], words=words_all), open("words.json", "w"), indent=1)
print("words", len(words_all), "first", words_all[0]["w"], round(words_all[0]["start"], 2), "last", words_all[-1]["w"], round(words_all[-1]["end"], 2))

# diagnostic plot
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
fig, axs = plt.subplots(4, 1, figsize=(24, 12))
for ai_, ax in enumerate(axs):
    a, b = ai_ * 21, (ai_ + 1) * 21
    m_ = (t >= a) & (t <= b)
    ax.plot(t[m_], db[m_], lw=0.6, color="#555"); ax.axhline(thr, color="r", lw=0.5)
    for wd in words_all:
        if a <= wd["start"] <= b:
            ax.axvline(wd["start"], color="#2f6bff", lw=0.6)
            ax.text(wd["start"], level + 3 - (hash(wd["w"]) % 3) * 6, wd["w"], fontsize=7, rotation=0, color="#d33" if wd["filler"] else "#123")
    ax.set_xlim(a, b)
plt.tight_layout(); plt.savefig("diag.png", dpi=60)
