---
title: project aris - reviving the google glass
description: exploring AR with the google glass
pubDate: 'Jan 09 2026'
heroImage: '/glass-hero.png'
image: '/glass-hero.png'
---

Growing up, owning a pair of Google Glass has always been my dream. When it was initially announced, I couldn't help but dream of how far AR products would develop when I would become an adult. Unfortunately after 13 years, the space has not grown much, and Google Glass still feels as futuristic. In typical Google fashion, it has long been discontinued. The last update decoupled it from the companion app that is no longer available and turned it into a glorified head-mounted camera.

I decided to take matter into my own hand. Introducing **Project Aris**, a project where I attempt to revive Google Glass and turn it into a full-fledged HUD and assistant. The first phase is to recreate Google Now from scratch.

## Building the Companion App

One of the useful features the Glass can provide is a Google-now style feed that gives you contextual information throughout the day. To this end, I built a companion app that is responsible for taking in various factors such as time and location and produce a list of relevant cards, such as current weather, or upcoming event. I call it the Orchestrator.

The Orchestrator pulls in information from various data sources, including my calendar and WeatherKit, then decides when to push updates based on heuristics. While it doesn't need a UI, I built a debug screen that surfaces all its internal workings:

![](/orchestrator-screenshot-main.png)

More importantly, the screen shows me a list of "candidates", the current "winner" i.e. the most relevant information, and now playing information:

![](/orchestrator-candidates.png)

## The HUD

The hard part is done. Now all that is needed is to push the information to the Glass. This is what it looks like:

![](/glass-live-card-demo.jpg)

The Glass subscribes to the feed with the companion app over Bluetooth Low Energy. Since all the heavy computing is done ahead of time, all it needs to do is to parse the JSON and extract information from it and put it on the screen.

The HUD itself is an Android app that runs as a Service. The service publishes `LiveCard` exported from the Glass Development Kit when a feed is pushed. A `RemoteView`, which contains the HUD, is then attached to the card. Voila! The live card will now show up on the Glass.

## What's next?

There are many features that I want to implement. Here is a non-exhaustive list:

- location-aware points-of-interests;
- turn-by-turn navigation;
- llm-powered assistant with vision powered by [moondream](https://moondream.ai/); and
- flight information.

## A moment of appreciation for LLMs.

I did everything above in the span of 2 days thanks to Codex. Without it, it would take me at least a week just to implement the companion app. I am grateful that tools like Codex exist so that I can have more power to do more things. I have never felt this empowered before, and I shall maximally utilize this empowerment to continue doing great things.

---

*This will be the first entry to the dev log of Project Aris. If you are interested, follow along here or on [x dot com](https://x.com/kennethnym) for future updates!*