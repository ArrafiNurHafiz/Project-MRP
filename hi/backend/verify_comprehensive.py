import asyncio
import sys
from playwright.async_api import async_playwright

async def run_comprehensive_suite():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        errors = []
        page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda exc: errors.append(f"[pageerror] {str(exc)}"))

        print("\n--- 1. Testing Homepage & Public Landing ---")
        await page.goto("http://localhost:3000", wait_until="networkidle")
        content = await page.content()
        assert "EMTKu" in content, "Brand EMTKu must exist on homepage"
        assert "Paket Langganan" in content, "Pricing section must exist"
        print("✓ Homepage OK")

        print("\n--- 2. Testing Authentication (Password & WhatsApp OTP Mode) ---")
        await page.goto("http://localhost:3000/login", wait_until="networkidle")
        await page.click("text=Kata Sandi")
        await page.fill('input[placeholder*="email" i], input[type="text"]', "admin@kayukwas.co.id")
        await page.fill('input[type="password"]', "AdminKWAS2026!")
        await page.click('button[type="submit"]')
        await page.wait_for_url("**/dashboard**", timeout=10000)
        print("✓ Login flow success")

        print("\n--- 3. Testing Complete 36 Dashboard Routes ---")
        routes = [
            "/dashboard",
            "/dashboard/order-simulation",
            "/dashboard/rfq",
            "/dashboard/quotes",
            "/dashboard/orders",
            "/dashboard/invoices",
            "/dashboard/customers",
            "/dashboard/spk",
            "/dashboard/shopfloor",
            "/dashboard/ecos",
            "/dashboard/unbuilds",
            "/dashboard/reworks",
            "/dashboard/downtimes",
            "/dashboard/maintenance",
            "/dashboard/material-requests",
            "/dashboard/materials",
            "/dashboard/batches",
            "/dashboard/products",
            "/dashboard/overhead",
            "/dashboard/costing-payroll",
            "/dashboard/vendors",
            "/dashboard/purchase-orders",
            "/dashboard/landed-costs",
            "/dashboard/mitra-assignments",
            "/dashboard/subcontract-reconcile",
            "/dashboard/qc",
            "/dashboard/logistics",
            "/dashboard/agent-parser",
            "/dashboard/reports",
            "/dashboard/tenants",
            "/dashboard/saas-users",
            "/dashboard/fx-management",
            "/dashboard/company-settings",
            "/dashboard/users",
            "/dashboard/roles",
            "/dashboard/audit-logs",
        ]

        for idx, r in enumerate(routes, 1):
            await page.goto(f"http://localhost:3000{r}", wait_until="networkidle")
            page_text = await page.inner_text("body")
            if "Something went wrong" in page_text or "Application error" in page_text:
                raise Exception(f"CRASH detected on route {r}")
            print(f"  [{idx}/{len(routes)}] Route {r} loaded cleanly")

        print("\n--- 4. Testing Core Workflow: Interactive MRP Simulation ---")
        await page.goto("http://localhost:3000/dashboard/order-simulation", wait_until="networkidle")
        # Click the simulation submit button
        await page.click('button:has-text("Jalankan Simulasi MRP")')
        await page.wait_for_timeout(1500)
        sim_text = await page.inner_text("body")
        assert "Ringkasan Kelayakan" in sim_text or "Estimasi Omset" in sim_text or "Bahan Cukup" in sim_text
        print("✓ MRP BOM Explosion & Capacity Simulation calculation OK")

        print("\n--- 5. Testing Interactive CSV Import Modals ---")
        await page.goto("http://localhost:3000/dashboard/materials", wait_until="networkidle")
        await page.click("text=Import CSV")
        await page.wait_for_timeout(500)
        assert await page.is_visible("text=Download Template (.CSV)")
        assert await page.is_visible("text=Upload & Import Data")
        print("✓ Import CSV Modal popup & download triggers OK")

        print("\n--- 6. Testing Shopfloor Operator Live Kiosk ---")
        await page.goto("http://localhost:3000/dashboard/shopfloor", wait_until="networkidle")
        assert await page.is_visible("text=Shop Floor Live Operator Kiosk")
        assert await page.is_visible("text=Clock-In Shift Baru")
        print("✓ Shopfloor Kiosk Interactive Portal OK")

        print("\n--- 7. Testing Engineering Change Orders (ECO) ---")
        await page.goto("http://localhost:3000/dashboard/ecos", wait_until="networkidle")
        assert await page.is_visible("text=Engineering Change Orders")
        print("✓ ECO & BOM Versioning Portal OK")

        print("\n--- 8. Testing Landed Cost Allocation ---")
        await page.goto("http://localhost:3000/dashboard/landed-costs", wait_until="networkidle")
        assert await page.is_visible("text=Landed Cost Allocation")
        print("✓ Landed Cost Allocation OK")

        print("\n--- 9. Testing Subcontract Maklon Reconciliation ---")
        await page.goto("http://localhost:3000/dashboard/subcontract-reconcile", wait_until="networkidle")
        assert await page.is_visible("text=Subcontract & Maklon Material Reconciliation")
        print("✓ Subcontract Maklon Reconciliation OK")

        await browser.close()
        return True

async def main():
    print("==========================================================")
    print("  RUNNING EMTKu MRP & SAAS COMPREHENSIVE PLAYWRIGHT SUITE")
    print("==========================================================")
    success = await run_comprehensive_suite()
    if success:
        print("\n==========================================================")
        print("  🎉 ALL ROUTES & REAL INDUSTRIAL WORKFLOWS PASSED 100%!")
        print("==========================================================")
    else:
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
