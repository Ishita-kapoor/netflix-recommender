---
title: Netflix Recommender
emoji: 🎬
colorFrom: red
colorTo: black
sdk: docker
pinned: false
---

# Netflix Recommender API
Hybrid KNN recommendation engine using Sentence-BERT + TF-IDF + Metadata.

## Endpoints
- `GET /recommend?title=Breaking Bad` — get recommendations
- `GET /poster?title=Breaking Bad` — get poster URL  
- `GET /titles` — get all titles