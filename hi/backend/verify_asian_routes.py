import asyncio
import sys
from playwright.async_api import async_playwright

async def verify_asian_mrp_routes():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        # 1. Login
        await page.goto("http://localhost:3000/login", wait_until="networkidle")
        await page.click("text=Kata Sandi")
        await page.fill('input[placeholder*="email" i], input[type="text"]', "admin@kayukwas.co.id")
        await page.fill('input[type="password"]', "AdminKWAS2026!")
        await page.click('button[type="submit"]')
        await page.wait_for_url("**/dashboard**", timeout=10000)
        print("✓ Login flow success")

        # 2. Test the 3 new Asian MRP Enterprise Routes
        new_routes = [
            "/dashboard/landed-costs",
            "/dashboard/subcontract-reconcile",
            "/dashboard/overhead",
        ]

        for r in new_routes:
            await page.goto(f"http://localhost:3000{r}", wait_until="networkidle")
            c = await page.content()
            if "Something went wrong" in c or "Application error" in c:
                raise Exception(f"Error on route: {r}")
            print(f"✓ Route {r} loaded cleanly")

        await browser.close()
        print("\nALL NEW ASIAN MRP ENTERPRISE EXTENSIONS VERIFIED 100% HEALTHY!")
        return True

asyncio.run(verify_asian_mrp_routes())
