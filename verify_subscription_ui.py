
from playwright.sync_api import sync_playwright
import time

def test_subscription_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        admin_user = {
            "id": "admin-1",
            "name": "Super Admin",
            "email": "admin@example.com",
            "role": "ADMIN",
            "isPremium": True
        }
        
        page.goto("http://localhost:5000")
        
        page.evaluate(f"""
            localStorage.setItem('nst_current_user', '{str(admin_user).replace("'", '"').replace("True", "true")}');
            localStorage.setItem('nst_view_state', 'ADMIN_DASHBOARD');
            localStorage.setItem('nst_terms_accepted', 'true'); 
        """)
        
        dummy_users = [
            {
                "id": "user-1",
                "name": "Test Student",
                "email": "student@example.com",
                "role": "STUDENT",
                "credits": 100
            }
        ]
        page.evaluate(f"""
            localStorage.setItem('nst_users', '{str(dummy_users).replace("'", '"')}');
        """)

        page.reload()
        
        # Wait for page content
        time.sleep(5)

        # Handle "Resume Learning" (Splash Screen)
        if page.is_visible("text=Resume Learning"):
            print("Closing Splash Screen")
            page.click("text=Resume Learning")
            time.sleep(2)

        # Handle T&C
        if page.is_visible("text=Terms & Conditions"):
            print("Closing T&C")
            page.click("text=I Agree & Continue")
            time.sleep(2)
            
        # Handle Daily Login Bonus
        if page.is_visible("text=Task Completed!"):
            print("Closing Daily Bonus")
            if page.is_visible("text=CLAIM NOW"):
                page.click("text=CLAIM NOW")
            time.sleep(2)

        # DEBUG: After Overlay Handling
        page.screenshot(path="/home/jules/verification/step2_clean.png")

        # Click Subscriptions
        print("Clicking Subscriptions")
        # Use a more specific selector if possible, but force=True should help
        page.click("button:has-text('Subscriptions')", force=True)
        
        print("Waiting for user")
        try:
            page.wait_for_selector("text=Test Student", timeout=10000)
        except:
             print("Test Student not found. Taking screenshot.")
             page.screenshot(path="/home/jules/verification/step3_fail.png")
             raise

        print("Clicking Manage Subscription")
        page.click("button:has-text('Manage Subscription')", force=True)
        
        page.wait_for_selector("text=Grant Subscription")
        
        # Verify Fixed Plans is default
        page.wait_for_selector("text=Fixed Plans")
        
        print("Clicking Custom Duration")
        page.click("text=Custom Duration", force=True)
        
        # Verify Custom UI
        page.wait_for_selector("text=Plan Type: CUSTOMIZED")
        page.wait_for_selector("text=Days")
        page.wait_for_selector("text=Hours")
        
        page.screenshot(path="/home/jules/verification/subscription_custom_ui.png")
        print("Screenshot saved to /home/jules/verification/subscription_custom_ui.png")
        
        browser.close()

if __name__ == "__main__":
    test_subscription_ui()
