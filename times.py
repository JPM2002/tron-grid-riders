import requests
import pandas as pd
import folium
from transformers import pipeline
from geopy.geocoders import Nominatim
import time

# Load HuggingFace sentiment pipeline
classifier = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english", framework="pt")

# Geolocation
geolocator = Nominatim(user_agent="atlasmood")

# Expanded list of known subreddits tied to countries
valid_subreddits = {
    "india": "India", "canada": "Canada", "europe": "Europe", "london": "London",
    "unitedkingdom": "United Kingdom", "australia": "Australia", "newzealand": "New Zealand",
    "germany": "Germany", "france": "France", "usa": "USA", "mexico": "Mexico",
    "philippines": "Philippines", "japan": "Japan", "brasil": "Brazil", "argentina": "Argentina",
    "norge": "Norway", "sweden": "Sweden", "finland": "Finland", "switzerland": "Switzerland",
    "russia": "Russia", "singapore": "Singapore", "nigeria": "Nigeria", "southafrica": "South Africa"
}

def fetch_reddit_posts(keyword, limit=500):
    print(f"🔍 Fetching Reddit posts for keyword: {keyword}")
    url = f"https://api.pushshift.io/reddit/search/submission/?q={keyword}&size={limit}"
    res = requests.get(url)
    return res.json().get("data", [])

def get_verified_location(post):
    subreddit = post.get("subreddit", "").lower()
    if subreddit in valid_subreddits:
        try:
            loc = geolocator.geocode(valid_subreddits[subreddit])
            time.sleep(1)  # Be nice to the geolocation API
            if loc:
                return valid_subreddits[subreddit], loc.latitude, loc.longitude
        except:
            pass
    return None, None, None

def analyze_posts(posts):
    sentiment_data = []
    for post in posts:
        text = post.get('title') or ""
        country, lat, lon = get_verified_location(post)
        if country and lat and lon:
            sentiment = classifier(text[:300])[0]
            sentiment_data.append({
                "location": country,
                "lat": lat,
                "lon": lon,
                "label": sentiment["label"],
                "score": sentiment["score"]
            })
            print(f"✅ {country} — {sentiment['label']} ({text[:60]}...)")
        else:
            print(f"⛔ Skipped (no verified location): {post.get('subreddit')}")
    return pd.DataFrame(sentiment_data)

def plot_sentiment_map(df):
    m = folium.Map(location=[20, 0], zoom_start=2)
    for _, row in df.iterrows():
        color = "green" if row["label"] == "POSITIVE" else "red"
        folium.CircleMarker(
            location=[row["lat"], row["lon"]],
            radius=6,
            color=color,
            fill=True,
            fill_opacity=row["score"],
            popup=f"{row['location']} — {row['label']} ({row['score']:.2f})"
        ).add_to(m)
    m.save("sentiment_map_verified.html")
    print("\n🌍 Map saved: sentiment_map_verified.html")

# === RUN SCRIPT ===
if __name__ == "__main__":
    keyword = "climate"  # try other topics: "protest", "president", "bitcoin", "elections"
    posts = fetch_reddit_posts(keyword)
    df = analyze_posts(posts)
    if not df.empty:
        plot_sentiment_map(df)
    else:
        print("⚠️ No posts with verifiable location found.")
