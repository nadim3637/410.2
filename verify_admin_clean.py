import json
import datetime
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1280, "height": 720})
    page = context.new_page()

    admin_user = {
        "id": "admin-1",
        "name": "Super Admin",
        "role": "ADMIN",
        "isPremium": True
    }

    page.goto("http://localhost:5000")
    
    # Inject user AND suppress popups
    today = datetime.date.today().strftime("%a %b %d %Y") # JS toDateString format approx
    # Actually, JS toDateString is "Wed Jan 22 2025"
    # Python ctime() might work or just set it via JS
    
    page.evaluate(f"""
        localStorage.setItem('nst_current_user', '{json.dumps(admin_user)}');
        localStorage.setItem('nst_last_daily_tracker_date', new Date().toDateString());
        localStorage.setItem('nst_last_daily_challenge_date', new Date().toDateString());
        localStorage.setItem('nst_has_seen_welcome', 'true');
    """)
    
    page.reload()
    page.wait_for_timeout(3000)
    
    # Check for Admin Panel button if in Student View
    if page.get_by_text("Admin Panel").is_visible():
        page.get_by_text("Admin Panel").click()
        page.wait_for_timeout(2000)

    # 1. CBSE View
    page.screenshot(path="clean_admin_cbse.png")
    
    # 2. Switch to BSEB
    page.get_by_role("button", name="BSEB").click()
    page.wait_for_timeout(1000)
    page.screenshot(path="clean_admin_bseb.png")

    # 3. AI Notes Manager & Sync
    try:
        # Find the card "AI Notes Manager" (It might be inside "AI Studio" or separate?
        # In AdminDashboard, I added a card: label="AI Notes Manager"
        # The DashboardCard component renders the label.
        page.get_by_text("AI Notes Manager").click()
        page.wait_for_timeout(2000)
        
        # Check for Sync Button
        # Text: "Check Status"
        page.screenshot(path="clean_ai_manager.png")
    except Exception as e:
        print(f"AI Manager Nav Error: {e}")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
