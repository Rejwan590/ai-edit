import json, re
d = json.load(open("words.json")); W = d["words"]; DUR = d["duration"]
norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
def find(seq, nth=0):
    seq = [norm(s) for s in seq.split()]; hits = []
    for i in range(len(W) - len(seq) + 1):
        if all(norm(W[i + k]["w"]) == seq[k] for k in range(len(seq))): hits.append(i)
    if len(hits) <= nth: raise SystemExit("not found: %s" % seq)
    return hits[nth]
def T(seq, nth=0, end=False):
    i = find(seq, nth); n = len(seq.split())
    return W[i + n - 1]["end"] if end else W[i]["start"]

cards = []
def card(kind, title, sub, start, end, items=None, big=None, bn=None):
    cards.append(dict(kind=kind, title=title, sub=sub, start=start, end=end, items=items or [], big=big, bn=bn))

# --- cards (right wall) ---
card("name", "MD Rejwan Ahmed Riad", "Professional Bengali Teacher", T("My name"), T("six years") - 0.6, bn="আসসালামু আলাইকুম")
card("pill", "Helping people learn languages", "especially with a Bengali background", T("I help"), T("either to talk") - 0.1)
card("stat", "years teaching Bengali", "", T("six years") - 0.5, T("masters", end=True) - 2.2, big="6")
card("pill", "Masters completed", "recently", T("recently completed") - 0.1, T("I help") - 0.3)
card("why", "Learn languages to…", "", T("either to talk"), T("enthusiasm for learning") - 0.2 + 3.3,
     items=[("talk with family", T("family members")), ("talk with friends", T("friends")), ("talk with loved ones", T("loved ones")), ("or just out of curiosity", T("curiosity"))])
card("list", "What we cover", "", T("everyday conversations"), T("I teach everything", end=True) + 0.2,
     items=[("Everyday conversations", T("everyday")), ("Grammar", T("grammar")), ("Speaking", T("speaking")), ("Pronunciation", T("pronunciation")), ("Listening", T("listening")), ("Writing", T("writing"))])
card("pill", "Personalized", "& customized to your needs", T("personalized and"), T("your needs", end=True) + 0.4)
card("pill", "Engaging & friendly", "My teaching method", T("My method"), T("very friendly", end=True) + 0.4)
card("list", "Materials", "", T("The materials"), T("anything that you might need", end=True) + 0.3,
     items=[("PDFs", T("PDFs")), ("Stories with visuals", T("stories")), ("Videos", T("videos")), ("Audios", T("audios"))])
card("pill", "Learn Bengali faster", "and efficiently", T("faster"), T("efficiently", end=True) + 0.5)
card("cta", "Book a trial lesson", "Let's start your Bengali journey", T("Book a trial"), DUR - 0.2, bn="ধন্যবাদ")
# keep cards from overlapping: trim end to next start
cards.sort(key=lambda c: c["start"])
for a, b in zip(cards, cards[1:]):
    if a["end"] > b["start"] - 0.25: a["end"] = b["start"] - 0.25
cards = [c for c in cards if c["end"] - c["start"] > 0.8]

# --- caption chunks ---
vis = [dict(w=x["w"], s=x["start"], e=x["end"], brk=x["brk"]) for x in W if not x["filler"]]
chunks = []; cur = []
for x in vis:
    if cur and (x["s"] - cur[-1]["e"] > 0.45 or len(cur) >= 5): chunks.append(cur); cur = []
    cur.append(x)
    if x["brk"] == ".": chunks.append(cur); cur = []
if cur: chunks.append(cur)
caps = [dict(words=c, start=c[0]["s"], end=c[-1]["e"] + 0.18) for c in chunks]
for a, b in zip(caps, caps[1:]):
    if a["end"] > b["start"]: a["end"] = b["start"]
json.dump(dict(duration=DUR, cards=cards, caps=caps), open("scene.json", "w"), ensure_ascii=False, indent=1)
for c in cards: print(f'{c["start"]:6.2f}-{c["end"]:6.2f} {c["kind"]:5} {c["title"]}')
print(len(caps), "caption chunks")
