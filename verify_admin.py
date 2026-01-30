import json
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1280, "height": 720})
    page = context.new_page()

    # Mock Admin User
    admin_user = {
        "id": "admin-1",
        "name": "Super Admin",
        "role": "ADMIN",
        "isPremium": True
    }

    # Navigate to app
    page.goto("http://localhost:5000")
    
    # Inject user into localStorage
    page.evaluate(f"localStorage.setItem('nst_current_user', '{json.dumps(admin_user)}')")
    
    # Reload to pick up user
    page.reload()
    
    # Wait for load
    page.wait_for_timeout(5000)
    
    # Take screenshot of Initial View
    page.screenshot(path="verification_initial.png")
    
    # Look for "Admin Panel" button
    try:
        # Use a more specific locator if possible, or try click
        if page.get_by_text("Admin Panel").is_visible():
            print("Clicking Admin Panel button...")
            page.get_by_text("Admin Panel").click()
            page.wait_for_timeout(3000)
        else:
            print("Admin Panel button not visible.")
    except Exception as e:
        print(f"Error finding Admin Panel: {e}")

    # Take screenshot of Admin Dashboard (CBSE Default)
    page.screenshot(path="verification_admin_cbse.png")
    
    # Click BSEB Switcher
    try:
        print("Switching to BSEB...")
        page.get_by_role("button", name="BSEB", exact=True).click()
        page.wait_for_timeout(2000)
    except Exception as e:
         print(f"Error switching board: {e}")
    
    # Take screenshot of Admin Dashboard (BSEB)
    page.screenshot(path="verification_admin_bseb.png")

    # Go to AI Notes Manager
    try:
        print("Navigating to AI Notes Manager...")
        page.get_by_text("AI Notes Manager").click()
        page.wait_for_timeout(2000)
        # Take screenshot of AI Manager
        page.screenshot(path="verification_ai_manager.png")
    except Exception as e:
        print(f"Error navigating to AI Manager: {e}")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
