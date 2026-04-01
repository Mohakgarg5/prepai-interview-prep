#!/bin/bash
set -e
cd "/Users/mohakgarg/Desktop/Interview prep"
export $(grep -v '^#' .env.local | xargs)

BASE="/Users/mohakgarg/Desktop/DRRC Documents/Product Management Course Material "

ingest() {
  local source="$1"
  local file="$2"
  echo ""
  echo ">>> Ingesting: $source"
  NODE_OPTIONS="--max-old-space-size=4096" npx tsx scripts/ingest-content.ts \
    --source "$source" --file "$file" 2>&1 \
    | grep -v "Warning\|SECURITY\|sslmode\|uselibpqcompat\|ssl.html\|node --trace\|next major version\|pg-connection\|To prepare\|If you want\|See https"
}

# === LECTURE SLIDES (primary course content) ===
ingest "pm-module-1"  "${BASE}Module 1 /M1 - Intro to Product Management Class.pptx (1) (1).pdf"
ingest "pm-module-2"  "${BASE}Module 2/M2 - Intro to Product Management Class - Everything MRD _ Customers.pptx (2) (1).pdf"
ingest "pm-module-3"  "${BASE}Module 3/M3- Discovery Lecture.pptx (3) (1).pdf"
ingest "pm-module-4"  "${BASE}Module 4/M4 -Amazon & Apple & Design Lecture.pptx (2) (1).pdf"
ingest "pm-module-5"  "${BASE}Module 5 /M5 - AI & Structure, People, and Process in Product Management (1) (1).pdf"
ingest "pm-module-6"  "${BASE}Module 6/M6 - Intro to Product Management Class - Execution (everything PRD).pptx (2) (1).pdf"
ingest "pm-module-7"  "${BASE}Module 7/M7 - Perfecting the Product.pptx (2) (1).pdf"
ingest "pm-module-8"  "${BASE}Module 8/M8 - Data Planning and Product Platforms ML.pptx (1).pdf"
ingest "pm-module-9"  "${BASE}Module 9/M9 - Intro to Product Management Class - Final Presentation (1) (1).pdf"
ingest "pm-module-10" "${BASE}Module 10 /M10 - Intro to Product Management Class - Final Presentations_ (1).pdf"

# === CLASS HANDOUTS (structured lecture notes) ===
ingest "pm-class-2"  "${BASE}Module 2/Class 2 - Assessing Product Opportunities.pdf"
ingest "pm-class-3"  "${BASE}Module 3/Class 3 - Discovery and Requirements Definition.pdf"
ingest "pm-class-4"  "${BASE}Module 4/Class 4 - Design & Usability.pdf"
ingest "pm-class-5"  "${BASE}Module 5 /Class 5 - AI Changing Product Management,.pdf"
ingest "pm-class-6"  "${BASE}Module 6/Class 6 - Taking Products to Market.pdf"
ingest "pm-class-7"  "${BASE}Module 7/Class 7 - Managing Whole Offers and Partner Ecosystemssignment.pdf"
ingest "pm-class-8"  "${BASE}Module 8/Class 8 - Product Management in Startup Firms & Ongoing Product Management.pdf"
ingest "pm-class-9"  "${BASE}Module 9/Class 9 - Advanced Product Strategies.pdf"

# === KEY READINGS ===
ingest "pm-reading-good-bad-pm"   "${BASE}Module 2/Reading 2 Good Product Manager Bad Product Manager .pdf"
ingest "pm-reading-what-pms-do"   "${BASE}Module 2/Reading What_Do_Product_Managers_Do (1).pdf"
ingest "pm-reading-job-fit-1"     "${BASE}Module 2/Reading 4 Finding the Right Job for Your Product (1).pdf"
ingest "pm-reading-how-to-prd"    "${BASE}Module 3/How to Write a good PRD.pdf"
ingest "pm-reading-mvp"           "${BASE}Module 3/Minimum Viable Product (1).pdf"
ingest "pm-reading-lean-canvas"   "${BASE}Module 4/An Introduction to Lean Canvas – Steve Mullen – Medium.pdf"
ingest "pm-reading-scrum"         "${BASE}Module 5 /The Scrum Primer.pdf"
ingest "pm-reading-platform"      "${BASE}Module 7/The Platform Stack (1).pdf"
ingest "pm-reading-paradox"       "${BASE}Module 8/The Paradox of Scaling.pdf"
ingest "pm-reading-proliferation" "${BASE}Module 8/The Problem with Product Proliferation.pdf"
ingest "pm-reading-guide-future"  "${BASE}Module 9/Guiding_Your_Product_Future.pdf"

echo ""
echo "=== ALL DONE ==="
