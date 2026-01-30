import os
from playwright.sync_api import sync_playwright

def verify_autopilot_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        
        page = context.new_page()
        
        try:
            print("Navigating to app...")
            page.goto("http://localhost:5173", timeout=30000)
            
            print("Injecting Admin User...")
            page.evaluate("""
                localStorage.setItem('nst_current_user', JSON.stringify({
                    id: 'admin1',
                    name: 'Admin User',
                    role: 'ADMIN',
                    email: 'admin@test.com',
                    credits: 1000,
                    createdAt: new Date().toISOString()
                }));
            """)
            
            print("Reloading...")
            page.reload()
            
            print("Waiting for Admin Console...")
            # It might take time for the dashboard to render
            page.wait_for_selector("text=Admin Console", timeout=30000)
            
            print("Navigating to App Modes...")
            # Look for the card with label "App Modes"
            page.click("text=App Modes")
            
            print("Waiting for AI Auto-Pilot section...")
            page.wait_for_selector("text=AI Auto-Pilot", timeout=10000)
            
            print("Success! Taking screenshot...")
            page.screenshot(path="verification/autopilot_ui.png")
            
        except Exception as e:
            print(f"Verification failed: {e}")
            try:
                page.screenshot(path="verification/error.png")
            except:
                pass
        finally:
            browser.close()

if __name__ == "__main__":
    os.makedirs("verification", exist_ok=True)
    verify_autopilot_ui()
