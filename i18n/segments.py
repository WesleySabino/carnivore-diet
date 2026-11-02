"""Finds the translatable pieces of an HTML page, keeping exact source offsets.

A "segment" is the inner HTML of the highest element whose content is only
text and inline elements (so a translator sees whole sentences, inline markup
included). Translatable attributes are segments too. Every segment is keyed by
a short hash of its whitespace-normalised Spanish text.
"""
import hashlib
import re
from html.parser import HTMLParser

INLINE = {"a", "abbr", "b", "br", "cite", "code", "em", "i", "mark", "q", "s", "small",
          "span", "strong", "sub", "sup", "time", "u", "wbr", "tspan", "bdi", "dfn"}
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
        "source", "track", "wbr"}
SKIP = {"script", "style"}
TEXT_ATTRS = {"alt", "aria-label", "title", "placeholder", "data-title"}
META_KEYS = {"description", "og:title", "og:description", "og:image:alt", "og:site_name",
             "twitter:title", "twitter:description"}
LETTER = re.compile(r"[A-Za-zÀ-ÿ]")


def key_of(text):
    norm = re.sub(r"\s+", " ", text).strip()
    return hashlib.sha1(norm.encode("utf-8")).hexdigest()[:8]


class Node:
    def __init__(self, tag, attrs, start, open_end, parent):
        self.tag, self.attrs, self.start, self.open_end, self.parent = tag, attrs, start, open_end, parent
        self.close_start = self.end = None
        self.children = []      # Node or ("text", str)
        self.has_text = False   # direct text with letters


class Tree(HTMLParser):
    def __init__(self, src):
        super().__init__(convert_charrefs=False)
        self.src = src
        self.lines = [0]
        for m in re.finditer("\n", src):
            self.lines.append(m.end())
        self.root = Node("#root", [], 0, 0, None)
        self.cur = self.root
        self.feed(src)
        self.close()
        if self.cur is not self.root:
            raise SystemExit(f"Unclosed <{self.cur.tag}> at offset {self.cur.start}")

    def off(self):
        line, col = self.getpos()
        return self.lines[line - 1] + col

    def handle_starttag(self, tag, attrs):
        start = self.off()
        node = Node(tag, attrs, start, start + len(self.get_starttag_text()), self.cur)
        self.cur.children.append(node)
        if tag in VOID:
            node.close_start = node.end = node.open_end
        else:
            self.cur = node

    def handle_startendtag(self, tag, attrs):
        start = self.off()
        node = Node(tag, attrs, start, start + len(self.get_starttag_text()), self.cur)
        node.close_start = node.end = node.open_end
        self.cur.children.append(node)

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if self.cur.tag != tag:
            raise SystemExit(f"Mismatched </{tag}> at offset {self.off()} (open: <{self.cur.tag}>)")
        self.cur.close_start = self.off()
        self.cur.end = self.src.index(">", self.cur.close_start) + 1
        self.cur = self.cur.parent

    def _text(self, data):
        self.cur.children.append(("text", data))
        if self.cur.tag not in SKIP and LETTER.search(data):
            self.cur.has_text = True

    def handle_data(self, data):
        self._text(data)

    def handle_entityref(self, name):
        self._text("&" + name + ";")

    def handle_charref(self, name):
        self._text("&#" + name + ";")


def inline_only(node, memo):
    """True if node's content is only text and inline elements (recursively)."""
    if id(node) in memo:
        return memo[id(node)]
    ok = node.tag not in SKIP
    for ch in node.children:
        if isinstance(ch, tuple):
            continue
        if ch.tag not in INLINE or not inline_only(ch, memo):
            ok = False
            break
    memo[id(node)] = ok
    return ok


def has_letters(node):
    if node.has_text:
        return True
    return any(not isinstance(c, tuple) and has_letters(c) for c in node.children)


def collect(src):
    """Returns a list of edits: (start, end, spanish_text, key, kind)."""
    tree = Tree(src)
    memo, out, stray = {}, [], []

    def walk(node, inside_segment):
        for ch in node.children:
            if isinstance(ch, tuple):
                continue
            # attributes
            attrs = dict(ch.attrs)
            tag_src = src[ch.start:ch.open_end]
            for name, val in ch.attrs:
                if val is None or not LETTER.search(val):
                    continue
                wanted = name in TEXT_ATTRS or (
                    name == "content" and ch.tag == "meta" and
                    (attrs.get("name") in META_KEYS or attrs.get("property") in META_KEYS))
                if wanted:
                    m = re.search(r'\s%s="([^"]*)"' % re.escape(name), tag_src)
                    if not m:
                        raise SystemExit(f"Attribute {name} not double-quoted at {ch.start}")
                    s, e = ch.start + m.start(1), ch.start + m.end(1)
                    out.append((s, e, val, key_of(val), "attr"))
            if ch.tag in SKIP or ch.close_start is None or ch.close_start == ch.open_end:
                continue
            parent_inline = inside_segment
            is_seg = (not inside_segment and inline_only(ch, memo) and has_letters(ch))
            if is_seg:
                text = src[ch.open_end:ch.close_start]
                out.append((ch.open_end, ch.close_start, text, key_of(text), "html"))
            elif ch.has_text and not inside_segment and not inline_only(ch, memo):
                stray.append((ch.tag, ch.start, src[ch.start:ch.start + 120]))
            walk(ch, inside_segment or is_seg)

    walk(tree.root, False)
    out.sort()
    return out, stray


def read_catalog(path):
    """Catalog format: '@@ key' line, then the text until the next '@@' line."""
    cat, key, buf = {}, None, []
    try:
        lines = open(path, encoding="utf-8").read().split("\n")
    except FileNotFoundError:
        return cat
    for line in lines + ["@@ END"]:
        if line.startswith("@@ "):
            if key:
                cat[key] = "\n".join(buf).strip("\n")
            key, buf = line[3:].strip(), []
        elif key is not None:
            buf.append(line)
    cat.pop("END", None)
    return cat
