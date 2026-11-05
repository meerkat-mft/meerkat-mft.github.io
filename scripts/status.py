#!/usr/bin/env python3
"""Fill the project-status figures on the landing page from the GitHub API.

Usage: status.py SRC DEST [--strict]

Reads SRC, replaces the text of every element marked data-status="..."
with live figures for the mmft repository, and writes DEST. Without
--strict, an API failure leaves the page's fallback text in place and
exits 0, so a GitHub hiccup never blocks a deploy. With --strict, any
failure exits 1; CI uses that to prove the script still works.

Only the standard library is used, so the deploy needs no setup step.
"""

import json
import os
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone

REPO = "meerkat-mft/mmft"
API = "https://api.github.com"


def get(path):
    req = urllib.request.Request(
        API + path,
        headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": "mmft.dev build",
            **({"Authorization": "Bearer " + os.environ["GITHUB_TOKEN"]} if os.environ.get("GITHUB_TOKEN") else {}),
        },
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.load(resp)


def day(iso):
    return datetime.fromisoformat(iso.replace("Z", "+00:00")).strftime("%-d %b %Y")


def fetch():
    releases = get(f"/repos/{REPO}/releases?per_page=1")
    commit = get(f"/repos/{REPO}/commits/main")
    issues = get(f"/search/issues?q=repo:{REPO}+is:issue+is:open&per_page=1")
    release = releases[0] if releases else None
    return {
        "release": release["tag_name"] if release else "None yet",
        "release-url": release["html_url"] if release else f"https://github.com/{REPO}/releases",
        "commit-date": commit["commit"]["committer"]["date"],
        "issues": str(issues["total_count"]),
    }


def fill(html, s):
    now = datetime.now(timezone.utc)
    html, n1 = re.subn(r'(<span data-status="release">)[^<]*(</span>)', rf"\g<1>{s['release']}\g<2>", html)
    html, n2 = re.subn(r'(<a data-status="release-url" href=")[^"]*(")', rf"\g<1>{s['release-url']}\g<2>", html)
    html, n3 = re.subn(
        r'<time data-status="commit-date"[^>]*>[^<]*</time>',
        f'<time data-status="commit-date" datetime="{s["commit-date"]}">{day(s["commit-date"])}</time>',
        html,
    )
    html, n4 = re.subn(r'(<span data-status="issues">)[^<]*(</span>)', rf"\g<1>{s['issues']}\g<2>", html)
    html, n5 = re.subn(
        r'(<p class="note" data-status="updated">)[^<]*(</p>)',
        rf"\g<1>Read from GitHub on {now.strftime('%-d %b %Y')}.\g<2>",
        html,
    )
    if not all((n1, n2, n3, n4, n5)):
        raise RuntimeError("a data-status placeholder is missing from the page")
    return html


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    strict = "--strict" in sys.argv
    if len(args) != 2:
        sys.exit(__doc__)
    src, dest = args
    html = open(src, encoding="utf-8").read()
    try:
        html = fill(html, fetch())
        print("status: figures filled in")
    except (urllib.error.URLError, KeyError, IndexError, RuntimeError, TimeoutError) as e:
        if strict:
            sys.exit(f"status: {e}")
        print(f"status: {e}; keeping the fallback text", file=sys.stderr)
    open(dest, "w", encoding="utf-8").write(html)


if __name__ == "__main__":
    main()
