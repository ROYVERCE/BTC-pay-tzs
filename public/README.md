# BTC Pay site (v2)

Copy everything except build.py and README.md into your Next.js `public/` folder.
DELETE the old public/faq.html (replaced by help.html).

1. Domain: sed -i 's#https://btcpaytz.vercel.app#https://your-real-domain#g' *.html robots.txt sitemap.xml
2. next.config.js:
   module.exports={async rewrites(){return{beforeFiles:[{source:"/",destination:"/index.html"},{source:"/app",destination:"/app.html"}]}}}
3. Backend: /api/payments/quote and /generate also receive recipientInitial and recipientSurname. Accept and store them.
4. Edit pages in build.py, run `python3 build.py`, copy output to public/.
