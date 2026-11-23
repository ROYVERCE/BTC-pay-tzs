# BTC Pay redesign

Files: index, about, faq, contact, terms, privacy, 404 (marketing) and app.html (wallet). Shared code in assets/.

1. Replace the placeholder domain everywhere:  sed -i 's#https://btcpaytz.vercel.app#https://your-real-domain#g' *.html robots.txt sitemap.xml
2. Copy everything (except build.py) into your Next.js `public/` folder. Edit pages by changing build.py and running `python3 build.py`.
3. In next.config.js add so "/" and "/app" resolve:
   async rewrites(){return[{source:"/",destination:"/index.html"},{source:"/app",destination:"/app.html"}]}
   and delete the placeholder app/page.tsx that prints "BTC Pay API...".
4. Backend: /api/payments/quote and /generate now also receive recipientInitial and recipientSurname. Accept and store them (extra fields are otherwise ignored).
