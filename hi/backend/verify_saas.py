import asyncio
import sys
from playwright.async_api import async_playwright

async def verify_saas_portal():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        # Login
        await page.goto("http://localhost:3000/login", wait_until="networkidle")
        await page.click("text=Kata Sandi")
        await page.fill('input[placeholder*="email" i], input[type="text"]', "admin@kayukwas.co.id")
        await page.fill('input[type="password"]', "AdminKWAS2026!")
        await page.click('button[type="submit"]')
        await page.wait_for_url("**/dashboard**", timeout=10000)

        # Verify Tenants SaaS Portal
        await page.goto("http://localhost:3000/dashboard/tenants", wait_until="networkidle")
        assert await page.is_visible("text=Multi-Tenant SaaS Management")
        assert await page.is_visible("text=Onboard Perusahaan Klien Baru")
        print("✓ SaaS Tenant Management Page Verified OK")

        await browser.close()
        return True

asyncio.run(verify_saas_portal())
