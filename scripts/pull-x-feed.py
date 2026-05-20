#!/usr/bin/env python3
"""Pull @spitmux tweets via xurl, output JSON Feed to stdout."""
import json, subprocess, sys, os

USER = "spitmux"
MAX_POSTS = 20
REPO_DIR = "/tmp/spitmux.dev"  # cloned repo

def run(cmd, timeout=30):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
    if result.returncode != 0:
        print(f"xurl error: {result.stderr}", file=sys.stderr)
        return None
    return result.stdout.strip()

def get_tweets():
    """Get user timeline via xurl."""
    out = run(f"xurl timeline --of {USER} -n {MAX_POSTS}", timeout=45)
    if not out:
        return []
    try:
        data = json.loads(out)
    except json.JSONDecodeError:
        print(f"xurl output not valid JSON: {out[:200]}", file=sys.stderr)
        return []
    
    # xurl returns {"data": [...]} — extract the array
    tweets = data.get("data", data if isinstance(data, list) else [])
    return tweets

def tweet_to_feed_item(t):
    """Convert xurl tweet object to JSON Feed item."""
    text = t.get("text", "")
    tid = t.get("id", "")
    created = t.get("created_at", "")
    
    # Build URL
    author_id = t.get("author_id", "")
    url = f"https://x.com/{USER}/status/{tid}" if tid else ""
    
    return {
        "id": tid,
        "url": url,
        "title": text[:80] + ("…" if len(text) > 80 else ""),
        "content_text": text,
        "date_published": created,
        "tags": ["x", "tweet"],
    }

def main():
    tweets = get_tweets()
    if not tweets:
        print("No tweets returned", file=sys.stderr)
        sys.exit(1)
    
    items = [tweet_to_feed_item(t) for t in tweets[:MAX_POSTS]]
    
    feed = {
        "version": "https://jsonfeed.org/version/1.1",
        "title": f"@{USER} — X Posts",
        "home_page_url": f"https://x.com/{USER}",
        "feed_url": f"https://defthrets.github.io/spitmux.dev/feed.json",
        "items": items,
    }
    
    # Write to repo
    feed_path = os.path.join(REPO_DIR, "feed.json")
    with open(feed_path, "w") as f:
        json.dump(feed, f, indent=2)
    
    print(f"Wrote {len(items)} tweets to {feed_path}")

if __name__ == "__main__":
    main()
